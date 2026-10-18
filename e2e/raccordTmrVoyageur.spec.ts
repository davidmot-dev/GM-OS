import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import AdmZip from 'adm-zip';
import { lancerGmOs, attendreLHydratation, type GmOsLance } from './lancerGmOs';
import type { useSessionOSStore } from '../src/modules/session/useSessionOSStore';
import type { EtatTMR, VueTMRMJ } from '../outils/reve-de-dragon/tmr/moteur.mjs';
import { appliquerCoutTMR, proposerCoutTMR } from '../src/modules/session/logic/ressourcesDesTMR';
import { CLE_RECUS_TMR } from '../src/modules/session/logic/recusDesTMR';
import { validateSession } from '../src/types/schemas';
type Fenetre = { useSessionOSStore: typeof useSessionOSStore };
const racine = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fichierPilote = path.join(racine, 'Export Dirvers/corriges/RDD_driver_gmos_r0-consolide.gmos-driver');
const sortie = path.join(racine, 'scratch/reve-de-dragon-r8/raccord');
test.skip(!fs.existsSync(fichierPilote), 'Pilote R0 requis, sans lecture de données personnelles.');
test.use({ channel: 'msedge', locale: 'fr-FR', timezoneId: 'Europe/Brussels', serviceWorkers: 'block' });
test('R8 : aperçu périmé refusé, débit depuis une tablette et reprise froide après reçu durable', async ({ browser }) => {
    test.setTimeout(150_000); fs.mkdirSync(sortie, { recursive: true });
    const exporte = JSON.parse(new AdmZip(fichierPilote).readAsText('state.json'));
    const semence = JSON.parse(fs.readFileSync(path.join(racine, 'e2e/donnees/campagne-de-demo.json'), 'utf8'));
    const s = semence.modules.sessionOS;
    s.customGameDrivers = [{ ...exporte.gameDriver, modulesDuJeu: [{ id: 'rdd-tmr' }] }]; s.customSheetTemplates = [exporte.sheetTemplate];
    s.campaigns = [{ id: 'r8', name: 'Raccord TMR fictif', system: exporte.gameDriver.id, systemPath: 'systems/reves de dragons', description: '', activeLocationIds: [] }]; s.activeCampaignId = 'r8';
    s.sessions = [{ ...s.sessions[0], id: 's8', campaignId: 'r8', status: 'active', sessionEntityIds: ['pj'] }]; s.currentView = 'cockpit';
    s.players = [{ id: 'joueur', realName: 'Aline', avatarUrl: '', isOnline: false, characters: [{
        id: 'pj', name: 'Aline', portraitUrl: '', templateId: exporte.sheetTemplate.id, systemId: exporte.gameDriver.id, campaignId: 'r8', hp: 12, maxHp: 12,
        sheetData: { taille: 12, constitution: 12, volonte: 12, reve: 14, reve_pts: 12, reve_seuil: 4, fatigue: 0, endurance: 24, endurance_max: 24, vie: 12, vie_max: 12, __rddReprise231: 1, __rddFatigue231: 1 },
    }] }];
    const dossier = fs.mkdtempSync(path.join(os.tmpdir(), 'gmos-r8-raccord-')); const fichier = path.join(dossier, 'semence.json'); fs.writeFileSync(fichier, JSON.stringify(semence));
    let app: GmOsLance | undefined; const ctx = await browser.newContext({ viewport: { width: 820, height: 1200 }, hasTouch: true, serviceWorkers: 'block' });
    try {
        app = await lancerGmOs({ semence: fichier }); await attendreLHydratation(app);
        let f = app.fenetre;
        const ouvrir = async () => {
            await f.evaluate(() => (window as unknown as Fenetre).useSessionOSStore.getState().setCurrentView('cockpit'));
            await f.getByRole('button', { name: 'Modules du jeu', exact: true }).click(); await f.getByRole('button', { name: 'Ouvrir le pupitre', exact: true }).click();
        };
        const lireFiche = () => f.evaluate(() => (window as unknown as Fenetre).useSessionOSStore.getState().players[0].characters[0]);
        const lire = async () => (await f.evaluate(() => window.appBridge!.modulesDuJeu!.lire())).modules[0].vue as VueTMRMJ;
        await ouvrir(); const carte = f.getByRole('region', { name: 'Terres Médianes du Rêve', exact: true });
        await carte.getByRole('button', { name: 'Placer le demi-rêve', exact: true }).click();
        const acces = f.getByRole('group', { name: 'Accès des personnages', exact: true }).getByRole('checkbox', { name: 'Aline', exact: true });
        await acces.click(); await expect(acces).toBeChecked();
        await ctx.addInitScript(() => localStorage.setItem('gmos-tablet-uuid', 'r8-raccord-aline'));
        await ctx.route('**/*', r => { const u = new URL(r.request().url()); return u.hostname === '127.0.0.1' || ['data:', 'blob:'].includes(u.protocol) ? r.continue() : r.abort(); });
        const tablette = await ctx.newPage(); await tablette.goto(`http://127.0.0.1:${app.ports.sync}/?window=tablet&sync=${app.ports.sync}`);
        await tablette.getByRole('button', { name: /Aline/ }).click({ timeout: 20_000 }); await expect(tablette.getByText('Connecté', { exact: true })).toBeVisible();
        await tablette.getByRole('navigation', { name: 'Navigation Hub' }).getByRole('button', { name: 'Modules du jeu', exact: true }).click();
        await tablette.getByRole('button', { name: 'Ouvrir Terres Médianes du Rêve', exact: true }).click();
        const pj = tablette.getByRole('region', { name: 'Terres Médianes du Rêve', exact: true });
        const raccord = f.getByRole('region', { name: 'Raccord de fiche de Aline', exact: true });
        await pj.getByRole('button', { name: 'Demander la montée', exact: true }).click();
        await raccord.getByRole('button', { name: 'Prévisualiser le coût sur la fiche', exact: true }).click(); await expect(raccord).toContainText('Rêve 12 → 11 ; fatigue 0 → 1');
        expect((await lireFiche()).sheetData.reve_pts).toBe(12);
        await f.evaluate(() => (window as unknown as Fenetre).useSessionOSStore.getState().updateCharacterSheetData('joueur', 'pj', 'fatigue', 2));
        await raccord.getByLabel('Conditions de concentration, round et barème de base vérifiés', { exact: true }).check();
        await raccord.getByRole('button', { name: 'Débiter la fiche et valider le trajet', exact: true }).click();
        await expect(raccord.getByRole('alert')).toContainText('La fiche a changé'); expect((await lireFiche()).sheetData.reve_pts).toBe(12); expect((await lire()).voyageurs[0].present).toBe(false);
        await raccord.getByRole('button', { name: 'Annuler si aucun débit n’a eu lieu', exact: true }).click(); await expect(raccord).toHaveCount(0);
        await pj.getByRole('button', { name: 'Demander la montée', exact: true }).click();
        async function payer() {
            await raccord.getByRole('button', { name: 'Prévisualiser le coût sur la fiche', exact: true }).click();
            await raccord.getByLabel('Conditions de concentration, round et barème de base vérifiés', { exact: true }).check();
            await raccord.screenshot({ path: path.join(sortie, 'jeu-reves-de-dragons-tmr-raccord.jpg'), type: 'jpeg', quality: 85 });
            await raccord.getByRole('button', { name: 'Débiter la fiche et valider le trajet', exact: true }).click(); await expect(raccord).toHaveCount(0);
        }
        await payer(); await expect(pj.getByText('En voyage · normal', { exact: true })).toBeVisible(); expect((await lireFiche()).sheetData).toMatchObject({ reve_pts: 11, fatigue: 3 });
        await pj.getByLabel('Case sélectionnée', { exact: true }).selectOption('H4'); await pj.getByRole('button', { name: 'Demander le déplacement', exact: true }).click(); await payer();
        expect((await lireFiche()).sheetData).toMatchObject({ reve_pts: 11, fatigue: 4 }); expect(((await lireFiche()).sheetData[CLE_RECUS_TMR] as unknown[])).toHaveLength(2);
        await expect(pj.locator('.tmr-position')).toContainText('H4');
        await f.reload(); await attendreLHydratation(app); expect((await lireFiche()).sheetData).toMatchObject({ reve_pts: 11, fatigue: 4 });
        // Fermer le pupitre, puis préparer une intention durable sans son consommateur.
        await f.evaluate(() => (window as unknown as Fenetre).useSessionOSStore.getState().setCurrentView('cockpit'));
        await pj.getByRole('button', { name: 'Rester un round', exact: true }).click();
        const demande = (await lire()).voyageurs[0].demande!; const fiche = await lireFiche(); const proposition = proposerCoutTMR(fiche, demande);
        const vueNative = await f.evaluate(() => window.appBridge!.modulesDuJeu!.lire());
        const retour = await f.evaluate(({ contexte, demande, empreinte }) => window.appBridge!.modulesDuJeu!.commander({ campagneId: 'r8', moduleId: 'rdd-tmr', contexte, requeteId: crypto.randomUUID(),
            commande: { id: 'engager-trajet', charge: { personnageId: 'pj', operationId: demande.operationId, transactionId: 'reprise-froide', empreinte, compteRendu: 'Interruption simulée après persistance du reçu' } } }), { contexte: vueNative.contexte, demande, empreinte: proposition.empreinte });
        expect(retour).toEqual({ ok: true });
        const avantCoupure = await f.evaluate(() => window.appBridge!.modulesDuJeu!.lire());
        const etat = avantCoupure.sauvegarde!.campagnes.r8['rdd-tmr'].donnees as EtatTMR;
        // Semence représentant exactement le point de panne : fiche + reçu déjà durables,
        // intention du module non acquittée. Jamais de copie du profil personnel.
        semence.modules.sessionOS = { ...s, ...await f.evaluate(() => (window as unknown as Fenetre).useSessionOSStore.getState().getBackupData()), currentView: 'cockpit' };
        semence.modules.sessionOS.players[0].characters[0].sheetData = appliquerCoutTMR(fiche, etat.voyageurs[0].ecriture!, 'r8', 'pj').donnees;
        validateSession(semence);
        const reprise = path.join(dossier, 'reprise.json'); fs.writeFileSync(reprise, JSON.stringify(semence));
        await ctx.close(); await app.fermer(); app = undefined;
        app = await lancerGmOs({ semence: reprise, preparerLeProfil: profil => { fs.mkdirSync(path.join(profil, 'modules-du-jeu'), { recursive: true }); fs.writeFileSync(path.join(profil, 'modules-du-jeu/instances.json'), JSON.stringify(avantCoupure.sauvegarde)); } });
        await attendreLHydratation(app); f = app.fenetre;
        // L'hydratation IndexedDB précède l'import asynchrone de la semence jetable.
        await expect.poll(async () => (await lireFiche()).id).toBe('pj');
        await expect.poll(async () => (await f.evaluate(() => window.appBridge!.modulesDuJeu!.lire())).modules.length).toBe(1);
        expect((await lireFiche()).sheetData).toMatchObject({ reve_pts: 11, fatigue: 5 });
        expect((await lire()).voyageurs[0].ecriture).toMatchObject({ id: 'reprise-froide', interrompue: true });
        await ouvrir(); await expect.poll(async () => (await lire()).voyageurs[0].ecriture).toBeNull();
        expect((await lireFiche()).sheetData).toMatchObject({ reve_pts: 11, fatigue: 5 }); expect((await lireFiche()).sheetData[CLE_RECUS_TMR]).toHaveLength(3);
        expect((await lire()).voyageurs[0]).toMatchObject({ position: 'H4', present: false });
        await f.reload(); await attendreLHydratation(app); expect((await lireFiche()).sheetData).toMatchObject({ reve_pts: 11, fatigue: 5 });
    } finally { await ctx.close(); await app?.fermer(); fs.rmSync(dossier, { recursive: true, force: true }); }
});
