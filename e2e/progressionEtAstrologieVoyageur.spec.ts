import {test,expect,type Page} from '@playwright/test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import AdmZip from 'adm-zip';
import {lancerGmOs,attendreLHydratation,ouvrirLeModule,ongletDeLaFiche,carteDe} from './lancerGmOs';
import {initialiserSanteVoyageur} from '../src/modules/session/logic/santeDuVoyageur';
import type {useSessionOSStore} from '../src/modules/session/useSessionOSStore';
import type {useClockStore} from '../src/store/useClockStore';
import type {useJournalStore} from '../src/modules/journal/useJournalStore';
type Fenetre={useSessionOSStore:typeof useSessionOSStore;useClockStore:typeof useClockStore;useJournalStore:typeof useJournalStore};
const racine=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const fichier=path.join(racine,'Export Dirvers/corriges/RDD_driver_gmos_r0-consolide.gmos-driver');
const sortie=path.join(racine,'scratch/reve-de-dragon-r567/captures');
test.skip(!fs.existsSync(fichier),'Export R0 requis, profils fictifs isolés.');
test.use({channel:'msedge',locale:'fr-FR',timezoneId:'Europe/Brussels',serviceWorkers:'block'});

test('R5–R7 : progression, recours, nuit et astrologie privée PC/deux tablettes',async({browser})=>{
    test.setTimeout(180000);
    const pilote=JSON.parse(new AdmZip(fichier).readAsText('state.json'));
    const semence=JSON.parse(fs.readFileSync(path.join(racine,'e2e/donnees/campagne-de-demo.json'),'utf8')),s=semence.modules.sessionOS;
    s.customGameDrivers=[pilote.gameDriver];s.customSheetTemplates=[pilote.sheetTemplate];
    s.campaigns=[{id:'r567',name:'Progression fictive',system:pilote.gameDriver.id,description:'',activeLocationIds:[],
        rddAstrologie:{version:1,origine:0,nombres:{0:2,1:3,2:4},observations:[],predictions:{b:[{jour:1,nombre:8}]}}}];s.activeCampaignId='r567';
    s.sessions=[{...s.sessions[0],id:'s567',campaignId:'r567',status:'active',sessionEntityIds:['a','b']}];
    const def=Object.fromEntries(pilote.sheetTemplate.sections.flatMap((s:{fields:{id:string;defaultValue:unknown}[]})=>s.fields).map((f:{id:string;defaultValue:unknown})=>[f.id,f.defaultValue]));
    const donnees=initialiserSanteVoyageur({...def,taille:12,constitution:12,volonte:12,agilite:12,discretion:3,navigation:0,intellect:12,astrologie:0,
        vie:12,vie_max:12,endurance:24,endurance_max:24,fatigue:0,sc:4,reve:15,reve_pts:16,reve_seuil:15,stress:40,moral:0,points_de_chance:9,points_de_destinee:2.4,__rddReprise231:1,__rddFatigue231:1,
        __rddRepos231:{version:1,jour:0,heuresDormies:1,dernierBilan:'',bilans:[],maladieOuPoison:false,vieApresJour:0,effets:[]}});
    s.players=['a','b'].map((id,i)=>({id:`j${id}`,realName:'Démonstration',avatarUrl:'',isOnline:false,characters:[{id,name:i?'Brucelin — astres fictifs':'Nitouche — progression fictive',portraitUrl:'',campaignId:'r567',systemId:pilote.gameDriver.id,templateId:pilote.sheetTemplate.id,hp:12,maxHp:12,sheetData:structuredClone(donnees)}]}));
    const dossier=fs.mkdtempSync(path.join(os.tmpdir(),'gmos-r567-')),fSemence=path.join(dossier,'semence.json');
    fs.writeFileSync(fSemence,JSON.stringify(semence));fs.mkdirSync(sortie,{recursive:true});
    const app=await lancerGmOs({semence:fSemence});const contextes=[];
    try{
        await attendreLHydratation(app);const f=app.fenetre;
        const cadre=await app.application.browserWindow(f);await cadre.evaluate(w=>{w.unmaximize();w.setContentSize(1440,1600);});
        await ouvrirLeModule(app,'Tableau de Bord');
        await f.evaluate(()=>{const w=window as unknown as Fenetre;w.useClockStore.setState({mode:'static',timestamp:14*3600000});const s=w.useSessionOSStore.getState();s.setSelectedPlayer('ja');s.setSelectedCharacter('a');s.setCurrentView('players');w.useJournalStore.getState().startJournal({id:'r567',nom:'Démonstration'},'Essai R5–R7');});
        const lire=()=>f.evaluate(()=>(window as unknown as Fenetre).useSessionOSStore.getState().players[0].characters[0].sheetData!);
        const region=(nom:string)=>f.getByRole('region',{name:nom,exact:true});
        const valider=async(p:ReturnType<typeof region>)=>{await p.getByRole('button',{name:'Valider cette opération',exact:true}).click();await expect(p.getByLabel('Aperçu de l’opération RdD')).toHaveCount(0);};
        // Les mécaniques du Voyageur sont dans l'onglet du test depuis le 2026-10-22.
        await ongletDeLaFiche(f,'Lancer un test');
        const repos=region('Repos et Château Dormant RdD'),prog=region('Progression et Archétype RdD'),recours=region('Chance destinée et moral RdD'),astro=region('Astrologie et heures draconiques RdD'),jet=region('Jet du Voyageur');
        await repos.getByText('Bilan de fin du Château Dormant',{exact:true}).click();
        await repos.getByLabel('Nuit ou date de jeu (unique)',{exact:true}).fill('5 Dragon');
        await repos.getByLabel('Famine traitée ou sans objet ; enchantements non permanents vérifiés',{exact:true}).check();
        await repos.getByLabel('d100 de stress',{exact:true}).fill('67');await repos.getByLabel('d20 de moral au matin',{exact:true}).fill('10');
        await repos.getByRole('button',{name:'Prévisualiser le bilan de nuit',exact:true}).click();await valider(repos);
        expect(await lire()).toMatchObject({stress:19,moral:1,points_de_chance:10,reve_pts:15});
        await prog.getByText('Répartir et progresser',{exact:true}).click();await prog.getByLabel('Valeur de progression',{exact:true}).selectOption('navigation');
        await prog.getByLabel('Potentiel de l’Archétype',{exact:true}).fill('1');await prog.getByRole('button',{name:'Reporter le potentiel',exact:true}).click();await valider(prog);
        await prog.getByLabel('Points de progression',{exact:true}).fill('20');await prog.getByRole('button',{name:'Allouer les XP de stress',exact:true}).click();await valider(prog);
        await prog.getByRole('button',{name:'Préparer l’augmentation d’un niveau',exact:true}).click();await valider(prog);
        expect((await lire()).navigation).toBe(1);await prog.getByText('Carnet d’expérience et potentiel',{exact:true}).click();
        await carteDe(prog).screenshot({path:path.join(sortie,'jeu-reves-de-dragons-progression.jpg'),type:'jpeg',quality:85});
        await jet.locator('select').nth(0).selectOption('agilite');await jet.locator('select').nth(1).selectOption('discretion');
        await jet.getByLabel('Engager le moral avant cette action admissible (+1)',{exact:true}).check();
        await f.evaluate(()=>{(window as unknown as {ancienHasard:()=>number}).ancienHasard=Math.random;Math.random=()=>0.99;});
        await jet.getByRole('button',{name:'Lancer',exact:true}).click();await f.evaluate(()=>{Math.random=(window as unknown as {ancienHasard:()=>number}).ancienHasard;});
        await valider(jet);expect((await lire()).moral).toBe(0);
        await recours.getByLabel('Dé du recours',{exact:true}).fill('1');await recours.getByRole('button',{name:'Préparer l’appel à la chance',exact:true}).click();await valider(recours);
        expect((await lire()).points_de_chance).toBe(9);
        await recours.getByLabel('Dé du recours',{exact:true}).fill('10');await recours.getByRole('button',{name:'Préparer l’unique relance',exact:true}).click();await valider(recours);
        expect((await lire()).moral).toBe(1);await expect(recours.getByRole('button',{name:'Préparer l’appel à la chance',exact:true})).toHaveCount(0);
        await carteDe(recours).screenshot({path:path.join(sortie,'jeu-reves-de-dragons-recours.jpg'),type:'jpeg',quality:85});
        await recours.getByRole('button',{name:'Accepter le résultat définitif',exact:true}).click();await valider(recours);
        await astro.getByText('Préparation astrologique du MJ',{exact:true}).click();await astro.getByLabel('Jour astral',{exact:true}).fill('1');
        await astro.getByLabel('Étoiles visibles pour cette observation nocturne',{exact:true}).check();await astro.getByLabel('Vingt minutes d’observation ont été jouées',{exact:true}).check();
        await astro.getByLabel('Visibilité des étoiles',{exact:true}).fill('-2');await astro.getByLabel('Dé secret d’astrologie',{exact:true}).fill('30');await astro.getByLabel('Faux nombre astral',{exact:true}).fill('8');
        await astro.getByRole('button',{name:'Préparer la prédiction de ce personnage',exact:true}).click();await astro.getByRole('button',{name:'Valider l’astrologie',exact:true}).click();
        await carteDe(astro).screenshot({path:path.join(sortie,'astrologie-mj-privee.jpg'),type:'jpeg',quality:85});
        const tablettes:Page[]=[];const charges:unknown[][]=[];
        for(const [id,nom] of [['a','Nitouche — progression fictive'],['b','Brucelin — astres fictifs']]){
            const c=await browser.newContext({viewport:{width:820,height:1600},serviceWorkers:'block'});contextes.push(c);
            await c.addInitScript((id)=>localStorage.setItem('gmos-tablet-uuid',`r567-${id}`),id);
            const p=await c.newPage(),envois:unknown[]=[];charges.push(envois);tablettes.push(p);
            p.on('websocket',ws=>ws.on('framereceived',e=>{try{const v=JSON.parse(String(e.payload));if(v.type==='sync')envois.push(v.payload);}catch{ /* Les messages non JSON ne servent pas à cette assertion. */ }}));
            await p.route('**/*',r=>{const u=new URL(r.request().url());return u.hostname==='127.0.0.1'||['data:','blob:'].includes(u.protocol)?r.continue():r.abort();});
            await p.goto(`http://127.0.0.1:${app.ports.sync}/?window=tablet&sync=${app.ports.sync}`);await p.getByRole('button',{name:new RegExp(nom)}).click();
            await expect(p.getByText('Connecté',{exact:true})).toBeVisible();await p.getByTitle('Fiche Personnage',{exact:true}).click();await ongletDeLaFiche(p,'Lancer un test');
            const a=p.getByRole('region',{name:'Astrologie et heures draconiques RdD',exact:true});await a.getByText('Mes prédictions annoncées',{exact:true}).click();
            await expect(a).toContainText(`nombre annoncé ${id==='a'?'3':'8'}`);await expect(a).not.toContainText('Nombres fixés');
            await expect(p.getByRole('region',{name:'Progression et Archétype RdD',exact:true}).getByRole('button')).toHaveCount(0);
        }
        const p=tablettes[0],aPJ=p.getByRole('region',{name:'Astrologie et heures draconiques RdD',exact:true});
        await carteDe(aPJ).screenshot({path:path.join(sortie,'jeu-reves-de-dragons-astrologie.jpg'),type:'jpeg',quality:85});
        const jetPJ=p.getByRole('region',{name:'Jet du Voyageur',exact:true});await jetPJ.getByLabel('Nature du jet',{exact:true}).selectOption('chance');
        await expect(jetPJ.getByRole('button',{name:'Lancer',exact:true})).toBeDisabled();await expect(jetPJ).toContainText('nombre astral réel');
        await p.setViewportSize({width:360,height:900});for(const nom of ['Progression et Archétype RdD','Chance destinée et moral RdD','Astrologie et heures draconiques RdD'])expect(await p.getByRole('region',{name:nom,exact:true}).evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);
        for(const [i,id] of ['a','b'].entries()){
            const astres=(charges[i] as {session?:{campaigns?:{rddAstrologie?:{nombres?:unknown;observations?:unknown;predictions:Record<string,unknown>}}[]}}[]).flatMap(v=>v.session?.campaigns ?? []).flatMap(c=>c.rddAstrologie?[c.rddAstrologie]:[]);
            expect(astres.length).toBeGreaterThan(0);for(const a of astres){expect(a.nombres).toBeUndefined();expect(a.observations).toBeUndefined();expect(Object.keys(a.predictions).every(c=>c===id)).toBe(true);}
        }
        const avant=JSON.stringify(await lire());await p.reload();await expect(p.getByText('Connecté',{exact:true})).toBeVisible();await f.reload();await attendreLHydratation(app);
        expect(JSON.stringify(await lire())).toBe(avant);
        const traces=await f.evaluate(()=>(window as unknown as Fenetre).useJournalStore.getState().journals.flatMap(j=>j.events).filter(e=>e.metadata?.rddOperation).map(e=>e.metadata!.rddOperation));
        expect(new Set(traces).size).toBe(traces.length);expect(traces.length).toBeGreaterThan(5);
    }finally{for(const c of contextes)await c.close();await app.fermer();fs.rmSync(dossier,{recursive:true,force:true});}
});
