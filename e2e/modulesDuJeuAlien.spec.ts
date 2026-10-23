import { test, expect, type Browser, type BrowserContext, type Page } from '@playwright/test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { lancerGmOs, attendreLHydratation, type GmOsLance } from './lancerGmOs';
import { creerSemenceAlien } from '../outils/modules-du-jeu/recette-alien.mjs';
import type { useSessionOSStore } from '../src/modules/session/useSessionOSStore';
import type { VueDesModulesMJ, SauvegardeDesModules } from '../src/modules/modulesDuJeu/protocole';
import type { VueMuthurMJ } from '../outils/alien/modules/muthur/moteur.mjs';

/** A4/A6 : vrai Electron, vrai HTTP/WebSocket et deux navigateurs sans pont natif.
 * Aucun profil personnel ni pilote exporté lu ; sorties seulement dans scratch/.
 * Le son est produit par Web Audio mais le navigateur est muet pour les enceintes.
 */
const ICI = path.dirname(fileURLToPath(import.meta.url));
const SORTIE = path.join(ICI, '../scratch/modules-du-jeu-e2e');
const CAMPAGNE = 'temoin-campagne';
type Magasins = { useSessionOSStore: typeof useSessionOSStore };
interface Sonde {
    sockets: WebSocket[];
    paquets: { type: string; payload?: Record<string, unknown> }[];
    sons: { actifs: number; demarres: number; fermes: number };
}
type FenetreSonde = Window & typeof globalThis & { sondeAlien: Sonde };
let gmos: GmOsLance;
let semence: string;
let dossierSemence: string;
let contextes: BrowserContext[] = [];

test.use({ channel: 'msedge', locale: 'fr-FR', timezoneId: 'Europe/Brussels', serviceWorkers: 'block', launchOptions: { args: ['--mute-audio'] } });
test.setTimeout(120_000);
test.beforeAll(async () => {
    fs.mkdirSync(SORTIE, { recursive: true });
    const demo = await creerSemenceAlien();
    dossierSemence = fs.mkdtempSync(path.join(os.tmpdir(), 'gmos-alien-semence-'));
    semence = path.join(dossierSemence, 'fiction.json'); fs.writeFileSync(semence, JSON.stringify(demo));
});
test.beforeEach(async () => { contextes = []; gmos = await demarrer(); });
test.afterEach(async () => {
    for (const contexte of contextes) await contexte.close();
    await gmos?.fermer();
});
test.afterAll(() => { if (dossierSemence) fs.rmSync(dossierSemence, { recursive: true, force: true }); });

async function demarrer(sauvegarde?: SauvegardeDesModules) {
    const instance = await lancerGmOs({ semence, preparerLeProfil: sauvegarde ? profil => {
        fs.mkdirSync(path.join(profil, 'modules-du-jeu'), { recursive: true });
        fs.writeFileSync(path.join(profil, 'modules-du-jeu/instances.json'), JSON.stringify(sauvegarde));
    } : undefined });
    await attendreLHydratation(instance);
    await expect(instance.fenetre.locator('[data-ecran-d-accueil]')).toHaveCount(0, { timeout: 20_000 });
    const cadre = await instance.application.browserWindow(instance.fenetre);
    await cadre.evaluate(w => { w.setContentSize(1440, 1000); w.webContents.setAudioMuted(true); });
    await instance.fenetre.evaluate(() => (window as unknown as Magasins).useSessionOSStore.getState().setCurrentView('cockpit'));
    await instance.fenetre.getByRole('button', { name: 'Modules du jeu', exact: true }).click();
    await expect(instance.fenetre.getByRole('button', { name: 'Tout couper', exact: true })).toBeVisible();
    return instance;
}
function carte(libelle: string) {
    return gmos.fenetre.locator('article').filter({ has: gmos.fenetre.getByRole('heading', { name: libelle, exact: true }) });
}
async function pupitre(libelle: string) {
    const bouton = carte(libelle).getByRole('button', { name: 'Ouvrir le pupitre', exact: true });
    if (await bouton.count()) await bouton.click();
    return gmos.fenetre.locator(libelle === 'MU/TH/UR 6000' ? '.gmos-muthur' : '.gmos-detecteur');
}
async function autoriser(libelle: string, personnage: string, actif = true) {
    const casePj = carte(libelle).getByRole('checkbox', { name: personnage, exact: true });
    // La case reflète l'ACK natif, sans modification optimiste avant l'écriture.
    if (await casePj.isChecked() !== actif) await casePj.click();
    await expect(casePj).toBeChecked({ checked: actif });
    await expect(casePj).toBeEnabled();
}
async function vueMJ(): Promise<VueDesModulesMJ> {
    return gmos.fenetre.evaluate(() => window.appBridge!.modulesDuJeu!.lire());
}
async function photographier(page: Page, nom: string) {
    await page.screenshot({ path: path.join(SORTIE, `${nom}.jpg`), quality: 85, animations: 'disabled' });
}
async function instrument(page: Page, libelle: string) {
    const nav = page.getByRole('navigation', { name: 'Navigation Hub' });
    await nav.getByRole('button', { name: 'Modules du jeu', exact: true }).click();
    const retour = page.getByRole('button', { name: 'Retour aux modules', exact: true });
    if (await retour.count()) await retour.click();
    await page.getByRole('button', { name: `Ouvrir ${libelle}`, exact: true }).click();
    return page.locator(libelle === 'MU/TH/UR 6000' ? '.gmos-muthur' : '.gmos-detecteur');
}
async function rejoindre(browser: Browser, personnage: string, largeur = 768, tactile = false) {
    const contexte = await browser.newContext({ viewport: { width: largeur, height: 1000 }, isMobile: tactile, hasTouch: tactile,
        locale: 'fr-FR', timezoneId: 'Europe/Brussels', serviceWorkers: 'block', reducedMotion: 'reduce' });
    contextes.push(contexte);
    await contexte.route('**/*', route => {
        const url = new URL(route.request().url());
        return url.hostname === '127.0.0.1' || ['data:', 'blob:'].includes(url.protocol) ? route.continue() : route.abort();
    });
    await contexte.addInitScript(id => {
        localStorage.setItem('gmos-tablet-uuid', id);
        const w = window as FenetreSonde;
        const sonde: Sonde = { sockets: [], paquets: [], sons: { actifs: 0, demarres: 0, fermes: 0 } };
        w.sondeAlien = sonde;
        const Socket = window.WebSocket;
        window.WebSocket = class extends Socket {
            constructor(url: string | URL, protocols?: string | string[]) {
                super(url, protocols); sonde.sockets.push(this);
                this.addEventListener('message', e => { try { sonde.paquets.push(JSON.parse(e.data)); } catch { /* Messages non JSON sans intérêt ici. */ } });
            }
        };
        const Audio = window.AudioContext;
        if (Audio) window.AudioContext = class extends Audio {
            private retraits = new Set<() => void>();
            createOscillator() {
                const oscillateur = super.createOscillator(), start = oscillateur.start.bind(oscillateur);
                let actif = false;
                oscillateur.start = quand => { actif = true; sonde.sons.actifs++; sonde.sons.demarres++; start(quand); };
                const retirer = () => { if (actif) { sonde.sons.actifs--; actif = false; } this.retraits.delete(retirer); };
                this.retraits.add(retirer); oscillateur.addEventListener('ended', retirer);
                return oscillateur;
            }
            async close() {
                await super.close();
                // Fermer le contexte stoppe le graphe sans forcément émettre « ended ».
                this.retraits.forEach(retirer => retirer()); sonde.sons.fermes++;
            }
        };
    }, 'alien-e2e-' + personnage.replaceAll(' ', '-').toLowerCase());
    const page = await contexte.newPage();
    await page.goto(`http://127.0.0.1:${gmos.ports.sync}/?window=tablet&sync=${gmos.ports.sync}`);
    expect(await page.evaluate(() => !!window.appBridge)).toBe(false);
    await page.getByRole('button', { name: new RegExp(personnage) }).click();
    await expect(page.getByText('Connecté', { exact: true })).toBeVisible();
    return { page, contexte };
}
async function saisir(page: Page, texte: string) {
    await page.getByLabel('Commande ou /M votre question', { exact: true }).fill(texte);
    await page.getByRole('button', { name: 'Transmettre', exact: true }).click();
    await expect(page.getByLabel('Commande ou /M votre question', { exact: true })).toHaveValue('');
}
async function sansDebordement(page: Page) {
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
}

/** Capture le panneau complet sans les masques des ancêtres défilants ; restaure avant toute assertion. */
async function capturerPanneauA8(page:Page, cible:ReturnType<Page['locator']>, nom:string) {
    await cible.evaluate(element=>{
        const anciens:{element:HTMLElement;style:string|null}[]=[];
        for(let parent=element.parentElement;parent;parent=parent.parentElement){
            anciens.push({element:parent,style:parent.getAttribute('style')});
            parent.style.setProperty('overflow','visible','important');parent.style.setProperty('height','auto','important');
            parent.style.setProperty('max-height','none','important');parent.style.setProperty('contain','none','important');
        }
        element.setAttribute('data-capture-alien-a8','');
        const ancienStyle=element.getAttribute('style'),module=element.closest('.gmos-muthur,.gmos-detecteur');
        if(module)(element as HTMLElement).style.setProperty('background-color',getComputedStyle(module).backgroundColor,'important');
        const style=document.createElement('style');style.textContent='body * { visibility:hidden!important; } [data-capture-alien-a8], [data-capture-alien-a8] * { visibility:visible!important; } [data-capture-alien-a8] .muthur-journal-contenu { max-height:none!important; overflow:visible!important; }';document.head.append(style);
        (window as unknown as {restaurerCaptureA8:()=>void}).restaurerCaptureA8=()=>{
            style.remove();element.removeAttribute('data-capture-alien-a8');
            if(ancienStyle===null)element.removeAttribute('style');else element.setAttribute('style',ancienStyle);
            for(const p of anciens)if(p.style===null)p.element.removeAttribute('style');else p.element.setAttribute('style',p.style);
        };
    });
    try { await cible.screenshot({path:path.join(SORTIE,`${nom}.jpg`),quality:85,animations:'disabled'}); }
    finally { await page.evaluate(()=>(window as unknown as {restaurerCaptureA8:()=>void}).restaurerCaptureA8()); }
}

test('A8 : plan privé, scan payé une fois, dossiers d’acte et remise au seul opérateur', async ({ browser }) => {
    test.setTimeout(180_000);
    const nel=await rejoindre(browser,'Nel Varga',360),idris=await rejoindre(browser,'Idris Koa',768);
    for(const nom of ['Nel Varga','Idris Koa']) {
        await autoriser('Détecteur de mouvement',nom); await autoriser('MU/TH/UR 6000',nom);
    }
    const commander=async(moduleId:string,id:string,charge:unknown)=>{
        const vue=await vueMJ();
        return gmos.fenetre.evaluate(async({vue,moduleId,id,charge})=>window.appBridge!.modulesDuJeu!.commander({
            campagneId:vue.campagneId!,contexte:vue.contexte,requeteId:crypto.randomUUID(),moduleId,commande:{id,charge},
        }),{vue,moduleId,id,charge});
    };
    const agir=async(id:string,charge:unknown)=>expect(await commander('alien-detecteur',id,charge)).toEqual({ok:true});
    await agir('zone-discrete',{id:'sas',nom:'Sas',x:0,y:0,liens:[]});
    await agir('zone-discrete',{id:'couloir',nom:'Couloir',x:25,y:0,liens:['sas']});
    await agir('zone-discrete',{id:'soute',nom:'Soute',x:50,y:0,liens:['couloir']});
    for(const [id,nom,zoneId,mobile] of [['nel','Nel Varga','sas',false],['menace-secrete','Rôdeur dissimulé','couloir',true],['immobile-secret','Créature immobile','soute',false]] as const)
        await agir('pion-discret',{id,nom,zoneId,humain:id==='nel',limite:id==='nel'?2:3,mobile,detectable:true});
    await agir('regler-discret',{terrain:'interieur',energie:5,porteurId:'nel'});await agir('mode-discret',{actif:true});
    const poste=await pupitre('Détecteur de mouvement');
    await poste.getByRole('button',{name:'Scanner ce Tour et tester l’Énergie',exact:true}).click();
    await expect(poste.getByRole('button',{name:'Scanner ce Tour et tester l’Énergie',exact:true})).toBeDisabled();
    await expect(poste.getByText(/Scan du Tour 1 · Énergie/)).toBeVisible();
    await capturerPanneauA8(gmos.fenetre,poste.getByRole('region',{name:'Mode discret du détecteur'}),'jeu-alien-a8-plan-mj');
    for(const appareil of [nel,idris]) {
        await instrument(appareil.page,'Détecteur de mouvement');
        await expect(appareil.page.getByText('Couloir : 1 écho',{exact:true})).toBeVisible();
        await expect(appareil.page.getByText('Créature immobile',{exact:true})).toHaveCount(0);
        const publicRecu=await appareil.page.evaluate(()=>JSON.stringify((window as FenetreSonde).sondeAlien.paquets.filter(p=>p.type==='modules:vue')));
        expect(publicRecu).not.toMatch(/menace-secrete|Rôdeur dissimulé|immobile-secret|porteurId|"liens"/);
    }
    for(const largeur of [360,768,1180]) {
        await nel.page.setViewportSize({width:largeur,height:1000}); await sansDebordement(nel.page);
        await capturerPanneauA8(nel.page,nel.page.locator('.gmos-detecteur'),`jeu-alien-a8-detecteur-${largeur}`);
    }
    await nel.page.reload();await expect(nel.page.getByText('Connecté',{exact:true})).toBeVisible();await instrument(nel.page,'Détecteur de mouvement');
    await expect(nel.page.getByText('Couloir : 1 écho',{exact:true})).toBeVisible();
    expect(await commander('alien-detecteur','scanner-discret',{tour:1})).toMatchObject({ok:false});
    const terminal=await pupitre('MU/TH/UR 6000');await terminal.getByRole('button',{name:'Actes',exact:true}).click();
    await terminal.getByLabel('Scénario (nom unique)',{exact:true}).fill('Quarantaine');
    await terminal.getByLabel('Destinataire de l’objectif',{exact:true}).selectOption({label:'Nel Varga'});
    await terminal.getByLabel('Objectif secret (MJ uniquement)',{exact:true}).fill('Sauver les prélèvements avant l’évacuation.');
    await terminal.getByRole('button',{name:'Conserver le brouillon de l’objectif',exact:true}).click();
    await terminal.getByLabel('Identifiant pour READ',{exact:true}).fill('rapport-quarantaine');
    await terminal.getByLabel('Titre du dossier d’acte',{exact:true}).fill('Rapport de quarantaine');
    await terminal.getByLabel('Contenu du dossier d’acte',{exact:true}).fill('Le laboratoire attend les prélèvements.');
    await terminal.getByLabel('Accès après publication',{exact:true}).selectOption('code');
    await terminal.getByLabel('Code du dossier d’acte',{exact:true}).fill('0081');
    await terminal.getByRole('button',{name:'Conserver le brouillon du dossier',exact:true}).click();
    const avantRemise=await nel.page.evaluate(()=>JSON.stringify((window as FenetreSonde).sondeAlien.paquets.filter(p=>p.type==='modules:vue')));
    expect(avantRemise).not.toContain('Sauver les prélèvements');expect(avantRemise).not.toContain('Rapport de quarantaine');
    await terminal.getByRole('button',{name:'Publier ce dossier dans MU/TH/UR',exact:true}).click();
    await terminal.getByRole('button',{name:'Remettre dans le terminal privé',exact:true}).click();
    await expect(terminal.getByRole('button',{name:'Objectif déjà remis',exact:true})).toBeDisabled();
    await capturerPanneauA8(gmos.fenetre,terminal.getByRole('region',{name:'Préparations des actes'}),'jeu-alien-a8-actes-mj');
    await instrument(nel.page,'MU/TH/UR 6000');await instrument(idris.page,'MU/TH/UR 6000');
    await expect(nel.page.getByText(/Sauver les prélèvements avant l’évacuation/)).toBeVisible();
    await expect(idris.page.getByText(/Sauver les prélèvements avant l’évacuation/)).toHaveCount(0);
    await saisir(nel.page,'CODE 0081');
    const dossierId=((await vueMJ()).modules.find(m=>m.id==='alien-muthur')!.vue as VueMuthurMJ).actes[0].dossiers[0].id;
    await saisir(nel.page,`READ ${dossierId}`);await expect(nel.page.getByText(/Le laboratoire attend les prélèvements\./).first()).toBeVisible();
    expect(await idris.page.evaluate(()=>JSON.stringify((window as FenetreSonde).sondeAlien.paquets.filter(p=>p.type==='modules:vue')))).not.toContain('Le laboratoire attend');
    await nel.page.reload();await expect(nel.page.getByText('Connecté',{exact:true})).toBeVisible();await instrument(nel.page,'MU/TH/UR 6000');
    await expect(nel.page.getByText(/Sauver les prélèvements avant l’évacuation/)).toBeVisible();
    await nel.page.setViewportSize({width:360,height:1000});await sansDebordement(nel.page);
    await capturerPanneauA8(nel.page,nel.page.locator('.gmos-muthur'),'jeu-alien-a8-terminal-360');
});

for (const largeur of [390, 1024]) test(`HACK : animation effective dans le vrai Tablet Hub à ${largeur} px, puis expiration après cinq secondes`, async ({ browser }) => {
    const nel = await rejoindre(browser, 'Nel Varga', largeur, true);
    await nel.page.emulateMedia({ reducedMotion: 'no-preference' });
    await autoriser('MU/TH/UR 6000', 'Nel Varga');
    await instrument(nel.page, 'MU/TH/UR 6000');
    await expect(nel.page.getByRole('log', { name: 'Dialogue MU/TH/UR' })).toBeVisible();
    await photographier(nel.page, `crt-parasites-hub-${largeur}`);
    await saisir(nel.page, 'HACK');
    const depart = nel.page.locator('.muthur-piratage-depart');
    await expect(depart).toBeVisible({ timeout: 3000 });
    const rendu = await depart.evaluate(element => ({
        animation: getComputedStyle(element.querySelector('.muthur-message')!).animationName,
        neige: getComputedStyle(element, '::after').opacity,
        mouvementsReduits: matchMedia('(prefers-reduced-motion: reduce)').matches,
        feuilles: [...document.styleSheets].map(f => f.href),
    }));
    expect(rendu.animation, JSON.stringify(rendu)).toBe('muthur-intrusion');
    expect(Number(rendu.neige)).toBeGreaterThan(.3);
    await photographier(nel.page, `hack-tablet-hub-${largeur}`);
    await expect(depart).toHaveCount(0, { timeout: 7000 });
    const poste = await pupitre('MU/TH/UR 6000');
    await expect(poste.getByText('Demandes en attente : 1', { exact: true })).toBeVisible();
});

for (const decalage of [60_000, -60_000]) test(`HACK : horloge tablette décalée de ${decalage / 1000} s, expiration et réouverture`, async ({ browser }) => {
    const nel = await rejoindre(browser, 'Nel Varga', 390, true);
    await nel.page.emulateMedia({ reducedMotion: 'no-preference' });
    await nel.page.clock.setFixedTime(new Date(Date.now() + decalage));
    await autoriser('MU/TH/UR 6000', 'Nel Varga');
    await instrument(nel.page, 'MU/TH/UR 6000');
    await saisir(nel.page, 'HACK');
    await expect(nel.page.getByText(/TENTATIVE D’INTRUSION/)).toBeVisible();
    const depart = nel.page.locator('.muthur-piratage-depart');
    await expect(depart).toBeVisible({ timeout: 2000 });
    await expect(depart).toHaveCount(0, { timeout: 7000 });
    // La projection mise en cache garde son horloge ; rouvrir ne rejoue pas le signal.
    await instrument(nel.page, 'MU/TH/UR 6000');
    await expect(depart).toHaveCount(0);
    await expect(nel.page.getByText('TENTATIVE D’INTRUSION…\nEn attente du résultat.', { exact: true })).toBeVisible();
});

test('HACK : brouillage fixe visible avec mouvements réduits, puis retour normal', async ({ browser }) => {
    const nel = await rejoindre(browser, 'Nel Varga', 390, true);
    await autoriser('MU/TH/UR 6000', 'Nel Varga');
    await instrument(nel.page, 'MU/TH/UR 6000');
    await saisir(nel.page, 'HACK');
    const depart = nel.page.locator('.muthur-piratage-depart');
    await expect(depart).toBeVisible();
    const rendu = await depart.evaluate(element => {
        const message = getComputedStyle(element.querySelector('.muthur-message')!);
        return { animation: message.animationName, deformation: message.transform, couleurs: message.textShadow,
            neige: getComputedStyle(element, '::after').opacity };
    });
    expect(rendu.animation).toBe('none');
    expect(rendu.deformation).not.toBe('none');
    expect(rendu.couleurs).not.toBe('none');
    expect(Number(rendu.neige)).toBeGreaterThan(.2);
    await photographier(nel.page, 'hack-tablet-hub-mouvements-reduits-390');
    await expect(depart).toHaveCount(0, { timeout: 7000 });
    const message = nel.page.locator('.muthur-message').first();
    expect(await message.evaluate(element => getComputedStyle(element).transform)).toBe('none');
});

test('droits indépendants, dialogue privé et commandes MJ refusées sur le vrai WebSocket', async ({ browser }) => {
    const nel = await rejoindre(browser, 'Nel Varga', 390), idris = await rejoindre(browser, 'Idris Koa');
    await autoriser('MU/TH/UR 6000', 'Nel Varga'); await autoriser('Détecteur de mouvement', 'Idris Koa');
    const poste = await pupitre('MU/TH/UR 6000');
    await poste.getByRole('button', { name: 'Réglages', exact: true }).click();
    await poste.getByLabel('Mot de passe administrateur', { exact: true }).fill('SECRET-A4-0042');
    await poste.getByRole('button', { name: 'Enregistrer les réglages', exact: true }).click();
    await poste.getByRole('button', { name: 'Terminal', exact: true }).click();
    await instrument(nel.page, 'MU/TH/UR 6000');
    await idris.page.getByRole('navigation', { name: 'Navigation Hub' }).getByRole('button', { name: 'Modules du jeu', exact: true }).click();
    await expect(idris.page.getByRole('button', { name: 'Ouvrir MU/TH/UR 6000', exact: true })).toHaveCount(0);
    await expect(idris.page.getByRole('button', { name: 'Ouvrir Détecteur de mouvement', exact: true })).toBeVisible();
    await saisir(nel.page, '/M QUESTION-PRIVEE-NEL');
    await expect(poste.getByText('/M QUESTION-PRIVEE-NEL', { exact: true })).toBeVisible();
    await poste.getByLabel('Réponse de Maman', { exact: true }).fill('REPONSE-PRIVEE-NEL');
    await poste.getByRole('button', { name: 'Transmettre la réponse', exact: true }).click();
    await expect(nel.page.getByText('REPONSE-PRIVEE-NEL', { exact: true })).toBeVisible();
    for (const appareil of [nel, idris]) {
        const communs = await appareil.page.evaluate(() => JSON.stringify((window as FenetreSonde).sondeAlien.paquets.filter(p => !p.type.startsWith('modules:'))));
        expect(communs).not.toContain('SECRET-A4-0042'); expect(communs).not.toContain('REPONSE-PRIVEE-NEL');
    }
    const recus = await idris.page.evaluate(() => JSON.stringify((window as FenetreSonde).sondeAlien.paquets));
    expect(recus).not.toContain('REPONSE-PRIVEE-NEL'); expect(recus).not.toContain('SECRET-A4-0042');
    await idris.page.evaluate(contexte => {
        const socket = (window as FenetreSonde).sondeAlien.sockets.findLast(s => s.readyState === WebSocket.OPEN)!;
        socket.send(JSON.stringify({ type: 'modules:commander', payload: { requeteId: 'fausse-commande-mj', campagneId: 'temoin-campagne', moduleId: 'alien-detecteur', contexte,
            role: 'mj', personnageId: 'temoin-pj-1', commande: { id: 'scanner', charge: { actif: true } } } }));
    }, (await vueMJ()).contexte);
    await expect.poll(() => idris.page.evaluate(() => (window as FenetreSonde).sondeAlien.paquets.findLast(p => p.type === 'modules:resultat' && p.payload?.requeteId === 'fausse-commande-mj')?.payload?.ok)).toBe(false);
    await photographier(nel.page, 'terminal-prive-390'); await sansDebordement(nel.page);
    await autoriser('MU/TH/UR 6000', 'Nel Varga', false);
    await expect(nel.page.locator('.gmos-muthur')).toHaveCount(0);
    await expect(nel.page.getByText('Aucun module ouvert par le meneur.', { exact: true })).toBeVisible();
});

for (const largeur of [360, 768, 1180]) test(`scan partagé, son local, retrait partiel et reconnexion à ${largeur} px`, async ({ browser }) => {
    const nel = await rejoindre(browser, 'Nel Varga', largeur), idris = await rejoindre(browser, 'Idris Koa', largeur);
    await autoriser('Détecteur de mouvement', 'Nel Varga'); await autoriser('Détecteur de mouvement', 'Idris Koa');
    const poste = await pupitre('Détecteur de mouvement');
    await poste.getByLabel('Contacts', { exact: true }).fill('5'); await poste.getByLabel('Proximité (0 loin · 100 près)', { exact: true }).fill('75');
    await poste.getByRole('button', { name: 'Enregistrer les réglages', exact: true }).click();
    await poste.getByRole('button', { name: 'Démarrer le scan', exact: true }).click();
    await instrument(nel.page, 'Détecteur de mouvement'); await instrument(idris.page, 'Détecteur de mouvement');
    for (const appareil of [nel, idris]) {
        await expect(appareil.page.getByRole('img', { name: 'Radar : 5 échos', exact: true })).toBeVisible();
        await sansDebordement(appareil.page);
    }
    const derniereVue = (page: Page) => page.evaluate(() => {
        const modules = (window as FenetreSonde).sondeAlien.paquets.findLast(p => p.type === 'modules:vue')?.payload?.modules as { id: string; vue: unknown }[] | undefined;
        return modules?.find(m => m.id === 'alien-detecteur')?.vue;
    });
    expect(await derniereVue(nel.page)).toEqual(await derniereVue(idris.page));
    await nel.page.getByRole('button', { name: 'Activer les bips ici', exact: true }).click();
    await expect.poll(() => nel.page.evaluate(() => (window as FenetreSonde).sondeAlien.sons.demarres)).toBeGreaterThan(0);
    await poste.getByRole('button', { name: 'Faux écho · 9 s', exact: true }).click();
    await expect(idris.page.getByRole('img', { name: 'Radar : 6 échos', exact: true })).toBeVisible();
    await photographier(nel.page, `detecteur-${largeur}`);
    await autoriser('Détecteur de mouvement', 'Idris Koa', false);
    await expect(idris.page.locator('.gmos-detecteur')).toHaveCount(0);
    await expect(nel.page.getByRole('button', { name: 'Couper les bips', exact: true })).toBeVisible();
    await expect(nel.page.getByRole('img')).toBeVisible();
    await nel.contexte.setOffline(true);
    await nel.page.evaluate(() => (window as FenetreSonde).sondeAlien.sockets.forEach(s => s.close()));
    await expect(nel.page.locator('.gmos-detecteur')).toHaveCount(0);
    await expect.poll(() => nel.page.evaluate(() => (window as FenetreSonde).sondeAlien.sons.actifs)).toBe(0);
    await expect.poll(() => nel.page.evaluate(() => (window as FenetreSonde).sondeAlien.sons.fermes)).toBeGreaterThan(0);
    await nel.contexte.setOffline(false);
    await expect(nel.page.getByText('Connecté', { exact: true })).toBeVisible({ timeout: 20_000 });
    const ouvrir = nel.page.getByRole('button', { name: 'Ouvrir Détecteur de mouvement', exact: true });
    if (await ouvrir.count()) await ouvrir.click();
    await expect(nel.page.getByRole('button', { name: 'Activer les bips ici', exact: true })).toBeVisible();
    await gmos.fenetre.getByRole('button', { name: 'Tout couper', exact: true }).click();
    await expect(nel.page.locator('.gmos-detecteur')).toHaveCount(0);
    await expect(poste.getByRole('button', { name: 'Démarrer le scan', exact: true })).toBeVisible();
});

test('film HTTP décodé, plages vidéo, son sur un seul appareil et annulation', async ({ browser }) => {
    const nel = await rejoindre(browser, 'Nel Varga'), idris = await rejoindre(browser, 'Idris Koa');
    await autoriser('MU/TH/UR 6000', 'Nel Varga'); await autoriser('MU/TH/UR 6000', 'Idris Koa');
    await instrument(nel.page, 'MU/TH/UR 6000'); await instrument(idris.page, 'MU/TH/UR 6000');
    await nel.page.getByRole('button', { name: 'Activer le son', exact: true }).click();
    await idris.page.getByRole('button', { name: 'Activer le son', exact: true }).click();
    await carte('MU/TH/UR 6000').getByRole('button', { name: 'Son : Nel Varga', exact: true }).click();
    await saisir(nel.page, 'CODE OMEGA-10');
    for (const appareil of [nel, idris]) await expect.poll(() => appareil.page.locator('video').evaluate((v: HTMLVideoElement) => v.readyState >= 2 && v.videoWidth === 640)).toBe(true);
    await expect.poll(() => nel.page.locator('video').evaluate((v: HTMLVideoElement) => v.muted)).toBe(false);
    expect(await idris.page.locator('video').evaluate((v: HTMLVideoElement) => v.muted)).toBe(true);
    const source = await nel.page.locator('video').getAttribute('src'); expect(source).toBeTruthy();
    const plage = await nel.contexte.request.get(new URL(source!, nel.page.url()).href, { headers: { Range: 'bytes=0-1023' } });
    expect(plage.status()).toBe(206); expect((await plage.body()).length).toBe(1024);
    expect(plage.headers()['content-range']).toMatch(/^bytes 0-1023\/26378944$/);
    const avant = await vueMJ();
    await carte('MU/TH/UR 6000').getByRole('button', { name: 'Son : Idris Koa', exact: true }).click();
    await expect.poll(() => nel.page.locator('video').evaluate((v: HTMLVideoElement) => v.muted)).toBe(true);
    await expect.poll(() => idris.page.locator('video').evaluate((v: HTMLVideoElement) => v.muted)).toBe(false);
    const alerte = (vue: VueDesModulesMJ) => (vue.modules.find(m => m.id === 'alien-muthur')!.vue as { countdown: { endAt: number }; autodestruction: { startedAt: number } });
    expect(alerte(await vueMJ()).countdown).toEqual(alerte(avant).countdown);
    expect(alerte(avant).countdown.endAt - alerte(avant).autodestruction.startedAt).toBeGreaterThanOrEqual(775701);
    await photographier(nel.page, 'alerte-film');
    await saisir(nel.page, 'CODE OMEGA-STOP');
    for (const appareil of [nel, idris]) { await expect(appareil.page.locator('video')).toHaveCount(0); await expect.poll(() => appareil.page.evaluate(() => (window as FenetreSonde).sondeAlien.sons.actifs)).toBe(0); }
});

test('fichier privé, redémarrage et import conservent la préparation avec droits et effets fermés', async ({ browser }) => {
    const nel = await rejoindre(browser, 'Nel Varga');
    await autoriser('MU/TH/UR 6000', 'Nel Varga');
    const maman = await pupitre('MU/TH/UR 6000');
    await instrument(nel.page, 'MU/TH/UR 6000');
    await saisir(nel.page, '/M QUESTION-A6-PERSISTANTE');
    await maman.getByRole('button', { name: 'Dossiers', exact: true }).click();
    await maman.getByLabel('Dossier', { exact: true }).selectOption('ordre');
    await maman.getByRole('button', { name: 'Monter le dossier', exact: true }).click();
    await expect(maman.getByRole('button', { name: 'Monter le dossier', exact: true })).toBeDisabled();
    await maman.getByLabel('Confirmer la suppression du dossier', { exact: true }).check();
    await maman.getByRole('button', { name: 'Supprimer le dossier', exact: true }).click();
    await expect(maman.getByLabel('Dossier', { exact: true })).toHaveValue('navigation');
    await autoriser('Détecteur de mouvement', 'Nel Varga');
    const poste = await pupitre('Détecteur de mouvement');
    await poste.getByLabel('Contacts', { exact: true }).fill('8');
    await poste.getByRole('button', { name: 'Enregistrer les réglages', exact: true }).click();
    await poste.getByLabel('Nom du préréglage', { exact: true }).fill('A6 — Coursive');
    await poste.getByRole('button', { name: 'Enregistrer la préparation actuelle', exact: true }).click();
    await expect(poste.getByRole('button', { name: 'Rappeler ce préréglage', exact: true })).toBeVisible();
    await poste.getByRole('button', { name: 'Démarrer le scan', exact: true }).click();
    await poste.getByRole('button', { name: 'Faux écho · 9 s', exact: true }).click();
    await instrument(nel.page, 'Détecteur de mouvement');
    const fichier = path.join(gmos.profil, 'modules-du-jeu/instances.json');
    const sauvegarde: SauvegardeDesModules = JSON.parse(fs.readFileSync(fichier, 'utf8'));
    expect(sauvegarde.campagnes[CAMPAGNE]['alien-detecteur'].donnees).toMatchObject({ tracker: { power: true, contacts: 8 } });
    await nel.contexte.close(); contextes = [];
    await gmos.fermer();
    gmos = await demarrer(sauvegarde);
    const reprise = await vueMJ();
    const preparation = { acces: [], vue: { tracker: { power: false, contacts: 8, anomalyUntil: 0 }, prereglages: [{ id: 'exemple-relais' }, { nom: 'A6 — Coursive', reglages: { contacts: 8 } }] } };
    expect(reprise.modules.find(m => m.id === 'alien-detecteur')).toMatchObject(preparation);
    const terminal = reprise.modules.find(m => m.id === 'alien-muthur')!.vue as VueMuthurMJ;
    expect(terminal.documents.map(d => d.id)).toEqual(['navigation', 'archive']);
    expect(Object.values(terminal.players).flatMap(p => p.requests)).toMatchObject([{ content: 'QUESTION-A6-PERSISTANTE', status: 'pending' }]);
    await autoriser('Détecteur de mouvement', 'Nel Varga');
    const nouveauPoste = await pupitre('Détecteur de mouvement');
    await nouveauPoste.getByRole('button', { name: 'Démarrer le scan', exact: true }).click();
    const retour = await gmos.fenetre.evaluate(donnees => window.appBridge!.modulesDuJeu!.importer(JSON.parse(JSON.stringify(donnees))), sauvegarde);
    expect(retour).toEqual({ ok: true });
    const importee = await vueMJ();
    expect(importee.modules.find(m => m.id === 'alien-detecteur')).toMatchObject(preparation);
    expect((importee.modules.find(m => m.id === 'alien-muthur')!.vue as VueMuthurMJ).players).toEqual(terminal.players);
});

test('questions hors ordre et dossier supprimé après reconnexion, saisie tactile et rotation émulées', async ({ browser }) => {
    const nel = await rejoindre(browser, 'Nel Varga', 390, true), idris = await rejoindre(browser, 'Idris Koa');
    await autoriser('MU/TH/UR 6000', 'Nel Varga'); await autoriser('MU/TH/UR 6000', 'Idris Koa');
    const poste = await pupitre('MU/TH/UR 6000');
    await instrument(nel.page, 'MU/TH/UR 6000'); await instrument(idris.page, 'MU/TH/UR 6000');
    const saisie = nel.page.getByLabel('Commande ou /M votre question', { exact: true });
    await nel.page.setViewportSize({ width: 390, height: 440 });
    await saisie.tap(); await saisie.fill('/M QUESTION-A6-UNE : où est l’équipage ?'); await saisie.press('Enter');
    await expect(saisie).toHaveValue(''); await sansDebordement(nel.page);
    await saisir(nel.page, 'HACK'); await saisir(nel.page, '/M QUESTION-A6-DEUX');
    await expect(poste.getByText('Demandes en attente : 3', { exact: true })).toBeVisible();
    const etat = (await vueMJ()).modules.find(m => m.id === 'alien-muthur')!.vue as VueMuthurMJ;
    const operateur = Object.values(etat.players).find(p => p.name === 'Nel Varga')!;
    await poste.getByLabel('Demande à traiter').selectOption(operateur.requests[2].id);
    await poste.getByLabel('Réponse de Maman', { exact: true }).fill('REPONSE-A6-DEUX');
    await poste.getByRole('button', { name: 'Transmettre la réponse', exact: true }).click();
    await expect(nel.page.getByText('REPONSE-A6-DEUX', { exact: true })).toBeVisible();
    await expect(poste.getByText('Demandes en attente : 2', { exact: true })).toBeVisible();
    await nel.contexte.setOffline(true);
    await nel.page.evaluate(() => (window as FenetreSonde).sondeAlien.sockets.forEach(s => s.close()));
    await expect(nel.page.locator('.gmos-muthur')).toHaveCount(0);
    await poste.getByLabel('Demande à traiter').selectOption(operateur.requests[0].id);
    await poste.getByLabel('Réponse de Maman', { exact: true }).fill('REPONSE-A6-UNE-HORS-LIGNE');
    await poste.getByRole('button', { name: 'Transmettre la réponse', exact: true }).click();
    await expect(poste.getByText('Demandes en attente : 1', { exact: true })).toBeVisible();
    await nel.contexte.setOffline(false);
    await expect(nel.page.getByText('Connecté', { exact: true })).toBeVisible({ timeout: 20_000 });
    const ouvrir = nel.page.getByRole('button', { name: 'Ouvrir MU/TH/UR 6000', exact: true });
    if (await ouvrir.count()) await ouvrir.click();
    await expect(nel.page.getByText('REPONSE-A6-UNE-HORS-LIGNE', { exact: true })).toBeVisible();
    const paquets = await idris.page.evaluate(() => JSON.stringify((window as FenetreSonde).sondeAlien.paquets));
    expect(paquets).not.toContain('QUESTION-A6'); expect(paquets).not.toContain('REPONSE-A6');
    await saisir(nel.page, 'CODE 0042');
    await poste.getByRole('button', { name: 'Dossiers', exact: true }).click();
    await poste.getByLabel('Dossier', { exact: true }).selectOption('ordre');
    await poste.getByLabel('Confirmer la suppression du dossier', { exact: true }).check();
    await poste.getByRole('button', { name: 'Supprimer le dossier', exact: true }).click();
    await expect(poste.getByLabel('Dossier', { exact: true })).toHaveValue('archive');
    await saisir(nel.page, 'READ ordre');
    await expect(nel.page.getByText(/DOSSIER INACCESSIBLE/)).toBeVisible();
    await nel.page.setViewportSize({ width: 844, height: 390 }); await sansDebordement(nel.page);
    await saisie.tap(); await saisie.fill('STATUS'); await saisie.press('Enter'); await expect(saisie).toHaveValue('');
    await photographier(nel.page, 'terminal-tactile-paysage-a6');
});

test('fin du film : sirène réelle et annonces simulées sur le seul diffuseur, sans rattrapage', async ({ browser }) => {
    const nel = await rejoindre(browser, 'Nel Varga'), idris = await rejoindre(browser, 'Idris Koa');
    await autoriser('MU/TH/UR 6000', 'Nel Varga'); await autoriser('MU/TH/UR 6000', 'Idris Koa');
    const poste = await pupitre('MU/TH/UR 6000');
    await poste.getByRole('button', { name: 'Protocoles', exact: true }).click();
    await poste.getByRole('combobox', { name: /^Protocole/ }).selectOption('autodestruction');
    await poste.getByLabel('Durée de l’autodestruction en minutes', { exact: true }).fill('15');
    await poste.getByRole('button', { name: 'Enregistrer le protocole', exact: true }).click();
    await expect(poste.getByRole('button', { name: 'Enregistrer le protocole', exact: true })).toBeEnabled();
    for (const appareil of [nel, idris]) {
        await instrument(appareil.page, 'MU/TH/UR 6000');
        // Horloge et voix simulées uniquement ; HTTP, décodeur vidéo et Web Audio réels.
        await appareil.page.clock.install();
        await appareil.page.evaluate(() => {
            const annonces: string[] = [];
            Object.assign(window, { annoncesA6: annonces });
            Object.defineProperty(window, 'SpeechSynthesisUtterance', { configurable: true, value: class {
                text: string;
                constructor(text: string) { this.text = text; }
            } });
            Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: {
                getVoices: () => [{ lang: 'fr-FR', localService: true }], addEventListener() {}, removeEventListener() {},
                cancel() {}, speak: (p: SpeechSynthesisUtterance) => { annonces.push(p.text); p.onend?.(new Event('end') as SpeechSynthesisEvent); },
            } });
        });
        await appareil.page.getByRole('button', { name: 'Activer le son', exact: true }).click();
    }
    await carte('MU/TH/UR 6000').getByRole('button', { name: 'Son : Nel Varga', exact: true }).click();
    await saisir(nel.page, 'CODE OMEGA-10');
    await expect.poll(() => nel.page.locator('video').evaluate((v: HTMLVideoElement) => v.readyState >= 2 && !v.muted)).toBe(true);
    const annonces = (p: Page) => p.evaluate(() => (window as unknown as { annoncesA6: string[] }).annoncesA6);
    expect(await annonces(nel.page)).toEqual([]); expect(await annonces(idris.page)).toEqual([]);
    const etat = (await vueMJ()).modules.find(m => m.id === 'alien-muthur')!.vue as VueMuthurMJ;
    const debut = etat.autodestruction!.startedAt;
    // Le Hub suit l'ancre monotone du serveur plutôt que le Date.now de la tablette.
    // Avancer le serveur jetable et publier un état neutre rafraîchit les deux clients.
    const avancerServeur = async (instant: number) => {
        await gmos.application.evaluate((_, t) => { Date.now = () => t; }, instant);
        const v = await vueMJ();
        const r = await gmos.fenetre.evaluate(vue => window.appBridge!.modulesDuJeu!.commander({
            requeteId: crypto.randomUUID(), campagneId: vue.campagneId!, moduleId: 'alien-muthur', contexte: vue.contexte,
            commande: { id: 'configurer', charge: { statut: 'RECETTE HORLOGE SERVEUR' } },
        }), v);
        expect(r).toEqual({ ok: true });
    };
    await avancerServeur(debut + 780_000);
    await expect.poll(() => annonces(nel.page)).toEqual(['Autodestruction. Il reste 2 minutes. Évacuation immédiate.']);
    await expect.poll(() => nel.page.evaluate(() => (window as FenetreSonde).sondeAlien.sons.actifs)).toBe(2);
    expect(await annonces(idris.page)).toEqual([]);
    await carte('MU/TH/UR 6000').getByRole('button', { name: 'Son : Idris Koa', exact: true }).click();
    await expect.poll(() => nel.page.evaluate(() => (window as FenetreSonde).sondeAlien.sons.actifs)).toBe(0);
    await expect.poll(() => annonces(idris.page)).toHaveLength(1);
    await avancerServeur(debut + 840_000);
    await expect.poll(() => annonces(idris.page)).toHaveLength(2);
    expect((await annonces(idris.page))[1]).toContain('1 minute.');
    await photographier(idris.page, 'alarme-apres-film-a6');
    await saisir(nel.page, 'CODE OMEGA-STOP');
    for (const appareil of [nel, idris]) {
        await expect(appareil.page.locator('video')).toHaveCount(0);
        await expect.poll(() => appareil.page.evaluate(() => (window as FenetreSonde).sondeAlien.sons.actifs)).toBe(0);
    }
});
