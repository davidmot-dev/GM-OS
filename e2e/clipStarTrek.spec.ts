import { test, expect, type Locator, type Page } from '@playwright/test';
import AdmZip from 'adm-zip';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { lancerGmOs, attendreLHydratation, ouvrirLeModule, ongletDeLaFiche } from './lancerGmOs';
import { creerFiction } from '../outils/star-trek/lcars/fiction.mjs';
import { exporterConfiguration } from '../outils/star-trek/lcars/configuration.mjs';
import type { CommandeDeModule } from '../src/modules/modulesDuJeu/protocole';
import type { VueOperations, VaisseauVu } from '../outils/star-trek/operations/moteur.mjs';
import type { VueLcarsMJ } from '../outils/star-trek/lcars/moteur.mjs';
import type { useRessourcesDeTableStore } from '../src/modules/table/useRessourcesDeTableStore';
import type { useSessionOSStore } from '../src/modules/session/useSessionOSStore';

/** David, 06/11/2026 : filmer les mécanismes particuliers de Star Trek avec Playwright.
 * Instance jetable, personnage et effets fictifs, vrais gestes, dés préparés.
 * npm run build puis npx playwright test e2e/clipStarTrek.spec.ts --reporter=list
 */
const PILOTE = path.resolve(process.env.GMOS_PILOTE_STAR_TREK ?? 'output/clips/star-trek/pilote/Star-Trek-2.0.0.gmos-driver');
const SORTIE = path.resolve(process.env.GMOS_SORTIE_CLIP ?? 'output/clips');
const PREUVES = path.join(SORTIE, 'star-trek');
const CAMPAGNE = 'clip-star-trek', JOUEUR = 'clip-joueur-star-trek', PERSO = 'clip-tvael';
const LARGEUR = 1440, HAUTEUR = 900;
type Fenetre = Window & { useSessionOSStore: typeof useSessionOSStore; useRessourcesDeTableStore: typeof useRessourcesDeTableStore; hasardClipStarTrek?: () => number };

/** Curseur, surlignage et légendes comme le clip RuneQuest ; palette verte et cuivre. */
function installerLaScene() {
    const style = document.createElement('style');
    style.textContent = `
      #clip-curseur{position:fixed;left:0;top:0;z-index:2147483647;pointer-events:none;transform:translate(-100px,-100px);filter:drop-shadow(0 2px 3px #000)}
      #clip-curseur.clic::after{content:'';position:absolute;left:-14px;top:-14px;width:28px;height:28px;border:3px solid #f6b26b;border-radius:50%;animation:clip-onde .5s ease-out forwards}
      @keyframes clip-onde{from{transform:scale(.3);opacity:1}to{transform:scale(1.6);opacity:0}}
      #clip-anneau{position:fixed;z-index:2147483646;pointer-events:none;border:3px solid #f6b26b;border-radius:8px;box-shadow:0 0 18px #f6b26b66;opacity:0}
      #clip-legende{position:fixed;left:50%;bottom:20px;transform:translateX(-50%);max-width:1160px;width:max-content;z-index:2147483645;pointer-events:none;background:#050b19f2;color:white;font:600 22px/1.35 'Segoe UI',system-ui,sans-serif;padding:14px 24px;border-radius:12px;border:1px solid #f6b26b;box-shadow:0 8px 28px #0009;opacity:0}
      #clip-legende small{display:block;font-size:17px;font-weight:400;color:#ead7af;margin-top:5px}
      #clip-chapitre{position:fixed;top:14px;left:50%;transform:translateX(-50%);z-index:2147483645;pointer-events:none;background:#f6b26b;color:#030b15;font:800 15px 'Segoe UI',system-ui,sans-serif;padding:7px 18px;border-radius:999px;letter-spacing:.04em;opacity:0}
      #clip-titre{position:fixed;inset:0;z-index:2147483646;pointer-events:none;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;background:radial-gradient(ellipse at 30% 35%,#272044,#0a0619 65%);color:#fff;font-family:'Segoe UI',system-ui,sans-serif;text-align:center;opacity:0;transition:opacity .4s}
      #clip-titre h1{font-size:52px;margin:0;color:#f6b26b}#clip-titre p{font-size:24px;margin:0;max-width:1100px;line-height:1.4}
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
        await this.page.evaluate(b=>{document.getElementById('clip-curseur')!.style.transform=`translate(${b.x+b.width/2-2}px,${b.y+b.height/2-2}px)`;},b);
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
        else { await cible.fill(''); await cible.pressSequentially(texte, { delay: 55 }); }
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
            const w = window as unknown as Fenetre; w.hasardClipStarTrek ??= Math.random;
            const origine = w.hasardClipStarTrek; Math.random = () => file.length ? file.shift()! : origine();
        }, file);
    }
    async rendreLeHasard() { await this.page.evaluate(() => { const w = window as unknown as Fenetre; if (w.hasardClipStarTrek) Math.random = w.hasardClipStarTrek; }); }
}




test('les mécanismes de Star Trek, LCARS et les opérations spatiales, en clip',async()=>{
    test.setTimeout(900_000);expect(fs.existsSync(PILOTE)).toBe(true);fs.mkdirSync(PREUVES,{recursive:true});
    const racineTemp=path.resolve(os.tmpdir()),brut=fs.mkdtempSync(path.join(racineTemp,'gmos-clip-star-trek-'));
    if(!path.resolve(brut).startsWith(racineTemp+path.sep))throw new Error('Profil inattendu.');
    const source=JSON.parse(new AdmZip(PILOTE).readAsText('state.json'));expect(source.gameDriver.version).toBe('2.0.0');
    expect(source.gameDriver.modulesDuJeu.map((m:{id:string})=>m.id)).toEqual(['star-trek-lcars','star-trek-operations']);
    const semence=JSON.parse(fs.readFileSync('e2e/donnees/campagne-de-demo.json','utf8')),s=semence.modules.sessionOS;
    s.campaigns=[{id:CAMPAGNE,name:'Les voix de la station silencieuse',system:source.gameDriver.id,systemPath:'systems/star-trek',activeLocationIds:[]}];
    s.activeCampaignId=CAMPAGNE;s.customGameDrivers=[source.gameDriver];s.customSheetTemplates=[source.sheetTemplate];
    const valeurs=Object.fromEntries(source.sheetTemplate.sections.flatMap((sec:{fields:{id:string;defaultValue?:unknown}[]})=>sec.fields).map((c:{id:string;defaultValue?:unknown})=>[c.id,c.defaultValue??'']));
    const fiche={...valeurs,audace:10,raison:9,maitrise:10,forme:9,intuition:8,presence:8,commandement:2,navigation:2,securite:3,science:4,ingenierie:2,medecine:2,stress:2,determination:2,reputation:3,resistance:1};
    s.players=['Enseigne T’Vael','Capitaine Rin Sol'].map((name,i)=>({id:i?JOUEUR+'-rin':JOUEUR,realName:'Joueur fictif '+(i+1),isOnline:false,characters:[{id:i?PERSO+'-rin':PERSO,name,campaignId:CAMPAGNE,systemId:source.gameDriver.id,templateId:source.sheetTemplate.id,sheetData:{...fiche,nom:name}}]}));
    s.sessions=[{...s.sessions[0],id:'clip-seance-star-trek',campaignId:CAMPAGNE,status:'active',number:1,sessionEntityIds:[PERSO,PERSO+'-rin'],publicSummary:'Démonstration fictive'}];
    const semenceFichier=path.join(brut,'semence.json');fs.writeFileSync(semenceFichier,JSON.stringify(semence));
    const g=await lancerGmOs({semence:semenceFichier,video:{dossier:brut,largeur:LARGEUR,hauteur:HAUTEUR},preparerLeProfil:profil=>{
        for(const d of ['theme','fiche']){const e=path.resolve('docs/systems/star-trek',d);if(fs.existsSync(e))fs.cpSync(e,path.join(profil,'corpus/systems/star-trek',d),{recursive:true});}
    }});
    const f=g.fenetre,r=new Realisation(f),chapitres:{titre:string;secondesDepuisTitre:number}[]=[];f.setDefaultTimeout(15_000);
    let ouverture=0,fin=0,reussi=false;
    const personnage=()=>f.evaluate(()=>(window as unknown as Fenetre).useSessionOSStore.getState().players.find(p=>p.id==='clip-joueur-star-trek')!.characters[0]);
    const reserves=()=>f.evaluate(()=>(window as unknown as Fenetre).useRessourcesDeTableStore.getState().reserves['clip-star-trek']);
    const etat=()=>f.evaluate(()=>window.appBridge!.modulesDuJeu!.lire());
    const operations=async()=>(await etat()).modules.find(m=>m.id==='star-trek-operations')!.vue as VueOperations;
    const lcars=async()=>(await etat()).modules.find(m=>m.id==='star-trek-lcars')!.vue as VueLcarsMJ;
    const commande=async(moduleId:string,commande:CommandeDeModule)=>{const v=await etat();expect(await f.evaluate(({v,moduleId,commande})=>window.appBridge!.modulesDuJeu!.commander({requeteId:crypto.randomUUID(),campagneId:v.campagneId!,moduleId,contexte:v.contexte,commande}),{v,moduleId,commande})).toEqual({ok:true});};
    const chapitre=async(titre:string)=>{chapitres.push({titre,secondesDepuisTitre:(Date.now()-ouverture)/1000});await r.chapitre(titre);};
    const photo=(nom:string)=>f.screenshot({path:path.join(PREUVES,nom+'.jpg'),type:'jpeg',quality:85,scale:'css'});
    const vue=async(v:'players'|'cockpit'|'modules-du-jeu')=>{await f.evaluate(v=>(window as unknown as Fenetre).useSessionOSStore.getState().setCurrentView(v),v);if(v==='players')await ongletDeLaFiche(f,'Lancer un test');};
    const ouvrir=async(nom:string)=>{await vue('modules-du-jeu');const article=f.locator('article').filter({has:f.getByRole('heading',{name:nom,exact:true})});await r.cliquer(article.getByRole('button',{name:'Ouvrir le pupitre',exact:true}));};
    const hub=f.frameLocator('#clip-hub');
    const montrerHub=()=>f.evaluate(()=>{document.getElementById('clip-hub')!.style.display='block';});
    const cacherHub=()=>f.evaluate(()=>{document.getElementById('clip-hub')!.style.display='none';});
    try{
        await attendreLHydratation(g);await expect.poll(()=>f.evaluate(()=>(window as unknown as Fenetre).useSessionOSStore.getState().campaigns.map(c=>c.id))).toContain(CAMPAGNE);
        const fenetre=await g.application.browserWindow(f);await fenetre.evaluate((w,t)=>{w.setFullScreen(false);w.unmaximize();w.setResizable(false);w.setMaximizable(false);w.setContentSize(t.l,t.h);w.webContents.setAudioMuted(true);},{l:LARGEUR,h:HAUTEUR});
        await f.setViewportSize({width:LARGEUR,height:HAUTEUR});await ouvrirLeModule(g,'Tableau de Bord');
        await f.evaluate(()=>{const w=window as unknown as Fenetre,s=w.useSessionOSStore.getState();s.setActiveCampaign('clip-star-trek');s.setSelectedPlayer('clip-joueur-star-trek');s.setSelectedCharacter('clip-tvael');s.setCurrentView('players');w.useRessourcesDeTableStore.setState({reserves:{'clip-star-trek':{impulsion:2,menace:4}}});});
        // Fiction de départ uniquement : les actions montrées après le titre passent par les interfaces.
        await vue('modules-du-jeu');await commande('star-trek-lcars',{id:'importer-preparation',charge:{configuration:exporterConfiguration(creerFiction())}});
        const systemes={communications:9,ordinateurs:9,moteurs:9,detecteurs:9,structure:9,armement:9},fonctions={commandement:2,navigation:2,ingenierie:2,securite:2,medecine:2,science:2};
        for(const [id,nom,camp] of [['clip-uss','U.S.S. Asteria','joueurs'],['clip-drone','Drone de défense','adverse']])await commande('star-trek-operations',{id:'vaisseau',charge:{vaisseau:{id,nom,camp,envergure:4,systemes,fonctions,bonusResistance:0,bonusBoucliers:0,qualiteEquipage:camp==='adverse'?'competent':null,armes:[{id:'phaseurs',nom:'Batteries de phaseurs',type:'energie',degats:5,portee:'moyenne',qualites:[]}]}}});
        await vue('players');await f.evaluate(installerLaScene);await r.carte('');
        const panneau=f.locator('[data-panneau-de-jet]').first(),principal=panneau.locator('select').nth(0),fonction=panneau.locator('select').nth(1),resultat=panneau.getByRole('region',{name:'Résultat',exact:true}),prep=panneau.locator('[data-preparation-star-trek]');
        const jeter=async(des:number[])=>{await r.des(des.map(n=>(n-.5)/20));await r.cliquer(panneau.getByRole('button',{name:'Lancer',exact:true}));await r.rendreLeHasard();};
        ouverture=Date.now();await r.titre('Star Trek · la station silencieuse',['2d20, ressources et décisions de l’équipage','Tâches · Détermination · Stress · LCARS · Bataille spatiale · Tâches étendues','Équipage fictif, profil jetable — dés préparés, légendes françaises sans voix.']);

        await chapitre('1 · Deux d20, spécialisation et paiement en Menace');await r.choisir(principal,'raison');await r.choisir(fonction,'science');await r.taper(panneau.getByLabel('Difficulté',{exact:true}),'2');await r.cocher(panneau.getByLabel(/^Spécialisation/));
        const lancer=panneau.getByRole('region',{name:'Lancer les dés',exact:true});await r.cliquer(lancer.locator('button').nth(1));await r.cliquer(panneau.getByRole('button',{name:'Un point de plus en Menace',exact:true}));
        await r.legende('Raison 9 + Science 4 : seuil 13 ; avec spécialisation, 1 à 4 compte double.','Le troisième d20 coûte 1, choisi ici en Menace malgré les deux Impulsions disponibles.',3300);await jeter([3,8,20]);await expect.poll(async()=>(await reserves()).menace).toBe(5);await expect.poll(async()=>(await reserves()).impulsion).toBe(3);
        await r.montrer(resultat,3000);await photo('01-jet');await r.legende('Trois réussites contre difficulté 2 : une Impulsion excédentaire.','Le 20 provoque une complication ; la repousser ajoute 2 Menace, sans annuler le résultat.',3300);await r.cliquer(panneau.getByRole('button',{name:'Repousser une complication (+2 Menace)',exact:true}));await expect.poll(async()=>(await reserves()).menace).toBe(7);await photo('02-complication');

        await chapitre('2 · Assistance, aide du vaisseau et Détermination');await r.cliquer(lancer.locator('button').nth(0));await r.cocher(panneau.getByLabel(/^Spécialisation/),false);
        await r.taper(prep.getByLabel('Nom de l’assistant'),'Lt Varga');await r.taper(prep.getByLabel('Seuil de l’assistant'),'13');await r.cliquer(prep.getByRole('button',{name:'Ajouter',exact:true}));await r.cocher(prep.getByLabel('Aide du vaisseau',{exact:true}));
        await r.cocher(prep.getByLabel(/Un idéal ou une directive/));await r.cocher(prep.getByLabel(/Occasion parfaite/));await r.legende('L’assistant et le vaisseau apportent chacun leur d20.','Leurs réussites comptent si le principal réussit. Un idéal aligné autorise l’Occasion parfaite : un dé vaut 1.',3300);await r.montrer(prep,2800);await photo('03-preparation');await jeter([8,8,8,8]);await expect.poll(async()=>(await personnage()).sheetData.determination).toBe(1);await r.montrer(resultat,3000);await photo('04-assistance');

        await chapitre('3 · Éviter une blessure, Stress et soins');await r.carte('stress-star-trek');const stress=f.locator('[data-stress-star-trek]');await r.taper(stress.getByLabel('Stress ou gravité'),'3');await r.cliquer(stress.getByRole('button',{name:'Éviter une blessure de cette gravité',exact:true}));await expect.poll(async()=>(await personnage()).sheetData.stress).toBe(5);
        await r.legende('Éviter une blessure de gravité 3 fait passer le Stress de 2 à 5.','Un Répit efface quatre points. Plein, le Stress rend épuisé et bloque un attribut choisi.',3300);await r.montrer(stress,2800);await photo('05-stress');await r.cliquer(stress.getByRole('button',{name:'Répit (−4)',exact:true}));await expect.poll(async()=>(await personnage()).sheetData.stress).toBe(1);
        await r.taper(stress.getByLabel('Nom de la blessure'),'Brûlure de plasma');await r.taper(stress.getByLabel('Gravité de la blessure'),'3');await r.cliquer(stress.getByRole('button',{name:'Encaisser la blessure',exact:true}));await expect(stress).toContainText('vaincu');await r.legende('La Protection 1 réduit la blessure de 3 à 2 ; le personnage est vaincu.','Après un jet de premiers secours réussi, le meneur confirme le soin. LCARS ne le calcule pas à sa place.',3300);await r.montrer(stress,2800);await photo('06-blessure');await r.cliquer(stress.getByRole('button',{name:'Premiers secours réussis',exact:true}));

        await chapitre('4 · La Réputation après la mission');await r.carte('reputation-star-trek');const reputation=f.locator('[data-reputation-star-trek]');await r.cocher(reputation.getByLabel('La mission a-t-elle été couronnée de succès ?'));await r.cocher(reputation.getByLabel('Avez-vous obéi aux ordres de vos supérieurs ?'));await r.cocher(reputation.getByLabel('Avez-vous recouru à la force létale ?'));await r.des([.075,.075]);await r.cliquer(reputation.getByRole('button',{name:/^Jet de Réputation/}));await r.rendreLeHasard();
        await expect(reputation.locator('[data-issue-reputation]')).toContainText('3 points de Gloire');await r.legende('Deux influences positives donnent 2d20 ; une négative fixe la difficulté à 1.','Sous la Réputation 3, chaque dé compte double : quatre réussites et trois points de Gloire à dépenser aussitôt.',3300);await r.montrer(reputation,3000);await photo('07-reputation');

        await chapitre('5 · LCARS : postes, intervention et réponse privée');await ouvrir('LCARS — Passerelle');const nav=f.getByRole('navigation',{name:'Panneaux du pupitre'});await r.cliquer(nav.getByRole('button',{name:'Passerelle',exact:true}));await r.choisir(f.getByLabel('Personnage à préparer',{exact:true}),{label:'Enseigne T’Vael'});await r.cliquer(f.getByRole('button',{name:'Préparer ce personnage',exact:true}));await r.cocher(f.getByLabel('Science pour Enseigne T’Vael',{exact:true}));await r.cocher(f.getByLabel('Médecine pour Enseigne T’Vael',{exact:true}));
        await r.cocher(f.locator('article').filter({has:f.getByRole('heading',{name:'LCARS — Passerelle',exact:true})}).getByRole('group',{name:'Accès des personnages',exact:true}).getByRole('checkbox',{name:'Enseigne T’Vael',exact:true}));await r.legende('Préparer les consoles et ouvrir l’accès sont deux décisions distinctes.','T’Vael reçoit Science et Médecine. Les autres postes restent disponibles pour les officiers affectés.',3300);await r.montrer(f.locator('.lcars-prototype'),2300);await photo('08-affectation');
        // Vrai client HTTP/WebSocket Hub dans une iframe de tournage ; aucune appBridge dans ce client.
        await f.evaluate(port=>{const e=document.createElement('iframe');e.id='clip-hub';e.title='Hub de démonstration';e.src=`http://127.0.0.1:${port}/?window=tablet&sync=${port}`;Object.assign(e.style,{position:'fixed',inset:'0',width:'100vw',height:'100vh',border:'0',zIndex:'1000000',background:'#050817'});document.body.appendChild(e);},g.ports.sync);
        await r.cliquer(hub.getByRole('button',{name:/Enseigne T’Vael/}));await expect(hub.getByText('Connecté',{exact:true})).toBeVisible();await expect.poll(()=>hub.locator('body').evaluate(()=>!!window.appBridge)).toBe(false);
        await r.cliquer(hub.getByRole('navigation',{name:'Navigation Hub'}).getByRole('button',{name:'Modules du jeu',exact:true}));await r.cliquer(hub.getByRole('button',{name:'Ouvrir LCARS — Passerelle',exact:true}));await expect(hub.getByRole('navigation',{name:'Consoles attribuées'}).getByRole('button')).toHaveCount(2);
        await r.legende('Sur le Hub, seules les consoles attribuées sont proposées.','Le scan est une intervention transmise au meneur ; aucun jet ou dégât n’est décidé par LCARS.',3300);await r.taper(hub.getByLabel('Détails de l’intervention',{exact:true}),'Scanner la balise et rechercher des signes de vie.');await r.montrer(hub.locator('.lcars-console'),2600);await photo('09-science');await r.cliquer(hub.getByRole('button',{name:'Transmettre l’intervention',exact:true}));await expect.poll(async()=>(await lcars()).demandes.length).toBe(1);
        await cacherHub();await r.cliquer(nav.getByRole('button',{name:/^Demandes/}));await r.taper(f.getByLabel('Rapport destiné à l’officier',{exact:true}),'Balise de détresse identifiée. Deux signes de vie dans la capsule.');await r.cliquer(f.getByRole('button',{name:'Transmettre le rapport privé',exact:true}));await montrerHub();await expect(hub.getByRole('log',{name:'Mes interventions'})).toContainText('Deux signes de vie');await r.legende('Le meneur répond en privé à l’officier.','Le rapport rejoint l’intervention ; sa diffusion à l’équipage reste un choix explicite.',3300);await r.montrer(hub.getByRole('log',{name:'Mes interventions'}),2800);await photo('10-rapport');await cacherHub();

        await chapitre('6 · Bataille spatiale : Boucliers, secousse et brèche');await ouvrir('Bataille spatiale et tâches étendues');const ops=f.locator('[data-pupitre-operations]');await r.legende('Le module tient les systèmes, fonctions, armes et Boucliers des vaisseaux.','Le jet d’attaque se lance au panneau ; on applique ici une attaque dont la réussite a été confirmée à la table.',3300);await r.montrer(ops.locator('[data-vaisseau="clip-uss"]'),2600);await photo('11-vaisseau');
        const attaque=ops.locator('[data-attaque-spatiale]');await r.choisir(attaque.getByLabel(/^Attaquant/),'clip-uss');await r.choisir(attaque.getByLabel(/^Arme/),'phaseurs');await r.choisir(attaque.getByLabel(/^Cible/),'clip-drone');await r.taper(attaque.getByLabel('Dégâts de l’attaque',{exact:true}),'16');await r.choisir(attaque.getByLabel(/^Système touché/),'structure');await r.cliquer(attaque.getByRole('button',{name:'Appliquer les dégâts',exact:true}));
        await expect.poll(async()=>((await operations()).vaisseaux.find(v=>v.id==='clip-drone') as VaisseauVu).boucliers).toBe(3);await r.legende('16 dégâts − Résistance 4 : les Boucliers passent de 15 à 3.','Sous la moitié : secousse. Sous le quart dans le même coup : une brèche. Le système touché est ici la Structure.',3300);await r.montrer(ops.locator('[data-vaisseau="clip-drone"] [data-boucliers]'),3000);await photo('12-breche');await r.montrer(ops.locator('[data-vaisseau="clip-drone"] [data-breches]'),2800);

        await chapitre('7 · Tâches étendues et défis chronométrés');const nouvelle=ops.locator('details').filter({hasText:'NOUVELLE TÂCHE ÉTENDUE'});await r.cliquer(nouvelle.locator('summary'));await r.taper(nouvelle.getByLabel('Nom',{exact:true}),'Rétablir la liaison');await r.taper(nouvelle.getByLabel('Jauge d’effort',{exact:true}),'6');await r.taper(nouvelle.getByLabel('Obstacle',{exact:true}),'1');await r.cliquer(nouvelle.getByRole('button',{name:'Créer',exact:true}));const tache=ops.locator('[data-tache-etendue]');await r.taper(tache.getByLabel('Fonction',{exact:true}),'4');await r.cliquer(tache.getByRole('button',{name:'Tâche réussie : cocher l’impact',exact:true}));await expect.poll(async()=>(await operations()).taches[0].coches).toBe(3);
        await r.legende('Une tâche réussie coche la Fonction moins l’obstacle, au moins un.','Ici, Science 4 et obstacle 1 donnent trois coches sur six : la première avancée est atteinte.',3300);await r.montrer(tache,2800);await photo('13-tache');
        const defiForm=ops.locator('details').filter({hasText:'NOUVEAU DÉFI'});await r.cliquer(defiForm.locator('summary'));await r.taper(defiForm.getByLabel('Nom',{exact:true}),'Extraire la capsule');await r.taper(defiForm.getByLabel('Tâches clés, une par ligne'),'Verrouiller le téléporteur\nRécupérer les survivants');await r.taper(defiForm.getByLabel(/Intervalles \(vide/),'6');await r.cliquer(defiForm.getByRole('button',{name:'Créer',exact:true}));const defi=ops.locator('[data-defi]');await r.cocher(defi.getByLabel('Verrouiller le téléporteur',{exact:true}));await r.cliquer(defi.getByRole('button',{name:'Une tâche : −2',exact:true}));await expect.poll(async()=>(await operations()).defis[0].intervalles!.restants).toBe(4);await r.legende('Un défi réunit plusieurs tâches clés et un budget d’intervalles.','La première tâche est cochée ; elle consomme deux intervalles, de six à quatre. Écourter une tâche coûte deux Impulsions.',3300);await r.montrer(defi,2800);await photo('14-defi');

        await chapitre('8 · Alerte de passerelle et retour à la mission');await ouvrir('LCARS — Passerelle');await r.cliquer(f.getByRole('navigation',{name:'Panneaux du pupitre'}).getByRole('button',{name:'Passerelle',exact:true}));await r.choisir(f.getByLabel('Niveau d’alerte',{exact:true}),'rouge');await r.taper(f.getByLabel('Consigne d’alerte',{exact:true}),'Téléportation d’urgence : accueillir les survivants.');await r.cliquer(f.getByRole('button',{name:'Publier l’alerte',exact:true}));await montrerHub();await expect(hub.locator('.lcars-prototype')).toHaveClass(/lcars-alerte-rouge/);await r.legende('L’alerte publiée est reçue par la passerelle du joueur.','Le son reste volontaire et attribué à un appareil. Ce clip reste muet ; le meneur résout les conséquences.',3300);await r.montrer(hub.locator('.lcars-entete'),2600);await photo('15-alerte');await cacherHub();
        await r.titre('Explorer, coopérer, décider',['Le panneau résout les tâches ; LCARS relie les postes ; les opérations suivent le vaisseau.',
            'Jets, blessures et arbitrages restent distingués des interventions de passerelle.',
            'Star Trek Adventures 2e · pilote 2.0.0 · LCARS et Opérations · fiction de démonstration'],6500);reussi=true;fin=Date.now();
    }catch(erreur){await f.screenshot({path:path.join(PREUVES,'diagnostic-echec.jpg'),type:'jpeg'});throw erreur;}
    finally{const video=f.video();await g.fermer();const fichierVideo=await video?.path();if(reussi&&fichierVideo){
        const exportVideo=JSON.parse(execFileSync(process.execPath,['outils/clips/exporter_clip.mjs',fichierVideo,SORTIE,'star-trek-mecanismes-et-modules',String((fin-ouverture)/1000)],{encoding:'utf8'}));
        fs.writeFileSync(path.join(PREUVES,'verification.json'),JSON.stringify({version:source.gameDriver.version,modules:['star-trek-lcars','star-trek-operations'],profilJetable:true,donneesPersonnelles:false,desPrepares:true,narrationSonore:false,modeRapide:!!process.env.GMOS_CLIP_RAPIDE,dureeDepuisTitre:(fin-ouverture)/1000,chapitres,exportVideo,
            assertions:['2d20 et spécialisation, troisième dé choisi en Menace','Menace4 → 5 puis7, Impulsion2 → 3','assistant et aide native du vaisseau','Occasion parfaite : Détermination2 → 1','blessure évitée : Stress2 → 5 ; Répit → 1','Protection et blessure ; premiers secours confirmés','Réputation : trois points de Gloire','deux consoles attribuées et accès ouvert','vrai client Hub sans appBridge dans iframe de tournage','intervention science reçue dans état natif LCARS','réponse privée reçue dans le client','dégâts spatiaux : Boucliers15 → 3','tâche étendue3/6','défi6 → 4 intervalles','alerte rouge reçue au Hub']},null,2));}
        if(path.resolve(brut).startsWith(racineTemp+path.sep))fs.rmSync(brut,{recursive:true,force:true});else console.error('Nettoyage temporaire refusé.');}
});
