import { test, expect, chromium, type Locator, type Page, type Frame, type Browser, type BrowserContext } from '@playwright/test';
import AdmZip from 'adm-zip';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { lancerGmOs, attendreLHydratation, ouvrirLeModule, ongletDeLaFiche } from './lancerGmOs';
import type { useCombatStore } from '../src/modules/combat/useCombatStore';
import type { useDiceStore } from '../src/stores/useDiceStore';
import type { useJournalStore } from '../src/modules/journal/useJournalStore';
import { PORT_FICHES_PAR_DEFAUT } from '../electron/portsDeGmOs';
import type { useSessionOSStore } from '../src/modules/session/useSessionOSStore';

/** David, 06/11/2026 : filmer les mécanismes particuliers de COC avec Playwright.
 * Instance jetable, personnage et effets fictifs, vrais gestes, dés préparés.
 * npm run build puis npx playwright test e2e/clipCoc.spec.ts --reporter=list
 */
const PILOTE = path.resolve(process.env.GMOS_PILOTE_COC ?? 'output/clips/coc/pilote/COC-2.2.0-d20.gmos-driver');
const SORTIE = path.resolve(process.env.GMOS_SORTIE_CLIP ?? 'output/clips');
const PREUVES = path.join(SORTIE, 'coc');
const CAMPAGNE = 'clip-coc', JOUEUR = 'clip-joueur-coc', PERSO = 'clip-amelia';
const LARGEUR = 1440, HAUTEUR = 900;
type Fenetre = Window & { useSessionOSStore: typeof useSessionOSStore; useCombatStore: typeof useCombatStore; useDiceStore: typeof useDiceStore; useJournalStore: typeof useJournalStore; hasardClipCoc?: () => number };

/** Curseur, surlignage et légendes comme le clip RuneQuest ; palette verte et cuivre. */
function installerLaScene() {
    const style = document.createElement('style');
    style.textContent = `
      #clip-curseur{position:fixed;left:0;top:0;z-index:2147483647;pointer-events:none;transform:translate(-100px,-100px);filter:drop-shadow(0 2px 3px #000)}
      #clip-curseur.clic::after{content:'';position:absolute;left:-14px;top:-14px;width:28px;height:28px;border:3px solid #d4a46f;border-radius:50%;animation:clip-onde .5s ease-out forwards}
      @keyframes clip-onde{from{transform:scale(.3);opacity:1}to{transform:scale(1.6);opacity:0}}
      #clip-anneau{position:fixed;z-index:2147483646;pointer-events:none;border:3px solid #d4a46f;border-radius:8px;box-shadow:0 0 18px #d4a46f66;opacity:0}
      #clip-legende{position:fixed;left:50%;bottom:20px;transform:translateX(-50%);max-width:1160px;width:max-content;z-index:2147483645;pointer-events:none;background:#050b19f2;color:white;font:600 22px/1.35 'Segoe UI',system-ui,sans-serif;padding:14px 24px;border-radius:12px;border:1px solid #d4a46f;box-shadow:0 8px 28px #0009;opacity:0}
      #clip-legende small{display:block;font-size:17px;font-weight:400;color:#ead7af;margin-top:5px}
      #clip-chapitre{position:fixed;top:14px;left:50%;transform:translateX(-50%);z-index:2147483645;pointer-events:none;background:#d4a46f;color:#030b15;font:800 15px 'Segoe UI',system-ui,sans-serif;padding:7px 18px;border-radius:999px;letter-spacing:.04em;opacity:0}
      #clip-titre{position:fixed;inset:0;z-index:2147483646;pointer-events:none;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;background:radial-gradient(ellipse at 30% 35%,#272044,#0a0619 65%);color:#fff;font-family:'Segoe UI',system-ui,sans-serif;text-align:center;opacity:0;transition:opacity .4s}
      #clip-titre h1{font-size:52px;margin:0;color:#d4a46f}#clip-titre p{font-size:24px;margin:0;max-width:1100px;line-height:1.4}
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
            const w = window as unknown as Fenetre; w.hasardClipCoc ??= Math.random;
            const origine = w.hasardClipCoc; Math.random = () => file.length ? file.shift()! : origine();
        }, file);
    }
    async rendreLeHasard() { await this.page.evaluate(() => { const w = window as unknown as Fenetre; if (w.hasardClipCoc) Math.random = w.hasardClipCoc; }); }
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

test('COC : mécanismes, joueur tactile sur le vrai Hub et réception MJ, en clip',async()=>{
    test.setTimeout(1_200_000);expect(fs.existsSync(PILOTE)).toBe(true);fs.mkdirSync(PREUVES,{recursive:true});
    const racineTemp=path.resolve(os.tmpdir()),brut=fs.mkdtempSync(path.join(racineTemp,'gmos-clip-coc-'));
    if(!path.resolve(brut).startsWith(racineTemp+path.sep))throw Error('Profil inattendu');
    const source=JSON.parse(new AdmZip(PILOTE).readAsText('state.json'));expect(source.gameDriver.version).toBe('2.2.0');
    const semence=JSON.parse(fs.readFileSync('e2e/donnees/campagne-de-demo.json','utf8')),s=semence.modules.sessionOS;
    s.campaigns=[{id:CAMPAGNE,name:'Les Ombres de la verrière',system:source.gameDriver.id,systemPath:'systems/coc',activeLocationIds:[]}];s.activeCampaignId=CAMPAGNE;s.customGameDrivers=[source.gameDriver];s.customSheetTemplates=[source.sheetTemplate];
    const valeurs=Object.fromEntries(source.sheetTemplate.sections.flatMap((sec:{fields:{id:string;defaultValue?:unknown}[]})=>sec.fields).map((c:{id:string;defaultValue?:unknown})=>[c.id,c.defaultValue??'']));
    const fiche={...valeurs,nom:'Amelia Steele',joueur:'Joueur fictif',agilite:2,constitution:2,force:3,perception:2,charisme:1,intelligence:1,volonte:2,defense:14,initiative:13,protection_rd:2,echelle_de_sante:0,modele_evolution:'Héros',echelle_evolution:13,
        arme1:'Revolver',arme1_attaque:2,arme1_dm:'1d8',arme1_bc:8,arme1_type:'distance',voie1:'',voie1_reference:'',voie1_rang1:false};
    s.players=['Amelia Steele','Victor Marlowe'].map((name,i)=>({id:i?JOUEUR+'-victor':JOUEUR,realName:'Joueur fictif '+(i+1),isOnline:false,characters:[{id:i?'clip-victor':PERSO,name,campaignId:CAMPAGNE,systemId:source.gameDriver.id,templateId:source.sheetTemplate.id,hp:0,maxHp:0,sheetData:{...fiche,nom:name,modele_evolution:i?'Blues':'Héros',echelle_evolution:i?7:13}}]}));
    s.entities=[{id:'clip-bande',name:'Les trois sbires',type:'npc',campaignId:CAMPAGNE,systemId:source.gameDriver.id,templateId:source.sheetTemplate.id,hp:0,maxHp:0,sheetData:{...valeurs,defense:10,echelle_de_sante:0}},
        {id:'clip-guetteur',name:'Guetteur fictif',type:'npc',campaignId:CAMPAGNE,systemId:source.gameDriver.id,templateId:source.sheetTemplate.id,hp:0,maxHp:0,sheetData:{...valeurs,constitution:2,defense:14,protection_rd:2,echelle_de_sante:0}}];
    s.sessions=[{...s.sessions[0],id:'clip-seance-coc',campaignId:CAMPAGNE,status:'active',number:1,sessionEntityIds:[PERSO,'clip-victor'],publicSummary:'Une enquête fictive sous la verrière.'}];
    const semenceFichier=path.join(brut,'semence.json');fs.writeFileSync(semenceFichier,JSON.stringify(semence));
    const g=await lancerGmOs({semence:semenceFichier,video:{dossier:brut,largeur:LARGEUR,hauteur:HAUTEUR},preparerLeProfil:profil=>{
        for(const d of ['theme','fiche'])fs.cpSync(path.resolve('docs/systems/coc',d),path.join(profil,'corpus/systems/coc',d),{recursive:true});
        fs.mkdirSync(path.join(profil,'corpus/fiches'),{recursive:true});fs.copyFileSync('docs/fiches/Character_Sheet_Manager.html',path.join(profil,'corpus/fiches/Character_Sheet_Manager.html'));
    }});
    const f=g.fenetre,r=new Realisation(f),chapitres:{titre:string;secondesDepuisTitre:number}[]=[];f.setDefaultTimeout(15_000);
    let ouverture=0,fin=0,reussi=false,navigateur:Browser|undefined,contexte:BrowserContext|undefined,stage:Page|undefined;
    let debutTablette=0,finTablette=0,dureeTablette=0,finTournageTablette=0,touchersRecus=0;let fichierTablette:string|undefined;
    const personnage=(id=PERSO)=>f.evaluate(id=>(window as unknown as Fenetre).useSessionOSStore.getState().players.flatMap(p=>p.characters).find(c=>c.id===id)!,id);
    const pnj=(id:string)=>f.evaluate(id=>(window as unknown as Fenetre).useSessionOSStore.getState().entities.find(c=>c.id===id)!,id);
    const hasard=async(client:Page|Frame,file:number[],action:()=>Promise<void>)=>{await client.evaluate(file=>{const w=window as unknown as Fenetre;w.hasardClipCoc??=Math.random;const origine=w.hasardClipCoc;Math.random=()=>file.length?file.shift()!:origine();},file.every(v=>v===file[0])?Array(300).fill(file[0]):file);try{await action();}finally{await client.evaluate(()=>{const w=window as unknown as Fenetre;if(w.hasardClipCoc)Math.random=w.hasardClipCoc;});}};
    const chapitre=async(titre:string)=>{chapitres.push({titre,secondesDepuisTitre:(Date.now()-ouverture)/1000});await r.chapitre(titre);};
    const photo=(nom:string,page=f)=>page.screenshot({path:path.join(PREUVES,nom+'.jpg'),type:'jpeg',quality:85,scale:'css'});
    const vue=async(victor=false)=>{await ouvrirLeModule(g,'Tableau de Bord');await f.evaluate(victor=>{const s=(window as unknown as Fenetre).useSessionOSStore.getState();s.setSelectedPlayer(victor?'clip-joueur-coc-victor':'clip-joueur-coc');s.setSelectedCharacter(victor?'clip-victor':'clip-amelia');s.setCurrentView('players');},victor);await ongletDeLaFiche(f,'Lancer un test');};
    try{
        await attendreLHydratation(g);await expect.poll(()=>f.evaluate(()=>(window as unknown as Fenetre).useSessionOSStore.getState().campaigns.map(c=>c.id))).toContain(CAMPAGNE);
        const fenetre=await g.application.browserWindow(f);await fenetre.evaluate((w,t)=>{w.setFullScreen(false);w.unmaximize();w.setResizable(false);w.setMaximizable(false);w.setContentSize(t.l,t.h);w.webContents.setAudioMuted(true);},{l:LARGEUR,h:HAUTEUR});await f.setViewportSize({width:LARGEUR,height:HAUTEUR});
        await ouvrirLeModule(g,'Tableau de Bord');await f.evaluate(()=>{const w=window as unknown as Fenetre,s=w.useSessionOSStore.getState();s.setActiveCampaign('clip-coc');s.setSelectedPlayer('clip-joueur-coc');s.setSelectedCharacter('clip-amelia');s.setCurrentView('players');const c=w.useCombatStore.getState();c.clearCombatants();c.addCombatant({name:'Amelia Steele',init:13,isPlayer:true,faction:'player',statuses:[],sourcePlayerId:'clip-amelia'});w.useJournalStore.getState().addJournal('Clip COC fictif');w.useJournalStore.setState({isRecording:true});});
        expect((await f.evaluate(()=>window.appBridge!.modulesDuJeu!.lire())).modules).toHaveLength(0);
        await vue();await f.evaluate(installerLaScene);await r.carte('');
        const panneau=f.locator('[data-panneau-de-jet]').first(),principal=panneau.locator('select').first(),prep=panneau.locator('[data-preparation-coc]'),resultat=panneau.getByRole('region',{name:'Résultat',exact:true});
        const jeter=async(v:number)=>hasard(f,[v],()=>r.cliquer(panneau.getByRole('button',{name:'Lancer',exact:true})));
        ouverture=Date.now();await r.titre('COC · les Ombres de la verrière',['Chroniques Oubliées Contemporain : le test, le héros et les conséquences','Voies · Santé psychique · PNJ et bandes · Joueur sur tablette','Valeurs d’exercice fictives — vrais Hub et échanges locaux, dés préparés, légendes sans voix.']);

        await chapitre('1 · Un test, des conditions et des dés bonus ou malus');await r.choisir(principal,'agilite');await r.taper(prep.getByLabel('Conditions favorables moins défavorables',{exact:true}),'2');await r.taper(prep.getByLabel('Aides',{exact:true}),'1');await r.choisir(prep.getByLabel('État préjudiciable',{exact:true}),'fatigue');await r.taper(prep.getByLabel('Dés bonus',{exact:true}),'1');await r.taper(prep.getByLabel('Dés malus',{exact:true}),'1');await expect(prep.locator('[data-composition-coc]')).toContainText('1d20');
        await r.legende('Les conditions se compensent ; deux favorables donnent +5.','AGI +2, une aide +2, Fatigué −2 : +7 au dé. Un dé bonus et un dé malus s’annulent.',3300);await r.montrer(prep,2800);await photo('01-preparation');await r.taper(prep.getByLabel('Dés malus',{exact:true}),'0');await hasard(f,[.375,.175],()=>r.cliquer(panneau.getByRole('button',{name:'Lancer',exact:true})));await expect(resultat).toContainText('15');
        await r.legende('Un dé bonus seul garde le meilleur de deux d20.','Ici huit au dé, plus sept : quinze atteint la difficulté. Le 20 naturel est critique ; le 1 est un échec critique.',3300);await r.montrer(resultat,2800);await photo('02-test');

        await chapitre('2 · Héros : sauver le test ou acheter un avantage distinct');await r.taper(prep.getByLabel('Conditions favorables moins défavorables',{exact:true}),'0');await r.taper(prep.getByLabel('Aides',{exact:true}),'0');await r.choisir(prep.getByLabel('État préjudiciable',{exact:true}),'');await r.taper(prep.getByLabel('Dés bonus',{exact:true}),'0');await jeter(.425);await r.cliquer(panneau.locator('[data-heros-coc]').getByRole('button',{name:'+5 (1 échelon)',exact:true}));await expect.poll(async()=>(await personnage()).sheetData.echelle_evolution).toBe(12);
        await r.legende('L’échelle du héros régresse de treize à douze pour ajouter cinq au test.','Neuf + AGI deux était un échec à onze ; le héros transforme le total en seize, une réussite.',3300);await r.montrer(resultat,2800);await photo('03-heros');const hero=panneau.locator('[data-heroisme-coc]');await r.cliquer(hero.locator('summary').first());await r.cliquer(hero.getByRole('button',{name:'Confirmer l’avantage héroïque',exact:true}));await expect.poll(async()=>(await personnage()).sheetData.echelle_evolution).toBe(11);await expect(f.locator('[data-sante-coc]')).toContainText('DEF effective 19');
        await r.legende('Hors du test, un autre échelon achète +5 DEF pour une attaque.','La DEF de base reste quatorze, l’effective devient dix-neuf. Le test déjà lancé ne change pas.',3300);await r.montrer(hero,2800);await photo('04-defense');await r.cliquer(hero.getByRole('button',{name:'Attaque terminée : consommer la DEF',exact:true}));

        await chapitre('3 · Une Voie référencée, un rang acquis, un contexte choisi');await r.cliquer(f.getByRole('tab',{name:'Formulaire',exact:true}));await r.taper(f.getByLabel('Voie 1 — nom',{exact:true}),'Voie de la furtivité');await r.cliquer(f.getByTitle('Voie 1 — référence des capacités proposées',{exact:true}).getByRole('button'));await r.cliquer(f.getByRole('button',{name:'furtivite',exact:true}));await r.cocher(f.getByRole('checkbox',{name:'Voie 1, rang 1 — acquis',exact:true}));await r.cliquer(f.getByRole('button',{name:'Sauvegarder',exact:true}).first());await expect.poll(async()=>(await personnage()).sheetData.voie1_reference).toBe('furtivite');await ongletDeLaFiche(f,'Lancer un test');await r.choisir(principal,'agilite');const voies=panneau.locator('[data-voies-coc]');await r.cliquer(voies.locator('summary'));await r.cocher(voies.getByLabel('Furtif',{exact:true}));await expect(prep.locator('[data-composition-coc]')).toContainText('+ 5 (Furtif (p. 36))');
        await r.legende('Furtif est acquis et pertinent : +5 pour agir discrètement.','La référence de Voie est explicite ; le nom libre ne suffit pas. Le choix vaut ce test, coûte zéro échelon et se décoche après.',3300);await r.montrer(voies,2800);await photo('05-voie');await jeter(.375);await expect(voies.getByLabel('Furtif',{exact:true})).not.toBeChecked();

        await chapitre('4 · Un événement choquant, son choc et sa séquelle');await vue(true);const psych=panneau.locator('[data-psychisme-coc]');await r.cliquer(psych.locator('summary'));await r.taper(psych.getByLabel('Événement choquant',{exact:true}),'Le reflet traverse la verrière');await r.choisir(psych.getByLabel('Rang de l’événement',{exact:true}),'2');await hasard(f,[.1],()=>r.cliquer(psych.getByRole('button',{name:'Lancer VOL pour l’événement',exact:true})));await expect(psych.locator('[data-jet-choc-coc]')).toContainText('Échec critique');await r.choisir(psych.getByLabel('Nature du choc',{exact:true}),'Enragé');await r.cliquer(psych.getByRole('button',{name:'Confirmer les conséquences psychiques',exact:true}));await r.choisir(psych.getByLabel('Séquelle psychique',{exact:true}),'Fascination');await r.cliquer(psych.getByRole('button',{name:'Confirmer la séquelle',exact:true}));await expect.poll(async()=>(await personnage('clip-victor')).sheetData.echelle_evolution).toBe(7);
        await r.legende('Rang deux : VOL quinze, échec critique de un à trois.','Victor subit Enragé deux rounds et Fascination, confirmés par le MJ. Son échelle de Blues reste à sept.',3300);await r.montrer(psych,2800);await photo('06-psychisme');await r.cliquer(psych.getByRole('button',{name:'Hors combat : un round de choc écoulé',exact:true}));await expect(psych).toContainText('1 rounds restants');
        await r.legende('Le temps avance sur confirmation : il reste un round de choc.','Enragé donne +3 physique et −5 DEF. Le jeu conserve le pire malus de santé ou de choc ; le récit de la séquelle reste à la table.',3300);await r.montrer(psych.locator('[data-choc-actif-coc]'),2800);await photo('07-choc');

        await chapitre('5 · PNJ par rôle, Santé Pulp et bande de sbires');await ouvrirLeModule(g,'Combat-OS');const combat=f.locator('[data-panneau-combat-coc]');await r.cliquer(combat.locator('summary').first());await r.choisir(combat.getByLabel('Personnage COC',{exact:true}),'npc:clip-bande');await r.cocher(combat.getByLabel('Santé Pulp du PNJ',{exact:true}));await r.cliquer(combat.getByRole('button',{name:'Confirmer le profil PNJ',exact:true}));await expect(combat.locator('[data-sante-coc]')).toContainText('0/4');await r.cliquer(combat.getByText('Lancer un test pour Les trois sbires',{exact:true}));const pnf=combat.locator('[data-panneau-de-jet]');await r.choisir(pnf.locator('select').first(),'force');await hasard(f,[.999],()=>r.cliquer(pnf.getByRole('button',{name:'Lancer',exact:true})));await expect(pnf.locator('[data-composition-coc]')).toContainText('Aucune réussite critique');
        await r.legende('Un Figurant Pulp a quatre échelons ; son vingt ne devient pas critique.','Le rôle définit les caractéristiques, DEF/Init et le budget de capacités. Les blessures restent conservées à la confirmation.',3300);await r.montrer(pnf.locator('[data-suites-coc]'),2800);await photo('08-pnj');await r.cocher(combat.getByLabel('Santé Pulp du PNJ',{exact:true}),false);await r.cocher(combat.getByLabel('Bande de sbires',{exact:true}));await r.cliquer(combat.getByRole('button',{name:'Confirmer le profil PNJ',exact:true}));await expect(combat.locator('[data-bande-coc]')).toContainText('+5');
        await vue();await r.choisir(principal,'arme1_attaque');await jeter(.999);const dm=panneau.locator('[data-dommages-coc]');await r.choisir(dm.getByLabel('Cible des DM',{exact:true}),'npc:clip-bande');await expect(dm.getByRole('button',{name:'Lancer les DM',exact:true})).toHaveCount(0);await r.cliquer(dm.getByRole('button',{name:'Confirmer la touche : retirer un membre',exact:true}));await expect.poll(async()=>(await pnj('clip-bande')).sheetData.echelle_de_sante).toBe(1);
        await r.legende('Contre une bande, une touche retire un membre : aucun jet de DM.','Les trois sbires passent à deux. Leur surnombre vaut désormais +2, automatiquement repris dans leurs tests.',3300);await r.montrer(dm,2800);await photo('09-bande');

        await chapitre('6 · Critique, DM, RD et conséquence de santé');await jeter(.999);await r.choisir(dm.getByLabel('Cible des DM',{exact:true}),'npc:clip-guetteur');await hasard(f,[.8],()=>r.cliquer(dm.getByRole('button',{name:'Lancer les DM',exact:true})));await expect(dm).toContainText('15 DM');await expect(dm).toContainText('RD 2 → 13 subis');
        await r.legende('Le revolver critique ajoute son bonus fixe, sans doubler les dés.','Sept au d8 + bonus critique huit = quinze DM ; la RD deux retire une seule fois deux points : treize échelons.',3300);await r.montrer(dm,2800);await photo('10-dommages');await r.cliquer(dm.getByRole('button',{name:'Appliquer les DM à la cible',exact:true}));await expect.poll(async()=>(await pnj('clip-guetteur')).sheetData.echelle_de_sante).toBe(13);await expect(dm.getByRole('button',{name:'Coup appliqué',exact:true})).toBeDisabled();await ouvrirLeModule(g,'Combat-OS');if(await combat.getAttribute('open')===null)await r.cliquer(combat.locator('summary').first());await r.choisir(combat.getByLabel('Personnage COC',{exact:true}),'npc:clip-guetteur');const sante=combat.locator('[data-sante-coc]');await expect(sante).toContainText('DEF effective 11');const con=sante.locator('[data-consequence-coc="affaibli"]');await r.choisir(con.getByLabel('Résultat de CON',{exact:true}),'false');await r.cliquer(con.getByRole('button',{name:'Confirmer la conséquence',exact:true}));
        await r.legende('Affaibli : la DEF effective tombe de quatorze à onze.','Le résultat de CON est ici renseigné comme joué à la table : échec, donc prochaine action perdue. Le coup est verrouillé après application.',3300);await r.montrer(sante,2800);await photo('11-sante');await r.cliquer(sante.getByRole('button',{name:'Consommer la prochaine action perdue',exact:true}));

        // Nouveau contexte tactile jetable : seul le vrai client local du Hub est chargé dans la tablette.
        navigateur=await chromium.launch({channel:'msedge',args:['--mute-audio']});contexte=await navigateur.newContext({viewport:{width:LARGEUR,height:HAUTEUR},recordVideo:{dir:brut,size:{width:LARGEUR,height:HAUTEUR}},isMobile:true,hasTouch:true,deviceScaleFactor:1,serviceWorkers:'block',locale:'fr-FR'});
        await contexte.route('**/*',route=>{const u=new URL(route.request().url());if(['about:','blob:','data:'].includes(u.protocol))return route.continue();if(u.hostname!=='127.0.0.1')return route.abort();if(u.port===String(PORT_FICHES_PAR_DEFAUT)){u.port=String(g.ports.fiches);return route.continue({url:u.href});}return [String(g.ports.fiches),String(g.ports.sync)].includes(u.port)?route.continue():route.abort();});
        await contexte.addInitScript(()=>{if(location.hostname==='127.0.0.1')localStorage.setItem('gmos-tablet-uuid','clip-coc-tactile');});stage=await contexte.newPage();stage.setDefaultTimeout(15_000);
        const contenuStage=`<html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{width:1440px;height:900px;overflow:hidden}body{margin:0;background:radial-gradient(ellipse at 25% 35%,#302039,#0b0914 70%);color:#f4efe6;font-family:'Segoe UI',sans-serif}aside{position:absolute;left:70px;top:140px;width:590px}h1{font-size:44px;color:#d4a46f;margin:0 0 24px}p{font-size:24px;line-height:1.5}small{font-size:19px;color:#b8abbd}.etat{white-space:pre-line;margin-top:50px;padding:24px;border:1px solid #655070;border-radius:16px;background:#ffffff09;font-size:22px;line-height:1.6}.appareil{position:absolute;left:770px;top:48px;width:576px;height:768px;border:12px solid #38303b;border-radius:24px;overflow:clip;box-shadow:0 18px 60px #0009}iframe{width:768px;height:1024px;transform:scale(.75);transform-origin:top left;border:0;background:#14111d}</style><aside><h1>Le joueur sur sa tablette</h1><p>Vrai Hub GM-OS<br>Amelia Steele · séance fictive</p><small>Émulation tactile 768 × 1024<br>Touchers Playwright · échanges HTTP/WebSocket locaux</small><div class="etat" id="clip-reception">Connexion du joueur…</div></aside><div class="appareil"><iframe title="Tablette du joueur" id="tablette" src="http://127.0.0.1:${g.ports.sync}/?window=tablet&sync=${g.ports.sync}"></iframe></div></html>`;await contexte.route('**/clip-coc-presentation.html',route=>route.fulfill({contentType:'text/html; charset=utf-8',body:contenuStage}));stage.on('console',m=>{if(m.type()==='error')console.error('[Hub du clip]',m.text());});await stage.goto(`http://127.0.0.1:${g.ports.sync}/clip-coc-presentation.html`);
        await stage.evaluate(installerLaScene);const rt=new RealisationTactile(stage),hub=stage.frameLocator('#tablette');await expect(hub.getByRole('button',{name:/Amelia Steele/})).toBeVisible();const client=stage.frames().find(fr=>fr.url().includes('window=tablet'))!;expect(client).toBeTruthy();expect(await client.evaluate(()=>navigator.maxTouchPoints)).toBeGreaterThan(0);expect(await client.evaluate(()=>[innerWidth,innerHeight])).toEqual([768,1024]);expect(await client.evaluate(()=>!!window.appBridge)).toBe(false);await client.evaluate(()=>{const w=window as unknown as {touchesClipCoc:number};w.touchesClipCoc=0;document.addEventListener('touchstart',()=>w.touchesClipCoc++,true);});
        debutTablette=(Date.now()-ouverture)/1000;const debutStage=Date.now();chapitres.push({titre:'7 · Joueur tactile : Voie, jet, héros et fiche HTML',secondesDepuisTitre:debutTablette});await rt.chapitre('7 · Joueur tactile : Voie, jet, héros et fiche HTML');
        await rt.cliquer(hub.getByRole('button',{name:/Amelia Steele/}));await expect(hub.getByText('Connecté',{exact:true})).toBeVisible();await rt.cliquer(hub.getByTitle('Fiche Personnage',{exact:true}));await rt.cliquer(hub.getByRole('tab',{name:'Lancer un test',exact:true}));await stage.evaluate(()=>document.getElementById('clip-reception')!.textContent='Hub connecté · Amelia Steele\nLes commandes appartiennent au joueur.');
        await rt.legende('Le joueur ouvre sa fiche et l’onglet du test par des touchers.','Le Hub est le vrai client du jeu, sans API Electron. La tablette est émulée ; aucun appareil physique n’est sollicité.',3300);await photo('12-tablette-connectee',stage);
        const ph=hub.locator('[data-panneau-de-jet]').first(),vh=ph.locator('[data-voies-coc]');await rt.choisir(ph.locator('select').first(),'agilite');await rt.cliquer(vh.locator('summary'));await rt.cocher(vh.getByLabel('Furtif',{exact:true}));await expect(ph.locator('[data-composition-coc]')).toContainText('+ 5 (Furtif (p. 36))');
        const avant=await f.evaluate(()=>(window as unknown as Fenetre).useDiceStore.getState().history.length);await hasard(client,[.45],()=>rt.cliquer(ph.getByRole('button',{name:'Lancer',exact:true})));await expect.poll(()=>f.evaluate(()=>(window as unknown as Fenetre).useDiceStore.getState().history.length)).toBeGreaterThan(avant);await expect(vh.getByLabel('Furtif',{exact:true})).not.toBeChecked();await expect.poll(()=>f.evaluate(()=>JSON.stringify((window as unknown as Fenetre).useJournalStore.getState().journals))).toContain('Furtif');
        await rt.cliquer(ph.locator('[data-heros-coc]').getByRole('button',{name:'+5 (1 échelon)',exact:true}));await expect.poll(async()=>(await personnage()).sheetData.echelle_evolution).toBe(10);await stage.evaluate(()=>document.getElementById('clip-reception')!.textContent='Reçu côté MJ : jet d’Amelia\nFurtif (p. 36) conservé au journal\nHéros : 11 → 10 échelons');
        await rt.legende('Le joueur choisit Furtif, lance et ajoute cinq grâce au héros.','Le jet arrive chez le MJ ; la capacité est décochée, sa source reste au journal. L’échelle passe de onze à dix des deux côtés.',3300);await rt.montrer(ph.getByRole('region',{name:'Résultat',exact:true}),2800);await photo('13-tablette-test',stage);
        await rt.cliquer(hub.getByRole('tab',{name:'Ma fiche',exact:true}));const html=hub.frameLocator('iframe:visible');await expect(html.locator('[data-key="identity.name"]')).toHaveValue('Amelia Steele',{timeout:30_000});await rt.choisir(html.locator('#pageSelect'),'1');await rt.cliquer(html.locator('[data-key="tracks.scale"][data-value="9"]'));const sauvegarder=html.getByRole('button',{name:/Sauvegarder/});if(await sauvegarder.isVisible())await rt.cliquer(sauvegarder);await expect.poll(async()=>(await personnage()).sheetData.echelle_evolution).toBe(9);await stage.evaluate(()=>document.getElementById('clip-reception')!.textContent='Fiche HTML enregistrée\nÉchelle choisie manuellement : 9\nValeur reçue dans le magasin du MJ');
        await rt.legende('La fiche HTML reste éditable sur tablette.','Le joueur place ici son échelle à neuf et sauvegarde. Cette saisie manuelle est reçue côté MJ, sans recréer le personnage.',3300);await photo('14-tablette-html',stage);touchersRecus=await client.evaluate(()=>(window as unknown as {touchesClipCoc:number}).touchesClipCoc);expect(touchersRecus).toBeGreaterThan(7);dureeTablette=(Date.now()-debutStage)/1000;finTournageTablette=Date.now();const videoTablette=stage.video();await contexte.close();contexte=undefined;fichierTablette=await videoTablette?.path();await navigateur.close();navigateur=undefined;finTablette=(Date.now()-ouverture)/1000;

        await chapitre('8 · Retour au MJ : jet reçu, source et fiche synchronisée');await ouvrirLeModule(g,'Dice-OS');await expect(f.getByRole('heading',{name:'Dice-OS',exact:true})).toBeVisible();await expect.poll(()=>f.evaluate(()=>(window as unknown as Fenetre).useDiceStore.getState().history.map(r=>r.title).join(' '))).toContain('Amelia');await r.legende('Le pupitre MJ reçoit le test réel du Hub.','Le transport est vérifié par l’historique, le journal et les valeurs de la fiche. Les confirmations réservées au meneur restent côté MJ.',3300);await r.pause(2800);await photo('15-reception-mj');await vue();await r.cliquer(f.getByRole('tab',{name:'Formulaire',exact:true}));await expect(f.getByLabel("Échelle d'évolution — échelon",{exact:true})).toHaveValue('9');await r.montrer(f.getByLabel("Échelle d'évolution — échelon",{exact:true}),2800);
        await r.legende('La fiche du MJ porte bien neuf échelons et la Voie acquise.','COC utilise ses outils intégrés : aucun module indépendant dédié au catalogue actuel. Les poursuites et capacités hors du premier ensemble restent à la table.',3300);await f.mouse.move(950,425,{steps:12});await photo('16-fiche-mj');
        await r.titre('Du geste du joueur à la décision du meneur',['Test · Héros · Voies · Psychisme · PNJ · Santé · Hub tactile',
            'Tablette émulée, vrais échanges locaux ; aucune recette exhaustive ni appareil physique revendiqué.',
            'Chroniques Oubliées Contemporain · pilote 2.2.0 · dés et personnages d’exercice'],6500);reussi=true;fin=Date.now();
    }catch(erreur){await f.screenshot({path:path.join(PREUVES,'diagnostic-echec.jpg'),type:'jpeg'});if(stage&&!stage.isClosed())await stage.screenshot({path:path.join(PREUVES,'diagnostic-tablette.jpg'),type:'jpeg'});throw erreur;}
    finally{await contexte?.close();await navigateur?.close();const video=f.video();await g.fermer();const fichierVideo=await video?.path();if(reussi&&fichierVideo&&fichierTablette){
        const parametres={dureeDepuisTitre:(fin-ouverture)/1000,debutTablette,finTablette,dureeTablette,finTournageTablette,chapitres};const p=path.join(brut,'montage.json');fs.writeFileSync(p,JSON.stringify(parametres));
        const exportVideo=JSON.parse(execFileSync(process.execPath,['outils/clips/monter_clip_coc.mjs',fichierVideo,fichierTablette,SORTIE,p],{encoding:'utf8'}));
        fs.writeFileSync(path.join(PREUVES,'verification.json'),JSON.stringify({version:source.gameDriver.version,profilJetable:true,donneesPersonnelles:false,desPrepares:true,narrationSonore:false,modeRapide:!!process.env.GMOS_CLIP_RAPIDE,dureeDepuisTitre:exportVideo.dureeMp4,chapitres:exportVideo.chapitres,exportVideo,
            tablette:{client:'Hub HTTP/WebSocket réel sans appBridge',viewport:{largeur:768,hauteur:1024},contexteTactile:true,touchersPlaywright:true,touchersRecus,appareilPhysique:false,jetRecuMJ:true,capaciteAuJournal:true,heroisme11vers10:true,ficheHTML9RecueMJ:true},
            assertions:['bonus et malus s’annulent','conditions+5, aide+2, fatigue−2 : +7 ; test15','héros13 → 12, test11 → 16','DEF14 → 19, base conservée ; héros12 → 11','Furtif : référence, rang, contexte, +5 et choix consommé','choc rang2 critique, Enragé2 rounds et Fascination ; Blues7 conservé','un round confirmé','Figurant Pulp4, vingt sans critique','bande3 : une touche sans DM retire un membre','critique :7+8−RD2=13, coup verrouillé','DEF14 → 11 ; CON renseignée, action perdue consommée','vrai client tactile Hub avec réception MJ','jet Furtif et héros du joueur synchronisés','fiche HTML et échelle9 synchronisées','aucun module indépendant COC au catalogue']},null,2));}
        if(path.resolve(brut).startsWith(racineTemp+path.sep))fs.rmSync(brut,{recursive:true,force:true});else console.error('Nettoyage temporaire refusé.');}
});
