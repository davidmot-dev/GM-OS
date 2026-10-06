import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { lancerGmOs, attendreLHydratation, type GmOsLance } from './lancerGmOs';
import type { useSessionOSStore } from '../src/modules/session/useSessionOSStore';
import type { useStoryboardStore } from '../src/modules/storyboard/useStoryboardStore';
import type { useCombatStore } from '../src/modules/combat/useCombatStore';
import type { useWhiteboardStore } from '../src/modules/whiteboard/useWhiteboardStore';
import type { useImageStore } from '../src/modules/image/useImageStore';
import type { useSoundStore } from '../src/modules/sound/useSoundStore';
import type { useMusicStore } from '../src/modules/music/useMusicStore';
import type { useDiceStore } from '../src/stores/useDiceStore';

/**
 * T4/M2 meneur : navigateur appairé, SyncServer réel, campagne fictive et profil jetable.
 * Les magasins ne servent qu'à planter le décor et vérifier l'effet côté MJ.
 * Aucun état ni message n'est injecté dans la télécommande pour réussir un geste.
 *
 * npm.cmd run build
 * npx.cmd playwright test e2e/tabletteM2T4.spec.ts --reporter=list
 */
const ICI = path.dirname(fileURLToPath(import.meta.url));
// T2 peut rejouer le banc sans écraser les 68 images de référence T0.
const SORTIE = process.env.GMOS_M2_CAPTURES_DIR
    ? path.resolve(process.env.GMOS_M2_CAPTURES_DIR)
    : path.join(ICI, '../documentation/Planning/tablettes/T4-meneur/m2');
const DEMO = JSON.parse(fs.readFileSync(path.join(ICI, 'donnees/campagne-de-demo.json'), 'utf8'));
const PLAN = 'data:image/png;base64,' + fs.readFileSync(path.join(ICI, 'donnees/plan-station-varn.png')).toString('base64');
// Dix secondes de PCM muet : déclencher le vrai moteur sans fichier utilisateur.
const pcm = Buffer.alloc(160044);
pcm.write('RIFF'); pcm.writeUInt32LE(160036, 4); pcm.write('WAVEfmt ', 8);
pcm.writeUInt32LE(16, 16); pcm.writeUInt16LE(1, 20); pcm.writeUInt16LE(1, 22);
pcm.writeUInt32LE(8000, 24); pcm.writeUInt32LE(16000, 28); pcm.writeUInt16LE(2, 32);
pcm.writeUInt16LE(16, 34); pcm.write('data', 36); pcm.writeUInt32LE(160000, 40);
const SILENCE = 'data:audio/wav;base64,' + pcm.toString('base64');

import type { useAmbientStore } from '../src/modules/ambient/useAmbientStore';
import type { useClockStore } from '../src/store/useClockStore';
type Magasins = {
    useAmbientStore: typeof useAmbientStore;
    useClockStore: typeof useClockStore;
    useSessionOSStore: typeof useSessionOSStore;
    useStoryboardStore: typeof useStoryboardStore;
    useCombatStore: typeof useCombatStore;
    useWhiteboardStore: typeof useWhiteboardStore;
    useImageStore: typeof useImageStore;
    useSoundStore: typeof useSoundStore;
    useMusicStore: typeof useMusicStore;
    useDiceStore: typeof useDiceStore;
};

const TAILLES = [
    { nom: 'compact', width: 360, height: 800 },
    { nom: 'telephone', width: 390, height: 844 },
    { nom: 'portrait', width: 820, height: 1180 },
    { nom: 'paysage', width: 1180, height: 820 },
    { nom: 'pupitre', width: 1440, height: 900 },
] as const;

// Edge est déjà installé ; aucune installation de navigateur pour ce relevé.
test.use({ channel: 'msedge' });

for (const taille of TAILLES) {
    test.describe(`T4/M2 meneur — ${taille.nom}`, () => {
        test.use({ viewport: { width: taille.width, height: taille.height }, locale: 'fr-FR', timezoneId: 'Europe/Brussels', serviceWorkers: 'block' });
        let gmos: GmOsLance;
        let secret: string;
        let ambiancesInitiales: ReturnType<typeof useAmbientStore.getState>['presets'];

        test.setTimeout(90000);
        test.beforeAll(async () => {
            test.setTimeout(90000);
            fs.mkdirSync(path.join(SORTIE, taille.nom), { recursive: true });
            gmos = await lancerGmOs({
                semence: path.join(ICI, 'donnees/campagne-de-demo.json'),
                preparerLeProfil: profil => fs.cpSync(path.join(ICI, 'donnees/coffre-de-demo'), path.join(profil, 'coffre'), { recursive: true }),
            });
            await gmos.fenetre.waitForFunction(() => Boolean((window as unknown as Magasins).useSessionOSStore), { timeout: 60000 });
            await attendreLHydratation(gmos);
            ambiancesInitiales = await gmos.fenetre.evaluate(() => (window as unknown as Magasins).useAmbientStore.getState().presets);
            await expect(gmos.fenetre.locator('[data-ecran-d-accueil]')).toHaveCount(0, { timeout: 20_000 });
            const cadre = await gmos.application.browserWindow(gmos.fenetre);
            await cadre.evaluate(w => w.webContents.setAudioMuted(true));
            secret = await gmos.fenetre.evaluate(() => {
                const appairage = window.appBridge?.pairing;
                if (!appairage?.getSecret) throw new Error('Jeton d’appairage indisponible sur le MJ jetable');
                return appairage.getSecret();
            });
        });
        test.afterAll(async () => { await gmos?.fermer(); });

        test.beforeEach(async () => {
            // La semence du manuel n'est pas modifiée : le décor est refait dans
            // l'instance jetable pour chaque scénario, y compris après un geste.
            await gmos.fenetre.evaluate(({ semence, plan, ambiances }) => {
                const w = window as unknown as Magasins;
                const s = semence.modules.sessionOS;
                w.useSessionOSStore.setState({
                    ...s,
                    sessions: s.sessions.map((seance: { id: string }) => ({ ...seance, status: seance.id === 'demo-seance-2' ? 'active' : 'done',
                        publicSummary: 'Le relais demeure silencieux.', gmSecrets: 'Hale connaît la panne.' })),
                    messages: [],
                });
                w.useStoryboardStore.setState({ moments: [], activeMomentId: null });
                w.useStoryboardStore.getState().addMoment({ campaignId: 'temoin-campagne', name: 'Amarrage au relais', description: 'Le sas s’ouvre.', color: 'cyan', icon: 'Anchor' });
                w.useStoryboardStore.getState().addMoment({ campaignId: 'temoin-campagne', name: 'La voix dans le relais', description: 'Un signal inconnu.', color: 'violet', icon: 'Radio' });

                const combat = w.useCombatStore.getState();
                combat.clearCombatants();
                combat.addCombatant({ name: 'Nel Varga', init: 17, hp: 9, hpMax: 12, isPlayer: true, faction: 'player', statuses: [] });
                combat.addCombatant({ name: "L'Écho", init: 12, hp: 18, hpMax: 24, isPlayer: false, faction: 'enemy', statuses: [] });
                combat.sortInitiative();

                w.useWhiteboardStore.getState().clearBoard();
                w.useWhiteboardStore.getState().setBackgroundMode('dark');
                w.useWhiteboardStore.getState().addPath({ id: 't0-sas', tool: 'rect', color: '#22d3ee', width: 4,
                    points: [{ x: 0.15, y: 0.2 }, { x: 0.55, y: 0.7 }] });
                w.useImageStore.setState({ mediaList: [{ id: 't0-plan', name: 'Plan du relais', path: plan, type: 'image', isFavorite: true }], projectionTarget: 'hub', projections: {} });
                const sons = w.useSoundStore.getState();
                w.useSoundStore.setState({ masterVolume: 1, atmospheres: sons.atmospheres.map((a, i) => i > 0 ? a : ({
                    ...a, pads: Object.fromEntries(Object.entries(a.pads).map(([id, pad], n) => [id, n === 0
                        ? { ...pad, title: 'Alarme du relais', filePath: 'demo/alarme.ogg' } : pad])),
                })) });
                w.useDiceStore.getState().clearHistory();
                const musique = w.useMusicStore.getState();
                w.useMusicStore.setState({ playlists: [], activePlaylistId: null, masterVolume: 1, autoFadeDuration: 0,
                    deckA: { ...musique.deckA, isPlaying: false, activePadId: null, activeTrackLabel: null },
                    deckB: { ...musique.deckB, isPlaying: false, activePadId: null, activeTrackLabel: null } });
                const ambiance = w.useAmbientStore.getState();
                w.useAmbientStore.setState({ presets: ambiances, masterVolume: 1, themeChargeId: null,
                    tracks: ambiance.tracks.map(t => ({ ...t, isPlaying: false })) });
                w.useClockStore.setState({ timerIsRunning: false });
            }, { semence: DEMO, plan: PLAN, ambiances: ambiancesInitiales });
        });

        const adresse = (g: GmOsLance) => `http://127.0.0.1:${g.ports.sync}/?window=remote&sync=${g.ports.sync}`;
        async function ouvrir(page: Page, aventure = false) {
            // Après l'essai sans jeton, un simple changement de fragment ne
            // recharge pas le module qui capture le secret au démarrage.
            if (page.url().startsWith(adresse(gmos))) await page.goto('about:blank');
            await page.goto(`${adresse(gmos)}${aventure ? '&mode=adventure' : ''}#token=${encodeURIComponent(secret)}`);
            expect(await page.evaluate(() => Boolean(window.appBridge)), 'une tablette MJ n’a pas le pont Electron').toBe(false);
            await expect(page.getByRole('button', { name: 'Pads', exact: true })).toHaveAttribute('aria-current', 'page', { timeout: 20_000 });
            await expect(page.getByText('Non appairée', { exact: true })).toHaveCount(0);
            // La demande initiale du serveur peut précéder le registre du rôle
            // remote. Une seconde connexion réclame le flux complet alors que
            // la vraie tablette est déjà appairée ; aucune donnée n'est forgée.
            await page.evaluate(port => new Promise<void>((resolve, reject) => {
                const socket = new WebSocket(`ws://127.0.0.1:${port}`);
                socket.addEventListener('open', () => { socket.close(); resolve(); }, { once: true });
                socket.addEventListener('error', () => reject(new Error('Demande de synchronisation impossible')), { once: true });
            }), gmos.ports.sync);
            await expect(page.getByRole('button', { name: 'Plan du relais' })).toBeVisible({ timeout: 20_000 });
        }
        async function onglet(page: Page, nom: string) {
            await page.getByRole('button', { name: nom, exact: true }).first().click();
            await expect(page.getByRole('button', { name: nom, exact: true }).first()).toHaveAttribute('aria-current', 'page');
        }
        async function capturer(page: Page, nom: string) {
            await page.evaluate(() => document.fonts.ready);
            await page.screenshot({ path: path.join(SORTIE, taille.nom, `${nom}.png`), animations: 'disabled', scale: 'css' });
        }

        async function verifierCadre(page: Page) {
            const navigation = page.getByRole('navigation', { name: 'Navigation du meneur' }).filter({ visible: true });
            await expect(navigation.getByRole('button')).toHaveCount(8);
            const limites = await navigation.getByRole('button').evaluateAll(elements => elements.map(e => {
                const r = e.getBoundingClientRect();
                return { nom: e.textContent, largeur: r.width, hauteur: r.height, dedans: r.x >= 0 && r.y >= 0 && r.right <= innerWidth + 1 && r.bottom <= innerHeight + 1 };
            }));
            expect(limites.every(r => r.largeur >= 44 && r.hauteur >= 44 && r.dedans), JSON.stringify(limites)).toBe(true);
            expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
            expect(await page.locator('[data-zone-de-travail]').evaluate(e => e.scrollWidth <= e.clientWidth + 1)).toBe(true);
        }
        async function cible(page: Page, nom: string) {
            const bouton = page.getByRole('button', { name: nom, exact: true });
            await bouton.scrollIntoViewIfNeeded();
            const r = await bouton.boundingBox();
            expect(r?.width).toBeGreaterThanOrEqual(44);
            expect(r?.height).toBeGreaterThanOrEqual(44);
            return bouton;
        }

        async function tracer(page: Page, tactile = false) {
            const r = await page.locator('main canvas').boundingBox();
            expect(r?.height, 'surface de dessin disponible').toBeGreaterThan(100);
            if (!r) throw Error('Canevas absent');
            const debut = { x: r.x + r.width * .2, y: r.y + r.height * .3 };
            const fin = { x: r.x + r.width * .65, y: r.y + r.height * .7 };
            if (tactile) {
                const cdp = await page.context().newCDPSession(page);
                await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [debut] });
                await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [fin] });
                await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
                await cdp.detach();
            } else {
                await page.mouse.move(debut.x, debut.y); await page.mouse.down();
                await page.mouse.move(fin.x, fin.y, { steps: 5 }); await page.mouse.up();
            }
        }

        test('Sons M2 — déclenchement, volume, sortie, filtre et vide', async ({ page }) => {
            const titre = 'Alarme très longue du sas de la station Varn';
            await gmos.fenetre.evaluate(({ titre, silence }) => {
                const w = window as unknown as Magasins;
                const s = w.useSoundStore.getState();
                w.useSoundStore.setState({ activeAtmosphereId: s.atmospheres[0].id, atmospheres: s.atmospheres.map((a, i) => i ? a : ({
                    ...a, pads: Object.fromEntries(Object.entries(a.pads).map(([id, p], n) => [id, { ...p, isActive: false,
                        title: n === 0 ? titre : `Écho ${n}`, filePath: n < 10 ? silence : null }]))
                })) });
            }, { titre, silence: SILENCE });
            await ouvrir(page); await onglet(page, 'Sons');
            await expect(page.getByRole('heading', { name: 'Sons', exact: true })).toBeVisible();
            await verifierCadre(page); await capturer(page, '01-sons');
            await (await cible(page, titre)).click();
            await expect.poll(() => gmos.fenetre.evaluate(() => (window as unknown as Magasins).useSoundStore.getState().atmospheres[0].pads.PAD_01.isActive)).toBe(true);
            await page.getByRole('button', { name: titre, exact: true }).click();
            await expect.poll(() => gmos.fenetre.evaluate(() => (window as unknown as Magasins).useSoundStore.getState().atmospheres[0].pads.PAD_01.isActive)).toBe(false);
            await page.getByRole('slider', { name: 'Volume — Bruitages' }).focus(); await page.keyboard.press('Home');
            await expect.poll(() => gmos.fenetre.evaluate(() => (window as unknown as Magasins).useSoundStore.getState().masterVolume)).toBe(0);
            await (await cible(page, 'Sortie — Bruitages')).click();
            await expect(page.getByRole('menuitem', { name: 'Sortie par défaut' })).toBeVisible();
            await page.keyboard.press('Escape'); await expect(page.getByRole('menu')).toHaveCount(0);
            await page.getByRole('searchbox', { name: 'Filtrer les bruitages' }).fill('echo 9');
            await expect(page.getByRole('button', { name: 'Écho 9', exact: true })).toBeVisible();
            await expect(page.getByRole('button', { name: titre, exact: true })).toHaveCount(0);
            await capturer(page, '02-sons-filtre');
            await page.getByRole('searchbox').fill('introuvable');
            await expect(page.getByText(/Aucun bruitage ne correspond/)).toBeVisible();
            await (await cible(page, 'Effacer le filtre')).click();
            await gmos.fenetre.evaluate(() => (window as unknown as Magasins).useSoundStore.setState({ atmospheres: [] }));
            await expect(page.getByText("Aucun bruitage dans l'ambiance active.")).toBeVisible();
            await expect(page.getByRole('slider')).toHaveCount(1);
            await capturer(page, '03-sons-vides');
        });

        test('Scénario M2 — ordre, noms entiers, déclenchement et vide', async ({ page }) => {
            const titre = 'Amarrage et longue inspection du sas de la station Varn';
            await gmos.fenetre.evaluate(t => {
                const w = window as unknown as Magasins;
                w.useStoryboardStore.setState({ moments: w.useStoryboardStore.getState().moments.map((m, i) => i ? m : { ...m, name: t }) });
            }, titre);
            await ouvrir(page); await onglet(page, 'Scénario'); await verifierCadre(page);
            const moment = await cible(page, `01 ${titre}`);
            await expect(moment).toContainText(titre); await capturer(page, '04-scenario');
            await moment.click();
            await expect.poll(() => gmos.fenetre.evaluate(() => {
                const s = (window as unknown as Magasins).useStoryboardStore.getState();
                return s.moments.find(m => m.id === s.activeMomentId)?.name;
            })).toBe(titre);
            await gmos.fenetre.evaluate(() => (window as unknown as Magasins).useStoryboardStore.setState({ moments: [] }));
            await expect(page.getByText('Aucun moment dans le storyboard de cette campagne.')).toBeVisible();
            await capturer(page, '05-scenario-vide');
        });

        test('Tableau M2 — outils nommés, dessin, historique et laser', async ({ page }) => {
            await ouvrir(page); await onglet(page, 'Tableau'); await verifierCadre(page);
            for (const n of ['Crayon','Gomme','Laser','Rectangle','Cercle','Trait fin','Trait moyen','Trait épais','Annuler','Rétablir','Effacer tout']) await cible(page, n);
            await expect(page.getByRole('group', { name: 'Couleurs', exact: true }).getByRole('button')).toHaveCount(8);
            await capturer(page, '06-tableau');
            await (await cible(page, 'Rectangle')).click();
            await (await cible(page, 'Trait épais')).click();
            await (await cible(page, 'Choisir la couleur #ef4444')).click();
            // Dessiner aussitôt éprouve aussi l'écho optimiste des réglages.
            await tracer(page, taille.nom === 'compact');
            await expect.poll(() => gmos.fenetre.evaluate(() => {
                const p = (window as unknown as Magasins).useWhiteboardStore.getState().paths.at(-1);
                return p && [p.tool, p.color, p.width, p.points.length];
            })).toEqual(['rect', '#ef4444', 8, 2]);
            await capturer(page, '07-tableau-dessine');
            await page.getByRole('button', { name: 'Annuler', exact: true }).click();
            await expect.poll(() => gmos.fenetre.evaluate(() => (window as unknown as Magasins).useWhiteboardStore.getState().paths.length)).toBe(1);
            await page.getByRole('button', { name: 'Rétablir', exact: true }).click();
            await expect.poll(() => gmos.fenetre.evaluate(() => (window as unknown as Magasins).useWhiteboardStore.getState().paths.length)).toBe(2);
            await (await cible(page, 'Passer en fond clair')).click();
            await expect.poll(() => gmos.fenetre.evaluate(() => (window as unknown as Magasins).useWhiteboardStore.getState().backgroundMode)).toBe('light');
            await (await cible(page, 'Gomme')).click(); await tracer(page);
            await expect.poll(() => gmos.fenetre.evaluate(() => (window as unknown as Magasins).useWhiteboardStore.getState().paths.at(-1)?.tool)).toBe('eraser');
            await capturer(page, '08-tableau-clair');
            await page.getByRole('button', { name: 'Laser', exact: true }).click(); await tracer(page);
            await expect.poll(() => gmos.fenetre.evaluate(() => (window as unknown as Magasins).useWhiteboardStore.getState().paths.some(p => p.isTemporary))).toBe(true);
            await expect.poll(() => gmos.fenetre.evaluate(() => (window as unknown as Magasins).useWhiteboardStore.getState().paths.some(p => p.isTemporary)), { timeout: 5000 }).toBe(false);
            await page.getByRole('button', { name: 'Effacer tout', exact: true }).click();
            await expect.poll(() => gmos.fenetre.evaluate(() => (window as unknown as Magasins).useWhiteboardStore.getState().paths.length)).toBe(0);
            // Un choix venu du PC reprend la main sur l'écho local.
            await gmos.fenetre.evaluate(() => {
                const s = (window as unknown as Magasins).useWhiteboardStore.getState();
                s.setTool('circle'); s.setColor('#3b82f6'); s.setWidth(2);
            });
            await expect(page.getByRole('button', { name: 'Cercle', exact: true })).toHaveAttribute('aria-pressed', 'true');
            await expect(page.getByRole('button', { name: 'Choisir la couleur #3b82f6', exact: true })).toHaveAttribute('aria-pressed', 'true');
            await expect(page.getByRole('button', { name: 'Trait fin', exact: true })).toHaveAttribute('aria-pressed', 'true');
        });

        test('Notes M2 — six vues, détails, Markdown, recherches et secrets', async ({ page }) => {
            await ouvrir(page); await onglet(page, 'Notes'); await verifierCadre(page);
            const vues = page.getByRole('navigation', { name: 'Vues des Notes' });
            await expect(vues.getByRole('button')).toHaveCount(6);
            const limites = await vues.getByRole('button').evaluateAll(es => es.map(e => {const r=e.getBoundingClientRect();return r.width>=44&&r.height>=44&&r.right<=innerWidth&&r.bottom<=innerHeight;}));
            expect(limites.every(Boolean)).toBe(true);
            await expect(page.getByText('Le relais demeure silencieux.')).toBeVisible();
            await capturer(page, '09-notes-seance');
            const scene = page.getByRole('button', { name: /Entretien avec Hale/ }).first();
            await scene.click(); await expect(scene).toHaveAttribute('aria-expanded','true');
            await expect(page.getByText('Il repond a tout, et trop vite.')).toBeVisible();
            await capturer(page, '10-notes-detail');
            await vues.getByRole('button', { name: /^Trame/ }).click();
            const acte = page.getByRole('button', { name: /Ce que Hale n'a pas dit/ }).first();
            await expect(acte).toHaveAttribute('aria-expanded', 'true'); await acte.click();
            await expect(acte).toHaveAttribute('aria-expanded', 'false'); await acte.click();
            await expect(page.getByText('Hale ment sur la date, pas sur le nombre.')).toBeVisible();
            await capturer(page, '11-notes-trame');
            await vues.getByRole('button', { name: /^Chroniques/ }).click();
            await page.getByRole('searchbox', { name: 'Chercher dans le wiki' }).fill('station');
            await page.getByRole('button', { name: /Station Varn/ }).click();
            await expect(page.getByText(/Équipage nominal : neuf/)).toBeVisible();
            await capturer(page, '12-notes-chroniques');
            await page.getByRole('searchbox').fill('zzzinexistant');
            await expect(page.getByText(/Rien ne correspond/)).toBeVisible();
            await (await cible(page, 'Effacer la recherche')).click();
            await vues.getByRole('button', { name: /^Indices/ }).click();
            await expect(page.getByText('Le café encore chaud')).toBeVisible();
            await capturer(page, '13-notes-indices');
            await vues.getByRole('button', { name: 'Secrets', exact: true }).click();
            await expect(page.getByText('Hale connaît la panne.')).toBeVisible();
            await capturer(page, '14-notes-secrets');
        });

        test('Nexus Wiki M2 — dossiers, recherche, Markdown et retour', async ({ page }) => {
            await ouvrir(page); await onglet(page, 'Notes');
            await page.getByRole('button', { name: 'Nexus Wiki', exact: true }).click();
            await expect(page.getByRole('button', { name: /^PNJ/ })).toBeVisible();
            await verifierCadre(page); await capturer(page, '15-coffre');
            await page.getByRole('button', { name: /^PNJ/ }).click();
            await expect(page.getByRole('navigation', { name: 'Chemin dans le coffre' })).toBeVisible();
            await capturer(page, '16-coffre-dossier');
            await page.getByRole('navigation', { name: 'Chemin dans le coffre' }).getByRole('button', { name: 'Coffre', exact: true }).click();
            await page.getByRole('searchbox', { name: 'Chercher une note dans le coffre' }).fill('echo');
            await expect(page.getByRole('button', { name: /L'Écho/ })).toBeVisible();
            await capturer(page, '17-coffre-recherche');
            await (await cible(page, 'Effacer la recherche')).click();
            await page.getByRole('button', { name: 'Station Varn.md', exact: true }).click();
            await expect(page.getByRole('heading', { name: 'Station Varn', exact: true })).toBeVisible();
            await expect(page.getByRole('table')).toBeVisible();
            await verifierCadre(page); await capturer(page, '18-coffre-note');
            await (await cible(page, 'Revenir à la liste')).click();
            await expect(page.getByRole('heading', { name: 'Station Varn', exact: true })).toHaveCount(0);
            await (await cible(page, 'Recharger le coffre')).click();
            await expect(page.getByRole('button', { name: 'Station Varn.md', exact: true })).toBeVisible();
        });

        test('Messages M2 — destinataires, bouton, Entrée et fil long', async ({ page }) => {
            const nom = 'Nel Varga et son très long nom de personnage';
            await gmos.fenetre.evaluate(n => {
                const s = (window as unknown as Magasins).useSessionOSStore;
                s.setState({ players: s.getState().players.map(p => ({ ...p, characters: p.characters.map(c => c.id === 'temoin-pj-1' ? { ...c, name: n } : c) })) });
            }, nom);
            await ouvrir(page); await onglet(page, 'Messages'); await verifierCadre(page);
            await expect(page.getByRole('textbox', { name: 'Message à envoyer' })).toHaveAttribute('placeholder', /Tous les joueurs/);
            await expect(page.getByRole('button', { name: 'Envoyer le message' })).toBeDisabled();
            await capturer(page, '19-messages');
            await page.getByRole('textbox', { name: 'Message à envoyer' }).fill('Le sas est ouvert.');
            await (await cible(page, 'Envoyer le message')).click();
            await expect.poll(() => gmos.fenetre.evaluate(() => (window as unknown as Magasins).useSessionOSStore.getState().messages.some(m => m.toId === 'all' && m.content === 'Le sas est ouvert.'))).toBe(true);
            await expect(page.getByRole('textbox')).toHaveValue('');
            await (await cible(page, nom)).click();
            await expect(page.getByRole('textbox')).toHaveAttribute('placeholder', `Écrire à ${nom}…`);
            await page.getByRole('textbox').fill('Reste près du relais.'); await page.getByRole('textbox').press('Enter');
            await expect.poll(() => gmos.fenetre.evaluate(() => (window as unknown as Magasins).useSessionOSStore.getState().messages.some(m => m.toId === 'temoin-pj-1' && m.content === 'Reste près du relais.'))).toBe(true);
            await expect(page.getByText('Reste près du relais.', { exact: true })).toBeVisible();
            await expect(page.getByText('Le sas est ouvert.', { exact: true })).toHaveCount(0);
            await capturer(page, '20-messages-prives');
            await page.getByRole('button', { name: 'Tous', exact: true }).click();
            await expect(page.getByText('Le sas est ouvert.', { exact: true })).toBeVisible();
            await page.getByRole('textbox').fill('mot_sans_espace_'.repeat(40)); await page.getByRole('textbox').press('Enter');
            await expect(page.getByText('mot_sans_espace_'.repeat(40), { exact: true })).toBeVisible();
            await verifierCadre(page); await capturer(page, '21-messages-longs');
            const input = await page.getByRole('textbox').boundingBox();
            expect(input && input.y >= 0 && input.y + input.height < taille.height - 1).toBe(true);
        });

        if (taille.nom === 'compact') test('Nexus Wiki M2 — chemin très long à 360 px', async ({ page }) => {
            const dossier = 'Dossier_de_la_station_'.repeat(3);
            const racine = path.join(gmos.profil, 'coffre', dossier);
            fs.mkdirSync(racine, { recursive: true });
            fs.writeFileSync(path.join(racine, 'Passerelle.md'), '# Passerelle\n\nUne note fictive au bout du chemin.');
            await ouvrir(page); await onglet(page, 'Notes');
            await page.getByRole('button', { name: 'Nexus Wiki', exact: true }).click();
            await page.getByRole('button', { name: new RegExp('^' + dossier) }).click();
            await expect(page.getByRole('navigation', { name: 'Chemin dans le coffre' })).toContainText(dossier);
            await verifierCadre(page); await capturer(page, '24-coffre-chemin-long');
            await page.getByRole('button', { name: 'Passerelle.md', exact: true }).click();
            await expect(page.getByRole('heading', { name: 'Passerelle', exact: true })).toBeVisible();
            await verifierCadre(page);
        });

        test('Aventure et non-appairage M2 — états de lecture', async ({ page, browser }) => {
            await ouvrir(page, true); await onglet(page, 'Notes');
            await page.getByRole('button', { name: 'Secrets', exact: true }).click();
            await expect(page.locator('main')).toContainText('Contenu protégé par le Mode Aventure.');
            expect(await page.locator('main').textContent()).not.toContain('Hale connaît la panne.');
            await capturer(page, '22-notes-aventure');
            // Le jeton est retenu dans sessionStorage ; une navigation ne l'efface pas.
            const neutre = await browser.newPage({ viewport: { width: taille.width, height: taille.height }, serviceWorkers: 'block' });
            try {
                await neutre.goto(adresse(gmos));
                await expect(neutre.getByText('Non appairée', { exact: true })).toBeVisible();
                await onglet(neutre, 'Sons'); await expect(neutre.getByText("Aucun bruitage dans l'ambiance active.")).toBeVisible();
                await onglet(neutre, 'Scénario'); await expect(neutre.getByText('Aucun moment dans le storyboard de cette campagne.')).toBeVisible();
                await onglet(neutre, 'Notes'); await expect(neutre.getByText('Le relais demeure silencieux.')).toHaveCount(0);
                await onglet(neutre, 'Messages'); await expect(neutre.getByText('Aucun joueur connecté, et aucun message.')).toBeVisible();
                await capturer(neutre, '23-non-appairee');
            } finally { await neutre.close(); }
        });
    });
}
