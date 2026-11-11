import { test, expect } from '@playwright/test';
import WebSocket from 'ws';
import fs from 'node:fs';
import path from 'node:path';
import { lancerGmOs, attendreLHydratation, ouvrirLeModule, ongletDeLaFiche, type GmOsLance } from './lancerGmOs';
import type { useSessionOSStore } from '../src/modules/session/useSessionOSStore';
import type { useDiceStore } from '../src/stores/useDiceStore';

/**
 * **Jets demandés et jets cachés, de bout en bout** — plan
 * `documentation/Planning/2026-11-11-jets-demandes-et-caches.md`, T9 (C1, C4, C5,
 * C6, C7).
 *
 * Le meneur, dans la vraie fenêtre de GM-OS sur un profil jetable ; les tablettes,
 * deux clients WebSocket sur la vraie porte du serveur de synchronisation, comme
 * le parcours NP-C3. Rien n'est simulé entre les deux : ni l'acheminement, ni la
 * politique des actions, ni le fil rendu à la reconnexion.
 */

type Fenetre = Window & { useSessionOSStore: typeof useSessionOSStore; useDiceStore: typeof useDiceStore };
const sortie = path.resolve('output/verification-jets-demandes');

const FICHE = {
    id: 'tpl-demandes', name: 'Fiche fictive des demandes', emoji: '🎲',
    sections: [{ id: 'attributs', label: 'Attributs', fields: [
        { id: 'precision', label: 'Précision', type: 'number', defaultValue: 0 },
        { id: 'vigilance', label: 'Vigilance', type: 'number', defaultValue: 0 },
    ] }],
};
/** Un seuil au d100 : la tablette lance elle-même (« Lancer un test »). */
const PILOTE = {
    id: 'pilote-demandes', name: 'Pilote fictif des demandes', templateId: FICHE.id, version: '1.0.0',
    dice: { defaultDice: '1d100', logic: 'count-success', engine: 'standard' },
    jet: {
        sens: 'sous-ou-egal',
        seuil: [{ id: 'attribut', label: 'Attribut', sectionId: 'attributs' }],
        reserve: { base: 1, max: 1, faces: 100 },
        modificateurDuSeuil: { min: -5, max: 5, defaut: 0 },
    },
};
const personnage = (id: string, name: string) => ({
    id, name, campaignId: 'camp-demandes', systemId: PILOTE.id, templateId: FICHE.id,
    portraitUrl: '', hp: 10, maxHp: 10, sheetData: { precision: 40, vigilance: 60 },
});

/**
 * Un client de tablette : inscrit sur la vraie porte, il garde tout ce qu'il reçoit.
 * Comme une vraie tablette, il présente à la reconnexion le jeton de reprise que
 * le serveur lui a remis (`repriseModules`) — sans lui, l'appareil est refusé.
 */
async function tablette(g: GmOsLance, deviceId: string, characterId: string, repriseModules?: string) {
    const ws = new WebSocket(`ws://127.0.0.1:${g.ports.sync}`);
    const recus: { type: string; payload: unknown }[] = [];
    ws.on('message', brut => { try { recus.push(JSON.parse(String(brut))); } catch { /* binaire : rien à lire */ } });
    const reprise = await new Promise<string>((resolve, reject) => {
        ws.once('error', reject);
        ws.on('message', brut => {
            const m = JSON.parse(String(brut)) as { type: string; payload?: { repriseModules?: string; code?: string } };
            if (m.type === 'remote:registered') resolve(m.payload?.repriseModules ?? '');
            if (m.type === 'remote:error') reject(new Error(`Inscription refusée : ${m.payload?.code}`));
        });
        ws.once('open', () => ws.send(JSON.stringify({ type: 'remote:register', payload: {
            deviceId, pseudo: `Tablette fictive ${characterId}`, role: 'hub', characterId,
            ...(repriseModules ? { repriseModules } : {}),
        } })));
    });
    return { ws, recus, reprise };
}

type Message = { id?: string; demandeDeJet?: { id: string; titre: string; characterId: string }; suiteDeDemande?: { id: string; etat: string } };
const messagesRecus = (recus: { type: string; payload: unknown }[]): Message[] => recus.flatMap(r =>
    r.type === 'session:receive-message' ? [r.payload as Message]
        : r.type === 'session:fil-de-messages' ? (r.payload as Message[]) : []);

test('le meneur demande, la tablette visée lance, la demande se clôt — et revient à la reconnexion', async () => {
    test.setTimeout(180_000);
    const g = await lancerGmOs(), f = g.fenetre;
    const sockets: WebSocket[] = [];
    try {
        await f.setViewportSize({ width: 1600, height: 1400 });
        await attendreLHydratation(g);
        await ouvrirLeModule(g, 'Tableau de Bord');
        await f.evaluate(({ FICHE, PILOTE, wilson, autre }) => (window as unknown as Fenetre).useSessionOSStore.setState({
            campaigns: [{ id: 'camp-demandes', name: 'Campagne fictive des demandes', system: PILOTE.id, activeLocationIds: [] }],
            players: [
                { id: 'j-wilson', realName: 'Joueur fictif A', avatarUrl: '', isOnline: false, characters: [wilson] },
                { id: 'j-autre', realName: 'Joueur fictif B', avatarUrl: '', isOnline: false, characters: [autre] },
            ],
            customGameDrivers: [PILOTE], customSheetTemplates: [FICHE],
            activeCampaignId: 'camp-demandes', messages: [],
        } as never), { FICHE, PILOTE, wilson: personnage('pj-wilson', 'Wilson'), autre: personnage('pj-autre', 'Autre') });
        fs.mkdirSync(sortie, { recursive: true });

        let wilson = await tablette(g, 'tab-wilson', 'pj-wilson'); sockets.push(wilson.ws);
        const autre = await tablette(g, 'tab-autre', 'pj-autre'); sockets.push(autre.ws);

        // ── Le meneur compose « Vigilance, −2 » et le demande à Wilson ──
        await f.evaluate(() => {
            const s = (window as unknown as Fenetre).useSessionOSStore.getState();
            s.setSelectedPlayer('j-wilson'); s.setSelectedCharacter('pj-wilson'); s.setCurrentView('players');
        });
        await ongletDeLaFiche(f, 'Lancer un test');
        const panneau = f.locator('[data-panneau-de-jet]').first();
        await panneau.locator('select').nth(0).selectOption('vigilance');
        await panneau.getByRole('button', { name: 'Demander à Wilson' }).click();

        // C1 : la tablette visée la reçoit…
        await expect.poll(() => messagesRecus(wilson.recus).filter(m => m.demandeDeJet).length).toBe(1);
        const demande = messagesRecus(wilson.recus).find(m => m.demandeDeJet)!.demandeDeJet!;
        expect(demande).toMatchObject({ characterId: 'pj-wilson', titre: 'Vigilance' });
        await expect(panneau.getByRole('region', { name: 'Demandes en cours' })).toContainText('en attente');
        await panneau.screenshot({ path: path.join(sortie, 'meneur-demande-en-attente.jpg'), type: 'jpeg', quality: 85, scale: 'css' });

        // ── C4 : la tablette lance et répond avec l'identifiant de la demande ──
        wilson.ws.send(JSON.stringify({ type: 'fiche:resultat', payload: {
            characterId: 'pj-wilson', titre: 'Vigilance', total: 30, modifier: 0, totalDisplay: '30 (seuil 58)',
            rolls: [{ val: 30, sides: 100 }], tagSuccess: true, demandeId: demande.id,
        } }));
        // Chez le meneur, la demande passe à « lancé »…
        await expect.poll(() => f.evaluate(id => (window as unknown as Fenetre).useSessionOSStore.getState().messages
            .some(m => m.suiteDeDemande?.id === id && m.suiteDeDemande.etat === 'lancee'), demande.id)).toBe(true);
        await expect(panneau.getByRole('region', { name: 'Demandes en cours' })).toContainText('lancé');
        // … et la tablette l'apprend, pour retirer sa bannière.
        await expect.poll(() => messagesRecus(wilson.recus).some(m => m.suiteDeDemande?.id === demande.id)).toBe(true);
        // Un second jet sur la même demande ne la clôt pas deux fois (C5).
        wilson.ws.send(JSON.stringify({ type: 'fiche:resultat', payload: {
            characterId: 'pj-wilson', titre: 'Vigilance', total: 80, modifier: 0, totalDisplay: '80 (seuil 58)',
            rolls: [{ val: 80, sides: 100 }], tagSuccess: false, demandeId: demande.id,
        } }));

        // ── C6 : une seconde demande attend une tablette déconnectée ──
        wilson.ws.close();
        await expect.poll(() => wilson.ws.readyState).toBe(WebSocket.CLOSED);
        await panneau.getByRole('button', { name: 'Demander à Wilson' }).click();
        const seconde = await f.evaluate(() => (window as unknown as Fenetre).useSessionOSStore.getState().messages
            .filter(m => m.demandeDeJet).map(m => m.demandeDeJet!.id));
        expect(seconde).toHaveLength(2);
        wilson = await tablette(g, 'tab-wilson', 'pj-wilson', wilson.reprise); sockets.push(wilson.ws);
        await expect.poll(() => messagesRecus(wilson.recus).some(m => m.demandeDeJet?.id === seconde[1])).toBe(true);

        // ── C5 : le meneur annule ; la tablette l'apprend ──
        const ligne = panneau.getByRole('region', { name: 'Demandes en cours' });
        await ligne.getByRole('button', { name: /Annuler/ }).click();
        await expect.poll(() => messagesRecus(wilson.recus)
            .some(m => m.suiteDeDemande?.id === seconde[1] && m.suiteDeDemande.etat === 'annulee')).toBe(true);
        expect(await f.evaluate(id => (window as unknown as Fenetre).useSessionOSStore.getState().messages
            .filter(m => m.suiteDeDemande?.id === id).length, demande.id), 'une seule clôture pour la première').toBe(1);

        // C1 : l'autre tablette n'a rien reçu de tout cela.
        expect(messagesRecus(autre.recus).filter(m => m.demandeDeJet || m.suiteDeDemande)).toEqual([]);

        fs.writeFileSync(path.join(sortie, 'demande.json'), JSON.stringify({
            remiseAuSeulVise: true, reponseClotLaDemande: true, secondJetSansEffet: true,
            filRenduALaReconnexion: true, annulationTransmise: true,
        }, null, 2) + '\n');
    } finally {
        sockets.forEach(ws => ws.close());
        await g.fermer();
    }
});

test('un jet caché au pupitre ne part pas aux tablettes (C7)', async () => {
    test.setTimeout(120_000);
    const g = await lancerGmOs(), f = g.fenetre;
    let ws: WebSocket | undefined;
    try {
        await f.setViewportSize({ width: 1600, height: 1000 });
        await attendreLHydratation(g);
        await f.evaluate(() => (window as unknown as Fenetre).useDiceStore.getState().clearHistory());
        const t = await tablette(g, 'tab-cache', 'pj-cache'); ws = t.ws;
        /** Le dernier jet que la tablette a reçu dans le segment des dés. */
        const vuParLaTablette = () => {
            const segments = t.recus.filter(r => r.type === 'sync')
                .map(r => (r.payload as { dice?: { lastRoll?: { id?: string } | null } }).dice)
                .filter((d): d is { lastRoll?: { id?: string } | null } => !!d);
            return segments.length ? segments[segments.length - 1].lastRoll?.id ?? null : undefined;
        };

        await ouvrirLeModule(g, 'Dice-OS');
        // Témoin : un jet visible arrive bien à la tablette.
        await f.getByRole('button', { name: /^lancer$/i }).first().click();
        const visible = await f.evaluate(() => (window as unknown as Fenetre).useDiceStore.getState().lastRoll!.id);
        await expect.poll(vuParLaTablette, { timeout: 15_000 }).toBe(visible);

        await f.getByRole('switch', { name: /Jet caché/ }).click();
        await f.getByRole('button', { name: /Lancer en caché/ }).click();
        await expect(f.locator('[data-jets-caches]')).toBeVisible();
        await f.locator('[data-jets-caches]').screenshot({ path: path.join(sortie, 'pupitre-jets-caches.jpg'), type: 'jpeg', quality: 85, scale: 'css' });

        // Le magasin persisté et diffusé n'a pas bougé…
        const des = await f.evaluate(() => {
            const s = (window as unknown as Fenetre).useDiceStore.getState();
            return { dernier: s.lastRoll?.id, historique: s.history.length };
        });
        expect(des).toEqual({ dernier: visible, historique: 1 });
        // … et la tablette, après plusieurs diffusions, voit toujours le jet visible.
        t.recus.length = 0;
        await f.evaluate(() => (window as unknown as Fenetre).useDiceStore.getState().setIsDiceProjected(false));
        await expect.poll(() => t.recus.some(r => r.type === 'sync'), { timeout: 15_000 }).toBe(true);
        expect(vuParLaTablette() ?? visible).toBe(visible);

        fs.mkdirSync(sortie, { recursive: true });
        fs.writeFileSync(path.join(sortie, 'jet-cache.json'), JSON.stringify({
            jetVisibleRecuParLaTablette: true, jetCacheHorsDuMagasin: true, jetCacheHorsDuSegment: true,
        }, null, 2) + '\n');
    } finally {
        ws?.close();
        await g.fermer();
    }
});
