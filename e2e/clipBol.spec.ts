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
import type { useSessionOSStore } from '../src/modules/session/useSessionOSStore';

/** David, 06/11/2026 : filmer les mécanismes particuliers de BOL avec Playwright.
 * Instance jetable, personnage et effets fictifs, vrais gestes, dés préparés.
 * npm run build puis npx playwright test e2e/clipBol.spec.ts --reporter=list
 */
const PILOTE = path.resolve(process.env.GMOS_PILOTE_BOL ?? 'output/clips/bol/pilote/BOL-2.0.0.gmos-driver');
const SORTIE = path.resolve(process.env.GMOS_SORTIE_CLIP ?? 'output/clips');
const PREUVES = path.join(SORTIE, 'bol');
const CAMPAGNE = 'clip-bol', JOUEUR = 'clip-joueur-bol', PERSO = 'clip-krongar';
const LARGEUR = 1440, HAUTEUR = 900;
type Fenetre = Window & { useSessionOSStore: typeof useSessionOSStore; useDiceStore: typeof useDiceStore; useJournalStore: typeof useJournalStore; hasardClipBol?: () => number };

/** Curseur, surlignage et légendes comme le clip RuneQuest ; palette de terminal vert et ambre. */
function installerLaScene() {
    const style = document.createElement('style');
    style.textContent = `
      #clip-curseur{position:fixed;left:0;top:0;z-index:2147483647;pointer-events:none;transform:translate(-100px,-100px);filter:drop-shadow(0 2px 3px #000)}
      #clip-curseur.clic::after{content:'';position:absolute;left:-14px;top:-14px;width:28px;height:28px;border:3px solid #dfbc72;border-radius:50%;animation:clip-onde .5s ease-out forwards}
      @keyframes clip-onde{from{transform:scale(.3);opacity:1}to{transform:scale(1.6);opacity:0}}
      #clip-anneau{position:fixed;z-index:2147483646;pointer-events:none;border:3px solid #dfbc72;border-radius:8px;box-shadow:0 0 18px #dfbc7266;opacity:0}
      #clip-legende{position:fixed;left:50%;bottom:20px;transform:translateX(-50%);max-width:1160px;width:max-content;z-index:2147483645;pointer-events:none;background:#050b19f2;color:white;font:600 22px/1.35 'Segoe UI',system-ui,sans-serif;padding:14px 24px;border-radius:12px;border:1px solid #dfbc72;box-shadow:0 8px 28px #0009;opacity:0}
      #clip-legende small{display:block;font-size:17px;font-weight:400;color:#ead7af;margin-top:5px}
      #clip-chapitre{position:fixed;top:14px;left:50%;transform:translateX(-50%);z-index:2147483645;pointer-events:none;background:#dfbc72;color:#030b15;font:800 15px 'Segoe UI',system-ui,sans-serif;padding:7px 18px;border-radius:999px;letter-spacing:.04em;opacity:0}
      #clip-titre{position:fixed;inset:0;z-index:2147483646;pointer-events:none;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;background:radial-gradient(ellipse at 30% 35%,#16302a,#050d0c 65%);color:#fff;font-family:'Segoe UI',system-ui,sans-serif;text-align:center;opacity:0;transition:opacity .4s}
      #clip-titre h1{font-size:52px;margin:0;color:#dfbc72}#clip-titre p{font-size:24px;margin:0;max-width:1100px;line-height:1.4}
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
            const w = window as unknown as Fenetre; w.hasardClipBol ??= Math.random;
            const origine = w.hasardClipBol; Math.random = () => file.length ? file.shift()! : origine();
        }, file);
    }
    async rendreLeHasard() { await this.page.evaluate(() => { const w = window as unknown as Fenetre; if (w.hasardClipBol) Math.random = w.hasardClipBol; }); }
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

test('Barbarians of Lemuria : mécanismes, fiche et vrai joueur tactile',async()=>{
    test.setTimeout(1_200_000);expect(fs.existsSync(PILOTE)).toBe(true);fs.mkdirSync(PREUVES,{recursive:true});
    const racineTemp=path.resolve(os.tmpdir()),brut=fs.mkdtempSync(path.join(racineTemp,'gmos-clip-bol-'));
    if(!path.resolve(brut).startsWith(racineTemp+path.sep))throw Error('Profil inattendu');
    const source=JSON.parse(new AdmZip(PILOTE).readAsText('state.json'));expect(source.gameDriver.version).toBe('2.0.0');
    const semence=JSON.parse(fs.readFileSync('e2e/donnees/campagne-de-demo.json','utf8')),s=semence.modules.sessionOS;
    s.campaigns=[{id:CAMPAGNE,name:'Le Seuil de la cité engloutie',system:source.gameDriver.id,systemPath:'systems/barbarian',activeLocationIds:[]}];s.activeCampaignId=CAMPAGNE;s.customGameDrivers=[source.gameDriver];s.customSheetTemplates=[source.sheetTemplate];
    const valeurs=Object.fromEntries(source.sheetTemplate.sections.flatMap((sec:{fields:{id:string;defaultValue?:unknown}[]})=>sec.fields).map((c:{id:string;defaultValue?:unknown})=>[c.id,c.defaultValue??'']));
    const fiche={...valeurs,nom:'Krongar de Valgard',terre_natale:'Valgard',identite:'Aventurier fictif',langues:'Lémurien, valgardien',vigueur:3,agilite:1,esprit:1,aura:0,initiative:1,melee:2,tir:0,defense:1,carriere1_nom:'Barbare',carriere1:2,carriere2_nom:'Mercenaire',carriere2:1,carriere3_nom:'Voleur',carriere3:1,carriere4_nom:'Marin',carriere4:0,arme1:'Épée valgardienne',arme1_degats:'d6+3',equipement1:'Armure légère (d6-3)',vitalite:13,vitalite_max:13,points_heroisme:5,experience:2,avantages:'Arme favorite (épée valgardienne)',desavantages:'Impétueux'};
    s.players=[{id:JOUEUR,realName:'Joueur fictif',isOnline:false,characters:[{id:PERSO,name:'Krongar de Valgard',campaignId:CAMPAGNE,systemId:source.gameDriver.id,templateId:source.sheetTemplate.id,hp:13,maxHp:13,sheetData:fiche}]}];s.entities=[];
    s.sessions=[{...s.sessions[0],id:'clip-seance-bol',campaignId:CAMPAGNE,status:'active',number:1,sessionEntityIds:[PERSO],publicSummary:'Une aventure fictive aux portes de la cité engloutie.'}];
    const semenceFichier=path.join(brut,'semence.json');fs.writeFileSync(semenceFichier,JSON.stringify(semence));
    const g=await lancerGmOs({semence:semenceFichier,video:{dossier:brut,largeur:LARGEUR,hauteur:HAUTEUR},preparerLeProfil:profil=>{
        for(const d of ['theme','fiche'])fs.cpSync(path.resolve('docs/systems/barbarian',d),path.join(profil,'corpus/systems/barbarian',d),{recursive:true});
        fs.mkdirSync(path.join(profil,'corpus/fiches'),{recursive:true});fs.copyFileSync('docs/fiches/Character_Sheet_Manager.html',path.join(profil,'corpus/fiches/Character_Sheet_Manager.html'));
    }});
    const f=g.fenetre,r=new Realisation(f),chapitres:{titre:string;secondesDepuisTitre:number}[]=[];f.setDefaultTimeout(15_000);
    let ouverture=0,fin=0,reussi=false,navigateur:Browser|undefined,contexte:BrowserContext|undefined,stage:Page|undefined;
    let debutTournageTablette=0,finTournageTablette=0,touchersRecus=0,fichierTablette:string|undefined;
    const segmentsTablette:{debutMJ:number;finMJ:number;debutTablette:number;finTablette:number}[]=[];
    const personnage=()=>f.evaluate(id=>(window as unknown as Fenetre).useSessionOSStore.getState().players.flatMap(p=>p.characters).find(c=>c.id===id)!,PERSO);
    const hasard=async(client:Page|Frame,file:number[],action:()=>Promise<void>)=>{await client.evaluate(file=>{const w=window as unknown as Fenetre;w.hasardClipBol??=Math.random;const origine=w.hasardClipBol;Math.random=()=>new Error().stack?.includes('.roll (')?(file.length?file.shift()!:origine()):origine();},file.every(v=>v===file[0])?Array(300).fill(file[0]):file);try{await action();}finally{await client.evaluate(()=>{const w=window as unknown as Fenetre;if(w.hasardClipBol)Math.random=w.hasardClipBol;});}};
    const chapitre=async(titre:string)=>{chapitres.push({titre,secondesDepuisTitre:(Date.now()-ouverture)/1000});await r.chapitre(titre);};
    const photo=(nom:string,page=f)=>page.screenshot({path:path.join(PREUVES,nom+'.jpg'),type:'jpeg',quality:85,scale:'css'});
    const vue=async()=>{await ouvrirLeModule(g,'Tableau de Bord');await f.evaluate(()=>{const s=(window as unknown as Fenetre).useSessionOSStore.getState();s.setSelectedPlayer('clip-joueur-bol');s.setSelectedCharacter('clip-krongar');s.setCurrentView('players');});await ongletDeLaFiche(f,'Lancer un test');};
    try{
        await attendreLHydratation(g);await expect.poll(()=>f.evaluate(()=>(window as unknown as Fenetre).useSessionOSStore.getState().campaigns.map(c=>c.id))).toContain(CAMPAGNE);
        const fenetre=await g.application.browserWindow(f);await fenetre.evaluate((w,t)=>{w.setFullScreen(false);w.unmaximize();w.setResizable(false);w.setMaximizable(false);w.setContentSize(t.l,t.h);w.webContents.setAudioMuted(true);},{l:LARGEUR,h:HAUTEUR});await f.setViewportSize({width:LARGEUR,height:HAUTEUR});
        await ouvrirLeModule(g,'Tableau de Bord');await f.evaluate(()=>{const w=window as unknown as Fenetre;w.useSessionOSStore.getState().setActiveCampaign('clip-bol');w.useJournalStore.getState().addJournal('Clip BoL fictif');w.useJournalStore.setState({isRecording:true});});
        expect((await f.evaluate(()=>window.appBridge!.modulesDuJeu!.lire())).modules).toHaveLength(0);
        await vue();await ongletDeLaFiche(f,'Fiche du jeu');await f.getByRole('button',{name:/Créer une fiche pour/}).click();await expect(f.frameLocator('iframe').first().locator('[data-key="careers.0.name"]')).toHaveValue('Barbare',{timeout:30_000});await ongletDeLaFiche(f,'Lancer un test');
        await f.evaluate(installerLaScene);const p=f.locator('[data-panneau-de-jet]').first(),prep=p.locator('[data-preparation-barbarians]'),suites=p.locator('[data-suites-barbarians]'),resultat=p.getByRole('region',{name:'Résultat',exact:true}),composition=prep.locator('[data-composition-barbarians]');
        const jeter=async(file:number[])=>hasard(f,file,()=>r.cliquer(p.getByRole('button',{name:'Lancer',exact:true})));
        for(const [i,v]of ['vigueur','carriere1'].entries())await p.locator('select').nth(i).selectOption(v);
        ouverture=Date.now();await r.titre('Barbarians of Lemuria · le Seuil englouti',['Deux dés, un héros et ses choix après le jet','Carrières · Bonus et malus · Héroïsme · Réaction · Fiche et joueur sur tablette','Personnage fictif, dés d’exercice préparés — vrais Hub et échanges locaux, sans voix.']);

        await chapitre('1 · Contre neuf : carrière, difficulté, bonus et malus');await r.choisir(prep.getByLabel('Difficulté',{exact:true}),'-1');await r.taper(prep.getByLabel('Dés de bonus',{exact:true}),'1');await r.taper(prep.getByLabel('Dés de malus',{exact:true}),'1');await expect(composition).toContainText('2d6 + 4');
        await r.legende('Vigueur trois + Barbare deux − difficulté Ardue un : +4.','Un dé de bonus et un dé de malus s’annulent. Le total des deux dés, plus quatre, doit atteindre neuf.',3400);await r.montrer(prep,2200);await photo('01-preparation');
        await r.taper(prep.getByLabel('Dés de malus',{exact:true}),'0');await jeter([.2,.7,.55]);await expect(resultat).toContainText('13');await r.legende('Un bonus : trois dés, les deux meilleurs.','Deux, cinq et quatre : cinq + quatre + quatre = treize. Le dé écarté reste visible ; ce sont les dés gardés qui définissent les doubles.',3400);await r.montrer(resultat,2200);await photo('02-bonus');
        await r.taper(prep.getByLabel('Dés de bonus',{exact:true}),'0');await r.taper(prep.getByLabel('Dés de malus',{exact:true}),'1');await jeter([.2,.7,.55]);await expect(resultat).toContainText('10');await r.legende('Un malus : trois dés, les deux pires.','Avec les mêmes dés, deux + quatre + quatre = dix : une réussite simple. Hors combat, la carrière s’ajoute ; au combat, on choisit une aptitude.',3400);await r.montrer(resultat,2200);await photo('03-malus');

        await chapitre('2 · Succès héroïque acheté ou double six légendaire');await r.cliquer(suites.getByRole('button',{name:'Succès héroïque (1)',exact:true}));await expect.poll(async()=>(await personnage()).sheetData.points_heroisme).toBe(4);await expect(resultat).toContainText('Succès héroïque');await expect(suites.getByRole('button',{name:'Succès légendaire (1)',exact:true})).toHaveCount(0);
        await r.legende('Un point fait de cette réussite un succès héroïque.','L’héroïsme passe de cinq à quatre. Cette réussite achetée ne peut pas être promue une seconde fois jusqu’au légendaire.',3400);await r.montrer(suites,2200);await photo('04-heroique');
        await r.taper(prep.getByLabel('Dés de malus',{exact:true}),'0');await r.choisir(prep.getByLabel('Difficulté',{exact:true}),'0');await jeter([.99]);await expect(resultat).toContainText('Succès héroïque');await expect(suites.getByRole('button',{name:'Succès légendaire (1)',exact:true})).toBeVisible();await r.legende('Un double six donne directement un succès héroïque.','Cette fois, le succès vient des dés : le passage au légendaire est proposé.',3000);await photo('05-double-six');
        await r.cliquer(suites.getByRole('button',{name:'Succès légendaire (1)',exact:true}));await expect.poll(async()=>(await personnage()).sheetData.points_heroisme).toBe(3);await expect(resultat).toContainText('Succès légendaire');await r.legende('Un point supplémentaire transforme le double six en succès légendaire.','Il reste trois points d’héroïsme. Le meneur et le joueur appliquent les options narratives ou de combat du livre.',3400);await r.montrer(resultat,2200);await photo('06-legendaire');

        await chapitre('3 · Faveur divine, double un et échec critique choisi');await jeter([.8]);await hasard(f,[0],()=>r.cliquer(suites.getByRole('button',{name:'Faveur divine : relancer (1)',exact:true})));await expect.poll(async()=>(await personnage()).sheetData.points_heroisme).toBe(2);await expect(resultat).toContainText('Échec automatique');
        await r.legende('La Faveur divine relance tous les dés, puis garde le second jet.','Même moins bon : ici le double un remplace la réussite initiale. Un point est payé et le double un échoue toujours.',3500);await r.montrer(resultat,2200);await photo('07-faveur-divine');
        await r.cliquer(suites.getByRole('button',{name:'Échec critique',exact:true}));await r.cliquer(suites.getByRole('button',{name:'Accorder 1 point',exact:true}));await expect.poll(async()=>(await personnage()).sheetData.points_heroisme).toBe(3);await expect(suites.getByRole('button',{name:'Point accordé',exact:true})).toBeDisabled();
        await r.legende('Le joueur choisit d’aggraver le double un en échec critique.','Le MJ accorde ici un point d’héroïsme : deux deviennent trois. Cette attribution n’est pas automatique et le bouton empêche de l’accorder deux fois.',3500);await r.montrer(suites,2200);await photo('08-critique');

        await chapitre('4 · Quand seul un double six pouvait réussir');await r.choisir(prep.getByLabel('Difficulté',{exact:true}),'-8');await jeter([.99]);await expect(resultat).toContainText('Réussite');await expect(suites).toContainText('Seul un double 6 pouvait réussir');await expect(suites.getByRole('button',{name:'Succès héroïque (1)',exact:true})).toHaveCount(0);
        await r.legende('Difficulté Héroïque : +5 −8 = −3. Double six donne neuf.','Tout autre tirage aurait échoué : le double six est ici une réussite simple, sans succès héroïque ni promotion proposée.',3600);await r.montrer(suites,2500);await photo('09-double-six-necessaire');

        await chapitre('5 · Réaction : Esprit et Initiative contre l’adversaire');await r.choisir(p.locator('select').nth(0),'esprit');await r.choisir(p.locator('select').nth(1),'initiative');await r.choisir(prep.getByLabel('Difficulté',{exact:true}),'0');await r.cocher(prep.getByLabel('Jet de réaction',{exact:true}));await r.taper(prep.getByLabel('Défense ou Initiative adverse',{exact:true}),'2');await jeter([.55,.75]);await expect(suites.locator('[data-ordre-de-reaction]')).toContainText('avant les rivaux');
        await r.legende('Esprit un + Initiative un − Initiative adverse deux : zéro.','Quatre + cinq = neuf : Krongar agit avant les rivaux, les coriaces et la piétaille. Le meneur ajuste Combat-OS selon cet ordre de réaction.',3600);await r.montrer(suites.locator('[data-ordre-de-reaction]'),2500);await photo('10-reaction');

        navigateur=await chromium.launch({channel:'msedge',args:['--mute-audio']});contexte=await navigateur.newContext({viewport:{width:LARGEUR,height:HAUTEUR},recordVideo:{dir:brut,size:{width:LARGEUR,height:HAUTEUR}},isMobile:true,hasTouch:true,deviceScaleFactor:1,serviceWorkers:'block',locale:'fr-FR'});
        await contexte.route('**/*',route=>{const u=new URL(route.request().url());if(['about:','blob:','data:'].includes(u.protocol))return route.continue();if(u.hostname!=='127.0.0.1')return route.abort();if(u.port===String(PORT_FICHES_PAR_DEFAUT)){u.port=String(g.ports.fiches);return route.continue({url:u.href});}return [String(g.ports.fiches),String(g.ports.sync)].includes(u.port)?route.continue():route.abort();});
        await contexte.addInitScript(()=>{if(location.hostname==='127.0.0.1')localStorage.setItem('gmos-tablet-uuid','clip-bol-tactile');});stage=await contexte.newPage();stage.setDefaultTimeout(15_000);debutTournageTablette=Date.now();
        const contenuStage=`<html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{width:1440px;height:900px;overflow:hidden}body{margin:0;background:radial-gradient(ellipse at 25% 35%,#30371e,#11140b 70%);color:#f5f1e5;font-family:'Segoe UI',sans-serif}aside{position:absolute;left:70px;top:140px;width:590px}h1{font-size:44px;color:#dfbc72;margin:0 0 24px}p{font-size:24px;line-height:1.5}small{font-size:19px;color:#c7c6b1}.etat{white-space:pre-line;margin-top:50px;padding:24px;border:1px solid #8e8954;border-radius:16px;background:#ffffff09;font-size:22px;line-height:1.6}.appareil{position:absolute;left:770px;top:48px;width:576px;height:768px;border:12px solid #494638;border-radius:24px;overflow:clip;box-shadow:0 18px 60px #0009}iframe{width:768px;height:1024px;transform:scale(.75);transform-origin:top left;border:0;background:#1d2014}</style><aside><h1>Le joueur sur sa tablette</h1><p>Vrai Hub GM-OS<br>Krongar de Valgard · aventure fictive</p><small>Émulation tactile 768 × 1024<br>Touchers Playwright · échanges locaux réels</small><div class="etat" id="clip-reception">Connexion du joueur…</div></aside><div class="appareil"><iframe title="Tablette du joueur" id="tablette" src="http://127.0.0.1:${g.ports.sync}/?window=tablet&sync=${g.ports.sync}"></iframe></div></html>`;
        await contexte.route('**/clip-bol-presentation.html',route=>route.fulfill({contentType:'text/html; charset=utf-8',body:contenuStage}));await stage.goto(`http://127.0.0.1:${g.ports.sync}/clip-bol-presentation.html`);await stage.evaluate(installerLaScene);
        const rt=new RealisationTactile(stage),hub=stage.frameLocator('#tablette');await expect(hub.getByRole('button',{name:/Krongar de Valgard/})).toBeVisible();const client=stage.frames().find(fr=>fr.url().includes('window=tablet'))!;
        expect(await client.evaluate(()=>navigator.maxTouchPoints)).toBeGreaterThan(0);expect(await client.evaluate(()=>[innerWidth,innerHeight])).toEqual([768,1024]);expect(await client.evaluate(()=>!!window.appBridge)).toBe(false);await client.evaluate(()=>{const w=window as unknown as {touchesClipBol:number};w.touchesClipBol=0;document.addEventListener('touchstart',()=>w.touchesClipBol++,true);});
        const date=Date.now(),seg={debutMJ:(date-ouverture)/1000,finMJ:0,debutTablette:(date-debutTournageTablette)/1000,finTablette:0};const titre6='6 · Tablette : attaque, héroïsme et fiche HTML';chapitres.push({titre:titre6,secondesDepuisTitre:seg.debutMJ});await rt.chapitre(titre6);
        await rt.cliquer(hub.getByRole('button',{name:/Krongar de Valgard/}));await expect(hub.getByText('Connecté',{exact:true})).toBeVisible();await rt.cliquer(hub.getByTitle('Fiche Personnage',{exact:true}));await rt.cliquer(hub.getByRole('tab',{name:'Lancer un test',exact:true}));
        await stage.evaluate(()=>document.getElementById('clip-reception')!.textContent='Krongar est connecté.\nLe joueur ouvre lui-même sa fiche.');await rt.legende('Le joueur rejoint la séance et ouvre son panneau de jet par des touchers.','Le Hub est le vrai client local. La tablette est émulée en 768×1024, avec un contexte tactile.',3300);await photo('11-tablette-connectee',stage);
        const ph=hub.locator('[data-panneau-de-jet]').first(),pr=ph.locator('[data-preparation-barbarians]'),sh=ph.locator('[data-suites-barbarians]');await rt.choisir(ph.locator('select').nth(0),'agilite');await rt.choisir(ph.locator('select').nth(1),'melee');await rt.taper(pr.getByLabel('Défense ou Initiative adverse',{exact:true}),'1');
        const avant=await f.evaluate(()=>(window as unknown as Fenetre).useDiceStore.getState().history.length);await hasard(client,[.7,.55],()=>rt.cliquer(ph.getByRole('button',{name:'Lancer',exact:true})));await expect(ph.getByRole('region',{name:'Résultat',exact:true})).toContainText('11');await expect.poll(()=>f.evaluate(()=>(window as unknown as Fenetre).useDiceStore.getState().history.length)).toBeGreaterThan(avant);
        await stage.evaluate(()=>document.getElementById('clip-reception')!.textContent='Attaque reçue côté MJ.\nAgilité1 + Mêlée2 − Défense1 : +2.\nDés cinq et quatre : total onze.');await rt.legende('Au combat, Krongar choisit Mêlée, puis la Défense de sa cible.','Cinq + quatre + Agilité un + Mêlée deux − Défense un = onze. L’attaque est reçue dans le véritable historique du MJ.',3500);await photo('12-tablette-test',stage);
        await rt.cliquer(sh.getByRole('button',{name:'Succès héroïque (1)',exact:true}));await expect.poll(async()=>(await personnage()).sheetData.points_heroisme).toBe(2);await stage.evaluate(()=>document.getElementById('clip-reception')!.textContent='Succès héroïque reçu côté MJ.\nHéroïsme : trois → deux.');await rt.legende('Le joueur dépense un point pour obtenir un succès héroïque.','La réserve descend de trois à deux dans la fiche du MJ. Le choix et son coût passent par le Hub.',3300);await photo('13-tablette-heroisme',stage);
        await rt.cliquer(hub.getByRole('tab',{name:'Ma fiche',exact:true}));const html=hub.frameLocator('iframe:visible');await expect(html.locator('[data-key="identity.name"]')).toHaveValue('Krongar de Valgard',{timeout:30_000});await expect(html.locator('[data-key="careers.0.name"]')).toHaveValue('Barbare');await expect(html.locator('[data-key="resources.hero"]')).toHaveValue('2');
        await rt.cliquer(html.locator('[data-key="resources.vitality"]'));await rt.taper(html.locator('[data-key="resources.vitality"]'),'11');const sauvegarder=html.getByRole('button',{name:/Sauvegarder/});if(await sauvegarder.isVisible())await rt.cliquer(sauvegarder);await expect.poll(async()=>(await personnage()).sheetData.vitalite).toBe(11);
        await stage.evaluate(()=>document.getElementById('clip-reception')!.textContent='Fiche HTML enregistrée.\nVitalité saisie manuellement : onze.\nHéroïsme deux conservé côté MJ.');await rt.legende('La fiche HTML garde le nom, les carrières et les points d’héroïsme.','Le joueur renseigne ici onze en Vitalité, puis sauvegarde. C’est une saisie manuelle d’exercice, pas un calcul automatique de dégâts.',3500);await photo('14-tablette-html',stage);
        touchersRecus=await client.evaluate(()=>(window as unknown as {touchesClipBol:number}).touchesClipBol);expect(touchersRecus).toBeGreaterThan(5);finTournageTablette=Date.now();seg.finTablette=(finTournageTablette-debutTournageTablette)/1000;const videoTablette=stage.video();await contexte.close();contexte=undefined;fichierTablette=await videoTablette?.path();await navigateur.close();navigateur=undefined;seg.finMJ=(Date.now()-ouverture)/1000;segmentsTablette.push(seg);

        await chapitre('7 · Côté MJ : le test reçu et la fiche synchronisée');await ouvrirLeModule(g,'Dice-OS');await expect(f.getByRole('heading',{name:'Dice-OS',exact:true})).toBeVisible();await expect.poll(()=>f.evaluate(()=>(window as unknown as Fenetre).useDiceStore.getState().history.map(r=>r.title).join(' '))).toContain('Krongar');await r.legende('Le MJ retrouve le test et le choix héroïque du joueur dans Dice-OS.','Les échanges viennent du vrai Hub. Aucun module indépendant dédié à Barbarians of Lemuria n’est présent au catalogue actuel.',3400);await photo('15-reception-mj');
        await vue();await r.cliquer(f.getByRole('tab',{name:'Formulaire',exact:true}));await expect(f.getByLabel('Vitalité',{exact:true})).toHaveValue('11');await expect(f.getByLabel("Points d'héroïsme",{exact:true})).toHaveValue('2');await r.montrer(f.getByLabel('Vitalité',{exact:true}),2200);await r.legende('La fiche du MJ porte onze en Vitalité et deux points d’héroïsme.','La magie, la foi, l’alchimie et les usages narratifs de l’héroïsme restent arbitrés à la table. Le clip montre les mécanismes déjà intégrés.',3400);await f.mouse.move(950,425,{steps:12});await photo('16-fiche-mj');
        await r.titre('Deux dés · un héros · des choix partagés',['Carrières · Bonus/malus · Héroïsme · Doubles · Réaction · Hub tactile',
            'Vrais échanges joueur–MJ, tablette émulée, fiche HTML synchronisée.',
            'Barbarians of Lemuria · pilote 2.0.0 · personnage et dés d’exercice'],6500);reussi=true;fin=Date.now();
    }catch(erreur){await f.screenshot({path:path.join(PREUVES,'diagnostic-echec.jpg'),type:'jpeg'});if(stage&&!stage.isClosed())await stage.screenshot({path:path.join(PREUVES,'diagnostic-tablette.jpg'),type:'jpeg'});throw erreur;}
    finally{await contexte?.close();await navigateur?.close();const video=f.video();await g.fermer();const fichierVideo=await video?.path();if(reussi&&fichierVideo&&fichierTablette){
        const parametres={dureeDepuisTitre:(fin-ouverture)/1000,dureeTournageTablette:(finTournageTablette-debutTournageTablette)/1000,segmentsTablette,chapitres};const p=path.join(brut,'montage.json');fs.writeFileSync(p,JSON.stringify(parametres));
        const exportVideo=JSON.parse(execFileSync(process.execPath,['outils/clips/monter_clip_bol.mjs',fichierVideo,fichierTablette,SORTIE,p],{encoding:'utf8'}));
        fs.writeFileSync(path.join(PREUVES,'verification.json'),JSON.stringify({version:source.gameDriver.version,profilJetable:true,donneesPersonnelles:false,desPrepares:true,narrationSonore:false,modeRapide:!!process.env.GMOS_CLIP_RAPIDE,dureeDepuisTitre:exportVideo.dureeMp4,chapitres:exportVideo.chapitres,exportVideo,
            tablette:{client:'Hub HTTP/WebSocket réel sans appBridge',viewport:{largeur:768,hauteur:1024},contexteTactile:true,touchersPlaywright:true,touchersRecus,appareilPhysique:false,jetRecuMJ:true,heroisme3vers2:true,ficheHTMLVitalite11RecueMJ:true},modulesIndependants:[],
            assertions:['bonus et malus annulés :2d6+4','bonus :2,5,4 garde5+4, total13','malus : mêmes dés garde2+4, total10','héroïsme5→4 : succès héroïque acheté, sans promotion légendaire','double6 héroïque puis légendaire, héroïsme4→3','Faveur divine3→2 : le double1 du second jet remplace la réussite','échec critique choisi, point accordé une fois :2→3','seul double6 pouvait réussir : réussite simple à9 sans promotion','réaction Esprit1+Initiative1−adverse2 : dés4+5=9, avant les rivaux','Hub tactile réel sans pont Electron','attaque joueur5+4+1+2−1=11 reçue côté MJ','héroïsme3→2 synchronisé','fiche HTML Barbare et héroïsme2 conservés, Vitalité11 reçue MJ','aucun module indépendant dédié au catalogue']},null,2));}
        if(path.resolve(brut).startsWith(racineTemp+path.sep))fs.rmSync(brut,{recursive:true,force:true});else console.error('Nettoyage temporaire refusé.');}
});
