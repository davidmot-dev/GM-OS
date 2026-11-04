import { test, expect } from '@playwright/test';
import AdmZip from 'adm-zip';
import fs from 'node:fs';
import path from 'node:path';
import WebSocket from 'ws';
import { lancerGmOs, attendreLHydratation, ouvrirLeModule, ongletDeLaFiche } from './lancerGmOs';
import type { useSessionOSStore } from '../src/modules/session/useSessionOSStore';
import type { useRessourcesDeTableStore } from '../src/modules/table/useRessourcesDeTableStore';
import type { NexusDriverState } from '../src/modules/system/archive/nexus.types';
type Fenetre = Window & { useSessionOSStore: typeof useSessionOSStore; useRessourcesDeTableStore: typeof useRessourcesDeTableStore; randomSR?: typeof Math.random };
const sortie = path.resolve('output/shadowrun-sr-a4-a6'), fichier = path.resolve('Export Dirvers/corriges/Shadowrun-Anarchy-2.2.0.gmos-driver');

test('SR-A4/A5/A6 : réserves, égalités, flotte, droits et variante alternative', async () => {
    test.setTimeout(300_000); fs.mkdirSync(sortie, { recursive: true });
    const source = JSON.parse(new AdmZip(fichier).readAsText('state.json')) as NexusDriverState;
    const g = await lancerGmOs(), f = g.fenetre;
    let ws: WebSocket | undefined;
    const perso = () => f.evaluate(() => (window as unknown as Fenetre).useSessionOSStore.getState().players[0].characters[0]);
    const reserves = () => f.evaluate(() => (window as unknown as Fenetre).useRessourcesDeTableStore.getState().reserves['c-sr456']);
    const importer = async (fichier: string, conflit = false) => {
        await g.application.evaluate(({ dialog }, fichier) => { dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [fichier] }); }, fichier);
        await f.evaluate(() => (window as unknown as Fenetre).useSessionOSStore.getState().setCurrentView('library'));
        await f.getByRole('button', { name: /Importer un bundle Nexus/i }).click();
        if (conflit) await f.locator('#nexus-conflict-replace').click();
        await expect(f.locator('#nexus-bilan-fermer')).toBeVisible(); await f.locator('#nexus-bilan-fermer').click();
    };
    const ouvrir = async () => {
        await f.evaluate(() => { const s = (window as unknown as Fenetre).useSessionOSStore.getState(); s.setSelectedPlayer('j-sr456'); s.setSelectedCharacter('p-sr456'); s.setCurrentView('players'); });
        await ongletDeLaFiche(f, 'Lancer un test');
    };
    try {
        await f.setViewportSize({ width: 1440, height: 1400 }); await attendreLHydratation(g); await ouvrirLeModule(g, 'Tableau de Bord');
        await f.evaluate(() => (window as unknown as Fenetre).useSessionOSStore.setState({ campaigns: [], players: [], entities: [], sessions: [], scenes: [], actes: [], activeCampaignId: null, customGameDrivers: [], customSheetTemplates: [], currentView: 'library' }));
        await importer(fichier);
        // La notification d’import ne doit pas recouvrir les captures du manuel.
        await f.addStyleTag({ content: '.fixed.bottom-6.right-6.pointer-events-none { visibility: hidden !important; }' });
        await f.evaluate(source => {
            const s = (window as unknown as Fenetre).useSessionOSStore;
            const valeurs = Object.fromEntries(source.sheetTemplate!.sections.flatMap(s => s.fields).map(c => [c.id, c.defaultValue ?? '']));
            s.setState({ campaigns: [{ id: 'c-sr456', name: 'Recette fictive SR-A4/A6', system: source.gameDriver.id, activeLocationIds: [] }], activeCampaignId: 'c-sr456',
                players: [{ id: 'j-sr456', realName: 'Joueur fictif', characters: [{ id: 'p-sr456', name: 'Sillage', campaignId: 'c-sr456', systemId: source.gameDriver.id, templateId: source.sheetTemplate!.id, hp: 0, maxHp: 0,
                    sheetData: { ...valeurs, competence_1_nom: 'Pilotage', competence_1: 7, competence_1_rr: 0, agilite: 4, essence: 6, anarchy: 4 } }] }] } as never);
        }, source);
        await ouvrir();
        const plan = f.locator('[data-planification-shadowrun]'), panneau = f.locator('[data-panneau-de-jet]').first(), rigging = f.locator('[data-rigging-shadowrun]');
        await plan.getByLabel('Succès de préparation').fill('4'); await plan.getByRole('button', { name: 'Confirmer le crédit', exact: true }).click();
        await expect.poll(async () => (await reserves()).reserveDePlanification).toBe(4);
        await plan.getByLabel('Mode de narration').selectOption('totale');
        await plan.getByLabel('Description du flashback').fill('Le badge a été copié hier.');
        await plan.getByRole('button', { name: 'Confirmer le flashback', exact: true }).click();
        await expect(plan.getByRole('button', { name: 'Confirmer le flashback', exact: true })).toBeDisabled();
        await expect.poll(async () => (await reserves()).reserveDePlanification).toBe(2);
        expect((await perso()).sheetData?.anarchy).toBe(4);
        expect((await reserves()).reserveDeMenace).toBe(1);
        await plan.getByRole('button', { name: 'Tour de table +1 menace', exact: true }).click();
        await plan.getByRole('button', { name: 'Tour de table +1 menace', exact: true }).click();
        await expect(plan).toContainText('Menace 3 > Planification 2');
        await f.locator('[data-carte-du-jeu="planification-shadowrun"]').screenshot({ path: path.join(sortie, 'jeu-shadowrun-planification.jpg'), type: 'jpeg', quality: 85 });
        await plan.getByRole('button', { name: 'Confirmer le désastre — menace à 0', exact: true }).click();
        await expect.poll(async () => (await reserves()).reserveDeMenace).toBe(0);
        await panneau.locator('select').nth(0).selectOption('competence_1'); await panneau.locator('select').nth(1).selectOption('agilite');
        await panneau.getByLabel('Dés de risque', { exact: true }).fill('0');
        await panneau.getByLabel('Épreuve Shadowrun').selectOption('oppose'); await panneau.getByLabel('Succès adverses Shadowrun').fill('4');
        await f.evaluate(() => { const w = window as unknown as Fenetre; w.randomSR = Math.random; let compteur = 0; Math.random = () => compteur++ < 4 ? .99 : .2; });
        await panneau.getByRole('button', { name: 'Lancer', exact: true }).click();
        await f.evaluate(() => { const w = window as unknown as Fenetre; if (w.randomSR) Math.random = w.randomSR; });
        await expect(panneau).toContainText('Égalité — aucun vainqueur');
        await expect(panneau).toContainText('4 réussites / difficulté 4');
        await panneau.screenshot({ path: path.join(sortie, 'jeu-shadowrun-opposition.jpg'), type: 'jpeg', quality: 85 });
        await panneau.getByLabel('Rôle de l’adversaire').selectOption('second'); await panneau.getByLabel('RR adverse').selectOption('1');
        await expect(panneau).toContainText('Valeur moyenne 5 — sans Anarchy');
        await rigging.getByLabel('Nom du véhicule').fill('Moustique'); await rigging.getByRole('button', { name: 'Ajouter le véhicule' }).click();
        await expect(rigging).toContainText('Seuils 6/10/14');
        await rigging.getByLabel('IND cybernétique', { exact: true }).check(); await rigging.getByLabel('CCV', { exact: true }).check();
        await rigging.getByLabel('Connexion rigging').selectOption('hot'); await rigging.getByRole('button', { name: 'Prendre le contrôle' }).click();
        await expect(rigging).toContainText('Biofeedback mental létal');
        await panneau.getByLabel('Véhicule du jet').selectOption({ label: 'Moustique' });
        await expect(panneau.locator('[data-composition-shadowrun]')).toContainText('Pilotage en plongée hot-sim');
        for (let i = 0; i < 3; i++) { await rigging.getByLabel('VD du véhicule').fill('7'); await rigging.getByRole('button', { name: 'Confirmer l’impact' }).click(); }
        await expect.poll(async () => (await perso()).sheetData?.blessures_legeres).toBe(1);
        await expect(rigging).toContainText('2 légers / 1 graves / 0 incapacitants');
        await f.locator('[data-carte-du-jeu="rigging-shadowrun"]').screenshot({ path: path.join(sortie, 'jeu-shadowrun-rigging.jpg'), type: 'jpeg', quality: 85 });
        const avant = (await perso()).sheetData;
        await f.reload(); await attendreLHydratation(g); await ouvrir();
        expect((await perso()).sheetData).toEqual(avant); expect((await reserves()).reserveDePlanification).toBe(2);
        const messages: { type: string; payload?: { repriseModules?: string; session?: { reservesDeTable?: Record<string, number> } } }[] = [];
        let repriseModules: string | undefined;
        const connecter = async () => {
            ws = new WebSocket(`ws://127.0.0.1:${g.ports.sync}`);
            ws.on('message', data => messages.push(JSON.parse(String(data))));
            await new Promise<void>((resolve, reject) => { ws!.once('error', reject); ws!.once('open', () => { ws!.send(JSON.stringify({ type: 'remote:register', payload: { deviceId: 'sr456', pseudo: 'Tablette fictive', role: 'hub', characterId: 'p-sr456', repriseModules } })); resolve(); }); });
            await expect.poll(() => messages.some(m => m.type === 'remote:registered')).toBe(true);
            repriseModules = messages.find(m => m.type === 'remote:registered')?.payload?.repriseModules;
        };
        await connecter();
        ws!.send(JSON.stringify({ type: 'shadowrun:utilisation', payload: { id: 'autre', characterId: 'autre-personnage' } }));
        ws!.send(JSON.stringify({ type: 'table:ajuster', payload: { ressourceId: 'reserveDeMenace', delta: 99 } }));
        for (let i = 0; i < 2; i++) ws!.send(JSON.stringify({ type: 'shadowrun:utilisation', payload: { id: 'meme-recu', characterId: 'p-sr456' } }));
        await expect.poll(async () => (await reserves()).reserveDeMenace).toBe(1);
        await new Promise<void>(resolve => { ws!.once('close', () => resolve()); ws!.close(); });
        messages.length = 0; await connecter();
        ws!.send(JSON.stringify({ type: 'remote:request-sync' }));
        await expect.poll(() => messages.some(m => m.type === 'sync' && m.payload?.session?.reservesDeTable?.reserveDePlanification === 2)).toBe(true);
        const variante = path.join(g.profil, 'Shadowrun-2.2.0-alternatif.gmos-driver'), z = new AdmZip(fichier), copie = structuredClone(source);
        copie.gameDriver.jet!.shadowrun!.risqueAlternatif = true; z.updateFile('state.json', Buffer.from(JSON.stringify(copie))); z.writeZip(variante);
        await importer(variante, true); await ouvrir(); await expect(panneau).toContainText('règle de risque alternative');
        await panneau.locator('select').nth(0).selectOption('competence_1'); await panneau.locator('select').nth(1).selectOption('agilite');
        await panneau.getByRole('button', { name: 'Lancer', exact: true }).click(); await expect(panneau.locator('[data-suites-shadowrun]')).toBeVisible();
        await importer(fichier, true); await ouvrir();
        expect((await perso()).sheetData).toEqual(avant);
        fs.writeFileSync(path.join(sortie, 'verification-electron.json'), JSON.stringify({ version: '2.2.0', creditEtFlashback: true, refusDoubleDebit: true,
            menaceParUtilisation: true, desastreConfirme: true, egaliteSansVainqueur: true, moyenneSecondRole: 5,
            seuilsVehicule: [6, 10, 14], troisiemeLegereAvecBiofeedback: true, persistance: true, droitsTablette: true,
            reconnexionReserve: 2, varianteAlternativeEtRetour: true, donneesPersonnelles: false }, null, 2));
    } finally { ws?.close(); await g.fermer(); }
});
