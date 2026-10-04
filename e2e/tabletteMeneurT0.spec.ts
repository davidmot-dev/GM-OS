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
 * T0 meneur : navigateur appairé, SyncServer réel, campagne fictive et profil jetable.
 * Les magasins ne servent qu'à planter le décor et vérifier l'effet côté MJ.
 * Aucun état ni message n'est injecté dans la télécommande pour réussir un geste.
 *
 * npm.cmd run build
 * npx.cmd playwright test e2e/tabletteMeneurT0.spec.ts --reporter=list
 */
const ICI = path.dirname(fileURLToPath(import.meta.url));
const SORTIE = path.join(ICI, '../documentation/Planning/tablettes/T0-meneur');
const DEMO = JSON.parse(fs.readFileSync(path.join(ICI, 'donnees/campagne-de-demo.json'), 'utf8'));
const PLAN = 'data:image/png;base64,' + fs.readFileSync(path.join(ICI, 'donnees/plan-station-varn.png')).toString('base64');

type Magasins = {
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
    { nom: 'telephone', width: 390, height: 844 },
    { nom: 'portrait', width: 820, height: 1180 },
    { nom: 'paysage', width: 1180, height: 820 },
    { nom: 'pupitre', width: 1440, height: 900 },
] as const;

// Edge est déjà installé ; aucune installation de navigateur pour ce relevé.
test.use({ channel: 'msedge' });

for (const taille of TAILLES) {
    test.describe(`T0 meneur — ${taille.nom}`, () => {
        test.use({ viewport: { width: taille.width, height: taille.height }, locale: 'fr-FR', timezoneId: 'Europe/Brussels', serviceWorkers: 'block' });
        let gmos: GmOsLance;
        let secret: string;

        test.beforeAll(async () => {
            fs.mkdirSync(path.join(SORTIE, taille.nom), { recursive: true });
            gmos = await lancerGmOs({
                semence: path.join(ICI, 'donnees/campagne-de-demo.json'),
                preparerLeProfil: profil => fs.cpSync(path.join(ICI, 'donnees/coffre-de-demo'), path.join(profil, 'coffre'), { recursive: true }),
            });
            await attendreLHydratation(gmos);
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
            await gmos.fenetre.evaluate(({ semence, plan }) => {
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
            }, { semence: DEMO, plan: PLAN });
        });

        const adresse = (g: GmOsLance) => `http://127.0.0.1:${g.ports.sync}/?window=remote&sync=${g.ports.sync}`;
        async function ouvrir(page: Page) {
            // Après l'essai sans jeton, un simple changement de fragment ne
            // recharge pas le module qui capture le secret au démarrage.
            if (page.url().startsWith(adresse(gmos))) await page.goto('about:blank');
            await page.goto(`${adresse(gmos)}#token=${encodeURIComponent(secret)}`);
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

        test('Appairage — le jeton donne accès au flux du meneur', async ({ page }) => {
            await page.goto(adresse(gmos));
            await expect(page.getByText('Non appairée', { exact: true })).toBeVisible({ timeout: 20_000 });
            await capturer(page, '00-non-appairee');
            await ouvrir(page);
            await expect(page.getByRole('button', { name: 'Plan du relais' })).toBeVisible();
        });

        test('Pads — projeter un favori et régler la musique', async ({ page }) => {
            await ouvrir(page);
            await capturer(page, '01-pads');
            await page.getByRole('button', { name: 'Plan du relais' }).click();
            await expect.poll(() => gmos.fenetre.evaluate(() => (window as unknown as Magasins).useImageStore.getState().projections.hub)).toBe(PLAN);
            await page.getByRole('slider', { name: 'Volume — Musique' }).focus();
            await page.keyboard.press('Home');
            await expect.poll(() => gmos.fenetre.evaluate(() => (window as unknown as Magasins).useMusicStore.getState().masterVolume)).toBe(0);
        });

        test('Ligne d’état — maintenir Couper le son arrête les bruitages', async ({ page }) => {
            await gmos.fenetre.evaluate(() => {
                const w = window as unknown as Magasins;
                const sons = w.useSoundStore.getState();
                w.useSoundStore.setState({ atmospheres: sons.atmospheres.map((a, i) => i > 0 ? a : ({
                    ...a, pads: Object.fromEntries(Object.entries(a.pads).map(([id, pad], n) => [id, n === 0
                        ? { ...pad, isActive: true } : pad])),
                })) });
            });
            await ouvrir(page);
            const couper = page.getByRole('button', { name: 'Couper le son — maintenir appuyé' });
            const boite = await couper.boundingBox();
            if (!boite) throw new Error('Bouton Couper le son hors écran');
            await page.mouse.move(boite.x + boite.width / 2, boite.y + boite.height / 2);
            await page.mouse.down();
            await page.waitForTimeout(850);
            await page.mouse.up();
            await expect.poll(() => gmos.fenetre.evaluate(() => {
                const sons = (window as unknown as Magasins).useSoundStore.getState();
                return Object.values(sons.atmospheres[0].pads).every(p => !p.isActive);
            })).toBe(true);
        });

        test('Dés — lancer un dé et fermer son résultat', async ({ page }) => {
            await ouvrir(page);
            await onglet(page, 'Dés');
            await expect(page.getByRole('button', { name: 'Lancer D20' })).toBeVisible();
            await capturer(page, '02-des');
            await page.getByRole('button', { name: 'Lancer D20' }).click();
            await expect.poll(() => gmos.fenetre.evaluate(() => (window as unknown as Magasins).useDiceStore.getState().history.length)).toBeGreaterThan(0);
            await expect(page.getByText(/Cliquer pour fermer/i)).toBeVisible();
            await capturer(page, '03-resultat-des');
            await page.mouse.click(5, 5);
            await expect(page.getByText(/Cliquer pour fermer/i)).toHaveCount(0);
        });

        test('Défaut T0 — toucher « Cliquer pour fermer » doit fermer le résultat', async ({ page }) => {
            test.fail(true, 'Le panneau interne arrête la propagation du clic ; son libellé de fermeture est inopérant.');
            await ouvrir(page);
            await onglet(page, 'Dés');
            await page.getByRole('button', { name: 'Lancer D20' }).click();
            await expect(page.getByText(/Cliquer pour fermer/i)).toBeVisible();
            await page.getByText(/Cliquer pour fermer/i).click();
            await expect(page.getByText(/Cliquer pour fermer/i)).toHaveCount(0, { timeout: 2_000 });
        });

        test('Sons — régler le volume des bruitages', async ({ page }) => {
            await ouvrir(page);
            await onglet(page, 'Sons');
            await expect(page.getByRole('button', { name: 'Alarme du relais' })).toBeVisible();
            await capturer(page, '04-sons');
            await page.getByRole('slider', { name: 'Volume — Bruitages' }).focus();
            await page.keyboard.press('Home');
            await expect.poll(() => gmos.fenetre.evaluate(() => (window as unknown as Magasins).useSoundStore.getState().masterVolume)).toBe(0);
        });

        test('Scénario — déclencher un moment', async ({ page }) => {
            await ouvrir(page);
            await onglet(page, 'Scénario');
            await expect(page.getByRole('button', { name: /Amarrage au relais/ })).toBeVisible();
            await capturer(page, '05-scenario');
            await page.getByRole('button', { name: /Amarrage au relais/ }).click();
            await expect.poll(() => gmos.fenetre.evaluate(() => {
                const s = (window as unknown as Magasins).useStoryboardStore.getState();
                return s.moments.find(m => m.id === s.activeMomentId)?.name;
            })).toBe('Amarrage au relais');
        });

        test('Combat — retirer un PV puis passer au combattant suivant', async ({ page }) => {
            await ouvrir(page);
            await onglet(page, 'Combat');
            await expect(page.getByRole('button', { name: 'Suivant' })).toBeVisible();
            await capturer(page, '06-combat');
            await page.getByRole('button', { name: 'Retirer un point de vie à Nel Varga' }).click();
            await expect.poll(() => gmos.fenetre.evaluate(() => (window as unknown as Magasins).useCombatStore.getState().combatants.find(c => c.name === 'Nel Varga')?.hp)).toBe(8);
            await page.getByRole('button', { name: 'Suivant' }).click();
            await expect.poll(() => gmos.fenetre.evaluate(() => (window as unknown as Magasins).useCombatStore.getState().currentTurnIdx)).toBe(1);
        });

        test('Tableau — changer le fond et l’outil', async ({ page }) => {
            await ouvrir(page);
            await onglet(page, 'Tableau');
            await expect(page.getByRole('button', { name: 'Crayon' })).toBeVisible();
            await capturer(page, '07-tableau');
            await page.getByRole('button', { name: 'Passer en fond clair' }).click();
            await expect.poll(() => gmos.fenetre.evaluate(() => (window as unknown as Magasins).useWhiteboardStore.getState().backgroundMode)).toBe('light');
            await page.getByRole('button', { name: 'Gomme' }).click();
            await expect.poll(() => gmos.fenetre.evaluate(() => (window as unknown as Magasins).useWhiteboardStore.getState().currentTool)).toBe('eraser');
            await capturer(page, '08-tableau-clair');
        });

        test('Notes — parcourir séance, trame, chroniques, indices et coffre', async ({ page }) => {
            await ouvrir(page);
            await onglet(page, 'Notes');
            await expect(page.getByText('Le relais demeure silencieux.')).toBeVisible();
            await capturer(page, '09-notes-seance');
            await page.getByRole('button', { name: /^Trame/ }).click();
            await capturer(page, '10-notes-trame');
            await page.getByRole('button', { name: /^Chroniques/ }).click();
            await capturer(page, '11-notes-chroniques');
            await page.getByRole('button', { name: /^Indices/ }).click();
            await capturer(page, '12-notes-indices');
            await page.getByRole('button', { name: 'Secrets', exact: true }).click();
            await expect(page.getByText('Hale connaît la panne.')).toBeVisible();
            await capturer(page, '13-notes-secrets');
            await page.getByRole('button', { name: 'Nexus Wiki', exact: true }).click();
            await expect(page.getByRole('button', { name: /Station Varn/i }).first()).toBeVisible();
            await capturer(page, '14-notes-coffre');
        });

        test('Messages — écrire sur le canal général et à un personnage', async ({ page }) => {
            await ouvrir(page);
            await onglet(page, 'Messages');
            await expect(page.getByRole('textbox', { name: 'Message à envoyer' })).toHaveAttribute('placeholder', /Tous les joueurs/);
            await capturer(page, '15-messages');
            await page.getByRole('textbox', { name: 'Message à envoyer' }).fill('Le sas est ouvert.');
            await page.getByRole('button', { name: 'Envoyer le message' }).click();
            await expect.poll(() => gmos.fenetre.evaluate(() => (window as unknown as Magasins).useSessionOSStore.getState().messages.some(m => m.toId === 'all' && m.content === 'Le sas est ouvert.'))).toBe(true);
            await expect(page.getByText('Le sas est ouvert.', { exact: true })).toBeVisible();
            await page.getByRole('button', { name: 'Nel Varga', exact: true }).click();
            await page.getByRole('textbox', { name: 'Message à envoyer' }).fill('Reste près du relais.');
            await page.getByRole('button', { name: 'Envoyer le message' }).click();
            await expect.poll(() => gmos.fenetre.evaluate(() => (window as unknown as Magasins).useSessionOSStore.getState().messages.some(m => m.toId === 'temoin-pj-1' && m.content === 'Reste près du relais.'))).toBe(true);
            await expect(page.getByText('Reste près du relais.', { exact: true })).toBeVisible();
            await capturer(page, '16-messages-envoyes');
        });
    });
}
