import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { lancerGmOs, attendreLHydratation, type GmOsLance } from './lancerGmOs';
import type { useSessionOSStore } from '../src/modules/session/useSessionOSStore';
import type { useFavoriteStore } from '../src/modules/favorite/useFavoriteStore';
import type { useClockStore } from '../src/store/useClockStore';
import type { useDiceStore } from '../src/stores/useDiceStore';

/**
 * T0 joueurs, demandé par David le 04/10/2026 : figer les gestes AVANT la refonte.
 * Vrai navigateur sans appBridge, vrai WebSocket, vrai meneur sur profil jetable.
 * Seules les illustrations du paquet fictif sont fournies par le test ; aucun
 * message réseau ni geste n'est simulé. La semence du manuel reste inchangée.
 *
 * npm.cmd run build
 * npx.cmd playwright test e2e/tabletteJoueursT0.spec.ts --reporter=list
 */
const ICI = path.dirname(fileURLToPath(import.meta.url));
// T2 peut rejouer le banc sans écraser les 54 images de référence T0.
const SORTIE = process.env.GMOS_TABLET_CAPTURES_DIR
    ? path.resolve(process.env.GMOS_TABLET_CAPTURES_DIR)
    : path.join(ICI, '../documentation/Planning/tablettes/T0-joueurs');
const DEMO = JSON.parse(fs.readFileSync(path.join(ICI, 'donnees/campagne-de-demo.json'), 'utf8'));
const PLAN = 'data:image/png;base64,' + fs.readFileSync(path.join(ICI, 'donnees/plan-station-varn.png')).toString('base64');
type Magasins = {
    useSessionOSStore: typeof useSessionOSStore;
    useFavoriteStore: typeof useFavoriteStore;
    useClockStore: typeof useClockStore;
    useDiceStore: typeof useDiceStore;
};
const TAILLES = [
    { nom: 'telephone', width: 390, height: 844 },
    { nom: 'portrait', width: 820, height: 1180 },
    { nom: 'paysage', width: 1180, height: 820 },
] as const;
// Edge est installé sur le poste ; aucun téléchargement de navigateur.
test.use({ channel: 'msedge' });

for (const taille of TAILLES) {
    test.describe(`T0 joueurs — ${taille.nom}`, () => {
        test.use({ viewport: { width: taille.width, height: taille.height }, locale: 'fr-FR', timezoneId: 'Europe/Brussels', serviceWorkers: 'block' });
        let gmos: GmOsLance;

        test.beforeAll(async () => {
            fs.mkdirSync(path.join(SORTIE, taille.nom), { recursive: true });
            gmos = await lancerGmOs({ semence: path.join(ICI, 'donnees/campagne-de-demo.json') });
            await attendreLHydratation(gmos);
            await expect(gmos.fenetre.locator('[data-ecran-d-accueil]')).toHaveCount(0, { timeout: 20_000 });
            const cadre = await gmos.application.browserWindow(gmos.fenetre);
            await cadre.evaluate(w => w.webContents.setAudioMuted(true));
            await gmos.fenetre.getByTitle(/Paramètres de l’OS|Paramètres de l'OS/).click();
            const personnalites = gmos.fenetre.getByRole('switch');
            if (await personnalites.getAttribute('aria-checked') !== 'true') await personnalites.click();
            await expect(personnalites).toHaveAttribute('aria-checked', 'true');
            await gmos.fenetre.getByLabel(/Fermer les paramètres/i).click();
        });
        test.afterAll(async () => { await gmos?.fermer(); });

        test.beforeEach(async ({ page }) => {
            // Un appareil qui revient reprend son verrou « ghost » côté serveur.
            // Nouveau stockage par test, même identité matérielle dans ce lot.
            await page.addInitScript(nom => localStorage.setItem('gmos-tablet-uuid', `t0-joueurs-${nom}`), taille.nom);
            // Le décor est remis sur le meneur. Les assertions lisent ses retours,
            // jamais un état injecté dans la tablette pour faire passer un geste.
            await gmos.fenetre.evaluate(({ semence, plan }) => {
                const w = window as unknown as Magasins;
                const s = semence.modules.sessionOS;
                w.useSessionOSStore.setState({
                    ...s,
                    sessions: s.sessions.map((seance: { id: string }) => ({ ...seance, status: seance.id === 'demo-seance-2' ? 'active' : 'done' })),
                    entities: s.entities.map((pnj: { id: string }) => ({ ...pnj, isVisibleByPlayers: pnj.id === 'temoin-pnj-1' })),
                    atlasMaps: s.atlasMaps.map((lieu: object) => ({ ...lieu, isVisited: true, fileUrl: plan, type: 'battlemap', isVideo: false, linkedEntities: [], gmNotes: '', narrativeDescription: 'Le pont C, entre le sas et le relais.' })),
                    players: s.players.map((joueur: { characters: { id: string }[] }) => ({ ...joueur,
                        characters: joueur.characters.map(personnage => ({ ...personnage, inventoryItems: personnage.id === 'temoin-pj-1'
                            ? [{ id: 't0-outil', name: 'Outil multifonction', quantity: 1, description: 'Pour ouvrir le relais.', type: 'equipment', rarity: 'common', weight: 1, properties: {} }] : [] })) })),
                    messages: [], demandesDeCarte: [], transferRequests: [],
                    // La semence historique emploie cardIndex/porteurId/porteur.
                    // Le décor T0 explicite la forme actuelle, sans changer le JSON.
                    deckStates: { 'temoin-paquet': { deckId: 'temoin-paquet', remainingIndices: [3, 4, 5, 6], discardedIndices: [1], currentCardIndex: null,
                        enMain: [{ index: 2, porteur: 'temoin-pj-1', face: 'revelee' }] } },
                });
                w.useFavoriteStore.setState({ favorites: [] });
                w.useClockStore.setState({ isClockProjected: true, tensions: [
                    { id: 't0-alerte', name: 'Alerte de la station', totalSegments: 8, filledSegments: 3, vueParLesJoueurs: true },
                    { id: 't0-secret', name: 'Secret du meneur', totalSegments: 4, filledSegments: 1, vueParLesJoueurs: false },
                ], timestamp: Date.parse('2026-10-03T19:00:00Z'), mode: 'static' });
                w.useDiceStore.getState().clearHistory();
            }, { semence: DEMO, plan: PLAN });

            // Les six cartes de la semence n'ont pas d'images livrées. Images
            // fictives uniquement, sans interception de la synchronisation.
            await page.route('**/assets/decks/generic/temoin-paquet/**', route => route.fulfill({
                contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="250" height="350"><rect width="250" height="350" rx="16" fill="#142637"/><rect x="12" y="12" width="226" height="326" rx="12" fill="none" stroke="#54c6b4" stroke-width="3"/><text x="125" y="165" text-anchor="middle" font-family="sans-serif" font-size="22" fill="white">STATION VARN</text><text x="125" y="200" text-anchor="middle" font-family="sans-serif" font-size="14" fill="#54c6b4">Complication</text></svg>',
            }));
            await page.goto(`http://127.0.0.1:${gmos.ports.sync}/?window=tablet&sync=${gmos.ports.sync}`);
            expect(await page.evaluate(() => Boolean(window.appBridge)), 'une tablette ne dispose pas du pont Electron').toBe(false);
            await expect(page.getByRole('button', { name: /Nel Varga/ })).toBeVisible({ timeout: 20_000 });
        });

        async function rejoindre(page: Page) {
            await page.getByRole('button', { name: /Nel Varga/ }).click();
            await expect(page.getByRole('button', { name: /Nel Varga/ })).toHaveCount(0);
            await expect(page.getByTitle('Fiche Personnage', { exact: true })).toBeVisible();
            await expect(page.getByText('Synchronisation', { exact: true })).toHaveCount(0);
            await expect.poll(() => gmos.fenetre.evaluate(() => Boolean((window as unknown as Magasins).useSessionOSStore.getState().connectedCharacters['temoin-pj-1']))).toBe(true);
        }
        async function onglet(page: Page, nom: string) {
            const bouton = page.getByRole('navigation', { name: 'Navigation Hub' }).getByTitle(nom, { exact: true });
            await bouton.click();
            await expect.poll(() => bouton.evaluate(element => {
                const zone = element.closest('[data-hub-nav-scroll]');
                if (!zone) return false;
                const cible = element.getBoundingClientRect();
                const visible = zone.getBoundingClientRect();
                return cible.left >= visible.left - 1 && cible.right <= visible.right + 1;
            })).toBe(true);
        }
        async function capturer(page: Page, nom: string) {
            await page.evaluate(() => document.fonts.ready);
            // Les entrées du Hub durent jusqu'à 700 ms : une capture avant leur fin
            // peut montrer un panneau présent dans le DOM mais encore transparent.
            await page.waitForTimeout(800);
            await page.screenshot({ path: path.join(SORTIE, taille.nom, `${nom}.png`), animations: 'disabled', scale: 'css' });
        }

        test('accueil — choisir son personnage puis quitter', async ({ page }) => {
            await expect(page.getByRole('button', { name: /Idris Koa/ })).toHaveCount(1);
            await capturer(page, '01-accueil');
            await rejoindre(page);
            await expect(page.getByRole('heading', { name: 'Le Silence de Varn' })).toBeVisible();
            page.once('dialog', dialogue => dialogue.accept());
            await onglet(page, 'Quitter');
            await expect(page.getByRole('button', { name: /Nel Varga/ })).toBeVisible();
        });

        test('Direct — ouvrir et fermer sa fiche', async ({ page }) => {
            await rejoindre(page);
            await capturer(page, '02-direct');
            await onglet(page, 'Fiche Personnage');
            await expect(page.getByRole('heading', { name: 'Nel Varga', exact: true })).toBeVisible();
            await capturer(page, '03-fiche');
            await page.getByTitle('Fermer la fiche').click();
            await expect(page.getByTitle('Fermer la fiche')).toHaveCount(0);
        });

        test('Fiche — les PV modifiés sur tablette atteignent le meneur', async ({ page }) => {
            await rejoindre(page);
            await onglet(page, 'Fiche Personnage');
            await page.getByTitle('-1 PV', { exact: true }).click();
            // T4/J1 : vérifier le retour au meneur, au-delà de l'état local.
            await expect.poll(() => gmos.fenetre.evaluate(() => (window as unknown as Magasins).useSessionOSStore.getState().players[0].characters[0].hp)).toBe(8);
        });

        test('Archives — consulter un indice révélé', async ({ page }) => {
            await rejoindre(page);
            await onglet(page, 'Archives');
            await expect(page.getByRole('heading', { name: 'Archives du Groupe' })).toBeVisible();
            await expect(page.getByText('La date corrigee', { exact: true })).toHaveCount(0);
            await capturer(page, '04-archives');
            await page.getByRole('button', { name: /Le café encore chaud/ }).click();
            await expect(page.getByRole('heading', { level: 2, name: 'Le café encore chaud' })).toBeVisible();
            await capturer(page, '05-indice');
            await page.getByTitle("Fermer l'indice").click();
            await expect(page.getByTitle("Fermer l'indice")).toHaveCount(0);
        });

        test('PNJ — consulter un personnage partagé', async ({ page }) => {
            await rejoindre(page);
            await onglet(page, 'PNJ');
            await expect(page.getByRole('button', { name: /Superviseur Hale/ })).toBeVisible();
            await expect(page.getByText('Ancre-7', { exact: true })).toHaveCount(0);
            await capturer(page, '06-pnj');
            await page.getByRole('button', { name: /Superviseur Hale/ }).click();
            await expect(page.getByRole('heading', { level: 2, name: 'Superviseur Hale' })).toBeVisible();
            await capturer(page, '07-pnj-detail');
            await page.getByTitle('Fermer', { exact: true }).click();
        });

        test('Lieux — consulter un lieu visité', async ({ page }) => {
            await rejoindre(page);
            await onglet(page, 'Lieux');
            await expect(page.getByRole('heading', { name: 'Atlas des Lieux Visités' })).toBeVisible();
            await capturer(page, '08-lieux');
            await page.getByRole('button', { name: /Station Varn/ }).click();
            await expect(page.getByRole('heading', { level: 2, name: 'Station Varn' })).toBeVisible();
            await capturer(page, '09-lieu-detail');
            await page.getByTitle('Fermer', { exact: true }).click();
        });

        test('Inventaire — proposer un objet à un autre personnage', async ({ page }) => {
            await rejoindre(page);
            await onglet(page, 'Inventaire');
            await expect(page.getByRole('heading', { name: 'Outil multifonction' })).toBeVisible();
            await capturer(page, '10-inventaire');
            const donner = page.getByTitle('Donner', { exact: true });
            await donner.scrollIntoViewIfNeeded();
            if (taille.nom === 'telephone') {
                await expect.poll(() => donner.evaluate(element => {
                    const navigation = document.querySelector('[aria-label="Navigation Hub"]');
                    return navigation !== null && element.getBoundingClientRect().bottom < navigation.getBoundingClientRect().top;
                })).toBe(true);
                if (process.env.GMOS_TABLET_CAPTURES_DIR) await capturer(page, '10-inventaire-actions');
            }
            await donner.click();
            await expect(page.getByRole('heading', { name: 'Donner un objet' })).toBeVisible();
            await capturer(page, '11-donner-objet');
            await page.getByRole('button', { name: /Idris Koa/ }).click();
            await expect.poll(() => gmos.fenetre.evaluate(() => (window as unknown as Magasins).useSessionOSStore.getState().transferRequests.some(d => d.toCharacterId === 'temoin-pj-2' && d.item.name === 'Outil multifonction'))).toBe(true);
        });

        test('Cartes — piocher, agrandir et jouer sa carte', async ({ page }) => {
            await rejoindre(page);
            await onglet(page, 'Cartes');
            await expect(page.getByRole('button', { name: 'Carte 2', exact: true })).toBeVisible();
            await capturer(page, '12-cartes');
            await page.getByTitle('Piocher', { exact: true }).click();
            await expect.poll(() => gmos.fenetre.evaluate(() => (window as unknown as Magasins).useSessionOSStore.getState().deckStates['temoin-paquet'].enMain?.length)).toBe(2);
            await expect(page.getByRole('button', { name: 'Carte 3', exact: true })).toBeVisible();
            await page.getByRole('button', { name: 'Carte 3', exact: true }).click();
            await expect(page.getByRole('dialog', { name: 'Carte 3' })).toBeVisible();
            await capturer(page, '13-carte-detail');
            await page.getByRole('dialog', { name: 'Carte 3' }).click();
            await page.getByRole('button', { name: 'Jouer', exact: true }).first().click({ timeout: 4_000 });
            await expect.poll(() => gmos.fenetre.evaluate(() => (window as unknown as Magasins).useSessionOSStore.getState().deckStates['temoin-paquet'].discardedIndices.length)).toBe(2);
        });

        test('Messages — envoyer au meneur et lire sa réponse', async ({ page }) => {
            await rejoindre(page);
            await onglet(page, 'Messages');
            await page.getByTitle('Entrer un message').fill('Le relais est ouvert.');
            await page.getByTitle('Envoyer le message').click();
            await expect.poll(() => gmos.fenetre.evaluate(() => (window as unknown as Magasins).useSessionOSStore.getState().messages.some(m => m.content === 'Le relais est ouvert.' && m.toId === 'GM'))).toBe(true);
            await gmos.fenetre.evaluate(() => (window as unknown as Magasins).useSessionOSStore.getState().sendDirectMessage('temoin-pj-1', 'Nel Varga', 'Vous entendez trois coups.'));
            await expect(page.getByText('Vous entendez trois coups.', { exact: true })).toBeVisible();
            await capturer(page, '14-messages');
            await page.getByTitle('Fermer la messagerie').click();
            await expect(page.getByTitle('Entrer un message')).toHaveCount(0);
        });

        test('Notes — enregistrer une note privée chez le meneur', async ({ page }) => {
            await rejoindre(page);
            await onglet(page, 'Notes Personnelles');
            await page.getByPlaceholder(/Notez ici vos théories/).fill('Revenir au relais après la relève.');
            await expect.poll(() => gmos.fenetre.evaluate(() => (window as unknown as Magasins).useSessionOSStore.getState().players[0].characters[0].playerNotes)).toBe('Revenir au relais après la relève.');
            await capturer(page, '15-notes');
            await page.getByTitle('Fermer les notes').click();
            await expect(page.getByPlaceholder(/Notez ici vos théories/)).toHaveCount(0);
        });

        test('Notification de message — ouvrir la conversation reçue', async ({ page }) => {
            await rejoindre(page);
            await gmos.fenetre.evaluate(() => (window as unknown as Magasins).useSessionOSStore.getState().sendDirectMessage('temoin-pj-1', 'Nel Varga', 'Le sas vient de se fermer.'));
            await expect(page.getByText('Nouveau Message', { exact: true })).toBeVisible();
            await capturer(page, '16-notification-message');
            await page.getByText('Nouveau Message', { exact: true }).click();
            await expect(page.getByText('Le sas vient de se fermer.', { exact: true })).toBeVisible();
            await expect(page.getByTitle('Entrer un message')).toBeVisible();
        });

        test('Jet projeté — recevoir le résultat puis le voir disparaître', async ({ page }) => {
            await rejoindre(page);
            // Résultat déterministe semé chez le MJ : on éprouve sa transmission
            // et son affichage, pas le générateur aléatoire déjà testé par Dice-OS.
            await gmos.fenetre.evaluate(() => {
                const des = (window as unknown as Magasins).useDiceStore.getState();
                des.setLastRoll({ id: 't0-jet', timestamp: new Date(), title: 'Test du relais', total: 14, totalDisplay: '14', modifier: 0, rolls: [{ sides: 20, val: 14 }] });
                des.setIsDiceProjected(true);
                des.triggerDiceProjection();
            });
            await expect(page.getByText('Test du relais', { exact: true })).toBeVisible();
            await capturer(page, '17-jet-projete');
            await expect(page.getByText('Test du relais', { exact: true })).toHaveCount(0, { timeout: 12_000 });
        });

        test('Règle partagée — lire et fermer la transmission', async ({ page }) => {
            await rejoindre(page);
            await gmos.fenetre.evaluate(() => window.appBridge?.remote?.broadcastUIAction?.({
                type: 'session:display-rule', payload: { title: 'Protocole du relais', content: 'Gardez le sas fermé pendant la transmission.', type: 'rule' },
            }));
            await expect(page.getByRole('heading', { name: 'Protocole du relais' })).toBeVisible();
            await capturer(page, '18-regle-partagee');
            await page.getByRole('button', { name: 'Compris, Fermer' }).click();
            await expect(page.getByRole('heading', { name: 'Protocole du relais' })).toHaveCount(0);
        });
    });
}
