import { test, expect, type Locator, type Page } from '@playwright/test';
import AdmZip from 'adm-zip';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { lancerGmOs, attendreLHydratation, ouvrirLeModule, ongletDeLaFiche } from './lancerGmOs';
import type { useSessionOSStore } from '../src/modules/session/useSessionOSStore';
import type { useCombatStore } from '../src/modules/combat/useCombatStore';
import { initialiserSanteVoyageur } from '../src/modules/session/logic/santeDuVoyageur';
import type { VueTMRMJ } from '../outils/reve-de-dragon/tmr/moteur.mjs';

/** David, 06/11/2026 : filmer les mécanismes particuliers de Rêve de Dragon avec Playwright.
 * Instance jetable, personnage et effets fictifs, vrais gestes, dés préparés.
 * npm run build puis npx playwright test e2e/clipRdd.spec.ts --reporter=list
 */
const PILOTE = path.resolve(process.env.GMOS_PILOTE_RDD ?? 'output/campagnes-tests/reve-de-dragon/Reve-de-Dragon-2.0.0.gmos-driver');
const SORTIE = path.resolve(process.env.GMOS_SORTIE_CLIP ?? 'output/clips');
const PREUVES = path.join(SORTIE, 'rdd');
const CAMPAGNE = 'clip-rdd', JOUEUR = 'clip-joueur-rdd', PERSO = 'clip-nitouche';
const LARGEUR = 1440, HAUTEUR = 900;
type Fenetre = Window & { useSessionOSStore: typeof useSessionOSStore; useCombatStore: typeof useCombatStore; hasardClipRdd?: () => number };

/** Curseur, surlignage et légendes comme le clip RuneQuest ; palette verte et cuivre. */
function installerLaScene() {
    const style = document.createElement('style');
    style.textContent = `
      #clip-curseur{position:fixed;left:0;top:0;z-index:2147483647;pointer-events:none;transform:translate(-100px,-100px);filter:drop-shadow(0 2px 3px #000)}
      #clip-curseur.clic::after{content:'';position:absolute;left:-14px;top:-14px;width:28px;height:28px;border:3px solid #bda8ef;border-radius:50%;animation:clip-onde .5s ease-out forwards}
      @keyframes clip-onde{from{transform:scale(.3);opacity:1}to{transform:scale(1.6);opacity:0}}
      #clip-anneau{position:fixed;z-index:2147483646;pointer-events:none;border:3px solid #bda8ef;border-radius:8px;box-shadow:0 0 18px #bda8ef66;opacity:0}
      #clip-legende{position:fixed;left:50%;bottom:20px;transform:translateX(-50%);max-width:1160px;width:max-content;z-index:2147483645;pointer-events:none;background:#050b19f2;color:white;font:600 22px/1.35 'Segoe UI',system-ui,sans-serif;padding:14px 24px;border-radius:12px;border:1px solid #bda8ef;box-shadow:0 8px 28px #0009;opacity:0}
      #clip-legende small{display:block;font-size:17px;font-weight:400;color:#ead7af;margin-top:5px}
      #clip-chapitre{position:fixed;top:14px;left:50%;transform:translateX(-50%);z-index:2147483645;pointer-events:none;background:#bda8ef;color:#030b15;font:800 15px 'Segoe UI',system-ui,sans-serif;padding:7px 18px;border-radius:999px;letter-spacing:.04em;opacity:0}
      #clip-titre{position:fixed;inset:0;z-index:2147483646;pointer-events:none;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;background:radial-gradient(ellipse at 30% 35%,#272044,#0a0619 65%);color:#fff;font-family:'Segoe UI',system-ui,sans-serif;text-align:center;opacity:0;transition:opacity .4s}
      #clip-titre h1{font-size:52px;margin:0;color:#bda8ef}#clip-titre p{font-size:24px;margin:0;max-width:1100px;line-height:1.4}
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
        if (await cible.getAttribute('type') === 'number') await cible.fill(texte);
        else { await cible.fill(''); await cible.pressSequentially(texte, { delay: 55 }); }
        await this.eteindre(); await this.pause(ms);
    }
    async cocher(cible: Locator, actif = true) { await this.viser(cible); await cible.setChecked(actif); await this.eteindre(); await this.pause(600); }
    async carte(id: string) {
        const cartes = this.page.locator('[data-carte-du-jeu]');
        for (const carte of await cartes.all()) {
            const ouvrir = (await carte.getAttribute('data-carte-du-jeu')) === id;
            if ((await carte.getAttribute('open') !== null) !== ouvrir) await carte.locator('summary').first().click();
        }
    }
    async des(file: number[]) {
        await this.page.evaluate(file => {
            const w = window as unknown as Fenetre; w.hasardClipRdd ??= Math.random;
            const origine = w.hasardClipRdd; Math.random = () => file.length ? file.shift()! : origine();
        }, file);
    }
    async rendreLeHasard() { await this.page.evaluate(() => { const w = window as unknown as Fenetre; if (w.hasardClipRdd) Math.random = w.hasardClipRdd; }); }
}




test('les mécanismes de Rêve de Dragon et le module TMR, en clip',async()=>{
    test.setTimeout(900_000);expect(fs.existsSync(PILOTE)).toBe(true);fs.mkdirSync(PREUVES,{recursive:true});
    const racineTemp=path.resolve(os.tmpdir()),brut=fs.mkdtempSync(path.join(racineTemp,'gmos-clip-rdd-'));
    if(!path.resolve(brut).startsWith(racineTemp+path.sep))throw new Error('Profil inattendu.');
    const source=JSON.parse(new AdmZip(PILOTE).readAsText('state.json'));
    const semence=JSON.parse(fs.readFileSync('e2e/donnees/campagne-de-demo.json','utf8')),s=semence.modules.sessionOS;
    s.campaigns=[{id:CAMPAGNE,name:'Le Moulin des heures oubliées',system:source.gameDriver.id,systemPath:'systems/reves de dragons',activeLocationIds:[]}];
    s.activeCampaignId=CAMPAGNE;s.customGameDrivers=[source.gameDriver];s.customSheetTemplates=[source.sheetTemplate];
    const valeurs=Object.fromEntries(source.sheetTemplate.sections.flatMap((sec:{fields:{id:string;defaultValue?:unknown}[]})=>sec.fields).map((c:{id:string;defaultValue?:unknown})=>[c.id,c.defaultValue??'']));
    const fiche=initialiserSanteVoyageur({...valeurs,nom:'Nitouche',taille:9,constitution:12,force:9,agilite:13,dexterite:13,vue:12,volonte:12,empathie:13,
        melee:11,tir:12,lancer:10,dague_jet:0,dague_melee:1,epee_1m:0,arc:2,acrobatie:1,vie:11,vie_max:11,endurance:23,endurance_max:23,fatigue:0,sc:4,sust:2,
        reve:15,reve_pts:13,reve_seuil:15,onrios:-2,hypnos:3,narcos:1,thanatos:-11,
        spells_0_path:'Hypnos',spells_0_name:'Invocation du Guerrier Sorde',spells_0_tmr:'Cité Sordide (D13)',spells_0_difficulty:-8,spells_0_dreamCost:7,
        spells_1_path:'Hypnos',spells_1_name:'Tympan d’Hypnos',spells_1_tmr:'Collines d’Encre (J4)',spells_1_difficulty:-5,spells_1_dreamCost:2,spells_1_cellBonus:'8',
        route_food:1,route_water:10,__rddReprise231:1,__rddFatigue231:1});
    const groin=initialiserSanteVoyageur({taille:9,constitution:12,force:9,volonte:8,vie:11,vie_max:11,endurance:23,endurance_max:23,fatigue:0,sc:4,sust:2,__rddReprise231:1,__rddFatigue231:1});
    s.players=[{id:JOUEUR,realName:'Joueuse fictive',isOnline:false,characters:[{id:PERSO,name:'Nitouche',campaignId:CAMPAGNE,systemId:source.gameDriver.id,templateId:source.sheetTemplate.id,hp:11,maxHp:11,sheetData:fiche}]}];
    s.sessions=[{...s.sessions[0],id:'clip-seance-rdd',campaignId:CAMPAGNE,status:'active',number:1,sessionEntityIds:[PERSO],publicSummary:'Démonstration fictive'}];
    const semenceFichier=path.join(brut,'semence.json');fs.writeFileSync(semenceFichier,JSON.stringify(semence));
    const g=await lancerGmOs({semence:semenceFichier,video:{dossier:brut,largeur:LARGEUR,hauteur:HAUTEUR},preparerLeProfil:profil=>{
        for(const d of ['theme','fiche']){const e=path.resolve('docs/systems/reves de dragons',d);if(fs.existsSync(e))fs.cpSync(e,path.join(profil,'corpus/systems/reves de dragons',d),{recursive:true});}
    }});
    const f=g.fenetre,r=new Realisation(f),chapitres:{titre:string;secondesDepuisTitre:number}[]=[];f.setDefaultTimeout(15_000);
    let ouverture=0,fin=0,reussi=false;
    const personnage=()=>f.evaluate(()=>(window as unknown as Fenetre).useSessionOSStore.getState().players.find(p=>p.id==='clip-joueur-rdd')!.characters[0]);
    const module=()=>f.evaluate(async()=>(await window.appBridge!.modulesDuJeu!.lire()).modules.find(m=>m.id==='rdd-tmr')!.vue as VueTMRMJ);
    const voyageur=async()=>(await module()).voyageurs.find(v=>v.id===PERSO)!;
    const chapitre=async(titre:string)=>{chapitres.push({titre,secondesDepuisTitre:(Date.now()-ouverture)/1000});await r.chapitre(titre);};
    const photo=(nom:string)=>f.screenshot({path:path.join(PREUVES,nom+'.jpg'),type:'jpeg',quality:85,scale:'css'});
    const vue=async(v:'players'|'cockpit'|'modules-du-jeu')=>{await f.evaluate(v=>(window as unknown as Fenetre).useSessionOSStore.getState().setCurrentView(v),v);if(v==='players')await ongletDeLaFiche(f,'Lancer un test');};
    const ouvrirTmr=async()=>{await vue('modules-du-jeu');if(!await f.getByRole('region',{name:'Terres Médianes du Rêve',exact:true}).isVisible())await r.cliquer(f.getByRole('button',{name:'Ouvrir le pupitre',exact:true}));};
    const valider=async(p:Locator)=>{await r.cliquer(p.getByRole('button',{name:'Valider cette opération',exact:true}));await expect(p.getByLabel('Aperçu de l’opération RdD',{exact:true})).toHaveCount(0);};
    try{
        await attendreLHydratation(g);await expect.poll(()=>f.evaluate(()=>(window as unknown as Fenetre).useSessionOSStore.getState().campaigns.map(c=>c.id))).toContain(CAMPAGNE);
        const fenetre=await g.application.browserWindow(f);await fenetre.evaluate((w,t)=>{w.setFullScreen(false);w.unmaximize();w.setResizable(false);w.setMaximizable(false);w.setContentSize(t.l,t.h);w.webContents.setAudioMuted(true);},{l:LARGEUR,h:HAUTEUR});
        await f.setViewportSize({width:LARGEUR,height:HAUTEUR});await expect.poll(()=>f.evaluate(()=>({l:innerWidth,h:innerHeight}))).toEqual({l:LARGEUR,h:HAUTEUR});
        await ouvrirLeModule(g,'Tableau de Bord');await f.evaluate(groin=>{const w=window as unknown as Fenetre,s=w.useSessionOSStore.getState();s.setActiveCampaign('clip-rdd');s.setSelectedPlayer('clip-joueur-rdd');s.setSelectedCharacter('clip-nitouche');s.setCurrentView('players');
            const c=w.useCombatStore.getState();c.clearCombatants();c.addCombatant({name:'Nitouche',init:0,isPlayer:true,faction:'player',statuses:[],sourcePlayerId:'clip-nitouche'});c.addCombatant({name:'Groin fictif',init:0,isPlayer:false,faction:'enemy',statuses:[],hp:11,hpMax:11,sheetData:groin});},groin);
        await vue('players');await f.evaluate(installerLaScene);await r.carte('');
        const panneau=f.locator('[data-panneau-de-jet]').first(),principal=panneau.locator('select').nth(0),competence=panneau.locator('select').nth(1),resultat=panneau.getByLabel('Dernier jet du Voyageur',{exact:true});
        ouverture=Date.now();await r.titre('Rêve de Dragon · du Voyageur aux TMR',['La table de résolution, les suivis et le module de demi-rêve','Fatigue · Entraînement · Sept phases · Château Dormant · Haut-Rêve','Nitouche est fictive — profil jetable, vrais gestes, dés préparés et légendes sans voix.']);

        await chapitre('1 · La table de résolution et les degrés du d100');await r.choisir(principal,'agilite');await r.choisir(competence,'acrobatie');await expect(panneau.getByRole('slider')).toHaveValue('0');
        await r.legende('Une caractéristique croise l’ajustement de compétence et de difficulté.','Le pourcentage et les degrés viennent de la table de résolution ; l’état général s’y ajoute une seule fois.',3500);
        await r.des([.35,.05]);await r.cliquer(panneau.getByRole('button',{name:'Lancer',exact:true}));await r.rendreLeHasard();await expect(resultat).toContainText('30');await r.montrer(resultat,3000);await photo('01-resolution');

        await chapitre('2 · Fatigue et entraînement du Voyageur');await r.carte('fatigue-voyageur');const fatigue=f.getByRole('region',{name:'Fatigue et état général',exact:true});
        await r.choisir(fatigue.getByLabel('Effort ou récupération'),'physique');await r.taper(fatigue.getByLabel('Quantité',{exact:true}),'1');await r.cliquer(fatigue.getByRole('button',{name:'Prévisualiser',exact:true}));
        await r.legende('Une heure draconique de travail physique moyen ajoute deux cases.','L’aperçu conserve l’endurance ; le mouvement ne s’inscrit qu’après confirmation.',3300);await r.montrer(fatigue.getByLabel('Aperçu du mouvement'),2800);await photo('02-fatigue');await r.cliquer(fatigue.getByRole('button',{name:'Appliquer le mouvement',exact:true}));await expect.poll(async()=>(await personnage()).sheetData.fatigue).toBe(2);
        await r.carte('progression-voyageur');const prog=f.getByRole('region',{name:'Progression et Archétype RdD',exact:true});await r.cliquer(prog.getByText('Répartir et progresser',{exact:true}));await r.choisir(prog.getByLabel('Valeur de progression',{exact:true}),'acrobatie');await r.cliquer(prog.getByText('Une heure d’entraînement',{exact:true}));
        await r.choisir(prog.getByLabel('Caractéristique de l’entraînement',{exact:true}),'agilite');await r.taper(prog.getByLabel('d6 d’entraînement',{exact:true}),'3');await r.taper(prog.getByLabel('Jets d’entraînement',{exact:true}),'5 40 99');await r.cliquer(prog.getByRole('button',{name:'Préparer l’entraînement',exact:true}));
        await r.legende('L’entraînement prépare ses jets, sa fatigue et ses XP d’exercice.','L’Archétype reste un potentiel déclaré ; l’aperçu détaille particulière et maladresse.',3300);await r.montrer(prog.getByLabel('Aperçu de l’opération RdD'),2700);await photo('03-entrainement');await valider(prog);await expect.poll(async()=>(await personnage()).sheetData.fatigue).toBe(4);

        await chapitre('3 · Combat-OS : le round en sept phases');await ouvrirLeModule(g,'Combat-OS');const round=f.getByRole('region',{name:'Round de Rêve de Dragon',exact:true});await expect(round).toBeVisible();
        await r.choisir(round.getByLabel('Arme de la fiche de Nitouche',{exact:true}),'Dague de jet');await r.choisir(round.getByLabel('Arme de la fiche de Groin fictif',{exact:true}),'__autre');await r.taper(round.getByLabel('Arme de Groin fictif',{exact:true}),'Masse');await r.taper(round.getByLabel('Facteur de Groin fictif',{exact:true}),'8');
        await r.des([.25,.45,.35,.55]);await r.cliquer(round.getByRole('button',{name:/Tirer l’initiative/}));await r.rendreLeHasard();await expect(round).toContainText('Phase 2 — Magie');
        await r.cliquer(round.getByLabel('Phase suivante',{exact:true}));await r.cliquer(round.getByLabel('Phase suivante',{exact:true}));await expect(round).toContainText('Phase 4 — Lancers');await r.legende('Les déclarations d’armes organisent le round en sept phases.','La dague de jet intervient aux lancers ; la masse du Groin attend la mêlée.',3400);await r.montrer(round,3000);await photo('04-phases');
        for(let i=0;i<3;i++)await r.cliquer(round.getByLabel('Phase suivante',{exact:true}));await expect(round).toContainText('Phase 7');

        await chapitre('4 · Château Dormant, potions et famine');await ouvrirLeModule(g,'Tableau de Bord');await vue('players');await r.carte('repos-voyageur');const repos=f.getByRole('region',{name:'Repos et Château Dormant RdD',exact:true});
        await r.cliquer(repos.getByRole('button',{name:'Préparer le suivi du repos',exact:true}));await valider(repos);await r.cliquer(repos.getByText(/Potions et enchantements non permanents/));await r.taper(repos.getByLabel('Nom de l’enchantement',{exact:true}),'Potion de soins');await r.taper(repos.getByLabel('Rêve de l’enchantement',{exact:true}),'3');await r.cliquer(repos.getByRole('button',{name:'Suivre cet enchantement',exact:true}));await valider(repos);
        await r.cliquer(repos.getByText('Bilan de fin du Château Dormant',{exact:true}));await r.taper(repos.getByLabel('Nuit ou date de jeu (unique)',{exact:true}),'5 Dragon');await r.cocher(repos.getByLabel('Autres opérations nocturnes vérifiées (effets de scénario, souffles en cours)',{exact:true}));await r.cocher(repos.getByLabel(/Compter la famine et la soif/));await r.taper(repos.getByLabel('d20 de moral au matin',{exact:true}),'11');await r.cliquer(repos.getByRole('button',{name:'Prévisualiser le bilan de nuit',exact:true}));
        await r.legende('Le Château Dormant a un bilan nommé, relu avant validation.','Une journée maigre inscrit la famine ; une potion non permanente perd un point de rêve par nuit.',3500);await r.montrer(repos.getByLabel('Aperçu de l’opération RdD'),2800);await photo('05-chateau-dormant');await valider(repos);await expect.poll(async()=>(await personnage()).sheetData.endurance).toBe(22);await expect.poll(async()=>(await personnage()).sheetData.route_food).toBe(0);

        await chapitre('5 · Le module des Terres Médianes du Rêve');await ouvrirTmr();const tmr=f.getByRole('region',{name:'Terres Médianes du Rêve',exact:true});
        const acces=f.getByRole('checkbox',{name:'Nitouche',exact:true});await r.cliquer(acces);await expect(acces).toBeChecked();
        const image=tmr.getByRole('img',{name:'Carte officielle en couleur des Terres Médianes du Rêve'});await expect.poll(()=>image.evaluate((i:HTMLImageElement)=>i.complete&&i.naturalWidth===900)).toBe(true);
        await r.choisir(tmr.getByLabel('Case sélectionnée',{exact:true}),'G4');await r.cliquer(tmr.getByRole('button',{name:'Placer le demi-rêve',exact:true}));await expect.poll(async()=>(await voyageur()).position).toBe('G4');
        await r.legende('Le MJ ouvre le module et autorise chaque haut-rêvant.','La carte garde position, trajets, rencontres et notes ; elle ne possède aucune réserve parallèle.',3500);await r.montrer(tmr.getByRole('button',{name:/^G4 ·/}),3000);await photo('06-carte-tmr');

        await chapitre('6 · Monter et se déplacer : le vrai débit sur la fiche');
        const payer=async(photoNom?:string)=>{const v=await voyageur(),avant=(await personnage()).sheetData;const raccord=f.getByRole('region',{name:'Raccord de fiche de Nitouche',exact:true});await expect(raccord).toBeVisible();await r.cliquer(raccord.getByRole('button',{name:'Prévisualiser le coût sur la fiche',exact:true}));
            await r.cocher(raccord.getByLabel('Conditions de concentration, round et barème de base vérifiés',{exact:true}));await r.montrer(raccord,2000);if(photoNom)await photo(photoNom);await r.cliquer(raccord.getByRole('button',{name:'Débiter la fiche et valider le trajet',exact:true}));await expect(raccord).toHaveCount(0);
            await expect.poll(async()=>(await personnage()).sheetData.reve_pts).toBe(Number(avant.reve_pts)-(v.demande!.action==='monter'?1:0));await expect.poll(async()=>(await personnage()).sheetData.fatigue).toBe(Number(avant.fatigue)+(v.demande!.action==='descendre'?0:1));};
        await r.cliquer(tmr.getByRole('button',{name:'Demander la montée',exact:true}));await r.legende('Monter normalement coûte un rêve et un point de fatigue.','Le raccord prévisualise, relit la fiche puis inscrit le débit et son reçu avant de valider le trajet.',3500);await payer('07-raccord-montee');await expect.poll(async()=>(await voyageur()).present).toBe(true);
        await r.choisir(tmr.getByLabel('Case sélectionnée',{exact:true}),'H4');await r.cliquer(tmr.getByRole('button',{name:'Demander le déplacement',exact:true}));await payer();await expect.poll(async()=>(await voyageur()).position).toBe('H4');await r.montrer(tmr.locator('.tmr-position'),2700);await photo('08-deplacement');

        await chapitre('7 · Rencontre privée, révélation et maîtrise');await r.cliquer(tmr.getByText('Rencontre et préparation privée',{exact:true}));await r.taper(tmr.getByLabel('Préparation secrète du MJ',{exact:true}),'Messager de force 2 ; un renseignement sur le moulin, préparé par le gardien.');await r.cliquer(tmr.getByRole('button',{name:'Garder la préparation privée',exact:true}));
        await r.taper(tmr.getByLabel('Rencontre à révéler à ce joueur',{exact:true}),'Un Messager des rêves se présente, force 2.');await r.cliquer(tmr.getByRole('button',{name:'Révéler la rencontre',exact:true}));await r.choisir(tmr.getByLabel('Case sélectionnée',{exact:true}),'I4');await expect(tmr.getByRole('button',{name:'Demander le déplacement',exact:true})).toBeDisabled();
        await r.legende('Le gardien garde sa préparation, puis révèle ce que le voyageur perçoit.','Une rencontre publiée suspend le déplacement. Sa maîtrise se résout dans Haut-Rêve sur la fiche.',3500);await r.montrer(tmr.getByRole('region',{name:'Rencontre révélée',exact:true}),2800);await photo('09-rencontre-revelee');
        await vue('players');await r.carte('haut-reve-voyageur');const hr=f.getByRole('region',{name:'Haut-Rêve RdD',exact:true});await r.cliquer(hr.getByText('Rencontre en TMR',{exact:true}));await r.choisir(hr.getByLabel('Genre de terre',{exact:true}),'plaines');await r.choisir(hr.getByLabel('Rencontre imposée',{exact:true}),'messager');await r.taper(hr.getByLabel('Force de la rencontre',{exact:true}),'2');await r.taper(hr.getByLabel('d100 de maîtrise',{exact:true}),'5');await r.cliquer(hr.getByRole('button',{name:'Préparer la rencontre',exact:true}));
        await r.legende('La maîtrise emploie le rêve actuel, la meilleure voie et la force adverse.','L’état général entre dans le calcul ; le gardien interprète le message du Messager.',3500);await r.montrer(hr.getByLabel('Aperçu de l’opération RdD'),3000);await photo('10-maitrise');await valider(hr);
        await ouvrirTmr();await r.cliquer(tmr.getByText('Rencontre et préparation privée',{exact:true}));await r.cliquer(tmr.getByRole('button',{name:'Marquer la rencontre résolue',exact:true}));await expect.poll(async()=>(await voyageur()).rencontre).toBe('');
        for(const caseId of ['I4','J4']){await r.choisir(tmr.getByLabel('Case sélectionnée',{exact:true}),caseId);await r.cliquer(tmr.getByRole('button',{name:'Demander le déplacement',exact:true}));await payer();}await expect.poll(async()=>(await voyageur()).position).toBe('J4');

        await chapitre('8 · Sort en réserve, carnet et sortie des TMR');await vue('players');await r.carte('haut-reve-voyageur');await r.cliquer(hr.getByText('Lancer un sort',{exact:true}));await r.choisir(hr.getByLabel('Sort à lancer',{exact:true}),'1');await r.taper(hr.getByLabel('d100 du lancer',{exact:true}),'30');await r.cocher(hr.getByLabel('Mettre en réserve (+1 rêve)',{exact:true}));await r.taper(hr.getByLabel('Heure de la cible',{exact:true}),'Faucon');await r.cliquer(hr.getByRole('button',{name:'Préparer le lancer',exact:true}));
        await r.legende('À J4, Tympan d’Hypnos bénéficie de ses +8 % de case.','Le sort coûte deux rêves, plus un pour la réserve ; la ligne du livret et le bonus de case se mettent à jour.',3500);await r.montrer(hr.getByLabel('Aperçu de l’opération RdD'),3000);await photo('11-sort-reserve');await valider(hr);
        await expect.poll(async()=>(await personnage()).sheetData.reve_pts).toBe(9);await expect.poll(async()=>(await personnage()).sheetData.spells_1_cellBonus).toBe('9');await expect.poll(async()=>(await personnage()).sheetData.reservedSpells_0_name).toBe('Tympan d’Hypnos');
        await ouvrirTmr();await r.choisir(tmr.getByLabel('Case sélectionnée',{exact:true}),'J4');await r.cliquer(tmr.getByText('Inscrire un sort, une queue ou un souffle',{exact:true}));await r.taper(tmr.getByLabel('Nom',{exact:true}),'Tympan d’Hypnos');await r.taper(tmr.getByLabel('Détails et échéance',{exact:true}),'Déjà lancé et payé sur la fiche ; réserve du livret à J4, heure Faucon.');await r.cliquer(tmr.getByRole('button',{name:'Inscrire pour ce joueur',exact:true}));
        await expect.poll(async()=>(await voyageur()).notes.some(n=>n.nom==='Tympan d’Hypnos'&&n.caseId==='J4')).toBe(true);await r.legende('Le carnet cartographie la réserve déjà payée sur la fiche.','Inscrire cette note ne dépense aucun rêve supplémentaire. Le déclenchement reste une opération du Haut-Rêve.',3400);await r.montrer(tmr.getByText('Sort en réserve · Tympan d’Hypnos',{exact:true}),2700);await photo('12-carnet-tmr');
        await r.cliquer(tmr.getByRole('button',{name:'Quitter les TMR',exact:true}));await payer();await expect.poll(async()=>(await voyageur()).present).toBe(false);await expect.poll(async()=>(await voyageur()).position).toBe('J4');
        await r.cliquer(tmr.getByText('Journal du voyage',{exact:true}));await r.montrer(tmr.locator('details').filter({hasText:'Journal du voyage'}),3000);await photo('13-journal');
        await r.titre('Le demi-rêve demeure dans les Collines d’Encre',['Les suivis écrivent sur le Voyageur ; le module conserve son parcours et ses réserves notées.',
            'Rencontres, rythme du récit et conséquences restent arbitrés par le gardien.',
            'Rêve de Dragon · pilote 2.0.0 · module TMR · fiction de démonstration'],6500);reussi=true;fin=Date.now();
    }catch(erreur){await f.screenshot({path:path.join(PREUVES,'diagnostic-echec.jpg'),type:'jpeg'});throw erreur;}
    finally{const video=f.video();await g.fermer();const fichierVideo=await video?.path();if(reussi&&fichierVideo){
        const exportVideo=JSON.parse(execFileSync(process.execPath,['outils/clips/exporter_clip.mjs',fichierVideo,SORTIE,'reve-de-dragon-mecanismes-et-tmr',String((fin-ouverture)/1000)],{encoding:'utf8'}));
        fs.writeFileSync(path.join(PREUVES,'verification.json'),JSON.stringify({version:source.gameDriver.version,module:'rdd-tmr',profilJetable:true,donneesPersonnelles:false,desPrepares:true,narrationSonore:false,modeRapide:!!process.env.GMOS_CLIP_RAPIDE,dureeDepuisTitre:(fin-ouverture)/1000,chapitres,exportVideo,
            assertions:['d100 et table de résolution','fatigue 0 → 2 puis entraînement → 4','round : phases Magie, Lancers et phase7','bilan de nuit : famine, nourriture0 et endurance22','accès TMR et carte officielle chargée','G4 placé, montée : rêve−1/fatigue+1','chaque déplacement : fatigue+1','rencontre publiée bloque le déplacement','maîtrise sur la fiche, puis résolution au module','trajet H4–I4–J4','sort en réserve payé : rêve9, bonus9, ligne de réserve inscrite','note TMR sans nouveau débit','sortie sans débit, demi-rêve conservé à J4']},null,2));}
        if(path.resolve(brut).startsWith(racineTemp+path.sep))fs.rmSync(brut,{recursive:true,force:true});else console.error('Nettoyage temporaire refusé.');}
});
