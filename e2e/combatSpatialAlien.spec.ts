import { test, expect, type Browser, type BrowserContext, type Page } from '@playwright/test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { lancerGmOs, attendreLHydratation, type GmOsLance } from './lancerGmOs';
import { creerSemenceAlien } from '../outils/modules-du-jeu/recette-alien.mjs';
import type { useSessionOSStore } from '../src/modules/session/useSessionOSStore';
import type { VueDesModulesMJ } from '../src/modules/modulesDuJeu/protocole';
import type { VueCombatSpatial } from '../outils/alien/modules/combat-spatial/moteur.mjs';

/**
 * **Le combat spatial d'Alien, de bout en bout** — 23/10/2026. Vrai Electron, vrai
 * HTTP/WebSocket, une tablette Edge sans pont natif. Le pilote fictif de la recette
 * reçoit le module ; aucun profil personnel lu ; sorties dans scratch/.
 */
const ICI = path.dirname(fileURLToPath(import.meta.url));
const SORTIE = path.join(ICI, '../scratch/modules-du-jeu-e2e');
const MODULE = 'alien-combat-spatial';
type Magasins = { useSessionOSStore: typeof useSessionOSStore };
type Fenetre = Window & typeof globalThis & { paquetsSpatial: { type: string }[] };
let gmos: GmOsLance;
let semence: string;
let dossierSemence: string;
const contextes: BrowserContext[] = [];

test.use({ channel: 'msedge', locale: 'fr-FR', timezoneId: 'Europe/Brussels', serviceWorkers: 'block', launchOptions: { args: ['--mute-audio'] } });
test.setTimeout(180_000);
test.beforeAll(async () => {
    fs.mkdirSync(SORTIE, { recursive: true });
    const demo = await creerSemenceAlien();
    demo.modules.sessionOS.customGameDrivers[0].modulesDuJeu.push({ id: MODULE });
    dossierSemence = fs.mkdtempSync(path.join(os.tmpdir(), 'gmos-alien-spatial-'));
    semence = path.join(dossierSemence, 'fiction.json'); fs.writeFileSync(semence, JSON.stringify(demo));
});
test.afterEach(async () => { for (const c of contextes) await c.close(); await gmos?.fermer(); });
test.afterAll(() => { if (dossierSemence) fs.rmSync(dossierSemence, { recursive: true, force: true }); });

async function vueMJ(): Promise<VueDesModulesMJ> { return gmos.fenetre.evaluate(() => window.appBridge!.modulesDuJeu!.lire()); }
async function commander(id: string, charge: unknown) {
    const vue = await vueMJ();
    return gmos.fenetre.evaluate(async ({ vue, MODULE, id, charge }) => window.appBridge!.modulesDuJeu!.commander({
        campagneId: vue.campagneId!, contexte: vue.contexte, requeteId: crypto.randomUUID(), moduleId: MODULE, commande: { id, charge },
    }), { vue, MODULE, id, charge });
}
const agir = async (id: string, charge: unknown) => expect(await commander(id, charge)).toEqual({ ok: true });
const etat = async () => (await vueMJ()).modules.find(m => m.id === MODULE)!.vue as VueCombatSpatial;

async function rejoindre(browser: Browser, personnage: string, largeur: number): Promise<Page> {
    const contexte = await browser.newContext({ viewport: { width: largeur, height: 1000 }, locale: 'fr-FR', timezoneId: 'Europe/Brussels', serviceWorkers: 'block', reducedMotion: 'reduce' });
    contextes.push(contexte);
    await contexte.route('**/*', route => {
        const url = new URL(route.request().url());
        return url.hostname === '127.0.0.1' || ['data:', 'blob:'].includes(url.protocol) ? route.continue() : route.abort();
    });
    await contexte.addInitScript(id => {
        localStorage.setItem('gmos-tablet-uuid', id);
        const w = window as Fenetre; w.paquetsSpatial = [];
        const Socket = window.WebSocket;
        window.WebSocket = class extends Socket {
            constructor(url: string | URL, protocols?: string | string[]) {
                super(url, protocols);
                this.addEventListener('message', e => { try { w.paquetsSpatial.push(JSON.parse(e.data)); } catch { /* sans intérêt */ } });
            }
        };
    }, 'alien-spatial-' + personnage.replaceAll(' ', '-').toLowerCase());
    const page = await contexte.newPage();
    await page.goto(`http://127.0.0.1:${gmos.ports.sync}/?window=tablet&sync=${gmos.ports.sync}`);
    await page.getByRole('button', { name: new RegExp(personnage) }).click();
    await expect(page.getByText('Connecté', { exact: true })).toBeVisible();
    return page;
}
async function capturer(page: Page, cible: ReturnType<Page['locator']>, nom: string) {
    await cible.evaluate(element => {
        for (let p = element.parentElement; p; p = p.parentElement) {
            p.dataset.styleAvantCapture = p.getAttribute('style') ?? '';
            p.style.setProperty('overflow', 'visible', 'important'); p.style.setProperty('height', 'auto', 'important'); p.style.setProperty('max-height', 'none', 'important');
        }
    });
    await cible.screenshot({ path: path.join(SORTIE, `${nom}.jpg`), quality: 85, animations: 'disabled' });
    await cible.evaluate(element => {
        for (let p = element.parentElement; p; p = p.parentElement) { p.setAttribute('style', p.dataset.styleAvantCapture ?? ''); delete p.dataset.styleAvantCapture; }
    });
}

test('combat spatial : ordres secrets, contact non identifié, verrouillage et jet forcé depuis la tablette', async ({ browser }) => {
    gmos = await lancerGmOs({ semence });
    await attendreLHydratation(gmos);
    await expect(gmos.fenetre.locator('[data-ecran-d-accueil]')).toHaveCount(0, { timeout: 20_000 });
    const cadre = await gmos.application.browserWindow(gmos.fenetre);
    await cadre.evaluate(w => { w.setContentSize(1440, 1000); w.webContents.setAudioMuted(true); });
    await gmos.fenetre.evaluate(() => (window as unknown as Magasins).useSessionOSStore.getState().setCurrentView('cockpit'));
    await gmos.fenetre.getByRole('button', { name: 'Modules du jeu', exact: true }).click();
    const carte = gmos.fenetre.locator('article').filter({ has: gmos.fenetre.getByRole('heading', { name: 'Combat spatial', exact: true }) });
    await carte.getByRole('button', { name: 'Ouvrir le pupitre', exact: true }).click();
    const pupitre = gmos.fenetre.locator('.gmos-spatial');
    await expect(pupitre).toBeVisible();

    // La préparation à l'écran : une frégate Conestoga du livre, armement compris.
    await pupitre.getByText('Préparer un vaisseau', { exact: true }).click();
    await pupitre.getByLabel('Modèle du livre', { exact: true }).selectOption('conestoga');
    const form = pupitre.getByRole('form', { name: 'Préparer un vaisseau' });
    await form.getByLabel('Nom', { exact: true }).fill('USS Patna');
    await form.getByLabel('Camp', { exact: true }).selectOption('adverse');
    // Un vaisseau militaire coupe son transpondeur (p. 190) : il restera un contact jusqu'au verrouillage.
    await form.getByLabel('Transpondeur actif', { exact: true }).uncheck();
    await form.getByRole('button', { name: 'Enregistrer le vaisseau', exact: true }).click();
    await expect(pupitre.getByRole('heading', { name: /USS Patna/ })).toBeVisible();
    await agir('vaisseau', { nom: 'Montero', modele: 'bison-transport', camp: 'joueurs', signature: 1, propulseurs: 1, coque: 9, protection: 6,
        armes: ['canon-electrique-leger', 'drones-senseurs'], transpondeur: true, ombilic: true });

    await carte.getByRole('checkbox', { name: 'Nel Varga', exact: true }).click();
    await expect(carte.getByRole('checkbox', { name: 'Nel Varga', exact: true })).toBeChecked();
    const nel = (await etat()).personnages!.find(p => p.nom === 'Nel Varga')!;
    const vaisseaux = (await etat()).vaisseaux;
    const idNous = vaisseaux.find(v => v.nom === 'Montero')!.id, idEux = vaisseaux.find(v => v.nom === 'USS Patna')!.id;
    await agir('poste', { vaisseauId: idNous, poste: 'senseurs', personnageId: nel.id, nom: 'Nel Varga', base: 4, stress: 1, talent: false, synthetique: false });
    for (const poste of ['capitaine', 'senseurs', 'pilote', 'artilleur', 'ingenieur'])
        await agir('poste', { vaisseauId: idEux, poste, personnageId: '', nom: `Marine ${poste}`, base: 5, stress: 0, talent: false, synthetique: false });
    await agir('demarrer-combat', { vaisseaux: [idNous, idEux], distance: 8, velociteJoueurs: 2, velociteAdverse: 2 });
    await agir('ordonner', { vaisseauId: idEux, action: 'faire-le-mort', coupe: 'senseurs' });
    await expect(pupitre.getByRole('button', { name: 'Révéler les ordres', exact: true })).toBeVisible();
    await capturer(gmos.fenetre, pupitre, 'jeu-alien-spatial-pupitre');

    // La tablette de Nel : son poste, son ordre, l'adversaire inconnu.
    const tablette = await rejoindre(browser, 'Nel Varga', 768);
    await tablette.getByRole('navigation', { name: 'Navigation Hub' }).getByRole('button', { name: 'Modules du jeu', exact: true }).click();
    await tablette.getByRole('button', { name: 'Ouvrir Combat spatial', exact: true }).click();
    const vue = tablette.locator('.gmos-spatial');
    await expect(vue.getByRole('list', { name: 'Contacts' })).toContainText('Contact non identifié');
    await vue.getByLabel('Action de Montero', { exact: true }).selectOption('verrouiller');
    await vue.getByRole('button', { name: 'Donner l’ordre', exact: true }).click();
    await expect(vue.locator('[data-ordre-donne]')).toContainText('Verrouillage de la cible');
    const recu = await tablette.evaluate(() => JSON.stringify((window as Fenetre).paquetsSpatial.filter(p => p.type === 'modules:vue')));
    expect(recu).not.toMatch(/USS Patna|Marine |faire-le-mort/);
    await tablette.setViewportSize({ width: 360, height: 1000 });
    expect(await tablette.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await capturer(tablette, vue, 'jeu-alien-spatial-tablette');

    await agir('reveler', {});
    const tour = (await etat()).combat!.ordreDInitiative;
    if (tour[0] !== idNous) await agir('resoudre', { vaisseauId: idEux });
    await vue.getByRole('button', { name: 'Résoudre notre action', exact: true }).click();
    // Sans panique, le jet attend la tablette : elle le valide (le forçage est essayé par les essais unitaires).
    await expect.poll(async () => { const c = (await etat()).combat!; return !!c.enAttente || c.resolus.includes(idNous); }).toBe(true);
    if ((await etat()).combat!.enAttente) await vue.locator('[data-jet-en-attente]').getByRole('button', { name: 'Valider le jet', exact: true }).click();
    await expect.poll(async () => (await etat()).combat!.resolus).toContain(idNous);
    await expect(vue.getByRole('region', { name: 'Journal du combat' })).toContainText(/Montero, Verrouillage de la cible/);
});
