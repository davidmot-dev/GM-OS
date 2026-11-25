import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from 'vitest';
import fs from 'fs-extra';

const dirs = vi.hoisted(() => {
    const nodeFs = require('node:fs') as typeof import('node:fs');
    const nodePath = require('node:path') as typeof import('node:path');
    const nodeOs = require('node:os') as typeof import('node:os');
    return { userData: nodeFs.mkdtempSync(nodePath.join(nodeOs.tmpdir(), 'gmos-syncserver-verrou-')) };
});

vi.mock('electron', () => ({
    app: { getPath: () => dirs.userData },
    ipcMain: { on: vi.fn(), handle: vi.fn() },
    BrowserWindow: class {},
}));

const { SyncServer } = await import('./SyncServer');
const { pairingManager } = await import('./PairingManager');
const { verrouDuMeneur } = await import('./verrouDuMeneur');

/**
 * **Le verrou de la tablette de la table, au serveur** (§ 256, T14, 24/11/2026). Le code juste rend
 * le secret d'appairage ; un code faux ne rend rien, compte un essai, et la troisième erreur fait
 * attendre. Le code ne repart jamais vers la tablette.
 */
const fenetre = { isDestroyed: () => false, webContents: { send: vi.fn() } } as unknown as import('electron').BrowserWindow;
let server: InstanceType<typeof SyncServer>;

beforeAll(() => { server = new SyncServer(fenetre, 0, dirs.userData); });
beforeEach(() => verrouDuMeneur.regler(null));
afterAll(() => fs.removeSync(dirs.userData));

let adresse = 0;
const socket = () => ({ send: vi.fn<(m: string) => void>(), remoteAddress: `192.168.1.${++adresse}` });
const envoyer = (ws: ReturnType<typeof socket>, type: string, payload?: unknown) =>
    (server as unknown as { repondreAuVerrou: (ws: unknown, d: unknown) => void }).repondreAuVerrou(ws, { type, payload });
const derniere = (ws: ReturnType<typeof socket>) => JSON.parse(ws.send.mock.calls.at(-1)![0]) as { type: string; payload: Record<string, unknown> };

describe('verrou:etat et verrou:ouvrir', () => {
    it('sans code réglé : l’état le dit, et rien ne s’ouvre', () => {
        const ws = socket();
        envoyer(ws, 'verrou:etat');
        expect(derniere(ws)).toEqual({ type: 'verrou:etat', payload: { codeRegle: false } });
        envoyer(ws, 'verrou:ouvrir', { code: '0000' });
        expect(derniere(ws).payload).toEqual({ ok: false, raison: 'aucun-code' });
    });

    it('le bon code rend le secret d’appairage, jamais le code', () => {
        verrouDuMeneur.regler('4821');
        const ws = socket();
        envoyer(ws, 'verrou:ouvrir', { code: '4821' });
        expect(derniere(ws).payload).toEqual({ ok: true, token: pairingManager.getSecret() });
        expect(ws.send.mock.calls.flat().join('')).not.toContain('4821');
    });

    it('trois codes faux depuis la même adresse : la porte se ferme, même au bon code', () => {
        verrouDuMeneur.regler('4821');
        const ws = socket();
        envoyer(ws, 'verrou:ouvrir', { code: '1111' });
        expect(derniere(ws).payload).toEqual({ ok: false, raison: 'faux', restants: 2 });
        envoyer(ws, 'verrou:ouvrir', { code: '2222' });
        envoyer(ws, 'verrou:ouvrir', { code: '3333' });
        expect(derniere(ws).payload).toMatchObject({ ok: false, raison: 'bloque' });
        envoyer(ws, 'verrou:ouvrir', { code: '4821' });
        expect(derniere(ws).payload).toMatchObject({ ok: false, raison: 'bloque' });
        expect(JSON.stringify(ws.send.mock.calls)).not.toContain(pairingManager.getSecret());
        // Une autre adresse n'est pas punie pour celle-là.
        const autre = socket();
        envoyer(autre, 'verrou:ouvrir', { code: '4821' });
        expect(derniere(autre).payload.ok).toBe(true);
    });
});
