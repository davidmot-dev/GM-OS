import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import AdmZip from 'adm-zip';
import { lancerGmOs, attendreLHydratation, ouvrirLeModule, ongletDeLaFiche } from './lancerGmOs';
import type { useSessionOSStore } from '../src/modules/session/useSessionOSStore';

const racine = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fichier = process.env.GMOS_PILOTE_RDD ?? path.join(racine, 'Export Dirvers/corriges/RDD_driver_gmos_r0-consolide.gmos-driver');
const sortie = path.join(racine, 'scratch/reve-de-dragon-r0/captures');
type Fenetre = {useSessionOSStore: typeof useSessionOSStore};
test.skip(!fs.existsSync(fichier), 'Export consolidé du pilote RdD requis, aucune donnée personnelle lue.');
test.use({channel: 'msedge', locale: 'fr-FR', timezoneId: 'Europe/Brussels', serviceWorkers: 'block'});

test('reprendre un ancien Voyageur, modifier ses caractéristiques et relire sa fiche', async ({browser}) => {
    test.setTimeout(90_000);
    const pilote = JSON.parse(new AdmZip(fichier).readAsText('state.json'));
    const semence = JSON.parse(fs.readFileSync(path.join(racine, 'e2e/donnees/campagne-de-demo.json'), 'utf8'));
    const s = semence.modules.sessionOS;
    s.customGameDrivers = [pilote.gameDriver];s.customSheetTemplates = [pilote.sheetTemplate];
    s.campaigns = [{id: 'rdd-r0', name: 'Voyageur fictif — R0', system: pilote.gameDriver.id, description: '', activeLocationIds: []}];
    s.activeCampaignId = 'rdd-r0';
    s.players = [{id: 'joueur-r0', realName: 'Démonstration', avatarUrl: '', isOnline: false, characters: [
        {id: 'ancien-r0', name: 'Aldaran — ancien Voyageur', portraitUrl: '', templateId: pilote.sheetTemplate.id,
            systemId: pilote.gameDriver.id, campaignId: 'rdd-r0', hp: 9, maxHp: 22,
            sheetData: {taille: 11, constitution: 11, force: 9, agilite: 12, vue: 10, dexterite: 12, volonte: 12, reve: 15,
                vie: 9, points_de_vie: 6, endurance: 8, reve_pts: 17, reve_pts_max: 12, chance: 10, points_de_chance: 3,
                melee: 4, tir: 11, sc: 4, sust: 2, plus_dom: '0', enc: '9.0', heure_naissance: 'Le Dragon',
                memoire_vies_passees: 'Ancienne note à conserver.'}},
        {id: 'neuf-r0', name: 'Voyageuse neuve', portraitUrl: '', templateId: pilote.sheetTemplate.id,
            systemId: pilote.gameDriver.id, campaignId: 'rdd-r0', hp: 11, maxHp: 11,
            sheetData: Object.fromEntries(pilote.sheetTemplate.sections.flatMap((s: {fields: {id: string; defaultValue: unknown}[]}) => s.fields).map((c: {id: string; defaultValue: unknown}) => [c.id, c.defaultValue]))},
        {id: 'tablette-r0', name: 'Mira — reprise tablette', portraitUrl: '', templateId: pilote.sheetTemplate.id,
            systemId: pilote.gameDriver.id, campaignId: 'rdd-r0', hp: 5, maxHp: 22,
            sheetData: {taille: 11, constitution: 11, force: 15, points_de_vie: 5, points_de_reve: 18, reve_pts_max: 11}},
    ]}];
    const dossier = fs.mkdtempSync(path.join(os.tmpdir(), 'gmos-rdd-r0-semence-'));
    const chemin = path.join(dossier, 'semence.json');fs.writeFileSync(chemin, JSON.stringify(semence));
    fs.mkdirSync(sortie, {recursive: true});
    const app = await lancerGmOs({semence: chemin});
    try {
        app.fenetre.on('pageerror', e => console.error('[R0 renderer]', e.message));
        app.fenetre.on('console', m => {if (m.type() === 'error') console.error('[R0 console]', m.text());});
        await attendreLHydratation(app);
        const f = app.fenetre;
        const w = await app.application.browserWindow(f);
        await w.evaluate(w => {w.unmaximize();w.setContentSize(1440, 1600);w.webContents.setAudioMuted(true);});
        await ouvrirLeModule(app, 'Tableau de Bord');
        await f.evaluate(() => {
            const s = (window as unknown as Fenetre).useSessionOSStore.getState();
            s.setActiveCampaign('rdd-r0');s.setSelectedPlayer('joueur-r0');s.setSelectedCharacter('ancien-r0');s.setCurrentView('players');
        });
        const reprise = f.getByRole('region', {name: 'Reprise de la fiche Voyageur'});
        await expect(reprise).toBeVisible({timeout: 15_000});
        await reprise.screenshot({path: path.join(sortie, 'reprise-avant.jpg')});
        await reprise.getByRole('button', {name: 'Appliquer la reprise et les calculs'}).click();
        await expect(reprise.getByRole('alert')).toContainText('Choisir');
        await reprise.getByLabel(/Vie — ancienne fiche : 9/).check();
        await reprise.getByRole('button', {name: 'Appliquer la reprise et les calculs'}).click();
        await expect(reprise).toHaveCount(0);
        const lire = () => f.evaluate(() => (window as unknown as Fenetre).useSessionOSStore.getState().players[0].characters[0]);
        await expect.poll(async () => (await lire()).maxHp).toBe(11);
        let personnage = await lire();
        expect(personnage.sheetData).toMatchObject({melee: 10, vie: 9, vie_max: 11, endurance: 8, endurance_max: 23,
            reve_pts: 17, reve_seuil: 12, reve_eclatement: 36, chance: 10, points_de_chance: 3});
        expect(personnage.sheetData.__rddAvantReprise231).toMatchObject({points_de_vie: 6, melee: 4});
        await expect(f.locator('input#force')).toHaveCount(1);
        await f.locator('input#force').fill('15');
        await f.getByRole('button', {name: /Sauvegarder/i}).first().click();
        await expect.poll(async () => (await lire()).sheetData.melee).toBe(13);
        personnage = await lire();expect(personnage.sheetData).toMatchObject({force: 15, lancer: 13, vie: 9, endurance: 8});
        await ongletDeLaFiche(f, 'Lancer un test');
        const jet = f.locator('[data-panneau-de-jet]').first();
        await expect(jet).toBeVisible();
        await jet.locator('select').nth(0).selectOption('melee');
        await jet.locator('select').nth(1).selectOption('discretion');
        // Discrétion reste +3 dans le modèle exporté : Mêlée 13 à +3 = 84 % (plancher).
        await expect(jet).toContainText('84');
        await jet.screenshot({path: path.join(sortie, 'jeu-reves-de-dragons-jet.jpg')});
        await jet.getByRole('button', {name: 'Lancer', exact: true}).click();
        await jet.screenshot({path: path.join(sortie, 'jeu-reves-de-dragons-jet-lance.jpg')});
        await ongletDeLaFiche(f, 'Formulaire');
        await f.locator('body').screenshot({path: path.join(sortie, 'fiche-apres.jpg')});
        await f.evaluate(() => (window as unknown as Fenetre).useSessionOSStore.getState().setSelectedCharacter('neuf-r0'));
        await expect(reprise).toBeVisible();
        await expect(reprise.getByRole('group')).toHaveCount(0);
        await reprise.getByRole('button', {name: 'Appliquer la reprise et les calculs'}).click();
        await expect(reprise).toHaveCount(0);
        const neuve = await f.evaluate(() => (window as unknown as Fenetre).useSessionOSStore.getState().players[0].characters[1]);
        expect(neuve.sheetData).toMatchObject({melee: 10, vie: 11, endurance: 23, chance: 10, points_de_chance: 10,
            heure_naissance: 'Le Dragon'});
        await f.reload();await attendreLHydratation(app);
        await expect.poll(async () => (await lire()).sheetData.force).toBe(15);
        personnage = await lire();expect(personnage.sheetData).toMatchObject({melee: 13, reve_pts: 17, points_de_vie: 6});
        await f.evaluate(() => {
            const s = (window as unknown as Fenetre).useSessionOSStore;
            s.setState(etat => ({sessions: [{...etat.sessions[0], id: 'seance-rdd-r0', campaignId: 'rdd-r0', status: 'active',
                sessionEntityIds: ['ancien-r0', 'neuf-r0', 'tablette-r0'], publicSummary: ''}]}));
        });
        const contexte = await browser.newContext({viewport: {width: 820, height: 1180}});
        try {
            await contexte.addInitScript(() => localStorage.setItem('gmos-tablet-uuid', 'rdd-r0-tablette'));
            const tablette = await contexte.newPage();
            await tablette.route('**/*', route => {
                const url = new URL(route.request().url());
                return url.hostname === '127.0.0.1' || ['data:', 'blob:'].includes(url.protocol) ? route.continue() : route.abort();
            });
            await tablette.goto(`http://127.0.0.1:${app.ports.sync}/?window=tablet&sync=${app.ports.sync}`);
            await tablette.getByRole('button', {name: /Mira — reprise tablette/}).click();
            await expect(tablette.getByText('Connecté', {exact: true})).toBeVisible();
            await tablette.getByTitle('Fiche Personnage', {exact: true}).click();
            await expect(tablette.getByRole('heading', {name: 'Mira — reprise tablette', exact: true})).toBeVisible();
            const repriseTablette = tablette.getByRole('region', {name: 'Reprise de la fiche Voyageur'});
            await repriseTablette.getByRole('button', {name: 'Appliquer la reprise et les calculs'}).click();
            await expect(repriseTablette).toHaveCount(0);
            const lireMira = () => f.evaluate(() => (window as unknown as Fenetre).useSessionOSStore.getState().players[0].characters[2]);
            await expect.poll(async () => (await lireMira()).sheetData.__rddReprise231).toBe(1);
            expect(await lireMira()).toMatchObject({hp: 5, maxHp: 11,
                sheetData: {vie: 5, reve_pts: 18, reve_seuil: 11, reve_eclatement: 33, melee: 13,
                    __rddAvantReprise231: {points_de_vie: 5, points_de_reve: 18}}});
            await ongletDeLaFiche(tablette, 'Lancer un test');
            const jetTablette = tablette.locator('[data-panneau-de-jet]').first();
            await jetTablette.locator('select').nth(0).selectOption('melee');
            await jetTablette.locator('select').nth(1).selectOption('discretion');
            await expect(jetTablette).toContainText('84');
            await jetTablette.screenshot({path: path.join(sortie, 'jet-tablette.jpg')});
        } finally {await contexte.close();}
    } finally {await app.fermer();}
});
