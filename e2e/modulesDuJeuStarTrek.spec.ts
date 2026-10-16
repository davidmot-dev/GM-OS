import { test, expect, type Browser, type BrowserContext, type Page } from '@playwright/test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { lancerGmOs, attendreLHydratation, type GmOsLance } from './lancerGmOs';
import { creerSemenceLcars } from '../outils/modules-du-jeu/recette-lcars.mjs';
import { creerFiction } from '../outils/star-trek/lcars/fiction.mjs';
import { exporterConfiguration } from '../outils/star-trek/lcars/configuration.mjs';
import type { VueLcarsMJ } from '../outils/star-trek/lcars/moteur.mjs';
import type { SauvegardeDesModules, CommandeDeModule } from '../src/modules/modulesDuJeu/protocole';
interface Paquet { type: string; payload?: Record<string, unknown> }
type Fenetre = Window & typeof globalThis & { sondeLcars: { sockets: WebSocket[]; paquets: Paquet[] } };
const SORTIE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../scratch/lcars-natif');
let gmos: GmOsLance, semence: string, dossier: string, contextes: BrowserContext[];
test.use({ channel: 'msedge', locale: 'fr-FR', timezoneId: 'Europe/Brussels', serviceWorkers: 'block', launchOptions: { args: ['--mute-audio'] } });
test.setTimeout(150_000);
test.beforeAll(async () => {
    fs.mkdirSync(SORTIE, { recursive: true }); dossier = fs.mkdtempSync(path.join(os.tmpdir(), 'gmos-lcars-semence-'));
    semence = path.join(dossier, 'fiction.json'); fs.writeFileSync(semence, JSON.stringify(await creerSemenceLcars()));
});
test.beforeEach(async () => { contextes = []; gmos = await demarrer(); });
test.afterEach(async () => { for (const c of contextes) await c.close(); await gmos?.fermer(); });
test.afterAll(() => { if (dossier) fs.rmSync(dossier, { recursive: true, force: true }); });
async function demarrer(sauvegarde?: SauvegardeDesModules) {
    const instance = await lancerGmOs({ semence, preparerLeProfil: sauvegarde ? profil => {
        fs.mkdirSync(path.join(profil, 'modules-du-jeu'), { recursive: true }); fs.writeFileSync(path.join(profil, 'modules-du-jeu/instances.json'), JSON.stringify(sauvegarde));
    } : undefined });
    await attendreLHydratation(instance); await expect(instance.fenetre.locator('[data-ecran-d-accueil]')).toHaveCount(0, { timeout: 20_000 });
    const cadre = await instance.application.browserWindow(instance.fenetre); await cadre.evaluate(w => { w.setContentSize(1440, 1000); w.webContents.setAudioMuted(true); });
    await instance.fenetre.evaluate(() => (window as unknown as { useSessionOSStore: { getState(): { setCurrentView(v: string): void } } }).useSessionOSStore.getState().setCurrentView('cockpit'));
    await instance.fenetre.getByRole('button', { name: 'Modules du jeu', exact: true }).click();
    await instance.fenetre.getByRole('button', { name: 'Ouvrir le pupitre', exact: true }).click();
    await expect(instance.fenetre.locator('.lcars-prototype')).toBeVisible(); return instance;
}
const vueMJ = () => gmos.fenetre.evaluate(() => window.appBridge!.modulesDuJeu!.lire());
const lcarsMJ = async () => (await vueMJ()).modules[0].vue as VueLcarsMJ;
async function commandeMJ(commande: CommandeDeModule) {
    const v = await vueMJ(); const retour = await gmos.fenetre.evaluate(({ v, commande }) => window.appBridge!.modulesDuJeu!.commander({ requeteId: crypto.randomUUID(), campagneId: v.campagneId!, moduleId: 'star-trek-lcars', contexte: v.contexte, commande }), { v, commande });
    expect(retour).toEqual({ ok: true });
}
async function autoriser(nom: string, actif = true) {
    const c = gmos.fenetre.getByRole('group', { name: 'Accès des personnages', exact: true }).getByRole('checkbox', { name: nom, exact: true });
    if (await c.isChecked() !== actif) await c.click(); await expect(c).toBeChecked({ checked: actif }); await expect(c).toBeEnabled();
}
async function rejoindre(browser: Browser, nom: string, largeur: number) {
    const contexte = await browser.newContext({ viewport: { width: largeur, height: 1000 }, hasTouch: true, serviceWorkers: 'block', reducedMotion: 'reduce' }); contextes.push(contexte);
    await contexte.route('**/*', route => { const u = new URL(route.request().url()); return u.hostname === '127.0.0.1' || ['data:', 'blob:'].includes(u.protocol) ? route.continue() : route.abort(); });
    await contexte.addInitScript(id => {
        localStorage.setItem('gmos-tablet-uuid', id); const w = window as Fenetre; w.sondeLcars = { sockets: [], paquets: [] }; const Socket = window.WebSocket;
        window.WebSocket = class extends Socket { constructor(url: string | URL, protocols?: string | string[]) { super(url, protocols); w.sondeLcars.sockets.push(this); this.addEventListener('message', e => { try { w.sondeLcars.paquets.push(JSON.parse(e.data)); } catch { /* non JSON */ } }); } };
    }, 'lcars-e2e-' + nom.replaceAll(' ', '-').toLowerCase());
    const page = await contexte.newPage(); await page.goto(`http://127.0.0.1:${gmos.ports.sync}/?window=tablet&sync=${gmos.ports.sync}`);
    expect(await page.evaluate(() => !!window.appBridge)).toBe(false); await page.getByRole('button', { name: new RegExp(nom) }).click(); await expect(page.getByText('Connecté', { exact: true })).toBeVisible();
    return { page, contexte };
}
async function ouvrir(page: Page) {
    await page.getByRole('navigation', { name: 'Navigation Hub' }).getByRole('button', { name: 'Modules du jeu', exact: true }).click();
    const retour = page.getByRole('button', { name: 'Retour aux modules', exact: true }); if (await retour.count()) await retour.click();
    await page.getByRole('button', { name: 'Ouvrir LCARS — Passerelle', exact: true }).click(); return page.locator('.lcars-prototype');
}
const panneau = (nom: string | RegExp) => gmos.fenetre.getByRole('navigation', { name: 'Panneaux du pupitre' }).getByRole('button', { name: nom, exact: typeof nom === 'string' }).click();
async function photo(p: Page, nom: string) {
    expect(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await p.screenshot({ path: path.join(SORTIE, `${nom}.png`), fullPage: true, animations: 'disabled' });
    // Sur téléphone, l'instrument dépasse la zone défilante : garder le vrai écran
    // complet en PNG, sans publier une capture d'élément rognée dans le manuel.
    const noms: Record<string, string> = { 'commandement-1024': 'commandement' };
    if (noms[nom]) await p.locator('.lcars-console').screenshot({ path: path.join(SORTIE, `jeu-star-trek-lcars-${noms[nom]}.jpg`), type: 'jpeg', quality: 85, animations: 'disabled' });
}
async function preparerOfficier(nom: string, postes: string[]) {
    await panneau('Passerelle'); await gmos.fenetre.getByLabel('Personnage à préparer', { exact: true }).selectOption({ label: nom });
    await gmos.fenetre.getByRole('button', { name: 'Préparer ce personnage', exact: true }).click();
    for (const poste of postes) { const c = gmos.fenetre.getByLabel(`${poste} pour ${nom}`, { exact: true }); await c.click(); await expect(c).toBeChecked(); await expect(c).toBeEnabled(); }
}
test('préparation importée, deux officiers réels, rapports privés, ordres et révocation', async ({ browser }) => {
    expect((await lcarsMJ()).officiers).toEqual([]);
    await panneau('Importer une préparation'); const input = gmos.fenetre.getByLabel('Fichier de préparation LCARS', { exact: true });
    await input.setInputFiles({ name: 'invalide.json', mimeType: 'application/json', buffer: Buffer.from('{invalide') }); await expect(gmos.fenetre.locator('.lcars-prototype').getByRole('alert')).toBeVisible(); expect((await lcarsMJ()).cibles).toEqual([]);
    const configuration = exporterConfiguration(creerFiction());
    await input.setInputFiles({ name: 'atelier.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(configuration)) });
    await expect(gmos.fenetre.getByRole('button', { name: 'Remplacer la préparation LCARS', exact: true })).toBeDisabled();
    await gmos.fenetre.getByRole('button', { name: 'Annuler cet import', exact: true }).click(); expect((await lcarsMJ()).cibles).toEqual([]);
    await input.setInputFiles({ name: 'atelier.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(configuration)) });
    await gmos.fenetre.getByLabel('Je confirme le remplacement de la préparation et des historiques LCARS', { exact: true }).check();
    await gmos.fenetre.getByRole('button', { name: 'Remplacer la préparation LCARS', exact: true }).click(); await expect.poll(async () => (await lcarsMJ()).cibles.length).toBe(13);
    expect((await lcarsMJ()).officiers).toEqual([]);
    await preparerOfficier('Nel Varga', ['Science', 'Médecine']); await preparerOfficier('Idris Koa', ['Commandement', 'Tactique / sécurité']);
    await expect(gmos.fenetre.locator('.lcars-poste-attribue')).toHaveCount(4);
    await gmos.fenetre.getByRole('region', { name: 'Officiers et consoles', exact: true }).screenshot({ path: path.join(SORTIE, 'jeu-star-trek-lcars-equipage.jpg'), type: 'jpeg', quality: 85, animations: 'disabled' });
    await expect(gmos.fenetre.getByLabel('Identifiant du nouvel officier', { exact: true })).toHaveCount(0);
    const nel = await rejoindre(browser, 'Nel Varga', 390), idris = await rejoindre(browser, 'Idris Koa', 1024);
    await autoriser('Nel Varga'); await autoriser('Idris Koa'); await ouvrir(nel.page); await ouvrir(idris.page);
    await expect(nel.page.getByRole('button', { name: 'Activer le son', exact: true })).toHaveCount(0);
    await expect(nel.page.getByRole('navigation', { name: 'Consoles attribuées' }).getByRole('button')).toHaveCount(2);
    await nel.page.getByLabel('Détails de l’intervention', { exact: true }).fill('QUESTION PRIVÉE NEL');
    await nel.page.getByRole('button', { name: 'Transmettre l’intervention', exact: true }).click();
    await panneau(/^Demandes/); await expect(gmos.fenetre.getByText('QUESTION PRIVÉE NEL', { exact: true })).toBeVisible();
    await gmos.fenetre.getByLabel('Rapport destiné à l’officier', { exact: true }).fill('DÉCOUVERTE PRIVÉE NEL');
    await gmos.fenetre.getByLabel('Autoriser le partage à l’équipage', { exact: true }).check();
    await gmos.fenetre.getByRole('button', { name: 'Transmettre le rapport privé', exact: true }).click();
    await expect(nel.page.getByText('DÉCOUVERTE PRIVÉE NEL', { exact: true })).toBeVisible();
    const recus = await idris.page.evaluate(() => JSON.stringify((window as Fenetre).sondeLcars.paquets));
    expect(recus).not.toContain('DÉCOUVERTE PRIVÉE NEL'); expect(recus).not.toContain('SECRET RELAIS'); expect(recus).not.toContain('DOSSIER MÉDICAL PRIVÉ'); expect(recus).not.toContain('QUESTION PRIVÉE NEL');
    await photo(nel.page, 'science-privee-390');
    await nel.page.getByRole('button', { name: 'Partager à l’équipage', exact: true }).click(); await expect(idris.page.getByRole('log', { name: 'Rapports reçus' })).toContainText('DÉCOUVERTE PRIVÉE NEL');
    await idris.page.getByLabel('Texte de l’ordre', { exact: true }).fill('Scanner avant l’approche.');
    await idris.page.getByRole('button', { name: 'Transmettre l’ordre', exact: true }).click(); await nel.page.getByRole('button', { name: 'Accuser réception', exact: true }).click();
    await expect(idris.page.getByRole('region', { name: 'Ordres de passerelle', exact: true })).toContainText('Nel Varga'); await photo(idris.page, 'commandement-1024');
    await panneau('Passerelle'); await gmos.fenetre.getByLabel('Science pour Nel Varga', { exact: true }).click();
    await expect(nel.page.getByRole('navigation', { name: 'Consoles attribuées' }).getByRole('button', { name: 'Science', exact: true })).toHaveCount(0);
    await expect(nel.page.locator('.lcars-console-medecine')).toBeVisible(); await photo(nel.page, 'medecine-390');
    await autoriser('Nel Varga', false); await expect(nel.page.locator('.lcars-prototype')).toHaveCount(0); await expect(idris.page.locator('.lcars-prototype')).toBeVisible();
    const communs = await nel.page.evaluate(() => JSON.stringify((window as Fenetre).sondeLcars.paquets.filter(p => !p.type.startsWith('modules:'))));
    expect(communs).not.toContain('DÉCOUVERTE PRIVÉE NEL'); expect(communs).not.toContain('SECRET RELAIS');
    await photo(gmos.fenetre, 'pupitre-natif');
});
test('commandes interdites, reconnexion et redémarrage sur sauvegarde privée', async ({ browser }) => {
    await commandeMJ({ id: 'importer-preparation', charge: { configuration: exporterConfiguration(creerFiction()) } });
    const v = await lcarsMJ(), nelId = v.personnages!.find(p => p.nom === 'Nel Varga')!.id;
    await commandeMJ({ id: 'preparer-officier', charge: { personnageId: nelId, nom: 'Nel Varga', postes: ['science'] } });
    const nel = await rejoindre(browser, 'Nel Varga', 768); await autoriser('Nel Varga'); await ouvrir(nel.page);
    const epoque = (await lcarsMJ()).officiers[0].affectation, contexte = (await vueMJ()).contexte;
    const envoyer = async (requeteId: string, commande: CommandeDeModule, generation = contexte) => {
        await nel.page.evaluate(({ requeteId, commande, generation }) => {
            const w = window as Fenetre, ws = w.sondeLcars.sockets.findLast(s => s.readyState === WebSocket.OPEN)!;
            ws.send(JSON.stringify({ type: 'modules:commander', payload: { requeteId, campagneId: 'temoin-campagne', moduleId: 'star-trek-lcars', contexte: generation, role: 'mj', personnageId: 'autre-pj', commande } }));
        }, { requeteId, commande, generation });
        await expect.poll(() => nel.page.evaluate(id => (window as Fenetre).sondeLcars.paquets.findLast(p => p.type === 'modules:resultat' && p.payload?.requeteId === id)?.payload?.ok, requeteId)).not.toBeUndefined();
    };
    await envoyer('faux-mj', { id: 'preparer-officier', charge: { personnageId: nelId, nom: 'Pirate', postes: ['commandement'] } });
    expect((await lcarsMJ()).officiers[0].postes).toEqual(['science']);
    const commande = { id: 'demander-intervention', charge: { poste: 'science', cibleId: 'c-03', action: 'scan', question: 'HISTORIQUE À RESTAURER', affectation: epoque } };
    await envoyer('requete-unique', commande); await envoyer('requete-unique', commande); expect((await lcarsMJ()).demandes).toHaveLength(1);
    await nel.contexte.setOffline(true); await nel.page.evaluate(() => (window as Fenetre).sondeLcars.sockets.forEach(s => s.close()));
    await expect(nel.page.locator('.lcars-prototype')).toHaveCount(0); await nel.contexte.setOffline(false);
    await expect(nel.page.getByText('Connecté', { exact: true })).toBeVisible({ timeout: 20_000 }); await ouvrir(nel.page);
    await expect(nel.page.getByRole('log', { name: 'Mes interventions' })).toContainText('HISTORIQUE À RESTAURER');
    await commandeMJ({ id: 'changer-alerte', charge: { niveau: 'rouge', texte: 'Consigne visuelle', secondes: 60 } });
    const sauvegarde = (await vueMJ()).sauvegarde!; await nel.contexte.close(); contextes = []; await gmos.fermer(); gmos = await demarrer(sauvegarde);
    expect((await lcarsMJ()).demandes).toHaveLength(1); expect((await lcarsMJ()).alerte.fin).toBeNull(); expect((await lcarsMJ()).effetsActifs).toBe(false); expect((await vueMJ()).modules[0].acces).toEqual([]);
    const retour = await rejoindre(browser, 'Nel Varga', 768); await retour.page.getByRole('navigation', { name: 'Navigation Hub' }).getByRole('button', { name: 'Modules du jeu', exact: true }).click();
    await expect(retour.page.getByRole('button', { name: 'Ouvrir LCARS — Passerelle', exact: true })).toHaveCount(0);
    await autoriser('Nel Varga'); await ouvrir(retour.page); await expect(retour.page.getByRole('log', { name: 'Mes interventions' })).toContainText('HISTORIQUE À RESTAURER');
    await gmos.fenetre.getByRole('button', { name: 'Tout couper', exact: true }).click(); await expect(retour.page.locator('.lcars-prototype')).toHaveCount(0);
    await photo(retour.page, 'acces-fermes-768');
});
