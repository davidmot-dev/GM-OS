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
import type { useCombatStore } from '../src/modules/combat/useCombatStore';
import type { useSessionOSStore } from '../src/modules/session/useSessionOSStore';
import { validateSession } from '../src/types/schemas';

/** David, 07/11/2026 : filmer les mécanismes particuliers de Torg avec Playwright.
 * Instance jetable, personnage et effets fictifs, vrais gestes, dés préparés.
 * npm run build puis npx playwright test e2e/clipTorg.spec.ts --reporter=list
 */
const PILOTE = path.resolve(process.env.GMOS_PILOTE_TORG ?? 'Export Dirvers/corriges/Torg-Eternity-2.0.0.gmos-driver');
const SORTIE = path.resolve(process.env.GMOS_SORTIE_CLIP ?? 'output/clips');
const PREUVES = path.join(SORTIE, 'torg');
const CAMPAGNE = 'clip-torg';
const LARGEUR = 1440, HAUTEUR = 900;
type Fenetre = Window & { useCombatStore: typeof useCombatStore; useSessionOSStore: typeof useSessionOSStore; useDiceStore: typeof useDiceStore; useJournalStore: typeof useJournalStore; hasardClipTorg?: () => number };

/** Curseur, surlignage et légendes comme le clip RuneQuest ; palette de terminal vert et ambre. */
function installerLaScene() {
    const style = document.createElement('style');
    style.textContent = `
      #clip-curseur{position:fixed;left:0;top:0;z-index:2147483647;pointer-events:none;transform:translate(-100px,-100px);filter:drop-shadow(0 2px 3px #000)}
      #clip-curseur.clic::after{content:'';position:absolute;left:-14px;top:-14px;width:28px;height:28px;border:3px solid #e2ad6e;border-radius:50%;animation:clip-onde .5s ease-out forwards}
      @keyframes clip-onde{from{transform:scale(.3);opacity:1}to{transform:scale(1.6);opacity:0}}
      #clip-anneau{position:fixed;z-index:2147483646;pointer-events:none;border:3px solid #e2ad6e;border-radius:8px;box-shadow:0 0 18px #e2ad6e66;opacity:0}
      #clip-legende{position:fixed;left:50%;bottom:20px;transform:translateX(-50%);max-width:1160px;width:max-content;z-index:2147483645;pointer-events:none;background:#050b19f2;color:white;font:600 22px/1.35 'Segoe UI',system-ui,sans-serif;padding:14px 24px;border-radius:12px;border:1px solid #e2ad6e;box-shadow:0 8px 28px #0009;opacity:0}
      #clip-legende small{display:block;font-size:17px;font-weight:400;color:#ead7af;margin-top:5px}
      #clip-chapitre{position:fixed;top:14px;left:50%;transform:translateX(-50%);z-index:2147483645;pointer-events:none;background:#e2ad6e;color:#030b15;font:800 15px 'Segoe UI',system-ui,sans-serif;padding:7px 18px;border-radius:999px;letter-spacing:.04em;opacity:0}
      #clip-titre{position:fixed;inset:0;z-index:2147483646;pointer-events:none;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;background:radial-gradient(ellipse at 30% 35%,#16302a,#050d0c 65%);color:#fff;font-family:'Segoe UI',system-ui,sans-serif;text-align:center;opacity:0;transition:opacity .4s}
      #clip-titre h1{font-size:52px;margin:0;color:#e2ad6e}#clip-titre p{font-size:24px;margin:0;max-width:1100px;line-height:1.4}
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
            const w = window as unknown as Fenetre; w.hasardClipTorg ??= Math.random;
            const origine = w.hasardClipTorg; Math.random = () => file.length ? file.shift()! : origine();
        }, file);
    }
    async rendreLeHasard() { await this.page.evaluate(() => { const w = window as unknown as Fenetre; if (w.hasardClipTorg) Math.random = w.hasardClipTorg; }); }
}




/** Un véritable événement tactile, envoyé dans le client Hub HTTP, pas dans le magasin MJ. */
class RealisationTactile extends Realisation {
    async balayer(depart:{x:number;y:number},arrivee:{x:number;y:number}){
        const session=await this.page.context().newCDPSession(this.page);
        try{
            await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...depart,radiusX:10,radiusY:10,force:1,id:1}]});
            for(let i=1;i<=18;i++){
                const point={x:depart.x+(arrivee.x-depart.x)*i/18,y:depart.y+(arrivee.y-depart.y)*i/18};
                await this.page.evaluate(p=>document.getElementById('clip-curseur')!.style.transform=`translate(${p.x}px,${p.y}px)`,point);
                await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{...point,radiusX:10,radiusY:10,force:1,id:1}]});await this.page.waitForTimeout(20);
            }
            await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await this.pause(900);
        }finally{await session.detach();}
    }
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

test('Torg : Possibilités, Atouts, cartes, Lois des cosms et vrai Hub tactile', async () => {
    test.setTimeout(1_200_000);
    fs.mkdirSync(PREUVES, { recursive: true });
    const racineTemp = path.resolve(os.tmpdir()), brut = fs.mkdtempSync(path.join(racineTemp, 'gmos-clip-torg-'));
    if (!path.resolve(brut).startsWith(racineTemp + path.sep)) throw Error('Profil inattendu');
    const source = JSON.parse(new AdmZip(PILOTE).readAsText('state.json'));
    const semence = JSON.parse(fs.readFileSync('e2e/donnees/campagne-de-demo.json', 'utf8')), s = semence.modules.sessionOS;
    const defaults = Object.fromEntries(source.sheetTemplate.sections.flatMap((x: {fields: {id:string;defaultValue:unknown}[]}) => x.fields).map((x: {id:string;defaultValue:unknown}) => [x.id, x.defaultValue ?? '']));
    const health = (n = 4, blessures = 0) => ({type: 'boxes', state: blessures ? 'wounded' : 'healthy', data: {champ: 'blessures', libelle: 'Blessures', boxes: Array.from({length:n}, (_,i) => ({label:'',filled:i<blessures})), seuils:source.gameDriver.combat.casesDeSante.seuils}});
    s.campaigns = [{id:CAMPAGNE,name:'Les Failles de la réalité',system:source.gameDriver.id,systemPath:'systems/torg',activeLocationIds:[],cosmsParDefaut:['prime-terre']}];
    s.activeCampaignId=CAMPAGNE;s.customGameDrivers=[source.gameDriver];s.customSheetTemplates=[source.sheetTemplate];
    s.players=['mara','teo'].map((id,i)=>({id:`clip-joueur-${id}`,realName:`Joueur fictif ${i+1}`,avatarUrl:'',isOnline:false,characters:[{id,name:i?'Teo Vale':'Mara Quill',portraitUrl:'',campaignId:CAMPAGNE,systemId:source.gameDriver.id,templateId:source.sheetTemplate.id,healthSystem:health(4,i?0:1),sheetData:{...defaults,nom:i?'Teo Vale':'Mara Quill',race:'Humain',cosm_origine:'Prime Terre',concept:i?'Éclaireur':'Chevalière des Tempêtes',dexterite:i?8:9,esquive:2,esquive_def:10,raison:10,sciences_humaines:3,esprit:9,realite:3,force:8,resistance:10,blessures:i?0:1,choc:i?3:8,possibilites:3,torg_atouts_ingenieux:!i}}]}));
    s.entities=[];s.scenes=[];s.actes=[];s.demandesDeCarte=[];
    s.sessions=[{...s.sessions[0],id:'clip-seance-torg',campaignId:CAMPAGNE,status:'active',number:1,sessionEntityIds:['mara','teo'],publicSummary:'Démonstration fictive des mécanismes de Torg.'}];
    s.decks=source.paquets.map((p:{role:string})=>({...p,id:p.role,ouvertAuxJoueurs:p.role==='destin'}));
    s.decks.find((p:{id:string})=>p.id==='action').cardMetadata={12:{name:'Gardez la pose !',action:{standard:{premier:'H',heros:['un-de-plus'],vilains:[]},dramatique:{premier:'V',heros:[],vilains:['fatigues']},approuvees:['intimidation','provocation']}}};
    s.decks.find((p:{id:string})=>p.id==='destin').cardMetadata=Object.fromEntries(['Monologue','Plan de secours','Romance','Seconde chance','Échappé belle'].map((name,i)=>[i+1,{name}]));
    s.decks.find((p:{id:string})=>p.id==='cosm').cardMetadata={1:{name:'Suspens'}};
    const etat=(id:string,indices:number[],enMain:unknown[]=[])=>({deckId:id,currentCardIndex:null,remainingIndices:indices,discardedIndices:[],enMain});
    s.deckStates={action:etat('action',[12]),destin:etat('destin',[3,4,5],[{index:1,porteur:'mara',face:'revelee'},{index:2,porteur:'teo',face:'revelee'}]),cosm:etat('cosm',[1,2,3,4,5,6,7,8,9])};
    validateSession(semence);
    const fichierSemence=path.join(brut,'semence.json');fs.writeFileSync(fichierSemence,JSON.stringify(semence));
    const g=await lancerGmOs({semence:fichierSemence,video:{dossier:brut,largeur:LARGEUR,hauteur:HAUTEUR},preparerLeProfil:profil=>{
        for(const d of ['theme','fiche'])fs.cpSync(path.resolve('docs/systems/torg',d),path.join(profil,'corpus/systems/torg',d),{recursive:true});
        fs.mkdirSync(path.join(profil,'corpus/fiches'),{recursive:true});fs.copyFileSync('docs/fiches/Character_Sheet_Manager.html',path.join(profil,'corpus/fiches/Character_Sheet_Manager.html'));
    }});
    const f=g.fenetre,r=new Realisation(f),chapitres:{titre:string;secondesDepuisTitre:number}[]=[];
    f.setDefaultTimeout(15_000);
    let ouverture=0,fin=0,reussi=false,navigateur:Browser|undefined,contexte:BrowserContext|undefined,stage:Page|undefined,fichierTablette:string|undefined,debutTournageTablette=0,touchersRecus=0,mouvementsRecus=0;
    const segmentsTablette:{debutMJ:number;finMJ:number;debutTablette:number;finTablette:number}[]=[];
    const coupesMJ:{debut:number;fin:number}[]=[];
    const personnage=(id='mara')=>f.evaluate(id=>(window as unknown as Fenetre).useSessionOSStore.getState().players.flatMap(p=>p.characters).find(c=>c.id===id)!,id);
    const hasard=async(client:Page|Frame,file:number[],action:()=>Promise<void>)=>{
        await client.evaluate(file=>{const w=window as unknown as Fenetre;w.hasardClipTorg??=Math.random;const origine=w.hasardClipTorg;Math.random=()=>new Error().stack?.includes('.roll (')?(file.length?file.shift()!:origine()):origine();},file.every(v=>v===file[0])?Array(300).fill(file[0]):file);
        try{await action();}finally{await client.evaluate(()=>{const w=window as unknown as Fenetre;if(w.hasardClipTorg)Math.random=w.hasardClipTorg;});}
    };
    const chapitre=async(titre:string)=>{console.info(titre);chapitres.push({titre,secondesDepuisTitre:(Date.now()-ouverture)/1000});await r.chapitre(titre);};
    const photo=(nom:string,page=f)=>page.screenshot({path:path.join(PREUVES,nom+'.jpg'),type:'jpeg',quality:85,scale:'css'});
    const vue=async(id='mara',onglet='Lancer un test')=>{await ouvrirLeModule(g,'Tableau de Bord');await f.evaluate(id=>{const se=(window as unknown as Fenetre).useSessionOSStore.getState();se.setSelectedPlayer('clip-joueur-'+id);se.setSelectedCharacter(id);se.setCurrentView('players');},id);await ongletDeLaFiche(f,onglet);};
    // Les images imprimées restent les vrais JPEG du dépôt. La présentation seule
    // résout leurs chemins file:// dans Electron ; aucune mécanique n'est remplacée.
    const images:Record<string,string>={};
    for(const dossier of ['action','destin','cosm'])for(const nom of fs.readdirSync('public/assets/decks/torg/'+dossier).filter(n=>n.endsWith('.jpg'))){const cle='assets/decks/torg/'+dossier+'/'+nom;images[cle]='data:image/jpeg;base64,'+fs.readFileSync('public/'+cle).toString('base64');}
    const lierLesImages=(images:Record<string,string>)=>{
        const corriger=()=>document.querySelectorAll<HTMLImageElement>('img').forEach(img=>{const cle=img.getAttribute('src')?.match(/assets\/decks\/torg\/[^?#]+/)?.[0];if(cle&&images[cle]){img.src=images[cle];img.style.removeProperty('display');}});
        new MutationObserver(corriger).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['src']});corriger();
    };
    try{
        await attendreLHydratation(g);await expect.poll(()=>f.evaluate(()=>(window as unknown as Fenetre).useSessionOSStore.getState().campaigns.map(c=>c.id))).toContain(CAMPAGNE);
        const fenetre=await g.application.browserWindow(f);await fenetre.evaluate((w,t)=>{w.setFullScreen(false);w.unmaximize();w.setResizable(false);w.setContentSize(t.l,t.h);w.webContents.setAudioMuted(true);},{l:LARGEUR,h:HAUTEUR});await f.setViewportSize({width:LARGEUR,height:HAUTEUR});
        await ouvrirLeModule(g,'Tableau de Bord');await f.evaluate(({campagne,health})=>{const w=window as unknown as Fenetre;w.useSessionOSStore.getState().setActiveCampaign(campagne);w.useJournalStore.getState().addJournal('Clip Torg fictif');w.useJournalStore.setState({isRecording:true});w.useCombatStore.setState({combatants:[
            {id:'mara-cb',name:'Mara Quill',init:0,isPlayer:true,faction:'player',sourcePlayerId:'mara',statuses:[],healthSystem:{...health,data:{...health.data,boxes:health.data.boxes.map((b,i)=>({...b,filled:i===0}))}}},
            {id:'teo-cb',name:'Teo Vale',init:0,isPlayer:true,faction:'player',sourcePlayerId:'teo',statuses:[],healthSystem:health},
            {id:'mobius',name:'Möbius, chef des pillards',init:0,isPlayer:false,faction:'enemy',statuses:[],sheetData:{esprit:10,realite:3,resistance:12,choc:0,torg_capacites_sbires:true},healthSystem:health},
            {id:'laquais',name:'Laquais proche de Möbius',init:0,isPlayer:false,faction:'enemy',statuses:[],sheetData:{esprit:7,resistance:8,choc:0},healthSystem:{...health,data:{...health.data,boxes:health.data.boxes.slice(0,1)}}}
        ]} as never);},{campagne:CAMPAGNE,health:health()});
        await f.evaluate(lierLesImages,images);
        for(const id of ['teo','mara']){await vue(id,'Fiche du jeu');await f.getByRole('button',{name:/Créer une fiche pour/}).click({timeout:60_000});await expect(f.frameLocator('iframe').first().locator('[data-key="identity.name"]')).toHaveValue(id==='mara'?'Mara Quill':'Teo Vale',{timeout:30_000});}
        await ongletDeLaFiche(f,'Lancer un test');await f.evaluate(installerLaScene);await r.carte('');
        const p=f.locator('[data-panneau-de-jet]').first(),resultat=p.getByRole('region',{name:'Résultat',exact:true});
        ouverture=Date.now();await r.titre('Torg Eternity · les Failles de la réalité',[
            'd20 explosif · Possibilités · Ingénieux · cartes d’Action et du Destin',
            'Lois des cosms · Ténacité · Sbires · vrai Hub joueur tactile',
            'Personnages fictifs et dés préparés · cartes du dépôt · sans voix ni musique'
        ],6500);
        await chapitre('1 · Le dé explose, puis la table donne le bonus');
        await r.choisir(p.locator('select').nth(0),'dexterite');await r.choisir(p.locator('select').nth(1),'esquive');
        await r.legende('Mara : Dextérité 9 + Esquive 2 − 1 Blessure = 10.','Le jet est formé : un 10 ou un 20 explose. La difficulté est 10.',3500);
        await hasard(f,[.45,.30],()=>r.cliquer(p.getByRole('button',{name:'Lancer',exact:true})));await expect(resultat).toContainText('14');
        await r.legende('10 puis 7 : le total des dés est 17, pour un bonus de +4.','Valeur 10 + bonus 4 = résultat 14 : succès Simple contre 10.',4500);await photo('01-de-explosif');
        await hasard(f,[.1],()=>r.cliquer(p.getByRole('button',{name:/Dépenser une Possibilité/})));await expect.poll(async()=>(await personnage()).sheetData.possibilites).toBe(2);await expect(resultat).toContainText('19');
        await r.legende('La Possibilité ajoute un dé : son 3 compte pour 10.','17 + 10 = 27, bonus +9 : résultat 19, succès Supérieur. Mara passe de 3 à 2 Possibilités.',5000);await photo('02-possibilite');

        await chapitre('2 · Ingénieux : un Atout possédé, un coût, un choix');await r.carte('atouts-torg');
        const atouts=f.locator('[data-carte-du-jeu="atouts-torg"]');await r.choisir(atouts.getByLabel('Atout de Torg'),'ingenieux');await r.choisir(atouts.getByLabel('Bénéficiaire des cartes'),'teo');
        await r.legende('Ingénieux est coché et enregistré sur la fiche de Mara.','Une fois par scène : 1 Possibilité, une carte pour elle, puis un test de Raison pour aider Teo.',4500);
        await hasard(f,[.75],()=>r.cliquer(atouts.getByRole('button',{name:/Ingénieux · 1 Possibilité/})));await expect.poll(async()=>(await personnage()).sheetData.possibilites).toBe(1);
        await r.cliquer(atouts.getByRole('button',{name:/Garder « Seconde chance »/}));await expect(atouts.getByRole('button',{name:/Ingénieux · 1 Possibilité/})).toBeDisabled();
        await r.legende('Romance rejoint Mara ; Seconde chance rejoint Teo.','Le vrai test de Raison réussit. Le coût est payé et l’usage est bloqué pour le reste de la scène.',5000);await photo('03-ingenieux');

        await chapitre('3 · La carte d’Action ouvre le round');await ouvrirLeModule(g,'Combat-OS');
        const action=f.locator('[data-paquet-d-action]');await r.cliquer(action.getByRole('button',{name:'Retourner la première carte d’Action'}));await expect(action.locator('[data-qui-commence]')).toContainText('Héros');
        const imageAction=action.locator('img').first();await expect.poll(()=>imageAction.evaluate(e=>(e as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
        await imageAction.evaluate(e=>{Object.assign((e as HTMLElement).style,{height:'auto',width:'100%',maxWidth:'100%',objectFit:'contain'});e.parentElement!.style.flexDirection='column';});
        await r.montrer(action.locator('[data-carte-du-round]').first(),3000);
        await r.legende('« Gardez la pose ! » : ligne standard, les Héros commencent.','Un de plus ! est disponible pour leur test. Intimidation et Provocation sont les actions approuvées de ce round.',5500);await photo('04-action');
        // Réserve de Mara préparée pour l’exercice d’échange en plein round.
        await f.evaluate(()=>(window as unknown as Fenetre).useSessionOSStore.getState().poserEnReserve('destin',1));

        const debutConnexion=(Date.now()-ouverture)/1000;
        navigateur=await chromium.launch({channel:'msedge',args:['--mute-audio']});contexte=await navigateur.newContext({viewport:{width:LARGEUR,height:HAUTEUR},recordVideo:{dir:brut,size:{width:LARGEUR,height:HAUTEUR}},isMobile:true,hasTouch:true,deviceScaleFactor:1,serviceWorkers:'block',locale:'fr-FR'});
        await contexte.route('**/*',route=>{const u=new URL(route.request().url());if(['about:','blob:','data:'].includes(u.protocol))return route.continue();if(u.hostname!=='127.0.0.1')return route.abort();if(u.port===String(PORT_FICHES_PAR_DEFAUT)){u.port=String(g.ports.fiches);return route.continue({url:u.href});}return [String(g.ports.fiches),String(g.ports.sync)].includes(u.port)?route.continue():route.abort();});
        await contexte.addInitScript(()=>{if(location.hostname==='127.0.0.1')localStorage.setItem('gmos-tablet-uuid','clip-torg-tactile');});stage=await contexte.newPage();stage.setDefaultTimeout(15_000);debutTournageTablette=Date.now();
        const contenuStage=`<html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{width:1440px;height:900px;overflow:hidden}body{margin:0;background:radial-gradient(ellipse at 25% 35%,#263f40,#090f15 70%);color:#f4efe5;font-family:'Segoe UI',sans-serif}aside{position:absolute;left:65px;top:125px;width:590px}h1{font-size:44px;color:#e2ad6e;margin:0 0 24px}p{font-size:24px;line-height:1.5}small{font-size:19px;color:#b5c4ca}.etat{white-space:pre-line;margin-top:40px;padding:24px;border:1px solid #7b7768;border-radius:16px;background:#ffffff09;font-size:22px;line-height:1.6}.appareil{position:absolute;left:770px;top:48px;width:576px;height:768px;border:12px solid #3e4144;border-radius:24px;overflow:clip;box-shadow:0 18px 60px #0009}iframe{width:768px;height:1024px;transform:scale(.75);transform-origin:top left;border:0;background:#111a22}</style><aside><h1>Le joueur sur sa tablette</h1><p>Teo Vale · Chevalier des Tempêtes<br>Vrai Hub GM-OS, partie fictive</p><small>Émulation tactile 768 × 1024<br>Touchers Playwright · échanges locaux réels</small><div class="etat" id="clip-reception">Connexion du joueur…</div></aside><div class="appareil"><iframe title="Tablette du joueur" id="tablette" src="http://127.0.0.1:${g.ports.sync}/?window=tablet&sync=${g.ports.sync}"></iframe></div></html>`;
        await contexte.route('**/clip-torg-presentation.html',route=>route.fulfill({contentType:'text/html; charset=utf-8',body:contenuStage}));await stage.goto(`http://127.0.0.1:${g.ports.sync}/clip-torg-presentation.html`);await stage.evaluate(installerLaScene);
        const rt=new RealisationTactile(stage),hub=stage.frameLocator('#tablette');await expect(hub.getByRole('button',{name:/Teo Vale/})).toBeVisible();const client=stage.frames().find(fr=>fr.url().includes('window=tablet'))!;expect(await client.evaluate(()=>navigator.maxTouchPoints)).toBeGreaterThan(0);expect(await client.evaluate(()=>[innerWidth,innerHeight])).toEqual([768,1024]);expect(await client.evaluate(()=>!!window.appBridge)).toBe(false);
        await client.evaluate(lierLesImages,images);await client.evaluate(()=>{const w=window as unknown as {touchesClipTorg:number;mouvementsClipTorg:number};w.touchesClipTorg=0;w.mouvementsClipTorg=0;document.addEventListener('touchstart',()=>w.touchesClipTorg++,true);document.addEventListener('touchmove',()=>w.mouvementsClipTorg++,true);});
        await stage.evaluate(()=>{document.getElementById('clip-curseur')!.innerHTML='<svg width="32" height="32" viewBox="0 0 32 32"><circle cx="16" cy="16" r="12" fill="#e2ad6e55" stroke="white" stroke-width="3"/></svg>';});
        const date=Date.now(),seg={debutMJ:(date-ouverture)/1000,finMJ:0,debutTablette:(date-debutTournageTablette)/1000,finTablette:0};
        coupesMJ.push({debut:debutConnexion,fin:seg.debutMJ});
        const tactile=async(titre:string)=>{console.info(titre);chapitres.push({titre,secondesDepuisTitre:(Date.now()-ouverture)/1000});await rt.chapitre(titre);};
        const reception=(texte:string)=>stage!.evaluate(texte=>document.getElementById('clip-reception')!.textContent=texte,texte);
        await tactile('4 · Le joueur touche sa fiche et dépense une Possibilité');
        await rt.cliquer(hub.getByRole('button',{name:/Teo Vale/}));await expect(hub.getByText('Connecté',{exact:true})).toBeVisible();await rt.cliquer(hub.getByTitle('Fiche Personnage',{exact:true}));await rt.cliquer(hub.getByRole('tab',{name:'Lancer un test',exact:true}));
        const ph=hub.locator('[data-panneau-de-jet]').first();await rt.choisir(ph.locator('select').nth(0),'dexterite');await rt.choisir(ph.locator('select').nth(1),'esquive');
        const avant=await f.evaluate(()=>(window as unknown as Fenetre).useDiceStore.getState().history.length);await hasard(client,[.30],()=>rt.cliquer(ph.getByRole('button',{name:'Lancer',exact:true})));await expect.poll(()=>f.evaluate(()=>(window as unknown as Fenetre).useDiceStore.getState().history.length)).toBeGreaterThan(avant);
        await reception('Dextérité 8 + Esquive 2 = 10.\nDé 7, bonus −2 : résultat 8.\nÉchec contre une difficulté de 10.\nJet reçu dans Dice-OS côté MJ.');await rt.legende('Teo lance son test depuis sa tablette.','Le doigt, les boutons et le réseau sont réels dans l’émulation : le MJ reçoit le résultat.',4500);await photo('05-tablette-jet',stage);
        await hasard(client,[.1],()=>rt.cliquer(ph.getByRole('button',{name:/Dépenser une Possibilité/})));await expect.poll(async()=>(await personnage('teo')).sheetData.possibilites).toBe(2);
        await reception('Possibilité : le dé 3 compte pour 10.\nTotal des dés 17, bonus +4.\nRésultat 14 : succès Simple.\nPossibilités reçues côté MJ : 3 → 2.');await rt.legende('Le joueur choisit de payer une Possibilité.','Le coût et le nouveau résultat arrivent dans la vraie partie du meneur.',4500);await photo('06-tablette-possibilite',stage);
        await hasard(client,[.35],()=>rt.cliquer(ph.getByRole('button',{name:'Un de plus !',exact:true})));
        await expect(ph.getByRole('region',{name:'Résultat',exact:true})).toContainText('18');
        await reception('Un de plus ! : le dé donne 8.\nPas de minimum de 10 pour ce dé.\nTotal des dés 25, bonus +8.\nRésultat 18 : succès Supérieur.');await rt.legende('La carte d’Action autorise aussi « Un de plus ! ».','Ce dé donne 8 et ajoute bien 8, sans le minimum de 10 réservé à la Possibilité.',5000);

        await tactile('5 · Destin : Réserve d’Action et échange un contre un');await rt.cliquer(hub.getByRole('button',{name:'Retour',exact:true}));await rt.cliquer(hub.getByRole('navigation').getByTitle('Cartes',{exact:true}));
        await rt.legende('Un glissement du doigt fait défiler les cartes.','Le navigateur reçoit une séquence tactile : appui, déplacement et relâchement.',2500);await rt.balayer({x:1250,y:620},{x:1250,y:300});
        const plan=hub.getByRole('heading',{name:'Plan de secours',exact:true}).locator('..').locator('..');await rt.cliquer(plan.getByRole('button',{name:'Poser en Réserve',exact:true}));
        await expect.poll(()=>f.evaluate(()=>(window as unknown as Fenetre).useSessionOSStore.getState().deckStates.destin.enMain?.find(c=>c.index===2)?.enReserve)).toBe(true);
        await reception('Plan de secours est en Réserve.\nLa carte devient publique.\nMara propose Monologue, déjà en Réserve.\nTeo choisit une carte en contrepartie.');await rt.legende('En plein round, les échanges passent par les Réserves.','Mara a préparé Monologue en Réserve ; Teo vient d’y poser Plan de secours.',4500);
        await f.evaluate(()=>(window as unknown as Fenetre).useSessionOSStore.getState().demanderLeDonDeCarte('destin',1,'mara','teo'));
        const retour=hub.locator('[data-contrepartie-torg]');await expect(retour.getByRole('button',{name:'Accepter l’échange'})).toBeDisabled();await rt.choisir(retour.getByLabel('Carte donnée en retour'),'2');await photo('07-tablette-contrepartie',stage);await rt.cliquer(retour.getByRole('button',{name:'Accepter l’échange'}));
        await expect.poll(()=>f.evaluate(()=>(window as unknown as Fenetre).useSessionOSStore.getState().deckStates.destin.enMain?.find(c=>c.index===1)?.porteur)).toBe('teo');expect(await f.evaluate(()=>(window as unknown as Fenetre).useSessionOSStore.getState().deckStates.destin.enMain?.find(c=>c.index===2)?.porteur)).toBe('mara');
        await reception('Échange accepté et reçu côté MJ.\nTeo reçoit Monologue.\nMara reçoit Plan de secours.\nDeux cartes déplacées ensemble.');await rt.legende('Un toucher confirme l’échange atomique des deux cartes.','L’effet imprimé d’une carte reste soumis à ses conditions et à l’arbitrage du meneur.',5000);
        const monologue=hub.getByRole('heading',{name:'Monologue',exact:true}).locator('..').locator('..');await rt.cliquer(monologue.getByRole('button').first());await rt.legende('Le joueur peut ouvrir la vraie carte pour lire son texte.','Aucune résolution de son effet n’est inventée pour le clip.',4000);await photo('08-tablette-carte',stage);
        // Fermer le lecteur de carte avant de revenir à la fiche.
        await stage.keyboard.press('Escape');const fermer=hub.getByRole('button',{name:/Fermer/});if(await fermer.isVisible())await rt.cliquer(fermer);
        await rt.cliquer(hub.getByTitle('Fiche Personnage',{exact:true}));await rt.cliquer(hub.getByRole('tab',{name:'Ma fiche',exact:true}));
        const html=hub.frameLocator('iframe:visible');const creerTeo=hub.getByRole('button',{name:/Créer une fiche pour/});if(await creerTeo.isVisible())await rt.cliquer(creerTeo);
        await expect(html.locator('[data-key="identity.name"]')).toHaveValue('Teo Vale',{timeout:30_000});await rt.taper(html.locator('[data-key="defenses.dodge"]'),'9');const sauver=html.getByRole('button',{name:/Sauvegarder/});if(await sauver.isVisible())await rt.cliquer(sauver);
        await expect.poll(async()=>(await personnage('teo')).sheetData.esquive_def).toBe(9);await reception('Fiche HTML tactile enregistrée.\nDéfense d’Esquive saisie : 9.\nValeur reçue dans la fiche MJ.');await rt.legende('La fiche du jeu est aussi accessible sur la tablette.','Saisie de la défense d’Esquive à 9 pour l’exercice ; la sauvegarde est vérifiée côté MJ.',4500);await photo('09-tablette-fiche',stage);
        touchersRecus=await client.evaluate(()=>(window as unknown as {touchesClipTorg:number}).touchesClipTorg);mouvementsRecus=await client.evaluate(()=>(window as unknown as {mouvementsClipTorg:number}).mouvementsClipTorg);expect(touchersRecus).toBeGreaterThan(8);expect(mouvementsRecus).toBeGreaterThan(0);
        seg.finTablette=(Date.now()-debutTournageTablette)/1000;const videoTablette=stage.video();await contexte.close();contexte=undefined;fichierTablette=await videoTablette?.path();await navigateur.close();navigateur=undefined;seg.finMJ=(Date.now()-ouverture)/1000;segmentsTablette.push(seg);

        await chapitre('6 · Pan-Pacifica : dépasser le Choc, puis choisir Ténacité');
        await f.evaluate(()=>(window as unknown as Fenetre).useSessionOSStore.getState().updateCampaign('clip-torg',{cosmsParDefaut:['pan-pacifica']}));await ouvrirLeModule(g,'Combat-OS');
        const mara=f.locator('[data-combattant="mara-cb"]');await r.taper(mara.getByTitle('Intensité',{exact:true}),'11');await r.legende('Exercice en Pan-Pacifica : Mara porte 8 Choc sur un Esprit de 9.','Dommages 11 contre Résistance 10 : 2 Choc. Le dépassement de l’Esprit provoque le KO.',4500);await r.cliquer(mara.getByRole('button',{name:'Dégâts',exact:true}));
        const suites=mara.locator('[data-suites-torg]');await expect(suites.getByRole('button',{name:/Ténacité :/})).toBeVisible();await photo('10-tenacite-choix');await r.cliquer(suites.getByRole('button',{name:/Ténacité :/}));await expect.poll(async()=>(await personnage()).sheetData.choc).toBe(0);expect((await personnage()).sheetData.blessures).toBe(2);expect((await personnage()).sheetData.torg_etats_ko).toBe(false);
        await r.legende('Ténacité paie 1 Blessure, efface le Choc et le KO.','Mara passe de 1 à 2 Blessures et revient à 0 Choc. Cette suite répond à un vrai coup reçu.',5000);await photo('11-tenacite-appliquee');

        await chapitre('7 · Tharkold : Sbires et Loi de la Souffrance');await f.evaluate(()=>(window as unknown as Fenetre).useSessionOSStore.getState().updateCampaign('clip-torg',{cosmsParDefaut:['tharkold']}));
        const sbires=f.locator('[data-sbires="mobius"]');await r.taper(sbires.getByLabel('Total de dommages'),'17');await r.choisir(sbires.getByLabel('Sbire qui reçoit le coup'),'laquais');await expect(sbires.getByRole('button',{name:/Sbires · Réalité/})).toBeDisabled();
        await r.legende('Möbius possède explicitement la capacité Sbires.','Le meneur confirme la proximité du laquais avant le vrai test de Réalité contre 10.',4500);await r.cocher(sbires.getByLabel(/Le meneur confirme/));await hasard(f,[.75],()=>r.cliquer(sbires.getByRole('button',{name:/Sbires · Réalité/})));await r.cliquer(sbires.getByRole('button',{name:'Confirmer le coup'}));await expect(sbires.getByRole('button',{name:'Coup appliqué'})).toBeDisabled();
        const laquais=f.locator('[data-combattant="laquais"]');await r.montrer(laquais,2000);expect(await f.evaluate(()=>(window as unknown as Fenetre).useCombatStore.getState().combatants.find(c=>c.id==='mobius')!.healthSystem!.data.boxes.some((b:{filled:boolean})=>b.filled))).toBe(false);
        await r.legende('Le laquais reçoit le coup : 17 contre sa Résistance 8.','Une Blessure et 2 Choc ; Möbius reste intact. Le coup ne peut être confirmé qu’une fois.',5000);await photo('12-sbires');
        const souffrance=laquais.locator('[data-suites-torg]');await r.choisir(souffrance.getByLabel('Auteur de la Blessure'),'teo-cb');await r.cliquer(souffrance.getByRole('button',{name:'Souffrance : récupérer 1 Choc'}));await expect.poll(async()=>(await personnage('teo')).sheetData.choc).toBe(2);
        await r.legende('Sous la Loi de la Souffrance, l’auteur récupère 1 Choc.','Teo passe de 3 à 2 Choc. Ce bénéfice est lié à cette attaque et ne se cumule pas sur plusieurs victimes.',5000);await photo('13-souffrance');

        await chapitre('8 · La fiche du jeu retrouve les choix de la table');const debutChargement=(Date.now()-ouverture)/1000;await vue('mara','Fiche du jeu');await expect(f.frameLocator('iframe').first().locator('[data-key="tracks.shock"]')).toHaveValue('0',{timeout:60_000});await expect(f.frameLocator('iframe').first().locator('[data-key="tracks.wounds"]')).toHaveValue('2');coupesMJ.push({debut:debutChargement,fin:(Date.now()-ouverture)/1000});
        await r.legende('La fiche de Mara conserve 2 Blessures, 0 Choc et 1 Possibilité.','L’Atout, les cartes et les coups ont utilisé les mécanismes réels du pilote. Les scènes et les dés sont préparés.',5000);await photo('14-fiche-mj');
        await r.titre('Les cartes rythment le round · le joueur choisit',[
            'Action · Destin · Réserve · échange 1 pour 1 · Possibilités · Lois des cosms',
            'Touchers du vrai Hub et fiche HTML : effets reçus et vérifiés côté meneur.',
            'Torg Eternity 2.0.0 · émulation tactile, aucun appareil physique · effets narratifs arbitrés par le MJ'
        ],6500);reussi=true;fin=Date.now();
    }catch(erreur){await f.screenshot({path:path.join(PREUVES,'diagnostic-echec.jpg'),type:'jpeg'});fs.writeFileSync(path.join(PREUVES,'diagnostic-frames.json'),JSON.stringify(await Promise.all(f.frames().map(async frame=>({url:frame.url(),texte:await frame.locator('body').innerText().catch(()=>'(non disponible)')}))),null,2));if(stage&&!stage.isClosed())await stage.screenshot({path:path.join(PREUVES,'diagnostic-tablette.jpg'),type:'jpeg'});throw erreur;}
    finally{
        await contexte?.close();await navigateur?.close();const video=f.video();await g.fermer();const fichierVideo=await video?.path();
        if(reussi&&fichierVideo&&fichierTablette){
            const params={dureeDepuisTitre:(fin-ouverture)/1000,segmentsTablette,coupesMJ,chapitres};const montage=path.join(brut,'montage.json');fs.writeFileSync(montage,JSON.stringify(params));
            const exportVideo=JSON.parse(execFileSync(process.execPath,['outils/clips/monter_clip_torg.mjs',fichierVideo,fichierTablette,SORTIE,montage],{encoding:'utf8'}));
            fs.writeFileSync(path.join(PREUVES,'verification.json'),JSON.stringify({date:'2026-11-07',version:source.gameDriver.version,profilJetable:true,donneesPersonnelles:false,desPrepares:true,narrationSonore:false,modeRapide:!!process.env.GMOS_CLIP_RAPIDE,exportVideo,chapitres:exportVideo.chapitres,
                tablette:{client:'Hub HTTP/WebSocket réel sans appBridge',viewport:{largeur:768,hauteur:1024},contexteTactile:true,touchersPlaywright:true,touchersRecus,mouvementsRecus,glissementTactileCDP:true,appareilPhysique:false,jetRecuMJ:true,possibilites3vers2RecuesMJ:true,echangeAtomique1Pour1:true,defenseEsquiveHTML9RecueMJ:true},
                cartes:{images:'JPEG réels public/assets/decks/torg',action:12,destin:[1,2,3,4],cosm:'Paquet présent, non distribué ; exemple de cosm résolu par ses Lois',limite:'Sous-ensemble de cinq cartes du Destin ; aucun effet imprimé joué automatiquement'},
                assertions:['d20 : 10 + 7, bonus4, résultat14','Possibilité : dé3 compte10, résultat19, coût3→2','Ingénieux : coût2→1, Romance pour Mara, Seconde chance pour Teo, une fois/scène','Action13-N : Héros, Un de plus, Intimidation/Provocation','Hub tactile : jet, Possibilité et Un de plus réels','Réserve et échange atomique Monologue contre Plan de secours','fiche HTML : Esquive9 reçue MJ','Pan-Pacifica : coup11/Résistance10, KO puis Ténacité, Choc0/Blessures2','Sbires : capacité explicite, proximité confirmée, test réel, transfert unique au laquais','Tharkold : auteur Teo, Choc3→2','fiche HTML MJ : Choc0, Blessures2']},null,2)+'\n');
        }
        if(path.resolve(brut).startsWith(racineTemp+path.sep))fs.rmSync(brut,{recursive:true,force:true});else console.error('Nettoyage temporaire refusé.');
    }
});
