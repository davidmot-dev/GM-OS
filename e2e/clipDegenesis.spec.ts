import { test, expect, type Locator, type Page } from '@playwright/test';
import AdmZip from 'adm-zip';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { lancerGmOs, attendreLHydratation, ouvrirLeModule, ongletDeLaFiche } from './lancerGmOs';
import type { useCombatStore } from '../src/modules/combat/useCombatStore';
import type { useRoundDeDegenesisStore } from '../src/modules/combat/useRoundDeDegenesisStore';
import type { useJetsLiesDeDegenesisStore } from '../src/modules/combat/useJetsLiesDeDegenesisStore';
import type { EtatDegenesisDeLaFiche } from '../src/modules/dice/systemes/maximaDeDegenesis';
import type { useSessionOSStore } from '../src/modules/session/useSessionOSStore';

/** David, 06/11/2026 : filmer les mécanismes particuliers de Degenesis avec Playwright.
 * Instance jetable, personnage et effets fictifs, vrais gestes, dés préparés.
 * npm run build puis npx playwright test e2e/clipDegenesis.spec.ts --reporter=list
 */
const PILOTE = path.resolve(process.env.GMOS_PILOTE_DEGENESIS ?? 'output/clips/degenesis/pilote/Degenesis-2.3.0.gmos-driver');
const SORTIE = path.resolve(process.env.GMOS_SORTIE_CLIP ?? 'output/clips');
const PREUVES = path.join(SORTIE, 'degenesis');
const CAMPAGNE = 'clip-degenesis', JOUEUR = 'clip-joueur-degenesis', PERSO = 'clip-falberg';
const LARGEUR = 1440, HAUTEUR = 900;
type Fenetre = Window & { useSessionOSStore: typeof useSessionOSStore; useCombatStore: typeof useCombatStore; useRoundDeDegenesisStore: typeof useRoundDeDegenesisStore; useJetsLiesDeDegenesisStore: typeof useJetsLiesDeDegenesisStore; hasardClipDegenesis?: () => number };

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
            const w = window as unknown as Fenetre; w.hasardClipDegenesis ??= Math.random;
            const origine = w.hasardClipDegenesis; Math.random = () => file.length ? file.shift()! : origine();
        }, file);
    }
    async rendreLeHasard() { await this.page.evaluate(() => { const w = window as unknown as Fenetre; if (w.hasardClipDegenesis) Math.random = w.hasardClipDegenesis; }); }
}




test('les mécanismes de Degenesis et ses outils intégrés, en clip',async()=>{
    test.setTimeout(900_000);expect(fs.existsSync(PILOTE)).toBe(true);fs.mkdirSync(PREUVES,{recursive:true});
    const racineTemp=path.resolve(os.tmpdir()),brut=fs.mkdtempSync(path.join(racineTemp,'gmos-clip-degenesis-'));
    if(!path.resolve(brut).startsWith(racineTemp+path.sep))throw new Error('Profil inattendu.');
    const source=JSON.parse(new AdmZip(PILOTE).readAsText('state.json'));expect(source.gameDriver.version).toBe('2.3.0');
    const semence=JSON.parse(fs.readFileSync('e2e/donnees/campagne-de-demo.json','utf8')),s=semence.modules.sessionOS;
    s.campaigns=[{id:CAMPAGNE,name:'Le chariot des Cendres',system:source.gameDriver.id,systemPath:'systems/degenesis',activeLocationIds:[]}];
    s.activeCampaignId=CAMPAGNE;s.customGameDrivers=[source.gameDriver];s.customSheetTemplates=[source.sheetTemplate];
    const valeurs=Object.fromEntries(source.sheetTemplate.sections.flatMap((sec:{fields:{id:string;defaultValue?:unknown}[]})=>sec.fields).map((c:{id:string;defaultValue?:unknown})=>[c.id,c.defaultValue??'']));
    const fiche={...valeurs,nom:'Falberg',culture:'Borca',concept:'Le Gardien',culte:'Spitaliers',rang:'Préserviste',physique:4,agilite:2,charisme:2,intellect:3,psyche:3,instinct:2,
        corps_a_corps:3,force:3,resistance:2,athletisme:2,reactivite:2,volonte:2,concentration:2,pulsions:1,perception:2,
        ego_max:8,ego_jauge:8,sporulations_jauge:11,blessures_superficielles:0,traumatismes:0,sante:19,
        arme1:'Épée Preservalis',arme1_degats:'4+F/2',arme1_maniabilite:'+1D',armure1:'Combinaison de Préserviste',armure1_valeur:3,
        potentiel1_nom:'Fanatisme',potentiel1:1};
    s.players=['Falberg','Kum'].map((name,i)=>({id:i?JOUEUR+'-kum':JOUEUR,realName:'Joueur fictif '+(i+1),isOnline:false,characters:[{id:i?PERSO+'-kum':PERSO,name,campaignId:CAMPAGNE,systemId:source.gameDriver.id,templateId:source.sheetTemplate.id,hp:i?16:19,maxHp:i?16:19,sheetData:i?{...fiche,nom:name,physique:3,force:2,sporulations_jauge:0,sante:16}:{...fiche}}]}));
    s.sessions=[{...s.sessions[0],id:'clip-seance-degenesis',campaignId:CAMPAGNE,status:'active',number:1,sessionEntityIds:[PERSO,PERSO+'-kum'],publicSummary:'Démonstration fictive'}];
    const semenceFichier=path.join(brut,'semence.json');fs.writeFileSync(semenceFichier,JSON.stringify(semence));
    const g=await lancerGmOs({semence:semenceFichier,video:{dossier:brut,largeur:LARGEUR,hauteur:HAUTEUR},preparerLeProfil:profil=>{
        for(const d of ['theme','fiche']){const e=path.resolve('docs/systems/degenesis',d);if(fs.existsSync(e))fs.cpSync(e,path.join(profil,'corpus/systems/degenesis',d),{recursive:true});}
    }});
    const f=g.fenetre,r=new Realisation(f),chapitres:{titre:string;secondesDepuisTitre:number}[]=[];f.setDefaultTimeout(15_000);
    let ouverture=0,fin=0,reussi=false;
    const personnage=()=>f.evaluate(()=>(window as unknown as Fenetre).useSessionOSStore.getState().players.find(p=>p.id==='clip-joueur-degenesis')!.characters[0]);
    const suivi=async()=>(await personnage()).sheetData._gmos_degenesis as EtatDegenesisDeLaFiche;
    const combattants=()=>f.evaluate(()=>(window as unknown as Fenetre).useCombatStore.getState().combatants);
    const chapitre=async(titre:string)=>{chapitres.push({titre,secondesDepuisTitre:(Date.now()-ouverture)/1000});await r.chapitre(titre);};
    const photo=(nom:string)=>f.screenshot({path:path.join(PREUVES,nom+'.jpg'),type:'jpeg',quality:85,scale:'css'});
    const vue=async(perso='falberg')=>{await ouvrirLeModule(g,'Tableau de Bord');await f.evaluate(perso=>{const s=(window as unknown as Fenetre).useSessionOSStore.getState();s.setSelectedPlayer(perso==='kum'?'clip-joueur-degenesis-kum':'clip-joueur-degenesis');s.setSelectedCharacter(perso==='kum'?'clip-falberg-kum':'clip-falberg');s.setCurrentView('players');},perso);await ongletDeLaFiche(f,'Lancer un test');};
    try{
        await attendreLHydratation(g);await expect.poll(()=>f.evaluate(()=>(window as unknown as Fenetre).useSessionOSStore.getState().campaigns.map(c=>c.id))).toContain(CAMPAGNE);
        const fenetre=await g.application.browserWindow(f);await fenetre.evaluate((w,t)=>{w.setFullScreen(false);w.unmaximize();w.setResizable(false);w.setMaximizable(false);w.setContentSize(t.l,t.h);w.webContents.setAudioMuted(true);},{l:LARGEUR,h:HAUTEUR});await f.setViewportSize({width:LARGEUR,height:HAUTEUR});
        await ouvrirLeModule(g,'Tableau de Bord');await f.evaluate(()=>{const w=window as unknown as Fenetre,s=w.useSessionOSStore.getState();s.setActiveCampaign('clip-degenesis');s.setSelectedPlayer('clip-joueur-degenesis');s.setSelectedCharacter('clip-falberg');s.setCurrentView('players');const c=w.useCombatStore.getState();c.clearCombatants();c.addCombatant({name:'Falberg',init:0,isPlayer:true,faction:'player',statuses:[],sourcePlayerId:'clip-falberg'});c.addCombatant({name:'Usudi fictif',init:0,isPlayer:false,faction:'enemy',statuses:[],hp:10,hpMax:10,sheetData:{agilite:3,mobilite:2,armure1:'Chemise de mailles',armure1_valeur:2,armure2:'Cuir',armure2_valeur:1}});});
        await vue();await f.evaluate(installerLaScene);await r.carte('');
        const panneau=f.locator('[data-panneau-de-jet]').first(),principal=panneau.locator('select').nth(0),competence=panneau.locator('select').nth(1),prep=panneau.locator('[data-preparation-degenesis]'),resultat=panneau.getByRole('region',{name:'Résultat',exact:true});
        const composer=async(a:string,c:string)=>{await r.choisir(principal,a);await r.choisir(competence,c);};
        const jeter=async(des:number[])=>{await r.des(des.map(n=>(n-.5)/6));await r.cliquer(panneau.getByRole('button',{name:'Lancer',exact:true}));await r.rendreLeHasard();};
        ouverture=Date.now();await r.titre('Degenesis · le chariot des Cendres',['KatharSys : des d6, des succès et des déclencheurs','Égo · Jets liés · Round · Santé · Sporulation · Brûlure','Personnages et valeurs d’exercice fictifs — profil jetable, dés préparés et légendes sans voix.']);

        await chapitre('1 · Valeur d’action, difficulté et Égo');await composer('physique','force');await r.cliquer(prep.getByRole('button',{name:'Difficile (4)',exact:true}));await r.cliquer(prep.getByRole('button',{name:'Déplacement de plus de 2 m −2D',exact:true}));await r.choisir(prep.getByLabel('Égo dépensé',{exact:true}),'1');await expect(prep.locator('[data-composition-degenesis]')).toContainText('6 dés');
        await r.legende('PHY 4 + Force 3, déplacement −2D et un Égo : six dés.','La difficulté demande quatre succès. Chaque 4, 5 ou 6 réussit ; les six donnent aussi des déclencheurs.',3300);await r.montrer(prep,2800);await photo('01-preparation');await jeter([6,6,4,5,2,1]);await expect.poll(async()=>(await personnage()).sheetData.ego_jauge).toBe(7);await r.legende('Quatre succès atteignent la difficulté ; deux déclencheurs qualifient la réussite.','L’Égo passe de 8 à 7 sur la fiche. Sur un échec, les six ne déclencheraient rien.',3300);await r.montrer(resultat,2800);await photo('02-resultat');

        await chapitre('2 · Les maxima ne remplissent pas les réserves');await r.carte('maxima-degenesis');const maxima=f.locator('[data-maxima-degenesis]');await r.cocher(maxima.getByLabel(/^Concentration/));await expect(maxima.locator('[data-contradiction-degenesis="ego"]')).toContainText('elles s’excluent');await r.cliquer(maxima.getByRole('button',{name:'Mettre Pulsions à 0',exact:true}));await r.cliquer(maxima.getByRole('button',{name:'Appliquer tout (1)',exact:true}));await expect.poll(async()=>(await personnage()).sheetData.ego_max).toBe(10);await expect.poll(async()=>(await personnage()).sheetData.ego_jauge).toBe(7);
        await r.legende('La branche Concentration donne (INT 3 + 2) × 2 = dix Égo au maximum.','Le maximum passe de 8 à 10 ; la réserve actuelle reste à 7. Les autres maxima suivent leurs formules.',3300);await r.montrer(maxima,2800);await photo('03-maxima');await r.carte('');

        await chapitre('3 · Combinaison, action complexe, confrontation et aide');await composer('physique','force');await r.cliquer(prep.getByRole('button',{name:'Délicate (2)',exact:true}));await r.taper(prep.getByLabel('Modificateurs en dés',{exact:true}),'0');await r.choisir(prep.getByLabel('Égo dépensé',{exact:true}),'0');await jeter([6,6,6,6,6,6,6]);await r.cliquer(panneau.getByRole('button',{name:/Enchaîner un second test \(reporte 7 déclencheurs\)/}));await composer('instinct','perception');await jeter([4,4,4,4]);await expect(panneau.locator('[data-combinaison-degenesis]')).toContainText('0 déclencheur + 7 reportés = 7');
        await r.legende('Les sept déclencheurs du premier test suivent le second.','Ils s’ajoutent si ce second test réussit, puis le report est consommé. Un échec les aurait perdus.',3300);await r.montrer(panneau.locator('[data-combinaison-degenesis]'),2800);await photo('04-combinaison');
        await jeter([6,6,6,6]);const complexe=panneau.locator('[data-action-complexe-degenesis]');await r.cliquer(complexe.locator('summary'));await r.taper(complexe.getByLabel('Nom de l’action complexe',{exact:true}),'Dégager le chariot');await r.taper(complexe.getByLabel('Objectif de succès',{exact:true}),'8');await r.cliquer(complexe.getByRole('button',{name:'Ouvrir',exact:true}));await r.cliquer(complexe.getByRole('button',{name:'Verser 4 succès + 4 déclencheurs (8)',exact:true}));await expect(complexe.locator('[data-cumul-action]')).toHaveText('8 / 8');
        await r.legende('Une action complexe cumule les succès et un point par déclencheur.','Ce nouveau jet apporte 4 succès + 4 déclencheurs : les huit points atteignent l’objectif.',3300);await r.montrer(complexe,2800);await photo('05-complexe');await r.cliquer(complexe.getByRole('button',{name:'Clore',exact:true}));
        const confrontation=panneau.locator('[data-confrontation-degenesis]');await r.cliquer(confrontation.locator('summary'));await r.choisir(confrontation.getByLabel('Adversaire',{exact:true}),{label:'Kum'});await r.choisir(confrontation.getByLabel('Réserve de l’adversaire',{exact:true}),'physique|force');await r.des([6,6,6,6,1].map(n=>(n-.5)/6));await r.cliquer(confrontation.getByRole('button',{name:'Lancer sa réserve',exact:true}));await r.rendreLeHasard();await r.choisir(confrontation.getByLabel('Qui a pris l’initiative',{exact:true}),'a');await expect(confrontation.locator('[data-issue-confrontation]')).toContainText('égalité parfaite');
        await r.legende('En confrontation : les succès départagent, puis les six.','À égalité parfaite, statu quo ; si un vainqueur est nécessaire, celui qui a pris l’initiative perd.',3300);await r.montrer(confrontation,2800);await photo('06-confrontation');
        await vue('kum');await r.carte('');await composer('physique','force');await r.cocher(panneau.getByLabel(/Ce jet aide un autre personnage/));await r.choisir(panneau.getByLabel('Personnage aidé',{exact:true}),{label:'Falberg'});await jeter([6,6,6,6,6]);await expect(panneau.locator('[data-aide-donnee]')).toContainText('+5D');await vue();await composer('instinct','perception');await expect(panneau.locator('[data-aide-recue]')).toContainText('+5D');
        await r.legende('L’assistant joue à difficulté +1 ; ses déclencheurs deviennent des dés d’aide.','Kum a réussi avec cinq déclencheurs : Falberg reçoit +5D sur un seul jet. Au-delà de douze dés, le surplus devient succès.',3300);await r.montrer(prep,2800);await photo('07-aide');await jeter([4,4,4,4,4,4,4,4,4]);await expect(panneau.locator('[data-aide-recue]')).toHaveCount(0);

        await chapitre('4 · Préparer l’adversaire et payer l’Égo à l’initiative');await ouvrirLeModule(g,'Combat-OS');const round=f.getByRole('region',{name:'Round de Degenesis',exact:true});const usudi=round.locator('[data-adversaire-degenesis]');await r.taper(usudi.getByLabel('PHY de Usudi fictif',{exact:true}),'3');await r.taper(usudi.getByLabel('Résistance de Usudi fictif',{exact:true}),'2');await r.taper(usudi.getByLabel('PSY de Usudi fictif',{exact:true}),'2');await r.taper(usudi.getByLabel('Égo de Usudi fictif',{exact:true}),'4');await r.cliquer(usudi.getByRole('button',{name:'Préparer',exact:true}));await expect(usudi.locator('[data-pistes-adversaire]')).toContainText('Blessures 0 / 10 · Traumatismes 0 / 5');
        await r.legende('Un adversaire autonome doit avoir ses maxima avant de subir des pistes.','PHY 3, Résistance 2 et PSY 2 donnent dix Blessures superficielles et cinq Traumatismes.',3300);await r.montrer(usudi,2800);await photo('08-adversaire');await r.choisir(round.getByLabel('Égo de Falberg',{exact:true}),'2');await r.taper(round.getByLabel('PSY + Réactivité de Usudi fictif',{exact:true}),'4');await r.des(Array(80).fill(.99));await r.cliquer(round.getByRole('button',{name:'Lancer l’initiative',exact:true}));await r.rendreLeHasard();await expect.poll(async()=>(await personnage()).sheetData.ego_jauge).toBe(5);
        await r.legende('L’initiative paie les deux Égo une seule fois : la réserve passe de 7 à 5.','PSY + Réactivité + Égo donne ici sept succès et quatre actions. La première action recevra encore +2D, déjà payés.',3300);await r.montrer(round,2800);await photo('09-round');

        await chapitre('5 · Attaque, défense active et dégâts nets');await vue();await r.carte('');await composer('physique','corps_a_corps');await r.choisir(prep.getByLabel('Arme de l’attaque',{exact:true}),'arme1');await expect(prep.locator('[data-composition-degenesis]')).toContainText('10 dés');await jeter(Array(10).fill(4));const attaque=panneau.locator('[data-attaque-degenesis]');await r.choisir(attaque.getByLabel('Cible de l’attaque',{exact:true}),{label:'Usudi fictif'});await r.cliquer(attaque.getByRole('button',{name:'Défense active',exact:true}));await r.choisir(attaque.getByLabel('Défense active',{exact:true}),'esquive');await r.des(Array(30).fill(.6));await r.cliquer(attaque.getByRole('button',{name:'Lancer la défense (1 action)',exact:true}));await r.rendreLeHasard();await expect(attaque.locator('[data-issue-degenesis]')).toContainText('5 succès contre 10');await expect(attaque.locator('[data-coup-degenesis]')).toContainText('8 − armure 2 = 6');
        await r.legende('L’esquive du défenseur dépense une action ; cinq succès ne battent pas les dix de Falberg.','L’épée fait 4 + F/2, soit huit dégâts ; une seule armure retire deux : six Blessures superficielles.',3300);await r.montrer(attaque,2800);await photo('10-attaque');await r.cliquer(attaque.getByRole('button',{name:'Porter le coup à Usudi fictif',exact:true}));await expect.poll(async()=>(await combattants()).find(c=>c.name==='Usudi fictif')!.sheetData!.blessures_superficielles).toBe(6);await expect.poll(async()=>(await personnage()).sheetData.ego_jauge).toBe(5);

        await chapitre('6 · Blessures superficielles, Traumatismes et dés perdus');await ouvrirLeModule(g,'Combat-OS');const carte=f.locator('[data-combattant]').filter({has:f.getByText('Falberg',{exact:true})});await r.taper(carte.getByTitle('Intensité',{exact:true}),'14');await r.choisir(carte.getByTitle('Type de dégâts — appliqué aux résistances de la fiche',{exact:true}),'physique');await r.legende('On saisit ici quatorze dégâts nets, armure déjà retirée.','La piste superficielle absorbe douze ; les deux points restants deviennent des Traumatismes.',3300);await r.cliquer(carte.getByTitle('Infliger dégâts',{exact:true}));await expect.poll(async()=>{const c=await personnage();return[c.sheetData.blessures_superficielles,c.sheetData.traumatismes,c.hp];}).toEqual([12,2,5]);await r.montrer(carte,2800);await photo('11-sante');
        await vue();await composer('instinct','perception');await expect(prep.locator('[data-composition-degenesis]')).toContainText('−2D de Traumatismes');await r.legende('Chaque Traumatisme retire un dé à tous les tests d’action.','Deux Traumatismes enlèvent donc deux dés. Un soin ordinaire traite les Blessures superficielles ; les Traumatismes se soignent à part.',3300);await r.montrer(prep,2800);await photo('12-traumatismes');

        await chapitre('7 · Sporulation, test du Germe et EX');await r.carte('sporulation-degenesis');const spores=f.locator('[data-sporulation-degenesis]');await expect(spores.locator('[data-sporulation-total]')).toHaveText('11 / 10');await r.des(Array(30).fill(.01));await r.cliquer(spores.locator('[data-test-du-germe]').getByRole('button',{name:'Lancer',exact:true}));await r.rendreLeHasard();await expect.poll(async()=>(await suivi()).sporulationPermanente).toBe(1);
        await r.legende('L’exemple commence à onze Sporulations pour un maximum de dix.','Le test du Germe échoue : un point devient permanent. La jauge et le statut de Porteur le distinguent.',3300);await r.montrer(spores.locator('[data-seuils-sporulation]'),2800);await photo('13-germe');await r.des([.4]);await r.cliquer(spores.getByRole('button',{name:'Prendre l’EX',exact:true}));await r.rendreLeHasard();await expect.poll(async()=>(await personnage()).sheetData.sporulations_jauge).toBe(8);await expect(spores.getByRole('button',{name:'Prendre l’EX',exact:true})).toBeDisabled();await r.legende('L’EX retire trois points cette fois, en conservant le point permanent.','Une dose par jour : le bouton se bloque. Nouveau jour rend un Égo et rouvre cette possibilité.',3300);await r.montrer(spores,2800);await photo('14-ex');await r.cliquer(spores.getByRole('button',{name:'Nouveau jour (+1 Égo)',exact:true}));await expect.poll(async()=>(await personnage()).sheetData.ego_jauge).toBe(6);await expect(spores.getByRole('button',{name:'Prendre l’EX',exact:true})).toBeEnabled();

        await chapitre('8 · Brûlure, initiative et Potentiel choisi');await r.choisir(spores.getByLabel('Chakra de la Brûlure',{exact:true}),'argus');await r.cocher(spores.getByLabel(/intense/));await r.des([.5]);await r.cliquer(spores.getByRole('button',{name:'Inhaler',exact:true}));await r.rendreLeHasard();await expect.poll(async()=>(await personnage()).sheetData.ego_jauge).toBe(10);await expect.poll(async()=>(await personnage()).sheetData.sporulations_jauge).toBe(12);await expect(spores.locator('[data-stimulation-en-cours]')).toContainText('Argus, Puissance 4');
        await r.legende('L’Argus intense donne Puissance 4 : l’Égo revient à dix, les Sporulations montent à douze.','La stimulation est conservée et proposée à l’initiative ; les nouveaux tests du Germe restent à résoudre.',3300);await r.montrer(spores.locator('[data-brulure]'),2800);await photo('15-brulure');await ouvrirLeModule(g,'Combat-OS');await r.cliquer(round.getByText('Avant l’initiative',{exact:true}));await expect(round.getByLabel('Initiative de Falberg',{exact:true})).toContainText('Argus : +4D');await r.montrer(round.getByLabel('Initiative de Falberg',{exact:true}),2800);
        await vue();await r.carte('');await composer('instinct','perception');await r.choisir(panneau.getByLabel('Potentiel utilisé',{exact:true}),'potentiel1_nom');await r.taper(panneau.getByLabel('Dés du Potentiel',{exact:true}),'2');await r.legende('Un Potentiel se choisit explicitement ; ses dés sont accordés par le meneur.','Son texte libre n’est pas interprété. La durée de la stimulation et les effets narratifs restent à la table.',3300);await r.montrer(prep,2800);await photo('16-potentiel');
        await r.titre('Chaque avantage laisse une trace',['Les jets liés passent leurs bonus ; le round tient les dépenses ; les pistes gardent les conséquences.',
            'Outils intégrés au pilote : aucun module indépendant Degenesis dans le catalogue actuel.',
            'Degenesis · pilote 2.3.0 · valeurs d’exercice fictives · sélection de mécanismes'],6500);reussi=true;fin=Date.now();
    }catch(erreur){await f.screenshot({path:path.join(PREUVES,'diagnostic-echec.jpg'),type:'jpeg'});throw erreur;}
    finally{const video=f.video();await g.fermer();const fichierVideo=await video?.path();if(reussi&&fichierVideo){
        const exportVideo=JSON.parse(execFileSync(process.execPath,['outils/clips/exporter_clip.mjs',fichierVideo,SORTIE,'degenesis-mecanismes-et-outils',String((fin-ouverture)/1000)],{encoding:'utf8'}));
        fs.writeFileSync(path.join(PREUVES,'verification.json'),JSON.stringify({version:source.gameDriver.version,profilJetable:true,donneesPersonnelles:false,desPrepares:true,narrationSonore:false,modeRapide:!!process.env.GMOS_CLIP_RAPIDE,dureeDepuisTitre:(fin-ouverture)/1000,chapitres,exportVideo,
            assertions:['six d6 et quatre succès requis','Égo8 → 7','Égo maximal8 → 10 sans remplir la réserve','sept déclencheurs reportés sur un second test réussi','action complexe8/8','confrontation : égalité parfaite et initiative','cinq dés d’aide reçus puis consommés','adversaire préparé : maxima10/5','initiative : Égo7 → 5','première attaque +2D sans nouveau débit','défense active5 contre10','dégâts8 − armure2 = 6 et pistes adverses6','quatorze dégâts nets : Blessures12, Traumatismes2, hp5','−2D de Traumatismes','Germe : un point permanent','EX11 → 8 et une dose par jour','nouveau jour : Égo5 → 6','Argus4 : Égo10, Sporulations12 et +4D à l’initiative','Potentiel choisi avec deux dés saisis','absence de module indépendant au catalogue']},null,2));}
        if(path.resolve(brut).startsWith(racineTemp+path.sep))fs.rmSync(brut,{recursive:true,force:true});else console.error('Nettoyage temporaire refusé.');}
});
