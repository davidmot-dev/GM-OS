import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from 'vitest';
import fs from 'fs-extra';

const dirs = vi.hoisted(() => {
    const nodeFs = require('node:fs') as typeof import('node:fs');
    const nodePath = require('node:path') as typeof import('node:path');
    const nodeOs = require('node:os') as typeof import('node:os');
    return { userData: nodeFs.mkdtempSync(nodePath.join(nodeOs.tmpdir(), 'gmos-syncserver-')) };
});

vi.mock('electron', () => ({
    app: { getPath: () => dirs.userData },
    ipcMain: { on: vi.fn(), handle: vi.fn() },
    BrowserWindow: class {},
}));

const { SyncServer } = await import('./SyncServer');
const { pairingManager } = await import('./PairingManager');
const { sessionManager } = await import('./SessionManager');

/** Fenêtre principale factice : handleRegister pousse la liste des clients dessus. */
const fakeWindow = {
    isDestroyed: () => false,
    webContents: { send: vi.fn() },
} as unknown as import('electron').BrowserWindow;

let server: InstanceType<typeof SyncServer>;
let secret: string;

beforeAll(() => {
    server = new SyncServer(fakeWindow, 0, dirs.userData);
    secret = pairingManager.getSecret();
});

afterAll(() => {
    fs.removeSync(dirs.userData);
});

interface FakeSocket {
    send: ReturnType<typeof vi.fn>;
    remoteAddress: string;
    role?: string;
    deviceId?: string;
}

const makeSocket = (): FakeSocket => ({ send: vi.fn(), remoteAddress: '192.168.1.99' });

/** handleRegister est privée : c'est le point d'entrée réel de l'attaque. */
const register = (ws: FakeSocket, payload: Record<string, unknown>) => {
    (server as unknown as { handleRegister: (ws: unknown, p: unknown) => void }).handleRegister(ws, payload);
};

/** Messages `remote:error` émis vers ce socket. */
const errorsSentTo = (ws: FakeSocket): any[] =>
    ws.send.mock.calls
        .map(([raw]) => JSON.parse(raw as string))
        .filter(msg => msg.type === 'remote:error');

describe('handleRegister — rôles privilégiés', () => {
    it('refuse le rôle gm sans token et rétrograde en player', () => {
        const ws = makeSocket();
        register(ws, { deviceId: 'attacker-1', pseudo: 'Pirate', role: 'gm' });

        expect(ws.role).toBe('player');
        expect(errorsSentTo(ws)[0]?.payload?.code).toBe('pairing_required');
    });

    it('refuse le rôle remote sans token', () => {
        const ws = makeSocket();
        register(ws, { deviceId: 'attacker-2', pseudo: 'Pirate', role: 'remote' });

        expect(ws.role).toBe('player');
    });

    it('refuse un token invalide', () => {
        const ws = makeSocket();
        register(ws, { deviceId: 'attacker-3', role: 'gm', token: 'f'.repeat(64) });

        expect(ws.role).toBe('player');
    });

    it('accorde le rôle gm avec le bon token', () => {
        const ws = makeSocket();
        register(ws, { deviceId: 'gm-station', pseudo: 'MJ', role: 'gm', token: secret });

        expect(ws.role).toBe('gm');
        expect(errorsSentTo(ws)).toHaveLength(0);
    });

    it('accorde le rôle remote avec le bon token', () => {
        const ws = makeSocket();
        register(ws, { deviceId: 'gm-phone', pseudo: 'MJ', role: 'remote', token: secret });

        expect(ws.role).toBe('remote');
    });

    it('n\'enregistre pas le rôle refusé dans le registre de session', () => {
        const ws = makeSocket();
        register(ws, { deviceId: 'attacker-4', pseudo: 'Pirate', role: 'gm' });

        expect(sessionManager.getClient('attacker-4')?.role).toBe('player');
    });
});

describe('handleRegister — rôles non privilégiés', () => {
    it('laisse passer le rôle hub sans token', () => {
        const ws = makeSocket();
        register(ws, { deviceId: 'tablette-1', pseudo: 'Joueur', role: 'hub' });

        expect(ws.role).toBe('hub');
        expect(errorsSentTo(ws)).toHaveLength(0);
    });

    it('ramène un rôle inconnu sur player', () => {
        const ws = makeSocket();
        register(ws, { deviceId: 'bizarre-1', role: 'superadmin' });

        expect(ws.role).toBe('player');
    });

    it('ramène un rôle non textuel sur player', () => {
        const ws = makeSocket();
        register(ws, { deviceId: 'bizarre-2', role: { toString: () => 'gm' } });

        expect(ws.role).toBe('player');
    });

    it('attribue un deviceId de repli si le client n\'en fournit pas', () => {
        const ws = makeSocket();
        register(ws, { role: 'hub' });

        expect(ws.deviceId).toMatch(/^remote-/);
    });
});

describe('forwardToGM — autorisation', () => {
    /** forwardToGM est privée : c'est le passage obligé des actions clientes. */
    const forward = (ws: FakeSocket, data: unknown) => {
        (server as unknown as { forwardToGM: (ws: unknown, d: unknown) => void }).forwardToGM(ws, data);
    };

    /** Actions effectivement transmises au renderer MJ. */
    const forwarded = () =>
        (fakeWindow.webContents.send as any).mock.calls.filter(([channel]: any[]) => channel === 'remote:action');

    beforeEach(() => {
        (fakeWindow.webContents.send as any).mockClear();
    });

    it('transmet une action de joueur sur son propre personnage', () => {
        const ws = makeSocket();
        register(ws, { deviceId: 'tablette-alice', role: 'hub', characterId: 'perso-alice' });
        (fakeWindow.webContents.send as any).mockClear();

        forward(ws, { type: 'session:remove-inventory-item', payload: { characterId: 'perso-alice', itemId: 'i1' } });

        expect(forwarded()).toHaveLength(1);
    });

    it('bloque une action réservée aux rôles appairés', () => {
        const ws = makeSocket();
        register(ws, { deviceId: 'tablette-pirate', role: 'hub' });
        (fakeWindow.webContents.send as any).mockClear();

        forward(ws, { type: 'whiteboard:clear', payload: {} });
        forward(ws, { type: 'combat:next-turn', payload: {} });

        expect(forwarded()).toHaveLength(0);
    });

    it('bloque une action visant le personnage d\'un autre', () => {
        const ws = makeSocket();
        register(ws, { deviceId: 'tablette-bob', role: 'hub', characterId: 'perso-bob' });
        (fakeWindow.webContents.send as any).mockClear();

        forward(ws, { type: 'session:remove-inventory-item', payload: { characterId: 'perso-alice', itemId: 'i1' } });

        expect(forwarded()).toHaveLength(0);
    });

    it('ne rediffuse pas non plus un message usurpé aux autres clients', () => {
        // La branche P2P court-circuite le renderer : le contrôle doit la précéder.
        const ws = makeSocket();
        register(ws, { deviceId: 'tablette-carl', role: 'hub', characterId: 'perso-carl' });
        ws.send.mockClear();

        forward(ws, { type: 'session:send-message', payload: { fromId: 'perso-alice', toId: 'perso-bob' } });

        expect(forwarded()).toHaveLength(0);
    });

    it('transmet tout pour un rôle appairé', () => {
        const ws = makeSocket();
        register(ws, { deviceId: 'mj-remote', role: 'remote', token: pairingManager.getSecret() });
        (fakeWindow.webContents.send as any).mockClear();

        forward(ws, { type: 'whiteboard:clear', payload: {} });
        forward(ws, { type: 'session:remove-inventory-item', payload: { characterId: 'perso-de-nimporte-qui' } });

        expect(forwarded()).toHaveLength(2);
    });

    it('bloque un client qui a réclamé gm sans token', () => {
        // Le rôle a été rétrogradé à l'enregistrement : l'autorisation suit.
        const ws = makeSocket();
        register(ws, { deviceId: 'faux-mj', role: 'gm' });
        (fakeWindow.webContents.send as any).mockClear();

        forward(ws, { type: 'combat:next-turn', payload: {} });

        expect(forwarded()).toHaveLength(0);
    });
});

describe('handleRegister — après rotation du secret', () => {
    it('invalide les appareils appairés avec l\'ancien secret', () => {
        const oldSecret = pairingManager.getSecret();
        pairingManager.rotate();

        const ws = makeSocket();
        register(ws, { deviceId: 'gm-phone-stale', role: 'remote', token: oldSecret });

        expect(ws.role).toBe('player');
        expect(errorsSentTo(ws)[0]?.payload?.code).toBe('pairing_required');
    });
});
