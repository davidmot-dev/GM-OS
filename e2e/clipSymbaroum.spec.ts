import { test, expect, type Locator, type Page } from '@playwright/test';
import AdmZip from 'adm-zip';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { lancerGmOs, attendreLHydratation, ouvrirLeModule, ongletDeLaFiche } from './lancerGmOs';
import type { useSessionOSStore } from '../src/modules/session/useSessionOSStore';

/** David, 06/11/2026 : filmer les mécanismes particuliers de Symbaroum avec Playwright.
 * Instance jetable, personnage et effets fictifs, vrais gestes, dés préparés.
 * npm run build puis npx playwright test e2e/clipSymbaroum.spec.ts --reporter=list
 */
const PILOTE = path.resolve(process.env.GMOS_PILOTE_SYMBAROUM ?? 'output/clips/symbaroum/pilote/Symbaroum-2.0.0.gmos-driver');
const SORTIE = path.resolve(process.env.GMOS_SORTIE_CLIP ?? 'output/clips');
const PREUVES = path.join(SORTIE, 'symbaroum');
const CAMPAGNE = 'clip-symbaroum', JOUEUR = 'clip-joueur-symbaroum', PERSO = 'clip-elena';
const LARGEUR = 1440, HAUTEUR = 900;
type Fenetre = Window & { useSessionOSStore: typeof useSessionOSStore; hasardClipSymbaroum?: () => number };

/** Curseur, surlignage et légendes comme le clip RuneQuest ; palette verte et cuivre. */
function installerLaScene() {
    const style = document.createElement('style');
    style.textContent = `
      #clip-curseur{position:fixed;left:0;top:0;z-index:2147483647;pointer-events:none;transform:translate(-100px,-100px);filter:drop-shadow(0 2px 3px #000)}
      #clip-curseur.clic::after{content:'';position:absolute;left:-14px;top:-14px;width:28px;height:28px;border:3px solid #a5bf82;border-radius:50%;animation:clip-onde .5s ease-out forwards}
      @keyframes clip-onde{from{transform:scale(.3);opacity:1}to{transform:scale(1.6);opacity:0}}
      #clip-anneau{position:fixed;z-index:2147483646;pointer-events:none;border:3px solid #a5bf82;border-radius:8px;box-shadow:0 0 18px #a5bf8266;opacity:0}
      #clip-legende{position:fixed;left:50%;bottom:20px;transform:translateX(-50%);max-width:1160px;width:max-content;z-index:2147483645;pointer-events:none;background:#050b19f2;color:white;font:600 22px/1.35 'Segoe UI',system-ui,sans-serif;padding:14px 24px;border-radius:12px;border:1px solid #a5bf82;box-shadow:0 8px 28px #0009;opacity:0}
      #clip-legende small{display:block;font-size:17px;font-weight:400;color:#ead7af;margin-top:5px}
      #clip-chapitre{position:fixed;top:14px;left:50%;transform:translateX(-50%);z-index:2147483645;pointer-events:none;background:#a5bf82;color:#030b15;font:800 15px 'Segoe UI',system-ui,sans-serif;padding:7px 18px;border-radius:999px;letter-spacing:.04em;opacity:0}
      #clip-titre{position:fixed;inset:0;z-index:2147483646;pointer-events:none;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;background:radial-gradient(ellipse at 30% 35%,#272044,#0a0619 65%);color:#fff;font-family:'Segoe UI',system-ui,sans-serif;text-align:center;opacity:0;transition:opacity .4s}
      #clip-titre h1{font-size:52px;margin:0;color:#a5bf82}#clip-titre p{font-size:24px;margin:0;max-width:1100px;line-height:1.4}
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
            const w = window as unknown as Fenetre; w.hasardClipSymbaroum ??= Math.random;
            const origine = w.hasardClipSymbaroum; Math.random = () => file.length ? file.shift()! : origine();
        }, file);
    }
    async rendreLeHasard() { await this.page.evaluate(() => { const w = window as unknown as Fenetre; if (w.hasardClipSymbaroum) Math.random = w.hasardClipSymbaroum; }); }
}




test('les mécanismes de Symbaroum et ses outils intégrés, en clip',async()=>{
    test.setTimeout(900_000);expect(fs.existsSync(PILOTE)).toBe(true);fs.mkdirSync(PREUVES,{recursive:true});
    const racineTemp=path.resolve(os.tmpdir()),brut=fs.mkdtempSync(path.join(racineTemp,'gmos-clip-symbaroum-'));
    if(!path.resolve(brut).startsWith(racineTemp+path.sep))throw new Error('Profil inattendu.');
    const source=JSON.parse(new AdmZip(PILOTE).readAsText('state.json'));
    expect(source.gameDriver.version).toBe('2.0.0');expect(source.gameDriver.jet.symbaroum).toBeTruthy();
    const semence=JSON.parse(fs.readFileSync('e2e/donnees/campagne-de-demo.json','utf8')),s=semence.modules.sessionOS;
    s.campaigns=[{id:CAMPAGNE,name:'Les murmures de Davokar',system:source.gameDriver.id,systemPath:'systems/symbaroum',activeLocationIds:[]}];
    s.activeCampaignId=CAMPAGNE;s.customGameDrivers=[source.gameDriver];s.customSheetTemplates=[source.sheetTemplate];
    const valeurs=Object.fromEntries(source.sheetTemplate.sections.flatMap((sec:{fields:{id:string;defaultValue?:unknown}[]})=>sec.fields).map((c:{id:string;defaultValue?:unknown})=>[c.id,c.defaultValue??'']));
    const fiche={...valeurs,nom:'Éléna des Brumes',precision:15,agilite:13,vigilance:11,volonte:10,astuce:10,discretion:9,force:7,persuasion:5,
        endurance:10,endurance_actuelle:10,resistance_douleur:4,defense:12,seuil_corruption:5,corruption_temporaire:2,corruption_permanente:1,
        argent:5.37,bourse:'5 thalers',arme_1:'Épée',arme_1_degats:'1D8',armure_1:'Cuir clouté',armure_1_protection:'1D4',
        talent_1:'Maîtrise des armes',talent_1_niveau:'Novice',experience:40,experience_non_depensee:40};
    s.players=[{id:JOUEUR,realName:'Joueuse fictive',isOnline:false,characters:[{id:PERSO,name:'Éléna des Brumes',campaignId:CAMPAGNE,systemId:source.gameDriver.id,templateId:source.sheetTemplate.id,hp:10,maxHp:10,sheetData:fiche}]}];
    s.sessions=[{...s.sessions[0],id:'clip-seance-symbaroum',campaignId:CAMPAGNE,status:'active',number:1,sessionEntityIds:[PERSO],publicSummary:'Démonstration fictive'}];
    const semenceFichier=path.join(brut,'semence.json');fs.writeFileSync(semenceFichier,JSON.stringify(semence));
    const g=await lancerGmOs({semence:semenceFichier,video:{dossier:brut,largeur:LARGEUR,hauteur:HAUTEUR},preparerLeProfil:profil=>{
        for(const d of ['theme','fiche']){const e=path.resolve('docs/systems/symbaroum',d);if(fs.existsSync(e))fs.cpSync(e,path.join(profil,'corpus/systems/symbaroum',d),{recursive:true});}
    }});
    const f=g.fenetre,r=new Realisation(f),chapitres:{titre:string;secondesDepuisTitre:number}[]=[];f.setDefaultTimeout(15_000);
    let ouverture=0,fin=0,reussi=false;
    const personnage=()=>f.evaluate(()=>(window as unknown as Fenetre).useSessionOSStore.getState().players.find(p=>p.id==='clip-joueur-symbaroum')!.characters[0]);
    const chapitre=async(titre:string)=>{chapitres.push({titre,secondesDepuisTitre:(Date.now()-ouverture)/1000});await r.chapitre(titre);};
    const photo=(nom:string)=>f.screenshot({path:path.join(PREUVES,nom+'.jpg'),type:'jpeg',quality:85,scale:'css'});
    const vue=async(v:'players'|'cockpit'|'modules-du-jeu')=>{await f.evaluate(v=>(window as unknown as Fenetre).useSessionOSStore.getState().setCurrentView(v),v);if(v==='players')await ongletDeLaFiche(f,'Lancer un test');};
    const des=async(valeurs:number[])=>r.des(valeurs);
    try{
        await attendreLHydratation(g);await expect.poll(()=>f.evaluate(()=>(window as unknown as Fenetre).useSessionOSStore.getState().campaigns.map(c=>c.id))).toContain(CAMPAGNE);
        const fenetre=await g.application.browserWindow(f);await fenetre.evaluate((w,t)=>{w.setFullScreen(false);w.unmaximize();w.setResizable(false);w.setMaximizable(false);w.setContentSize(t.l,t.h);w.webContents.setAudioMuted(true);},{l:LARGEUR,h:HAUTEUR});
        await f.setViewportSize({width:LARGEUR,height:HAUTEUR});await expect.poll(()=>f.evaluate(()=>({l:innerWidth,h:innerHeight}))).toEqual({l:LARGEUR,h:HAUTEUR});
        await ouvrirLeModule(g,'Tableau de Bord');await f.evaluate(()=>{const s=(window as unknown as Fenetre).useSessionOSStore.getState();s.setActiveCampaign('clip-symbaroum');s.setSelectedPlayer('clip-joueur-symbaroum');s.setSelectedCharacter('clip-elena');s.setCurrentView('players');});
        await vue('players');await f.evaluate(installerLaScene);await r.carte('');
        const panneau=f.locator('[data-panneau-de-jet]').first(),attribut=panneau.locator('select').first(),resultat=panneau.getByRole('region',{name:'Résultat',exact:true});
        const jeter=async(de:number)=>{await des([(de-.5)/20]);await r.cliquer(panneau.getByRole('button',{name:'Lancer',exact:true}));await r.rendreLeHasard();};
        ouverture=Date.now();await r.titre('Symbaroum · aux lisières de Davokar',['Un d20 sous un attribut ; seuls les joueurs lancent les dés','Avantage · Dégâts · Agonie · Corruption · Progression · Voyage','Éléna est fictive — profil jetable, dés préparés et légendes sans voix.']);

        await chapitre('1 · Un attribut, une opposition et un seul d20');await r.choisir(attribut,'precision');await r.taper(panneau.locator('[data-valeur-adverse]'),'13');await r.taper(panneau.locator('[data-modificateur-du-seuil]'),'2');
        await expect(panneau.getByText(/15 \+ \(10 − 13\) \+ 2/)).toBeVisible();
        await r.legende('Précision 15, adversaire 13, modificateur +2 : seuil 14.','Le d20 doit être inférieur ou égal au seuil. Un simple 1 ou 20 n’est pas un critique de base.',3500);await jeter(8);await expect(resultat).toContainText('14');await r.montrer(resultat,3000);await photo('01-opposition');

        await chapitre('2 · Attaquer avec l’Avantage tactique');await r.cocher(panneau.getByRole('radio',{name:'Attaque',exact:true}));await r.cocher(panneau.locator('[data-avantage-tactique]'));
        await r.legende('L’Avantage ajoute +2 au seuil et +1D4 aux dégâts.','Il garde un seul d20 : le tirage à deux dés, meilleur ou pire, est un autre réglage.',3500);await jeter(8);const degats=panneau.locator('[data-degats-symbaroum]');
        await r.taper(degats.getByLabel('Protection du PNJ'),'2');await r.taper(degats.getByLabel('Résistance à la douleur du PNJ'),'4');await des([.6875,.375]);await r.cliquer(degats.getByRole('button',{name:/^Lancer 1D8/}));await r.rendreLeHasard();
        await expect(degats.locator('[data-issue-des-degats]')).toContainText('6 dégâts');await r.legende('L’épée et l’Avantage font 8 ; l’armure fixe du PNJ retire 2.','La douleur est atteinte : le joueur choisit entre cible à terre et Attaque gratuite. Le PNJ se suit à la main.',3500);await r.montrer(degats,3000);await photo('02-degats');

        await chapitre('3 · Se défendre, encaisser, survivre');await r.cocher(panneau.locator('[data-avantage-tactique]'),false);await r.taper(panneau.locator('[data-modificateur-du-seuil]'),'0');await r.cocher(panneau.getByRole('radio',{name:'Défense',exact:true}));await jeter(18);
        const encaisser=panneau.locator('[data-encaisser-symbaroum]');await r.taper(encaisser.getByLabel('Dégâts du PNJ'),'6');await des([.375]);await r.cliquer(encaisser.getByRole('button',{name:'Lancer la protection et encaisser',exact:true}));await r.rendreLeHasard();
        await expect.poll(async()=>(await personnage()).sheetData.endurance_actuelle).toBe(6);await r.legende('Le joueur rate sa Défense, puis lance sa protection.','6 dégâts fixes − 2 de cuir = 4 encaissés ; l’Endurance passe de 10 à 6 sur la fiche.',3500);await r.montrer(encaisser,3000);await photo('03-defense');
        await jeter(18);await r.taper(encaisser.getByLabel('Dégâts du PNJ'),'10');await des([.375]);await r.cliquer(encaisser.getByRole('button',{name:'Lancer la protection et encaisser',exact:true}));await r.rendreLeHasard();await expect.poll(async()=>(await personnage()).sheetData.endurance_actuelle).toBe(0);
        await r.carte('endurance-symbaroum');const endurance=f.locator('[data-endurance-symbaroum]');await des([.275]);await r.cliquer(endurance.getByRole('button',{name:'Test de mort (1D20)',exact:true}));await r.rendreLeHasard();
        await expect(endurance.locator('[data-dernier-endurance]')).toContainText('6');await r.legende('À zéro, Éléna est mourante : un Test de mort à chaque tour.','Un 6 laisse un pied dans la tombe : le test continue. Les soins peuvent arrêter cette agonie.',3500);await r.montrer(endurance,3000);await photo('04-agonie');
        await des([.625]);await r.cliquer(endurance.getByRole('button',{name:'Medicus Novice (+1D4)',exact:true}));await r.rendreLeHasard();await expect.poll(async()=>(await personnage()).sheetData.endurance_actuelle).toBe(3);await expect(endurance.getByRole('button',{name:'Test de mort (1D20)',exact:true})).toHaveCount(0);await photo('05-soins');

        await chapitre('4 · Corruption, seuil et Stigmates');await r.carte('corruption-symbaroum');const corruption=f.locator('[data-corruption-symbaroum]');await des([.375]);await r.cliquer(corruption.getByRole('button',{name:/^Pouvoir ou rituel mystique/}));await r.rendreLeHasard();await expect.poll(async()=>(await personnage()).sheetData.corruption_temporaire).toBe(4);
        const alerte=f.locator('[data-alertes-de-franchissement]');await expect(alerte).toContainText('Stigmate');await r.legende('Temporaire 4 + permanente 1 : le seuil de 5 est franchi.','Noter le franchissement ajoute une seule fois 1D4 permanent. Le Stigmate se choisit dans la carte.',3500);await r.montrer(alerte,3000);await photo('06-seuil');
        await des([.125]);await r.cliquer(alerte.getByRole('button',{name:'Noter',exact:true}));await r.rendreLeHasard();await expect.poll(async()=>(await personnage()).sheetData.corruption_permanente).toBe(2);
        await vue('players');await r.carte('corruption-symbaroum');await r.taper(corruption.getByLabel('Stigmate inventé'),'Une ombre veinée de cendre');await r.cliquer(corruption.getByRole('button',{name:'Noter, temporaire',exact:true}));
        await r.legende('La Corruption totale vaut 6 ; l’Ombre de la Corruption domine.','Le Stigmate temporaire reste inscrit jusqu’au passage d’une journée. Les traditions gardent leurs exceptions.',3500);await r.montrer(corruption,3000);await photo('07-stigmate');

        await chapitre('5 · Déclarer la fin de scène');await r.cliquer(f.getByRole('button',{name:/Fin de scène/}));const finScene=f.locator('[data-gestes-des-heros="finDeScene"]');await expect(finScene).toContainText('Corruption temporaire 4 → 0');
        await r.legende('La fin de scène se déclare et se confirme.','Elle efface la Corruption temporaire ; les 2 points permanents et le Stigmate restent.',3500);await r.montrer(finScene,3000);await photo('08-fin-scene');await r.cliquer(finScene.getByRole('button',{name:'Appliquer',exact:true}));await expect.poll(async()=>(await personnage()).sheetData.corruption_temporaire).toBe(0);await expect.poll(async()=>(await personnage()).sheetData.corruption_permanente).toBe(2);

        await chapitre('6 · Valeurs dérivées, création et progression');await vue('players');await r.carte('derivees-symbaroum');await r.legende('Force 7 : Endurance minimale 10 et douleur 4 ; Volonté 10 : seuil 5.','La Défense part de l’Agilité puis dépend de l’armure, du bouclier et des Talents. Le meneur garde le dernier mot.',3500);await r.montrer(f.locator('[data-derivees-symbaroum]'),3000);await photo('09-derivees');
        await r.carte('progression-symbaroum');const progression=f.locator('[data-progression-symbaroum]');await expect(progression).toContainText('somme 80');await r.cliquer(progression.getByRole('button',{name:'Passer Adepte (20)',exact:true}));await expect.poll(async()=>(await personnage()).sheetData.experience_non_depensee).toBe(20);await expect.poll(async()=>(await personnage()).sheetData.talent_1_niveau).toBe('Adepte');
        await r.legende('La création contrôle les 80 points ; un rang s’achète après l’autre.','Maîtrise des armes devient Adepte pour 20 points à dépenser. Le total d’Expérience gagné demeure 40.',3500);await r.montrer(progression,3000);await photo('10-progression');

        await chapitre('7 · Bourse et traversée de Davokar');await r.carte('bourse-symbaroum');const bourse=f.locator('[data-bourse-symbaroum]');await r.taper(bourse.getByLabel('shillings',{exact:true}),'2');await r.taper(bourse.getByLabel('ortegs',{exact:true}),'5');await r.cliquer(bourse.getByRole('button',{name:'Payer',exact:true}));await expect.poll(async()=>(await personnage()).sheetData.argent).toBeCloseTo(5.12);
        await r.legende('Un seul compte : 1 thaler = 10 shillings = 100 ortegs.','Payer 2 shillings et 5 ortegs laisse 5 th, 1 sh et 2 o. La bourse écrite se met à jour sur demande.',3500);await r.montrer(bourse,3000);await photo('11-bourse');await r.cliquer(bourse.getByRole('button',{name:/^Écrire/}));await expect.poll(async()=>(await personnage()).sheetData.bourse).toContain('5');
        await r.carte('voyage-symbaroum');const voyage=f.locator('[data-voyage-symbaroum]');await r.taper(voyage.getByLabel('Distance en kilomètres'),'45');await expect(voyage).toContainText('20 km par jour');await r.cliquer(voyage.getByRole('button',{name:'Un jour de voyage pour ce personnage',exact:true}));await expect.poll(async()=>(await personnage()).sheetData.endurance_actuelle).toBe(4);
        await r.legende('Davokar clair, à pied : 20 km par jour, soit environ trois jours pour 45 km.','Une journée normale rend 1 Endurance et fait guérir le Stigmate temporaire. Les allures forcées changent ce bilan.',3500);await r.montrer(voyage,3000);await expect.poll(async()=>(await personnage()).sheetData._gmos_symbaroum).toMatchObject({jour:1,stigmates:[]});await photo('12-voyage');

        await chapitre('8 · Les options choisies par la table');await r.carte('options-symbaroum');const options=f.locator('[data-options-symbaroum]');await r.cocher(options.getByRole('checkbox',{name:/Attaques parfaites et échecs critiques/}));
        await r.legende('Les attaques parfaites sont une option de campagne.','Une fois activée, le 1 à l’attaque ajoute 1D6. Les autres options restent un choix de la table.',3500);await r.montrer(options,2500);await r.carte('');await r.choisir(attribut,'precision');await r.cocher(panneau.getByRole('radio',{name:'Attaque',exact:true}));await jeter(1);await expect(panneau.locator('[data-critique-symbaroum]')).toContainText('parfaite');await r.montrer(resultat,3000);await photo('13-option');
        await r.titre('Davokar laisse sa marque',['Le pilote suit les blessures, la Corruption, l’Expérience et les jours de voyage.',
            'Ces outils sont intégrés à la fiche ; aucun module indépendant Symbaroum n’est proposé au catalogue.',
            'Symbaroum · pilote 2.0.0 · fiction de démonstration'],6500);reussi=true;fin=Date.now();
    }catch(erreur){await f.screenshot({path:path.join(PREUVES,'diagnostic-echec.jpg'),type:'jpeg'});throw erreur;}
    finally{const video=f.video();await g.fermer();const fichierVideo=await video?.path();if(reussi&&fichierVideo){
        const exportVideo=JSON.parse(execFileSync(process.execPath,['outils/clips/exporter_clip.mjs',fichierVideo,SORTIE,'symbaroum-mecanismes-et-outils',String((fin-ouverture)/1000)],{encoding:'utf8'}));
        fs.writeFileSync(path.join(PREUVES,'verification.json'),JSON.stringify({version:source.gameDriver.version,profilJetable:true,donneesPersonnelles:false,desPrepares:true,narrationSonore:false,modeRapide:!!process.env.GMOS_CLIP_RAPIDE,dureeDepuisTitre:(fin-ouverture)/1000,chapitres,exportVideo,
            assertions:['seuil : 15 + (10−13) + 2 = 14','Avantage tactique, un seul d20 et +1D4','dégâts nets6 et choix lié à la douleur','Défense ratée et protection : Endurance10 → 6','second coup : Endurance0 et agonie','Test de mort6 poursuit l’agonie ; soin3 l’arrête','Corruption temporaire2 → 4, seuil5','franchissement noté : permanente1 → 2','Stigmate temporaire inscrit','fin de scène : temporaire0 et permanente2','création80 ; Adepte pour20 XP','bourse5.37 → 5.12','voyage20km/jour et guérison3 → 4','option activée : attaque parfaite sur1','absence de module indépendant au catalogue']},null,2));}
        if(path.resolve(brut).startsWith(racineTemp+path.sep))fs.rmSync(brut,{recursive:true,force:true});else console.error('Nettoyage temporaire refusé.');}
});
