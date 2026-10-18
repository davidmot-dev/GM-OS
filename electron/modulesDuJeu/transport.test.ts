import { EventEmitter } from 'node:events';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { ipcMain } from 'electron';
import { SyncServer } from '../SyncServer';
import { sessionManager } from '../SessionManager';
import type { ServiceDesModules } from './service';

vi.mock('electron', () => ({ ipcMain: { on: vi.fn(), handle: vi.fn() }, BrowserWindow: class {} }));
vi.mock('../PairingManager', () => ({ pairingManager: { verify: (token: unknown) => token === 'secret-mj' } }));
vi.mock('../auditLog', () => ({ auditDenied: vi.fn() }));
class Tablette extends EventEmitter {
    readyState = 1;
    _socket = { remoteAddress: '192.0.2.1' };
    deviceId?: string;
    identiteModules?: { appareilId: string; personnageId: string | null };
    send = vi.fn<(message: string) => void>();
}
interface ServeurTeste {
    wss: { clients: Set<Tablette> };
    modulesDuJeu: ServiceDesModules;
    handleConnection(ws: Tablette): void;
    registerIpcHandlers(): void;
    diffuserLesModules(): Promise<void>;
}
const fenetre = { isDestroyed: () => false, webContents: { send: vi.fn() } };
let serveur: ServeurTeste;
let alice: Tablette, bob: Tablette;
const paquets = (ws: Tablette, type: string) => ws.send.mock.calls.map(([brut]) => JSON.parse(brut)).filter(m => m.type === type);
function inscrire(ws: Tablette, deviceId: string, characterId?: string, repriseModules?: string) {
    ws.emit('message', JSON.stringify({ type: 'remote:register', payload: { deviceId, characterId, role: 'hub', repriseModules } }));
}
async function invoquer(canal: string, charge?: unknown, sender = fenetre.webContents) {
    const ecoute = vi.mocked(ipcMain.handle).mock.calls.find(([nom]) => nom === canal)?.[1];
    if (!ecoute) throw new Error('Gestionnaire absent : ' + canal);
    return ecoute({ sender } as unknown as Electron.IpcMainInvokeEvent, charge);
}
beforeEach(async () => {
    sessionManager.clearAll(); vi.clearAllMocks();
    serveur = new SyncServer(fenetre as unknown as import('electron').BrowserWindow, 0, '', { lire: async () => null, ecrire: async () => {} }) as unknown as ServeurTeste;
    alice = new Tablette(); bob = new Tablette();
    serveur.wss = { clients: new Set([alice, bob]) };
    serveur.handleConnection(alice); serveur.handleConnection(bob); serveur.registerIpcHandlers();
    await invoquer('modules:contexte', { campagneId: 'camp-a', seanceId: 'sess-a', pilote: { id: 'custom-1', name: 'Alien' }, personnages: [{ id: 'alice', nom: 'Alice' }, { id: 'bob', nom: 'Bob' }] });
});
afterEach(() => sessionManager.clearAll());
async function ouvrir() {
    const vue = await serveur.modulesDuJeu.vueMJ();
    expect(await invoquer('modules:autoriser', { campagneId: 'camp-a', moduleId: 'alien-muthur', contexte: vue.contexte, personnages: ['alice', 'bob'] })).toEqual({ ok: true });
    await serveur.diffuserLesModules();
}
async function commandeMJ(id: string, charge: unknown) {
    return invoquer('modules:commander', { requeteId: 'mj-1', campagneId: 'camp-a', moduleId: 'alien-muthur', contexte: (await serveur.modulesDuJeu.vueMJ()).contexte, commande: { id, charge } });
}
describe('transport privé des modules sans ouvrir de port', () => {
    it('ignore une socket non inscrite et refuse l’IPC d’une fenêtre secondaire', async () => {
        alice.emit('message', JSON.stringify({ type: 'modules:consulter' }));
        expect(paquets(alice, 'modules:vue')).toEqual([]);
        expect(await invoquer('modules:contexte', {}, { send: vi.fn() })).toMatchObject({ ok: false });
        await expect(invoquer('modules:lire', undefined, { send: vi.fn() })).rejects.toThrow(/MJ/);
        expect(await invoquer('modules:tout-couper', {}, { send: vi.fn() })).toMatchObject({ ok: false });
        expect(await invoquer('modules:acquitter-fiche', {}, { send: vi.fn() })).toMatchObject({ ok: false });
    });
    it('ne transmet jamais les secrets ou le dialogue d’un autre dans la projection réseau', async () => {
        inscrire(alice, 'a', 'alice'); inscrire(bob, 'b', 'bob'); await ouvrir();
        await commandeMJ('configurer', { motDePasse: 'CODE-007-PRIVE' });
        await commandeMJ('repondre', { personnageId: 'alice', texte: 'TRANSMISSION PRIVEE ALICE' });
        await serveur.diffuserLesModules();
        expect(JSON.stringify(paquets(alice, 'modules:vue').at(-1))).toContain('TRANSMISSION PRIVEE ALICE');
        expect(JSON.stringify(paquets(bob, 'modules:vue'))).not.toContain('TRANSMISSION PRIVEE ALICE');
        expect(JSON.stringify(paquets(alice, 'modules:vue'))).not.toContain('CODE-007-PRIVE');
        expect(JSON.stringify(paquets(alice, 'modules:vue'))).not.toContain('sauvegarde');
    });
    it('un rôle MJ ou un personnage injectés dans la charge ne changent pas l’émetteur', async () => {
        inscrire(alice, 'a', 'alice'); await ouvrir();
        alice.emit('message', JSON.stringify({ type: 'modules:commander', payload: { requeteId: 'pirate', campagneId: 'camp-a', moduleId: 'alien-muthur', contexte: (await serveur.modulesDuJeu.vueMJ()).contexte,
            role: 'mj', personnageId: 'bob', commande: { id: 'configurer', charge: { motDePasse: 'PIRATE' } } } }));
        await serveur.modulesDuJeu.pret();
        expect(paquets(alice, 'modules:resultat').at(-1)?.payload.ok).toBe(false);
        expect(JSON.stringify((await serveur.modulesDuJeu.vueMJ()).sauvegarde)).not.toContain('PIRATE');
    });
    it('deviner un appareil ne permet pas de reprendre sa socket ; le secret de reprise fonctionne', async () => {
        inscrire(alice, 'a', 'alice');
        const jeton = paquets(alice, 'remote:registered').at(-1).payload.repriseModules;
        inscrire(bob, 'a', 'alice');
        expect(bob.identiteModules).toBeUndefined();
        expect(paquets(bob, 'remote:error').at(-1).payload.code).toBe('reprise_refusee');
        inscrire(bob, 'a', 'alice', jeton);
        expect(bob.identiteModules).toEqual({ appareilId: 'a', personnageId: 'alice' });
    });
    it('une collision, y compris fantôme à même IP, ne laisse aucune identité privée', () => {
        inscrire(alice, 'a', 'alice');
        sessionManager.ghostClient('a');
        inscrire(bob, 'b', 'alice');
        expect(bob.identiteModules).toBeUndefined();
        expect(bob.deviceId).toBeUndefined();
        expect(paquets(bob, 'remote:error').at(-1).payload.code).toBe('character_taken');
    });
    it('changer de PJ invalide les autres sockets de cet appareil et ne réutilise pas le PJ précédent si omis', async () => {
        inscrire(alice, 'a', 'alice');
        const jeton = paquets(alice, 'remote:registered').at(-1).payload.repriseModules;
        inscrire(bob, 'a', 'bob', jeton);
        expect(alice.identiteModules).toBeUndefined();
        expect(paquets(alice, 'modules:fermes')).toHaveLength(1);
        inscrire(bob, 'a');
        expect(bob.identiteModules?.personnageId).toBeNull();
        await ouvrir(); await serveur.diffuserLesModules();
        expect(paquets(bob, 'modules:vue').at(-1)?.payload.modules).toEqual([]);
    });
    it('achemine le détecteur seulement à ses destinataires et réserve Tout couper au MJ natif', async () => {
        inscrire(alice, 'a', 'alice'); inscrire(bob, 'b', 'bob');
        await ouvrir();
        const demande = { campagneId: 'camp-a', moduleId: 'alien-detecteur', contexte: (await serveur.modulesDuJeu.vueMJ()).contexte };
        expect(await invoquer('modules:autoriser', { ...demande, personnages: ['bob'] })).toEqual({ ok: true });
        const contexte = (await serveur.modulesDuJeu.vueMJ()).contexte;
        await invoquer('modules:commander', { ...demande, contexte, requeteId: 'radar', commande: { id: 'scanner', charge: { actif: true } } });
        await serveur.diffuserLesModules();
        expect(paquets(alice, 'modules:vue').at(-1).payload.modules.map((m: { id: string }) => m.id)).toEqual(['alien-muthur']);
        expect(paquets(bob, 'modules:vue').at(-1).payload.modules.map((m: { id: string }) => m.id)).toEqual(['alien-muthur', 'alien-detecteur']);
        bob.emit('message', JSON.stringify({ type: 'modules:tout-couper', payload: { campagneId: 'camp-a', contexte } }));
        bob.emit('message', JSON.stringify({ type: 'modules:commander', payload: { ...demande, contexte, requeteId: 'faux-mj', role: 'mj', commande: { id: 'scanner', charge: { actif: false } } } }));
        await serveur.modulesDuJeu.pret();
        expect(paquets(bob, 'modules:resultat').at(-1)?.payload.ok).toBe(false);
        expect(await invoquer('modules:tout-couper', { campagneId: 'camp-a', contexte })).toEqual({ ok: true });
        await serveur.diffuserLesModules();
        for (const ws of [alice, bob]) expect(paquets(ws, 'modules:vue').at(-1).payload.modules).toEqual([]);
    });
    it('confirme une commande une seule fois et refuse son rejeu', async () => {
        inscrire(alice, 'a', 'alice'); await ouvrir();
        const requete = { type: 'modules:commander', payload: { requeteId: 'une-fois', campagneId: 'camp-a', moduleId: 'alien-muthur', contexte: (await serveur.modulesDuJeu.vueMJ()).contexte, commande: { id: 'saisir', charge: { texte: 'HELP' } } } };
        alice.emit('message', JSON.stringify(requete)); await serveur.modulesDuJeu.pret();
        expect(paquets(alice, 'modules:resultat').at(-1)?.payload.ok).toBe(true);
        const avant = (await serveur.modulesDuJeu.vueMJ()).sauvegarde;
        alice.emit('message', JSON.stringify(requete)); await serveur.modulesDuJeu.pret();
        expect(paquets(alice, 'modules:resultat').at(-1)?.payload.ok).toBe(false);
        expect((await serveur.modulesDuJeu.vueMJ()).sauvegarde).toEqual(avant);
    });
});
