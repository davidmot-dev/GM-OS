import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import AdmZip from 'adm-zip';
import { lancerGmOs, attendreLHydratation, ouvrirLeModule, ongletDeLaFiche, carteDe } from './lancerGmOs';
import type { useSessionOSStore } from '../src/modules/session/useSessionOSStore';
type Fenetre = {useSessionOSStore: typeof useSessionOSStore};
const racine = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fichier = process.env.GMOS_PILOTE_RDD ?? path.join(racine, 'Export Dirvers/corriges/RDD_driver_gmos_r0-consolide.gmos-driver');
const sortie = path.join(racine, 'scratch/reve-de-dragon-r1/captures');
test.skip(!fs.existsSync(fichier), 'Export R0 requis ; uniquement des données fictives.');
test.use({channel:'msedge',locale:'fr-FR',timezoneId:'Europe/Brussels',serviceWorkers:'block'});

test('fatigue R1 : activation, dépense, jet, tablette et rechargement sans double comptage', async ({browser}) => {
    test.setTimeout(90_000);
    const pilote = JSON.parse(new AdmZip(fichier).readAsText('state.json'));
    const semence = JSON.parse(fs.readFileSync(path.join(racine,'e2e/donnees/campagne-de-demo.json'),'utf8'));
    const s = semence.modules.sessionOS;
    s.customGameDrivers = [pilote.gameDriver];s.customSheetTemplates = [pilote.sheetTemplate];
    s.campaigns = [{id:'r1',name:'Fatigue fictive — R1',system:pilote.gameDriver.id,description:'',activeLocationIds:[]}];
    s.activeCampaignId = 'r1';
    const valeurs = Object.fromEntries(pilote.sheetTemplate.sections.flatMap((g: {fields: {id:string;defaultValue:unknown}[]}) => g.fields).map((c: {id:string;defaultValue:unknown}) => [c.id,c.defaultValue]));
    s.players = [{id:'joueur-r1',realName:'Démonstration',avatarUrl:'',isOnline:false,characters:[{
        id:'voyageuse-r1',name:'Nitouche — fatigue fictive',portraitUrl:'',templateId:pilote.sheetTemplate.id,
        systemId:pilote.gameDriver.id,campaignId:'r1',hp:11,maxHp:11,
        sheetData:{...valeurs,taille:11,constitution:11,agilite:12,volonte:12,vie:11,vie_max:11,endurance:23,endurance_max:23,
            fatigue:11,__rddReprise231:1},
    }]}];
    const dossier = fs.mkdtempSync(path.join(os.tmpdir(),'gmos-rdd-r1-semence-'));
    const chemin = path.join(dossier,'semence.json');fs.writeFileSync(chemin,JSON.stringify(semence));
    fs.mkdirSync(sortie,{recursive:true});
    const app = await lancerGmOs({semence:chemin});
    try {
        const f = app.fenetre;
        f.on('pageerror',e => console.error('[R1]',e.message));
        await attendreLHydratation(app);
        const w = await app.application.browserWindow(f);
        await w.evaluate(w => {w.unmaximize();w.setContentSize(1440,1600);w.webContents.setAudioMuted(true);});
        await ouvrirLeModule(app,'Tableau de Bord');
        await f.evaluate(() => {
            const s = (window as unknown as Fenetre).useSessionOSStore.getState();
            s.setActiveCampaign('r1');s.setSelectedPlayer('joueur-r1');s.setSelectedCharacter('voyageuse-r1');s.setCurrentView('players');
        });
        const lire = () => f.evaluate(() => (window as unknown as Fenetre).useSessionOSStore.getState().players[0].characters[0]);
        // Les mécaniques du Voyageur sont dans l'onglet du test depuis le 2026-10-22.
        await ongletDeLaFiche(f,'Lancer un test');
        const fatigue = f.getByRole('region',{name:'Fatigue et état général'});
        await fatigue.getByRole('button',{name:'Activer le suivi de fatigue'}).click();
        await expect.poll(async () => (await lire()).sheetData.__rddFatigue231).toBe(1);
        expect((await lire()).sheetData.__rddAvantFatigue231).toMatchObject({fatigue:11,endurance:23});
        await fatigue.getByRole('button',{name:'Prévisualiser'}).click();
        expect((await lire()).sheetData.fatigue).toBe(11);
        await expect(fatigue.getByLabel('Aperçu du mouvement')).toContainText('11 → 12');
        await fatigue.getByRole('button',{name:'Appliquer le mouvement'}).click();
        await expect.poll(async () => (await lire()).sheetData.fatigue).toBe(12);
        await expect(fatigue).toContainText('État général -1');
        await ongletDeLaFiche(f,'Formulaire');
        await f.locator('input#endurance').fill('20');
        await f.getByRole('button',{name:/Sauvegarder/i}).first().click();
        await expect.poll(async () => (await lire()).sheetData.fatigue).toBe(15);
        await f.locator('input#vie').fill('8');
        await f.getByRole('button',{name:/Sauvegarder/i}).first().click();
        await ongletDeLaFiche(f,'Lancer un test');
        await expect(fatigue).toContainText('État général -4');
        const jet = f.getByRole('region',{name:'Jet du Voyageur'});
        await jet.locator('select').nth(0).selectOption('agilite');
        await jet.locator('select').nth(1).selectOption('discretion');
        await expect(jet).toContainText('54 %');
        await jet.getByLabel('Nature du jet').selectOption('chance');
        await expect(jet).toContainText('50 %');
        await jet.getByLabel('Nature du jet').selectOption('action');
        await expect(jet).toContainText('54 %');
        await jet.getByRole('button',{name:'Lancer',exact:true}).click();
        await expect(jet.getByLabel('Dernier jet du Voyageur')).toContainText('seuil 54');
        await jet.screenshot({path:path.join(sortie,'jet-etat-mj.jpg')});
        await carteDe(fatigue).screenshot({path:path.join(sortie,'fatigue-mj.jpg')});
        await f.reload();await attendreLHydratation(app);
        expect((await lire()).sheetData).toMatchObject({fatigue:15,endurance:20,vie:8,__rddFatigue231:1});
        await f.evaluate(() => {
            const s = (window as unknown as Fenetre).useSessionOSStore;
            s.setState(etat => ({sessions:[{...etat.sessions[0],id:'seance-r1',campaignId:'r1',status:'active',sessionEntityIds:['voyageuse-r1'],publicSummary:''}]}));
        });
        const contexte = await browser.newContext({viewport:{width:820,height:1180}});
        try {
            await contexte.addInitScript(() => localStorage.setItem('gmos-tablet-uuid','rdd-r1-tablette'));
            const tablette = await contexte.newPage();
            await tablette.route('**/*', route => {const u = new URL(route.request().url());return u.hostname==='127.0.0.1'||['data:','blob:'].includes(u.protocol)?route.continue():route.abort();});
            await tablette.goto(`http://127.0.0.1:${app.ports.sync}/?window=tablet&sync=${app.ports.sync}`);
            await tablette.getByRole('button',{name:/Nitouche — fatigue fictive/}).click();
            await expect(tablette.getByText('Connecté',{exact:true})).toBeVisible();
            await tablette.getByTitle('Fiche Personnage',{exact:true}).click();
            await ongletDeLaFiche(tablette,'Lancer un test');
            const fatigueT = tablette.getByRole('region',{name:'Fatigue et état général'});
            await expect(fatigueT).toContainText('15 / 46');
            await fatigueT.getByLabel('Effort ou récupération').selectOption('endurance');
            await fatigueT.getByLabel('Quantité',{exact:true}).fill('2');
            await fatigueT.getByRole('button',{name:'Prévisualiser'}).click();
            await fatigueT.getByRole('button',{name:'Appliquer le mouvement'}).click();
            await expect.poll(async () => (await lire()).sheetData.endurance).toBe(18);
            await expect.poll(async () => (await lire()).sheetData.fatigue).toBe(17);
            expect((await lire()).sheetData.__rddMouvementsFatigue).toHaveLength(2);
            await tablette.setViewportSize({width:360,height:900});
            for (const nom of ['Fatigue et état général','Jet du Voyageur']) {
                const panneau = tablette.getByRole('region',{name:nom});
                expect(await panneau.evaluate(e => e.scrollWidth <= e.clientWidth + 1)).toBe(true);
            }
            await carteDe(tablette.getByRole('region',{name:'Fatigue et état général'})).screenshot({path:path.join(sortie,'fatigue-telephone.jpg')});
            await tablette.setViewportSize({width:820,height:1180});
            const jetT = tablette.getByRole('region',{name:'Jet du Voyageur'});
            await jetT.locator('select').nth(0).selectOption('agilite');
            await jetT.locator('select').nth(1).selectOption('discretion');
            await expect(jetT).toContainText('54 %');
            await jetT.getByRole('button',{name:'Lancer',exact:true}).click();
            await expect(jetT.getByLabel('Dernier jet du Voyageur')).toContainText('seuil 54');
            await expect.poll(() => f.evaluate(() => {
                const d = JSON.parse(localStorage.getItem('gmos-dice-storage') ?? '{}');
                return d.state?.lastRoll?.title ?? '';
            })).toContain('Nitouche — fatigue fictive');
            expect(await f.evaluate(() => JSON.parse(localStorage.getItem('gmos-dice-storage')!).state.lastRoll.totalDisplay)).toContain('seuil 54');
            await jetT.screenshot({path:path.join(sortie,'jet-etat-tablette.jpg')});
            await carteDe(fatigueT).screenshot({path:path.join(sortie,'fatigue-tablette.jpg')});
            await tablette.reload();
            await expect(tablette.getByText('Connecté',{exact:true})).toBeVisible();
            await tablette.getByTitle('Fiche Personnage',{exact:true}).click();
            await ongletDeLaFiche(tablette,'Lancer un test');
            await expect(tablette.getByRole('region',{name:'Fatigue et état général'})).toContainText('17 / 46');
            await expect.poll(async () => (await lire()).sheetData.fatigue).toBe(17);
            expect((await lire()).sheetData.__rddMouvementsFatigue).toHaveLength(2);
        } finally {await contexte.close();}
    } finally {await app.fermer();}
});
