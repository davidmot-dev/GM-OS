import {test,expect} from '@playwright/test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import AdmZip from 'adm-zip';
import {lancerGmOs,attendreLHydratation,ouvrirLeModule,ongletDeLaFiche,carteDe} from './lancerGmOs';
import {initialiserSanteVoyageur} from '../src/modules/session/logic/santeDuVoyageur';
import type {useSessionOSStore} from '../src/modules/session/useSessionOSStore';
import type {useCombatStore} from '../src/modules/combat/useCombatStore';

/**
 * **Rêve de Dragon fini** — 24/10/2026. Le pilote 2.0.0 (round en sept phases),
 * la carte Haut-Rêve, la famine et les potions du Château Dormant, l'entraînement.
 * Personnages fictifs ; les captures vont au manuel après relecture.
 */
type Fenetre = {useSessionOSStore:typeof useSessionOSStore;useCombatStore:typeof useCombatStore};
const racine = path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const fichier = path.join(racine,'Export Dirvers/corriges/RDD_driver_gmos_finir.gmos-driver');
const sortie = path.join(racine,'scratch/rdd-finir/captures');
test.skip(!fs.existsSync(fichier),'Pilote 2.0.0 requis (outils/reve-de-dragon/finir_reve_de_dragon.py).');
test.use({channel:'msedge',locale:'fr-FR',timezoneId:'Europe/Brussels',serviceWorkers:'block'});
test('Rêve de Dragon 2.0.0 : phases du round, Haut-Rêve, famine, potions, entraînement',async ()=>{
    test.setTimeout(180000);
    const pilote = JSON.parse(new AdmZip(fichier).readAsText('state.json'));
    const semence = JSON.parse(fs.readFileSync(path.join(racine,'e2e/donnees/campagne-de-demo.json'),'utf8'));
    const s = semence.modules.sessionOS;
    s.customGameDrivers = [pilote.gameDriver];s.customSheetTemplates = [pilote.sheetTemplate];
    s.campaigns = [{id:'rdd2',name:'Rêve fini, campagne fictive',system:pilote.gameDriver.id,description:'',activeLocationIds:[]}];s.activeCampaignId='rdd2';
    s.sessions = [{...s.sessions[0],id:'srdd2',campaignId:'rdd2',status:'active',sessionEntityIds:['nitouche']}];
    const valeurs = Object.fromEntries(pilote.sheetTemplate.sections.flatMap((x:{fields:{id:string;defaultValue:unknown}[]})=>x.fields).map((f:{id:string;defaultValue:unknown})=>[f.id,f.defaultValue]));
    const donnees = initialiserSanteVoyageur({...valeurs,taille:9,constitution:12,force:9,agilite:13,dexterite:13,vue:12,volonte:12,empathie:13,
        melee:11,tir:12,lancer:10,dague_jet:0,dague_melee:1,epee_1m:0,arc:2,acrobatie:1,
        vie:11,vie_max:11,endurance:23,endurance_max:23,fatigue:0,sc:4,sust:2,reve:15,reve_pts:13,reve_seuil:15,onrios:-2,hypnos:3,narcos:1,thanatos:-11,
        spells_0_path:'Hypnos',spells_0_name:'Invocation du Guerrier Sorde',spells_0_tmr:'Cité Sordide (D13)',spells_0_difficulty:-8,spells_0_dreamCost:7,
        spells_1_path:'Hypnos',spells_1_name:'Tympan d’Hypnos',spells_1_tmr:'Collines d’Encre (J4)',spells_1_difficulty:-5,spells_1_dreamCost:2,spells_1_cellBonus:'8',
        route_food:1,route_water:10,__rddReprise231:1,__rddFatigue231:1});
    s.players=[{id:'jrdd',realName:'Démonstration',avatarUrl:'',isOnline:false,characters:[{id:'nitouche',name:'Nitouche — haut-rêvante fictive',portraitUrl:'',
        campaignId:'rdd2',systemId:pilote.gameDriver.id,templateId:pilote.sheetTemplate.id,hp:11,maxHp:11,sheetData:donnees}]}];
    const dossier=fs.mkdtempSync(path.join(os.tmpdir(),'gmos-rdd2-semence-')),semenceFichier=path.join(dossier,'semence.json');
    fs.writeFileSync(semenceFichier,JSON.stringify(semence));fs.mkdirSync(sortie,{recursive:true});
    const app=await lancerGmOs({semence:semenceFichier});
    try {
        await attendreLHydratation(app);const f=app.fenetre;
        const cadre=await app.application.browserWindow(f);await cadre.evaluate(w=>{w.unmaximize();w.setContentSize(1440,1800);});
        const lire=()=>f.evaluate(()=>(window as unknown as Fenetre).useSessionOSStore.getState().players[0].characters[0].sheetData);
        const photo=(l:ReturnType<typeof f.locator>,nom:string)=>l.screenshot({path:path.join(sortie,`${nom}.jpg`),type:'jpeg',quality:85});

        // Le round en sept phases : Nitouche lance sa dague, un Groin fonce à la masse.
        await f.evaluate(()=>{const c=(window as unknown as Fenetre).useCombatStore.getState();c.clearCombatants();
            c.addCombatant({name:'Nitouche',init:0,isPlayer:true,faction:'player',statuses:[],sourcePlayerId:'nitouche'});
            c.addCombatant({name:'Groin',init:0,isPlayer:false,faction:'enemy',statuses:[]});});
        await ouvrirLeModule(app,'Combat-OS');
        const round=f.getByRole('region',{name:'Round de Rêve de Dragon'});
        await expect(round).toBeVisible({timeout:15000});
        await round.getByLabel('Arme de la fiche de Nitouche',{exact:true}).selectOption('Dague de jet');
        await round.getByLabel('Arme de la fiche de Groin',{exact:true}).selectOption('__autre');
        await round.getByLabel('Arme de Groin',{exact:true}).fill('Masse');
        await round.getByLabel('Facteur de Groin',{exact:true}).fill('8');
        await round.getByRole('button',{name:/Tirer l’initiative/}).click();
        await expect(round.getByText('Phase 2 — Magie',{exact:true})).toBeVisible();
        await round.getByLabel('Phase suivante').click();await round.getByLabel('Phase suivante').click();
        await expect(round.getByText('Phase 4 — Lancers',{exact:true})).toBeVisible();
        const plateau=await f.evaluate(()=>(window as unknown as Fenetre).useCombatStore.getState().combatants.map(c=>c.name));
        expect(plateau).toEqual(['Nitouche','Groin']);
        await photo(round,'jeu-reves-de-dragons-phases');

        // La fiche : l'onglet du test porte la carte Haut-Rêve.
        await ouvrirLeModule(app,'Tableau de Bord');
        await f.evaluate(()=>{const s=(window as unknown as Fenetre).useSessionOSStore.getState();s.setSelectedPlayer('jrdd');s.setSelectedCharacter('nitouche');s.setCurrentView('players');});
        await ongletDeLaFiche(f,'Lancer un test');
        const hr=f.getByRole('region',{name:'Haut-Rêve RdD'});
        const valider=async (p:typeof hr)=>{await p.getByRole('button',{name:'Valider cette opération',exact:true}).click();await expect(p.getByLabel('Aperçu de l’opération RdD')).toHaveCount(0);};
        await expect(hr).toBeVisible({timeout:15000});
        await hr.getByText('Rencontre en TMR',{exact:true}).click();
        await hr.getByLabel('Genre de terre',{exact:true}).selectOption('desert');
        await hr.getByLabel('d100 des rencontres',{exact:true}).fill('55');
        await hr.getByLabel('Force de la rencontre',{exact:true}).fill('9');
        await hr.getByLabel('d100 de maîtrise',{exact:true}).fill('42');
        await hr.getByRole('button',{name:'Préparer la rencontre',exact:true}).click();
        await expect(hr.getByLabel('Aperçu de l’opération RdD')).toContainText('26 %');
        await photo(carteDe(hr),'jeu-reves-de-dragons-haut-reve');
        await valider(hr);

        // Un Rêve de Dragon refoulé, puis une queue décidée et tirée.
        await hr.getByLabel('d20 du test de refoulement',{exact:true}).fill('15');
        await hr.getByLabel('Rencontre imposée',{exact:true}).selectOption('reve-de-dragon');
        await hr.getByLabel('Force de la rencontre',{exact:true}).fill('11');
        await hr.getByLabel('Choix face à la rencontre',{exact:true}).selectOption('refouler');
        await hr.getByRole('button',{name:'Préparer la rencontre',exact:true}).click();await valider(hr);
        await expect.poll(async()=>(await lire())!.magic_repression).toBe('2');
        await hr.getByText('Noter un effet de Dragon décidé par le meneur',{exact:true}).click();
        await hr.getByLabel('Origine de l’effet',{exact:true}).fill('Rêve de Dragon non maîtrisé');
        await hr.getByRole('button',{name:'Noter l’effet à tirer',exact:true}).click();await valider(hr);
        await hr.getByLabel('d100 de la table',{exact:true}).fill('90');
        await hr.getByLabel('d20 du désir ou de l’idée fixe',{exact:true}).fill('17');
        await hr.getByRole('button',{name:/Tirer : queue de Dragon/}).click();await valider(hr);
        await expect.poll(async()=>String((await lire())!.magic_dragonEffects)).toContain('Idée fixe — Faire le mort');

        // Le sort : Tympan d'Hypnos depuis sa case, bonus de case compris.
        await hr.getByText('Lancer un sort',{exact:true}).click();
        await hr.getByLabel('Sort à lancer',{exact:true}).selectOption({label:'Tympan d’Hypnos — Hypnos, R-5, r2, +8 %'});
        await hr.getByLabel('d100 du lancer',{exact:true}).fill('30');
        await hr.getByRole('button',{name:'Préparer le lancer',exact:true}).click();
        await expect(hr.getByLabel('Aperçu de l’opération RdD')).toContainText('68 %');
        await photo(carteDe(hr),'jeu-reves-de-dragons-sort');
        await valider(hr);
        expect(await lire()).toMatchObject({reve_pts:11,spells_1_cellBonus:'9'});

        // Le Château Dormant : une potion suivie, la famine d'une journée maigre.
        const repos=f.getByRole('region',{name:'Repos et Château Dormant RdD'});
        await repos.getByRole('button',{name:'Préparer le suivi du repos',exact:true}).click();await valider(repos);
        await repos.getByText(/Potions et enchantements non permanents/).click();
        await repos.getByLabel('Nom de l’enchantement',{exact:true}).fill('Potion de soins');
        await repos.getByLabel('Rêve de l’enchantement',{exact:true}).fill('3');
        await repos.getByRole('button',{name:'Suivre cet enchantement',exact:true}).click();await valider(repos);
        await repos.getByText('Bilan de fin du Château Dormant',{exact:true}).click();
        await repos.getByLabel('Nuit ou date de jeu (unique)',{exact:true}).fill('5 Dragon');
        await repos.getByLabel('Autres opérations nocturnes vérifiées (effets de scénario, souffles en cours)',{exact:true}).check();
        await repos.getByLabel(/Compter la famine et la soif/).check();
        await repos.getByLabel('d20 de moral au matin',{exact:true}).fill('11');
        await repos.getByRole('button',{name:'Prévisualiser le bilan de nuit',exact:true}).click();
        await expect(repos.getByLabel('Aperçu de l’opération RdD')).toContainText('Famine');
        await photo(carteDe(repos),'jeu-reves-de-dragons-famine');
        await valider(repos);
        expect(await lire()).toMatchObject({endurance:22,route_food:0});

        // Une heure d'entraînement en Acrobatie.
        const prog=f.getByRole('region',{name:'Progression et Archétype RdD'});
        await prog.getByText('Répartir et progresser',{exact:true}).click();
        await prog.getByLabel('Valeur de progression',{exact:true}).selectOption('acrobatie');
        await prog.getByText('Une heure d’entraînement',{exact:true}).click();
        await prog.getByLabel('Caractéristique de l’entraînement',{exact:true}).selectOption('agilite');
        await prog.getByLabel('d6 d’entraînement',{exact:true}).fill('3');
        await prog.getByLabel('Jets d’entraînement',{exact:true}).fill('5 40 99');
        await prog.getByRole('button',{name:'Préparer l’entraînement',exact:true}).click();
        await expect(prog.getByLabel('Aperçu de l’opération RdD')).toContainText('ajustement final -1');
        await photo(carteDe(prog),'jeu-reves-de-dragons-entrainement');
        await valider(prog);
    } finally {await app.fermer();fs.rmSync(dossier,{recursive:true,force:true});}
});
