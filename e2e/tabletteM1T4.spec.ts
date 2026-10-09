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
 * T4/M1 meneur : navigateur appairé, SyncServer réel, campagne fictive et profil jetable.
 * Les magasins ne servent qu'à planter le décor et vérifier l'effet côté MJ.
 * Aucun état ni message n'est injecté dans la télécommande pour réussir un geste.
 *
 * npm.cmd run build
 * npx.cmd playwright test e2e/tabletteMeneurT0.spec.ts --reporter=list
 */
const ICI = path.dirname(fileURLToPath(import.meta.url));
// T2 peut rejouer le banc sans écraser les 68 images de référence T0.
const SORTIE = process.env.GMOS_M1_CAPTURES_DIR
    ? path.resolve(process.env.GMOS_M1_CAPTURES_DIR)
    : path.join(ICI, '../documentation/Planning/tablettes/T4-meneur/m1');
const DEMO = JSON.parse(fs.readFileSync(path.join(ICI, 'donnees/campagne-de-demo.json'), 'utf8'));
const PLAN = 'data:image/png;base64,' + fs.readFileSync(path.join(ICI, 'donnees/plan-station-varn.png')).toString('base64');
// Une seconde de PCM muet, en boucle : éprouver la platine sans fichier utilisateur.
const pcm = Buffer.alloc(16044);
pcm.write('RIFF'); pcm.writeUInt32LE(16036, 4); pcm.write('WAVEfmt ', 8);
pcm.writeUInt32LE(16, 16); pcm.writeUInt16LE(1, 20); pcm.writeUInt16LE(1, 22);
pcm.writeUInt32LE(8000, 24); pcm.writeUInt32LE(16000, 28); pcm.writeUInt16LE(2, 32);
pcm.writeUInt16LE(16, 34); pcm.write('data', 36); pcm.writeUInt32LE(16000, 40);
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
    test.describe(`T4/M1 meneur — ${taille.nom}`, () => {
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
            // Plus de seconde connexion pour réclamer le flux (§ 130, 09/10) : le
            // serveur demande l'état complet après l'inscription. Le plan visible
            // ci-dessous prouve que la première connexion suffit.
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
        }
        async function cible(page: Page, nom: string) {
            const bouton = page.getByRole('button', { name: nom, exact: true });
            await bouton.scrollIntoViewIfNeeded();
            const r = await bouton.boundingBox();
            expect(r?.width).toBeGreaterThanOrEqual(44);
            expect(r?.height).toBeGreaterThanOrEqual(44);
            return bouton;
        }
        async function resultat(page: Page) {
            await expect(page.getByRole('dialog', { name: 'Résultat du jet' })).toBeVisible();
            await page.keyboard.press('Escape');
            await expect(page.getByRole('dialog')).toHaveCount(0);
        }

        test('Pads M1 — projection, volumes, sortie, filtre et état vide', async ({ page }) => {
            await ouvrir(page);
            await verifierCadre(page);
            await capturer(page, '01-pads');
            await (await cible(page, 'Plan du relais')).click();
            await expect.poll(() => gmos.fenetre.evaluate(() => (window as unknown as Magasins).useImageStore.getState().projections.hub)).toBe(PLAN);
            for (const [nom, voie] of [['Musique', 'music'], ['Ambiances', 'ambient']] as const) {
                const slider = page.getByRole('slider', { name: `Volume — ${nom}` });
                await slider.focus(); await page.keyboard.press('Home');
                await expect.poll(() => gmos.fenetre.evaluate(v => {
                    const w = window as unknown as Magasins;
                    return v === 'music' ? w.useMusicStore.getState().masterVolume : w.useAmbientStore.getState().masterVolume;
                }, voie)).toBe(0);
                await (await cible(page, `Sortie — ${nom}`)).click();
                await expect(page.getByRole('menu')).toBeVisible();
                await page.getByRole('menuitem', { name: 'Sortie par défaut' }).click();
                await expect(page.getByRole('menu')).toHaveCount(0);
            }
            await page.getByRole('searchbox', { name: 'Filtrer les pads' }).fill('foret');
            await expect(page.getByRole('button', { name: /Forêt/ })).toBeVisible();
            await capturer(page, '02-pads-filtre');
            await page.getByRole('searchbox', { name: 'Filtrer les pads' }).fill('inexistant');
            await expect(page.getByText(/Rien ne correspond/)).toBeVisible();
            await (await cible(page, 'Effacer le filtre')).click();
            await gmos.fenetre.evaluate(() => {
                const w = window as unknown as Magasins;
                w.useImageStore.setState({ mediaList: [] });
                w.useMusicStore.setState({ playlists: [] });
                w.useAmbientStore.setState({ presets: [] });
            });
            await expect(page.getByText('Aucun pad configuré sur cet univers.')).toBeVisible();
            await expect(page.getByRole('slider')).toHaveCount(2);
            await capturer(page, '03-pads-vides');
        });

        test('Dés M1 — compteurs, sept dés, onze modes, formule et sorties', async ({ page }) => {
            await ouvrir(page); await onglet(page, 'Dés');
            await verifierCadre(page);
            await capturer(page, '04-des');
            for (const n of ['Augmenter la quantité', 'Augmenter le modificateur', 'Diminuer le seuil']) await (await cible(page, n)).click();
            await (await cible(page, 'Lancer D20')).click();
            await expect.poll(() => gmos.fenetre.evaluate(() => {
                const h = (window as unknown as Magasins).useDiceStore.getState().history;
                return h.length && h[0].rolls.length === 2 && h[0].modifier === 1;
            })).toBe(true);
            await expect(page.getByRole('dialog', { name: 'Résultat du jet' })).toBeVisible();
            await expect.poll(() => page.getByRole('dialog').evaluate(e => getComputedStyle(e).opacity)).toBe('1');
            await capturer(page, '05-resultat');
            await (await cible(page, 'Fermer le résultat')).click();
            await expect(page.getByRole('dialog')).toHaveCount(0);
            await (await cible(page, 'Mode de lancer')).click();
            await expect(page.getByRole('button', { name: 'Formule Libre', exact: true })).toBeVisible();
            await page.keyboard.press('Escape');
            await expect(page.getByRole('button', { name: 'Formule Libre', exact: true })).toHaveCount(0);
            await (await cible(page, 'Mode de lancer')).click();
            for (const mode of ['Standard d20/d6', 'Somme Explosive', 'Formule Libre', 'Jet de Seuil (Target)', 'Pool de Dés (Succès)', 'Pool Explosif', 'Avantage (Garde Meilleur)', 'Désavantage (Garde Pire)', 'Year Zero Engine', 'FATE / Fudge', 'Rolemaster']) await expect(page.getByRole('button', { name: mode, exact: true })).toHaveCount(1);
            await page.getByRole('button', { name: 'Formule Libre', exact: true }).click();
            await page.getByRole('textbox', { name: 'Formule de dés' }).fill('2d1+3');
            await capturer(page, '06-formule');
            await (await cible(page, 'Lancer la formule personnalisée')).click();
            await expect.poll(() => gmos.fenetre.evaluate(() => (window as unknown as Magasins).useDiceStore.getState().history[0]?.total)).toBe(5);
            await resultat(page);
            await (await cible(page, 'Réinitialiser les dés')).click();
        });

        test('Dés M1 — pilote puis dés échelonnés envoyés au moteur du meneur', async ({ page }) => {
            await gmos.fenetre.evaluate(() => {
                const s = (window as unknown as Magasins).useSessionOSStore;
                s.setState({ customGameDrivers: [{ id: 'm1-pilote', name: 'Pilote témoin M1', dice: { engine: 'standard', logic: 'sum', defaultDice: '1d1' } } as never], campaigns: s.getState().campaigns.map(c => ({ ...c, system: 'm1-pilote' })) });
            });
            await ouvrir(page); await onglet(page, 'Dés');
            await (await cible(page, 'Lancer Système')).click();
            await expect.poll(() => gmos.fenetre.evaluate(() => (window as unknown as Magasins).useDiceStore.getState().history[0]?.title)).toContain('Jet Système');
            await resultat(page);
            await gmos.fenetre.evaluate(() => {
                const s = (window as unknown as Magasins).useSessionOSStore;
                s.setState({ customGameDrivers: s.getState().customGameDrivers.map(d => ({ ...d, dice: { engine: 'yze-echelonne', logic: 'success', baseDie: 6 }, jet: { desEchelonnes: true } } as never)) });
            });
            await expect(page.getByRole('combobox', { name: 'Attribut', exact: true })).toBeVisible();
            await page.getByRole('combobox', { name: 'Attribut', exact: true }).selectOption('A');
            await page.getByRole('combobox', { name: 'Compétence', exact: true }).selectOption('C');
            await page.getByRole('combobox', { name: 'Équip.', exact: true }).selectOption('D');
            await capturer(page, '07-echelonnes');
            await (await cible(page, 'Lancer Système')).click();
            await expect.poll(() => gmos.fenetre.evaluate(() => (window as unknown as Magasins).useDiceStore.getState().history[0]?.rolls.map(d => d.sides).sort((a,b) => a-b))).toEqual([6,8,12]);
            await resultat(page); await verifierCadre(page);
        });

        test('Combat M1 — noms entiers, PV bornés, sans jauge, tour et état vide', async ({ page }) => {
            await gmos.fenetre.evaluate(() => {
                const c = (window as unknown as Magasins).useCombatStore.getState();
                c.addCombatant({ name: 'Idris Khel sans jauge', init: 10, isPlayer: true, faction: 'player', statuses: [] });
                c.updateCombatant(c.combatants[0].id, { name: 'Nel Varga responsable de la mission de reconnaissance au relais' });
            });
            await ouvrir(page); await onglet(page, 'Combat'); await verifierCadre(page);
            await capturer(page, '08-combat');
            const retirer = page.getByRole('button', { name: /^Retirer un point de vie à Nel/ });
            const ajouter = page.getByRole('button', { name: /^Ajouter un point de vie à Nel/ });
            await retirer.click();
            await expect.poll(() => gmos.fenetre.evaluate(() => (window as unknown as Magasins).useCombatStore.getState().combatants[0].hp)).toBe(8);
            await ajouter.click();
            await expect.poll(() => gmos.fenetre.evaluate(() => (window as unknown as Magasins).useCombatStore.getState().combatants[0].hp)).toBe(9);
            await expect(page.getByRole('button', { name: /point de vie à Idris/ })).toHaveCount(0);
            await gmos.fenetre.evaluate(() => { const c = (window as unknown as Magasins).useCombatStore.getState(); c.updateCombatant(c.combatants[0].id, { hp: 12 }); });
            await expect.poll(() => ajouter.locator('..').textContent()).toContain('12'); await ajouter.click();
            await expect.poll(() => gmos.fenetre.evaluate(() => (window as unknown as Magasins).useCombatStore.getState().combatants[0].hp)).toBe(12);
            await (await cible(page, 'Suivant')).click();
            await expect.poll(() => gmos.fenetre.evaluate(() => (window as unknown as Magasins).useCombatStore.getState().currentTurnIdx)).toBe(1);
            await gmos.fenetre.evaluate(() => (window as unknown as Magasins).useCombatStore.getState().clearCombatants());
            await expect(page.getByText('Aucun combat en cours.')).toBeVisible();
            await capturer(page, '09-combat-vide');
        });

        test('Combat M1 — mode Aventure protège les PV et le modèle de santé ennemi', async ({ page }) => {
            await gmos.fenetre.evaluate(() => { const c = (window as unknown as Magasins).useCombatStore.getState(); c.updateCombatant(c.combatants[1].id, { healthSystem: { type: 'clocks', state: 'healthy', data: { filled: 3, segments: 7 } } }); });
            await ouvrir(page, true);
            await onglet(page, 'Combat');
            await expect(page.getByRole('button', { name: "Retirer un point de vie à L'Écho" })).toHaveCount(0);
            await expect(page.getByText('3 / 7', { exact: true })).toHaveCount(0);
            await expect(page.getByText('Caché', { exact: true })).toBeVisible();
            await expect(page.getByRole('button', { name: 'Retirer un point de vie à Nel Varga' })).toBeVisible();
            await capturer(page, '10-combat-aventure');
        });

        test('État M1 — lecture complète, messages, appui court et arrêt des trois voies', async ({ page }) => {
            await ouvrir(page);
            await page.getByRole('button', { name: 'Plan du relais' }).click();
            await gmos.fenetre.evaluate(url => {
                const w = window as unknown as Magasins;
                w.useMusicStore.setState({ activePlaylistId: 'm1-musique', playlists: [{ id: 'm1-musique', name: 'Témoin muet M1', pads: [{ id: 'm1-pcm', label: 'Une musique au nom très long pendant la découverte de Station Varn', url, type: 'local', loopA: null, loopB: null }] }] });
                const a = w.useAmbientStore.getState(); w.useAmbientStore.setState({ themeChargeId: a.presets[0].id, tracks: a.tracks.map((t,i) => ({ ...t, isPlaying: i === 0 })) });
                const sons = w.useSoundStore.getState(); w.useSoundStore.setState({ atmospheres: sons.atmospheres.map((a,i) => i ? a : ({ ...a, pads: Object.fromEntries(Object.entries(a.pads).map(([id,p],n) => [id,{ ...p, isActive: n === 0 }])) })) });
                w.useClockStore.setState({ timerRemaining: 95, timerIsRunning: true });
                w.useSessionOSStore.setState({ messages: [{ id: 'm1-message', fromId: 'temoin-pj-1', fromName: 'Nel Varga', toId: 'GM', toName: 'MJ', content: 'Au relais.', timestamp: Date.now(), isRead: false }] });
            }, SILENCE);
            await page.getByRole('button', { name: 'Une musique au nom très long pendant la découverte de Station Varn', exact: true }).click();
            const header = page.locator('header').first();
            await expect(header.getByText('Une musique au nom très long pendant la découverte de Station Varn')).toBeVisible();
            await expect(header.getByText('Arcologie', { exact: true })).toBeVisible();
            // Le véritable minuteur continue de descendre pendant le démarrage audio.
            await expect(header.getByText(/^1:[0-3]\d$/)).toBeVisible();
            await verifierCadre(page); await capturer(page, '11-etat');
            const couper = await cible(page, 'Couper le son — maintenir appuyé');
            await couper.click({ delay: 150 });
            expect(await gmos.fenetre.evaluate(() => (window as unknown as Magasins).useAmbientStore.getState().tracks.some(t => t.isPlaying))).toBe(true);
            await couper.click({ delay: 850 });
            await expect.poll(() => gmos.fenetre.evaluate(() => {
                const w = window as unknown as Magasins;
                return !w.useAmbientStore.getState().tracks.some(t => t.isPlaying) && Object.values(w.useSoundStore.getState().atmospheres[0].pads).every(p => !p.isActive) && !w.useMusicStore.getState().deckA.isPlaying && !w.useMusicStore.getState().deckB.isPlaying;
            })).toBe(true);
            expect(await gmos.fenetre.evaluate(() => (window as unknown as Magasins).useImageStore.getState().projections.hub)).toBe(PLAN);
            await expect(header.getByText('Une musique au nom très long pendant la découverte de Station Varn')).toHaveCount(0);
            await expect(header.getByText('Arcologie', { exact: true })).toHaveCount(0);
            await page.getByRole('button', { name: '1 message(s) non lu(s)' }).click();
            await expect(page.getByRole('button', { name: 'Messages', exact: true }).filter({ visible: true })).toHaveAttribute('aria-current', 'page');
            await capturer(page, '12-etat-messages');
        });

        test('Appairage M1 — sans jeton, pas de pads ni combattants du meneur', async ({ page }) => {
            await page.goto(adresse(gmos));
            await expect(page.getByText('Non appairée', { exact: true })).toBeVisible({ timeout: 20000 });
            await expect(page.getByRole('button', { name: 'Plan du relais' })).toHaveCount(0);
            await verifierCadre(page); await capturer(page, '13-non-appairee');
            await onglet(page, 'Combat');
            await expect(page.getByText('Aucun combat en cours.')).toBeVisible();
        });

        if (taille.nom === 'compact') test('Résultat long M1 — Fermer reste accessible après défilement de 99 dés', async ({ page }) => {
            await ouvrir(page); await onglet(page, 'Dés');
            await page.getByRole('button', { name: 'Mode de lancer', exact: true }).click();
            await page.getByRole('button', { name: 'Formule Libre', exact: true }).click();
            await page.getByRole('textbox', { name: 'Formule de dés' }).fill('99d1+1');
            await page.getByRole('button', { name: 'Lancer la formule personnalisée' }).click();
            await expect.poll(() => gmos.fenetre.evaluate(() => (window as unknown as Magasins).useDiceStore.getState().history[0]?.rolls.length)).toBe(99);
            const dialogue = page.getByRole('dialog', { name: 'Résultat du jet' });
            await expect(dialogue).toBeVisible();
            await dialogue.locator('[data-resultat-des-contenu]').evaluate(e => { e.scrollTop = e.scrollHeight; });
            await expect.poll(() => dialogue.getByRole('button', { name: 'Fermer le résultat', exact: true }).evaluate(e => {
                const r = e.getBoundingClientRect();
                return r.top >= 0 && r.bottom <= innerHeight && r.width >= 44 && r.height >= 44;
            })).toBe(true);
            await capturer(page, '14-resultat-long');
            await dialogue.getByRole('button', { name: 'Fermer le résultat', exact: true }).click();
            await expect(dialogue).toHaveCount(0);
        });

        if (taille.nom === 'paysage') test('Résultat M1 — expiration à quinze secondes et fermeture du fond', async ({ page }) => {
            await ouvrir(page); await onglet(page, 'Dés');
            await page.getByRole('button', { name: 'Lancer D20' }).click();
            await expect(page.getByRole('dialog')).toBeVisible();
            await page.mouse.click(5,5); await expect(page.getByRole('dialog')).toHaveCount(0);
            await page.getByRole('button', { name: 'Lancer D20' }).click();
            await expect(page.getByRole('dialog')).toBeVisible();
            await expect(page.getByRole('dialog')).toHaveCount(0, { timeout: 17000 });
        });
    });
}
