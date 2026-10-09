import { EventEmitter } from 'node:events';
import { WebSocket } from 'ws';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ClientRole } from './SyncServer';

// Aucun serveur ouvert, secret persistant ou journal réel : seuls les sockets sont simulés.
vi.mock('electron', () => ({ ipcMain: { on: vi.fn(), handle: vi.fn() }, BrowserWindow: class {} }));
vi.mock('./PairingManager', () => ({ pairingManager: { verify: (token: unknown) => token === 'secret-artificiel' } }));
vi.mock('./auditLog', () => ({ auditDenied: vi.fn(), auditNotice: vi.fn() }));

const { SyncServer } = await import('./SyncServer');
const { sessionManager } = await import('./SessionManager');

class SocketFictif extends EventEmitter {
    send = vi.fn<(message: string) => void>();
    readyState: number = WebSocket.OPEN;
    _socket?: { remoteAddress?: string } = { remoteAddress: '192.0.2.42' };
    remoteAddress?: string;
    deviceId?: string;
    role?: ClientRole;
}

const versLeMJ = vi.fn();
const fenetre = { isDestroyed: () => false, webContents: { send: versLeMJ } };

// Façade d'essai des points d'entrée privés, sans changer leur visibilité en production.
interface RelaisTeste {
    handleConnection: (socket: SocketFictif) => void;
    broadcastAction: (message: unknown, sender?: SocketFictif, role?: string) => void;
    wss: { clients: Set<SocketFictif> };
}

let serveur: RelaisTeste;
let emetteur: SocketFictif;
let destinataire: SocketFictif;

function recevoir(message: unknown, socket = emetteur) {
    socket.emit('message', JSON.stringify(message));
}

function inscrire(socket: SocketFictif, deviceId: string, role: ClientRole, characterId?: string) {
    recevoir({ type: 'remote:register', payload: {
        deviceId, pseudo: 'Test', role, characterId, token: 'secret-artificiel',
    } }, socket);
    socket.send.mockClear();
    versLeMJ.mockClear();
}

beforeEach(() => {
    sessionManager.clearAll();
    versLeMJ.mockClear();
    serveur = new SyncServer(fenetre as unknown as import('electron').BrowserWindow, 0, '') as unknown as RelaisTeste;
    emetteur = new SocketFictif();
    destinataire = new SocketFictif();
    serveur.wss = { clients: new Set([emetteur, destinataire]) };
    serveur.handleConnection(emetteur);
    versLeMJ.mockClear();
});

afterEach(() => {
    vi.restoreAllMocks();
    sessionManager.clearAll();
});

describe('SyncServer — messages reçus et relais', () => {
    it('transmet au registre l’adresse du transport', () => {
        const socket = new SocketFictif();
        serveur.handleConnection(socket);
        inscrire(socket, 'tablette', 'hub');
        expect(sessionManager.getClient('tablette')?.ip).toBe('192.0.2.42');
    });

    // § 130 : demandé à la connexion, l'état complet partait avant que le rôle
    // existe, et la diffusion par rôle ne l'adressait à personne.
    it('ne demande la synchronisation initiale qu’une fois le rôle attribué', () => {
        const socket = new SocketFictif();
        serveur.handleConnection(socket);
        expect(versLeMJ).not.toHaveBeenCalledWith('remote:request-sync');
        recevoir({ type: 'remote:register', payload: {
            deviceId: 'tablette-mj', pseudo: 'MJ', role: 'remote', token: 'secret-artificiel',
        } }, socket);
        expect(socket.role).toBe('remote');
        expect(versLeMJ.mock.calls.filter(([canal]) => canal === 'remote:request-sync')).toHaveLength(1);
    });

    it('ne demande pas d’état pour une inscription refusée (personnage déjà pris)', () => {
        inscrire(emetteur, 'joueur-a', 'hub', 'perso-a');
        serveur.handleConnection(destinataire);
        recevoir({ type: 'remote:register', payload: {
            deviceId: 'joueur-b', pseudo: 'Test', role: 'hub', characterId: 'perso-a',
        } }, destinataire);
        expect(destinataire.send.mock.calls.some(([brut]) => brut.includes('character_taken'))).toBe(true);
        expect(versLeMJ).not.toHaveBeenCalledWith('remote:request-sync');
    });

    it.each([null, 'texte', [1, { libre: true }], { libre: { valeurs: [1, 2] } }])(
        'conserve une charge opaque et les champs supplémentaires (%j)', payload => {
            inscrire(emetteur, 'mj', 'remote');
            const action = { type: 'whiteboard:clear', payload, correlation: 'garder-ce-champ' };
            recevoir(action);
            expect(versLeMJ.mock.calls).toEqual([['remote:action', action]]);
            expect(destinataire.send).not.toHaveBeenCalled();
        },
    );

    it.each(['perso-b', 'all', 'GM'])('route le message destiné à %s', toId => {
        inscrire(emetteur, 'joueur-a', 'hub', 'perso-a');
        const action = { type: 'session:send-message', payload: {
            fromId: 'perso-a', toId, text: 'Bonjour', extension: { conservee: true },
        }, correlation: 'message-42' };
        recevoir(action);
        expect(emetteur.send).not.toHaveBeenCalled();
        if (toId === 'GM') {
            expect(destinataire.send).not.toHaveBeenCalled();
        } else {
            expect(destinataire.send.mock.calls).toEqual([
                [JSON.stringify({ ...action, type: 'session:receive-message' })],
            ]);
        }
        expect(versLeMJ.mock.calls).toEqual(toId === 'perso-b' ? [] : [['remote:action', action]]);
    });

    it.each([
        { type: 'whiteboard:clear', payload: {} },
        { type: 'session:send-message', payload: { fromId: 'perso-usurpe', toId: 'perso-b' } },
    ])('refuse le message avant toute rediffusion (%j)', action => {
        inscrire(emetteur, 'joueur-a', 'hub', 'perso-a');
        recevoir(action);
        expect(versLeMJ).not.toHaveBeenCalled();
        expect(destinataire.send).not.toHaveBeenCalled();
        expect(emetteur.send).not.toHaveBeenCalled();
    });

    it('renvoie le ping avec sa charge sans le transmettre au MJ', () => {
        recevoir({ type: 'remote:ping', payload: { compteur: 17 } });
        expect(emetteur.send).toHaveBeenCalledWith(JSON.stringify({ type: 'remote:pong', payload: { compteur: 17 } }));
        expect(versLeMJ).not.toHaveBeenCalled();
    });

    it('isole un JSON invalide puis traite le message suivant', () => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
        emetteur.emit('message', '{');
        recevoir({ type: 'remote:ping', payload: 17 });
        expect(emetteur.send).toHaveBeenCalledExactlyOnceWith(JSON.stringify({ type: 'remote:pong', payload: 17 }));
        expect(versLeMJ).not.toHaveBeenCalled();
    });

    it('garde le client actif tant qu’un de ses sockets reste connecté', () => {
        inscrire(emetteur, 'tablette', 'hub', 'perso-a');
        const second = new SocketFictif();
        serveur.handleConnection(second);
        inscrire(second, 'tablette', 'hub', 'perso-a');
        emetteur.emit('close');
        expect(sessionManager.getClient('tablette')?.status).toBe('active');
        second.emit('close');
        expect(sessionManager.getClient('tablette')?.status).toBe('ghost');
    });

    it('signale un personnage déjà occupé, y compris pour une exception structurée', () => {
        vi.spyOn(sessionManager, 'registerClient').mockImplementation(() => { throw { message: 'character_taken' }; });
        recevoir({ type: 'remote:register', payload: { deviceId: 'tablette', role: 'hub' } });
        expect(emetteur.send).toHaveBeenCalledExactlyOnceWith(JSON.stringify({
            type: 'remote:error', payload: {
                code: 'character_taken', message: 'Signature biométrique déjà active sur un autre terminal.',
            },
        }));
    });

    it('diffuse uniquement aux sockets ouverts du rôle demandé et exclut l’émetteur', () => {
        emetteur.role = 'hub';
        destinataire.role = 'hub';
        const mj = new SocketFictif();
        mj.role = 'remote';
        const ferme = new SocketFictif();
        ferme.role = 'hub';
        ferme.readyState = WebSocket.CLOSED;
        serveur.wss.clients.add(mj).add(ferme);
        const action = { type: 'sync', payload: { valeur: 'publique' } };
        serveur.broadcastAction(action, emetteur, 'hub');
        expect(destinataire.send).toHaveBeenCalledExactlyOnceWith(JSON.stringify(action));
        expect(emetteur.send).not.toHaveBeenCalled();
        expect(mj.send).not.toHaveBeenCalled();
        expect(ferme.send).not.toHaveBeenCalled();
    });
});
