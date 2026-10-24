import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import AdmZip from 'adm-zip';
import { lancerGmOs, attendreLHydratation, ouvrirLeModule, ongletDeLaFiche, carteDe } from './lancerGmOs';
import type { useSessionOSStore } from '../src/modules/session/useSessionOSStore';
import type { useCombatStore } from '../src/modules/combat/useCombatStore';
import type { useJournalStore } from '../src/modules/journal/useJournalStore';
type Fenetre = {useSessionOSStore:typeof useSessionOSStore;useCombatStore:typeof useCombatStore;useJournalStore:typeof useJournalStore};
const racine = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fichier = process.env.GMOS_PILOTE_RDD ?? path.join(racine,'Export Dirvers/corriges/RDD_driver_gmos_r0-consolide.gmos-driver');
const sortie = path.join(racine,'scratch/reve-de-dragon-r2/captures');
test.skip(!fs.existsSync(fichier),'Pilote R0 requis ; aucun accès aux données personnelles.');
test.use({channel:'msedge',locale:'fr-FR',timezoneId:'Europe/Brussels',serviceWorkers:'block'});

test('R2 : encaisser, sonné, soins, critique sur tablette et coma dans Combat-OS',async ({browser}) => {
    test.setTimeout(120_000);
    const pilote = JSON.parse(new AdmZip(fichier).readAsText('state.json'));
    const semence = JSON.parse(fs.readFileSync(path.join(racine,'e2e/donnees/campagne-de-demo.json'),'utf8'));
    const s = semence.modules.sessionOS;
    s.customGameDrivers = [pilote.gameDriver];s.customSheetTemplates = [pilote.sheetTemplate];
    s.campaigns = [{id:'r2',name:'Blessures fictives — R2',system:pilote.gameDriver.id,description:'',activeLocationIds:[]}];s.activeCampaignId = 'r2';
    const defauts = Object.fromEntries(pilote.sheetTemplate.sections.flatMap((g:{fields:{id:string;defaultValue:unknown}[]}) => g.fields).map((f:{id:string;defaultValue:unknown}) => [f.id,f.defaultValue]));
    s.players = [{id:'joueur-r2',realName:'Démonstration',avatarUrl:'',isOnline:false,characters:[{
        id:'brucelin-r2',name:'Brucelin — blessures fictives',portraitUrl:'',templateId:pilote.sheetTemplate.id,
        systemId:pilote.gameDriver.id,campaignId:'r2',hp:14,maxHp:14,
        sheetData:{...defauts,taille:13,constitution:15,force:13,agilite:12,volonte:12,vie:14,vie_max:14,endurance:28,endurance_max:28,
            sc:5,fatigue:0,__rddReprise231:1,__rddFatigue231:1},
    }]}];
    const dossier = fs.mkdtempSync(path.join(os.tmpdir(),'gmos-rdd-r2-'));
    const chemin = path.join(dossier,'semence.json');fs.writeFileSync(chemin,JSON.stringify(semence));fs.mkdirSync(sortie,{recursive:true});
    const app = await lancerGmOs({semence:chemin});
    try {
        const f = app.fenetre;
        f.on('pageerror',e => console.error('[R2]',e.message));
        await attendreLHydratation(app);
        const w = await app.application.browserWindow(f);
        await w.evaluate(w => {w.unmaximize();w.setContentSize(1440,1800);w.webContents.setAudioMuted(true);});
        await ouvrirLeModule(app,'Tableau de Bord');
        await f.evaluate(() => {
            const w = window as unknown as Fenetre;const s = w.useSessionOSStore.getState();
            s.setActiveCampaign('r2');s.setSelectedPlayer('joueur-r2');s.setSelectedCharacter('brucelin-r2');s.setCurrentView('players');
            w.useJournalStore.getState().startJournal({id:'r2',nom:'Blessures fictives'},'Essai isolé R2');
            w.useCombatStore.getState().addCombatant({name:'Brucelin — blessures fictives',init:12,isPlayer:true,faction:'player',sourcePlayerId:'brucelin-r2',statuses:[]});
        });
        const lire = () => f.evaluate(() => (window as unknown as Fenetre).useSessionOSStore.getState().players[0].characters[0]);
        // Les mécaniques du Voyageur sont dans l'onglet du test depuis le 2026-10-22.
        await ongletDeLaFiche(f,'Lancer un test');
        const sante = f.getByRole('region',{name:'Blessures et encaissement RdD'});
        await sante.getByRole('button',{name:'Activer le suivi des blessures'}).click();
        await sante.getByText('Encaisser une agression',{exact:true}).click();
        const desTable = sante.getByLabel('Dés de table déjà tirés (facultatif, dans l’ordre)');
        await desTable.fill('7, 6, 5, 5');
        await sante.getByLabel('Bonus aux dommages',{exact:true}).fill('7');
        await sante.getByLabel('Protection',{exact:true}).fill('2');
        await sante.getByRole('button',{name:'Tirer et prévisualiser l’encaissement'}).click();
        await expect(sante.getByLabel('Aperçu de santé')).toContainText('18 : grave');
        expect((await lire()).hp).toBe(14);
        await sante.getByRole('button',{name:'Appliquer les conséquences'}).click();
        await expect.poll(async () => (await lire()).sheetData.endurance).toBe(18);
        expect(await lire()).toMatchObject({hp:12,sheetData:{vie:12,fatigue:10}});
        await desTable.fill('20');
        await sante.getByRole('button',{name:/Tirer le jet d’endurance requis/}).click();
        await sante.getByRole('button',{name:'Appliquer les conséquences'}).click();
        await expect(sante).toContainText('Sonné');
        await expect(f.getByRole('region',{name:'Jet du Voyageur'})).toContainText('significative exigée');
        await desTable.fill('1');
        await sante.getByRole('button',{name:'Préparer la fin du round de santé'}).click();
        await sante.getByRole('button',{name:'Appliquer les conséquences'}).click();
        await expect.poll(async () => (await lire()).sheetData.endurance).toBe(17);
        await sante.getByRole('button',{name:'Préparer la fin du round de santé'}).click();
        await sante.getByRole('button',{name:'Appliquer les conséquences'}).click();
        await expect(sante).toContainText('Round de santé 3');
        await sante.getByText('Blessures et soins (1)',{exact:true}).click();
        const b = (await lire()).sheetData.__rddSante231 as {blessures:{id:string}[]};
        await sante.getByLabel('Blessure à soigner',{exact:true}).selectOption(b.blessures[0].id);
        await sante.getByLabel('Résultat du jet de soins').selectOption('reussite-particuliere');
        await sante.getByRole('button',{name:'Proposer les premiers soins'}).click();
        await sante.getByRole('button',{name:'Appliquer les conséquences'}).click();
        await sante.getByRole('button',{name:'Préparer la fin du round de santé'}).click();
        await sante.getByRole('button',{name:'Appliquer les conséquences'}).click();
        await sante.getByLabel('Résultat du jet de soins').selectOption('reussite-normale');
        await sante.getByRole('button',{name:'Proposer les premiers soins'}).click();
        await sante.getByRole('button',{name:'Appliquer les conséquences'}).click();
        await sante.getByRole('button',{name:'Proposer les soins complets'}).click();
        await sante.getByRole('button',{name:'Appliquer les conséquences'}).click();
        await expect(sante).toContainText('soins complets, bonus guérison +1');
        await carteDe(sante).screenshot({path:path.join(sortie,'blessures-et-soins-mj.jpg')});
        await f.evaluate(() => {
            const s = (window as unknown as Fenetre).useSessionOSStore;
            s.setState(etat => ({sessions:[{...etat.sessions[0],id:'seance-r2',campaignId:'r2',status:'active',sessionEntityIds:['brucelin-r2'],publicSummary:''}]}));
        });
        const contexte = await browser.newContext({viewport:{width:820,height:1180}});
        try {
            await contexte.addInitScript(() => localStorage.setItem('gmos-tablet-uuid','rdd-r2-tablette'));
            const tablette = await contexte.newPage();
            await tablette.route('**/*',route => {const u = new URL(route.request().url());return u.hostname === '127.0.0.1'||['data:','blob:'].includes(u.protocol)?route.continue():route.abort();});
            await tablette.goto(`http://127.0.0.1:${app.ports.sync}/?window=tablet&sync=${app.ports.sync}`);
            await tablette.getByRole('button',{name:/Brucelin — blessures fictives/}).click();
            await expect(tablette.getByText('Connecté',{exact:true})).toBeVisible();
            await tablette.getByTitle('Fiche Personnage',{exact:true}).click();
            await ongletDeLaFiche(tablette,'Lancer un test');
            const st = tablette.getByRole('region',{name:'Blessures et encaissement RdD'});
            await st.getByText('Encaisser une agression',{exact:true}).click();
            await st.getByLabel('Dés de table déjà tirés (facultatif, dans l’ordre)').fill('10, 10');
            await st.getByLabel('Bonus aux dommages',{exact:true}).fill('2');
            await st.getByRole('button',{name:'Tirer et prévisualiser l’encaissement'}).click();
            await expect(st.getByLabel('Aperçu de santé')).toContainText('22 : critique');
            await st.getByRole('button',{name:'Appliquer les conséquences'}).click();
            await expect.poll(async () => (await lire()).sheetData.endurance).toBe(0);
            expect(await lire()).toMatchObject({hp:6,healthSystem:{state:'critical',data:{rdd:{inconscient:true,mort:false}}}});
            await expect(tablette.getByRole('region',{name:'Jet du Voyageur'}).getByRole('button',{name:'Lancer',exact:true})).toBeDisabled();
            await carteDe(st).screenshot({path:path.join(sortie,'critique-tablette.jpg')});
            await tablette.setViewportSize({width:360,height:900});
            expect(await st.evaluate(e => e.scrollWidth <= e.clientWidth+1)).toBe(true);
            await carteDe(st).screenshot({path:path.join(sortie,'critique-telephone.jpg')});
            const historique = (await lire()).sheetData.__rddHistoriqueSante231;
            await tablette.reload();
            await expect(tablette.getByText('Connecté',{exact:true})).toBeVisible();
            expect((await lire()).sheetData.__rddHistoriqueSante231).toEqual(historique);
            expect((await lire()).hp).toBe(6);
        } finally {await contexte.close();}
        await expect.poll(() => f.evaluate(() => {
            const j = (window as unknown as Fenetre).useJournalStore.getState();
            return j.journals.find(x => x.id === j.activeJournalId)?.events.filter(e => e.title.includes('Encaisser')).length;
        })).toBe(2);
        await ouvrirLeModule(app,'Combat-OS');
        await f.getByRole('button',{name:'Encaisser / soins RdD'}).first().click();
        const modal = f.getByRole('region',{name:'Blessures et encaissement RdD'});
        await expect(modal).toContainText('Inconscient');
        await modal.screenshot({path:path.join(sortie,'sante-combat-os.jpg')});
        await f.keyboard.press('Escape');
        await f.evaluate(() => (window as unknown as Fenetre).useSessionOSStore.getState().updateCharacterHP('joueur-r2','brucelin-r2',0));
        await expect.poll(() => f.evaluate(() => (window as unknown as Fenetre).useCombatStore.getState().combatants.find(c => c.sourcePlayerId === 'brucelin-r2')?.healthSystem?.data.rdd)).toMatchObject({coma:true,mort:false});
        expect(await f.evaluate(() => {
            const j = (window as unknown as Fenetre).useJournalStore.getState();
            return j.journals.find(x => x.id === j.activeJournalId)?.events.filter(e => e.title.startsWith('Décès :')).length;
        })).toBe(0);
        await f.evaluate(donnees => {
            (window as unknown as Fenetre).useCombatStore.getState().addCombatant({name:'Adversaire autonome fictif',init:0,
                isPlayer:false,faction:'enemy',hp:14,hpMax:14,statuses:[],sheetData:donnees});
        },semence.modules.sessionOS.players[0].characters[0].sheetData);
        await f.locator('[data-combattant]').filter({hasText:'Adversaire autonome fictif'}).getByRole('button',{name:'Encaisser / soins RdD'}).click();
        const autonome = f.getByRole('region',{name:'Blessures et encaissement RdD'});
        await autonome.getByRole('button',{name:'Activer le suivi des blessures'}).click();
        await autonome.getByText('Encaisser une agression',{exact:true}).click();
        await autonome.getByLabel('Dés de table déjà tirés (facultatif, dans l’ordre)').fill('4, 4, 2');
        await autonome.getByRole('button',{name:'Tirer et prévisualiser l’encaissement'}).click();
        await autonome.getByRole('button',{name:'Appliquer les conséquences'}).click();
        await expect.poll(() => f.evaluate(() => (window as unknown as Fenetre).useCombatStore.getState().combatants.find(c => c.name === 'Adversaire autonome fictif')?.sheetData?.endurance)).toBe(26);
        expect(await f.evaluate(() => {
            const j = (window as unknown as Fenetre).useJournalStore.getState();
            return j.journals.find(x => x.id === j.activeJournalId)?.events.filter(e => e.title.includes('Adversaire autonome fictif') && e.title.includes('Encaisser')).length;
        })).toBe(1);
        // Le Haut-Rêve d'un adversaire (2026-10-24) : une Fleur maîtrisée s'écrit sur sa fiche de combat.
        const reveDeLAdversaire = () => f.evaluate(() => Number((window as unknown as Fenetre).useCombatStore.getState().combatants.find(c => c.name === 'Adversaire autonome fictif')?.sheetData?.reve_pts));
        const reveAvant = await reveDeLAdversaire();
        const hautReve = f.getByRole('region',{name:'Haut-Rêve RdD'});
        await hautReve.getByText('Rencontre en TMR',{exact:true}).click();
        await hautReve.getByLabel('Genre de terre',{exact:true}).selectOption('cite');
        await hautReve.getByLabel('d100 des rencontres',{exact:true}).fill('55');
        await hautReve.getByLabel('Force de la rencontre',{exact:true}).fill('3');
        await hautReve.getByLabel('d100 de maîtrise',{exact:true}).fill('1');
        await hautReve.getByRole('button',{name:'Préparer la rencontre',exact:true}).click();
        await hautReve.getByRole('button',{name:'Valider cette opération',exact:true}).click();
        await expect.poll(reveDeLAdversaire).toBe(reveAvant+3);
        await f.keyboard.press('Escape');
        await f.reload();await attendreLHydratation(app);
        expect((await lire()).sheetData.vie).toBe(0);
        expect((await lire()).healthSystem?.data.rdd).toMatchObject({coma:true,mort:false});
        expect(await f.evaluate(() => (window as unknown as Fenetre).useCombatStore.getState().combatants.find(c => c.name === 'Adversaire autonome fictif')?.sheetData?.endurance)).toBe(26);
    } finally {await app.fermer();}
});
