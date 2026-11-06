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
import { DonneesDeFicheSchema } from '../src/types/donneesDeFiche';

/** David, 07/11/2026 : filmer les mécanismes particuliers de Blade Runner avec Playwright.
 * Instance jetable, personnage et effets fictifs, vrais gestes, dés préparés.
 * npm run build puis npx playwright test e2e/clipBladeRunner.spec.ts --reporter=list
 */
const PILOTE = path.resolve(process.env.GMOS_PILOTE_BR ?? 'output/clips/blade-runner/pilote/BR-2.0.0.gmos-driver');
const SORTIE = path.resolve(process.env.GMOS_SORTIE_CLIP ?? 'output/clips');
const PREUVES = path.join(SORTIE, 'blade-runner');
const CAMPAGNE = 'clip-blade-runner', JOUEUR = 'clip-joueur-blade-runner', PERSO = 'clip-kessler';
const LARGEUR = 1440, HAUTEUR = 900;
type Fenetre = Window & { useCombatStore: typeof useCombatStore; useSessionOSStore: typeof useSessionOSStore; useDiceStore: typeof useDiceStore; useJournalStore: typeof useJournalStore; hasardClipBladeRunner?: () => number };

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
            const w = window as unknown as Fenetre; w.hasardClipBladeRunner ??= Math.random;
            const origine = w.hasardClipBladeRunner; Math.random = () => file.length ? file.shift()! : origine();
        }, file);
    }
    async rendreLeHasard() { await this.page.evaluate(() => { const w = window as unknown as Fenetre; if (w.hasardClipBladeRunner) Math.random = w.hasardClipBladeRunner; }); }
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

test('Blade Runner : dés échelonnés, forçage, blessures et vrai Hub tactile',async()=>{
    test.setTimeout(1_200_000);expect(fs.existsSync(PILOTE)).toBe(true);fs.mkdirSync(PREUVES,{recursive:true});
    const racineTemp=path.resolve(os.tmpdir()),brut=fs.mkdtempSync(path.join(racineTemp,'gmos-clip-br-'));if(!path.resolve(brut).startsWith(racineTemp+path.sep))throw Error('Profil inattendu');
    const source=JSON.parse(new AdmZip(PILOTE).readAsText('state.json'));expect(source.gameDriver.version).toBe('2.0.0');expect(source.gameDriver.jet.desEchelonnes.plafondDesD12).toBe(0);
    const semence=JSON.parse(fs.readFileSync('e2e/donnees/campagne-de-demo.json','utf8')),s=semence.modules.sessionOS;
    s.campaigns=[{id:CAMPAGNE,name:'Les Reflets du Bradbury',system:source.gameDriver.id,systemPath:'systems/blade-runner',activeLocationIds:[]}];s.activeCampaignId=CAMPAGNE;s.customGameDrivers=[source.gameDriver];s.customSheetTemplates=[source.sheetTemplate];
    const valeurs=Object.fromEntries(source.sheetTemplate.sections.flatMap((sec:{fields:{id:string;defaultValue?:unknown}[]})=>sec.fields).map((c:{id:string;defaultValue?:unknown})=>[c.id,c.defaultValue??'']));
    const fiche={...valeurs,nom:'Agent Kessler',nature:'Humain',archetype:'Enquêteur',vigueur:'B (D10)',agilite:'C (D8)',intelligence:'C (D8)',empathie:'B (D10)',corpsACorps:'C (D8)',endurance:'C (D8)',psychologie:'D (D6)',assistanceMedicale:'B (D10)',manipulation:'C (D8)',sante:8,santeMax:8,sangFroid:6,sangFroidMax:6,pointsHumanite:3,protectionNom:'Gilet pare-balles dissimulé',protection:'C (D8)',souvenirCle:'La pluie sur le toit du Bradbury, le soir du départ de mon père.',objetFetiche:'Une montre à gousset',
        _gmos_blade_runner:{blessures:[{id:'clip-plaie',titre:'Plaie au ventre',table:'Perforant',de:5,mortelle:true,limite:'round',guerison:'semaine',etat:'menace',effet:'Les jets de MOBILITÉ rouvrent la plaie.'}]}};
    s.players=['Agent Kessler','N-17'].map((name,i)=>({id:i?JOUEUR+'-n17':JOUEUR,realName:'Joueur fictif '+(i+1),isOnline:false,characters:[{id:i?'clip-n17':PERSO,name,campaignId:CAMPAGNE,systemId:source.gameDriver.id,templateId:source.sheetTemplate.id,hp:8,maxHp:8,sheetData:i?{...fiche,nom:name,nature:'Réplicant',_gmos_blade_runner:{blessures:[]}}:fiche}]}));s.entities=[];
    s.sessions=[{...s.sessions[0],id:'clip-seance-br',campaignId:CAMPAGNE,status:'active',number:1,sessionEntityIds:[PERSO,'clip-n17'],publicSummary:'Exercices fictifs autour du dossier Bradbury.'}];
    const validationBR=DonneesDeFicheSchema.safeParse({_gmos_blade_runner:fiche._gmos_blade_runner});fs.mkdirSync(path.join(PREUVES,'constats'),{recursive:true});fs.writeFileSync(path.join(PREUVES,'constats/validation.json'),JSON.stringify({date:'2026-11-07',source:'src/types/donneesDeFiche.ts',accepte:validationBR.success,erreurs:validationBR.success?[]:validationBR.error.issues,consequence:'Semence scalaire ; blessure préparée après chargement, aucun essai de reprise du suivi.'},null,2));
    for(const joueur of s.players)for(const personnage of joueur.characters)delete personnage.sheetData._gmos_blade_runner;
    validateSession(semence);
    const semenceFichier=path.join(brut,'semence.json');fs.writeFileSync(semenceFichier,JSON.stringify(semence));
    const g=await lancerGmOs({semence:semenceFichier,video:{dossier:brut,largeur:LARGEUR,hauteur:HAUTEUR},preparerLeProfil:profil=>{for(const d of ['theme','fiche'])fs.cpSync(path.resolve('docs/systems/blade-runner',d),path.join(profil,'corpus/systems/blade-runner',d),{recursive:true});fs.mkdirSync(path.join(profil,'corpus/fiches'),{recursive:true});fs.copyFileSync('docs/fiches/Character_Sheet_Manager.html',path.join(profil,'corpus/fiches/Character_Sheet_Manager.html'));}});
    const f=g.fenetre,r=new Realisation(f),chapitres:{titre:string;secondesDepuisTitre:number}[]=[];f.setDefaultTimeout(15_000);
    let ouverture=0,fin=0,reussi=false,navigateur:Browser|undefined,contexte:BrowserContext|undefined,stage:Page|undefined,debutTournageTablette=0,finTournageTablette=0,touchersRecus=0,fichierTablette:string|undefined;
    const segmentsTablette:{debutMJ:number;finMJ:number;debutTablette:number;finTablette:number}[]=[];
    const personnage=(id=PERSO)=>f.evaluate(id=>(window as unknown as Fenetre).useSessionOSStore.getState().players.flatMap(p=>p.characters).find(c=>c.id===id)!,id);
    const hasard=async(client:Page|Frame,file:number[],action:()=>Promise<void>)=>{await client.evaluate(file=>{const w=window as unknown as Fenetre;w.hasardClipBladeRunner??=Math.random;const origine=w.hasardClipBladeRunner;Math.random=()=>new Error().stack?.includes('.roll (')?(file.length?file.shift()!:origine()):origine();},file.every(v=>v===file[0])?Array(300).fill(file[0]):file);try{await action();}finally{await client.evaluate(()=>{const w=window as unknown as Fenetre;if(w.hasardClipBladeRunner)Math.random=w.hasardClipBladeRunner;});}};
    const chapitre=async(titre:string)=>{chapitres.push({titre,secondesDepuisTitre:(Date.now()-ouverture)/1000});await r.chapitre(titre);};
    const photo=(nom:string,page=f)=>page.screenshot({path:path.join(PREUVES,nom+'.jpg'),type:'jpeg',quality:85,scale:'css'});
    const vue=async(replicant=false)=>{await ouvrirLeModule(g,'Tableau de Bord');await f.evaluate(replicant=>{const s=(window as unknown as Fenetre).useSessionOSStore.getState();s.setSelectedPlayer(replicant?'clip-joueur-blade-runner-n17':'clip-joueur-blade-runner');s.setSelectedCharacter(replicant?'clip-n17':'clip-kessler');s.setCurrentView('players');},replicant);await ongletDeLaFiche(f,'Lancer un test');};
    try{
        await attendreLHydratation(g);await expect.poll(()=>f.evaluate(()=>(window as unknown as Fenetre).useSessionOSStore.getState().campaigns.map(c=>c.id))).toContain(CAMPAGNE);
        const fenetre=await g.application.browserWindow(f);await fenetre.evaluate((w,t)=>{w.setFullScreen(false);w.unmaximize();w.setResizable(false);w.setMaximizable(false);w.setContentSize(t.l,t.h);w.webContents.setAudioMuted(true);},{l:LARGEUR,h:HAUTEUR});await f.setViewportSize({width:LARGEUR,height:HAUTEUR});
        await ouvrirLeModule(g,'Tableau de Bord');await f.evaluate(()=>{const w=window as unknown as Fenetre;w.useSessionOSStore.getState().setActiveCampaign('clip-blade-runner');const se=w.useSessionOSStore.getState(),perso=se.players.flatMap(p=>p.characters).find(c=>c.id==='clip-kessler')!;se.updateCharacter('clip-joueur-blade-runner','clip-kessler',{sheetData:{...perso.sheetData,_gmos_blade_runner:{blessures:[{id:'clip-plaie',titre:'Plaie au ventre',table:'Perforant',de:5,mortelle:true,limite:'round',guerison:'semaine',etat:'menace',effet:'MOBILITE : la plaie peut se rouvrir.'}]}}});w.useJournalStore.getState().addJournal('Clip Blade Runner fictif');w.useJournalStore.setState({isRecording:true});const c=w.useCombatStore.getState();c.clearCombatants();c.addCombatant({name:'Agent Kessler',init:3,isPlayer:true,faction:'player',statuses:[],sourcePlayerId:'clip-kessler'});c.addCombatant({name:'Al Jarry',init:7,isPlayer:false,faction:'enemy',statuses:[]});});
        expect((await f.evaluate(()=>window.appBridge!.modulesDuJeu!.lire())).modules).toHaveLength(0);
        await vue();await ongletDeLaFiche(f,'Fiche du jeu');await f.getByRole('button',{name:/Créer une fiche pour/}).click({timeout:60_000});await expect(f.frameLocator('iframe').first().locator('[data-key="identity.name"]')).toHaveValue('Agent Kessler',{timeout:30_000});await ongletDeLaFiche(f,'Lancer un test');await f.evaluate(installerLaScene);await r.carte('');
        const p=f.locator('[data-panneau-de-jet]').first(),resultat=p.getByRole('region',{name:'Résultat',exact:true});
        const choix=async(a:string,c:string)=>{await r.choisir(p.locator('select').nth(0),a);await r.choisir(p.locator('select').nth(1),c);};
        const jeter=(file:number[])=>hasard(f,file,()=>r.cliquer(p.getByRole('button',{name:'Lancer',exact:true})));
        const forcer=(file:number[])=>hasard(f,file,()=>r.cliquer(p.getByRole('button',{name:/Forcer le jet/})));
        await p.locator('select').nth(0).selectOption('vigueur');await p.locator('select').nth(1).selectOption('corpsACorps');
        ouverture=Date.now();await r.titre('Blade Runner · les Reflets du Bradbury',['Dés échelonnés, crânes et choix du forçage','Humain et réplicant · Souvenir clé · Stress · Blessures · Initiative · Hub tactile','Exercices fictifs, blessure préparée et dés choisis — vrais échanges locaux, sans voix.']);

        await chapitre('1 · Une lettre, un dé ; six ou dix pour réussir');await jeter([.65,.4]);await expect(resultat).toContainText('1 réussite');await r.legende('Vigueur B donne un D10 ; Corps à corps C donne un D8.','Sept vaut une réussite, quatre aucune. À partir de dix, un seul dé donne deux réussites. A/D correspondent à D12/D6.',3500);await r.montrer(resultat,2200);await photo('01-des-echelonnes');
        await r.choisir(p.getByLabel('Soutien',{exact:true}),'B');await jeter([.65,.4,.95]);await expect(resultat).toContainText('3 réussite');await r.legende('Un soutien de niveau B apporte son propre D10.','Sept + quatre + dix : trois réussites. Ce soutien est un avantage ; il ne s’ajoute pas à un second avantage et peut annuler un désavantage.',3500);await r.montrer(resultat,2200);await photo('02-soutien');await r.choisir(p.getByLabel('Soutien',{exact:true}),'');

        await chapitre('2 · Forcer : payer les crânes, une fois ou deux');await jeter([.65,.4]);await r.cocher(p.locator('[data-relancer-aussi] input[type="checkbox"]').first());await forcer([0,.8]);await expect.poll(async()=>(await personnage()).sheetData.sante).toBe(7);await expect(p.getByRole('button',{name:/Forcer le jet/})).toBeDisabled();
        await r.legende('Kessler relance aussi son D10 à une seule réussite : il devient un crâne.','Le D8 donne sept. Le forçage physique coûte un point de Santé à l’humain : huit deviennent sept. Une réussite volontairement relancée peut être perdue.',3700);await r.montrer(resultat,2200);await photo('03-forcage-humain');
        await vue(true);await choix('vigueur','corpsACorps');await jeter([0,.4]);expect((await personnage('clip-n17')).sheetData.sangFroid).toBe(6);await forcer([.4]);await expect.poll(async()=>(await personnage('clip-n17')).sheetData.sangFroid).toBe(5);await forcer([.8]);await expect.poll(async()=>(await personnage('clip-n17')).sheetData.sangFroid).toBe(5);
        await r.legende('N-17, réplicant, peut forcer deux fois et paie en Sang-froid.','Le crâne initial ne coûte rien avant le forçage. Payé au premier, il ne se repaie pas au second : le Sang-froid reste à cinq.',3700);await r.montrer(resultat,2200);await photo('04-forcage-replicant');

        await chapitre('3 · Le souvenir clé, une seule fois dans la séance');await vue();await choix('empathie','psychologie');await r.cocher(p.locator('[data-souvenir-cle]'));await jeter([.9]);await expect(p.locator('[data-souvenir-cle]')).toHaveCount(0);await r.legende('Le souvenir clé ajoute un dé du type du plus faible.','Empathie B et Psychologie D deviennent D10 + D6 + D6. Le souvenir est consommé pour la séance réelle de cette campagne.',3500);await r.montrer(resultat,2200);await photo('05-souvenir');
        await r.legende('Le choix disparaît après usage ; rouvrir la fiche ne le rend pas.','Il peut aussi être appelé après un jet, avant le forçage. Si le jet échoue malgré le souvenir et un forçage, le panneau propose le point de stress du livre.',3500);await photo('06-souvenir-consomme');

        await chapitre('4 · Encaisser le stress, puis retrouver son objet fétiche');const stress=f.locator('[data-stress-subi]').first();await r.choisir(stress.getByLabel('Facteur de stress',{exact:true}),'3');await hasard(f,[.7],()=>r.cliquer(stress.getByRole('button',{name:'Encaisser',exact:true})));await expect.poll(async()=>(await personnage()).sheetData.sangFroid).toBe(4);
        await r.legende('Face à un facteur trois, Empathie et Psychologie résistent au stress.','Le D10 donne huit : une réussite ; le D6 donne cinq : aucune. Deux points passent, le Sang-froid descend de six à quatre.',3500);await r.montrer(stress,2200);await photo('07-stress-subi');
        await r.carte('blessures-blade-runner');const suivi=f.locator('[data-suivi-blade-runner]').first();await r.cliquer(suivi.getByRole('button',{name:/Objet fétiche.*1 Sang-froid/}));await expect.poll(async()=>(await personnage()).sheetData.sangFroid).toBe(5);await expect(suivi.getByRole('button',{name:/Objet fétiche/})).toHaveCount(0);
        await r.legende('La montre à gousset rend un point de Sang-froid sans pause.','L’objet fétiche est utilisable une fois par séance, tant que Kessler n’est pas Brisé. Le bouton disparaît après le gain : quatre deviennent cinq.',3500);await r.montrer(suivi,2200);await photo('08-objet-fetiche');

        await chapitre('5 · Une blessure mortelle : survivre, stabiliser et soigner');await hasard(f,[.9],()=>r.cliquer(suivi.getByRole('button',{name:'Sauvegarde contre la mort (Endurance)',exact:true})));await expect(suivi).toContainText('1 réussie');
        await r.legende('La plaie au ventre de cet exercice est préparée avant le tournage.','Mortelle, limite un Round : la sauvegarde d’Endurance est réussie. Maman déclenche les échéances effectivement jouées ; le temps réel ne les avance pas.',3700);await r.montrer(suivi.locator('[data-blessure]'),2200);await photo('09-sauvegarde');
        const geste=(titre:string)=>suivi.getByLabel(titre+' — qui lance',{exact:true}).locator('xpath=../..');const stabiliser=()=>geste('Stabiliser');await r.choisir(stabiliser().getByLabel('Stabiliser — qui lance',{exact:true}),'pnj');await hasard(f,[.9],()=>r.cliquer(stabiliser().getByRole('button',{name:'Lancer',exact:true})));await expect(suivi).toContainText('chaque Quart');await hasard(f,[.9],()=>r.cliquer(stabiliser().getByRole('button',{name:'Lancer',exact:true})));await expect(suivi.locator('[data-blessure]')).toHaveAttribute('data-blessure','a-soigner');
        await r.legende('Un PNJ réussit les deux stabilisations distinctes.','La première porte la limite du Round au Quart ; la seconde met Kessler hors de danger. La blessure doit encore être soignée.',3700);await r.montrer(suivi,2200);await photo('10-stabilisation');
        const soins=geste('Soins (un Quart)');await r.choisir(soins.getByLabel('Soins (un Quart) — qui lance',{exact:true}),'pnj');await hasard(f,[.9],()=>r.cliquer(soins.getByRole('button',{name:'Lancer',exact:true})));await expect(suivi.locator('[data-blessure]')).toHaveAttribute('data-blessure','en-guerison');await r.legende('Les soins réussis lancent la guérison ; ils n’effacent pas aussitôt la blessure.','Son effet cesse à la fin de sa durée, ici une semaine. Les autres gestes, premiers secours ou main secourable, répondent à des besoins distincts.',3700);await r.montrer(suivi,2200);await photo('11-guerison');

        await chapitre('6 · Cartes d’initiative et protection');await ouvrirLeModule(g,'Combat-OS');const echange=f.locator('[data-echange-d-initiative]');await expect(echange).toBeVisible();await r.choisir(echange.getByLabel('Échanger la carte avec',{exact:true}),{label:'Al Jarry (7)'});await r.cliquer(echange.getByRole('button',{name:'Échanger',exact:true}));await expect.poll(()=>f.evaluate(()=>(window as unknown as Fenetre).useCombatStore.getState().combatants.map(c=>[c.name,c.init]))).toEqual(expect.arrayContaining([['Agent Kessler',7],['Al Jarry',3]]));
        await r.legende('Les cartes sont préparées à trois et sept dans cet exercice.','Avant d’agir, Kessler échange : Al Jarry prend trois et agit aussitôt. Le paquet va de un à dix, dans l’ordre croissant.',3500);await r.montrer(echange,2200);await photo('12-initiative');
        const carte=f.locator('[data-combattant]').filter({has:f.getByText('Agent Kessler',{exact:true})}).first();await hasard(f,[.9],()=>r.cliquer(carte.locator('[data-protection]').getByRole('button')));await expect.poll(()=>f.evaluate(()=>(window as unknown as Fenetre).useDiceStore.getState().lastRoll?.successes)).toBe(2);
        await r.legende('Le gilet de niveau C lance deux D8 : deux huit, deux réussites.','Il retire ici deux dégâts d’un coup reçu. Le meneur saisit les dégâts restants ; la protection n’absorbe jamais les pertes d’un forçage.',3500);await r.montrer(carte.locator('[data-protection]'),2200);await photo('13-protection');

        navigateur=await chromium.launch({channel:'msedge',args:['--mute-audio']});contexte=await navigateur.newContext({viewport:{width:LARGEUR,height:HAUTEUR},recordVideo:{dir:brut,size:{width:LARGEUR,height:HAUTEUR}},isMobile:true,hasTouch:true,deviceScaleFactor:1,serviceWorkers:'block',locale:'fr-FR'});
        await contexte.route('**/*',route=>{const u=new URL(route.request().url());if(['about:','blob:','data:'].includes(u.protocol))return route.continue();if(u.hostname!=='127.0.0.1')return route.abort();if(u.port===String(PORT_FICHES_PAR_DEFAUT)){u.port=String(g.ports.fiches);return route.continue({url:u.href});}return [String(g.ports.fiches),String(g.ports.sync)].includes(u.port)?route.continue():route.abort();});
        await contexte.addInitScript(()=>{if(location.hostname==='127.0.0.1')localStorage.setItem('gmos-tablet-uuid','clip-br-tactile');});stage=await contexte.newPage();stage.setDefaultTimeout(15_000);debutTournageTablette=Date.now();
        const contenuStage=`<html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{width:1440px;height:900px;overflow:hidden}body{margin:0;background:radial-gradient(ellipse at 25% 35%,#23313b,#0a1016 70%);color:#f4efe5;font-family:'Segoe UI',sans-serif}aside{position:absolute;left:70px;top:140px;width:590px}h1{font-size:44px;color:#e2ad6e;margin:0 0 24px}p{font-size:24px;line-height:1.5}small{font-size:19px;color:#b5c4ca}.etat{white-space:pre-line;margin-top:50px;padding:24px;border:1px solid #7b7768;border-radius:16px;background:#ffffff09;font-size:22px;line-height:1.6}.appareil{position:absolute;left:770px;top:48px;width:576px;height:768px;border:12px solid #3e4144;border-radius:24px;overflow:clip;box-shadow:0 18px 60px #0009}iframe{width:768px;height:1024px;transform:scale(.75);transform-origin:top left;border:0;background:#111a22}</style><aside><h1>Le joueur sur sa tablette</h1><p>Vrai Hub GM-OS<br>Agent Kessler · dossier fictif</p><small>Émulation tactile 768 × 1024<br>Touchers Playwright · échanges locaux réels</small><div class="etat" id="clip-reception">Connexion du joueur…</div></aside><div class="appareil"><iframe title="Tablette du joueur" id="tablette" src="http://127.0.0.1:${g.ports.sync}/?window=tablet&sync=${g.ports.sync}"></iframe></div></html>`;await contexte.route('**/clip-br-presentation.html',route=>route.fulfill({contentType:'text/html; charset=utf-8',body:contenuStage}));await stage.goto(`http://127.0.0.1:${g.ports.sync}/clip-br-presentation.html`);await stage.evaluate(installerLaScene);
        const rt=new RealisationTactile(stage),hub=stage.frameLocator('#tablette');await expect(hub.getByRole('button',{name:/Agent Kessler/})).toBeVisible();const client=stage.frames().find(fr=>fr.url().includes('window=tablet'))!;expect(await client.evaluate(()=>navigator.maxTouchPoints)).toBeGreaterThan(0);expect(await client.evaluate(()=>[innerWidth,innerHeight])).toEqual([768,1024]);expect(await client.evaluate(()=>!!window.appBridge)).toBe(false);await client.evaluate(()=>{const w=window as unknown as {touchesClipBR:number};w.touchesClipBR=0;document.addEventListener('touchstart',()=>w.touchesClipBR++,true);});
        const date=Date.now(),seg={debutMJ:(date-ouverture)/1000,finMJ:0,debutTablette:(date-debutTournageTablette)/1000,finTablette:0};const titre7='7 · Tablette : forçage mental et fiche HTML';chapitres.push({titre:titre7,secondesDepuisTitre:seg.debutMJ});await rt.chapitre(titre7);await rt.cliquer(hub.getByRole('button',{name:/Agent Kessler/}));await expect(hub.getByText('Connecté',{exact:true})).toBeVisible();await rt.cliquer(hub.getByTitle('Fiche Personnage',{exact:true}));await rt.cliquer(hub.getByRole('tab',{name:'Lancer un test',exact:true}));
        const ph=hub.locator('[data-panneau-de-jet]').first();await rt.choisir(ph.locator('select').nth(0),'empathie');await rt.choisir(ph.locator('select').nth(1),'psychologie');const avant=await f.evaluate(()=>(window as unknown as Fenetre).useDiceStore.getState().history.length);await hasard(client,[0,.4],()=>rt.cliquer(ph.getByRole('button',{name:'Lancer',exact:true})));await expect.poll(()=>f.evaluate(()=>(window as unknown as Fenetre).useDiceStore.getState().history.length)).toBeGreaterThan(avant);expect((await personnage()).sheetData.sangFroid).toBe(5);
        await stage.evaluate(()=>document.getElementById('clip-reception')!.textContent='Test mental reçu côté MJ.\nUn crâne, sans forçage : aucun coût.\nSang-froid : cinq.');await rt.legende('Le joueur touche sa fiche puis lance Empathie et Psychologie.','Le crâne initial ne coûte rien tant que le test n’est pas forcé. Le vrai Hub transmet le résultat à l’historique du MJ.',3500);await photo('14-tablette-test',stage);
        await hasard(client,[.9],()=>rt.cliquer(ph.getByRole('button',{name:/Forcer le jet/})));await expect.poll(async()=>(await personnage()).sheetData.sangFroid).toBe(4);expect((await personnage()).sheetData.sante).toBe(7);await stage.evaluate(()=>document.getElementById('clip-reception')!.textContent='Forçage reçu côté MJ.\nLe D6 donne six : une réussite.\nSang-froid : cinq → quatre.\nSanté : sept, conservée.');await rt.legende('Le joueur force : le crâne reste, le D6 devient une réussite.','Ce test mental paie en Sang-froid : cinq deviennent quatre. La Santé reste à sept. Le coût est reçu dans la fiche du MJ.',3500);await photo('15-tablette-forcage',stage);
        await rt.cliquer(hub.getByRole('tab',{name:'Ma fiche',exact:true}));const html=hub.frameLocator('iframe:visible');await expect(html.locator('[data-key="identity.name"]')).toHaveValue('Agent Kessler',{timeout:30_000});await rt.cliquer(html.locator('[data-key="points.humanity"][data-value="4"]'));const sauver=html.getByRole('button',{name:/Sauvegarder/});if(await sauver.isVisible())await rt.cliquer(sauver);await expect.poll(async()=>(await personnage()).sheetData.pointsHumanite).toBe(4);
        await stage.evaluate(()=>document.getElementById('clip-reception')!.textContent='Fiche HTML enregistrée.\nHumanité saisie manuellement : quatre.\nValeur reçue côté MJ.');await rt.legende('La fiche HTML reste utilisable sur tablette.','Le joueur place ici l’Humanité à quatre, à titre d’exercice. Ce gain est saisi manuellement ; le clip ne résout pas un bilan de fin de session.',3500);await photo('16-tablette-html',stage);
        touchersRecus=await client.evaluate(()=>(window as unknown as {touchesClipBR:number}).touchesClipBR);expect(touchersRecus).toBeGreaterThan(5);finTournageTablette=Date.now();seg.finTablette=(finTournageTablette-debutTournageTablette)/1000;const videoTablette=stage.video();await contexte.close();contexte=undefined;fichierTablette=await videoTablette?.path();await navigateur.close();navigateur=undefined;seg.finMJ=(Date.now()-ouverture)/1000;segmentsTablette.push(seg);

        await chapitre('8 · Retour MJ : dés, prix du forçage et fiche reçus');await ouvrirLeModule(g,'Dice-OS');await expect(f.getByRole('heading',{name:'Dice-OS',exact:true})).toBeVisible();await expect.poll(()=>f.evaluate(()=>(window as unknown as Fenetre).useDiceStore.getState().history.map(r=>r.title).join(' '))).toContain('Kessler');await r.legende('Le MJ retrouve les deux étapes du test tactile dans Dice-OS.','Le panneau de la fiche applique le coût au bon personnage et à la bonne jauge. Le pupitre seul annonce un coût à reporter, car il ne connaît pas l’attribut.',3500);await photo('17-reception-mj');await vue();await r.cliquer(f.getByRole('tab',{name:'Formulaire',exact:true}));await expect(f.getByLabel('Sang-froid Actuel',{exact:true})).toHaveValue('4');await expect(f.getByLabel("Points d'Humanité",{exact:true})).toHaveValue('4');await r.montrer(f.getByLabel('Sang-froid Actuel',{exact:true}),2200);
        await r.legende('La fiche du MJ porte quatre en Sang-froid et quatre en Humanité.','Lire les pistes du jeu. Le compteur de PV générique à gauche reste à huit malgré la Santé à sept : défaut de raccord consigné séparément.',3500);await f.mouse.move(950,425,{steps:12});await photo('18-fiche-mj');const constatDeJauge=await personnage();fs.writeFileSync(path.join(PREUVES,'constats/jauges.json'),JSON.stringify({date:'2026-11-07',contexte:'Forçage physique humain, puis test mental depuis le Hub ; profil fictif',hp:constatDeJauge.hp,maxHp:constatDeJauge.maxHp,sante:constatDeJauge.sheetData.sante,sangFroid:constatDeJauge.sheetData.sangFroid,attendu:'La jauge générique suit la Santé de la fiche sans réappliquer le coup',corrige:false},null,2));fs.copyFileSync(path.join(PREUVES,'18-fiche-mj.jpg'),path.join(PREUVES,'constats/jauge-generique.jpg'));await r.titre('Les dés racontent le risque · le joueur choisit',['Soutien · Forçage · Souvenir · Stress · Blessures · Initiative · Protection',
            'Vrai Hub en émulation tactile, fiche HTML et échanges joueur–MJ vérifiés.',
            'Blade Runner · pilote 2.0.0 · exercices, blessure et dés préparés'],6500);reussi=true;fin=Date.now();
    }catch(erreur){await f.screenshot({path:path.join(PREUVES,'diagnostic-echec.jpg'),type:'jpeg'});if(stage&&!stage.isClosed())await stage.screenshot({path:path.join(PREUVES,'diagnostic-tablette.jpg'),type:'jpeg'});throw erreur;}
    finally{await contexte?.close();await navigateur?.close();const video=f.video();await g.fermer();const fichierVideo=await video?.path();if(reussi&&fichierVideo&&fichierTablette){const params={dureeDepuisTitre:(fin-ouverture)/1000,dureeTournageTablette:(finTournageTablette-debutTournageTablette)/1000,segmentsTablette,chapitres};const p=path.join(brut,'montage.json');fs.writeFileSync(p,JSON.stringify(params));const exportVideo=JSON.parse(execFileSync(process.execPath,['outils/clips/monter_clip_blade_runner.mjs',fichierVideo,fichierTablette,SORTIE,p],{encoding:'utf8'}));fs.writeFileSync(path.join(PREUVES,'verification.json'),JSON.stringify({version:source.gameDriver.version,profilJetable:true,donneesPersonnelles:false,desPrepares:true,narrationSonore:false,modeRapide:!!process.env.GMOS_CLIP_RAPIDE,dureeDepuisTitre:exportVideo.dureeMp4,chapitres:exportVideo.chapitres,exportVideo,modulesIndependants:[],
            tablette:{client:'Hub HTTP/WebSocket réel sans appBridge',viewport:{largeur:768,hauteur:1024},contexteTactile:true,touchersPlaywright:true,touchersRecus,appareilPhysique:false,jetRecuMJ:true,forcageSangFroid5vers4:true,sante7Conservee:true,humaniteHTML4RecueMJ:true},
            assertions:['D10 sept et D8 quatre : une réussite','soutienB D10 dix : trois réussites au total','humain : relance volontaire de réussite, crâne payé en Santé8→7','réplicant : deux forçages, crâne payé une fois Sang-froid6→5','souvenir clé consommé pour la séance','facteur3 : une réussite, Sang-froid6→4','objet fétiche4→5 une fois','blessure mortelle préparée : sauvegarde réussie','stabilisations distinctes Round→Quart→à soigner','soins : guérison en cours sans effacement immédiat','échange des cartes3/7','protection2D8 : deux réussites','vrai Hub tactile : jet mental et forçage reçus au MJ','coût mental5→4, Santé7 conservée','Humanité HTML saisie à4 reçue MJ','aucun module indépendant dédié au catalogue']},null,2));}if(path.resolve(brut).startsWith(racineTemp+path.sep))fs.rmSync(brut,{recursive:true,force:true});else console.error('Nettoyage temporaire refusé.');}
});
