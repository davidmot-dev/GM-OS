import { test, expect, chromium, type Locator, type Page, type Frame, type Browser, type BrowserContext } from '@playwright/test';
import AdmZip from 'adm-zip';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { lancerGmOs, attendreLHydratation, ouvrirLeModule, ongletDeLaFiche } from './lancerGmOs';
import type { useDiceStore } from '../src/stores/useDiceStore';
import type { useJournalStore } from '../src/modules/journal/useJournalStore';
import { PORT_FICHES_PAR_DEFAUT } from '../electron/portsDeGmOs';
import type { VueDesModulesMJ } from '../src/modules/modulesDuJeu/protocole';
import type { VueCombatSpatial } from '../outils/alien/modules/combat-spatial/moteur.mjs';
import type { useSessionOSStore } from '../src/modules/session/useSessionOSStore';

/** David, 06/11/2026 : filmer les mécanismes particuliers de ALIEN avec Playwright.
 * Instance jetable, personnage et effets fictifs, vrais gestes, dés préparés.
 * npm run build puis npx playwright test e2e/clipAlien.spec.ts --reporter=list
 */
const PILOTE = path.resolve(process.env.GMOS_PILOTE_ALIEN ?? 'output/clips/alien/pilote/ALIEN-1.9.0.gmos-driver');
const SORTIE = path.resolve(process.env.GMOS_SORTIE_CLIP ?? 'output/clips');
const PREUVES = path.join(SORTIE, 'alien');
const CAMPAGNE = 'clip-alien', JOUEUR = 'clip-joueur-alien', PERSO = 'clip-nel';
const LARGEUR = 1440, HAUTEUR = 900;
type Fenetre = Window & { useSessionOSStore: typeof useSessionOSStore; useDiceStore: typeof useDiceStore; useJournalStore: typeof useJournalStore; hasardClipAlien?: () => number };

/** Curseur, surlignage et légendes comme le clip RuneQuest ; palette de terminal vert et ambre. */
function installerLaScene() {
    const style = document.createElement('style');
    style.textContent = `
      #clip-curseur{position:fixed;left:0;top:0;z-index:2147483647;pointer-events:none;transform:translate(-100px,-100px);filter:drop-shadow(0 2px 3px #000)}
      #clip-curseur.clic::after{content:'';position:absolute;left:-14px;top:-14px;width:28px;height:28px;border:3px solid #a4f49b;border-radius:50%;animation:clip-onde .5s ease-out forwards}
      @keyframes clip-onde{from{transform:scale(.3);opacity:1}to{transform:scale(1.6);opacity:0}}
      #clip-anneau{position:fixed;z-index:2147483646;pointer-events:none;border:3px solid #a4f49b;border-radius:8px;box-shadow:0 0 18px #a4f49b66;opacity:0}
      #clip-legende{position:fixed;left:50%;bottom:20px;transform:translateX(-50%);max-width:1160px;width:max-content;z-index:2147483645;pointer-events:none;background:#050b19f2;color:white;font:600 22px/1.35 'Segoe UI',system-ui,sans-serif;padding:14px 24px;border-radius:12px;border:1px solid #a4f49b;box-shadow:0 8px 28px #0009;opacity:0}
      #clip-legende small{display:block;font-size:17px;font-weight:400;color:#ead7af;margin-top:5px}
      #clip-chapitre{position:fixed;top:14px;left:50%;transform:translateX(-50%);z-index:2147483645;pointer-events:none;background:#a4f49b;color:#030b15;font:800 15px 'Segoe UI',system-ui,sans-serif;padding:7px 18px;border-radius:999px;letter-spacing:.04em;opacity:0}
      #clip-titre{position:fixed;inset:0;z-index:2147483646;pointer-events:none;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;background:radial-gradient(ellipse at 30% 35%,#16302a,#050d0c 65%);color:#fff;font-family:'Segoe UI',system-ui,sans-serif;text-align:center;opacity:0;transition:opacity .4s}
      #clip-titre h1{font-size:52px;margin:0;color:#a4f49b}#clip-titre p{font-size:24px;margin:0;max-width:1100px;line-height:1.4}
      #clip-titre p:last-child{color:#d4bbb0;font-size:20px}
      .fixed.bottom-6.right-6.pointer-events-none{visibility:hidden!important}
      [data-bandeau-des-reserves]{flex-wrap:wrap!important;gap:12px!important}
    `;
    document.head.appendChild(style);
    for (const id of ['clip-curseur', 'clip-anneau', 'clip-legende', 'clip-chapitre', 'clip-titre']) {
        const div = document.createElement('div'); div.id = id; document.body.appendChild(div);
    }
    const curseur = document.getElementById('clip-curseur')!;
    curseur.innerHTML = '<svg width="26" height="30" viewBox="0 0 26 30"><path d="M2 2V24L8 18L12 28L16 26L12 16H21Z" fill="white" stroke="#061020" stroke-width="2"/></svg>';
    document.addEventListener('mousemove', e => { curseur.style.transform = `translate(${e.clientX - 2}px,${e.clientY - 2}px)`; }, true);
    document.addEventListener('mousedown', () => { curseur.classList.remove('clic'); void curseur.offsetWidth; curseur.classList.add('clic'); }, true);
}

class Realisation {
    constructor(readonly page: Page) {}
    pause = (ms: number) => this.page.waitForTimeout(process.env.GMOS_CLIP_RAPIDE ? Math.min(ms, 30) : ms);
    async legende(texte: string, detail = '', duree = 1200) {
        await this.page.evaluate(({ texte, detail }) => {
            const l = document.getElementById('clip-legende')!; l.replaceChildren(texte);
            if (detail) { const petit = document.createElement('small'); petit.textContent = detail; l.appendChild(petit); }
            l.style.opacity = texte ? '1' : '0';
        }, { texte, detail });
        await this.pause(duree);
    }
    async chapitre(texte: string) {
        await this.legende('', '', 0);
        await this.page.evaluate(texte => { const e = document.getElementById('clip-chapitre')!; e.textContent = texte; e.style.opacity = texte ? '1' : '0'; }, texte);
    }
    async titre(titre: string, lignes: string[], duree = 5500) {
        await this.legende('', '', 0); await this.chapitre('');
        await this.page.evaluate(({ titre, lignes }) => {
            const e = document.getElementById('clip-titre')!; e.replaceChildren();
            const h = document.createElement('h1'); h.textContent = titre; e.appendChild(h);
            lignes.forEach(l => { const p = document.createElement('p'); p.textContent = l; e.appendChild(p); }); e.style.opacity = '1';
        }, { titre, lignes });
        await this.pause(duree);
        await this.page.evaluate(() => { document.getElementById('clip-titre')!.style.opacity = '0'; }); await this.pause(450);
    }
    async viser(cible: Locator, attente = 250) {
        await cible.evaluate(e => {
            // Réserver la place des sous-titres dans le seul profil filmé.
            for (let p = e.parentElement; p; p = p.parentElement) {
                if (p.scrollHeight > p.clientHeight && /auto|scroll/.test(getComputedStyle(p).overflowY)) p.style.paddingBottom = '190px';
            }
            e.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' });
            for (let p = e.parentElement; p; p = p.parentElement) p.scrollLeft = 0;
        }); await this.pause(120);
        const b = await cible.boundingBox(); if (!b) throw new Error('La cible du clip est masquée.');
        await this.page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 18 });
        await this.page.evaluate(b => { Object.assign(document.getElementById('clip-anneau')!.style,
            { left: `${b.x - 4}px`, top: `${b.y - 4}px`, width: `${b.width + 8}px`, height: `${b.height + 8}px`, opacity: '1' }); }, b);
        await this.pause(attente);
    }
    async eteindre() { await this.page.evaluate(() => { document.getElementById('clip-anneau')!.style.opacity = '0'; }); }
    async montrer(cible: Locator, ms = 2500) { await this.viser(cible, ms); await this.eteindre(); }
    async cliquer(cible: Locator, ms = 700) { await this.viser(cible); await cible.click(); await this.eteindre(); await this.pause(ms); }
    async choisir(cible: Locator, valeur: string | { label: string }, ms = 700) { await this.viser(cible); await cible.selectOption(valeur); await this.eteindre(); await this.pause(ms); }
    async taper(cible: Locator, texte: string, ms = 700) {
        await this.viser(cible);
        // Un nombre contrôlé peut rétablir son minimum dès l’effacement : saisir la
        // valeur entière évite de concaténer le nouveau chiffre à ce minimum.
        if (['number','range'].includes(await cible.getAttribute('type') ?? '')) await cible.fill(texte);
        else { await cible.fill(''); await cible.pressSequentially(texte, { delay: process.env.GMOS_CLIP_RAPIDE ? 0 : 55 }); }
        await this.eteindre(); await this.pause(ms);
    }
    async cocher(cible: Locator, actif = true) {
        await this.viser(cible);
        if(await cible.isChecked()!==actif)await cible.click();
        // Le choix de la campagne peut se répercuter après le clic : attendre son rendu.
        if(actif)await expect(cible).toBeChecked();else await expect(cible).not.toBeChecked();
        await this.eteindre();await this.pause(600);
    }
    async carte(id: string) {
        const cartes = this.page.locator('[data-carte-du-jeu]');
        for (const carte of await cartes.all()) {
            const ouvrir = (await carte.getAttribute('data-carte-du-jeu')) === id;
            if ((await carte.getAttribute('open') !== null) !== ouvrir) await carte.locator('summary').first().click();
        }
    }
    async des(file: number[]) {
        await this.page.evaluate(file => {
            const w = window as unknown as Fenetre; w.hasardClipAlien ??= Math.random;
            const origine = w.hasardClipAlien; Math.random = () => file.length ? file.shift()! : origine();
        }, file);
    }
    async rendreLeHasard() { await this.page.evaluate(() => { const w = window as unknown as Fenetre; if (w.hasardClipAlien) Math.random = w.hasardClipAlien; }); }
}




/** Un véritable événement tactile, envoyé dans le client Hub HTTP, pas dans le magasin MJ. */
class RealisationTactile extends Realisation {
    async viser(cible:Locator,attente=250){
        await super.viser(cible,0);
        await this.page.evaluate(()=>{window.scrollTo(0,0);const cadre=document.querySelector('.appareil');if(cadre){cadre.scrollTop=0;cadre.scrollLeft=0;}});
        await this.pause(attente);
    }
    async cliquer(cible:Locator,ms=700){
        await this.viser(cible);const b=await cible.boundingBox();if(!b)throw Error('Cible tactile masquée');
        await this.page.evaluate(b=>{const c=document.getElementById('clip-curseur')!;c.style.transform=`translate(${b.x+b.width/2}px,${b.y+b.height/2}px)`;c.classList.remove('clic');void c.offsetWidth;c.classList.add('clic');},b);
        await cible.tap();await this.eteindre();await this.pause(ms);
    }
    async cocher(cible:Locator,actif=true){if(await cible.isChecked()!==actif)await this.cliquer(cible);if(actif)await expect(cible).toBeChecked();else await expect(cible).not.toBeChecked();}
}

test('Alien : Stress, Panique, survie et trois modules avec le vrai Hub tactile',async()=>{
    test.setTimeout(1_200_000);expect(fs.existsSync(PILOTE)).toBe(true);fs.mkdirSync(PREUVES,{recursive:true});
    const racineTemp=path.resolve(os.tmpdir()),brut=fs.mkdtempSync(path.join(racineTemp,'gmos-clip-alien-'));
    if(!path.resolve(brut).startsWith(racineTemp+path.sep))throw Error('Profil inattendu');
    const source=JSON.parse(new AdmZip(PILOTE).readAsText('state.json'));expect(source.gameDriver.version).toBe('1.9.0');
    const semence=JSON.parse(fs.readFileSync('e2e/donnees/campagne-de-demo.json','utf8')),s=semence.modules.sessionOS;
    s.campaigns=[{id:CAMPAGNE,name:'Les échos du Montero',system:source.gameDriver.id,systemPath:'systems/alien',activeLocationIds:[]}];s.activeCampaignId=CAMPAGNE;s.customGameDrivers=[source.gameDriver];s.customSheetTemplates=[source.sheetTemplate];
    const valeurs=Object.fromEntries(source.sheetTemplate.sections.flatMap((sec:{fields:{id:string;defaultValue?:unknown}[]})=>sec.fields).map((c:{id:string;defaultValue?:unknown})=>[c.id,c.defaultValue??'']));
    const fiche={...valeurs,nom:'Nel Varga',type_personnage:'Pilote',androide:false,force:4,agilite:3,esprit:4,empathie:2,combat_rapproche:2,comtech:2,observation:2,endurance:2,pilotage:3,niveau_de_stress:3,panique_en_cours:0,sante:4,points_de_recit:2,air:8,eau:5,nourriture:3,energie:5,inventaire:'Lampe\nOutils',objet_fetiche:'Photo du premier équipage',talent:'',_gmos_progression_alien:{version:1,mode:'cinema',scenario:'Les échos du Montero',acte:1,seance:'clip'}};
    Object.assign(fiche._gmos_progression_alien,{objectifs:{},remis:{},finsActe:[],bilans:[],fetiches:[],achats:[],essaisTalents:[]});
    s.players=[{id:JOUEUR,realName:'Joueur fictif',isOnline:false,characters:[{id:PERSO,name:'Nel Varga',campaignId:CAMPAGNE,systemId:source.gameDriver.id,templateId:source.sheetTemplate.id,hp:4,maxHp:4,sheetData:fiche}]}];s.entities=[];
    s.sessions=[{...s.sessions[0],id:'clip-seance-alien',campaignId:CAMPAGNE,status:'active',number:1,sessionEntityIds:[PERSO],publicSummary:'Une fiction d’exercice à bord du Montero.'}];
    const semenceFichier=path.join(brut,'semence.json');fs.writeFileSync(semenceFichier,JSON.stringify(semence));
    const g=await lancerGmOs({semence:semenceFichier,video:{dossier:brut,largeur:LARGEUR,hauteur:HAUTEUR},preparerLeProfil:profil=>{
        for(const d of ['theme','fiche'])fs.cpSync(path.resolve('docs/systems/alien',d),path.join(profil,'corpus/systems/alien',d),{recursive:true});
    }});
    const f=g.fenetre,r=new Realisation(f),chapitres:{titre:string;secondesDepuisTitre:number}[]=[];f.setDefaultTimeout(15_000);
    let ouverture=0,fin=0,reussi=false,navigateur:Browser|undefined,contexte:BrowserContext|undefined,stage:Page|undefined;
    let debutTournageTablette=0,finTournageTablette=0,touchersRecus=0,fichierTablette:string|undefined;
    const segmentsTablette:{debutMJ:number;finMJ:number;debutTablette:number;finTablette:number}[]=[];
    const personnage=()=>f.evaluate(id=>(window as unknown as Fenetre).useSessionOSStore.getState().players.flatMap(p=>p.characters).find(c=>c.id===id)!,PERSO);
    const hasard=async(client:Page|Frame,file:number[],action:()=>Promise<void>)=>{await client.evaluate(file=>{const w=window as unknown as Fenetre;w.hasardClipAlien??=Math.random;const origine=w.hasardClipAlien;Math.random=()=>new Error().stack?.includes(".roll (")?(file.length?file.shift()!:origine()):origine();},file.every(v=>v===file[0])?Array(300).fill(file[0]):file);try{await action();}finally{await client.evaluate(()=>{const w=window as unknown as Fenetre;if(w.hasardClipAlien)Math.random=w.hasardClipAlien;});}};
    const chapitre=async(titre:string)=>{chapitres.push({titre,secondesDepuisTitre:(Date.now()-ouverture)/1000});await r.chapitre(titre);};
    const photo=(nom:string,page=f)=>page.screenshot({path:path.join(PREUVES,nom+'.jpg'),type:'jpeg',quality:85,scale:'css'});
    const vue=async()=>{await ouvrirLeModule(g,'Tableau de Bord');await f.evaluate(()=>{const s=(window as unknown as Fenetre).useSessionOSStore.getState();s.setSelectedPlayer('clip-joueur-alien');s.setSelectedCharacter('clip-nel');s.setCurrentView('players');});await ongletDeLaFiche(f,'Lancer un test');};
    const vueModules=():Promise<VueDesModulesMJ>=>f.evaluate(()=>window.appBridge!.modulesDuJeu!.lire());
    const agir=async(moduleId:string,id:string,charge:unknown)=>{const vue=await vueModules();expect(await f.evaluate(({vue,moduleId,id,charge})=>window.appBridge!.modulesDuJeu!.commander({campagneId:vue.campagneId!,contexte:vue.contexte,requeteId:crypto.randomUUID(),moduleId,commande:{id,charge}}),{vue,moduleId,id,charge})).toEqual({ok:true});};
    const spatial=async()=>(await vueModules()).modules.find(m=>m.id==='alien-combat-spatial')!.vue as VueCombatSpatial;
    const carte=(nom:string)=>f.locator('article').filter({has:f.getByRole('heading',{name:nom,exact:true})});
    const pupitre=async(nom:string)=>{const b=carte(nom).getByRole('button',{name:'Ouvrir le pupitre',exact:true});if(await b.count())await r.cliquer(b);};
    try{
        await attendreLHydratation(g);await expect.poll(()=>f.evaluate(()=>(window as unknown as Fenetre).useSessionOSStore.getState().campaigns.map(c=>c.id))).toContain(CAMPAGNE);
        const fenetre=await g.application.browserWindow(f);await fenetre.evaluate((w,t)=>{w.setFullScreen(false);w.unmaximize();w.setResizable(false);w.setMaximizable(false);w.setContentSize(t.l,t.h);w.webContents.setAudioMuted(true);},{l:LARGEUR,h:HAUTEUR});await f.setViewportSize({width:LARGEUR,height:HAUTEUR});
        await ouvrirLeModule(g,'Tableau de Bord');await f.evaluate(()=>{const w=window as unknown as Fenetre;w.useSessionOSStore.getState().setActiveCampaign('clip-alien');w.useJournalStore.getState().addJournal('Clip Alien fictif');w.useJournalStore.setState({isRecording:true});});
        // Préparer la fiction avant le générique ; toutes les actions filmées passent ensuite par les vues réelles.
        await f.evaluate(()=>(window as unknown as Fenetre).useSessionOSStore.getState().setCurrentView('cockpit'));await f.getByRole('button',{name:'Modules du jeu',exact:true}).click();
        expect((await vueModules()).modules.map(m=>m.id)).toEqual(expect.arrayContaining(['alien-muthur','alien-detecteur','alien-combat-spatial']));
        await agir('alien-combat-spatial','vaisseau',{nom:'Montero',modele:'bison-transport',camp:'joueurs',signature:1,propulseurs:1,coque:9,protection:6,armes:['canon-electrique-leger','drones-senseurs'],transpondeur:true,ombilic:true});
        const idNous=(await spatial()).vaisseaux.find(v=>v.nom==='Montero')!.id;
        await agir('alien-combat-spatial','poste',{vaisseauId:idNous,poste:'senseurs',personnageId:PERSO,nom:'Nel Varga',base:6,stress:1,talent:false,synthetique:false});
        for(const [id,nom,x,liens] of [['sas','Sas',0,[]],['gaine','Gaine de maintenance',25,['sas']],['soute','Soute',50,['gaine']]] as const)await agir('alien-detecteur','zone-discrete',{id,nom,x,y:id==='gaine'?20:0,liens});
        for(const [id,nom,zoneId,mobile] of [['nel','Nel Varga','sas',false],['menace-secrete','Rôdeur dissimulé','gaine',true],['immobile-secret','Créature immobile','soute',false]] as const)await agir('alien-detecteur','pion-discret',{id,nom,zoneId,humain:id==='nel',limite:id==='nel'?2:3,mobile,detectable:true});
        await agir('alien-detecteur','regler-discret',{terrain:'interieur',energie:5,porteurId:'nel'});await agir('alien-detecteur','mode-discret',{actif:true});
        await vue();await f.evaluate(installerLaScene);await r.carte('');
        const panneau=f.locator('[data-panneau-de-jet]').first(),select=panneau.locator('select'),resultat=panneau.getByRole('region',{name:'Résultat',exact:true});
        for(const [i,v] of ['force','combat_rapproche','niveau_de_stress'].entries())await select.nth(i).selectOption(v);
        ouverture=Date.now();await r.titre('ALIEN · les échos du Montero',['Le Stress aide à agir… et expose à la Panique','Survie · MU/TH/UR 6000 · Détecteur M314 · Combat spatial · Hub tactile','Personnages fictifs — vrais échanges locaux, dés préparés, légendes sans voix.']);

        await chapitre('1 · Forcer un test, puis engager un Point de Récit');
        await r.legende('Force quatre + Combat rapproché deux : six dés de base.','Trois dés de Stress s’ajoutent. Chaque six est une réussite ; un seul un sur les dés de Stress réclame un test de Panique.',3300);
        await hasard(f,[.7],()=>r.cliquer(panneau.getByRole('button',{name:'Lancer',exact:true})));await photo('01-reserve');
        await hasard(f,[.7],()=>r.cliquer(panneau.getByRole('button',{name:/Forcer le jet/})));await expect.poll(async()=>(await personnage()).sheetData.niveau_de_stress).toBe(4);
        await r.legende('Forcer ajoute d’abord un Stress, puis relance les dés sans six.','La réserve comporte maintenant quatre dés de Stress. Ici le forçage échoue encore ; un androïde ne pourrait pas forcer.',3300);await r.montrer(resultat,2400);await photo('02-forcage');
        await r.cliquer(panneau.getByRole('button',{name:/Dépenser un Point de Récit/}));await expect.poll(async()=>(await personnage()).sheetData.points_de_recit).toBe(1);
        await r.legende('Un Point de Récit ajoute une réussite au résultat.','Deux points deviennent un : le test est sauvé. Ce recours ne permet pas d’effacer une action annulée par une Panique de dix ou plus.',3300);await photo('03-recit');

        await chapitre('2 · Des six… puis la Panique annule l’action');
        await hasard(f,[.99,.99,.2,.2,.2,.2,0,.2,.2,.2],()=>r.cliquer(panneau.getByRole('button',{name:'Lancer',exact:true})));await expect(panneau.getByText(/Résultat provisoire/)).toBeVisible();
        await expect(panneau.getByRole('button',{name:/Dépenser un Point de Récit/})).toBeDisabled();
        await r.legende('Deux six, mais un un de Stress : le résultat reste provisoire.','La Panique doit être résolue avant de conclure l’action. Le forçage est bloqué.',3300);await photo('04-provisoire');
        await hasard(f,[.99],()=>r.cliquer(panneau.getByRole('button',{name:'Test de Panique',exact:true})));await r.carte('panique-alien');await expect(panneau.getByText('Figé (10)',{exact:true})).toBeVisible();await expect(panneau.getByText(/Action annulée :/)).toBeVisible();
        await expect.poll(async()=>(await personnage()).sheetData.niveau_de_stress).toBe(5);
        await r.legende('Six + Stress quatre = dix : Figé. L’action est annulée.','Le Stress monte à cinq. Maman choisit les témoins concernés par la contagion ; aucun tour ne s’écoule automatiquement.',3600);await r.montrer(panneau.locator('[data-panique-alien]'),2200);await photo('05-panique');
        await r.cliquer(panneau.getByRole('button',{name:'Aucun autre personnage concerné',exact:true}));await r.cliquer(panneau.getByRole('button',{name:'Round et action résolus',exact:true}));await expect.poll(async()=>(await personnage()).sheetData.panique_en_cours).toBe(0);

        await chapitre('3 · L’Air : une réserve, six dés au maximum');
        await r.carte('sante-alien');const survie=f.locator('[data-survie-alien]').first();await r.cliquer(survie.getByText('Survie Alien',{exact:true}));await r.cocher(survie.getByLabel('Suivre les consommables en pénurie',{exact:true}));await r.cliquer(survie.getByRole('button',{name:'Demander le test — Air',exact:true}));
        await hasard(f,[0,0,.2,.2,.99,.2],()=>r.cliquer(survie.getByRole('button',{name:'Résoudre : Air : utilisation confirmée par Maman',exact:true})));await expect.poll(async()=>(await personnage()).sheetData.air).toBe(6);expect((await personnage()).sheetData.niveau_de_stress).toBe(5);
        await r.legende('Air huit : six dés seulement. Deux un font perdre deux points.','La réserve passe à six ; ces dés ne provoquent aucune Panique. Maman demande les tests et confirme le temps réellement écoulé.',3600);await r.montrer(survie.locator('[data-reserves-alien]'),2400);await photo('06-survie');

        await chapitre('4 · Combat spatial : modèles du livre et postes d’équipage');
        await ouvrirLeModule(g,'Tableau de Bord');await f.evaluate(()=>(window as unknown as Fenetre).useSessionOSStore.getState().setCurrentView('cockpit'));await r.cliquer(f.getByRole('button',{name:'Modules du jeu',exact:true}));await pupitre('Combat spatial');const ps=f.locator('.gmos-spatial');
        await r.cliquer(ps.getByText('Préparer un vaisseau',{exact:true}));await r.choisir(ps.getByLabel('Modèle du livre',{exact:true}),'conestoga');const form=ps.getByRole('form',{name:'Préparer un vaisseau',exact:true});await r.taper(form.getByLabel('Nom',{exact:true}),'USS Patna');await r.choisir(form.getByLabel('Camp',{exact:true}),'adverse');await r.cocher(form.getByLabel('Transpondeur actif',{exact:true}),false);await r.cliquer(form.getByRole('button',{name:'Enregistrer le vaisseau',exact:true}));await expect(ps.getByRole('heading',{name:/USS Patna/})).toBeVisible();
        await r.cocher(carte('Combat spatial').getByRole('checkbox',{name:'Nel Varga',exact:true}));await r.montrer(ps.getByRole('heading',{name:/USS Patna/}),2300);
        await r.legende('Le modèle Conestoga prépare le vaisseau et son armement.','Le Montero et son poste Senseurs étaient préparés avant le tournage. Transpondeur coupé : l’autre vaisseau reste un contact non identifié pour le joueur.',3600);await photo('07-spatial-preparation');
        const idEux=(await spatial()).vaisseaux.find(v=>v.nom==='USS Patna')!.id;
        for(const poste of ['capitaine','senseurs','pilote','artilleur','ingenieur'])await agir('alien-combat-spatial','poste',{vaisseauId:idEux,poste,personnageId:'',nom:`Marine ${poste}`,base:5,stress:0,talent:false,synthetique:false});
        await agir('alien-combat-spatial','demarrer-combat',{vaisseaux:[idNous,idEux],distance:8,velociteJoueurs:2,velociteAdverse:2});await agir('alien-combat-spatial','ordonner',{vaisseauId:idEux,action:'faire-le-mort',coupe:'senseurs'});
        await expect(ps.getByRole('button',{name:'Révéler les ordres',exact:true})).toBeVisible();await r.montrer(ps.getByRole('button',{name:'Révéler les ordres',exact:true}),2200);await photo('08-spatial-ordres');

        await chapitre('5 · Maman prépare le M314 et ouvre les accès');
        for(const nom of ['MU/TH/UR 6000','Détecteur de mouvement'])await r.cocher(carte(nom).getByRole('checkbox',{name:'Nel Varga',exact:true}));
        await pupitre('Détecteur de mouvement');const det=f.locator('.gmos-detecteur');await r.montrer(det.getByRole('img',{name:'Plan privé des zones',exact:true}),2500);
        await r.legende('Le plan privé contient Nel, une menace mobile et une créature immobile.','Le M314 a sa propre batterie, préparée à cinq. Le scan transmet des échos de mouvement, jamais l’identité des pions cachés.',3600);await photo('09-plan-prive');
        await r.cliquer(det.getByRole('button',{name:'Scanner ce Tour et tester l’Énergie',exact:true}));await expect(det.getByText(/Scan du Tour 1 · Énergie/)).toBeVisible();await expect(det.getByRole('button',{name:'Scanner ce Tour et tester l’Énergie',exact:true})).toBeDisabled();
        await r.legende('Un scan teste l’Énergie une fois pour ce Tour.','Il ne crée ni Stress ni Panique et ne fait pas avancer les échéances de Survie. Le joueur recevra uniquement le résultat autorisé.',3300);await photo('10-scan-mj');await pupitre('MU/TH/UR 6000');

        // La tablette : vrai Hub local sans appBridge, viewport tactile 768×1024.
        navigateur=await chromium.launch({channel:'msedge',args:['--mute-audio']});contexte=await navigateur.newContext({viewport:{width:LARGEUR,height:HAUTEUR},recordVideo:{dir:brut,size:{width:LARGEUR,height:HAUTEUR}},isMobile:true,hasTouch:true,deviceScaleFactor:1,serviceWorkers:'block',locale:'fr-FR'});
        await contexte.route('**/*',route=>{const u=new URL(route.request().url());if(['about:','blob:','data:'].includes(u.protocol))return route.continue();if(u.hostname!=='127.0.0.1')return route.abort();if(u.port===String(PORT_FICHES_PAR_DEFAUT)){u.port=String(g.ports.fiches);return route.continue({url:u.href});}return [String(g.ports.fiches),String(g.ports.sync)].includes(u.port)?route.continue():route.abort();});
        await contexte.addInitScript(()=>{if(location.hostname==='127.0.0.1')localStorage.setItem('gmos-tablet-uuid','clip-alien-tactile');});stage=await contexte.newPage();stage.setDefaultTimeout(15_000);debutTournageTablette=Date.now();
        const contenuStage=`<html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{width:1440px;height:900px;overflow:hidden}body{margin:0;background:radial-gradient(ellipse at 25% 35%,#193b2d,#050c0a 70%);color:#eef6e9;font-family:'Segoe UI',sans-serif}aside{position:absolute;left:70px;top:140px;width:590px}h1{font-size:44px;color:#a4f49b;margin:0 0 24px}p{font-size:24px;line-height:1.5}small{font-size:19px;color:#b6c7b9}.etat{white-space:pre-line;margin-top:50px;padding:24px;border:1px solid #4e7854;border-radius:16px;background:#ffffff09;font-size:22px;line-height:1.6}.appareil{position:absolute;left:770px;top:48px;width:576px;height:768px;border:12px solid #304036;border-radius:24px;overflow:clip;box-shadow:0 18px 60px #0009}iframe{width:768px;height:1024px;transform:scale(.75);transform-origin:top left;border:0;background:#101910}</style><aside><h1>Le joueur sur sa tablette</h1><p>Vrai Hub GM-OS<br>Nel Varga · à bord du Montero</p><small>Émulation tactile 768 × 1024<br>Touchers Playwright · échanges locaux réels</small><div class="etat" id="clip-reception">Connexion du joueur…</div></aside><div class="appareil"><iframe title="Tablette du joueur" id="tablette" src="http://127.0.0.1:${g.ports.sync}/?window=tablet&sync=${g.ports.sync}"></iframe></div></html>`;
        await contexte.route('**/clip-alien-presentation.html',route=>route.fulfill({contentType:'text/html; charset=utf-8',body:contenuStage}));await stage.goto(`http://127.0.0.1:${g.ports.sync}/clip-alien-presentation.html`);await stage.evaluate(installerLaScene);
        const rt=new RealisationTactile(stage),hub=stage.frameLocator('#tablette');await expect(hub.getByRole('button',{name:/Nel Varga/})).toBeVisible();const client=stage.frames().find(fr=>fr.url().includes('window=tablet'))!;
        expect(await client.evaluate(()=>navigator.maxTouchPoints)).toBeGreaterThan(0);expect(await client.evaluate(()=>[innerWidth,innerHeight])).toEqual([768,1024]);expect(await client.evaluate(()=>!!window.appBridge)).toBe(false);
        await client.evaluate(()=>{const w=window as unknown as {touchesClipAlien:number};w.touchesClipAlien=0;document.addEventListener('touchstart',()=>w.touchesClipAlien++,true);});
        const debutSegment=()=>{const date=Date.now();return {debutMJ:(date-ouverture)/1000,finMJ:0,debutTablette:(date-debutTournageTablette)/1000,finTablette:0};};
        const finSegment=(seg:typeof segmentsTablette[number])=>{const date=Date.now();seg.finMJ=(date-ouverture)/1000;seg.finTablette=(date-debutTournageTablette)/1000;segmentsTablette.push(seg);};
        let seg=debutSegment();const titre6='6 · Tablette : test réel puis question privée à MU/TH/UR';chapitres.push({titre:titre6,secondesDepuisTitre:seg.debutMJ});await rt.chapitre(titre6);
        await rt.cliquer(hub.getByRole('button',{name:/Nel Varga/}));await expect(hub.getByText('Connecté',{exact:true})).toBeVisible();await rt.cliquer(hub.getByTitle('Fiche Personnage',{exact:true}));await rt.cliquer(hub.getByRole('tab',{name:'Lancer un test',exact:true}));
        const ph=hub.locator('[data-panneau-de-jet]').first();for(const [i,v] of ['esprit','comtech','niveau_de_stress'].entries())await rt.choisir(ph.locator('select').nth(i),v);
        const avant=await f.evaluate(()=>(window as unknown as Fenetre).useDiceStore.getState().history.length);await hasard(client,[.7],()=>rt.cliquer(ph.getByRole('button',{name:'Lancer',exact:true})));await expect.poll(()=>f.evaluate(()=>(window as unknown as Fenetre).useDiceStore.getState().history.length)).toBeGreaterThan(avant);
        await stage.evaluate(()=>document.getElementById('clip-reception')!.textContent='Nel est connecté.\nLe test Esprit + Comtech est reçu côté MJ.');
        await rt.legende('Le joueur touche sa fiche, prépare puis lance son test.','Ce sont de vrais événements tactiles dans le Hub, transmis au MJ. La tablette est émulée ; aucun appareil physique n’est utilisé.',3300);await photo('11-tablette-test',stage);
        const instrument=async(nom:string)=>{const fermer=hub.getByTitle('Fermer la fiche',{exact:true});if(await fermer.count())await rt.cliquer(fermer);await rt.cliquer(hub.getByRole('navigation',{name:'Navigation Hub'}).getByRole('button',{name:'Modules du jeu',exact:true}));const b=hub.getByRole('button',{name:'Retour aux modules',exact:true});if(await b.count())await rt.cliquer(b);await rt.cliquer(hub.getByRole('button',{name:`Ouvrir ${nom}`,exact:true}));};
        await instrument('MU/TH/UR 6000');await rt.taper(hub.getByLabel('Commande ou /M votre question',{exact:true}),'/M Maman, la gaine de maintenance est-elle accessible ?');await rt.cliquer(hub.getByRole('button',{name:'Transmettre',exact:true}));
        await expect(f.locator('.gmos-muthur').getByText('/M Maman, la gaine de maintenance est-elle accessible ?',{exact:true})).toBeVisible();await rt.legende('Avec /M, Nel pose une question privée à Maman.','Le terminal attend une réponse du meneur. Un accès à MU/TH/UR ne donne pas accès aux autres modules ni aux secrets de préparation.',3300);await photo('12-tablette-question',stage);finSegment(seg);

        await chapitre('7 · Côté MJ : une réponse privée, reçue par le joueur');const maman=f.locator('.gmos-muthur');await r.taper(maman.getByLabel('Réponse de Maman',{exact:true}),'Gaine accessible. Procéder au scan avant toute progression.');await r.cliquer(maman.getByRole('button',{name:'Transmettre la réponse',exact:true}));
        await expect(hub.getByText('Gaine accessible. Procéder au scan avant toute progression.',{exact:true})).toBeVisible();await r.legende('Maman répond depuis son vrai pupitre.','La réponse est transmise au terminal de Nel. La scène suivante montre ce que le joueur reçoit, sans le plan ni les noms privés.',3300);await photo('13-reponse-mj');

        seg=debutSegment();const titre8='8 · Tablette : réponse, échos du M314 et ordre spatial';chapitres.push({titre:titre8,secondesDepuisTitre:seg.debutMJ});await rt.chapitre(titre8);
        await stage.evaluate(()=>document.getElementById('clip-reception')!.textContent='Réponse de Maman reçue.\nLe joueur conserve sa vue autorisée.');await rt.montrer(hub.getByText('Gaine accessible. Procéder au scan avant toute progression.',{exact:true}),2600);await photo('14-tablette-reponse',stage);
        await instrument('Détecteur de mouvement');await expect(hub.getByText('Gaine de maintenance : 1 écho',{exact:true})).toBeVisible();await expect(hub.getByText('Rôdeur dissimulé',{exact:true})).toHaveCount(0);await expect(hub.getByText('Créature immobile',{exact:true})).toHaveCount(0);
        await rt.legende('Le M314 annonce un écho dans la gaine de maintenance.','Le joueur ne connaît ni le nom de la menace ni la créature immobile. Le scan n’accorde aucune ligne de vue.',3600);await rt.montrer(hub.getByRole('region',{name:'Résultat du scan discret',exact:true}),2300);await photo('15-tablette-detecteur',stage);
        await instrument('Combat spatial');const sh=hub.locator('.gmos-spatial');await expect(sh.getByRole('list',{name:'Contacts'})).toContainText('Contact non identifié');await rt.choisir(sh.getByLabel('Action de Montero',{exact:true}),'verrouiller');await rt.cliquer(sh.getByRole('form',{name:'Ordre de Montero',exact:true}).getByRole('button',{name:'Donner l’ordre',exact:true}));await expect(sh.locator('[data-ordre-donne]')).toContainText('Verrouillage de la cible');
        await expect.poll(async()=>JSON.stringify((await spatial()).combat)).toContain('verrouiller');
        await stage.evaluate(()=>document.getElementById('clip-reception')!.textContent='Question et réponse reçues.\nÉcho du M314 reçu.\nOrdre de verrouillage reçu côté MJ.');
        await rt.legende('Au poste Senseurs, Nel donne un ordre de verrouillage.','L’ordre est reçu côté MJ. Les choix adverses et l’identité du contact restent cachés jusqu’aux étapes qui les révèlent.',3600);await photo('16-tablette-spatial',stage);finSegment(seg);
        touchersRecus=await client.evaluate(()=>(window as unknown as {touchesClipAlien:number}).touchesClipAlien);expect(touchersRecus).toBeGreaterThan(10);
        finTournageTablette=Date.now();const videoTablette=stage.video();await contexte.close();contexte=undefined;fichierTablette=await videoTablette?.path();await navigateur.close();navigateur=undefined;

        // Le montage retire aussi l’attente de fermeture des clients avant le retour MJ.
        segmentsTablette[segmentsTablette.length-1].finMJ=(Date.now()-ouverture)/1000;
        await chapitre('9 · Le MJ révèle les ordres et retrouve le test du Hub');await pupitre('Combat spatial');await r.cliquer(ps.getByRole('button',{name:'Révéler les ordres',exact:true}));await expect.poll(async()=>(await spatial()).combat?.etape).toBe('resolution');await r.legende('La révélation ouvre la résolution de cette phase spatiale.','Le verrouillage de Nel et l’ordre adverse appartiennent au même combat. Ce clip s’arrête avant leurs jets : les phases, dégâts et avaries se résolvent ensuite.',3600);await photo('17-revelation');
        await ouvrirLeModule(g,'Dice-OS');await expect(f.getByRole('heading',{name:'Dice-OS',exact:true})).toBeVisible();await expect.poll(()=>f.evaluate(()=>(window as unknown as Fenetre).useDiceStore.getState().history.map(r=>r.title).join(' '))).toContain('Nel');await r.legende('Le test tactile figure bien dans l’historique Dice-OS du MJ.','Le film a relié les vrais clients locaux : fiche, terminal privé, détecteur et ordre spatial. Les données de la séance sont entièrement fictives.',3300);await photo('18-reception-test');
        await r.titre('Maman garde les secrets · le joueur agit',['Stress et Panique · Survie · MU/TH/UR · M314 · Combat spatial',
            'Vrai Hub en émulation tactile ; touchers et échanges vérifiés, sans appareil physique.',
            'ALIEN · pilote 1.9.0 · démonstration ciblée, personnages et dés d’exercice'],6500);reussi=true;fin=Date.now();
    }catch(erreur){await f.screenshot({path:path.join(PREUVES,'diagnostic-echec.jpg'),type:'jpeg'});if(stage&&!stage.isClosed())await stage.screenshot({path:path.join(PREUVES,'diagnostic-tablette.jpg'),type:'jpeg'});throw erreur;}
    finally{await contexte?.close();await navigateur?.close();const video=f.video();await g.fermer();const fichierVideo=await video?.path();if(reussi&&fichierVideo&&fichierTablette){
        const parametres={dureeDepuisTitre:(fin-ouverture)/1000,dureeTournageTablette:(finTournageTablette-debutTournageTablette)/1000,segmentsTablette,chapitres};const p=path.join(brut,'montage.json');fs.writeFileSync(p,JSON.stringify(parametres));
        const exportVideo=JSON.parse(execFileSync(process.execPath,['outils/clips/monter_clip_alien.mjs',fichierVideo,fichierTablette,SORTIE,p],{encoding:'utf8'}));
        fs.writeFileSync(path.join(PREUVES,'verification.json'),JSON.stringify({version:source.gameDriver.version,profilJetable:true,donneesPersonnelles:false,desPrepares:true,scanM314Aleatoire:true,narrationSonore:false,modeRapide:!!process.env.GMOS_CLIP_RAPIDE,dureeDepuisTitre:exportVideo.dureeMp4,chapitres:exportVideo.chapitres,exportVideo,
            tablette:{client:'Hub HTTP/WebSocket réel sans appBridge',viewport:{largeur:768,hauteur:1024},contexteTactile:true,touchersPlaywright:true,touchersRecus,appareilPhysique:false,jetRecuMJ:true,questionPriveeRecueMJ:true,reponseMJRecue:true,echoRecuSansNomsPrives:true,ordreSpatialRecuMJ:true},modules:['alien-muthur','alien-detecteur','alien-combat-spatial'],
            assertions:['six dés de base et trois de Stress','forçage : Stress3 → 4, puis nouveau dé inclus','Point de Récit2 → 1 ajoute une réussite','Panique en attente : recours bloqués','Panique6+4=10 : Figé, action annulée, Stress5','contagion et fin de round explicitement confirmées','Air8 : six dés, deux un, réserve6 sans Stress ajouté','Conestoga du catalogue, transpondeur coupé','trois modules autorisés au vrai joueur','scan M314 une fois par Tour, batterie indépendante','test du Hub reçu dans l’historique MJ','question /M et réponse réelles','détecteur public : écho sans noms de pions cachés','contact spatial non identifié','ordre spatial joueur reçu et révélé côté MJ']},null,2));}
        if(path.resolve(brut).startsWith(racineTemp+path.sep))fs.rmSync(brut,{recursive:true,force:true});else console.error('Nettoyage temporaire refusé.');}
});
