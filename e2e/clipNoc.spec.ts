import { test, expect, type Locator, type Page } from '@playwright/test';
import AdmZip from 'adm-zip';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { lancerGmOs, attendreLHydratation, ouvrirLeModule, ongletDeLaFiche } from './lancerGmOs';
import type { useSessionOSStore } from '../src/modules/session/useSessionOSStore';
import type { useRessourcesDeTableStore } from '../src/modules/table/useRessourcesDeTableStore';
import type { useDiceStore } from '../src/stores/useDiceStore';

/** David, 06/11/2026 : filmer les mécanismes particuliers de NOC avec Playwright.
 * Instance jetable, personnage et effets fictifs, vrais gestes, dés préparés.
 * npm run build puis npx playwright test e2e/clipNoc.spec.ts --reporter=list
 */
const PILOTE = path.resolve(process.env.GMOS_PILOTE_NOC ?? 'output/campagnes-tests/noc/NOC-2.0.0.gmos-driver');
const SORTIE = path.resolve(process.env.GMOS_SORTIE_CLIP ?? 'output/clips');
const PREUVES = path.join(SORTIE, 'noc');
const CAMPAGNE = 'clip-noc', JOUEUR = 'clip-joueur-noc', PERSO = 'clip-ilya';
const LARGEUR = 1440, HAUTEUR = 900;
type Fenetre = Window & { useSessionOSStore: typeof useSessionOSStore; useRessourcesDeTableStore: typeof useRessourcesDeTableStore; useDiceStore: typeof useDiceStore; hasardClipNoc?: () => number };

/** Curseur, surlignage et légendes comme le clip RuneQuest ; palette verte et cuivre. */
function installerLaScene() {
    const style = document.createElement('style');
    style.textContent = `
      #clip-curseur{position:fixed;left:0;top:0;z-index:2147483647;pointer-events:none;transform:translate(-100px,-100px);filter:drop-shadow(0 2px 3px #000)}
      #clip-curseur.clic::after{content:'';position:absolute;left:-14px;top:-14px;width:28px;height:28px;border:3px solid #70c4c0;border-radius:50%;animation:clip-onde .5s ease-out forwards}
      @keyframes clip-onde{from{transform:scale(.3);opacity:1}to{transform:scale(1.6);opacity:0}}
      #clip-anneau{position:fixed;z-index:2147483646;pointer-events:none;border:3px solid #70c4c0;border-radius:8px;box-shadow:0 0 18px #70c4c066;opacity:0}
      #clip-legende{position:fixed;left:50%;bottom:20px;transform:translateX(-50%);max-width:1160px;width:max-content;z-index:2147483645;pointer-events:none;background:#050b19f2;color:white;font:600 22px/1.35 'Segoe UI',system-ui,sans-serif;padding:14px 24px;border-radius:12px;border:1px solid #70c4c0;box-shadow:0 8px 28px #0009;opacity:0}
      #clip-legende small{display:block;font-size:17px;font-weight:400;color:#ead7af;margin-top:5px}
      #clip-chapitre{position:fixed;top:14px;left:50%;transform:translateX(-50%);z-index:2147483645;pointer-events:none;background:#70c4c0;color:#030b15;font:800 15px 'Segoe UI',system-ui,sans-serif;padding:7px 18px;border-radius:999px;letter-spacing:.04em;opacity:0}
      #clip-titre{position:fixed;inset:0;z-index:2147483646;pointer-events:none;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;background:radial-gradient(ellipse at 30% 35%,#1c3a36,#0a0619 65%);color:#fff;font-family:'Segoe UI',system-ui,sans-serif;text-align:center;opacity:0;transition:opacity .4s}
      #clip-titre h1{font-size:52px;margin:0;color:#70c4c0}#clip-titre p{font-size:24px;margin:0;max-width:1100px;line-height:1.4}
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
            const w = window as unknown as Fenetre; w.hasardClipNoc ??= Math.random;
            const origine = w.hasardClipNoc; Math.random = () => file.length ? file.shift()! : origine();
        }, file);
    }
    async rendreLeHasard() { await this.page.evaluate(() => { const w = window as unknown as Fenetre; if (w.hasardClipNoc) Math.random = w.hasardClipNoc; }); }
}




test('les mécanismes de NOC et ses outils intégrés, en clip',async()=>{
    test.setTimeout(900_000);expect(fs.existsSync(PILOTE)).toBe(true);fs.mkdirSync(PREUVES,{recursive:true});
    const racineTemp=path.resolve(os.tmpdir()),brut=fs.mkdtempSync(path.join(racineTemp,'gmos-clip-noc-'));
    if(!path.resolve(brut).startsWith(racineTemp+path.sep))throw new Error('Profil inattendu.');
    const source=JSON.parse(new AdmZip(PILOTE).readAsText('state.json'));
    const recette=JSON.parse(fs.readFileSync('output/campagnes-tests/noc/03-Repos-Auras-et-Cabale.json','utf8'));
    const semence=JSON.parse(fs.readFileSync('e2e/donnees/campagne-de-demo.json','utf8')),s=semence.modules.sessionOS;
    const groupe=structuredClone(recette.campaign.groupe);delete groupe.ficheId;
    Object.assign(groupe.sheetData,{'tracks.espoir':3,'tracks.vecu':2,'tracks.singularite':2,'network.contacts.0.favours':2,'network.contacts.1.favours':2,'network.contacts.2.favours':2});
    s.campaigns=[{id:CAMPAGNE,name:'Le dernier timbre du Palier',system:source.gameDriver.id,activeLocationIds:[],groupe}];
    s.activeCampaignId=CAMPAGNE;s.customGameDrivers=[source.gameDriver];s.customSheetTemplates=[source.sheetTemplate];
    const fiche={...recette.players[0].characters[0].sheetData,nom:'Ilya Vorn',combat:2,action:3,vecu:2,espoir:3,singularite:2,blessures:5,trauma:2,traque:0,noirceur:0,
        sequelles_blessures:0,sequelles_trauma:0,sequelles_traque:0,sequelles_noirceur:0,extase:1,ferveur:2,folie:1,lumiere:0,soupcon:5,fatigue:false,bouleversement:false};
    s.players=['Ilya Vorn','Mara Senn','Ilan Roe'].map((name,i)=>({id:i?JOUEUR+'-'+i:JOUEUR,realName:'Joueur fictif '+(i+1),isOnline:false,characters:[{id:i?PERSO+'-'+i:PERSO,name,campaignId:CAMPAGNE,systemId:source.gameDriver.id,templateId:source.sheetTemplate.id,hp:i?10:5,maxHp:10,
        sheetData:i?{...fiche,nom:name,blessures:0,trauma:0,espoir:2,soupcon:0,extase:i===1?1:0,fatigue:i===1}:{...fiche}}]}));
    s.sessions=[{...s.sessions[0],id:'clip-seance-noc',campaignId:CAMPAGNE,status:'active',number:1,sessionEntityIds:s.players.map((p:{characters:{id:string}[]})=>p.characters[0].id),publicSummary:'Démonstration fictive'}];
    const semenceFichier=path.join(brut,'semence.json');fs.writeFileSync(semenceFichier,JSON.stringify(semence));
    const g=await lancerGmOs({semence:semenceFichier,video:{dossier:brut,largeur:LARGEUR,hauteur:HAUTEUR},preparerLeProfil:profil=>{
        fs.mkdirSync(path.join(profil,'corpus/fiches'),{recursive:true});fs.copyFileSync('docs/fiches/Character_Sheet_Manager.html',path.join(profil,'corpus/fiches/Character_Sheet_Manager.html'));
        for(const d of ['theme','fiche']){const e=path.resolve('docs/systems/noc',d);if(fs.existsSync(e))fs.cpSync(e,path.join(profil,'corpus/systems/noc',d),{recursive:true});}
    }});
    const f=g.fenetre,r=new Realisation(f),chapitres:{titre:string;secondesDepuisTitre:number}[]=[];f.setDefaultTimeout(15_000);
    let ouverture=0,fin=0,reussi=false;
    const personnage=()=>f.evaluate(()=>(window as unknown as Fenetre).useSessionOSStore.getState().players.find(p=>p.id==='clip-joueur-noc')!.characters[0]);
    const cabale=()=>f.evaluate(()=>(window as unknown as Fenetre).useSessionOSStore.getState().campaigns.find(c=>c.id==='clip-noc')!.groupe!.sheetData);
    const reserves=()=>f.evaluate(()=>(window as unknown as Fenetre).useRessourcesDeTableStore.getState().reserves['clip-noc']);
    const chapitre=async(titre:string)=>{chapitres.push({titre,secondesDepuisTitre:(Date.now()-ouverture)/1000});await r.chapitre(titre);};
    const photo=(nom:string)=>f.screenshot({path:path.join(PREUVES,nom+'.jpg'),type:'jpeg',quality:85});
    const vue=async(v:'players'|'cockpit'|'modules-du-jeu'|'group-sheet')=>{await f.evaluate(v=>(window as unknown as Fenetre).useSessionOSStore.getState().setCurrentView(v),v);if(v==='players')await ongletDeLaFiche(f,'Lancer un test');};
    try{
        await attendreLHydratation(g);await expect.poll(()=>f.evaluate(()=>(window as unknown as Fenetre).useSessionOSStore.getState().campaigns.map(c=>c.id))).toContain(CAMPAGNE);
        const fenetre=await g.application.browserWindow(f);await fenetre.evaluate((w,t)=>{w.unmaximize();w.setContentSize(t.l,t.h);w.webContents.setAudioMuted(true);},{l:LARGEUR,h:HAUTEUR});
        await ouvrirLeModule(g,'Tableau de Bord');
        await f.evaluate(()=>{const w=window as unknown as Fenetre,s=w.useSessionOSStore.getState();s.setActiveCampaign('clip-noc');s.setSelectedPlayer('clip-joueur-noc');s.setSelectedCharacter('clip-ilya');s.setCurrentView('group-sheet');w.useRessourcesDeTableStore.setState({reserves:{'clip-noc':{Fiel:4,Menace:2}}});});
        const cadre=f.frameLocator('iframe:visible');
        await f.getByRole('button',{name:/Créer une fiche pour Les Veilleurs du Palier/i}).click({timeout:30_000});
        await expect(cadre.locator('[data-key="identity.name"]')).toHaveValue('Les Veilleurs du Palier',{timeout:30_000});
        await vue('players');await ongletDeLaFiche(f,'Fiche du jeu');await f.getByRole('button',{name:/Créer une fiche pour Ilya Vorn/i}).click({timeout:30_000});
        await expect(cadre.locator('[data-key="identity.name"]')).toHaveValue('Ilya Vorn',{timeout:30_000});
        await vue('players');await f.evaluate(installerLaScene);await r.carte('');
        const panneau=f.locator('[data-panneau-de-jet]').first(),talent=panneau.locator('select').nth(0),domaine=panneau.locator('select').nth(1),resultat=panneau.getByRole('region',{name:'Résultat',exact:true});
        const preparer=async(difficulte='3')=>{await r.choisir(talent,'combat');await r.choisir(domaine,'action');await r.taper(panneau.getByLabel('Difficulté',{exact:true}),difficulte);};
        // Des valeurs de secours sans 1 ni 10 couvrent les identifiants de journal
        // tirés avant les dés lors des dépenses collectives, sans hasard de tournage.
        const jeter=async(faces:number[])=>{await r.des([...faces.map(n=>(n-.5)/10),.31,.32,.33,.34,.35,.36,.37,.38]);await r.cliquer(panneau.getByRole('button',{name:'Lancer',exact:true}));await r.rendreLeHasard();await r.montrer(resultat.or(panneau.getByRole('region',{name:'Dés supplémentaires de destin',exact:true})).first(),1000);};
        ouverture=Date.now();await r.titre('NOC · résister ensemble',['Destin, Fiel, périls et outils de la Cabale','Réserves · Séquelles · Extase · Soupçon · Réseau · Rouages','Personnages fictifs, profil jetable — vrais gestes et dés préparés.']);

        await chapitre('1 · Talent, Domaine et dés de destin');await preparer();
        await r.legende('Combat 2 donne le niveau ; Action 3 donne le plafond des dés.','Blessures 5 : Choqué retire un dé au Domaine. On peut choisir de ne lancer aucun dé.',3400);
        await r.cliquer(panneau.getByRole('button',{name:'Un dé de destin de moins',exact:true}));await r.cliquer(panneau.getByRole('button',{name:'Un dé de destin de moins',exact:true}));
        await jeter([]);await expect(resultat).toContainText('sans provoquer le destin');await photo('01-sans-destin');
        // Un nouveau test reprend le plafond du Domaine après le lancer sans dé.
        await jeter([10,1]);
        await r.legende('8, 9 et 10 ajoutent un niveau ; un 10 offre un dé facultatif.','Chaque 1 donne une goutte de Fiel. À cinq, la jauge se vide et la Menace monte.',3400);
        await r.des([.05]);await r.cliquer(panneau.getByRole('button',{name:'Lancer un dé supplémentaire',exact:true}));await r.rendreLeHasard();
        const garder=panneau.getByRole('button',{name:'Garder ce résultat',exact:true});if(await garder.isVisible())await r.cliquer(garder);
        await expect.poll(async()=>(await reserves()).Menace).toBe(3);await expect.poll(async()=>(await reserves()).Fiel).toBe(1);await r.montrer(resultat,3000);await photo('02-destin-fiel');

        await chapitre('2 · Vécu, Espoir et Singularité du Héros');
        await r.cliquer(panneau.getByRole('button',{name:'Un point de plus : Vécu',exact:true}));await r.cliquer(panneau.getByRole('button',{name:'Un point de plus : Espoir',exact:true}));await r.cliquer(panneau.getByRole('button',{name:'Un point de plus : Singularité',exact:true}));
        await r.legende('Un Vécu donne +1 au niveau ; un Espoir ajoute trois dés.','La Singularité annule des 1 avant le Fiel. Seuls les points réellement utilisés se dépensent.',3400);await jeter([1,8,8,3,4]);
        await expect.poll(async()=>(await personnage()).sheetData.vecu).toBe(1);await expect.poll(async()=>(await personnage()).sheetData.espoir).toBe(2);await expect.poll(async()=>(await personnage()).sheetData.singularite).toBe(1);await expect.poll(async()=>(await reserves()).Fiel).toBe(1);await photo('03-reserves-heros');

        await chapitre('3 · Puiser dans les réserves de la Cabale');await vue('cockpit');await vue('players');await preparer('4');
        await r.cliquer(panneau.getByRole('button',{name:'Un point de plus : Dés de la Cabale',exact:true}));await r.cliquer(panneau.getByRole('button',{name:'Un point de plus : Espoir de la Cabale',exact:true}));await r.cliquer(panneau.getByRole('button',{name:'Un point de plus : Vécu de la Cabale',exact:true}));
        await r.choisir(panneau.getByLabel('Choisir : Atout de la Cabale',{exact:true}),'assets.action.armory');await r.cliquer(panneau.getByRole('button',{name:'Un point de plus : Atout de la Cabale',exact:true}));
        await r.legende('La Cabale apporte ses dés, son Espoir, son Vécu et ses Atouts.','Le Domaine et les Atouts se consomment pour le scénario ; les pistes communes descendent sur la fiche.',3500);await jeter([8,8,3,4,5,6]);
        await expect.poll(async()=>(await cabale())['tracks.espoir']).toBe(2);await expect.poll(async()=>(await cabale())['tracks.vecu']).toBe(1);await expect.poll(async()=>(await reserves())['groupe:domains.action']).toBe(1);await expect.poll(async()=>(await reserves())['groupe:assets.action.armory']).toBe(0);await photo('04-reserves-cabale');

        await chapitre('4 · Les effets du Fiel, choisis par la Loi');await vue('cockpit');await r.cliquer(f.getByRole('button',{name:'Effets du Fiel',exact:true}));
        const effets=f.locator('[data-gestes-des-heros="debordement"]');
        await r.cliquer(effets.getByRole('button',{name:'Une fois de plus : Tension',exact:true}));await r.cliquer(effets.getByRole('button',{name:'Une fois de plus : Tension',exact:true}));await r.cliquer(effets.getByRole('button',{name:'Une fois de plus : Fatigue',exact:true}));
        await r.legende('Menace 3 : la Loi choisit trois effets, y compris des répétitions.','Deux Tensions cumulent 4 avant la Folie 1 : +3 Trauma. Fatigue retire un Espoir.',3400);await r.montrer(effets.getByRole('region',{name:'Ce qui va changer'}).or(effets.locator('section').last()).first(),2800);await photo('05-effets-fiel');
        await r.cliquer(effets.getByRole('button',{name:'Appliquer',exact:true}));await expect.poll(async()=>(await personnage()).sheetData.trauma).toBe(5);await expect.poll(async()=>(await personnage()).sheetData.espoir).toBe(1);

        await chapitre('5 · Périls et Séquelles sur les vraies pistes');await vue('players');await ongletDeLaFiche(f,'Fiche du jeu');
        const trauma8=cadre.locator('.hotspot[data-key="tracks.trauma"][data-value="8"]');await expect(trauma8).toBeVisible({timeout:30_000});await r.legende('Les pistes de la fiche HTML sont numériques et cumulatives.','À 8 Trauma : Traumatisé et proposition de Séquelle. La Loi confirme son inscription.',3400);await trauma8.click();
        await expect.poll(async()=>(await personnage()).sheetData.trauma).toBe(8);await photo('06-piste-trauma');
        const seuils=f.locator('[data-alertes-de-franchissement]');const seuilIlya=seuils.locator('li').filter({hasText:'Ilya Vorn'});await r.cliquer(seuilIlya.getByRole('button',{name:'Noter',exact:true}));await expect.poll(async()=>(await personnage()).sheetData.sequelles_trauma).toBe(1);
        await vue('players');await preparer();await expect(panneau).toContainText('Traumatisé');await r.montrer(panneau.locator('[data-destin]'),3000);await photo('07-malus-perils');

        await chapitre('6 · Moment de calme, Extase et Soupçon');await vue('cockpit');await r.cliquer(f.getByRole('button',{name:'Moment de calme',exact:true}));const calme=f.locator('[data-gestes-des-heros="calme"]');
        await r.taper(calme.getByLabel('extase de Mara Senn vers Mara Senn',{exact:true}),'0');await r.taper(calme.getByLabel('extase de Mara Senn vers Ilya Vorn',{exact:true}),'1');
        await expect(calme.getByRole('button',{name:'Appliquer',exact:true})).toBeDisabled();await r.legende('L’Extase peut être donnée à un allié pendant le repos.','Soupçon 5 retire deux points de récupération, à répartir par le joueur avant de confirmer.',3500);
        await r.taper(calme.getByLabel('Soupçon de Ilya Vorn sur espoir',{exact:true}),'2');await r.montrer(calme.locator('section').first(),2800);await photo('08-calme-soupcon');await r.cliquer(calme.getByRole('button',{name:'Appliquer',exact:true}));
        await expect.poll(async()=>(await personnage()).sheetData.espoir).toBe(2);await expect.poll(async()=>(await personnage()).sheetData.trauma).toBe(7);await expect.poll(async()=>(await personnage()).sheetData.blessures).toBe(4);await expect.poll(async()=>(await reserves()).Fiel).toBe(0);

        await chapitre('7 · Cabale, Réseau et Faveurs');await vue('modules-du-jeu');await expect(f.getByText('Aucun module proposé par ce pilote.',{exact:true})).toBeVisible();
        await r.legende('NOC ne déclare pas de module indépendant dans ce catalogue.','Ses outils sont intégrés : Cabale, Réseau, gestes de la Loi et pupitre de dés.',3200);await photo('09-outils-integres');await vue('group-sheet');
        await expect(cadre.locator('[data-key="identity.name"]')).toHaveValue('Les Veilleurs du Palier',{timeout:30_000});await r.legende('La Cabale possède sa propre fiche, commune à toute la table.','Domaines, Atouts, réserves et périls sont conservés sur la campagne.',3300);await photo('10-cabale-html');
        const faveurs=f.locator('[data-faveurs-cabale]');await r.cliquer(faveurs.locator('summary'));for(const i of [0,1])await r.cocher(faveurs.locator('input[type=checkbox]').nth(i));
        await r.legende('Chaque Contact du Réseau possède deux Faveurs par scénario.','Une grande Faveur coûte trois points ; plusieurs Contacts peuvent contribuer. La Loi apprécie le délai.',3500);
        await r.cliquer(faveurs.getByRole('button',{name:'Grande faveur (3)',exact:true}));await expect.poll(async()=>(await cabale())['network.contacts.0.favours']).toBe(0);await expect.poll(async()=>(await cabale())['network.contacts.1.favours']).toBe(1);
        await r.legende('Deux Contacts ont contribué à la grande Faveur.','Leurs réserves diminuent sur la Cabale ; le prochain scénario les rechargera.',3200);await r.montrer(faveurs,2500);await photo('11-faveurs');

        await chapitre('8 · Rouage hostile et recharge du scénario');await ouvrirLeModule(g,'Dice-OS');
        await r.taper(f.getByLabel('Quantité',{exact:true}),'3');await r.des([.05,.85,.05]);await r.cliquer(f.getByRole('button',{name:'LANCER',exact:true}));await r.rendreLeHasard();
        const rouage=f.locator('[data-fiel-au-pupitre]');await expect(rouage).toBeVisible();await expect(rouage.getByRole('button',{name:'Un Rouage hostile',exact:true})).toBeDisabled();
        await r.choisir(rouage.getByLabel('Héros bénéficiaire de la Singularité',{exact:true}),{label:'Ilya Vorn'});
        await r.legende('Au pupitre, la Loi précise si le jet vient d’un Héros ou d’un Rouage hostile.','Les 1 d’un Rouage retirent le Fiel ; l’excédent devient de la Singularité pour le Héros choisi.',3500);await r.montrer(rouage,2600);await photo('12-rouage');await r.cliquer(rouage.getByRole('button',{name:'Un Rouage hostile',exact:true}));await expect.poll(async()=>(await personnage()).sheetData.singularite).toBe(3);
        await ouvrirLeModule(g,'Tableau de Bord');await vue('cockpit');await r.cliquer(f.getByRole('button',{name:'Début de séance',exact:true}));await expect.poll(async()=>(await reserves()).Menace).toBe(2);await expect.poll(async()=>(await personnage()).sheetData.vecu).toBe(2);
        await r.legende('Début de séance : −1 Menace et +1 Vécu à chaque Héros.','Nouveau scénario : Menace à zéro, Vécu et réserves de Cabale rechargés ; les périls persistent.',3500);await r.cliquer(f.getByRole('button',{name:'Nouveau scénario',exact:true}));
        await r.cliquer(f.getByRole('button',{name:'Remettre',exact:true}));
        await expect.poll(async()=>(await reserves()).Menace).toBe(0);await expect.poll(async()=>(await cabale())['tracks.espoir']).toBe(3);await expect.poll(async()=>(await cabale())['network.contacts.0.favours']).toBe(2);await expect.poll(async()=>(await personnage()).sheetData.trauma).toBe(7);
        await vue('group-sheet');await r.cliquer(f.locator('[data-faveurs-cabale] summary'));await r.montrer(f.locator('[data-faveurs-cabale]'),3000);await photo('13-recharge');
        await r.titre('Aucun nom ne disparaît seul',['Le pilote suit les dépenses et les périls ; la Cabale porte les moyens communs.',
            'La Loi choisit les conséquences, les bénéficiaires et les effets narratifs.',
            'NOC · pilote 2.0.0 · outils intégrés · fiction de démonstration'],6500);reussi=true;fin=Date.now();
    }catch(erreur){await f.screenshot({path:path.join(PREUVES,'diagnostic-echec.jpg'),type:'jpeg'});throw erreur;}
    finally{const video=f.video();await g.fermer();const fichierVideo=await video?.path();if(reussi&&fichierVideo){
        const exportVideo=JSON.parse(execFileSync(process.execPath,['outils/clips/exporter_clip.mjs',fichierVideo,SORTIE,'noc-mecanismes-et-outils',String((fin-ouverture)/1000)],{encoding:'utf8'}));
        fs.writeFileSync(path.join(PREUVES,'verification.json'),JSON.stringify({version:source.gameDriver.version,profilJetable:true,donneesPersonnelles:false,desPrepares:true,narrationSonore:false,modeRapide:!!process.env.GMOS_CLIP_RAPIDE,dureeDepuisTitre:(fin-ouverture)/1000,chapitres,exportVideo,
            assertions:['sans dé : Talent seul','10 supplémentaire facultatif','Fiel 4 + 2 → 1, Menace 2 → 3','Vécu, Espoir et Singularité du Héros réellement dépensés','Cabale : pistes et stocks de scénario dépensés','deux Tensions puis Folie, Fatigue','piste HTML Trauma 8 puis Séquelle 1','Soupçon bloque le repos avant répartition','Extase donnée par Mara, récupération confirmée','Fiel −1 au repos de tous','fiche HTML de Cabale et Faveur réellement dépensée','absence de module indépendant constatée','Rouage : bénéficiaire obligatoire et Singularité +2','début de séance et nouveau scénario distincts','périls conservés au nouveau scénario']},null,2));}
        if(path.resolve(brut).startsWith(racineTemp+path.sep))fs.rmSync(brut,{recursive:true,force:true});else console.error('Nettoyage temporaire refusé.');}
});
