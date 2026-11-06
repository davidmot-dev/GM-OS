import { test, expect, type Locator, type Page } from '@playwright/test';
import AdmZip from 'adm-zip';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { lancerGmOs, attendreLHydratation, ouvrirLeModule, ongletDeLaFiche } from './lancerGmOs';
import type { useCombatStore } from '../src/modules/combat/useCombatStore';
import type { useDiceStore } from '../src/stores/useDiceStore';
import type { SuiviCH } from '../src/modules/dice/systemes/cthulhuHack';
import type { useSessionOSStore } from '../src/modules/session/useSessionOSStore';

/** David, 06/11/2026 : filmer les mécanismes particuliers de Cthulhu Hack avec Playwright.
 * Instance jetable, personnage et effets fictifs, vrais gestes, dés préparés.
 * npm run build puis npx playwright test e2e/clipCthulhuHack.spec.ts --reporter=list
 */
const PILOTE = path.resolve(process.env.GMOS_PILOTE_CTHULHU_HACK ?? 'output/clips/cthulhu-hack/pilote/Cthulhu-Hack-1.1.0.gmos-driver');
const SORTIE = path.resolve(process.env.GMOS_SORTIE_CLIP ?? 'output/clips');
const PREUVES = path.join(SORTIE, 'cthulhu-hack');
const CAMPAGNE = 'clip-cthulhu-hack', JOUEUR = 'clip-joueur-cthulhu-hack', PERSO = 'clip-edith';
const LARGEUR = 1440, HAUTEUR = 900;
type Fenetre = Window & { useSessionOSStore: typeof useSessionOSStore; useCombatStore: typeof useCombatStore; useDiceStore: typeof useDiceStore; hasardClipCthulhuHack?: () => number };

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
            const w = window as unknown as Fenetre; w.hasardClipCthulhuHack ??= Math.random;
            const origine = w.hasardClipCthulhuHack; Math.random = () => file.length ? file.shift()! : origine();
        }, file);
    }
    async rendreLeHasard() { await this.page.evaluate(() => { const w = window as unknown as Fenetre; if (w.hasardClipCthulhuHack) Math.random = w.hasardClipCthulhuHack; }); }
}




test('les mécanismes de Cthulhu Hack et ses outils intégrés, en clip',async()=>{
    test.setTimeout(900_000);expect(fs.existsSync(PILOTE)).toBe(true);fs.mkdirSync(PREUVES,{recursive:true});
    const racineTemp=path.resolve(os.tmpdir()),brut=fs.mkdtempSync(path.join(racineTemp,'gmos-clip-cthulhu-hack-'));
    if(!path.resolve(brut).startsWith(racineTemp+path.sep))throw new Error('Profil inattendu.');
    const source=JSON.parse(new AdmZip(PILOTE).readAsText('state.json'));expect(source.gameDriver.version).toBe('1.1.0');
    expect(fs.readFileSync('src/modules/modulesDuJeu/catalogue.ts','utf8')).not.toMatch(/cthulhu/i);
    const semence=JSON.parse(fs.readFileSync('e2e/donnees/campagne-de-demo.json','utf8')),s=semence.modules.sessionOS;
    s.campaigns=[{id:CAMPAGNE,name:'Le dossier du phare éteint',system:source.gameDriver.id,systemPath:'systems/cthulhu hack',activeLocationIds:[]}];
    s.activeCampaignId=CAMPAGNE;s.customGameDrivers=[source.gameDriver];s.customSheetTemplates=[source.sheetTemplate];
    const valeurs=Object.fromEntries(source.sheetTemplate.sections.flatMap((sec:{fields:{id:string;defaultValue?:unknown}[]})=>sec.fields).map((c:{id:string;defaultValue?:unknown})=>[c.id,c.defaultValue??'']));
    const fiche={...valeurs,force:12,dexterite:13,constitution:11,sagesse:12,intelligence:14,charisme:10,hp:12,fortune:0,mentalHealth:'d10',torche:'d8',bagou:'d6',richesse:'d6',materiel_1_nom:'Gilet renforcé',materiel_1:'d8',materiel_1_pa:3,competencesList:'Archiviste · enquêteuse fictive',descriptionText:'Valeurs d’exercice, dés préparés pour le film.'};
    s.players=['Edith Marsh','Nora Vale'].map((name,i)=>({id:i?JOUEUR+'-nora':JOUEUR,realName:'Joueur fictif '+(i+1),isOnline:false,characters:[{id:i?'clip-nora':PERSO,name,campaignId:CAMPAGNE,systemId:source.gameDriver.id,templateId:source.sheetTemplate.id,hp:12,maxHp:12,sheetData:{...fiche}}]}));
    s.sessions=[{...s.sessions[0],id:'clip-seance-cthulhu-hack',campaignId:CAMPAGNE,status:'active',number:1,sessionEntityIds:[PERSO,'clip-nora'],publicSummary:'Enquête fictive : le registre du phare révèle un passage sous la jetée.'}];
    const semenceFichier=path.join(brut,'semence.json');fs.writeFileSync(semenceFichier,JSON.stringify(semence));
    const g=await lancerGmOs({semence:semenceFichier,video:{dossier:brut,largeur:LARGEUR,hauteur:HAUTEUR},preparerLeProfil:profil=>{
        for(const d of ['theme','fiche']){const e=path.resolve('docs/systems/cthulhu hack',d);if(fs.existsSync(e))fs.cpSync(e,path.join(profil,'corpus/systems/cthulhu hack',d),{recursive:true});}
    }});
    const f=g.fenetre,r=new Realisation(f),chapitres:{titre:string;secondesDepuisTitre:number}[]=[];f.setDefaultTimeout(15_000);
    let ouverture=0,fin=0,reussi=false;
    const personnage=(id=PERSO)=>f.evaluate(id=>(window as unknown as Fenetre).useSessionOSStore.getState().players.flatMap(p=>p.characters).find(c=>c.id===id)!,id);
    const suivi=async(id=PERSO)=>(await personnage(id)).sheetData._gmos_cthulhu_hack as SuiviCH;
    const dernier=()=>f.evaluate(()=>(window as unknown as Fenetre).useDiceStore.getState().history[0]);
    const chapitre=async(titre:string)=>{chapitres.push({titre,secondesDepuisTitre:(Date.now()-ouverture)/1000});await r.chapitre(titre);};
    const photo=(nom:string)=>f.screenshot({path:path.join(PREUVES,nom+'.jpg'),type:'jpeg',quality:85,scale:'css'});
    const vue=async(nora=false)=>{await ouvrirLeModule(g,'Tableau de Bord');await f.evaluate(nora=>{const s=(window as unknown as Fenetre).useSessionOSStore.getState();s.setSelectedPlayer(nora?'clip-joueur-cthulhu-hack-nora':'clip-joueur-cthulhu-hack');s.setSelectedCharacter(nora?'clip-nora':'clip-edith');s.setCurrentView('players');},nora);await ongletDeLaFiche(f,'Lancer un test');};
    const hasard=async(file:number[],action:()=>Promise<void>)=>{await r.des(file.every(n=>n===file[0])?Array(200).fill(file[0]):file);try{await action();}finally{await r.rendreLeHasard();}};
    try{
        await attendreLHydratation(g);await expect.poll(()=>f.evaluate(()=>(window as unknown as Fenetre).useSessionOSStore.getState().campaigns.map(c=>c.id))).toContain(CAMPAGNE);
        const fenetre=await g.application.browserWindow(f);await fenetre.evaluate((w,t)=>{w.setFullScreen(false);w.unmaximize();w.setResizable(false);w.setMaximizable(false);w.setContentSize(t.l,t.h);w.webContents.setAudioMuted(true);},{l:LARGEUR,h:HAUTEUR});await f.setViewportSize({width:LARGEUR,height:HAUTEUR});
        await ouvrirLeModule(g,'Tableau de Bord');await f.evaluate(()=>{const w=window as unknown as Fenetre,s=w.useSessionOSStore.getState();s.setActiveCampaign('clip-cthulhu-hack');s.setSelectedPlayer('clip-joueur-cthulhu-hack');s.setSelectedCharacter('clip-edith');s.setCurrentView('players');const c=w.useCombatStore.getState();c.clearCombatants();for(const [name,id] of [['Edith Marsh','clip-edith'],['Nora Vale','clip-nora']])c.addCombatant({name,init:0,isPlayer:true,faction:'player',statuses:[],sourcePlayerId:id});});
        await vue();await f.evaluate(installerLaScene);await r.carte('');
        const panneau=f.locator('[data-panneau-de-jet]').first(),principal=panneau.locator('select').first(),tirage=panneau.getByTitle('Deux dés : l’Avantage garde le plus BAS, le Désavantage le plus haut',{exact:true}),resultat=panneau.getByRole('region',{name:'Résultat',exact:true});
        const suivre=()=>f.locator('[data-suivi-cthulhu-hack]').first();
        const jeter=async(des:number[])=>hasard(des.map(n=>(n-.5)/20),()=>r.cliquer(panneau.getByRole('button',{name:'Lancer',exact:true})));
        const pupitre=async()=>{await ouvrirLeModule(g,'Dice-OS');};
        const ressource=async(nom:string,face:number,faces:number)=>{
            await pupitre();await r.choisir(f.getByLabel('Mode',{exact:true}),'usure');await r.choisir(f.getByLabel('Personnage',{exact:true}),PERSO);
            await r.cliquer(f.getByRole('button',{name:new RegExp('^'+nom+' ')}));
            await hasard([(face-.5)/faces],()=>r.cliquer(f.getByRole('button',{name:'LANCER',exact:true})));
        };
        ouverture=Date.now();await r.titre('Cthulhu Hack · le dossier du phare éteint',['Sauvegardes au d20 et ressources qui s’usent','Fortune · Santé mentale · Hors Jeu · Variante Pulp','Personnages et valeurs d’exercice fictifs — profil jetable, dés préparés et légendes sans voix.']);

        await chapitre('1 · La Sauvegarde : rester sous la caractéristique');await r.choisir(principal,'sagesse');await r.choisir(tirage,'avantage');await jeter([16,6]);await expect(resultat).toContainText('6');await expect(resultat).toContainText(/réussite/i);
        await r.legende('Sagesse 12 : réussir avec un d20 inférieur ou égal à douze.','Avec Avantage, on garde ici 6 plutôt que 16. Un 1 est critique ; un 20 apporte une complication.',3300);await r.montrer(resultat,2800);await photo('01-sauvegarde');
        await r.choisir(tirage,'desavantage');await jeter([16,6]);await expect(panneau.locator('[data-fortune]')).toBeVisible();
        await r.legende('Avec Désavantage, le même couple de dés conserve seize : échec.','Le choix de tirage reste affiché après le lancer ; il faut le modifier pour le test suivant.',3300);await r.montrer(resultat,2800);await photo('02-desavantage');

        await chapitre('2 · Fortune : placer des jetons, puis laisser le MJ les défausser');
        // La relance conserve les conditions du jet précédent : deux dés avec Désavantage.
        await hasard([.875,.675],()=>r.cliquer(panneau.getByRole('button',{name:'Relancer (+1 Fortune)',exact:true})));await expect.poll(async()=>(await personnage()).sheetData.fortune).toBe(1);await expect(panneau.getByRole('button',{name:'Réussir (+2 Fortune)',exact:true})).toBeDisabled();
        await r.legende('Un jeton placé permet de relancer ; deux permettent de réussir.','La fiche porte au maximum deux jetons : avec un jeton déjà placé, « Réussir (+2) » est bloqué.',3300);await r.montrer(panneau.locator('[data-fortune]'),2800);await photo('03-fortune');
        await hasard([.175,.075],()=>r.cliquer(panneau.getByRole('button',{name:'Relancer (+1 Fortune)',exact:true})));await expect.poll(async()=>(await personnage()).sheetData.fortune).toBe(2);
        let p=suivre();await r.cliquer(p.getByText('Fortune — défausse du MJ',{exact:true}));await r.choisir(p.getByLabel('Effet de Fortune MJ',{exact:true}),'menace');await r.cliquer(p.getByRole('button',{name:'Défausser et appliquer',exact:true}));await expect.poll(async()=>(await personnage()).sheetData.fortune).toBe(0);
        await r.legende('Le MJ défausse deux jetons pour introduire une nouvelle Menace.','Les jetons libèrent la fiche. Le meneur décrit la menace ; aucune génération narrative n’est déclenchée.',3300);await r.montrer(p,2800);await photo('04-fortune-mj');

        await r.choisir(tirage,'aucun');
        await chapitre('3 · Enquête et Matériel : les dés d’usure gardent leur trace');
        await r.legende('Le registre du phare révèle un passage sous la jetée : l’indice est donné.','Le dé de Torche règle ensuite le coût de la découverte : sur 1 ou 2, la ressource décline.',3300);await ressource('Torche',2,8);await expect.poll(async()=>(await personnage()).sheetData.torche).toBe('d6');await expect.poll(async()=>(await dernier()).usure).toEqual({avant:8,apres:6});
        await r.legende('Deux sur d8 : Torche descend à d6. L’indice reste acquis.','Le « Oui, mais » appelle une complication jouée à la table. Sur 3 ou plus, le dé reste intact.',3300);await r.montrer(f.getByRole('button',{name:/^Torche /}),2800);await photo('05-enquete');
        await ressource('Gilet renforcé',2,8);await expect.poll(async()=>{const c=await personnage();return[c.sheetData.materiel_1,c.sheetData.materiel_1_pa];}).toEqual(['d6',2]);
        await r.legende('L’armure déclarée perd un PA quand son dé de Matériel décline.','Le gilet passe de d8 à d6 et de trois à deux PA. Son dé se teste à la fin du combat.',3300);await vue();p=suivre();await r.cliquer(p.getByText('Armures — protection déclarée',{exact:true}));await r.montrer(p,2800);await photo('06-armure-usee');await pupitre();
        await r.cliquer(f.locator('[data-suites-du-jet]').getByRole('button',{name:'Réussir (+2)',exact:true}));await expect.poll(async()=>{const c=await personnage();return[c.sheetData.materiel_1,c.sheetData.materiel_1_pa,c.sheetData.fortune];}).toEqual(['d8',3,2]);
        await r.legende('La Fortune sauve ce déclin : le dé et le PA perdus reviennent ensemble.','Deux jetons sont placés sur la fiche. Cette annulation ne répare pas une autre usure.',3300);await vue();p=suivre();await r.cliquer(p.getByText('Armures — protection déclarée',{exact:true}));await r.montrer(p,2800);await photo('07-armure-sauvee');

        await chapitre('4 · Santé mentale : le déclin ouvre une Folie ou un Choc');await ressource('Santé mentale',2,10);await expect.poll(async()=>(await personnage()).sheetData.mentalHealth).toBe('d8');const suites=f.locator('[data-suites-du-jet]');await expect(suites.getByRole('button',{name:'Folie passagère',exact:true})).toBeVisible();
        await r.legende('La Santé mentale passe de d10 à d8 : une suite doit être résolue.','Folie passagère selon le livre, ou Choc plus court au choix du meneur. Une seule suite par jet.',3300);await r.montrer(suites,2800);await photo('08-declin-mental');
        await hasard([.25,.25],()=>r.cliquer(suites.getByRole('button',{name:'Choc',exact:true})));await expect.poll(async()=>(await suivi()).effets.map(e=>e.nom)).toContain('Confus');await vue();p=suivre();
        await r.legende('Le D6 du Choc donne Confus ; sa durée tirée est de deux Moments.','Le résultat de la table entre au pupitre et dans le suivi. Intelligence, Sagesse et Charisme subissent un Désavantage.',3300);await r.montrer(p,2800);await photo('09-choc');

        await chapitre('5 · Les effets suivent le temps confirmé de la fiction');await r.choisir(principal,'sagesse');await r.choisir(tirage,'aucun');await jeter([5,17]);await expect(resultat).toContainText('17');
        await r.legende('Le Désavantage de Confus s’applique au test de Sagesse.','Même avec « Normal » sélectionné, l’effet actif retient ici dix-sept plutôt que cinq.',3300);await r.montrer(resultat,2800);await photo('10-effet-au-jet');
        p=suivre();await r.cliquer(p.getByText('Temps de jeu et effets',{exact:true}));await r.cliquer(p.getByRole('button',{name:'Avancer de 1 moment(s)',exact:true}));await expect(p.getByText('1 Moment(s) restant(s).',{exact:true})).toBeVisible();
        await r.legende('Le MJ confirme un Moment : il en reste un à subir.','Les Moments sont séparés des minutes et des heures. Une fin de scène n’expire que les effets qui y sont liés.',3300);await r.montrer(p,2800);await photo('11-duree');await r.cliquer(p.getByRole('button',{name:'Avancer de 1 moment(s)',exact:true}));await expect(p.getByText('Confus',{exact:true})).toHaveCount(0);

        await chapitre('6 · Hors Jeu standard : le danger, les pertes, puis la récupération');await ouvrirLeModule(g,'Combat-OS');const carte=f.locator('[data-combattant]').filter({has:f.getByText('Edith Marsh',{exact:true})});
        await r.taper(carte.getByTitle('Intensité',{exact:true}),'12');await r.cliquer(carte.getByTitle('Infliger dégâts',{exact:true}));await expect.poll(async()=>(await personnage()).sheetData.hp).toBe(0);p=carte.locator('[data-suivi-cthulhu-hack]');await expect(p.getByRole('button',{name:'Tirer le D10 de Hors Jeu',exact:true})).toBeDisabled();
        await r.legende('À zéro PV, le Hors Jeu standard attend que le danger soit écarté.','Les douze dégâts saisis sont nets : armure et couvert ont déjà été retirés par le MJ.',3300);await r.montrer(p,2800);await photo('12-hors-jeu');await r.cocher(p.getByLabel('Le danger est écarté (confirmation du MJ)',{exact:true}));await hasard([.15],()=>r.cliquer(p.getByRole('button',{name:'Tirer le D10 de Hors Jeu',exact:true})));
        await r.taper(p.getByLabel('Perte Force',{exact:true}),'5');await r.taper(p.getByLabel('Perte Sagesse',{exact:true}),'1');await expect.poll(async()=>(await personnage()).sheetData.force).toBe(12);
        await r.legende('Deux : Détruit. Répartir six points entre exactement deux Sauvegardes.','L’aperçu propose Force 12 → 7 et Sagesse 12 → 11 ; les pertes restent en attente de confirmation.',3300);await r.montrer(p,2800);await photo('13-pertes');await r.cliquer(p.getByRole('button',{name:'Confirmer les pertes permanentes',exact:true}));await expect.poll(async()=>{const c=await personnage();return[c.sheetData.force,c.sheetData.sagesse];}).toEqual([7,11]);await expect(p.getByRole('button',{name:'Confirmer les pertes permanentes',exact:true})).toHaveCount(0);
        await hasard([.625],()=>r.cliquer(p.getByRole('button',{name:'Danger écarté : récupérer 1D4 PV',exact:true})));await expect.poll(async()=>(await personnage()).sheetData.hp).toBe(3);await expect(p.getByRole('button',{name:'Danger écarté : récupérer 1D4 PV',exact:true})).toHaveCount(0);
        await r.legende('Les pertes confirmées s’appliquent une fois ; le D4 rend ici trois PV.','Une seule récupération pour cette chute. Les caractéristiques perdues restent diminuées.',3300);await r.montrer(p,2800);await photo('14-recuperation');

        await chapitre('7 · Variante Pulp : les blessures à zéro PV s’accumulent');await vue(true);p=suivre();await r.cocher(p.getByLabel('Variante Pulp (livre p. 50)',{exact:true}));await ouvrirLeModule(g,'Combat-OS');const nora=f.locator('[data-combattant]').filter({has:f.getByText('Nora Vale',{exact:true})});
        await r.taper(nora.getByTitle('Intensité',{exact:true}),'12');await r.cliquer(nora.getByTitle('Infliger dégâts',{exact:true}));p=nora.locator('[data-suivi-cthulhu-hack]');await expect(p.getByRole('button',{name:'Tirer le D10 de Hors Jeu',exact:true})).toBeEnabled();await hasard([.85],()=>r.cliquer(p.getByRole('button',{name:'Tirer le D10 de Hors Jeu',exact:true})));
        await r.taper(nora.getByTitle('Intensité',{exact:true}),'1');await r.cliquer(nora.getByTitle('Infliger dégâts',{exact:true}));await hasard([.85],()=>r.cliquer(p.getByRole('button',{name:'Tirer le D10 de Hors Jeu',exact:true})));await expect(p).toContainText('D10 9 − 1 = 8');await expect.poll(async()=>(await personnage('clip-nora')).sheetData.hp).toBe(0);await expect(p.getByRole('button',{name:'Danger écarté : récupérer 1D4 PV',exact:true}).first()).toBeDisabled();
        await r.legende('Nora, en Pulp, tire immédiatement et reste à zéro PV.','Le premier neuf donne Essoufflé. Une nouvelle blessure tire encore : neuf − un = huit, Titubant. Aucun PV rendu pendant le combat.',3300);await r.montrer(p,2800);await photo('15-pulp');
        await r.cocher(p.getByLabel('Le danger est écarté (confirmation du MJ)',{exact:true}));await hasard([.375],()=>r.cliquer(p.getByRole('button',{name:'Danger écarté : récupérer 1D4 PV',exact:true}).first()));await expect.poll(async()=>(await personnage('clip-nora')).sheetData.hp).toBe(2);await expect(p.getByRole('button',{name:'Danger écarté : récupérer 1D4 PV',exact:true})).toHaveCount(0);

        await chapitre('8 · Table-OS : retrouver les trois tables du jeu');await ouvrirLeModule(g,'Tables Aléatoires');const univers=f.locator('select:visible').nth(0),table=f.locator('select:visible').nth(1);await r.choisir(univers,'Cthulhu Hack');await expect.poll(()=>table.locator('option').allTextContents()).toContain('chocs');await r.choisir(table,'chocs');
        await hasard([.92],()=>r.cliquer(f.getByRole('button',{name:/Lancer.*1d6/i})));await expect(f.getByText('Hurlement',{exact:true}).first()).toBeVisible();
        await r.legende('Table-OS expose Chocs, Folies passagères et Conséquences du Hors Jeu.','Ce tirage libre de Hurlement sert de référence : il n’ajoute aucun effet à la fiche. Les boutons liés le font.',3300);await r.montrer(table,2800);await photo('16-tables');await r.choisir(table,'folies_passageres');await r.pause(1500);await r.choisir(table,'consequences_du_hors_jeu');await r.pause(1500);
        await r.titre('L’indice avance ; les ressources s’épuisent',['Sauvegardes · Fortune · Dés d’usure · Effets mentaux · Hors Jeu · Pulp',
            'Outils intégrés de la fiche, de Dice-OS, Combat-OS et Table-OS ; aucun module indépendant dédié.',
            'Cthulhu Hack · pilote 1.1.0 · valeurs d’exercice fictives · sélection de mécanismes'],6500);reussi=true;fin=Date.now();
    }catch(erreur){await f.screenshot({path:path.join(PREUVES,'diagnostic-echec.jpg'),type:'jpeg'});throw erreur;}
    finally{const video=f.video();await g.fermer();const fichierVideo=await video?.path();if(reussi&&fichierVideo){
        const exportVideo=JSON.parse(execFileSync(process.execPath,['outils/clips/exporter_clip.mjs',fichierVideo,SORTIE,'cthulhu-hack-mecanismes-et-outils',String((fin-ouverture)/1000)],{encoding:'utf8'}));
        fs.writeFileSync(path.join(PREUVES,'verification.json'),JSON.stringify({version:source.gameDriver.version,profilJetable:true,donneesPersonnelles:false,desPrepares:true,narrationSonore:false,modeRapide:!!process.env.GMOS_CLIP_RAPIDE,dureeDepuisTitre:(fin-ouverture)/1000,chapitres,exportVideo,
            assertions:['sauvegarde Sagesse12 : Avantage6, Désavantage16','Fortune0 → 1 → 2 et limite2','FortuneMJ Menace : 2 → 0','Torche d8 → d6','gilet d8 → d6, PA3 → 2','Fortune sauve déclin : d8, PA3, Fortune2','Santé mentale d10 → d8','Choc Confus, deux Moments','Désavantage mental automatique :17','deux Moments confirmés font expirer Confus','HorsJeu standard : danger requis','Détruit : six points sur deux Sauvegardes, aperçu sans perte','confirmation unique Force12 → 7, Sagesse12 → 11','D4 récupération unique : hp3','Pulp explicite : tirages immédiats9 puis9−1=8','Pulp : récupération après danger uniquement, hp2 et une fois','TableOS : Chocs, Folies, HorsJeu ; tirage libre Hurlement','absence de module indépendant au catalogue']},null,2));}
        if(path.resolve(brut).startsWith(racineTemp+path.sep))fs.rmSync(brut,{recursive:true,force:true});else console.error('Nettoyage temporaire refusé.');}
});
