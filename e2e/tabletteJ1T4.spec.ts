import { test, expect, type Page, type Locator } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { lancerGmOs, attendreLHydratation, type GmOsLance } from './lancerGmOs';
import type { useSessionOSStore } from '../src/modules/session/useSessionOSStore';
import type { useFavoriteStore } from '../src/modules/favorite/useFavoriteStore';
import type { useClockStore } from '../src/store/useClockStore';
import type { useCombatStore } from '../src/modules/combat/useCombatStore';
import type { useRessourcesDeTableStore } from '../src/modules/table/useRessourcesDeTableStore';
import { DEFAULT_GAME_DRIVERS } from '../src/data/defaultGameDrivers';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const SORTIE = process.env.GMOS_TABLET_CAPTURES_DIR ? path.join(path.resolve(process.env.GMOS_TABLET_CAPTURES_DIR), 'j1') : path.join(ICI, '../documentation/Planning/tablettes/T4-joueurs/j1');
const SEMENCE = path.join(ICI, 'donnees/campagne-de-demo.json');
const DEMO = JSON.parse(fs.readFileSync(SEMENCE, 'utf8'));
type Magasins = { useSessionOSStore: typeof useSessionOSStore; useFavoriteStore: typeof useFavoriteStore; useClockStore: typeof useClockStore; useCombatStore: typeof useCombatStore; useRessourcesDeTableStore: typeof useRessourcesDeTableStore };
const TAILLES = [
    { nom: 'petit-telephone', width: 360, height: 800 },
    { nom: 'telephone', width: 390, height: 844 },
    { nom: 'portrait', width: 820, height: 1180 },
    { nom: 'paysage', width: 1180, height: 820 },
];
let gmos: GmOsLance;
test.use({ channel: 'msedge', locale: 'fr-FR', timezoneId: 'Europe/Brussels', serviceWorkers: 'block' });
test.setTimeout(60_000);
test.beforeAll(async () => {
    fs.mkdirSync(SORTIE, { recursive: true });
    gmos = await lancerGmOs({ semence: SEMENCE });
    await attendreLHydratation(gmos);
    await expect(gmos.fenetre.locator('[data-ecran-d-accueil]')).toHaveCount(0, { timeout: 20_000 });
});
test.afterAll(async () => { await gmos?.fermer(); });

async function rejoindre(page: Page, taille: typeof TAILLES[number]) {
    await page.setViewportSize(taille);
    await page.addInitScript(() => localStorage.setItem('gmos-tablet-uuid', 't4-j1'));
    await gmos.fenetre.evaluate(semence => {
        const w = window as unknown as Magasins;
        const s = semence.modules.sessionOS;
        w.useSessionOSStore.setState({ ...s,
            sessions: s.sessions.map((seance: { id: string }) => ({ ...seance, status: seance.id === 'demo-seance-2' ? 'active' : 'done' })),
            players: s.players.map((joueur: { characters: { id: string }[] }) => ({ ...joueur,
                characters: joueur.characters.map(c => ({ ...c, inventoryItems: c.id === 'temoin-pj-1' ? Array.from({ length: 8 }, (_, i) => ({
                    id: `j1-objet-${i}`, name: i === 0 ? 'Outil multifonction' : `Objet ${i} du relais avec un nom suffisamment long pour rester lisible sur téléphone`,
                    quantity: i + 1, description: 'Pour ouvrir le relais.', type: 'equipment', rarity: 'common', weight: 1, properties: {},
                })) : [] })) })),
            transferRequests: [], demandesDeCarte: [],
            deckStates: { 'temoin-paquet': { deckId: 'temoin-paquet', remainingIndices: [3, 4, 5, 6], discardedIndices: [1], currentCardIndex: null,
                enMain: [{ index: 2, porteur: 'temoin-pj-1', face: 'revelee' }, { index: 1, porteur: 'temoin-pj-1', face: 'scellee' }] } },
        });
        w.useFavoriteStore.setState({ favorites: [] });
        w.useCombatStore.setState({ combatants: [], isCombatProjected: false });
        w.useClockStore.setState({ isClockProjected: true, tensions: [
            { id: 'alerte', name: 'Alerte de la station', totalSegments: 8, filledSegments: 3, vueParLesJoueurs: true },
            { id: 'secret', name: 'Secret du meneur', totalSegments: 4, filledSegments: 1, vueParLesJoueurs: false },
        ] });
    }, DEMO);
    // Illustrations fictives seulement ; le WebSocket et les gestes restent réels.
    await page.route('**/assets/decks/generic/temoin-paquet/**', route => route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="250" height="350"><rect width="250" height="350" fill="#142637"/><text x="125" y="175" text-anchor="middle" fill="white" font-size="22">STATION VARN</text></svg>' }));
    await page.goto(`http://127.0.0.1:${gmos.ports.sync}/?window=tablet&sync=${gmos.ports.sync}`);
    expect(await page.evaluate(() => Boolean(window.appBridge))).toBe(false);
    await page.getByRole('button', { name: /Nel Varga/ }).click();
    await expect(page.getByText('Synchronisation', { exact: true })).toHaveCount(0);
    await expect(page.getByText('Connecté', { exact: true })).toBeVisible();
}
async function capturer(page: Page, nom: string) {
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(SORTIE, nom + '.png'), animations: 'disabled', scale: 'css' });
}
async function verifierCible(cible: Locator) {
    const r = await cible.boundingBox();
    expect(r!.width).toBeGreaterThanOrEqual(43.9);
    expect(r!.height).toBeGreaterThanOrEqual(43.9);
}
async function verifierNavigation(page: Page) {
    const nav = page.getByRole('navigation', { name: 'Navigation Hub' });
    for (const titre of ['Direct', 'Archives', 'PNJ', 'Lieux', 'Inventaire', 'Cartes', 'Fiche Personnage', 'Notes Personnelles', 'Messages', 'Quitter']) {
        const cible = nav.getByTitle(titre, { exact: true });
        await expect(cible.locator('span').first()).toBeVisible();
        await verifierCible(cible);
        const r = await cible.boundingBox();
        expect(r!.y + r!.height).toBeLessThanOrEqual(page.viewportSize()!.height + 1);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize()!.width);
}

for (const taille of TAILLES) test(`Inventaire T4 — gestes et défilement à ${taille.width} px`, async ({ page }) => {
    await rejoindre(page, taille);
    await page.getByRole('navigation').getByTitle('Inventaire', { exact: true }).click();
    const inventaire = page.locator('[data-inventaire-joueur]');
    await expect(inventaire.getByText('8 Objets', { exact: true })).toBeVisible();
    await verifierNavigation(page);
    await expect(page.getByText('Secret du meneur', { exact: true })).toHaveCount(0);
    await capturer(page, taille.nom + '-inventaire');
    const dernier = inventaire.getByTitle('Donner', { exact: true }).last();
    await dernier.scrollIntoViewIfNeeded();
    await verifierCible(dernier);
    const bouton = await dernier.boundingBox(), barre = await page.getByRole('navigation').boundingBox();
    expect(bouton!.y + bouton!.height).toBeLessThanOrEqual(barre!.y);
    await capturer(page, taille.nom + '-inventaire-bas');
    await inventaire.getByTitle('Donner', { exact: true }).first().click();
    const dialogue = page.getByRole('dialog', { name: 'Donner un objet' });
    await expect(dialogue).toBeVisible();
    await capturer(page, taille.nom + '-don');
    await verifierCible(dialogue.getByTitle('Fermer le don'));
    await dialogue.getByTitle('Fermer le don').click();
    await expect(dialogue).toHaveCount(0);
    await inventaire.getByTitle('Donner', { exact: true }).first().click();
    await dialogue.getByRole('button', { name: /Idris Koa/ }).click();
    await expect.poll(() => gmos.fenetre.evaluate(() => (window as unknown as Magasins).useSessionOSStore.getState().transferRequests.some(r => r.item.id === 'j1-objet-0' && r.toCharacterId === 'temoin-pj-2'))).toBe(true);
    const outil = inventaire.locator('[data-panneau]').filter({ has: page.getByRole('heading', { name: 'Outil multifonction', exact: true }) });
    await expect(outil.getByTitle('Donner', { exact: true })).toBeDisabled();
    await expect(outil.getByTitle('Jeter', { exact: true })).toBeDisabled();
    await capturer(page, taille.nom + '-attente');
    const jeter = inventaire.getByTitle('Jeter', { exact: true }).nth(1);
    page.once('dialog', d => d.dismiss());
    await jeter.click();
    await expect(inventaire.getByTitle('Jeter', { exact: true })).toHaveCount(8);
    page.once('dialog', d => d.accept());
    await jeter.click();
    await expect.poll(() => gmos.fenetre.evaluate(() => (window as unknown as Magasins).useSessionOSStore.getState().players[0].characters[0].inventoryItems!.length)).toBe(7);
    await gmos.fenetre.evaluate(() => {
        const magasin = (window as unknown as Magasins).useSessionOSStore;
        magasin.setState({ players: magasin.getState().players.map(p => ({ ...p, characters: p.characters.map(c => ({ ...c, inventoryItems: [] })) })) });
    });
    await expect(inventaire.getByText('Votre sac à dos est vide', { exact: true })).toBeVisible();
    await verifierNavigation(page);
    await capturer(page, taille.nom + '-inventaire-vide');
});

for (const taille of TAILLES) test(`Cartes T4 — pioche, dons et scellés à ${taille.width} px`, async ({ page, browser }) => {
    test.setTimeout(90_000);
    await rejoindre(page, taille);
    await page.getByRole('navigation').getByTitle('Cartes', { exact: true }).click();
    const cartes = page.locator('[data-cartes-joueur]');
    await expect(cartes.getByRole('button', { name: 'Carte 2', exact: true })).toBeVisible();
    await expect(cartes.getByLabel('sous scellé — personne ne la connaît', { exact: true })).toHaveCount(1);
    await expect(cartes.getByRole('button', { name: 'Carte 1', exact: true })).toHaveCount(0);
    await verifierNavigation(page);
    await capturer(page, taille.nom + '-cartes');
    await cartes.getByRole('button', { name: 'Carte 2', exact: true }).click();
    const detail = page.getByRole('dialog', { name: 'Carte 2', exact: true });
    await expect(detail).toBeVisible();
    await capturer(page, taille.nom + '-carte-detail');
    await detail.getByRole('button', { name: 'Touchez pour fermer' }).click();
    await expect(detail).toHaveCount(0);
    await cartes.getByRole('button', { name: 'Carte 2', exact: true }).click();
    await page.keyboard.press('Escape');
    await expect(detail).toHaveCount(0);
    await cartes.getByTitle('Piocher', { exact: true }).click();
    await expect.poll(() => gmos.fenetre.evaluate(() => (window as unknown as Magasins).useSessionOSStore.getState().deckStates['temoin-paquet'].remainingIndices.length)).toBe(3);
    const jouer = cartes.getByRole('button', { name: 'Jouer', exact: true }).first();
    await jouer.scrollIntoViewIfNeeded();
    await verifierCible(jouer);
    const cible = await jouer.boundingBox(), nav = await page.getByRole('navigation').boundingBox();
    expect(cible!.y + cible!.height).toBeLessThanOrEqual(nav!.y);
    await jouer.click();
    await expect(cartes.getByRole('button', { name: 'Carte 2', exact: true })).toHaveCount(0);
    const voisin = await browser.newContext({ viewport: taille, locale: 'fr-FR', timezoneId: 'Europe/Brussels', serviceWorkers: 'block' });
    try {
        await voisin.addInitScript(() => localStorage.setItem('gmos-tablet-uuid', 't4-j1-idris'));
        await voisin.route('**/assets/decks/generic/temoin-paquet/**', route => route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="250" height="350"><rect width="250" height="350" fill="#142637"/><text x="125" y="175" text-anchor="middle" fill="white" font-size="22">STATION VARN</text></svg>' }));
        const idris = await voisin.newPage();
        await idris.goto(`http://127.0.0.1:${gmos.ports.sync}/?window=tablet&sync=${gmos.ports.sync}`);
        await idris.getByRole('button', { name: /Idris Koa/ }).click();
        await expect(idris.getByText('Connecté', { exact: true })).toBeVisible();
        await idris.getByRole('navigation').getByTitle('Cartes', { exact: true }).click();
        const destinataire = idris.locator('[data-cartes-joueur]');
        const donner = cartes.getByLabel('Donner à', { exact: true }).first();
        await expect(donner.locator('option[value="temoin-pj-2"]')).toHaveCount(1);
        await verifierCible(donner);
        await donner.selectOption('temoin-pj-2');
        await expect(cartes.getByText('Proposition en attente', { exact: true })).toBeVisible();
        await expect(cartes.getByRole('button', { name: 'Jouer', exact: true })).toHaveCount(0);
        await expect(destinataire.getByRole('button', { name: 'Refuser', exact: true })).toBeVisible();
        await capturer(page, taille.nom + '-carte-attente');
        await capturer(idris, taille.nom + '-carte-proposition');
        await destinataire.getByRole('button', { name: 'Refuser', exact: true }).click();
        await expect(cartes.getByText('Proposition en attente', { exact: true })).toHaveCount(0);
        await donner.selectOption('temoin-pj-2');
        await destinataire.getByRole('button', { name: 'Accepter', exact: true }).click();
        await expect.poll(() => gmos.fenetre.evaluate(() => (window as unknown as Magasins).useSessionOSStore.getState().deckStates['temoin-paquet'].enMain?.some(c => c.porteur === 'temoin-pj-2' && c.face === 'revelee'))).toBe(true);
    } finally { await voisin.close(); }
    await gmos.fenetre.evaluate(() => {
        const magasin = (window as unknown as Magasins).useSessionOSStore;
        const etat = magasin.getState().deckStates['temoin-paquet'];
        magasin.setState({ deckStates: { 'temoin-paquet': { ...etat, remainingIndices: [], enMain: [] } } });
    });
    await expect(cartes.getByTitle('Paquet vide', { exact: true })).toBeDisabled();
    await expect(cartes.getByText('Vous ne tenez aucune carte.', { exact: true })).toBeVisible();
    await verifierNavigation(page);
    await capturer(page, taille.nom + '-cartes-vide');
});

for (const taille of TAILLES) test(`Fiche J1 — PV et réserves tactiles à ${taille.width} px`, async ({ page }) => {
    await rejoindre(page, taille);
    await gmos.fenetre.evaluate(pilote => {
        const w = window as unknown as Magasins, magasin = w.useSessionOSStore;
        const s = magasin.getState();
        magasin.setState({ campaigns: s.campaigns.map(c => ({ ...c, system: pilote.id })),
            players: s.players.map(p => ({ ...p, characters: p.characters.map(c => ({ ...c, systemId: pilote.id })) })),
        });
        w.useRessourcesDeTableStore.setState({ reserves: { [s.activeCampaignId!]: { impulsion: 3, menace: 2 } } });
    }, DEFAULT_GAME_DRIVERS[0]);
    await page.getByTitle('Fiche Personnage', { exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Nel Varga', exact: true })).toBeVisible();
    const moins = page.getByTitle('-1 PV', { exact: true });
    await moins.scrollIntoViewIfNeeded();
    await verifierCible(moins);
    await moins.click();
    await expect.poll(() => gmos.fenetre.evaluate(() => (window as unknown as Magasins).useSessionOSStore.getState().players[0].characters[0].hp)).toBe(8);
    const impulsion = page.getByRole('button', { name: 'Ajouter un point de Impulsion', exact: true });
    await expect(impulsion).toBeVisible();
    await verifierCible(impulsion);
    await verifierCible(page.getByRole('button', { name: 'Retirer un point de Impulsion', exact: true }));
    await expect(page.getByRole('button', { name: 'Ajouter un point de Menace', exact: true })).toHaveCount(0);
    await impulsion.click();
    await expect.poll(() => gmos.fenetre.evaluate(() => {
        const w = window as unknown as Magasins;
        return w.useRessourcesDeTableStore.getState().reserves[w.useSessionOSStore.getState().activeCampaignId!]?.impulsion;
    })).toBe(4);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(taille.width);
    await capturer(page, taille.nom + '-fiche');
    await page.getByTitle('Fermer la fiche', { exact: true }).click();
    await verifierNavigation(page);
});
