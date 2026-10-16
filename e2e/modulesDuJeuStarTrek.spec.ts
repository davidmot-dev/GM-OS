import { test, expect, type Browser, type BrowserContext, type Page } from '@playwright/test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { lancerGmOs, attendreLHydratation, type GmOsLance } from './lancerGmOs';
import { creerSemenceLcars } from '../outils/modules-du-jeu/recette-lcars.mjs';
import { creerFiction } from '../outils/star-trek/lcars/fiction.mjs';
import { exporterConfiguration } from '../outils/star-trek/lcars/configuration.mjs';
import type { VueLcarsMJ, VueLcarsJoueur } from '../outils/star-trek/lcars/moteur.mjs';
import type { SauvegardeDesModules, CommandeDeModule } from '../src/modules/modulesDuJeu/protocole';
interface Paquet { type: string; payload?: Record<string, unknown> }
type Fenetre = Window & typeof globalThis & { sondeLcars: { sockets: WebSocket[]; paquets: Paquet[]; voix: string[]; contextesAudio: AudioContext[]; sons: { actifs: number; demarres: number; fermes: number } } };
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
        localStorage.setItem('gmos-tablet-uuid', id); const w = window as Fenetre; w.sondeLcars = { sockets: [], paquets: [], voix: [], contextesAudio: [], sons: { actifs: 0, demarres: 0, fermes: 0 } }; const Socket = window.WebSocket;
        window.WebSocket = class extends Socket { constructor(url: string | URL, protocols?: string | string[]) { super(url, protocols); w.sondeLcars.sockets.push(this); this.addEventListener('message', e => { try { w.sondeLcars.paquets.push(JSON.parse(e.data)); } catch { /* non JSON */ } }); } };
        Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: { getVoices: () => [{ lang: 'fr-FR', localService: true }], speak: (p: SpeechSynthesisUtterance) => { w.sondeLcars.voix.push(p.text); p.onend?.(new Event('end') as SpeechSynthesisEvent); }, cancel() {} } });
        window.SpeechSynthesisUtterance = class { text: string; constructor(text: string) { this.text = text; } } as typeof SpeechSynthesisUtterance;
        const Audio = window.AudioContext;
        if (Audio) window.AudioContext = class extends Audio {
            private retirer = new Set<() => void>();
            constructor(options?: AudioContextOptions) { super(options); w.sondeLcars.contextesAudio.push(this); }
            createOscillator() {
                const o = super.createOscillator(), demarrer = o.start.bind(o), arreter = o.stop.bind(o); let actif = false;
                const fin = () => { if (actif) { actif = false; w.sondeLcars.sons.actifs--; } this.retirer.delete(fin); };
                o.start = (...a) => { demarrer(...a); actif = true; w.sondeLcars.sons.actifs++; w.sondeLcars.sons.demarres++; this.retirer.add(fin); };
                o.stop = (...a) => { arreter(...a); if (!a.length) fin(); }; o.addEventListener('ended', fin); return o;
            }
            async close() { await super.close(); this.retirer.forEach(f => f()); w.sondeLcars.sons.fermes++; }
        };
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
    await expect(nel.page.getByRole('button', { name: 'Activer le son', exact: true })).toBeVisible();
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

async function equipageEtClients(browser: Browser) {
    await commandeMJ({ id: 'importer-preparation', charge: { configuration: exporterConfiguration(creerFiction()) } });
    const vue = await lcarsMJ();
    for (const [nom, postes] of [['Nel Varga', ['science']], ['Idris Koa', ['commandement']]] as const)
        await commandeMJ({ id: 'preparer-officier', charge: { personnageId: vue.personnages!.find(p => p.nom === nom)!.id, nom, postes } });
    const nel = await rejoindre(browser, 'Nel Varga', 768), idris = await rejoindre(browser, 'Idris Koa', 1024);
    await autoriser('Nel Varga'); await autoriser('Idris Koa'); await ouvrir(nel.page); await ouvrir(idris.page);
    return { nel, idris };
}
async function derniereVue(page: Page) {
    return page.evaluate(() => ((window as Fenetre).sondeLcars.paquets.findLast(p => p.type === 'modules:vue')?.payload?.modules as { id: string; vue: VueLcarsJoueur }[]).find(m => m.id === 'star-trek-lcars')!.vue);
}
const pixel = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==', 'base64');
async function clipVideo(contexte: BrowserContext) {
    // Le codec travaille en temps réel, hors de la console dont l'horloge est décalée.
    const encodeur = await contexte.newPage();
    try {
        return Buffer.from(await encodeur.evaluate(async () => {
            const c = document.createElement('canvas'); c.width = 64; c.height = 48;
            const g = c.getContext('2d')!, flux = c.captureStream(0), r = new MediaRecorder(flux, { mimeType: 'video/webm' }), morceaux: Blob[] = [];
            return new Promise<number[]>(resolve => {
                r.ondataavailable = e => morceaux.push(e.data);
                r.onstop = async () => { flux.getTracks().forEach(t => t.stop()); resolve([...new Uint8Array(await new Blob(morceaux).arrayBuffer())]); };
                r.start(); let n = 0;
                const dessiner = () => { g.fillStyle = n++ % 2 ? '#c4a6ef' : '#ffb36b'; g.fillRect(0, 0, 64, 48); (flux.getVideoTracks()[0] as CanvasCaptureMediaStreamTrack).requestFrame(); };
                dessiner(); const intervalle = setInterval(dessiner, 100); setTimeout(() => { clearInterval(intervalle); r.stop(); }, 1200);
            });
        }));
    } finally { await encodeur.close(); }
}
async function publier(nom: string, mimeType: string, buffer: Buffer, commun = true) {
    await panneau('Diffusion'); await gmos.fenetre.getByLabel('Titre du rapport', { exact: true }).fill(nom);
    await gmos.fenetre.getByLabel('Contenu du rapport', { exact: true }).fill('Rapport avec pièce jointe.');
    const groupe = gmos.fenetre.getByRole('group', { name: 'Destinataires', exact: true });
    await groupe.getByLabel(commun ? 'Tout l’équipage' : 'Science', { exact: true }).check();
    await gmos.fenetre.getByLabel('Pièce jointe', { exact: true }).setInputFiles({ name: nom, mimeType, buffer });
    await expect(gmos.fenetre.getByRole('button', { name: 'Retirer la pièce jointe', exact: true })).toBeVisible();
    await gmos.fenetre.getByRole('button', { name: 'Publier aux destinataires choisis', exact: true }).click();
    await expect(gmos.fenetre.getByRole('button', { name: 'Publier aux destinataires choisis', exact: true })).toBeDisabled();
}
test('médias privés : HTTP autorisé, retrait, export portable et reconstruction après redémarrage', async ({ browser }) => {
    const { nel, idris } = await equipageEtClients(browser);
    await publier('image-privee.png', 'image/png', pixel, false);
    await expect.poll(() => gmos.fenetre.locator('.lcars-media img').evaluate(e => (e as HTMLImageElement).naturalWidth)).toBe(1);
    await expect.poll(() => nel.page.locator('.lcars-media img').evaluate(e => (e as HTMLImageElement).naturalWidth)).toBe(1);
    await expect(idris.page.locator('.lcars-media img')).toHaveCount(0);
    const a = await derniereVue(nel.page), b = await derniereVue(idris.page), source = a.publications[0].media!.source;
    expect(source).toMatch(/^\/modules-prives\//); expect(JSON.stringify(a)).not.toContain(';base64,');
    const lire = (page: Page, jeton: string, range?: string) => page.evaluate(async ({ source, jeton, range }) => {
        const r = await fetch(source, { headers: { 'x-gmos-module-session': jeton, ...(range ? { Range: range } : {}) }, cache: 'no-store' });
        return { statut: r.status, octets: (await r.arrayBuffer()).byteLength, cache: r.headers.get('cache-control') };
    }, { source, jeton, range });
    expect((await lire(nel.page, a.integration!.ressources!.jeton)).statut).toBe(200);
    expect((await lire(idris.page, b.integration!.ressources!.jeton)).statut).toBe(404);
    expect((await lire(nel.page, '')).statut).toBe(404);
    const plage = await lire(nel.page, a.integration!.ressources!.jeton, 'bytes=0-7'); expect(plage.statut).toBe(206); expect(plage.octets).toBe(8); expect(plage.cache).toContain('no-store');
    await gmos.fenetre.getByRole('button', { name: 'Retirer ce rapport', exact: true }).click();
    await expect(nel.page.locator('.lcars-media img')).toHaveCount(0); expect((await lire(nel.page, a.integration!.ressources!.jeton)).statut).toBe(404);
    await publier('image-commune.png', 'image/png', pixel); await expect(idris.page.locator('.lcars-media img')).toBeVisible();
    const sauvegarde = (await vueMJ()).sauvegarde!;
    expect(JSON.stringify(sauvegarde)).toContain('data:image/png;base64,');
    for (const c of contextes) await c.close(); contextes = []; await gmos.fermer(); gmos = await demarrer(sauvegarde);
    const retour = await rejoindre(browser, 'Nel Varga', 768); await autoriser('Nel Varga'); await ouvrir(retour.page);
    await expect.poll(() => retour.page.locator('.lcars-media img').evaluate(e => (e as HTMLImageElement).naturalWidth)).toBe(1);
    expect((await lire(retour.page, a.integration!.ressources!.jeton)).statut).toBe(404);
    await photo(retour.page, 'media-prive-restaure-768');
    await publier('image-indecodable.png', 'image/png', Buffer.from('Ceci ne contient pas un PNG.'));
    const illisible = retour.page.locator('.lcars-media').filter({ hasText: 'image-indecodable.png' });
    await expect(illisible).toContainText('Lecture du média indisponible sur ce navigateur. Le texte du rapport reste accessible.');
    await expect(retour.page.getByRole('log', { name: 'Rapports reçus' })).toContainText('Rapport avec pièce jointe.');
});

test('diffuseur unique, voix sans rattrapage, horloge décalée et arrêt des médias', async ({ browser }) => {
    const { nel, idris } = await equipageEtClients(browser);
    const choisirDiffuseur = async (nom: string) => {
        const v = await vueMJ(), personnages = (v.modules[0].vue as VueLcarsMJ).personnages!, id = personnages.find(p => p.nom === nom)!.id;
        const appareil = v.appareils!.find(a => a.personnageId === id)!;
        await gmos.fenetre.getByRole('button', { name: `Son : ${appareil.libelle}`, exact: true }).click();
        await expect(gmos.fenetre.getByRole('button', { name: `Son : ${appareil.libelle} (choisi)`, exact: true })).toBeVisible();
    };
    for (const appareil of [nel, idris]) {
        await appareil.page.getByRole('button', { name: 'Activer le son', exact: true }).click(); await appareil.page.getByLabel('Annonces vocales', { exact: true }).check();
        await expect(appareil.page.getByRole('button', { name: 'Diffuser l’alarme ici', exact: true })).toHaveCount(0);
    }
    await nel.page.evaluate(() => { const lire = Date.now; Date.now = () => lire() + 4 * 3600_000; });
    await choisirDiffuseur('Nel Varga');
    await commandeMJ({ id: 'changer-alerte', charge: { niveau: 'rouge', texte: 'Évacuation des laboratoires.', secondes: 125 } });
    await expect.poll(() => nel.page.evaluate(() => (window as Fenetre).sondeLcars.sons.demarres)).toBeGreaterThan(0);
    expect(await idris.page.evaluate(() => (window as Fenetre).sondeLcars.sons.demarres)).toBe(0);
    await expect(nel.page.getByRole('timer')).toContainText('02:'); await expect(idris.page.getByRole('timer')).toContainText('02:');
    await expect.poll(() => nel.page.evaluate(() => (window as Fenetre).sondeLcars.voix)).toContain('Alerte rouge');
    await gmos.application.evaluate(() => { const lire = Date.now; Date.now = () => lire() + 65000; });
    await commandeMJ({ id: 'configurer-vaisseau', charge: { nom: 'USS ASTERIA', immatriculation: 'NCC-78126', situation: 'Horloge serveur avancée pour la recette.' } });
    await expect.poll(() => nel.page.evaluate(() => (window as Fenetre).sondeLcars.voix)).toContain('1 minute restante');
    await choisirDiffuseur('Idris Koa'); await expect.poll(() => nel.page.evaluate(() => (window as Fenetre).sondeLcars.sons.actifs)).toBe(0);
    await expect.poll(() => idris.page.evaluate(() => (window as Fenetre).sondeLcars.sons.demarres)).toBeGreaterThan(0);
    expect(await idris.page.evaluate(() => (window as Fenetre).sondeLcars.voix)).toEqual([]);
    const wav = Buffer.alloc(44 + 8000); wav.write('RIFF'); wav.writeUInt32LE(wav.length - 8, 4); wav.write('WAVEfmt ', 8); wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22); wav.writeUInt32LE(8000, 24); wav.writeUInt32LE(16000, 28); wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34); wav.write('data', 36); wav.writeUInt32LE(8000, 40);
    await publier('signal.wav', 'audio/wav', wav);
    await expect.poll(() => idris.page.locator('.lcars-media audio').evaluate(e => (e as HTMLAudioElement).readyState)).toBeGreaterThan(0);
    await idris.page.locator('.lcars-media audio').evaluate(async e => { const a = e as HTMLAudioElement; a.loop = true; await a.play(); });
    expect(await nel.page.locator('.lcars-media audio').evaluate(e => (e as HTMLAudioElement).muted)).toBe(true);
    await publier('transmission.webm', 'video/webm', await clipVideo(idris.contexte));
    await expect.poll(() => idris.page.locator('.lcars-media video').evaluate(e => (e as HTMLVideoElement).videoWidth)).toBe(64);
    await idris.page.locator('.lcars-media video').evaluate(async e => { const v = e as HTMLVideoElement; v.loop = true; await v.play(); v.currentTime = .4; });
    await expect.poll(() => idris.page.locator('.lcars-media video').evaluate(e => (e as HTMLVideoElement).currentTime)).toBeGreaterThanOrEqual(.4);
    expect(await nel.page.locator('.lcars-media video').evaluate(e => (e as HTMLVideoElement).muted)).toBe(true);
    await photo(idris.page, 'alerte-medias-diffuseur-1024');
    await idris.page.locator('.lcars-media video').scrollIntoViewIfNeeded(); await photo(idris.page, 'video-privee-1024');
    await choisirDiffuseur('Nel Varga'); await expect.poll(() => idris.page.locator('.lcars-media audio').evaluate(e => (e as HTMLAudioElement).paused)).toBe(true);
    await expect.poll(() => idris.page.locator('.lcars-media video').evaluate(e => (e as HTMLVideoElement).paused)).toBe(true);
    const annonces = await nel.page.evaluate(() => (window as Fenetre).sondeLcars.voix.length);
    await nel.page.evaluate(async () => { await (window as Fenetre).sondeLcars.contextesAudio.at(-1)!.suspend(); });
    await expect(nel.page.getByRole('button', { name: 'Activer le son', exact: true })).toBeVisible();
    await expect(nel.page.getByText('Son suspendu : touche Activer le son pour reprendre.', { exact: true })).toBeVisible();
    await expect.poll(() => nel.page.evaluate(() => (window as Fenetre).sondeLcars.sons.actifs)).toBe(0);
    await nel.page.getByRole('button', { name: 'Activer le son', exact: true }).click();
    expect(await nel.page.evaluate(() => (window as Fenetre).sondeLcars.voix.length)).toBe(annonces);
    const avant = await nel.page.evaluate(() => (window as Fenetre).sondeLcars.voix.length);
    await nel.contexte.setOffline(true); await nel.page.evaluate(() => (window as Fenetre).sondeLcars.sockets.forEach(s => s.close()));
    await expect(nel.page.locator('.lcars-prototype')).toHaveCount(0); await expect.poll(() => nel.page.evaluate(() => (window as Fenetre).sondeLcars.sons.actifs)).toBe(0);
    await nel.contexte.setOffline(false); await expect(nel.page.getByText('Connecté', { exact: true })).toBeVisible({ timeout: 20_000 }); await ouvrir(nel.page);
    await expect(nel.page.getByRole('button', { name: 'Activer le son', exact: true })).toBeVisible(); expect(await nel.page.evaluate(() => (window as Fenetre).sondeLcars.voix.length)).toBe(avant);
    await gmos.fenetre.getByRole('button', { name: 'Tout couper', exact: true }).click(); await expect(idris.page.locator('.lcars-prototype')).toHaveCount(0);
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
        return nel.page.evaluate(id => (window as Fenetre).sondeLcars.paquets.findLast(p => p.type === 'modules:resultat' && p.payload?.requeteId === id)!.payload!.ok, requeteId);
    };
    await envoyer('faux-mj', { id: 'preparer-officier', charge: { personnageId: nelId, nom: 'Pirate', postes: ['commandement'] } });
    expect((await lcarsMJ()).officiers[0].postes).toEqual(['science']);
    const commande = { id: 'demander-intervention', charge: { poste: 'science', cibleId: 'c-03', action: 'scan', question: 'HISTORIQUE À RESTAURER', affectation: epoque } };
    await envoyer('requete-unique', commande); await envoyer('requete-unique', commande); expect((await lcarsMJ()).demandes).toHaveLength(1);
    await commandeMJ({ id: 'preparer-officier', charge: { personnageId: nelId, nom: 'Nel Varga', postes: ['science', 'navigation'] } });
    expect(await envoyer('ancienne-affectation', { ...commande, charge: { ...commande.charge, action: 'analyse', question: 'À REFUSER : ANCIENNE AFFECTATION' } })).toBe(false);
    await autoriser('Nel Varga', false); await autoriser('Nel Varga'); await ouvrir(nel.page);
    const nouvelleAffectation = (await lcarsMJ()).officiers[0].affectation;
    expect(await envoyer('ancien-acces', { ...commande, charge: { ...commande.charge, affectation: nouvelleAffectation, action: 'analyse', question: 'À REFUSER : ANCIEN ACCÈS' } }, contexte)).toBe(false);
    expect((await lcarsMJ()).demandes).toHaveLength(1);
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

// Attentes de recette indépendantes du catalogue : la disparition d'une action
// doit faire échouer le parcours, pas réduire silencieusement sa couverture.
const CONSOLES = [
    { id: 'commandement', nom: 'Commandement', actions: ['rapport', 'proposer-alerte'] },
    { id: 'science', nom: 'Science', actions: ['scan', 'analyse'] },
    { id: 'ingenierie', nom: 'Ingénierie', actions: ['diagnostic', 'reparation', 'reconfiguration'] },
    { id: 'communications', nom: 'Communications', actions: ['ouvrir-canal', 'decoder', 'transmettre'] },
    { id: 'navigation', nom: 'Navigation', actions: ['cap', 'evitement', 'distorsion'] },
    { id: 'tactique', nom: 'Tactique / sécurité', actions: ['identifier', 'verrouiller', 'intervenir'] },
    { id: 'medecine', nom: 'Médecine', actions: ['diagnostic', 'analyser', 'soigner'] },
] as const;
const FORMATS = [
    { nom: '360', width: 360, height: 800 }, { nom: '390', width: 390, height: 844 },
    { nom: '768-portrait', width: 768, height: 1024 }, { nom: '1024-paysage', width: 1024, height: 768 },
    { nom: '1180-paysage', width: 1180, height: 820 }, { nom: '1440', width: 1440, height: 1000 },
] as const;

test('L7 : sept consoles, dix-neuf actions arbitrées et six formats du vrai Hub', async ({ browser }) => {
    test.setTimeout(240_000);
    const erreurs: string[] = [], { nel, idris } = await equipageEtClients(browser);
    nel.page.on('pageerror', e => erreurs.push(e.message)); idris.page.on('pageerror', e => erreurs.push(e.message));
    const officier = (await lcarsMJ()).officiers.find(p => p.nom === 'Nel Varga')!;
    await commandeMJ({ id: 'preparer-officier', charge: { personnageId: officier.id, nom: officier.nom, postes: CONSOLES.map(c => c.id) } });
    await expect(nel.page.getByRole('navigation', { name: 'Consoles attribuées' }).getByRole('button')).toHaveCount(7);
    let total = 0;
    for (const console of CONSOLES) await test.step(console.nom, async () => {
        await nel.page.getByRole('navigation', { name: 'Consoles attribuées' }).getByRole('button', { name: console.nom, exact: true }).click();
        const instrument = nel.page.locator(`.lcars-console[data-poste="${console.id}"]`);
        await expect(instrument).toBeVisible(); await expect(nel.page.locator('.lcars-console')).toHaveCount(1);
        // Les cartes et le formulaire désignent le même élément.
        const elements = instrument.locator('.lcars-element');
        if (await elements.count() > 1) {
            await elements.last().click(); await expect(elements.last()).toHaveAttribute('aria-pressed', 'true');
            const libelle = await elements.last().locator('strong').innerText();
            await expect(nel.page.getByLabel('Cible de l’intervention', { exact: true }).locator('option:checked')).toHaveText(libelle);
        }
        const cibleId = await nel.page.getByLabel('Cible de l’intervention', { exact: true }).inputValue();
        const etatInitial = (await lcarsMJ()).cibles.find(c => c.id === cibleId)!.etat;
        for (const action of console.actions) {
            const question = `L7 PRIVÉ ${console.id} / ${action}`;
            await nel.page.getByLabel('Action proposée', { exact: true }).selectOption(action);
            await nel.page.getByLabel(console.id === 'communications' ? 'Message ou demande' : 'Détails de l’intervention', { exact: true }).fill(question);
            await nel.page.getByRole('button', { name: 'Transmettre l’intervention', exact: true }).click();
            await expect(nel.page.getByRole('log', { name: 'Mes interventions' })).toContainText(question);
            const demande = (await lcarsMJ()).demandes.find(d => d.question === question)!;
            expect(demande).toMatchObject({ poste: console.id, action, personnageId: officier.id, statut: 'attente' });
            // Le résultat passe aussi par le vrai pupitre MJ ; un refus n'applique aucun état.
            await panneau(/^Demandes/); await gmos.fenetre.getByLabel('Filtrer par poste', { exact: true }).selectOption(console.id);
            await gmos.fenetre.getByLabel('Demande à traiter', { exact: true }).selectOption(demande.id);
            await gmos.fenetre.getByRole('button', { name: 'Jet demandé par le MJ', exact: true }).click();
            await expect.poll(async () => (await lcarsMJ()).demandes.find(d => d.id === demande.id)!.statut).toBe('jet-requis');
            const rapport = `L7 RÉPONSE PRIVÉE ${console.id} / ${action}`;
            await gmos.fenetre.getByLabel('Rapport destiné à l’officier', { exact: true }).fill(rapport);
            const acceptee = action !== 'reparation';
            if (!acceptee) await gmos.fenetre.getByLabel('Accepter l’intervention', { exact: true }).uncheck();
            await gmos.fenetre.getByRole('button', { name: 'Transmettre le rapport privé', exact: true }).click();
            await expect(nel.page.getByRole('log', { name: 'Mes interventions' })).toContainText(rapport);
            expect((await lcarsMJ()).demandes.find(d => d.id === demande.id)!.statut).toBe(acceptee ? 'traitee' : 'refusee'); total++;
            expect((await lcarsMJ()).cibles.find(c => c.id === cibleId)!.etat).toBe(etatInitial);
        }
        for (const format of FORMATS) {
            await nel.page.setViewportSize({ width: format.width, height: format.height });
            await instrument.scrollIntoViewIfNeeded();
            const b = await nel.page.getByLabel('Action proposée', { exact: true }).boundingBox(); expect(b!.height).toBeGreaterThanOrEqual(44);
            await photo(nel.page, `l7-${console.id}-${format.nom}`);
            if (format.nom === '1024-paysage') {
                // Même largeur et géométrie tablette, assez de hauteur pour le
                // tirage du manuel sans barre de navigation superposée à l'image.
                await nel.page.setViewportSize({ width: 1024, height: 1800 }); await instrument.scrollIntoViewIfNeeded();
                await instrument.screenshot({ path: path.join(SORTIE, `jeu-star-trek-lcars-poste-${console.id}.jpg`), type: 'jpeg', quality: 85, animations: 'disabled' });
            }
        }
        await nel.page.setViewportSize({ width: 1024, height: 1000 });
    });
    expect(total).toBe(19); expect(erreurs).toEqual([]);
    const recus = await idris.page.evaluate(() => JSON.stringify((window as Fenetre).sondeLcars.paquets));
    expect(recus).not.toContain('L7 PRIVÉ'); expect(recus).not.toContain('L7 RÉPONSE PRIVÉE'); expect(recus).not.toContain('DOSSIER MÉDICAL PRIVÉ');
    fs.writeFileSync(path.join(SORTIE, 'bilan-l7.json'), JSON.stringify({ consoles: CONSOLES.map(c => ({ id: c.id, actions: c.actions.length })), totalActions: total, formats: FORMATS, capturesHub: CONSOLES.length * FORMATS.length, erreurs }, null, 2));
});

test('L7 : une vue en panne laisse le retour au Hub et la réouverture utilisables', async ({ browser }) => {
    const { nel, idris } = await equipageEtClients(browser);
    // Injection locale de panne à l'affichage uniquement : aucun état serveur ni
    // campagne sauvegardée ne sont altérés. On exerce la vraie garde React du Hub.
    await nel.page.evaluate(() => {
        const sonde = (window as Fenetre).sondeLcars, paquet = structuredClone(sonde.paquets.findLast(p => p.type === 'modules:vue')!);
        const modules = paquet.payload!.modules as { id: string; vue: { alerte: unknown } }[];
        modules.find(m => m.id === 'star-trek-lcars')!.vue.alerte = null;
        sonde.sockets.findLast(s => s.readyState === WebSocket.OPEN)!.dispatchEvent(new MessageEvent('message', { data: JSON.stringify(paquet) }));
    });
    await expect(nel.page.getByRole('alert')).toContainText('Le module n’a pas pu s’afficher.');
    await expect(idris.page.locator('.lcars-prototype')).toBeVisible();
    await nel.page.getByRole('button', { name: 'Retour aux modules', exact: true }).click();
    await expect(nel.page.getByRole('button', { name: 'Ouvrir LCARS — Passerelle', exact: true })).toBeVisible();
    await commandeMJ({ id: 'configurer-vaisseau', charge: { nom: 'USS ASTERIA', immatriculation: 'NCC-78126', situation: 'Reprise après panne de vue.' } });
    await ouvrir(nel.page); await expect(nel.page.getByText('Reprise après panne de vue.', { exact: true })).toBeVisible();
});

test('L7 : quitter la campagne et terminer la séance ferment les accès sans perdre la préparation', async ({ browser }) => {
    const { nel, idris } = await equipageEtClients(browser);
    const activerCampagne = (id: string | null) => gmos.fenetre.evaluate(id => (window as unknown as { useSessionOSStore: { getState(): { setActiveCampaign(id: string | null): void } } }).useSessionOSStore.getState().setActiveCampaign(id), id);
    await activerCampagne(null);
    await expect(nel.page.locator('.lcars-prototype')).toHaveCount(0); await expect(idris.page.locator('.lcars-prototype')).toHaveCount(0);
    await activerCampagne('temoin-campagne');
    await gmos.fenetre.getByRole('button', { name: 'Modules du jeu', exact: true }).click();
    await expect.poll(async () => (await vueMJ()).modules[0]?.acces).toEqual([]);
    expect((await lcarsMJ()).vaisseau.nom).toBe('USS ASTERIA'); expect((await lcarsMJ()).officiers).toHaveLength(2);
    await autoriser('Nel Varga'); await ouvrir(nel.page);
    await gmos.fenetre.evaluate(() => (window as unknown as { useSessionOSStore: { getState(): { updateSession(id: string, v: { status: string }): void } } }).useSessionOSStore.getState().updateSession('demo-seance-2', { status: 'done' }));
    await expect(nel.page.locator('.lcars-prototype')).toHaveCount(0);
    await expect.poll(async () => (await vueMJ()).modules[0]?.acces).toEqual([]);
    expect((await lcarsMJ()).cibles).toHaveLength(13); expect((await lcarsMJ()).effetsActifs).toBe(false);
});
