import { test, expect, type Locator, type Page } from '@playwright/test';
import AdmZip from 'adm-zip';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { lancerGmOs, attendreLHydratation, ouvrirLeModule, ongletDeLaFiche } from './lancerGmOs';
import type { useSessionOSStore } from '../src/modules/session/useSessionOSStore';
import type { useRessourcesDeTableStore } from '../src/modules/table/useRessourcesDeTableStore';
import type { ConflitDune } from '../src/modules/dice/systemes/conflitsDeDune';

/** David, 06/11/2026 : filmer les mécanismes particuliers de Dune avec Playwright.
 * Instance jetable, personnage et effets fictifs, vrais gestes, dés préparés.
 * npm run build puis npx playwright test e2e/clipDune.spec.ts --reporter=list
 */
const PILOTE = path.resolve(process.env.GMOS_PILOTE_DUNE ?? 'output/campagnes-tests/dune/Dune-2.0.0.gmos-driver');
const SORTIE = path.resolve(process.env.GMOS_SORTIE_CLIP ?? 'output/clips');
const PREUVES = path.join(SORTIE, 'dune');
const CAMPAGNE = 'clip-dune', JOUEUR = 'clip-joueur-dune', PERSO = 'clip-lysa';
const LARGEUR = 1440, HAUTEUR = 900;
type Fenetre = Window & { useSessionOSStore: typeof useSessionOSStore; useRessourcesDeTableStore: typeof useRessourcesDeTableStore; hasardClipDune?: () => number };

/** Curseur, surlignage et légendes comme le clip RuneQuest ; palette sable et or. */
function installerLaScene() {
    const style = document.createElement('style');
    style.textContent = `
      #clip-curseur{position:fixed;left:0;top:0;z-index:2147483647;pointer-events:none;transform:translate(-100px,-100px);filter:drop-shadow(0 2px 3px #000)}
      #clip-curseur.clic::after{content:'';position:absolute;left:-14px;top:-14px;width:28px;height:28px;border:3px solid #e5bc74;border-radius:50%;animation:clip-onde .5s ease-out forwards}
      @keyframes clip-onde{from{transform:scale(.3);opacity:1}to{transform:scale(1.6);opacity:0}}
      #clip-anneau{position:fixed;z-index:2147483646;pointer-events:none;border:3px solid #e5bc74;border-radius:8px;box-shadow:0 0 18px #e5bc7466;opacity:0}
      #clip-legende{position:fixed;left:50%;bottom:20px;transform:translateX(-50%);max-width:1160px;width:max-content;z-index:2147483645;pointer-events:none;background:#050b19f2;color:white;font:600 22px/1.35 'Segoe UI',system-ui,sans-serif;padding:14px 24px;border-radius:12px;border:1px solid #e5bc74;box-shadow:0 8px 28px #0009;opacity:0}
      #clip-legende small{display:block;font-size:17px;font-weight:400;color:#ead7af;margin-top:5px}
      #clip-chapitre{position:fixed;top:14px;left:50%;transform:translateX(-50%);z-index:2147483645;pointer-events:none;background:#e5bc74;color:#030b15;font:800 15px 'Segoe UI',system-ui,sans-serif;padding:7px 18px;border-radius:999px;letter-spacing:.04em;opacity:0}
      #clip-titre{position:fixed;inset:0;z-index:2147483646;pointer-events:none;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;background:radial-gradient(ellipse at 30% 35%,#433019,#0a0619 65%);color:#fff;font-family:'Segoe UI',system-ui,sans-serif;text-align:center;opacity:0;transition:opacity .4s}
      #clip-titre h1{font-size:52px;margin:0;color:#e5bc74}#clip-titre p{font-size:24px;margin:0;max-width:1100px;line-height:1.4}
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
            const w = window as unknown as Fenetre; w.hasardClipDune ??= Math.random;
            const origine = w.hasardClipDune; Math.random = () => file.length ? file.shift()! : origine();
        }, file);
    }
    async rendreLeHasard() { await this.page.evaluate(() => { const w = window as unknown as Fenetre; if (w.hasardClipDune) Math.random = w.hasardClipDune; }); }
}




test('les mécanismes de Dune et le module Conflits et Maison, en clip',async()=>{
    test.setTimeout(900_000);expect(fs.existsSync(PILOTE)).toBe(true);fs.mkdirSync(PREUVES,{recursive:true});
    const racineTemp=path.resolve(os.tmpdir()),brut=fs.mkdtempSync(path.join(racineTemp,'gmos-clip-dune-'));
    if(!path.resolve(brut).startsWith(racineTemp+path.sep))throw new Error('Profil inattendu.');
    const source=JSON.parse(new AdmZip(PILOTE).readAsText('state.json'));
    const recette=JSON.parse(fs.readFileSync('output/campagnes-tests/dune/01-Le-Sceau-de-Nereide.json','utf8'));
    const semence=JSON.parse(fs.readFileSync('e2e/donnees/campagne-de-demo.json','utf8')),s=semence.modules.sessionOS;
    s.campaigns=[{id:CAMPAGNE,name:'Le traité des dunes',system:source.gameDriver.id,activeLocationIds:[],groupe:recette.campaign.groupe}];
    s.activeCampaignId=CAMPAGNE;s.customGameDrivers=[source.gameDriver];s.customSheetTemplates=[source.sheetTemplate];
    const valeurs=Object.fromEntries(source.sheetTemplate.sections.flatMap((sec:{fields:{id:string;defaultValue?:unknown}[]})=>sec.fields).map((c:{id:string;defaultValue?:unknown})=>[c.id,c.defaultValue??'']));
    const suivi=structuredClone(recette.players[0].characters[0].sheetData._gmos_dune);
    Object.assign(suivi,{aventure:'Le traité des dunes',scene:'Audience de la Maison',maximes:{devotion:'Je protège la parole de ma Maison.',justice:'Une preuve vaut mieux qu’une accusation.'},bafoues:[],recuperes:[],progression:[],atouts:[]});
    const fiche={...valeurs,analyse:6,combat:6,discipline:6,mob:5,rhetoric:5,devotion:7,domination:5,faith:5,justice:7,truth:6,
        determination:2,progression:12,char_name:'Lysa Vaëlan',house_name:'Maison Vaëlan',specializations:'Combat : Escrime',personal_traits:'Négociatrice de la Maison'};
    s.players=['Lysa Vaëlan','Mara Senn','Ilan Rovan'].map((name,i)=>({id:i?JOUEUR+'-'+i:JOUEUR,realName:'Joueur fictif '+(i+1),isOnline:false,characters:[{id:i?PERSO+'-'+i:PERSO,name,campaignId:CAMPAGNE,systemId:source.gameDriver.id,templateId:source.sheetTemplate.id,hp:0,maxHp:0,sheetData:{...fiche,char_name:name}}]}));
    s.sessions=[{...s.sessions[0],id:'clip-seance-dune',campaignId:CAMPAGNE,status:'active',number:1,sessionEntityIds:s.players.map((p:{characters:{id:string}[]})=>p.characters[0].id),publicSummary:'Audience fictive'}];
    const semenceFichier=path.join(brut,'semence.json');fs.writeFileSync(semenceFichier,JSON.stringify(semence));
    const g=await lancerGmOs({semence:semenceFichier,video:{dossier:brut,largeur:LARGEUR,hauteur:HAUTEUR},preparerLeProfil:profil=>{
        fs.mkdirSync(path.join(profil,'corpus/fiches'),{recursive:true});fs.copyFileSync('docs/fiches/Character_Sheet_Manager.html',path.join(profil,'corpus/fiches/Character_Sheet_Manager.html'));
        for(const d of ['theme','fiche']){const e=path.resolve('docs/systems/dune',d);if(fs.existsSync(e))fs.cpSync(e,path.join(profil,'corpus/systems/dune',d),{recursive:true});}
    }});
    const f=g.fenetre,r=new Realisation(f),chapitres:{titre:string;secondesDepuisTitre:number}[]=[];f.setDefaultTimeout(15_000);
    let ouverture=0,fin=0,reussi=false;
    const personnage=()=>f.evaluate(()=>(window as unknown as Fenetre).useSessionOSStore.getState().players.find(p=>p.id==='clip-joueur-dune')!.characters[0]);
    const reserves=()=>f.evaluate(()=>(window as unknown as Fenetre).useRessourcesDeTableStore.getState().reserves['clip-dune']);
    const module=()=>f.evaluate(async()=>{const v=await window.appBridge!.modulesDuJeu!.lire();return v.sauvegarde!.campagnes['clip-dune']['dune-conflits'].donnees as ConflitDune;});
    const commande=async(id:string,charge:unknown)=>{expect(await f.evaluate(async({id,charge})=>{const v=await window.appBridge!.modulesDuJeu!.lire();return window.appBridge!.modulesDuJeu!.commander({requeteId:crypto.randomUUID(),campagneId:'clip-dune',moduleId:'dune-conflits',contexte:v.contexte,commande:{id,charge}});},{id,charge})).toEqual({ok:true});};
    const chapitre=async(titre:string)=>{chapitres.push({titre,secondesDepuisTitre:(Date.now()-ouverture)/1000});await r.chapitre(titre);};
    const photo=(nom:string)=>f.screenshot({path:path.join(PREUVES,nom+'.jpg'),type:'jpeg',quality:85});
    const vue=async(v:'players'|'modules-du-jeu'|'group-sheet')=>{await f.evaluate(v=>(window as unknown as Fenetre).useSessionOSStore.getState().setCurrentView(v),v);if(v==='players')await ongletDeLaFiche(f,'Lancer un test');};
    const ouvrirModule=async()=>{await vue('modules-du-jeu');if(!await f.locator('[data-plateau-dune]').isVisible())await r.cliquer(f.getByRole('button',{name:'Ouvrir le pupitre',exact:true}));await expect(f.locator('[data-plateau-dune]')).toBeVisible();};
    try{
        await attendreLHydratation(g);await expect.poll(()=>f.evaluate(()=>(window as unknown as Fenetre).useSessionOSStore.getState().campaigns.map(c=>c.id)),{timeout:20_000}).toContain(CAMPAGNE);
        // Métadonnées du seul personnage fictif, après validation de la semence scalaire.
        await f.evaluate(suivi=>{const s=(window as unknown as Fenetre).useSessionOSStore.getState();for(const j of s.players){const c=j.characters[0];s.updateCharacter(j.id,c.id,{sheetData:{...c.sheetData,_gmos_dune:suivi}});}},suivi);
        const fenetre=await g.application.browserWindow(f);await fenetre.evaluate((w,t)=>{w.unmaximize();w.setContentSize(t.l,t.h);w.webContents.setAudioMuted(true);},{l:LARGEUR,h:HAUTEUR});
        await ouvrirLeModule(g,'Tableau de Bord');
        await f.evaluate(()=>{const w=window as unknown as Fenetre,s=w.useSessionOSStore.getState();s.setActiveCampaign('clip-dune');s.setSelectedPlayer('clip-joueur-dune');s.setSelectedCharacter('clip-lysa');s.setCurrentView('players');w.useRessourcesDeTableStore.setState({reserves:{'clip-dune':{impulsion:2,menace:3}}});});
        await vue('modules-du-jeu');
        await expect.poll(()=>f.evaluate(async()=>(await window.appBridge!.modulesDuJeu!.lire()).campagneId)).toBe(CAMPAGNE);
        await commande('cadre',{arene:'intrigue',mode:'architecte'});await commande('scene',{nom:'Audience de la Maison'});
        for(const z of [{id:'archives',nom:'Les archives',traits:'Registres de concession',visible:true},{id:'nalia',nom:'Nalia, négociatrice',traits:'Mandat de négociation',visible:true,disposition:'Réservée',desir:'Faire payer les ouvriers avant de signer.',discipline:6},{id:'commission',nom:'La commission',traits:'Audience publique',visible:true},{id:'cache',nom:'Réserve secrète du MJ',traits:'Comptes privés fictifs',visible:false}])await commande('zone',z);
        await commande('lier',{zoneId:'archives',autreId:'nalia'});await commande('lier',{zoneId:'nalia',autreId:'commission'});
        for(const a of [{id:'registre',nom:'Copie du registre',proprietaire:'Lysa Vaëlan',qualite:1,tangible:true,permanent:true},{id:'rumeur',nom:'Rumeur favorable',proprietaire:'Maison Vaëlan',qualite:0,tangible:false,permanent:false}])await commande('atout',{...a,visible:true,zone:'archives',usage:'offensif'});
        // Le profil jetable a sa propre bibliothèque de fiches : y créer la Maison
        // depuis les données fictives, avant le film, sans reprendre de fiche de David.
        await vue('group-sheet');const creerMaison=f.getByRole('button',{name:/Créer une fiche pour Maison Vaëlan/i});
        await expect(creerMaison).toBeVisible({timeout:30_000});await creerMaison.click();
        await expect(f.frameLocator('iframe:visible').locator('[data-key="house.name"]')).toHaveValue('Maison Vaëlan',{timeout:30_000});
        await vue('players');await f.evaluate(installerLaScene);await r.carte('');
        const panneau=f.locator('[data-panneau-de-jet]').first(),principal=panneau.locator('select').nth(0),principe=panneau.locator('select').nth(1),resultat=panneau.getByRole('region',{name:'Résultat',exact:true});
        const carnet=panneau.locator('[data-carnet-dune]'),suites=panneau.locator('[data-suites-dune]');
        const jeter=async(faces:number[])=>{await r.des(faces.map(n=>(n-.5)/20));await r.cliquer(panneau.getByRole('button',{name:'Lancer',exact:true}));await r.rendreLeHasard();await r.montrer(resultat,1000);};
        const clore=()=>r.cliquer(panneau.getByRole('button',{name:'Terminer le test et conserver le reliquat',exact:true}));
        ouverture=Date.now();await r.titre('Dune · du test aux conflits de Maison',['Les mécanismes du pilote et le module Conflits et Maison','2d20 · Impulsion · Détermination · Maximes · Zones · Atouts · Intrigue','Fiction originale, profil jetable — vrais gestes et dés préparés.']);

        await chapitre('1 · Compétence, Principe et dés achetés');await r.choisir(principal,'combat');await r.choisir(principe,'devotion');
        await r.taper(panneau.getByLabel('Difficulté',{exact:true}),'2');
        await r.legende('Combat 6 + Devoir 7 : chaque d20 réussit à 13 ou moins.','La spécialisation pertinente fait compter double les résultats de 1 à 6.',3000);
        await r.cocher(panneau.getByLabel('Spécialisation pertinente',{exact:true}));
        const lancerEtape=panneau.getByRole('region',{name:'Lancer les dés',exact:true});
        await r.cliquer(lancerEtape.locator('button').nth(1));await r.cliquer(panneau.getByRole('button',{name:'Un point de plus en Menace',exact:true}));
        await r.taper(panneau.getByLabel('Assistant Dune',{exact:true}),'Nasir');await r.cliquer(panneau.getByRole('button',{name:'Ajouter l’assistant',exact:true}));
        await r.taper(panneau.getByLabel('Impulsion bonus',{exact:true}),'2');
        await r.legende('Le troisième dé coûte un point, choisi ici en Menace.','L’assistant lance son propre dé ; ses réussites exigent au moins une réussite du principal.',3000);
        await jeter([5,20,10,7]);await expect.poll(async()=>(await reserves()).menace).toBe(4);await expect.poll(async()=>(await reserves()).impulsion).toBe(2);
        await expect(suites).toContainText('2 normale');await expect(suites).toContainText('2 bonus');
        await r.legende('Quatre réussites contre difficulté 2 : deux Impulsions normales.','Le 20 est une complication. Deux Impulsions bonus restent séparées du reliquat conservable.',3300);await photo('01-jet');

        await chapitre('2 · Dépenser l’Impulsion avant de la conserver');
        await r.cliquer(suites.getByRole('button',{name:'Racheter une complication (+2 Menace)',exact:true}));await expect.poll(async()=>(await reserves()).menace).toBe(6);
        await r.taper(suites.getByLabel('Effet de l’Impulsion'),'Quel registre prouve la livraison ?');await r.cliquer(suites.getByRole('button',{name:'Obtenir une information (1)',exact:true}));
        await r.taper(suites.getByLabel('Effet de l’Impulsion'),'Mandat reconnu');await r.cliquer(suites.getByRole('button',{name:'Créer / modifier / retirer un trait (2)',exact:true}));
        await expect.poll(async()=>(await personnage()).sheetData.personal_traits).toContain('Mandat reconnu');
        await r.legende('Une information coûte 1 ; un trait coûte 2. Le MJ valide leur effet.','Le bonus est dépensé en premier. Il reste une Impulsion normale à conserver.',3300);await r.montrer(suites,3000);await photo('02-impulsion');
        await clore();await expect.poll(async()=>(await reserves()).impulsion).toBe(3);

        await chapitre('3 · Détermination, maxime et principe bafoué');
        await r.carte('carnet-dune');
        await r.cliquer(lancerEtape.locator('button').nth(0));await r.cliquer(panneau.getByRole('button',{name:'Retirer l’assistant 1',exact:true}));await r.taper(panneau.getByLabel('Impulsion bonus'),'0');await r.cocher(panneau.getByLabel(/^Spécialisation pertinente/),false);
        const principes=carnet.locator('details').filter({hasText:'Principes, maximes et Détermination'});
        await r.cliquer(principes.locator('summary'));await r.cocher(panneau.getByLabel('Maxime pertinente, validée à la table',{exact:true}));await r.cocher(panneau.getByLabel('Un dé vaut 1 (1 Détermination, dans la réserve)',{exact:true}));
        await r.legende('Une maxime pertinente autorise la Détermination.','Un point remplace un dé de la réserve par un 1, sans ajouter de dé.',3000);await jeter([20,10]);await expect.poll(async()=>(await personnage()).sheetData.determination).toBe(1);await photo('03-determination');await clore();
        await r.choisir(panneau.getByLabel('Choix du principe'),'bafouer');
        await r.legende('Une maxime contredit l’action : le MJ peut offrir un point.','Bafouer permet le test, mais rend le principe indisponible à la clôture.',3100);await jeter([8,10]);await clore();
        await expect.poll(async()=>((await personnage()).sheetData._gmos_dune as {bafoues:string[]}).bafoues).toContain('devotion');await r.montrer(principes,2800);await photo('04-principe');
        const progression=carnet.locator('details').filter({hasText:'Aventure, scène et progression'});await r.cliquer(progression.locator('summary'));
        await r.taper(progression.getByLabel('Nom de la scène Dune'),'Après l’audience');await r.cliquer(progression.getByRole('button',{name:'Nouvelle scène du personnage',exact:true}));
        await r.taper(principes.getByLabel('Nouvelle maxime',{exact:true}),'Ma parole protège ceux qui dépendent de moi.');await r.cocher(principes.getByLabel('Scène d’introspection achevée, accord du MJ'));
        await r.cliquer(principes.getByRole('button',{name:'Récupérer ce principe',exact:true}));
        await expect.poll(async()=>((await personnage()).sheetData._gmos_dune as {bafoues:string[]}).bafoues).toEqual([]);
        await r.legende('Une scène d’introspection et une nouvelle maxime permettent de récupérer.','L’accord du meneur est explicite ; le principe récupéré ne peut plus être bafoué dans cette aventure.',3200);

        await chapitre('4 · Progression : gain validé et acquisition');
        await r.choisir(progression.getByLabel('Motif du gain de progression'),'Ambition : contribution majeure');await r.cliquer(progression.getByRole('button',{name:'Valider le gain de progression',exact:true}));
        await expect.poll(async()=>(await personnage()).sheetData.progression).toBe(15);
        await r.choisir(progression.getByLabel('Genre de progression Dune'),'competence');await r.choisir(progression.getByLabel('Objet de la progression Dune'),'combat');
        await r.legende('Le meneur valide les gains ; la progression garde son historique.','Combat 6 → 7 : dix points pour cette première acquisition, entre deux aventures.',3200);
        await r.cliquer(progression.getByRole('button',{name:'Acquérir entre deux aventures',exact:true}));await expect.poll(async()=>(await personnage()).sheetData.combat).toBe(7);await expect.poll(async()=>(await personnage()).sheetData.progression).toBe(5);
        await r.montrer(progression,3200);await photo('05-progression');

        await chapitre('5 · Le module du jeu et la Maison');await ouvrirModule();
        const plateau=f.locator('[data-plateau-dune]');await expect(plateau).toContainText('Maison Vaëlan');
        await r.legende('Le meneur ouvre les accès aux personnages pendant la séance.','Un seul module : Dune : conflits et Maison. Son pupitre prépare le plateau partagé.',3200);
        for(const nom of ['Lysa Vaëlan','Mara Senn','Ilan Rovan']){const acces=f.getByRole('checkbox',{name:nom,exact:true});await r.cliquer(acces);await expect(acces).toBeChecked();}
        await expect.poll(()=>f.evaluate(async()=>(await window.appBridge!.modulesDuJeu!.lire()).modules.find(m=>m.id==='dune-conflits')!.acces.length)).toBe(3);
        const maison=f.locator('details').filter({has:f.locator('summary',{hasText:'Maison et début de séance'})});await r.cliquer(maison.locator('summary'));
        await r.legende('Cockpit → Modules du jeu → Dune : conflits et Maison.','La fiche de Maison fait foi ; le pupitre en reprend le nom, le monde et les domaines.',3300);await r.montrer(maison.locator('[data-maison-de-la-fiche]'),2500);
        await r.taper(maison.getByLabel('Joueurs présents',{exact:true}),'3');await r.cliquer(maison.getByRole('button',{name:'Début de séance : fixer la Menace à 3',exact:true}));await expect.poll(async()=>(await reserves()).menace).toBe(3);
        await r.legende('Maison mineure : une Menace par joueur présent, soit trois.','La réserve est remplacée après le clic ; ouvrir le pupitre ne la remet pas à zéro.',3100);await r.montrer(maison,3000);await photo('06-maison');
        await r.cliquer(maison.getByRole('button',{name:'Ouvrir la fiche de la Maison',exact:true}));
        await expect(f.frameLocator('iframe:visible').locator('[data-key="house.name"]')).toHaveValue('Maison Vaëlan',{timeout:30_000});
        await r.legende('La fiche HTML conserve l’identité de la Maison, commune à la table.','Le module en reprend les rubriques ; les alliés et atouts du conflit restent au pupitre.',3300);await photo('07-fiche-maison');await ouvrirModule();

        await chapitre('6 · Cinq arènes, modes Agent et Architecte');
        for(const arene of ['duel','escarmouche','espionnage','guerre','intrigue']){await r.choisir(f.getByLabel(/^Conflit/),arene,450);await expect.poll(async()=>(await module()).arene).toBe(arene);}
        await r.choisir(f.getByLabel(/^Mode/),'agent');await r.choisir(f.getByLabel(/^Mode/),'architecte');
        await r.legende('Un même module porte duel, escarmouche, espionnage, guerre et intrigue.','Agent agit directement ; Architecte déploie ses atouts. Les zones sont abstraites.',3400);await r.montrer(plateau,3300);await photo('08-plateau');
        const atouts=f.locator('details').filter({has:f.locator('summary',{hasText:'Atouts et déplacements'})});await r.cliquer(atouts.locator('summary'));
        const ligneAtout=atouts.getByText('Copie du registre',{exact:true}).locator('..');
        await r.choisir(atouts.getByLabel('Destination'),'commission');await r.cliquer(ligneAtout.getByRole('button',{name:'Déplacer d’une zone',exact:true}));await expect(f.getByRole('alert').last()).toHaveText('Reliez les zones adjacentes avant le déplacement.');await expect.poll(async()=>(await module()).atouts.find(a=>a.id==='registre')!.zone).toBe('archives');
        await r.legende('Un atout se déplace seulement le long des liens adjacents.','Archives → Commission est refusé ; il faut passer par Nalia. Le paiement et le test restent séparés.',3300);
        await r.choisir(atouts.getByLabel('Destination'),'nalia');await r.cliquer(ligneAtout.getByRole('button',{name:'Déplacer d’une zone',exact:true}));await expect.poll(async()=>(await module()).atouts.find(a=>a.id==='registre')!.zone).toBe('nalia');await r.montrer(plateau,3000);await photo('09-deplacement');

        await chapitre('7 · Intrigue : découvrir un désir par l’enquête');
        const enqueter=async()=>{await vue('players');await r.choisir(principal,'analyse');await r.choisir(principe,'justice');await r.taper(panneau.getByLabel('Difficulté',{exact:true}),'2');await jeter([4,9]);await expect(resultat).toContainText('Réussite');await clore();await ouvrirModule();
            const zones=f.locator('details').filter({has:f.locator('summary',{hasText:'Préparer les zones'})});if(await zones.getAttribute('open')===null)await r.cliquer(zones.locator('summary'));
            const ligne=zones.getByRole('button',{name:'Modifier Nalia, négociatrice',exact:true}).locator('..');await r.cliquer(ligne.getByRole('button',{name:/Enquête réussie/}));await r.montrer(ligne,1800);};
        await r.legende('En intrigue, une personne peut être une zone. Son désir reste à découvrir.','Après un véritable test réussi, le meneur reporte Analyse 6 : progression 6 − 2 = 4.',3200);
        await enqueter();await expect.poll(async()=>(await module()).zones.find(z=>z.id==='nalia')!.decouverte).toBe(4);await expect.poll(async()=>(await module()).zones.find(z=>z.id==='nalia')!.desirRevele).toBe(false);
        await r.legende('Premier succès : 4 sur une condition de Discipline 6.','Deuxième succès : 8 sur 6, le désir est révélé. Les mots et les conditions viennent du meneur.',3100);await enqueter();await expect.poll(async()=>(await module()).zones.find(z=>z.id==='nalia')!.desirRevele).toBe(true);await r.montrer(plateau,3200);await photo('10-desir');

        await chapitre('8 · Neutraliser, détruire et changer de scène');
        const mouvements=f.locator('details').filter({has:f.locator('summary',{hasText:'Atouts et déplacements'})});if(await mouvements.getAttribute('open')===null)await r.cliquer(mouvements.locator('summary'));
        await r.cliquer(mouvements.getByText('Copie du registre',{exact:true}).locator('..').getByRole('button',{name:'Neutraliser',exact:true}));
        await expect.poll(async()=>(await module()).atouts.find(a=>a.id==='registre')!.neutralise).toBe(true);
        await r.cliquer(mouvements.getByText('Rumeur favorable',{exact:true}).locator('..').getByRole('button',{name:'Détruire',exact:true}));await expect.poll(async()=>(await module()).atouts.some(a=>a.id==='rumeur')).toBe(false);
        await r.legende('Un tangible est neutralisé ; un intangible peut être détruit.','Le changement de scène réactive les tangibles permanents et retire les temporaires.',3300);await r.montrer(plateau,2600);await photo('11-atouts');
        await r.taper(f.getByLabel('Nouvelle scène du plateau Dune'),'La signature du traité');await r.cliquer(f.getByRole('button',{name:'Changer de scène (retirer les atouts temporaires)',exact:true}));
        await expect.poll(async()=>(await module()).atouts.find(a=>a.id==='registre')!.neutralise).toBe(false);await expect.poll(async()=>(await module()).scene).toBe('La signature du traité');await r.montrer(plateau,3000);await photo('12-scene');
        await r.titre('La Maison peut engager la négociation',['Le pilote résout le test et ses dépenses ; le module conserve zones, atouts et Maison.',
            'Tests réussis, déplacements et décisions restent confirmés par le meneur.',
            'Dune · pilote 2.0.0 · module Conflits et Maison · fiction de démonstration'],6500);
        reussi=true;fin=Date.now();
    }catch(erreur){await f.screenshot({path:path.join(PREUVES,'diagnostic-echec.jpg'),type:'jpeg'});fs.writeFileSync(path.join(PREUVES,'diagnostic-etat.json'),JSON.stringify(await f.evaluate(()=>{const s=(window as unknown as Fenetre).useSessionOSStore.getState();return{campagnes:s.campaigns.map(c=>({id:c.id,system:c.system})),active:s.activeCampaignId,joueurs:s.players.map(j=>j.id)};}),null,2));throw erreur;}
    finally{const video=f.video();await g.fermer();const fichierVideo=await video?.path();if(reussi&&fichierVideo){
        const exportVideo=JSON.parse(execFileSync(process.execPath,['outils/clips/exporter_clip.mjs',fichierVideo,SORTIE,'dune-mecanismes-et-modules',String((fin-ouverture)/1000)],{encoding:'utf8'}));
        fs.writeFileSync(path.join(PREUVES,'verification.json'),JSON.stringify({version:source.gameDriver.version,module:'dune-conflits',profilJetable:true,donneesPersonnelles:false,desPrepares:true,narrationSonore:false,modeRapide:!!process.env.GMOS_CLIP_RAPIDE,dureeDepuisTitre:(fin-ouverture)/1000,chapitres,exportVideo,
            assertions:['achat en Menace, Impulsion inchangée','bonus et Impulsion normale séparés','rachat complication +2 Menace','trait écrit puis reliquat versé une fois','Détermination 2 → 1','principe bafoué à la clôture puis récupéré','progression 12 → 15 → 5 et Combat 6 → 7','Maison reflétée et Menace de séance 3','fiche de Maison ouverte','cinq arènes et deux modes','déplacement non adjacent refusé puis adjacent accepté','deux vrais tests pour désir 4/6 puis 8/6','neutralisation tangible et destruction intangible','nouvelle scène réactive le permanent']},null,2));}
        if(path.resolve(brut).startsWith(racineTemp+path.sep))fs.rmSync(brut,{recursive:true,force:true});else console.error('Nettoyage temporaire refusé.');}
});
