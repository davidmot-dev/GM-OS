import { test, expect, type Locator, type Page } from '@playwright/test';
import AdmZip from 'adm-zip';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { lancerGmOs, attendreLHydratation, ouvrirLeModule, ongletDeLaFiche } from './lancerGmOs';
import type { useSessionOSStore } from '../src/modules/session/useSessionOSStore';
import type { useCombatStore } from '../src/modules/combat/useCombatStore';

/** David, 06/11/2026 : filmer les mécanismes particuliers de Crimes avec Playwright.
 * Instance jetable, personnage et effets fictifs, vrais gestes, dés préparés.
 * npm run build puis npx playwright test e2e/clipCrimes.spec.ts --reporter=list
 */
const PILOTE = path.resolve(process.env.GMOS_PILOTE_CRIMES ?? 'output/clips/crimes/pilote/Crime_driver_gmos_complet.gmos-driver');
const SORTIE = path.resolve(process.env.GMOS_SORTIE_CLIP ?? 'output/clips');
const PREUVES = path.join(SORTIE, 'crimes');
const CAMPAGNE = 'clip-crimes', JOUEUR = 'clip-joueur-crimes', PERSO = 'clip-leonce';
const LARGEUR = 1440, HAUTEUR = 900;
type Fenetre = Window & { useSessionOSStore: typeof useSessionOSStore; useCombatStore: typeof useCombatStore; hasardClipCrimes?: () => number };

/** Curseur, surlignage et légendes comme le clip RuneQuest ; palette cuivre et encre. */
function installerLaScene() {
    const style = document.createElement('style');
    style.textContent = `
      #clip-curseur{position:fixed;left:0;top:0;z-index:2147483647;pointer-events:none;transform:translate(-100px,-100px);filter:drop-shadow(0 2px 3px #000)}
      #clip-curseur.clic::after{content:'';position:absolute;left:-14px;top:-14px;width:28px;height:28px;border:3px solid #daa47b;border-radius:50%;animation:clip-onde .5s ease-out forwards}
      @keyframes clip-onde{from{transform:scale(.3);opacity:1}to{transform:scale(1.6);opacity:0}}
      #clip-anneau{position:fixed;z-index:2147483646;pointer-events:none;border:3px solid #daa47b;border-radius:8px;box-shadow:0 0 18px #daa47b66;opacity:0}
      #clip-legende{position:fixed;left:50%;bottom:20px;transform:translateX(-50%);max-width:1160px;width:max-content;z-index:2147483645;pointer-events:none;background:#050b19f2;color:white;font:600 22px/1.35 'Segoe UI',system-ui,sans-serif;padding:14px 24px;border-radius:12px;border:1px solid #daa47b;box-shadow:0 8px 28px #0009;opacity:0}
      #clip-legende small{display:block;font-size:17px;font-weight:400;color:#ead7af;margin-top:5px}
      #clip-chapitre{position:fixed;top:14px;left:50%;transform:translateX(-50%);z-index:2147483645;pointer-events:none;background:#daa47b;color:#030b15;font:800 15px 'Segoe UI',system-ui,sans-serif;padding:7px 18px;border-radius:999px;letter-spacing:.04em;opacity:0}
      #clip-titre{position:fixed;inset:0;z-index:2147483646;pointer-events:none;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;background:radial-gradient(ellipse at 30% 35%,#302121,#0a0619 65%);color:#fff;font-family:'Segoe UI',system-ui,sans-serif;text-align:center;opacity:0;transition:opacity .4s}
      #clip-titre h1{font-size:52px;margin:0;color:#daa47b}#clip-titre p{font-size:24px;margin:0;max-width:1100px;line-height:1.4}
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
            const w = window as unknown as Fenetre; w.hasardClipCrimes ??= Math.random;
            const origine = w.hasardClipCrimes; Math.random = () => file.length ? file.shift()! : origine();
        }, file);
    }
    async rendreLeHasard() { await this.page.evaluate(() => { const w = window as unknown as Fenetre; if (w.hasardClipCrimes) Math.random = w.hasardClipCrimes; }); }
}



test('les mécanismes particuliers de Crimes, en clip', async () => {
    test.setTimeout(720_000);
    expect(fs.existsSync(PILOTE)).toBe(true);
    fs.mkdirSync(PREUVES,{recursive:true});
    const racineTemp=path.resolve(os.tmpdir()), brut=fs.mkdtempSync(path.join(racineTemp,'gmos-clip-crimes-'));
    if (!path.resolve(brut).startsWith(racineTemp+path.sep)) throw new Error('Profil inattendu.');
    const source=JSON.parse(new AdmZip(PILOTE).readAsText('state.json'));
    expect(source.gameDriver.jet.garde.psychologie).toBeTruthy(); expect(source.gameDriver.enquete).toBeTruthy();
    const semence=JSON.parse(fs.readFileSync('e2e/donnees/campagne-de-demo.json','utf8')), s=semence.modules.sessionOS;
    s.campaigns=[{id:CAMPAGNE,name:'Le billet de la verrière',system:source.gameDriver.id,activeLocationIds:[]}];
    s.activeCampaignId=CAMPAGNE; s.customGameDrivers=[source.gameDriver]; s.customSheetTemplates=[source.sheetTemplate];
    const valeurs=Object.fromEntries(source.sheetTemplate.sections.flatMap((sec:{fields:{id:string;defaultValue?:unknown}[]})=>sec.fields).map((c:{id:string;defaultValue?:unknown})=>[c.id,c.defaultValue??'']));
    s.players=[{id:JOUEUR,realName:'Joueur fictif',isOnline:false,characters:[{id:PERSO,name:'Léonce Varin',campaignId:CAMPAGNE,
        systemId:source.gameDriver.id,templateId:source.sheetTemplate.id,hp:0,maxHp:0,sheetData:{...valeurs,
            physique:5,mental:4,social:3,sport:2,combat:2,pratique:1,specialties_sport_climbing:true,
            fatigue_physique:0,epuisement_physique:0,blessures_physique:0,fatigue_mental:0,epuisement_mental:0,blessures_mental:0,
            fatigue_social:0,epuisement_social:0,blessures_social:0,depassement_de_la_scene:0,
            angoisse:2,nevrose:2,seuil_nevrose:7,psychose:2,base_psychose:2,inclinaison_psychotique:'Paranoïa',
            limier:1,compteur_limier:1,fouineur:0,compteur_fouineur:0,contacts_0_name:'Adèle, archiviste',contacts_0_rating:3,
            contacts_0_influence:2,contacts_0_appels:0,fortune:2,fortune_piste:9,munitions:6,points_de_developpement:6,
            psychology_emotivity:'Oui',psychology_activity:'Oui',psychology_reactivity:'Secondaire',sexe_age:'Homme, 34 ans'}}]}];
    const semenceFichier=path.join(brut,'semence.json');fs.writeFileSync(semenceFichier,JSON.stringify(semence));
    const g=await lancerGmOs({semence:semenceFichier,video:{dossier:brut,largeur:LARGEUR,hauteur:HAUTEUR},preparerLeProfil:profil=>{
        for(const dossier of ['theme','fiche']) {const entree=path.resolve('docs/systems/crime',dossier);if(fs.existsSync(entree))fs.cpSync(entree,path.join(profil,'corpus/systems/crime',dossier),{recursive:true});}
    }});
    const f=g.fenetre,r=new Realisation(f),chapitres:{titre:string;secondesDepuisTitre:number}[]=[];
    f.setDefaultTimeout(15_000);let ouverture=0,fin=0,reussi=false;
    const personnage=()=>f.evaluate(()=>(window as unknown as Fenetre).useSessionOSStore.getState().players.find(p=>p.id==='clip-joueur-crimes')!.characters[0]);
    const chapitre=async(titre:string)=>{chapitres.push({titre,secondesDepuisTitre:(Date.now()-ouverture)/1000});await r.chapitre(titre);};
    const photo=(nom:string)=>f.screenshot({path:path.join(PREUVES,nom+'.jpg'),type:'jpeg',quality:85});
    const vue=async(v:'players'|'cockpit'|'library')=>{await f.evaluate(v=>(window as unknown as Fenetre).useSessionOSStore.getState().setCurrentView(v),v);if(v==='players')await ongletDeLaFiche(f,'Lancer un test');};
    try {
        await attendreLHydratation(g);const fenetre=await g.application.browserWindow(f);
        await fenetre.evaluate((w,t)=>{w.unmaximize();w.setContentSize(t.l,t.h);w.webContents.setAudioMuted(true);},{l:LARGEUR,h:HAUTEUR});
        await ouvrirLeModule(g,'Tableau de Bord');
        await f.evaluate(()=>{const w=window as unknown as Fenetre,s=w.useSessionOSStore.getState();s.setActiveCampaign('clip-crimes');s.setSelectedPlayer('clip-joueur-crimes');s.setSelectedCharacter('clip-leonce');s.setCurrentView('players');
            s.addClue({campaignId:'clip-crimes',title:'Le billet de la verrière',content:'Une livraison fut déplacée à minuit. Indice fictif de démonstration.',isRevealed:false,seuilsDEnquete:[{style:'limier',points:3}],gainsDEnquete:[{style:'limier',points:1}]} as never);
            s.addEntity({id:'clip-surineur',name:'Le surineur',type:'npc',role:'hostile',status:'alive',avatar:'',hp:0,maxHp:0,ac:0,speed:0,initiative:0,description:'Adversaire fictif',roleplayingNotes:'',gmSecretInfo:'',linkedMapIds:[],campaignId:'clip-crimes',sheetData:{physique:5,fatigue_physique:0,epuisement_physique:0,blessures_physique:0}} as never);
            const e=w.useSessionOSStore.getState().entities.find(x=>x.name==='Le surineur')!;w.useCombatStore.getState().clearCombatants();
            w.useCombatStore.getState().addCombatant({name:e.name,init:0,isPlayer:false,sourceEntityId:e.id,faction:'enemy',statuses:[]});
        });
        await ongletDeLaFiche(f,'Lancer un test');await f.evaluate(installerLaScene);
        const panneau=f.locator('[data-panneau-de-jet]').first(),principal=panneau.locator('select').nth(0),competence=panneau.locator('select').nth(1);
        const resultat=panneau.getByRole('region',{name:'Résultat',exact:true});
        const jeter=async(faces:number[])=>{await r.des(faces.map(n=>(n-.5)/10));await r.cliquer(panneau.getByRole('button',{name:'Lancer',exact:true}));await r.rendreLeHasard();await r.montrer(resultat,1000);};
        await r.carte('');ouverture=Date.now();
        await r.titre('Crimes · les mécanismes du jeu',['Une affaire fictive dans GM-OS','Dés gardés · Dépassement · Atteintes · Psychologie · Enquête','Profil jetable, vrais gestes — dés préparés, légendes sans voix.']);

        await chapitre('1 · Potentiel GARDE Compétence');
        await r.choisir(principal,'physique');await r.choisir(competence,'sport');
        await r.legende('Physique 5 donne cinq d10 ; Sport 2 permet d’en garder deux.','Seuil 8 si compétent, 9 sans compétence, 7 avec une spécialisation appropriée.',3000);
        await r.montrer(panneau.locator('[data-garde]'),3000);await jeter([1,3,4,9,10]);
        await expect(resultat).toContainText('Réussite mitigée');
        await r.legende('Tous les 1 sont gardés d’office : ici, 1 et 10.','Une réussite et un 1 donnent une réussite mitigée. Les autres dés sont écartés.',3000);await photo('01-garde');
        await r.choisir(panneau.getByRole('combobox',{name:/Spécialisation/}),{label:'Escalade'});
        await expect(panneau.locator('[data-garde]')).toContainText('spécialisé (Escalade)');
        await jeter([3,4,5,8,10]);
        await r.legende('La garde se choisit : on peut accepter un échec volontaire.','Les 1 restent imposés. Deux dés écartés remplacent ici les deux réussites gardées.',3000);
        await r.cliquer(panneau.locator('[data-de-de-la-garde="0"]'));await r.cliquer(panneau.locator('[data-de-de-la-garde="1"]'));
        await expect(resultat).toContainText('Échec');await r.cliquer(panneau.getByRole('button',{name:'Consigner cette garde',exact:true}));await photo('02-garde-choisie');
        await r.choisir(panneau.getByRole('combobox',{name:/Spécialisation/}),'');

        await chapitre('2 · Se dépasser : le succès a un prix');
        await r.cocher(panneau.locator('[data-depassement]'));
        await r.legende('Le dépassement s’annonce avant les dés.','Une passion, une conviction ou la situation de combat le justifie à la table.',2800);
        await jeter([1,9,10,8,5]);await r.cliquer(panneau.locator('[data-se-depasser="1"]'));
        await expect.poll(async()=>(await personnage()).sheetData.fatigue_physique).toBe(1);
        await expect(panneau.locator('[data-depassement]')).toBeDisabled();
        await r.legende('Une réussite écartée entre dans la garde, contre une fatigue.','Deux réussites dépassent le 1 : réussite. Un seul dépassement par scène.',3300);await r.montrer(resultat,2800);await photo('03-depassement');

        await chapitre('3 · Atteintes et récupération');await r.carte('atteintes-crimes');
        const atteintes=f.locator('[data-atteintes-du-potentiel="physique"]');
        await r.cliquer(atteintes.getByRole('button',{name:'+ Épuisement',exact:true}));
        await expect.poll(async()=>(await personnage()).sheetData.fatigue_physique).toBe(0);
        await r.cliquer(atteintes.getByRole('button',{name:'+ Blessure',exact:true}));
        await expect.poll(async()=>(await personnage()).sheetData.epuisement_physique).toBe(0);
        await r.legende('L’atteinte la plus grave remplace une marque moindre.','L’épuisement remplace la fatigue ; la blessure remplace l’épuisement. La base reste 5.',3000);
        await r.cliquer(atteintes.getByRole('button',{name:'+ Épuisement',exact:true}));await r.cliquer(atteintes.getByRole('button',{name:'+ Fatigue',exact:true}));
        await expect(panneau).toContainText('− 3 (atteintes)');await r.montrer(atteintes,3000);await photo('04-atteintes');
        await vue('cockpit');await r.cliquer(f.getByRole('button',{name:/Bonne nuit/}));
        const nuit=f.locator('[data-gestes-des-heros="bonneNuit"]');
        await r.legende('Bonne nuit montre les changements avant de les écrire.','La fatigue et une croix d’épuisement disparaissent. La blessure reste.',3200);await r.montrer(nuit,3000);await photo('05-bonne-nuit');
        await r.cliquer(nuit.getByRole('button',{name:'Appliquer',exact:true}));
        await expect.poll(async()=>(await personnage()).sheetData.epuisement_physique).toBe(0);
        await expect.poll(async()=>(await personnage()).sheetData.fatigue_physique).toBe(0);
        await expect.poll(async()=>(await personnage()).sheetData.blessures_physique).toBe(1);
        await vue('players');await r.carte('atteintes-crimes');
        await r.legende('Les soins demandent une décision du meneur.','Pour la suite de cette démonstration, le meneur accorde le soin de cette blessure.',2600);
        await r.cliquer(atteintes.getByRole('button',{name:'Soigner',exact:true}));await expect.poll(async()=>(await personnage()).sheetData.blessures_physique).toBe(0);

        await chapitre('4 · Angoisse, Névrose et Psychose');await r.carte('psychologie-crimes');
        const psy=f.locator('[data-psychologie]');
        await r.cliquer(psy.locator('[data-jauge="angoisse"]').getByRole('button',{name:'+1',exact:true}));
        await expect.poll(async()=>(await personnage()).sheetData.angoisse).toBe(3);
        await expect.poll(async()=>(await personnage()).sheetData.nevrose).toBe(3);
        await r.legende('Une ambiance angoissante fait monter Angoisse et Névrose ensemble.','Les seuils rappellent leurs effets ; l’état de folie se choisit selon l’inclinaison.',3000);
        await r.choisir(psy.locator('[data-intensite]'),'1');await r.des([.15,.15,.25,.35]);
        await r.cliquer(psy.getByRole('button',{name:'Lancer le test psychotique',exact:true}));await r.rendreLeHasard();
        await expect(psy.locator('[data-issue-psychotique]')).toContainText('État de folie');
        await r.cliquer(psy.getByRole('button',{name:'Noter +1 Psychose',exact:true}));
        await expect.poll(async()=>(await personnage()).sheetData.psychose).toBe(3);
        await r.legende('Test psychotique : Mental actuel GARDE 1, seuil Psychose + Angoisse.','Ici l’échec propose +1 Psychose. Le meneur choisit et décrit l’état de folie.',3300);await r.montrer(psy,3000);await photo('06-psychologie');

        await chapitre('5 · Dossier d’enquête : découvrir, révéler, partager');await r.carte('');
        await r.choisir(principal,'mental');await r.choisir(competence,'pratique');await jeter([9,5,4,3]);
        await r.legende('Si la routine a fait avancer l’enquête, le meneur attribue ses points.','Les points d’un style se cumulent ; ils ne sont pas dépensés pour obtenir un indice.',3000);
        await r.cliquer(panneau.locator('[data-point-d-enquete="limier"]'));
        await expect.poll(async()=>(await personnage()).sheetData.compteur_limier).toBe(2);
        await vue('library');await r.cliquer(f.locator('div.flex-col.overflow-hidden.rounded-xl',{hasText:'Le billet de la verrière'}).getByRole('button',{name:/Modifier/}).first());
        await r.cliquer(f.getByRole('button',{name:/Indices$/}).first());
        const dossier=f.locator('[data-dossier-d-enquete]');
        await r.cliquer(dossier.getByRole('button',{name:'Un point de plus : Léonce Varin, Limier',exact:true}));
        await expect(dossier.locator('[data-indices-a-portee]')).toContainText('Limier 3/3');
        await r.legende('Limier 3 atteint le seuil : le billet devient « à portée ».','L’outil alerte ; il ne révèle pas l’indice de lui-même.',3000);await r.montrer(dossier.locator('[data-indices-a-portee]'),2800);await photo('07-indice-a-portee');
        await r.cliquer(dossier.getByRole('button',{name:'Révéler à Léonce Varin',exact:true}));
        await expect.poll(async()=>(await personnage()).sheetData.compteur_limier).toBe(4);
        const indice=()=>f.evaluate(()=>(window as unknown as Fenetre).useSessionOSStore.getState().clues.find(c=>c.title==='Le billet de la verrière')!);
        expect((await indice()).isRevealed).toBe(false);expect((await indice()).connuDe).toEqual([PERSO]);
        await r.legende('Révélé à Léonce seul, l’indice reste privé ; son gain ajoute +1 Limier.','Quand il le raconte aux autres : « Partager à la table ». L’origine reste connue.',3400);
        await r.montrer(dossier.locator('[data-indices-prives]'),3000);await photo('08-indice-prive');
        await r.cliquer(dossier.getByRole('button',{name:'Partager à la table',exact:true}));expect((await indice()).isRevealed).toBe(true);
        await r.taper(dossier.locator('[data-nouvelle-hypothese]'),'La livraison dissimule un rendez-vous.');
        await r.cliquer(dossier.locator('[data-hypotheses]').getByRole('button',{name:'Noter',exact:true}));
        await r.legende('Le dossier garde aussi les hypothèses de la table.','On peut les écarter ou les rouvrir ; leur vérité reste une affaire de récit.',2800);await r.montrer(dossier.locator('[data-hypotheses]'),2800);await photo('09-hypothese');
        await r.cliquer(f.getByRole('button',{name:'Fermer la fenêtre',exact:true}));await vue('players');

        await chapitre('6 · Combat : arme, opposition, protection et munitions');await r.carte('');
        await r.choisir(principal,'physique');await r.choisir(competence,'combat');
        const attaque=panneau.locator('[data-attaque-de-crimes]');await r.choisir(attaque.locator('select').first(),'canne-epee');
        await r.choisir(attaque.locator('[data-cible]'),{label:'Le surineur'});await r.taper(attaque.locator('[data-protection]'),'2');
        await r.legende('Canne-épée : Physique de l’attaquant + bonus d’arme.','Deux réussites, cible Physique 5, protection 2 : 2 + (5 + 2) − 5 − 2 = 2 blessures.',3300);
        await jeter([10,9,5,4,3]);await expect(resultat).toContainText('Touché : 2 blessures');
        await r.montrer(resultat,3200);await photo('10-attaque');
        await r.cliquer(panneau.locator('[data-infliger]'));
        await expect.poll(()=>f.evaluate(()=>(window as unknown as Fenetre).useSessionOSStore.getState().entities.find(e=>e.name==='Le surineur')!.sheetData!.blessures_physique)).toBe(2);
        await ouvrirLeModule(g,'Combat-OS');
        const cibleCombat=f.locator('[data-combattant]').filter({hasText:'Le surineur'});
        await expect(cibleCombat.locator('[data-physique-actuel]')).toContainText('3');
        await r.legende('Le plateau conserve deux blessures ; le Physique actuel de la cible vaut 3.','Le coup est inscrit sur sa fiche. L’initiative suivante se décide dans le récit.',2800);
        await r.montrer(cibleCombat,2800);await photo('10b-plateau');
        await ouvrirLeModule(g,'Tableau de Bord');await vue('players');
        await r.choisir(principal,'physique');await r.choisir(competence,'combat');
        await r.choisir(attaque.locator('select').first(),'protector');await r.taper(attaque.locator('[data-distance]'),'20');
        await r.legende('Avec le revolver Protector, 20 mètres dépassent sa portée utile de 15.','Une réussite est retirée ; au-delà de 30 mètres, le tir serait impossible.',3000);
        await jeter([10,9,5,4,3]);
        await r.cliquer(resultat.getByRole('button',{name:'−1 munition',exact:true}));
        await expect.poll(async()=>(await personnage()).sheetData.munitions).toBe(5);
        await r.cliquer(resultat.getByRole('button',{name:/^Recharger \(/}));
        await expect.poll(async()=>(await personnage()).sheetData.munitions).toBe(10);
        await r.legende('Les munitions se retirent et se rechargent explicitement.','Les manœuvres sont proposées au même endroit ; l’initiative narrative reste au meneur.',3000);await r.montrer(resultat,2800);await photo('11-munitions');

        await chapitre('7 · Contacts et fortune');await r.carte('contacts-fortune-crimes');
        const contacts=f.locator('[data-contacts-et-fortune]'),contact=contacts.locator('[data-contact="Adèle, archiviste"]');
        await r.cliquer(contact.getByRole('button',{name:'Appel −1',exact:true}));await expect(contact).toContainText('loyauté 2/3');
        await expect.poll(async()=>(await personnage()).sheetData.contacts_0_rating).toBe(3);
        await r.legende('Un appel réduit la loyauté actuelle pour ce scénario.','La base reste 3. Les contacts sont gérés par le meneur seul.',3000);await r.montrer(contact,2800);await photo('12-contact');
        await r.cliquer(contacts.getByRole('button',{name:'Fin du scénario : loyautés restaurées',exact:true}));await expect(contact).toContainText('loyauté 3/3');
        await r.cliquer(contacts.getByRole('button',{name:'Achat conséquent −1',exact:true}));
        await r.cliquer(contacts.getByRole('button',{name:'Rétribution +1',exact:true}));await r.cliquer(contacts.getByRole('button',{name:'Rétribution +1',exact:true}));
        await expect.poll(async()=>(await personnage()).sheetData.fortune).toBe(3);
        await expect.poll(async()=>(await personnage()).sheetData.fortune_piste).toBe(5);
        await r.legende('La jauge de fortune à 10 fait monter le niveau, puis repart à 5.','Seuil 10 : choix de David pour ce pilote. Le livre ne chiffre pas ce seuil.',3300);await r.montrer(contacts.locator('[data-fortune]'),3000);await photo('13-fortune');

        await chapitre('8 · Tempérament, création et développement');await r.carte('creation-crimes');
        const creation=f.locator('[data-creation]');await expect(creation).toContainText('Passionné');
        await r.legende('Les trois choix de Jung déterminent le tempérament.','La carte vérifie les budgets de création et les conditions des spécialisations.',3000);await r.montrer(creation.locator('[data-regles-de-creation]'),3000);
        await r.choisir(creation.locator('[data-amelioration]'),'mental');
        await r.legende('Le développement annonce son coût avant de modifier la fiche.','Mental 4 → 5 coûte cinq points ; la progression doit être justifiée dans l’histoire.',3200);
        await r.cliquer(creation.getByRole('button',{name:'Dépenser',exact:true}));
        await expect.poll(async()=>(await personnage()).sheetData.mental).toBe(5);
        await expect.poll(async()=>(await personnage()).sheetData.points_de_developpement).toBe(1);
        await r.montrer(creation,3000);await photo('14-developpement');
        await r.titre('L’enquête peut continuer',['Composer le test, choisir sa garde, puis confirmer les suites.',
            'Dossier d’enquête : révéler à un enquêteur, partager quand il en parle.',
            'Les circonstances, les états de folie et les choix de récit restent au meneur.'],6500);
        reussi=true;fin=Date.now();
    } catch(erreur) {await f.screenshot({path:path.join(PREUVES,'diagnostic-echec.jpg'),type:'jpeg'});throw erreur;}
    finally {
        const video=f.video();await g.fermer();const fichierVideo=await video?.path();
        if(reussi&&fichierVideo){
            const exportVideo=JSON.parse(execFileSync(process.execPath,['outils/clips/exporter_clip.mjs',fichierVideo,SORTIE,'crimes-mecanismes',String((fin-ouverture)/1000)],{encoding:'utf8'}));
            fs.writeFileSync(path.join(PREUVES,'verification.json'),JSON.stringify({version:source.gameDriver.version,profilJetable:true,donneesPersonnelles:false,desPrepares:true,narrationSonore:false,modeRapide:!!process.env.GMOS_CLIP_RAPIDE,dureeDepuisTitre:(fin-ouverture)/1000,chapitres,exportVideo,
                assertions:['1 imposé et réussite mitigée','spécialisation Escalade','garde choisie en échec et consignée','dépassement : fatigue 1 et blocage par scène',
                    'atteinte grave remplace la moindre','Bonne nuit conserve la blessure','soin explicite','Angoisse et Névrose +1','test psychotique et Psychose +1',
                    'gain Limier 1 → 2 puis seuil 3','indice privé puis partagé, gain Limier 4','hypothèse notée','2 blessures à la cible','munitions 6 → 5 → 10',
                    'contact 2/3, base conservée, restauration','fortune niveau 3 et jauge 5','Mental 4 → 5 et développement 6 → 1']},null,2));
        }
        if(path.resolve(brut).startsWith(racineTemp+path.sep))fs.rmSync(brut,{recursive:true,force:true});else console.error('Nettoyage temporaire refusé.');
    }
});
