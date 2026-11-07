import { test, expect, type Browser, type BrowserContext, type Page } from '@playwright/test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { lancerGmOs, attendreLHydratation, type GmOsLance } from './lancerGmOs';
import { creerSemenceAlien } from '../outils/modules-du-jeu/recette-alien.mjs';
import type { VueDesModulesMJ } from '../src/modules/modulesDuJeu/protocole';

/**
 * **Les modules du jeu sur la tablette du meneur** — 07/11/2026, plan
 * `documentation/Planning/2026-11-07-modules-du-jeu-tablette-du-meneur.md`, T5.
 * Vrai Electron, vrai HTTP/WebSocket : le poste, la tablette du meneur appairée, une tablette de
 * joueur. Campagne fictive d'Alien, profil jetable ; captures dans `scratch/` seulement.
 *
 *   npm run build
 *   npx playwright test e2e/modulesDuJeuTabletteMeneur.spec.ts --reporter=list
 */
const ICI = path.dirname(fileURLToPath(import.meta.url));
const SORTIE = path.join(ICI, '../scratch/modules-du-jeu-tablette-meneur');
let gmos: GmOsLance;
let semence: string;
let dossierSemence: string;
let contextes: BrowserContext[] = [];

test.use({ channel: 'msedge', locale: 'fr-FR', timezoneId: 'Europe/Brussels', serviceWorkers: 'block', launchOptions: { args: ['--mute-audio'] } });
test.setTimeout(120_000);
test.beforeAll(async () => {
    fs.mkdirSync(SORTIE, { recursive: true });
    dossierSemence = fs.mkdtempSync(path.join(os.tmpdir(), 'gmos-tablette-meneur-'));
    semence = path.join(dossierSemence, 'fiction.json'); fs.writeFileSync(semence, JSON.stringify(await creerSemenceAlien()));
});
test.beforeEach(async () => {
    contextes = [];
    gmos = await lancerGmOs({ semence });
    await attendreLHydratation(gmos);
    await expect(gmos.fenetre.locator('[data-ecran-d-accueil]')).toHaveCount(0, { timeout: 20_000 });
    const cadre = await gmos.application.browserWindow(gmos.fenetre);
    await cadre.evaluate(w => w.webContents.setAudioMuted(true));
    // Le contexte des modules est poussé par le poste dès qu'il est prêt.
    await expect.poll(() => vueDuPoste().then(v => v.modules.length), { timeout: 20_000 }).toBeGreaterThan(0);
});
test.afterEach(async () => {
    for (const contexte of contextes) await contexte.close();
    await gmos?.fermer();
});
test.afterAll(() => { if (dossierSemence) fs.rmSync(dossierSemence, { recursive: true, force: true }); });

const vueDuPoste = (): Promise<VueDesModulesMJ> => gmos.fenetre.evaluate(() => window.appBridge!.modulesDuJeu!.lire());

async function nouveauContexte(browser: Browser, largeur: number, hauteur: number) {
    const contexte = await browser.newContext({ viewport: { width: largeur, height: hauteur }, hasTouch: true,
        locale: 'fr-FR', timezoneId: 'Europe/Brussels', serviceWorkers: 'block', reducedMotion: 'reduce' });
    contextes.push(contexte);
    await contexte.route('**/*', route => {
        const url = new URL(route.request().url());
        return url.hostname === '127.0.0.1' || ['data:', 'blob:'].includes(url.protocol) ? route.continue() : route.abort();
    });
    return contexte;
}

async function tabletteDuMeneur(browser: Browser, largeur = 1180, hauteur = 820, secret?: string) {
    const page = await (await nouveauContexte(browser, largeur, hauteur)).newPage();
    const jeton = secret ?? await gmos.fenetre.evaluate(() => window.appBridge!.pairing!.getSecret!());
    await page.goto(`http://127.0.0.1:${gmos.ports.sync}/?window=remote&sync=${gmos.ports.sync}#token=${encodeURIComponent(jeton)}`);
    expect(await page.evaluate(() => Boolean(window.appBridge))).toBe(false);
    await expect(page.getByRole('button', { name: 'Pads', exact: true }).first()).toHaveAttribute('aria-current', 'page', { timeout: 20_000 });
    await page.getByRole('button', { name: 'Modules', exact: true }).first().click();
    return page;
}

async function tabletteDeJoueur(browser: Browser, personnage: string) {
    const contexte = await nouveauContexte(browser, 768, 1000);
    await contexte.addInitScript(id => localStorage.setItem('gmos-tablet-uuid', id), 'meneur-e2e-' + personnage.replaceAll(' ', '-').toLowerCase());
    const page = await contexte.newPage();
    await page.goto(`http://127.0.0.1:${gmos.ports.sync}/?window=tablet&sync=${gmos.ports.sync}`);
    await page.getByRole('button', { name: new RegExp(personnage) }).click();
    await expect(page.getByText('Connecté', { exact: true })).toBeVisible();
    await page.getByRole('navigation', { name: 'Navigation Hub' }).getByRole('button', { name: 'Modules du jeu', exact: true }).click();
    return page;
}

const carte = (page: Page, libelle: string) => page.locator('article').filter({ has: page.getByRole('heading', { name: libelle, exact: true }) });
const photographier = (page: Page, nom: string) => page.screenshot({ path: path.join(SORTIE, `${nom}.png`), animations: 'disabled' });
const sansDebordement = async (page: Page) => expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

test('la tablette du meneur ouvre un module à un joueur, le pilote, puis coupe tout', async ({ browser }) => {
    const meneur = await tabletteDuMeneur(browser);
    const nel = await tabletteDeJoueur(browser, 'Nel Varga');
    await expect(carte(meneur, 'MU/TH/UR 6000')).toBeVisible({ timeout: 20_000 });
    await expect(meneur.getByRole('button', { name: 'Tout couper', exact: true })).toBeVisible();
    await photographier(meneur, 'liste-paysage-1180'); await sansDebordement(meneur);

    // Ouvrir l'accès depuis la tablette : le poste l'enregistre, le joueur voit la carte.
    const caseNel = carte(meneur, 'MU/TH/UR 6000').getByRole('checkbox', { name: 'Nel Varga', exact: true });
    await caseNel.click();
    await expect(caseNel).toBeChecked();
    await expect.poll(async () => (await vueDuPoste()).modules.find(m => m.id === 'alien-muthur')?.acces.length).toBe(1);
    await expect(nel.getByRole('button', { name: 'Ouvrir MU/TH/UR 6000', exact: true })).toBeVisible();
    await photographier(meneur, 'acces-ouvert-1180');

    // Le pupitre remplace la liste ; un geste de meneur y passe.
    await carte(meneur, 'MU/TH/UR 6000').getByRole('button', { name: 'Ouvrir le pupitre', exact: true }).click();
    const pupitre = meneur.locator('.gmos-muthur');
    await expect(pupitre).toBeVisible();
    await expect(meneur.getByRole('button', { name: 'Tout couper', exact: true })).toHaveCount(0);
    await photographier(meneur, 'pupitre-muthur-1180'); await sansDebordement(meneur);
    await meneur.getByRole('button', { name: 'Modules', exact: true }).last().click();

    // Tout couper depuis la tablette : la carte quitte la tablette du joueur.
    await meneur.getByRole('button', { name: 'Tout couper', exact: true }).click();
    await expect(caseNel).not.toBeChecked();
    await expect(nel.getByText('Aucun module ouvert par le meneur.', { exact: true })).toBeVisible();
    expect((await vueDuPoste()).modules.every(m => m.acces.length === 0)).toBe(true);
});

test('portrait, et sans le secret d’appairage : aucune vue du meneur', async ({ browser }) => {
    const portrait = await tabletteDuMeneur(browser, 820, 1180);
    await expect(carte(portrait, 'MU/TH/UR 6000')).toBeVisible({ timeout: 20_000 });
    await photographier(portrait, 'liste-portrait-820'); await sansDebordement(portrait);

    const intrus = await tabletteDuMeneur(browser, 1180, 820, 'faux-secret');
    await expect(intrus.getByText(/tablette appairée/)).toBeVisible();
    await expect(intrus.locator('article')).toHaveCount(0);
});
