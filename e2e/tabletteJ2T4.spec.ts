import { test, expect, type Page, type Locator } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { lancerGmOs, attendreLHydratation, type GmOsLance } from './lancerGmOs';
import type { useSessionOSStore } from '../src/modules/session/useSessionOSStore';
import type { useFavoriteStore } from '../src/modules/favorite/useFavoriteStore';
import type { useClockStore } from '../src/store/useClockStore';
import type { useCombatStore } from '../src/modules/combat/useCombatStore';

// J2 : navigateur sans pont Electron, meneur sur profil jetable, vrai WebSocket.
// Aucun accès au profil de David ; seule la campagne de démonstration est employée.
const ICI = path.dirname(fileURLToPath(import.meta.url));
const SORTIE = process.env.GMOS_TABLET_CAPTURES_DIR
    ? path.join(path.resolve(process.env.GMOS_TABLET_CAPTURES_DIR), 'j2')
    : path.join(ICI, '../documentation/Planning/tablettes/T4-joueurs/j2');
const SEMENCE = path.join(ICI, 'donnees/campagne-de-demo.json');
const DEMO = JSON.parse(fs.readFileSync(SEMENCE, 'utf8'));
const PLAN = 'data:image/png;base64,' + fs.readFileSync(path.join(ICI, 'donnees/plan-station-varn.png')).toString('base64');
type Magasins = { useSessionOSStore: typeof useSessionOSStore; useFavoriteStore: typeof useFavoriteStore; useClockStore: typeof useClockStore; useCombatStore: typeof useCombatStore };
const TAILLES = [
    { nom: 'petit-telephone', width: 360, height: 800 },
    { nom: 'telephone', width: 390, height: 844 },
    { nom: 'portrait', width: 820, height: 1180 },
    { nom: 'paysage', width: 1180, height: 820 },
] as const;
let gmos: GmOsLance;
test.use({ channel: 'msedge', locale: 'fr-FR', timezoneId: 'Europe/Brussels', serviceWorkers: 'block' });
test.setTimeout(90_000);
test.beforeAll(async () => {
    test.setTimeout(90_000);
    fs.mkdirSync(SORTIE, { recursive: true });
    gmos = await lancerGmOs({ semence: SEMENCE });
    gmos.fenetre.on('pageerror', e => console.error('[J2 renderer]', e.message));
    await gmos.fenetre.waitForFunction(() => Boolean((window as unknown as Magasins).useSessionOSStore), null, { timeout: 60_000 });
    await attendreLHydratation(gmos);
    await expect(gmos.fenetre.locator('[data-ecran-d-accueil]')).toHaveCount(0, { timeout: 20_000 });
});
test.afterAll(async () => { test.setTimeout(60_000); await gmos?.fermer(); });

async function rejoindre(page: Page, taille: typeof TAILLES[number]) {
    await page.setViewportSize(taille);
    await page.addInitScript(() => localStorage.setItem('gmos-tablet-uuid', 't4-j2'));
    await gmos.fenetre.evaluate(({ semence, plan }) => {
        const w = window as unknown as Magasins;
        const s = semence.modules.sessionOS;
        const description = Array.from({ length: 18 }, (_, i) => `Paragraphe ${i + 1} : le relais garde une trace des passages entre le pont C et le sas. Les équipes se retrouvent à la relève.`).join('\n\n');
        w.useSessionOSStore.setState({ ...s,
            sessions: s.sessions.map((seance: { id: string }) => ({ ...seance, status: seance.id === 'demo-seance-2' ? 'active' : 'done', feedbacks: [] })),
            clues: [
                ...Array.from({ length: 12 }, (_, i) => ({ ...s.clues[0], id: `j2-indice-${i}`, isRevealed: true,
                    title: i === 0 ? 'Le café encore chaud' : `Indice ${i} du relais avec un intitulé qui reste lisible en entier`, content: description, mediaUrl: i === 0 ? plan : '' })),
                { ...s.clues[0], id: 'j2-indice-secret', title: 'Indice non révélé', isRevealed: false },
                { ...s.clues[0], id: 'j2-indice-autre', title: 'Indice autre campagne', isRevealed: true, campaignId: 'autre-campagne' },
            ],
            entities: [
                ...Array.from({ length: 12 }, (_, i) => ({ ...s.entities[0], id: `j2-pnj-${i}`, isVisibleByPlayers: true,
                    name: i === 0 ? 'Superviseur Hale' : `Responsable ${i} de la surveillance du relais et du pont C`, role: 'Responsable de la sécurité', description, avatar: '' })),
                { ...s.entities[0], id: 'j2-pnj-secret', name: 'PNJ non partagé', isVisibleByPlayers: false },
                { ...s.entities[0], id: 'j2-pnj-autre', name: 'PNJ autre campagne', isVisibleByPlayers: true, campaignId: 'autre-campagne' },
            ],
            atlasMaps: [
                ...Array.from({ length: 8 }, (_, i) => ({ ...s.atlasMaps[0], id: `j2-lieu-${i}`, isVisited: true,
                    name: i === 0 ? 'Station Varn' : `Secteur ${i} du relais, entre le sas extérieur et le pont C`, fileUrl: plan,
                    type: 'battlemap', isVideo: false, linkedEntities: [], gmNotes: '', narrativeDescription: description })),
                { ...s.atlasMaps[0], id: 'j2-lieu-secret', name: 'Lieu non visité', isVisited: false },
                { ...s.atlasMaps[0], id: 'j2-lieu-autre', name: 'Lieu autre campagne', isVisited: true, campaignId: 'autre-campagne' },
            ],
            messages: [], hubNotifications: [], demandesDeCarte: [], transferRequests: [],
        });
        w.useFavoriteStore.setState({ favorites: [] });
        w.useCombatStore.setState({ combatants: [], isCombatProjected: false });
        w.useClockStore.setState({ isClockProjected: true, timestamp: Date.parse('2026-10-03T19:00:00Z'), mode: 'static', tensions: [
            { id: 'j2-alerte', name: 'Alerte de la station', totalSegments: 8, filledSegments: 3, vueParLesJoueurs: true },
            { id: 'j2-secret', name: 'Secret du meneur', totalSegments: 4, filledSegments: 1, vueParLesJoueurs: false },
        ] });
    }, { semence: DEMO, plan: PLAN });
    await page.goto(`http://127.0.0.1:${gmos.ports.sync}/?window=tablet&sync=${gmos.ports.sync}`);
    expect(await page.evaluate(() => Boolean(window.appBridge))).toBe(false);
    await page.getByRole('button', { name: /Nel Varga/ }).click();
    await expect(page.getByText('Connecté', { exact: true })).toBeVisible();
    await expect(page.getByText('Synchronisation', { exact: true })).toHaveCount(0);
}
async function capturer(page: Page, nom: string) {
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(SORTIE, nom + '.png'), animations: 'disabled', scale: 'css' });
}
async function verifierCible(cible: Locator) {
    const r = await cible.boundingBox();
    expect(r).not.toBeNull();
    expect(r!.width).toBeGreaterThanOrEqual(43.9);
    expect(r!.height).toBeGreaterThanOrEqual(43.9);
}
async function verifierDansLEcran(page: Page, cible: Locator) {
    await expect(cible).toBeVisible();
    // Attendre la fin de l'entrée animée avant de mesurer sa place à l'écran.
    await expect.poll(async () => {
        const r = await cible.boundingBox(), ecran = page.viewportSize()!;
        return Boolean(r && r.x >= -1 && r.y >= -1 && r.x + r.width <= ecran.width + 1 && r.y + r.height <= ecran.height + 1);
    }).toBe(true);
}
async function verifierNavigation(page: Page) {
    const nav = page.getByRole('navigation', { name: 'Navigation Hub' });
    for (const titre of ['Direct', 'Archives', 'PNJ', 'Lieux', 'Inventaire', 'Cartes', 'Fiche Personnage', 'Notes Personnelles', 'Messages', 'Quitter']) {
        const cible = nav.getByTitle(titre, { exact: true });
        await expect(cible.locator('span').first()).toBeVisible();
        await verifierCible(cible);
        await verifierDansLEcran(page, cible);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize()!.width);
    await expect(page.getByText('Secret du meneur', { exact: true })).toHaveCount(0);
}

const CONSULTATIONS = [
    { onglet: 'Archives', ecran: 'archives', premier: 'Le café encore chaud', masque: ['Indice non révélé', 'Indice autre campagne'], nombre: 12, fermeture: "Fermer l'indice", vide: 'Aucune archive disponible', magasin: 'clues' },
    { onglet: 'PNJ', ecran: 'pnj', premier: 'Superviseur Hale', masque: ['PNJ non partagé', 'PNJ autre campagne'], nombre: 12, fermeture: 'Fermer', vide: 'Aucun sujet identifié', magasin: 'entities' },
    { onglet: 'Lieux', ecran: 'lieux', premier: 'Station Varn', masque: ['Lieu non visité', 'Lieu autre campagne'], nombre: 8, fermeture: 'Fermer', vide: 'Territoires inconnus', magasin: 'atlasMaps' },
] as const;
for (const vue of CONSULTATIONS) for (const taille of TAILLES) test(`${vue.onglet} T4 J2 — lecture, partage et défilement à ${taille.width} px`, async ({ page }) => {
    await rejoindre(page, taille);
    await page.getByRole('navigation').getByTitle(vue.onglet, { exact: true }).click();
    const zone = page.locator(`[data-hub-consultation="${vue.ecran}"]`);
    await expect(zone.getByRole('heading', { level: 3 })).toHaveCount(vue.nombre);
    for (const nom of vue.masque) await expect(page.getByText(nom, { exact: true })).toHaveCount(0);
    await verifierNavigation(page);
    await capturer(page, `${taille.nom}-${vue.ecran}`);
    const dernier = zone.getByRole('button').filter({ has: page.getByRole('heading', { level: 3 }) }).last();
    await dernier.scrollIntoViewIfNeeded();
    await verifierCible(dernier);
    const r = await dernier.boundingBox(), nav = await page.getByRole('navigation').boundingBox();
    expect(r!.y + r!.height).toBeLessThanOrEqual(nav!.y + 1);
    await capturer(page, `${taille.nom}-${vue.ecran}-bas`);
    await zone.getByRole('button', { name: new RegExp(vue.premier) }).click();
    const lecture = page.getByRole('dialog', { name: vue.premier, exact: true });
    await expect(lecture).toBeVisible();
    await verifierDansLEcran(page, lecture.getByTitle(vue.fermeture));
    await verifierCible(lecture.getByTitle(vue.fermeture));
    await capturer(page, `${taille.nom}-${vue.ecran}-lecture`);
    const texte = lecture.getByText(/Paragraphe 18/);
    await texte.evaluate(e => e.parentElement!.parentElement!.parentElement!.scrollTop = 100_000);
    await verifierDansLEcran(page, lecture.getByTitle(vue.fermeture));
    await capturer(page, `${taille.nom}-${vue.ecran}-lecture-bas`);
    await lecture.getByTitle(vue.fermeture).click();
    await expect(lecture).toHaveCount(0);
    await zone.getByRole('button', { name: new RegExp(vue.premier) }).click();
    await page.keyboard.press('Escape');
    await expect(lecture).toHaveCount(0);
    await gmos.fenetre.evaluate(cle => (window as unknown as Magasins).useSessionOSStore.setState({ [cle]: [] }), vue.magasin);
    await expect(zone.getByText(vue.vide, { exact: true })).toBeVisible();
    await verifierNavigation(page);
    await capturer(page, `${taille.nom}-${vue.ecran}-vide`);
});

for (const taille of TAILLES) test(`Messagerie T4 J2 — canaux et saisie accessibles à ${taille.width} px`, async ({ page, browser }) => {
    await rejoindre(page, taille);
    const contexteDuVoisin = await browser.newContext({ viewport: taille, locale: 'fr-FR', serviceWorkers: 'block' });
    try {
    await contexteDuVoisin.addInitScript(() => localStorage.setItem('gmos-tablet-uuid', 't4-j2-voisin'));
    const voisin = await contexteDuVoisin.newPage();
    await voisin.goto(`http://127.0.0.1:${gmos.ports.sync}/?window=tablet&sync=${gmos.ports.sync}`);
    await voisin.getByRole('button', { name: /Idris Koa/ }).click();
    await expect(voisin.getByText('Connecté', { exact: true })).toBeVisible();
    await page.getByRole('navigation').getByTitle('Messages', { exact: true }).click();
    const dialogue = page.getByRole('dialog', { name: 'Messagerie', exact: true });
    for (const titre of ['Fermer la messagerie', 'Choisir le destinataire', 'Entrer un message', 'Envoyer le message']) await verifierDansLEcran(page, dialogue.getByTitle(titre));
    await verifierCible(dialogue.getByTitle('Fermer la messagerie'));
    await verifierCible(dialogue.getByTitle('Envoyer le message'));
    await dialogue.getByTitle('Entrer un message').fill('Le relais est ouvert.');
    await dialogue.getByTitle('Envoyer le message').click();
    await expect.poll(() => gmos.fenetre.evaluate(() => (window as unknown as Magasins).useSessionOSStore.getState().messages.some(m => m.content === 'Le relais est ouvert.' && m.toId === 'GM'))).toBe(true);
    await gmos.fenetre.evaluate(() => {
        const s = (window as unknown as Magasins).useSessionOSStore.getState();
        for (let i = 0; i < 16; i++) s.sendDirectMessage('temoin-pj-1', 'Nel Varga', `Réponse ${i} : gardez le sas fermé pendant la transmission.`);
        s.sendDirectMessage('temoin-pj-2', 'Idris Koa', 'Secret réservé à Idris.');
    });
    await expect(dialogue.getByText('Réponse 15 : gardez le sas fermé pendant la transmission.', { exact: true })).toBeVisible();
    await expect(dialogue.getByText('Secret réservé à Idris.', { exact: true })).toHaveCount(0);
    await verifierDansLEcran(page, dialogue.getByTitle('Entrer un message'));
    await capturer(page, `${taille.nom}-messagerie`);
    await dialogue.getByTitle('Choisir le destinataire').click();
    const choix = dialogue.getByRole('button', { name: 'Tous les Joueurs', exact: true });
    await verifierCible(choix);
    await capturer(page, `${taille.nom}-destinataires`);
    await choix.click();
    await expect(dialogue.getByText('Réponse 15 : gardez le sas fermé pendant la transmission.', { exact: true })).toHaveCount(0);
    await dialogue.getByTitle('Entrer un message').fill('Nous sommes dans le sas.');
    await page.keyboard.press('Enter');
    await expect.poll(() => gmos.fenetre.evaluate(() => (window as unknown as Magasins).useSessionOSStore.getState().messages.some(m => m.content === 'Nous sommes dans le sas.' && m.toId === 'all'))).toBe(true);
    await capturer(page, `${taille.nom}-messagerie-generale`);
    await dialogue.getByTitle('Choisir le destinataire').click();
    await dialogue.getByRole('button', { name: 'Idris Koa', exact: true }).click();
    await dialogue.getByTitle('Entrer un message').fill('Retrouvons-nous au relais.');
    await dialogue.getByTitle('Envoyer le message').click();
    // Le privé joueur → joueur reste P2P : le meneur n'enregistre pas ce fil.
    await voisin.getByRole('navigation').getByTitle('Messages', { exact: true }).click();
    const conversationDuVoisin = voisin.getByRole('dialog', { name: 'Messagerie', exact: true });
    await conversationDuVoisin.getByTitle('Choisir le destinataire').click();
    await conversationDuVoisin.getByRole('button', { name: 'Nel Varga', exact: true }).click();
    await expect(conversationDuVoisin.getByText('Retrouvons-nous au relais.', { exact: true })).toBeVisible();
    expect(await gmos.fenetre.evaluate(() => (window as unknown as Magasins).useSessionOSStore.getState().messages.some(m => m.content === 'Retrouvons-nous au relais.'))).toBe(false);
    await conversationDuVoisin.getByTitle('Entrer un message').fill('Je vous attends au relais.');
    await conversationDuVoisin.getByTitle('Envoyer le message').click();
    await expect(dialogue.getByText('Je vous attends au relais.', { exact: true })).toBeVisible();
    await expect(dialogue.getByText('Nous sommes dans le sas.', { exact: true })).toHaveCount(0);
    await capturer(page, `${taille.nom}-messagerie-privee`);
    await dialogue.getByTitle('Choisir le destinataire').click();
    await page.keyboard.press('Escape');
    await expect(dialogue).toBeVisible();
    await expect(dialogue.getByRole('button', { name: 'Tous les Joueurs', exact: true })).toHaveCount(0);
    await page.keyboard.press('Escape');
    await expect(dialogue).toHaveCount(0);
    await verifierNavigation(page);
    } finally { await contexteDuVoisin.close(); }
});

for (const taille of TAILLES) test(`Notes T4 J2 — sauvegarde et feedback tactile à ${taille.width} px`, async ({ page }) => {
    await rejoindre(page, taille);
    await page.getByRole('navigation').getByTitle('Notes Personnelles', { exact: true }).click();
    const dialogue = page.getByRole('dialog', { name: 'Notes & Feedback', exact: true });
    await verifierCible(dialogue.getByTitle('Fermer les notes'));
    await dialogue.getByPlaceholder(/Notez ici vos théories/).fill('Revenir au relais après la relève.');
    await expect.poll(() => gmos.fenetre.evaluate(() => (window as unknown as Magasins).useSessionOSStore.getState().players[0].characters[0].playerNotes)).toBe('Revenir au relais après la relève.');
    await capturer(page, `${taille.nom}-notes`);
    await dialogue.getByRole('button', { name: 'Feedback MJ', exact: true }).click();
    for (const critere of ['Plaisir de jeu', 'Histoire', 'Combat / Action']) {
        for (let i = 1; i <= 5; i++) await verifierCible(dialogue.getByRole('button', { name: `${critere} : ${i} sur 5`, exact: true }));
        await dialogue.getByRole('button', { name: `${critere} : 3 sur 5`, exact: true }).click();
    }
    await dialogue.getByPlaceholder(/Ce que vous avez aimé/).fill('Un bon rythme au relais.');
    await capturer(page, `${taille.nom}-feedback`);
    const transmettre = dialogue.getByRole('button', { name: 'Transmettre au MJ', exact: true });
    await transmettre.scrollIntoViewIfNeeded();
    await verifierCible(transmettre);
    await verifierDansLEcran(page, transmettre);
    await capturer(page, `${taille.nom}-feedback-bas`);
    await transmettre.click();
    await expect(dialogue.getByRole('heading', { name: 'Feedback Transmis !', exact: true })).toBeVisible();
    await expect.poll(() => gmos.fenetre.evaluate(() => {
        const feedback = (window as unknown as Magasins).useSessionOSStore.getState().sessions.find(s => s.id === 'demo-seance-2')?.feedbacks?.find(f => f.characterId === 'temoin-pj-1');
        return feedback ? [feedback.funRating, feedback.storyRating, feedback.combatRating, feedback.notes] : null;
    })).toEqual([3, 3, 3, 'Un bon rythme au relais.']);
    await capturer(page, `${taille.nom}-feedback-transmis`);
    await dialogue.getByTitle('Fermer les notes').click();
    await expect(dialogue).toHaveCount(0);
    await page.getByRole('navigation').getByTitle('Notes Personnelles', { exact: true }).click();
    await dialogue.getByPlaceholder(/Notez ici vos théories/).fill('Note enregistrée à la fermeture.');
    await page.keyboard.press('Escape');
    await expect(dialogue).toHaveCount(0);
    await expect.poll(() => gmos.fenetre.evaluate(() => (window as unknown as Magasins).useSessionOSStore.getState().players[0].characters[0].playerNotes)).toBe('Note enregistrée à la fermeture.');
});

for (const taille of TAILLES) test(`Notifications T4 J2 — message visible au-dessus de la navigation à ${taille.width} px`, async ({ page }) => {
    await rejoindre(page, taille);
    // La dernière conversation consultée est privée : le signal doit choisir
    // le canal du message reçu plutôt que réouvrir ce dernier destinataire.
    await page.getByRole('navigation').getByTitle('Messages', { exact: true }).click();
    await page.getByTitle('Choisir le destinataire').click();
    await page.getByRole('button', { name: 'Idris Koa', exact: true }).click();
    await page.getByTitle('Fermer la messagerie').click();
    await page.getByRole('navigation').getByTitle('Archives', { exact: true }).click();
    await gmos.fenetre.evaluate(() => (window as unknown as Magasins).useSessionOSStore.getState().sendDirectMessage('temoin-pj-1', 'Nel Varga', 'Le sas vient de se fermer.'));
    const notification = page.getByTitle('Ouvrir le nouveau message', { exact: true });
    await verifierDansLEcran(page, notification);
    await verifierCible(notification);
    await expect.poll(async () => {
        const r = await notification.boundingBox(), nav = await page.getByRole('navigation').boundingBox();
        return Boolean(r && nav && r.y + r.height <= nav.y);
    }).toBe(true);
    await capturer(page, `${taille.nom}-notification-message`);
    await notification.click();
    await expect(page.getByRole('dialog', { name: 'Messagerie' }).getByText('Le sas vient de se fermer.', { exact: true })).toBeVisible();
    await page.getByTitle('Fermer la messagerie').click();
    await expect(notification).toHaveCount(0);
    await gmos.fenetre.evaluate(() => (window as unknown as Magasins).useSessionOSStore.getState().sendDirectMessage('temoin-pj-1', 'Nel Varga', 'La relève arrive.'));
    await expect(notification).toBeVisible();
    // Une mise à jour pour un autre joueur ne doit ni remplacer le signal ni
    // annuler son échéance. Le flux réel transmet aussi ce message à la tablette.
    await gmos.fenetre.evaluate(() => (window as unknown as Magasins).useSessionOSStore.getState().sendDirectMessage('temoin-pj-2', 'Idris Koa', 'Message privé pour Idris.'));
    await expect.poll(() => page.evaluate(() => (window as unknown as Magasins).useSessionOSStore.getState().messages.some(m => m.content === 'Message privé pour Idris.'))).toBe(true);
    await expect(notification).toBeVisible();
    await expect(notification).toContainText('Maître du Jeu');
    await expect(notification).toHaveCount(0, { timeout: 8_000 });
    await verifierNavigation(page);
});

for (const taille of TAILLES) test(`Alertes locales T4 J2 — lecture, fermeture et expiration à ${taille.width} px`, async ({ page }) => {
    await rejoindre(page, taille);
    // Contrôle de présentation uniquement : les alertes génériques ne sont pas
    // un flux entrant WebSocket du meneur. Leur état local est le décor du test.
    await page.evaluate(() => (window as unknown as Magasins).useSessionOSStore.getState().addHubNotification({
        type: 'alert', title: 'Le sas du pont C se ferme pendant la relève',
        content: 'Restez au relais. **Le pont C est sous quarantaine** jusqu’au retour de l’équipe de sécurité.',
        fromName: 'Responsable de la surveillance du relais',
    }));
    const alerte = page.getByRole('status').filter({ hasText: 'Le sas du pont C se ferme pendant la relève' });
    await verifierDansLEcran(page, alerte);
    await verifierCible(alerte.getByTitle('Fermer', { exact: true }));
    await expect.poll(async () => {
        const r = await alerte.boundingBox(), nav = await page.getByRole('navigation').boundingBox();
        return Boolean(r && nav && r.y + r.height <= nav.y);
    }).toBe(true);
    await capturer(page, `${taille.nom}-alerte`);
    await alerte.getByTitle('Fermer', { exact: true }).click();
    await expect(alerte).toHaveCount(0);
    await page.evaluate(() => (window as unknown as Magasins).useSessionOSStore.getState().addHubNotification({
        type: 'system', title: 'La relève arrive', content: 'Le relais restera ouvert.', fromName: 'Régie de la station',
    }));
    const systeme = page.getByRole('status').filter({ hasText: 'La relève arrive' });
    await expect(systeme).toBeVisible();
    await capturer(page, `${taille.nom}-notification-systeme`);
    await expect(systeme).toHaveCount(0, { timeout: 11_000 });
    await verifierNavigation(page);
});

test('Surcouches T4 J2 — un panneau joueur à la fois en paysage', async ({ page }) => {
    await rejoindre(page, TAILLES[3]);
    const nav = page.getByRole('navigation', { name: 'Navigation Hub' });
    await nav.getByTitle('Messages', { exact: true }).click();
    const messagerie = page.getByRole('dialog', { name: 'Messagerie', exact: true });
    await expect(messagerie).toBeVisible();
    await nav.getByTitle('Notes Personnelles', { exact: true }).click();
    await expect(messagerie).toHaveCount(0);
    const notes = page.getByRole('dialog', { name: 'Notes & Feedback', exact: true });
    await verifierDansLEcran(page, notes.getByTitle('Fermer les notes'));
    await notes.getByPlaceholder(/Notez ici vos théories/).fill('La saisie reste enregistrée quand je change de panneau.');
    await nav.getByTitle('Fiche Personnage', { exact: true }).click();
    await expect(notes).toHaveCount(0);
    await expect(page.getByTitle('Fermer la fiche')).toBeVisible();
    await expect.poll(() => gmos.fenetre.evaluate(() => (window as unknown as Magasins).useSessionOSStore.getState().players[0].characters[0].playerNotes)).toBe('La saisie reste enregistrée quand je change de panneau.');
    await page.getByTitle('Fermer la fiche').click();
    await nav.getByTitle('Messages', { exact: true }).click();
    await expect(messagerie).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(messagerie).toHaveCount(0);
});
