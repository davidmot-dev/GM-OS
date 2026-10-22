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
const reprises = new Map<string, string>();
const fenetre = { isDestroyed: () => false, webContents: { send: versLeMJ } };

// Façade d'essai des points d'entrée privés, sans changer leur visibilité en production.
interface RelaisTeste {
    handleConnection: (socket: SocketFictif) => void;
    broadcastAction: (message: unknown, sender?: SocketFictif, role?: string) => void;
    acheminerLeMessage: (envoi: unknown, message: { fromId: string; toId?: string }, sender?: SocketFictif) => void;
    rendreLeFil: (deviceId: unknown, messages: unknown) => void;
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
        deviceId, pseudo: 'Test', role, characterId, token: 'secret-artificiel', repriseModules: reprises.get(deviceId),
    } }, socket);
    for (const [brut] of socket.send.mock.calls) {
        const message = JSON.parse(brut);
        if (message.type === 'remote:registered') reprises.set(deviceId, message.payload.repriseModules);
    }
    socket.send.mockClear();
    versLeMJ.mockClear();
}

beforeEach(() => {
    reprises.clear();
    sessionManager.clearAll();
    versLeMJ.mockClear();
    serveur = new SyncServer(fenetre as unknown as import('electron').BrowserWindow, 0, '', { lire: async () => null, ecrire: async () => {} }) as unknown as RelaisTeste;
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

    /*
      ⛔ **Acheminé, plus diffusé** (2026-10-12). Avant, le relais partait vers
      toutes les sockets — Carl recevait ce qu'Alice disait à Bob — et le
      message de joueur à joueur n'atteignait jamais le meneur, qui ne pouvait
      donc pas le rendre à une tablette rechargée.
    */
    describe('l’acheminement d’un message de séance', () => {
        const brancher = (deviceId: string, role: ClientRole, characterId?: string) => {
            const socket = new SocketFictif();
            serveur.wss.clients.add(socket);
            serveur.handleConnection(socket);
            inscrire(socket, deviceId, role, characterId);
            return socket;
        };

        it.each([
            { toId: 'perso-b', bob: true, carl: false, mj: false },
            { toId: 'all', bob: true, carl: true, mj: true },
            { toId: 'GM', bob: false, carl: false, mj: true },
        ])('remet le message destiné à $toId à ses seuls lecteurs', ({ toId, bob, carl, mj }) => {
            inscrire(emetteur, 'joueur-a', 'hub', 'perso-a');
            const tabletteDeBob = brancher('joueur-b', 'hub', 'perso-b');
            const tabletteDeCarl = brancher('joueur-c', 'hub', 'perso-c');
            const tabletteDuMeneur = brancher('tablette-mj', 'remote');
            const action = { type: 'session:send-message', payload: {
                fromId: 'perso-a', toId, text: 'Bonjour', extension: { conservee: true },
            }, correlation: 'message-42' };

            recevoir(action);

            const recu = [[JSON.stringify({ ...action, type: 'session:receive-message' })]];
            expect(tabletteDeBob.send.mock.calls).toEqual(bob ? recu : []);
            expect(tabletteDeCarl.send.mock.calls, 'Carl reçoit un message qui ne le concerne pas').toEqual(carl ? recu : []);
            expect(tabletteDuMeneur.send.mock.calls).toEqual(mj ? recu : []);
            expect(emetteur.send).not.toHaveBeenCalled();
            // Une socket qui ne s'est pas inscrite n'a ni rôle ni personnage.
            expect(destinataire.send).not.toHaveBeenCalled();
            // Le meneur reçoit TOUT, pour le garder — même ce qu'il ne montre pas.
            expect(versLeMJ.mock.calls).toEqual([['remote:action', action]]);
        });

        /*
          M3 (2026-10-12) : une tablette rechargée repartait d'un fil vide. Le
          serveur demande son fil au meneur à chaque inscription d'un joueur —
          la tablette du meneur reçoit le sien dans l'état complet.
        */
        it('demande au meneur le fil d’une tablette de joueur qui s’inscrit, pas celui du meneur', () => {
            const socketJoueur = new SocketFictif();
            serveur.handleConnection(socketJoueur);
            recevoir({ type: 'remote:register', payload: {
                deviceId: 'joueur-b', pseudo: 'Bob', role: 'hub', characterId: 'perso-b',
            } }, socketJoueur);
            expect(versLeMJ).toHaveBeenCalledWith('remote:demande-du-fil',
                { deviceId: 'joueur-b', role: 'hub', characterId: 'perso-b' });

            versLeMJ.mockClear();
            const socketMeneur = new SocketFictif();
            serveur.handleConnection(socketMeneur);
            recevoir({ type: 'remote:register', payload: {
                deviceId: 'tablette-mj', pseudo: 'MJ', role: 'remote', token: 'secret-artificiel',
            } }, socketMeneur);
            expect(versLeMJ.mock.calls.some(([canal]) => canal === 'remote:demande-du-fil')).toBe(false);
        });

        it('rend son fil à UN appareil, et refiltre ce que le meneur lui envoie', () => {
            const tabletteDeBob = brancher('joueur-b', 'hub', 'perso-b');
            const tabletteDeCarl = brancher('joueur-c', 'hub', 'perso-c');
            const fil = [
                { id: 'm1', fromId: 'GM', toId: 'perso-b' },
                { id: 'm2', fromId: 'perso-a', toId: 'perso-c' },
                { id: 'm3', fromId: 'perso-c', toId: 'all' },
            ];

            serveur.rendreLeFil('joueur-b', fil);

            expect(tabletteDeBob.send).toHaveBeenCalledExactlyOnceWith(JSON.stringify({
                type: 'session:fil-de-messages', payload: [fil[0], fil[2]],
            }));
            expect(tabletteDeCarl.send, 'le fil de Bob part chez Carl').not.toHaveBeenCalled();
        });

        it('ignore un fil pour un appareil inconnu ou une charge qui n’est pas une liste', () => {
            const tabletteDeBob = brancher('joueur-b', 'hub', 'perso-b');
            serveur.rendreLeFil('inconnu', []);
            serveur.rendreLeFil('joueur-b', 'pas une liste');
            expect(tabletteDeBob.send).not.toHaveBeenCalled();
        });

        it('remet un message privé du meneur à son seul destinataire', () => {
            const tabletteDAlice = brancher('joueur-a2', 'hub', 'perso-a');
            const tabletteDeBob = brancher('joueur-b', 'hub', 'perso-b');
            const message = { fromId: 'GM', toId: 'perso-a', content: 'Tu entends un bruit.' };

            serveur.acheminerLeMessage({ type: 'session:receive-message', payload: message }, message);

            expect(tabletteDAlice.send).toHaveBeenCalledTimes(1);
            expect(tabletteDeBob.send, 'Bob reçoit ce que le meneur dit à Alice').not.toHaveBeenCalled();
        });
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

    /*
      **Le combat partait sans rôle, donc sans filtre** (S1 de l'audit du
      2026-10-22) : les secrets des combattants arrivaient sur la tablette d'un
      joueur. Le serveur caviarde désormais toute synchronisation vers un joueur,
      quel que soit le rôle visé à l'émission.
    */
    it('caviarde toute synchronisation vers un joueur, même diffusée sans rôle', () => {
        emetteur.role = 'remote';
        destinataire.role = 'player';
        const mj = new SocketFictif();
        mj.role = 'remote';
        serveur.wss.clients.add(mj);
        const action = { type: 'sync', payload: { combat: { combatants: [{ id: 'k', gmSecretInfo: 'SECRET-COMBATTANT' }] } } };
        serveur.broadcastAction(action, emetteur);
        expect(destinataire.send).toHaveBeenCalledOnce();
        expect(String(destinataire.send.mock.calls[0][0])).not.toContain('SECRET-COMBATTANT');
        expect(String(mj.send.mock.calls[0][0])).toContain('SECRET-COMBATTANT');
    });
});
