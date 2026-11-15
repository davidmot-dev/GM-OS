import { test, expect, chromium, type Locator, type Page, type Browser, type BrowserContext } from '@playwright/test';
import AdmZip from 'adm-zip';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { lancerGmOs, attendreLHydratation, ouvrirLeModule } from './lancerGmOs';
import { PORT_FICHES_PAR_DEFAUT } from '../electron/portsDeGmOs';
import type { useSessionOSStore } from '../src/modules/session/useSessionOSStore';
import type { VueDesModulesMJ } from '../src/modules/modulesDuJeu/protocole';
import type { VueCombatSpatial } from '../outils/alien/modules/combat-spatial/moteur.mjs';
import type { EtatDetecteur } from '../outils/alien/modules/detecteur/moteur.mjs';

/** David, 15/11 : les trois modules externes, avec un passage détaillé sur le M314 A11.
 * Aucun code applicatif modifié. Profil, équipage et vaisseaux fictifs, vrais gestes du Hub.
 */
const PILOTE=path.resolve(process.env.GMOS_PILOTE_ALIEN??'Export Dirvers/corriges/Alien-1.11.0.gmos-driver');
const SORTIE=path.resolve(process.env.GMOS_SORTIE_CLIP??'output/clips');
const DOSSIER='alien-modules-2026-11-15',PREUVES=path.join(SORTIE,DOSSIER);
const CAMPAGNE='film-modules-alien',JOUEUR='film-joueur-alien',PERSO='film-nel';
const LARGEUR=1440,HAUTEUR=900;
type Fenetre=Window & {useSessionOSStore:typeof useSessionOSStore;hasardClipAlien?:()=>number};

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

test('Alien modules : MU/TH/UR, M314 orientable et combat spatial avec le vrai Hub',async()=>{
    test.setTimeout(1_200_000);expect(fs.existsSync(PILOTE)).toBe(true);fs.mkdirSync(PREUVES,{recursive:true});
    const racineTemp=path.resolve(os.tmpdir()),brut=fs.mkdtempSync(path.join(racineTemp,'gmos-film-modules-alien-'));
    const source=JSON.parse(new AdmZip(PILOTE).readAsText('state.json'));expect(source.gameDriver.version).toBe('1.11.0');
    fs.mkdirSync(path.join(PREUVES,'pilote'),{recursive:true});fs.copyFileSync(PILOTE,path.join(PREUVES,'pilote/ALIEN-1.11.0.gmos-driver'));
    const semence=JSON.parse(fs.readFileSync('e2e/donnees/campagne-de-demo.json','utf8')),s=semence.modules.sessionOS;
    s.campaigns=[{id:CAMPAGNE,name:'Les signaux du Montero',system:source.gameDriver.id,systemPath:'systems/alien',activeLocationIds:[]}];
    s.activeCampaignId=CAMPAGNE;s.customGameDrivers=[source.gameDriver];s.customSheetTemplates=[source.sheetTemplate];
    const valeurs=Object.fromEntries(source.sheetTemplate.sections.flatMap((sec:{fields:{id:string;defaultValue?:unknown}[]})=>sec.fields).map((c:{id:string;defaultValue?:unknown})=>[c.id,c.defaultValue??'']));
    const fiche={...valeurs,nom:'Nel Varga',type_personnage:'Pilote',androide:false,force:4,agilite:3,esprit:4,empathie:2,sante:4,niveau_de_stress:0,air:5,energie:5};
    s.players=[{id:JOUEUR,realName:'Joueur fictif',isOnline:false,characters:[{id:PERSO,name:'Nel Varga',campaignId:CAMPAGNE,systemId:source.gameDriver.id,templateId:source.sheetTemplate.id,hp:4,maxHp:4,sheetData:fiche}]}];
    s.entities=[];s.sessions=[{...s.sessions[0],id:'film-seance-modules',campaignId:CAMPAGNE,status:'active',number:1,sessionEntityIds:[PERSO],publicSummary:'Une démonstration fictive des modules d’Alien.'}];
    const semenceFichier=path.join(brut,'semence.json');fs.writeFileSync(semenceFichier,JSON.stringify(semence));
    const g=await lancerGmOs({semence:semenceFichier,video:{dossier:brut,largeur:LARGEUR,hauteur:HAUTEUR},preparerLeProfil:profil=>{
        for(const d of ['theme','fiche'])fs.cpSync(path.resolve('docs/systems/alien',d),path.join(profil,'corpus/systems/alien',d),{recursive:true});
    }});
    const f=g.fenetre,r=new Realisation(f),chapitres:{titre:string;secondesDepuisTitre:number}[]=[];f.setDefaultTimeout(15_000);
    let ouverture=0,fin=0,reussi=false,navigateur:Browser|undefined,contexte:BrowserContext|undefined,stage:Page|undefined;
    let debutTournageTablette=0,finTournageTablette=0,touchersRecus=0,fichierTablette:string|undefined;
    const segmentsTablette:{debutMJ:number;finMJ:number;debutTablette:number;finTablette:number}[]=[];
    const photos:{nom:string;secondesDepuisTitre:number}[]=[];
    const photo=async(nom:string,page=f)=>{photos.push({nom,secondesDepuisTitre:(Date.now()-ouverture)/1000});await page.screenshot({path:path.join(PREUVES,nom+'.jpg'),type:'jpeg',quality:85,scale:'css'});};
    const chapitre=async(titre:string)=>{chapitres.push({titre,secondesDepuisTitre:(Date.now()-ouverture)/1000});await r.chapitre(titre);};
    const vueModules=():Promise<VueDesModulesMJ>=>f.evaluate(()=>window.appBridge!.modulesDuJeu!.lire());
    const agir=async(moduleId:string,id:string,charge:unknown)=>{const vue=await vueModules();expect(await f.evaluate(({vue,moduleId,id,charge})=>window.appBridge!.modulesDuJeu!.commander({campagneId:vue.campagneId!,contexte:vue.contexte,requeteId:crypto.randomUUID(),moduleId,commande:{id,charge}}),{vue,moduleId,id,charge})).toEqual({ok:true});};
    const spatial=async()=>(await vueModules()).modules.find(m=>m.id==='alien-combat-spatial')!.vue as VueCombatSpatial;
    const detecteur=async()=>(await vueModules()).modules.find(m=>m.id==='alien-detecteur')!.vue as EtatDetecteur;
    const carte=(nom:string)=>f.locator('article').filter({has:f.getByRole('heading',{name:nom,exact:true})});
    const pupitre=async(nom:string)=>{const b=carte(nom).getByRole('button',{name:'Ouvrir le pupitre',exact:true});if(await b.count())await r.cliquer(b);};
    try{
        await attendreLHydratation(g);await expect.poll(()=>f.evaluate(()=>(window as unknown as Fenetre).useSessionOSStore.getState().campaigns.map(c=>c.id))).toContain(CAMPAGNE);
        const fenetre=await g.application.browserWindow(f);await fenetre.evaluate((w,t)=>{w.setFullScreen(false);w.unmaximize();w.setContentSize(t.l,t.h);w.webContents.setAudioMuted(true);},{l:LARGEUR,h:HAUTEUR});await f.setViewportSize({width:LARGEUR,height:HAUTEUR});
        await ouvrirLeModule(g,'Tableau de Bord');await f.evaluate(()=>{const etat=(window as unknown as Fenetre).useSessionOSStore.getState();etat.setActiveCampaign('film-modules-alien');etat.setCurrentView('cockpit');});
        await f.getByRole('button',{name:'Modules du jeu',exact:true}).click();
        expect((await vueModules()).modules.map(m=>m.id)).toEqual(expect.arrayContaining(['alien-muthur','alien-detecteur','alien-combat-spatial']));
        // Fiction préparée avant le générique. Les gestes commentés passent ensuite par les vues.
        for(const [id,nom,x,y,liens] of [['sas','Sas',0,0,[]],['coursive','Coursive Est',25,0,['sas']],['soute','Soute Nord',0,-25,['sas']]] as const)
            await agir('alien-detecteur','zone-discrete',{id,nom,x,y,liens});
        for(const [id,nom,zoneId,mobile] of [['nel','Nel Varga','sas',false],['menace-est','Rôdeur de la coursive','coursive',true],['menace-nord','Rôdeur de la soute','soute',true],['dormeur','Créature immobile','coursive',false]] as const)
            await agir('alien-detecteur','pion-discret',{id,nom,zoneId,humain:id==='nel',limite:id==='nel'?2:3,mobile,detectable:true});
        await agir('alien-detecteur','regler-discret',{terrain:'interieur',energie:5,porteurId:'nel'});
        await agir('alien-combat-spatial','vaisseau',{nom:'Montero',modele:'bison-transport',camp:'joueurs',signature:1,propulseurs:1,coque:9,protection:6,armes:['canon-electrique-leger','drones-senseurs'],transpondeur:true,ombilic:true});
        const idNous=(await spatial()).vaisseaux.find(v=>v.nom==='Montero')!.id;
        await agir('alien-combat-spatial','poste',{vaisseauId:idNous,poste:'senseurs',personnageId:PERSO,nom:'Nel Varga',base:6,stress:1,talent:false,synthetique:false});
        await f.locator('article').filter({has:f.getByRole('heading',{name:'Combat spatial',exact:true})}).getByRole('button',{name:'Ouvrir le pupitre',exact:true}).click();
        const ps=f.locator('.gmos-spatial');await ps.getByText('Préparer un vaisseau',{exact:true}).click();
        await ps.getByLabel('Modèle du livre',{exact:true}).selectOption('conestoga');
        const vaisseau=ps.getByRole('form',{name:'Préparer un vaisseau',exact:true});await vaisseau.getByLabel('Nom',{exact:true}).fill('USS Patna');await vaisseau.getByLabel('Camp',{exact:true}).selectOption('adverse');await vaisseau.getByLabel('Transpondeur actif',{exact:true}).uncheck();await vaisseau.getByRole('button',{name:'Enregistrer le vaisseau',exact:true}).click();
        const idEux=(await spatial()).vaisseaux.find(v=>v.nom==='USS Patna')!.id;
        for(const poste of ['capitaine','senseurs','pilote','artilleur','ingenieur'])await agir('alien-combat-spatial','poste',{vaisseauId:idEux,poste,personnageId:'',nom:`Marine ${poste}`,base:5,stress:0,talent:false,synthetique:false});
        await agir('alien-combat-spatial','demarrer-combat',{vaisseaux:[idNous,idEux],distance:8,velociteJoueurs:2,velociteAdverse:2});await agir('alien-combat-spatial','ordonner',{vaisseauId:idEux,action:'faire-le-mort',coupe:'senseurs'});
        await carte('Combat spatial').getByRole('button',{name:'Fermer le pupitre',exact:true}).click();
        await f.evaluate(installerLaScene);ouverture=Date.now();
        await r.titre('ALIEN · utiliser les trois modules',['MU/TH/UR 6000 · M314 orientable · Combat spatial','Poste meneur et vrai Hub joueur — fiction à bord du Montero','Pilote 1.11.0 · gestes filmés avec Playwright · légendes sans voix'],6500);

        await chapitre('1 · Le meneur ouvre les modules au bon personnage');
        for(const nom of ['MU/TH/UR 6000','Détecteur de mouvement','Combat spatial'])await r.cocher(carte(nom).getByRole('checkbox',{name:'Nel Varga',exact:true}));
        await r.legende('Chaque module possède ses propres accès.','Les cases ouvrent ces instruments au personnage de Nel. Les pupitres restent privés ; Tout couper retire tous les accès.',4400);await photo('01-acces-modules');
        await pupitre('MU/TH/UR 6000');

        navigateur=await chromium.launch({channel:'msedge',args:['--mute-audio']});
        contexte=await navigateur.newContext({viewport:{width:LARGEUR,height:HAUTEUR},recordVideo:{dir:brut,size:{width:LARGEUR,height:HAUTEUR}},isMobile:true,hasTouch:true,deviceScaleFactor:1,serviceWorkers:'block',locale:'fr-FR'});
        await contexte.route('**/*',route=>{const u=new URL(route.request().url());if(['about:','blob:','data:'].includes(u.protocol))return route.continue();if(u.hostname!=='127.0.0.1')return route.abort();if(u.port===String(PORT_FICHES_PAR_DEFAUT)){u.port=String(g.ports.fiches);return route.continue({url:u.href});}return [String(g.ports.fiches),String(g.ports.sync)].includes(u.port)?route.continue():route.abort();});
        await contexte.addInitScript(()=>{if(location.hostname==='127.0.0.1')localStorage.setItem('gmos-tablet-uuid','film-alien-tactile');});
        stage=await contexte.newPage();stage.setDefaultTimeout(15_000);debutTournageTablette=Date.now();
        const contenuStage=`<html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{width:1440px;height:900px;overflow:hidden}body{margin:0;background:radial-gradient(ellipse at 25% 35%,#193b2d,#050c0a 70%);color:#eef6e9;font-family:'Segoe UI',sans-serif}aside{position:absolute;left:60px;top:120px;width:590px}h1{font-size:42px;color:#a4f49b;margin:0 0 24px}p{font-size:24px;line-height:1.5}small{font-size:19px;color:#b6c7b9}.etat{white-space:pre-line;margin-top:40px;padding:24px;border:1px solid #4e7854;border-radius:16px;background:#ffffff09;font-size:22px;line-height:1.6}.appareil{position:absolute;left:770px;top:40px;width:576px;height:768px;border:12px solid #304036;border-radius:24px;overflow:clip;box-shadow:0 18px 60px #0009}iframe{width:768px;height:1024px;transform:scale(.75);transform-origin:top left;border:0;background:#101910}</style><aside><h1>Le joueur sur sa tablette</h1><p>Nel Varga · à bord du Montero<br>Vrai Hub HTTP / WebSocket</p><small>Écran tactile émulé : 768 × 1024<br>Aucun appareil physique utilisé</small><div class="etat" id="clip-reception">Les trois accès sont ouverts.\nLe joueur rejoint son personnage.</div></aside><div class="appareil"><iframe title="Tablette du joueur" id="tablette" src="http://127.0.0.1:${g.ports.sync}/?window=tablet&sync=${g.ports.sync}"></iframe></div></html>`;
        await contexte.route('**/film-modules-presentation.html',route=>route.fulfill({contentType:'text/html; charset=utf-8',body:contenuStage}));await stage.goto(`http://127.0.0.1:${g.ports.sync}/film-modules-presentation.html`);await stage.evaluate(installerLaScene);
        const rt=new RealisationTactile(stage),hub=stage.frameLocator('#tablette'),client=stage.frames().find(fr=>fr.url().includes('window=tablet'))!;
        expect(await client.evaluate(()=>navigator.maxTouchPoints)).toBeGreaterThan(0);expect(await client.evaluate(()=>[innerWidth,innerHeight])).toEqual([768,1024]);expect(await client.evaluate(()=>!!window.appBridge)).toBe(false);
        await client.evaluate(()=>{const w=window as unknown as {touchesFilmAlien:number};w.touchesFilmAlien=0;document.addEventListener('touchstart',()=>w.touchesFilmAlien++,true);});
        const debutSegment=()=>{const date=Date.now();return {debutMJ:(date-ouverture)/1000,finMJ:0,debutTablette:(date-debutTournageTablette)/1000,finTablette:0};};
        const finSegment=(seg:typeof segmentsTablette[number])=>{const date=Date.now();seg.finMJ=(date-ouverture)/1000;seg.finTablette=(date-debutTournageTablette)/1000;segmentsTablette.push(seg);};
        const chapitreTablette=async(titre:string,seg:typeof segmentsTablette[number])=>{chapitres.push({titre,secondesDepuisTitre:seg.debutMJ});await rt.chapitre(titre);};
        const instrument=async(nom:string)=>{await rt.cliquer(hub.getByRole('navigation',{name:'Navigation Hub'}).getByRole('button',{name:'Modules du jeu',exact:true}));const retour=hub.getByRole('button',{name:'Retour aux modules',exact:true});if(await retour.count())await rt.cliquer(retour);await rt.cliquer(hub.getByRole('button',{name:`Ouvrir ${nom}`,exact:true}));};
        let seg=debutSegment();await chapitreTablette('2 · MU/TH/UR : poser une question privée',seg);
        await rt.cliquer(hub.getByRole('button',{name:/Nel Varga/}));await expect(hub.getByText('Connecté',{exact:true})).toBeVisible();await instrument('MU/TH/UR 6000');
        await rt.taper(hub.getByLabel('Commande ou /M votre question',{exact:true}),'/M Maman, peut-on emprunter la coursive Est ?');await rt.cliquer(hub.getByRole('button',{name:'Transmettre',exact:true}));
        await expect(f.locator('.gmos-muthur').getByText('/M Maman, peut-on emprunter la coursive Est ?',{exact:true})).toBeVisible();
        await rt.legende('Avec /M, Nel adresse une question privée au meneur.','Il utilise son vrai terminal. La réponse viendra du pupitre de Maman, sans révéler les dossiers ni la préparation.',4300);await photo('02-question-tablette',stage);finSegment(seg);

        await chapitre('3 · Maman répond, puis prépare le M314');
        const maman=f.locator('.gmos-muthur');await r.taper(maman.getByLabel('Réponse de Maman',{exact:true}),'Coursive accessible. Scanner avant de progresser.');await r.cliquer(maman.getByRole('button',{name:'Transmettre la réponse',exact:true}));
        await expect(hub.getByText('Coursive accessible. Scanner avant de progresser.',{exact:true})).toBeVisible();await r.legende('Maman répond à Nel depuis son pupitre.','Cette réponse est réellement reçue dans le Hub. Le meneur conserve le contrôle des informations du terminal.',4000);await photo('03-reponse-maman');
        await pupitre('Détecteur de mouvement');const det=f.locator('.gmos-detecteur');
        await r.montrer(det.getByRole('img',{name:'Plan privé des zones',exact:true}),2600);
        await r.legende('Le plan d’exercice est déjà préparé : deux mouvements et une cible immobile.','Maman crée les zones et place ses pions en secret. Nel est le porteur du plan ; le détecteur possède sa propre batterie.',4600);await photo('04-plan-prive');
        await r.cocher(det.getByLabel('Raccorder le détecteur au plan et à sa batterie',{exact:true}));
        await r.choisir(det.getByLabel('Joueur qui oriente le M314',{exact:true}),{label:'Nel Varga'});
        await r.choisir(det.getByLabel('Ouverture du cône',{exact:true}),'90');
        for(let i=0;i<6;i++)await r.cliquer(det.getByRole('button',{name:'Tourner de 15° vers la droite',exact:true}),140);
        await expect(det.getByText('Cap : Est · 90°',{exact:true})).toBeVisible();
        await r.legende('Maman choisit le joueur autorisé à tourner et ouvre un cône de 90°.','Le joueur porte le cap ; le meneur garde toujours la main et choisit la largeur. Le nord est en haut du plan, l’est à droite.',4400);await photo('05-orientation-meneur');
        await r.cliquer(det.getByRole('button',{name:'Scanner ce Tour et tester l’Énergie',exact:true}));
        const recu=structuredClone((await detecteur()).discret.dernierScan),energie=(await detecteur()).discret.energie;
        await expect(det.getByRole('button',{name:'Scanner ce Tour et tester l’Énergie',exact:true})).toBeDisabled();
        await r.legende('Un seul scan payé pour ce Tour : l’Énergie est testée.','Le relevé reste disponible. Tourner ne relance aucun dé et ne consomme pas de nouvelle charge ; ce n’est pas un suivi en direct.',4300);await photo('06-scan-paye');

        seg=debutSegment();await chapitreTablette('4 · Le porteur explore le même scan en tournant',seg);
        await stage.evaluate(()=>document.getElementById('clip-reception')!.textContent='Réponse privée reçue.\nLe porteur peut maintenant orienter le M314.');
        await rt.montrer(hub.getByText('Coursive accessible. Scanner avant de progresser.',{exact:true}),2200);
        await instrument('Détecteur de mouvement');await expect(hub.getByText('Coursive Est : 1 écho',{exact:true})).toBeVisible();
        await expect(hub.getByText('Soute Nord : 1 écho',{exact:true})).toHaveCount(0);await expect(hub.getByText('Créature immobile',{exact:true})).toHaveCount(0);
        await rt.montrer(hub.getByRole('img',{name:'Radar : 1 écho',exact:true}),1800);
        await rt.legende('À l’est, Nel reçoit un écho anonyme dans le cône.','La cible immobile ne produit aucun écho. Le joueur ne reçoit pas les cibles hors champ ni les noms privés du plan.',4600);await photo('07-m314-est',stage);
        for(let i=0;i<6;i++)await rt.cliquer(hub.getByRole('button',{name:'Tourner de 15° vers la gauche',exact:true}),170);
        await expect(hub.getByText('Soute Nord : 1 écho',{exact:true})).toBeVisible();await expect(hub.getByText('Coursive Est : 1 écho',{exact:true})).toHaveCount(0);
        expect((await detecteur()).discret.dernierScan).toEqual(recu);expect((await detecteur()).discret.energie).toBe(energie);
        await expect(det.getByText('Cap : Nord · 0°',{exact:true})).toBeVisible();
        await stage.evaluate(()=>document.getElementById('clip-reception')!.textContent='Cap nord reçu côté meneur.\nMême relevé, même Énergie.\nAucun nouveau scan.');
        await rt.montrer(hub.getByText('Soute Nord : 1 écho',{exact:true}),1800);
        await rt.montrer(hub.getByRole('img',{name:'Radar : 1 écho',exact:true}),1800);
        await rt.legende('Au nord, un autre écho apparaît : le cap est partagé avec Maman.','Les boutons produisent de vrais touchers dans le Hub. Seul le champ change ; le relevé et la batterie sont conservés.',4600);await photo('08-m314-nord',stage);finSegment(seg);

        await chapitre('5 · Rendre un pion immobile, puis scanner le Tour suivant');
        await r.cliquer(det.getByRole('button',{name:'En mouvement : Rôdeur de la soute',exact:true}));
        await expect(det.getByRole('button',{name:'Immobile : Rôdeur de la soute',exact:true})).toBeVisible();
        await expect(hub.getByText('Soute Nord : 1 écho',{exact:true})).toBeVisible();
        await r.legende('Maman marque le rôdeur de la soute Immobile.','Le dernier scan ne se réécrit pas : son ancien écho reste dans le relevé payé. Le prochain scan prendra le nouvel état en compte.',4500);await photo('09-immobilite');
        await r.cliquer(det.getByRole('button',{name:'Valider le Tour suivant',exact:true}));
        await r.cliquer(det.getByRole('button',{name:'Immobile : Rôdeur de la coursive',exact:true}));
        if((await detecteur()).discret.energie===0){await r.taper(det.getByLabel('Réserve propre à la batterie du M314',{exact:true}),'5');await r.cliquer(det.getByRole('button',{name:'Confirmer porteur et batterie',exact:true}));}
        await r.cliquer(det.getByRole('button',{name:'Scanner ce Tour et tester l’Énergie',exact:true}));
        await expect(hub.getByText('Aucun écho à afficher.',{exact:true})).toBeVisible();
        await r.legende('Au Tour deux, seule la coursive Est bouge : nouveau scan, nouveau coût.','Le passage au Tour suivant remet les mouvements à zéro. Maman réactive seulement les pions qui bougent ; les budgets restent séparés.',4400);await photo('10-tour-suivant');

        seg=debutSegment();await chapitreTablette('6 · Le nouvel écho, puis un ordre de combat spatial',seg);
        await stage.evaluate(()=>document.getElementById('clip-reception')!.textContent='Tour 2 : scan reçu.\nAu nord, aucun écho.\nLa coursive Est reste mobile.');
        await rt.montrer(hub.getByText('Aucun écho à afficher.',{exact:true}),2300);
        for(let i=0;i<6;i++)await rt.cliquer(hub.getByRole('button',{name:'Tourner de 15° vers la droite',exact:true}),170);
        await expect(hub.getByText('Coursive Est : 1 écho',{exact:true})).toBeVisible();
        await rt.montrer(hub.getByRole('img',{name:'Radar : 1 écho',exact:true}),1800);
        await rt.legende('Nel retrouve le mouvement de la coursive en tournant à l’est.','La soute immobile a disparu du nouveau relevé. Le détecteur indique un mouvement ; il n’accorde aucune ligne de vue.',4200);await photo('11-m314-tour-deux',stage);
        await instrument('Combat spatial');const sh=hub.locator('.gmos-spatial');
        await expect(sh.getByRole('list',{name:'Contacts'})).toContainText('Contact non identifié');
        await rt.legende('Nel tient le poste Senseurs du Montero.','Les vaisseaux et équipages sont préparés pour l’exercice. Le transpondeur adverse est coupé : son identité reste cachée au joueur.',4000);await photo('12-poste-senseurs',stage);
        await rt.choisir(sh.getByLabel('Action de Montero',{exact:true}),'verrouiller');await rt.cliquer(sh.getByRole('form',{name:'Ordre de Montero',exact:true}).getByRole('button',{name:'Donner l’ordre',exact:true}));
        await expect(sh.locator('[data-ordre-donne]')).toContainText('Verrouillage de la cible');await expect.poll(async()=>JSON.stringify((await spatial()).combat)).toContain('verrouiller');
        await stage.evaluate(()=>document.getElementById('clip-reception')!.textContent='Ordre du poste Senseurs reçu côté MJ.\nLes choix adverses restent secrets.');
        await rt.legende('Le joueur transmet un ordre de verrouillage depuis son vrai poste.','Le meneur le reçoit. Les autres décisions restent cachées jusqu’à la révélation de cette phase.',4200);await photo('13-ordre-spatial',stage);finSegment(seg);
        touchersRecus=await client.evaluate(()=>(window as unknown as {touchesFilmAlien:number}).touchesFilmAlien);expect(touchersRecus).toBeGreaterThan(20);
        finTournageTablette=Date.now();const videoTablette=stage.video();await contexte.close();contexte=undefined;fichierTablette=await videoTablette?.path();await navigateur.close();navigateur=undefined;
        segmentsTablette[segmentsTablette.length-1].finMJ=(Date.now()-ouverture)/1000;

        await chapitre('7 · Révéler les ordres et garder une préparation');await pupitre('Combat spatial');
        await r.cliquer(ps.getByRole('button',{name:'Révéler les ordres',exact:true}));await expect.poll(async()=>(await spatial()).combat?.etape).toBe('resolution');
        await r.legende('Maman révèle les ordres : la phase passe en résolution.','Les jets, dégâts et avaries se traitent ensuite dans le module. Cette démonstration montre le trajet de l’ordre, pas un combat spatial complet.',4300);await photo('14-revelation');
        await pupitre('Détecteur de mouvement');await r.taper(det.getByLabel('Nom du préréglage',{exact:true}),'Montero — coursives');await r.cliquer(det.getByRole('button',{name:'Enregistrer la préparation actuelle',exact:true}));
        await expect(det.getByLabel('Préréglage',{exact:true})).toContainText('Montero — coursives');
        await r.legende('Un préréglage garde la préparation du détecteur pour la retrouver.','Le rappel repart au Tour un, scan arrêté. La remise à zéro demande confirmation et conserve les préréglages : ce n’est pas une sauvegarde du relevé de séance.',4600);await photo('15-prereglage');
        await r.titre('Maman garde les secrets · le joueur utilise ses instruments',['MU/TH/UR : échange privé · M314 : cône partagé · Espace : ordre reçu','Le film utilise des données fictives, deux vrais clients et des touchers émulés.','Aucun profil personnel modifié · pas de gyroscope · aucun appareil physique'],6500);
        reussi=true;fin=Date.now();
    }catch(erreur){await f.screenshot({path:path.join(PREUVES,'diagnostic-echec.jpg'),type:'jpeg'});if(stage&&!stage.isClosed())await stage.screenshot({path:path.join(PREUVES,'diagnostic-tablette.jpg'),type:'jpeg'});throw erreur;}
    finally{
        await contexte?.close();await navigateur?.close();const video=f.video();await g.fermer();const fichierVideo=await video?.path();
        if(reussi&&fichierVideo&&fichierTablette){
            const parametres={nomFichier:'alien-modules-m314-orientable',dossier:DOSSIER,dureeDepuisTitre:(fin-ouverture)/1000,dureeTournageTablette:(finTournageTablette-debutTournageTablette)/1000,segmentsTablette,chapitres};
            const p=path.join(brut,'montage.json');fs.writeFileSync(p,JSON.stringify(parametres));
            const exportVideo=JSON.parse(execFileSync(process.execPath,['outils/clips/monter_clip_alien.mjs',fichierVideo,fichierTablette,SORTIE,p],{encoding:'utf8'}));
            fs.writeFileSync(path.join(PREUVES,'verification.json'),JSON.stringify({date:'2026-11-15',pilote:source.gameDriver.version,detecteur:'0.5.0',profilJetable:true,donneesPersonnelles:false,narrationSonore:false,scanM314Aleatoire:true,modeRapide:!!process.env.GMOS_CLIP_RAPIDE,
                exportVideo,photos,tablette:{client:'Hub HTTP/WebSocket réel sans appBridge',viewport:{largeur:768,hauteur:1024},contexteTactile:true,touchersRecus,appareilPhysique:false},
                assertions:['trois accès indépendants','question /M et réponse réellement transmises','cap joueur reçu côté MJ','champ 90 degrés : un seul écho autorisé','identités privées absentes','rotation sans second test ni perte de batterie','immobilité sans réécrire le relevé payé','nouveau Tour et nouveau scan : mouvement de la coursive seulement','ordre Senseurs reçu et révélé','préréglage conservé'],
            },null,2)+'\n');
        }
        const relatif=path.relative(racineTemp,path.resolve(brut));
        if(relatif&&!relatif.startsWith('..')&&!path.isAbsolute(relatif)&&path.basename(brut).startsWith('gmos-film-modules-alien-'))fs.rmSync(brut,{recursive:true,force:true});
        else console.error('Nettoyage temporaire refusé.');
    }
});
