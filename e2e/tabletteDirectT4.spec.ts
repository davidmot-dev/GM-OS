import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { lancerGmOs, attendreLHydratation, type GmOsLance } from './lancerGmOs';
import type { useSessionOSStore } from '../src/modules/session/useSessionOSStore';
import type { useClockStore } from '../src/store/useClockStore';
import type { useImageStore } from '../src/modules/image/useImageStore';
import type { useCombatStore } from '../src/modules/combat/useCombatStore';
import type { useFavoriteStore } from '../src/modules/favorite/useFavoriteStore';

// Campagne fictive et véritable liaison MJ/tablette : aucun état injecté côté joueur.
const ICI = path.dirname(fileURLToPath(import.meta.url));
const SORTIE = process.env.GMOS_TABLET_CAPTURES_DIR ? path.join(path.resolve(process.env.GMOS_TABLET_CAPTURES_DIR), 'direct') : path.join(ICI, '../documentation/Planning/tablettes/T4-joueurs/direct');
const SEMENCE = path.join(ICI, 'donnees/campagne-de-demo.json');
const DEMO = JSON.parse(fs.readFileSync(SEMENCE, 'utf8'));
const PLAN = 'data:image/png;base64,' + fs.readFileSync(path.join(ICI, 'donnees/plan-station-varn.png')).toString('base64');
type Magasins = {
    useSessionOSStore: typeof useSessionOSStore;
    useClockStore: typeof useClockStore;
    useImageStore: typeof useImageStore;
    useCombatStore: typeof useCombatStore;
    useFavoriteStore: typeof useFavoriteStore;
};
let gmos: GmOsLance;
test.use({ channel: 'msedge', locale: 'fr-FR', timezoneId: 'Europe/Brussels', serviceWorkers: 'block' });
test.beforeAll(async () => {
    fs.mkdirSync(SORTIE, { recursive: true });
    gmos = await lancerGmOs({ semence: SEMENCE });
    await attendreLHydratation(gmos);
    await expect(gmos.fenetre.locator('[data-ecran-d-accueil]')).toHaveCount(0, { timeout: 20_000 });
    const cadre = await gmos.application.browserWindow(gmos.fenetre);
    await cadre.evaluate(w => w.webContents.setAudioMuted(true));
});
test.afterAll(async () => { await gmos?.fermer(); });

async function capturer(page: Page, nom: string) {
    await page.evaluate(() => document.fonts.ready);
    // L'entrée des cartes est animée : regarder leur état stabilisé.
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(SORTIE, nom + '.png'), animations: 'disabled', scale: 'css' });
}
async function verifierLaNavigation(page: Page) {
    const navigation = page.getByRole('navigation', { name: 'Navigation Hub' });
    for (const titre of ['Direct', 'Archives', 'PNJ', 'Lieux', 'Inventaire', 'Cartes', 'Fiche Personnage', 'Notes Personnelles', 'Messages', 'Quitter']) {
        const bouton = navigation.getByTitle(titre, { exact: true });
        await expect(bouton.locator('span').first()).toBeVisible();
        const r = await bouton.boundingBox();
        expect(r!.width).toBeGreaterThanOrEqual(43.9);
        expect(r!.height).toBeGreaterThanOrEqual(43.9);
        expect(r!.x).toBeGreaterThanOrEqual(0);
        expect(r!.x + r!.width).toBeLessThanOrEqual(page.viewportSize()!.width + 1);
        expect(r!.y + r!.height).toBeLessThanOrEqual(page.viewportSize()!.height + 1);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize()!.width);
}

for (const taille of [
    { nom: 'petit-telephone', width: 360, height: 800 },
    { nom: 'telephone', width: 390, height: 844 },
    { nom: 'portrait', width: 820, height: 1180 },
    { nom: 'paysage', width: 1180, height: 820 },
]) test(`Direct T4 — disposition et projections à ${taille.width} px`, async ({ page }) => {
    await page.setViewportSize(taille);
    await page.addInitScript(() => localStorage.setItem('gmos-tablet-uuid', 't4-direct'));
    await gmos.fenetre.evaluate(semence => {
        const w = window as unknown as Magasins;
        w.useSessionOSStore.setState({ ...semence.modules.sessionOS, sessions: semence.modules.sessionOS.sessions.map((s: { id: string }) => ({ ...s, status: s.id === 'demo-seance-2' ? 'active' : 'done' })) });
        w.useClockStore.setState({ isClockProjected: true, timestamp: Date.parse('2026-10-03T19:00:17Z'), mode: 'static', tensions: [
            { id: 'alerte', name: 'Alerte de la station', totalSegments: 8, filledSegments: 3, vueParLesJoueurs: true },
            { id: 'secret', name: 'Secret du meneur', totalSegments: 4, filledSegments: 1, vueParLesJoueurs: false },
        ] });
        w.useCombatStore.setState({ combatants: [], isCombatProjected: false });
        w.useFavoriteStore.setState({ favorites: [] });
        w.useImageStore.getState().blackoutAll();
        w.useImageStore.setState({ projectionTarget: 'hub' });
    }, DEMO);
    await page.goto(`http://127.0.0.1:${gmos.ports.sync}/?window=tablet&sync=${gmos.ports.sync}`);
    expect(await page.evaluate(() => Boolean(window.appBridge))).toBe(false);
    await page.getByRole('button', { name: /Nel Varga/ }).click();
    await expect(page.getByText('Synchronisation', { exact: true })).toHaveCount(0);
    const direct = page.locator('[data-direct-joueur]');
    await expect(direct.getByRole('heading', { name: 'Le Silence de Varn', exact: true })).toBeVisible();
    await expect(direct.getByText('Connecté', { exact: true })).toBeVisible();
    // J1 complet : le snapshot initial et le segment suivant portent le même mode.
    await expect(direct.getByText('21:00', { exact: true })).toBeVisible();
    await gmos.fenetre.evaluate(() => (window as unknown as Magasins).useClockStore.setState({ mode: 'static', timestamp: Date.parse('2026-10-03T19:00:18Z') }));
    await expect(direct.getByText('21:00', { exact: true })).toBeVisible();
    await expect(page.getByText('Secret du meneur', { exact: true })).toHaveCount(0);
    await verifierLaNavigation(page);
    const projection = direct.getByRole('region', { name: 'Projection du meneur' });
    const chroniques = direct.getByRole('region', { name: 'Chroniques de séance' });
    await expect(chroniques.getByText('Aucun résumé public.', { exact: true })).toBeVisible();
    const p = await projection.boundingBox(), c = await chroniques.boundingBox();
    if (taille.nom === 'paysage') expect(p!.x + p!.width).toBeLessThanOrEqual(c!.x);
    else expect(p!.y + p!.height).toBeLessThanOrEqual(c!.y);
    await capturer(page, taille.nom);

    // Le choix, la surcouche de fiche et son retour gardent leurs gestes existants.
    await page.getByTitle('Fiche Personnage', { exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Nel Varga', exact: true })).toBeVisible();
    await page.getByTitle('Fermer la fiche', { exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Nel Varga', exact: true })).toHaveCount(0);

    const resume = 'Le groupe traverse le pont C.\n' + 'Le relais répond avec sa voix. '.repeat(35) + '\nFin du résumé public.';
    await gmos.fenetre.evaluate(texte => (window as unknown as Magasins).useSessionOSStore.getState().updateSessionPublicSummary('demo-seance-2', texte), resume);
    await expect(chroniques.getByText(resume, { exact: true })).toBeVisible();
    expect(await direct.innerText()).not.toContain("L'Écho imite la voix du dernier qui a parlé.");
    await gmos.fenetre.evaluate(plan => (window as unknown as Magasins).useImageStore.getState().projectUrl(plan), PLAN);
    await expect(projection.locator('img').first()).toBeVisible({ timeout: 15_000 });
    await expect.poll(() => projection.locator('img').first().evaluate(img => (img as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    await chroniques.locator('div.overflow-auto').evaluate(element => { element.scrollTop = element.scrollHeight; });
    await verifierLaNavigation(page);
    await capturer(page, taille.nom + '-projection');

    await gmos.fenetre.evaluate(plan => {
        const favoris = (window as unknown as Magasins).useFavoriteStore.getState();
        const id = favoris.addFavorite({ name: 'Superviseur Hale', type: 'npc', imageUrl: plan, secretNotes: 'Secret de Hale réservé au meneur.' });
        favoris.updateFavorite(id, { isSyncedToPlayerHub: true });
    }, PLAN);
    await expect(projection.getByText('Superviseur Hale', { exact: true })).toHaveCount(1);
    // Deux images dans la carte (portrait et fond flou), aucune seconde carte pour la même URL.
    await expect(projection.locator('img')).toHaveCount(2);
    expect(await direct.innerText()).not.toContain('Secret de Hale réservé au meneur.');
    await projection.getByText('Superviseur Hale', { exact: true }).scrollIntoViewIfNeeded();
    const nomProjete = await projection.getByText('Superviseur Hale', { exact: true }).boundingBox();
    const barre = await page.getByRole('navigation', { name: 'Navigation Hub' }).boundingBox();
    expect(nomProjete!.y + nomProjete!.height).toBeLessThanOrEqual(barre!.y);
    await verifierLaNavigation(page);
    await capturer(page, taille.nom + '-pnj');

    await gmos.fenetre.evaluate(() => {
        const w = window as unknown as Magasins;
        w.useClockStore.setState({ mode: 'timer', timerDuration: 120, timerRemaining: 65, timerIsRunning: false, timerLabel: 'Décompte de Varn' });
    });
    await expect(direct.getByRole('timer')).toHaveText('01:05');
    await expect(direct.getByText('Décompte de Varn', { exact: true })).toBeVisible();
    await gmos.fenetre.evaluate(() => (window as unknown as Magasins).useClockStore.setState({ isClockProjected: false }));
    await expect(direct.getByLabel('Horloges publiques')).toHaveCount(0);
    await verifierLaNavigation(page);

    await gmos.fenetre.evaluate(plan => (window as unknown as Magasins).useCombatStore.setState({
        isCombatProjected: true, currentTurnIdx: 0, combatants: [
            { id: 'nel', name: 'Nel Varga', init: 12, isPlayer: true, faction: 'player', statuses: [], avatar: plan },
            { id: 'cache', name: 'Adversaire invisible', init: 8, isPlayer: false, faction: 'enemy', statuses: [{ id: 'invisible', name: 'invisible', duration: 0, icon: 'eye' }] },
        ],
    }), PLAN);
    await direct.getByRole('button', { name: 'Initiative', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Initiative', exact: true })).toBeVisible();
    await expect(page.getByText('Adversaire invisible', { exact: true })).toHaveCount(0);
    await capturer(page, taille.nom + '-initiative');
    await page.getByTitle("Fermer l'initiative", { exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Initiative', exact: true })).not.toBeVisible();
    await verifierLaNavigation(page);
});
