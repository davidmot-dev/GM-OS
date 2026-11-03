import { test, expect, type Page } from '@playwright/test';
import WebSocket from 'ws';
import AdmZip from 'adm-zip';
import fs from 'node:fs';
import path from 'node:path';
import { lancerGmOs, attendreLHydratation, ouvrirLeModule, ongletDeLaFiche, type GmOsLance } from './lancerGmOs';
import type { useSessionOSStore } from '../src/modules/session/useSessionOSStore';
import type { NexusDriverState } from '../src/modules/system/archive/nexus.types';

type Fenetre = Window & { useSessionOSStore: typeof useSessionOSStore };
const sortie = path.resolve('output/verification-np-c2-c3');
const lots = [
    { jeu: 'runequest', campagne: 'recette-rq-campagne-bornes', archive: '01-Les-Bornes-du-gue.gmos' },
    { jeu: 'degenesis', campagne: 'recette-dg-campagne-station', archive: '01-La-Station-des-Cendres.gmos' },
    { jeu: 'coc', campagne: 'recette-coc-campagne-minutes', archive: '01-Les-Minutes-de-Verre.gmos' },
    { jeu: 'shadowrun-anarchy', campagne: 'recette-shadowrun-campagne-couleur', archive: '01-La-Derniere-Couleur.gmos' },
];
async function preparer(g: GmOsLance) {
    await g.fenetre.setViewportSize({ width: 1600, height: 1400 });
    await attendreLHydratation(g); await ouvrirLeModule(g, 'Tableau de Bord');
    await g.fenetre.evaluate(() => (window as unknown as Fenetre).useSessionOSStore.setState({
        campaigns: [], players: [], entities: [], sessions: [], actes: [], scenes: [], activeCampaignId: null,
        currentView: 'library', customGameDrivers: [], customSheetTemplates: [],
    }));
    fs.mkdirSync(sortie, { recursive: true });
}
async function importer(g: GmOsLance, fichier: string, attendu: () => Promise<unknown>, valeur: unknown, conflit = false, campagne = false) {
    const f = g.fenetre;
    await g.application.evaluate(({ dialog }, cible) => { dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [cible] }); }, path.resolve(fichier));
    await f.evaluate(() => (window as unknown as Fenetre).useSessionOSStore.getState().setCurrentView('library'));
    await f.getByRole('button', { name: /Importer un bundle Nexus/i }).click();
    if (conflit || campagne) await f.locator(conflit ? '#nexus-conflict-replace' : '#nexus-import-tel-quel').click();
    await expect.poll(attendu, { timeout: 45_000 }).toEqual(valeur);
    const fermer = f.locator('#nexus-bilan-fermer');
    // L'activation de la campagne peut déjà avoir quitté la bibliothèque et son HUD.
    if (await fermer.isVisible()) await fermer.click();
}
const personne = (f: Page, id: string) => f.evaluate(id => (window as unknown as Fenetre).useSessionOSStore.getState().players.flatMap(p => p.characters).find(c => c.id === id)!, id);

async function essayerLaReprise(g: GmOsLance, joueurId: string, personnageId: string, jeu: string) {
    const f = g.fenetre;
    const cible = await f.evaluate(({ joueurId, personnageId }) => {
        const magasin = (window as unknown as Fenetre).useSessionOSStore;
        const s = magasin.getState(), p = s.players.find(p => p.id === joueurId)!.characters.find(c => c.id === personnageId)!;
        const pilote = s.customGameDrivers.find(d => d.id === p.systemId)!;
        const fiche = s.customSheetTemplates.find(t => t.id === pilote.templateId)!;
        const cible = fiche.sections.flatMap(s => s.fields).find(c => c.type === 'number')!;
        s.updateCharacter(joueurId, personnageId, { sheetData: { ...p.sheetData, npc2_ancienne: '9' } });
        s.setSelectedPlayer(joueurId); s.setSelectedCharacter(personnageId); s.setCurrentView('players');
        return cible.id;
    }, { joueurId, personnageId });
    const panneau = f.locator('[data-reprise-de-fiche]');
    await panneau.locator('summary').click();
    const telecharger = panneau.getByRole('button', { name: 'Télécharger la sauvegarde avant reprise', exact: true });
    // Certains gabarits calculent des champs à l'ouverture ; les enregistrer par le geste normal.
    if (await telecharger.isDisabled()) await f.getByRole('button', { name: /Sauvegarder/i }).first().click();
    await expect(telecharger).toBeEnabled();
    const avant = await personne(f, personnageId);
    await panneau.getByLabel('Reprendre npc2_ancienne vers', { exact: true }).selectOption(cible);
    const sauvegarde = path.join(g.profil, `reprise-${jeu}.json`);
    // Aucun téléchargement vers le vrai dossier de David.
    await g.application.evaluate(({ BrowserWindow }, fichier) => {
        BrowserWindow.getAllWindows()[0].webContents.session.once('will-download', (_e, item) => item.setSavePath(fichier));
    }, sauvegarde);
    await telecharger.click();
    await expect.poll(() => {
        try { return JSON.parse(fs.readFileSync(sauvegarde, 'utf8')).format; } catch { return ''; }
    }).toBe('gmos-reprise-fiche');
    await panneau.getByRole('button', { name: 'Appliquer cette reprise', exact: true }).click();
    await expect.poll(async () => (await personne(f, personnageId)).sheetData[cible]).toBe(9);
    const apres = await personne(f, personnageId);
    expect(apres.sheetData.npc2_ancienne).toBe('9');
    expect(apres.gmNotes).toBe(avant.gmNotes); expect(apres.playerNotes).toBe(avant.playerNotes);
    expect(apres.inventory).toBe(avant.inventory); expect(apres.hp).toBe(avant.hp); expect(apres.maxHp).toBe(avant.maxHp);
    await panneau.screenshot({ path: path.join(sortie, `${jeu}-reprise.jpg`), type: 'jpeg', quality: 85, scale: 'css' });
    await panneau.getByLabel('Sauvegarde de reprise à restaurer', { exact: true }).setInputFiles(sauvegarde);
    await panneau.getByRole('button', { name: 'Restaurer les anciennes valeurs', exact: true }).click();
    await expect.poll(async () => (await personne(f, personnageId)).sheetData).toEqual(avant.sheetData);
    await f.reload(); await attendreLHydratation(g);
    expect((await personne(f, personnageId)).sheetData).toEqual(avant.sheetData);
    fs.writeFileSync(path.join(sortie, `${jeu}-reprise.json`), JSON.stringify({ jeu, sauvegardeTelechargee: true,
        liaisonExplicite: true, anciennesClesConservees: true, notesEtSanteConservees: true,
        restaurationDepuisExport: true, persistanceApresRechargement: true }, null, 2) + '\n');
}

for (const lot of lots) test(`${lot.jeu} : GM-06 refuse autrui et conserve le refus après rechargement`, async () => {
    test.setTimeout(180_000);
    const g = await lancerGmOs(), f = g.fenetre;
    let socket: WebSocket | undefined;
    try {
        await preparer(g);
        await importer(g, `output/campagnes-tests/${lot.jeu}/${lot.archive}`,
            () => f.evaluate(() => (window as unknown as Fenetre).useSessionOSStore.getState().activeCampaignId), lot.campagne, false, true);
        const joueurs = await f.evaluate(campagne => (window as unknown as Fenetre).useSessionOSStore.getState().players
            .map(p => ({ id: p.id, personnage: p.characters.find(c => c.campaignId === campagne)! })).filter(p => p.personnage), lot.campagne);
        const [a, b] = joueurs; expect(joueurs).toHaveLength(3);
        const avant = await personne(f, b.personnage.id);
        socket = new WebSocket(`ws://127.0.0.1:${g.ports.sync}`);
        const ws = socket;
        await new Promise<void>((resolve, reject) => {
            ws.once('error', reject);
            ws.on('message', brut => { if (JSON.parse(String(brut)).type === 'remote:registered') resolve(); });
            ws.once('open', () => ws.send(JSON.stringify({ type: 'remote:register', payload: {
                deviceId: `npc3-${lot.jeu}`, pseudo: 'Client fictif NP-C3', role: 'hub', characterId: a.personnage.id,
            } })));
        });
        const envoyer = (type: string, characterId: string, playerId: string, updates: object) => ws.send(JSON.stringify({ type, payload: { playerId, characterId, updates } }));
        envoyer('session:update-character-sheet-data', b.personnage.id, b.id, { sheetData: { npc3_intrusion: 999 } });
        envoyer('session:update-character-narrative', b.personnage.id, b.id, { description: 'INTRUSION', playerNotes: 'INTRUSION', inventory: 'INTRUSION' });
        envoyer('session:update-character-vitals', b.personnage.id, b.id, { hp: 0 });
        // Alias privilégié : un joueur ne doit pas contourner la politique en changeant le type.
        envoyer('remote:session:update-character-sheet-data', b.personnage.id, b.id, { sheetData: { npc3_alias: 999 } });
        envoyer('session:update-character-narrative', a.personnage.id, a.id, { gmNotes: 'INTRUSION', playerNotes: 'NOTE AUTORISÉE' });
        envoyer('session:update-character-sheet-data', a.personnage.id, a.id, { sheetData: { npc3_barriere: 'AUTORISÉ' } });
        // La propre écriture clôt la série : même socket, ordre de livraison, aucun délai aveugle.
        await expect.poll(async () => (await personne(f, a.personnage.id)).sheetData.npc3_barriere).toBe('AUTORISÉ');
        await expect.poll(async () => (await personne(f, a.personnage.id)).playerNotes).toBe('NOTE AUTORISÉE');
        expect(await personne(f, b.personnage.id)).toEqual(avant);
        expect((await personne(f, a.personnage.id)).gmNotes).toBe(a.personnage.gmNotes);
        await f.reload(); await attendreLHydratation(g);
        expect(await personne(f, b.personnage.id)).toEqual(avant);
        expect((await personne(f, a.personnage.id)).sheetData.npc3_barriere).toBe('AUTORISÉ');
        fs.writeFileSync(path.join(sortie, `${lot.jeu}-droits.json`), JSON.stringify({ jeu: lot.jeu,
            refus: ['sheetData', 'narratif', 'PV', 'alias'], ecriturePropre: true, notesMJProtegees: true,
            persistanceApresRechargement: true, donneesPersonnelles: false }, null, 2) + '\n');
        await essayerLaReprise(g, a.id, a.personnage.id, lot.jeu);
    } finally { socket?.close(); await g.fermer(); }
});

for (const jeu of ['coc', 'shadowrun-anarchy']) test(`${jeu} : importe la variante puis revient au standard`, async () => {
    test.setTimeout(180_000);
    const g = await lancerGmOs(), f = g.fenetre;
    try {
        await preparer(g);
        const standard = jeu === 'coc' ? 'output/campagnes-tests/coc/COC-2.0.0-d20.gmos-driver'
            : 'output/campagnes-tests/shadowrun-anarchy/Shadowrun-Anarchy-2.0.0.gmos-driver';
        const zip = new AdmZip(standard), source = JSON.parse(zip.readAsText('state.json')) as NexusDriverState;
        let variante = 'output/campagnes-tests/coc/COC-2.0.0-option-3d6.gmos-driver';
        if (jeu === 'shadowrun-anarchy') {
            const copie = structuredClone(source);
            copie.gameDriver.jet!.shadowrun!.risqueAlternatif = true;
            zip.updateFile('state.json', Buffer.from(JSON.stringify(copie)));
            variante = path.join(g.profil, 'fixture-shadowrun-alternatif.gmos-driver'); zip.writeZip(variante);
        }
        const config = () => f.evaluate(id => {
            const p = (window as unknown as Fenetre).useSessionOSStore.getState().customGameDrivers.find(p => p.id === id);
            return p && { des: p.dice.defaultDice, alternatif: !!p.jet?.shadowrun?.risqueAlternatif };
        }, source.gameDriver.id);
        const base = { des: source.gameDriver.dice.defaultDice, alternatif: false };
        const option = { des: jeu === 'coc' ? '3d6' : base.des, alternatif: jeu !== 'coc' };
        await importer(g, standard, config, base);
        // Les valeurs de personnage survivent aux remplacements du pilote, y compris zéro/faux et notes.
        const fiche = source.sheetTemplate!;
        await f.evaluate(({ pilote, fiche }) => {
            const s = (window as unknown as Fenetre).useSessionOSStore;
            const valeurs = Object.fromEntries(fiche.sections.flatMap(s => s.fields).map(c => [c.id, c.defaultValue]));
            s.setState({ campaigns: [{ id: 'camp-npc3', name: 'Campagne fictive NP-C3', system: pilote.id, activeLocationIds: [] }],
                players: [{ id: 'j-npc3', realName: 'Joueur fictif', avatarUrl: '', isOnline: false, characters: [{
                    id: 'pj-npc3', name: 'PJ fictif NP-C3', campaignId: 'camp-npc3', systemId: pilote.id, templateId: fiche.id,
                    portraitUrl: '', hp: 4, maxHp: 10, playerNotes: 'NOTE CONSERVÉE', sheetData: {
                        ...valeurs, agilite: 2, competence_1: 4, competence_1_nom: 'Compétence fictive NP-C3',
                        logique: 3, competence_1_rr: 2, npc3_zero: 0, npc3_faux: false,
                    },
                }] }], activeCampaignId: 'camp-npc3' });
        }, { pilote: source.gameDriver, fiche });
        const avant = await personne(f, 'pj-npc3');
        for (const [phase, fichier, attendu] of [['variante', variante, option], ['standard', standard, base]] as const) {
            await importer(g, fichier, config, attendu, true);
            expect(await personne(f, 'pj-npc3')).toEqual(avant);
            await f.evaluate(() => {
                const s = (window as unknown as Fenetre).useSessionOSStore.getState();
                s.setSelectedPlayer('j-npc3'); s.setSelectedCharacter('pj-npc3'); s.setCurrentView('players');
            });
            await ongletDeLaFiche(f, 'Lancer un test');
            const panneau = f.locator('[data-panneau-de-jet]').first();
            await panneau.locator('select').nth(0).selectOption(jeu === 'coc' ? 'agilite' : 'competence_1');
            if (jeu !== 'coc') await panneau.locator('select').nth(1).selectOption('logique');
            if (jeu === 'coc') await expect(panneau).toContainText(phase === 'variante' ? '3d6' : '1d20');
            else {
                const preparation = panneau.locator('[data-preparation-shadowrun]');
                await expect(preparation).toBeVisible();
                if (phase === 'variante') await expect(preparation).toContainText('règle de risque alternative');
                else await expect(preparation.getByLabel('Dés de risque', { exact: true })).toBeVisible();
            }
            await panneau.getByRole('button', { name: 'Lancer', exact: true }).click();
            // Le panneau du MJ consigne au journal, pas dans useDiceStore (qui reçoit les jets distants).
            await expect(panneau.locator(jeu === 'coc' ? '[data-suites-coc]' : '[data-suites-shadowrun]')).toBeVisible();
            await panneau.screenshot({ path: path.join(sortie, `${jeu}-${phase}.jpg`), type: 'jpeg', quality: 85, scale: 'css' });
        }
        await f.reload(); await attendreLHydratation(g); expect(await config()).toEqual(base);
        fs.writeFileSync(path.join(sortie, `${jeu}-variantes.json`), JSON.stringify({ jeu, importVariante: true, retourStandard: true,
            personnagesConserves: true, jetsEffectues: 2, persistance: true, fixtureAlternativeTemporaire: jeu !== 'coc' }, null, 2) + '\n');
    } finally { await g.fermer(); }
});
