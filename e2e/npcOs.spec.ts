import { test, expect } from '@playwright/test';
import { lancerGmOs, attendreLHydratation, ouvrirLeModule, CAMPAGNE_TEMOIN, type GmOsLance } from './lancerGmOs';

/**
 * **NPC-OS — le générateur qui improvise un PNJ.**
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⚠️ CE MODULE NE S'APPELLE PAS CE QU'IL EST
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Le bouton de la barre latérale disait **« Galerie PNJ »** — pour un
 * **générateur**, qui affiche *« En attente de génération »*. Il s'appelle
 * désormais **« Générateur PNJ »** (corrigé le 2026-09-12).
 *
 * ⛔ **Et le pire n'était pas le mensonge, c'était l'homonymie : DEUX écrans
 * portaient ce nom.** Celui-ci, et la vraie galerie du cockpit, qui liste bien
 * les PNJ de la campagne. Ma première version de ce fichier les cherchait ici,
 * ne les trouvait pas, et j'en ai conclu qu'aucun écran ne les listait — parce
 * que cliquer « Galerie PNJ » tombait toujours sur le générateur.
 *
 * ⭐ *Deux écrans de même nom ne trompent pas que les tests.* C'est la leçon
 * déjà payée par « Sync Oracle », renommé « Envoyer au carnet » le 2026-09-04.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QUI EST TESTABLE SANS MODÈLE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * ⭐ **Le tirage de base est local.** L'IA n'intervient qu'en *enrichissement*,
 * derrière son propre interrupteur — donc une instance sans clé d'API peut
 * quand même générer. C'est ce qu'on éprouve ici ; l'enrichissement, lui,
 * relève de la catégorie P6.
 */

let gmos: GmOsLance;

test.beforeAll(async () => {
    gmos = await lancerGmOs({ semence: CAMPAGNE_TEMOIN });
    await attendreLHydratation(gmos);
    await ouvrirLeModule(gmos, 'Générateur PNJ');
    await gmos.fenetre.getByRole('button', { name: /Générer PNJ/ }).first()
        .waitFor({ timeout: 20_000 });
});

test.afterAll(async () => { await gmos?.fermer(); });

test.describe('le générateur', () => {
    test('propose un univers et un thème', async () => {
        /*
          ⚠️ **La page porte DEUX `<main>`**, et les listes sont dans le
          premier — `main:last` en compte zéro. Cadrer sur « le dernier main »
          paraissait plus sûr que la page entière ; c'était l'inverse.
        */
        const listes = gmos.fenetre.locator('select');

        /* Au moins deux — univers et thème. Figer le compte exact rendrait le
           test faux le jour où un troisième critère s'ajoute, sans qu'aucune
           régression n'ait eu lieu. */
        expect(await listes.count(), 'univers et thème').toBeGreaterThanOrEqual(2);
        await expect(listes.first().locator('option')).not.toHaveCount(0);
        await expect(listes.nth(1).locator('option')).not.toHaveCount(0);
    });

    test('part sur un écran qui dit quoi faire', async () => {
        await expect(gmos.fenetre.locator('main').last())
            .toContainText(/En attente de génération/i);
    });

    /*
      ⭐ **Le tirage sans modèle.** C'est la moitié du module qu'une instance
      d'essai peut juger — et la plus utile : si le tirage local casse, plus
      aucun PNJ ne sort, avec ou sans IA.
    */
    test('tirer produit un PNJ, sans aucune clé d’API', async () => {
        await gmos.fenetre.getByRole('button', { name: /Générer PNJ/ }).first().click();

        /* L'écran d'attente doit céder la place à quelque chose. */
        await expect(gmos.fenetre.locator('main').last())
            .not.toContainText(/En attente de génération/i, { timeout: 20_000 });
    });

    /*
      ⚠️ Deux tirages de suite : un générateur qui rendrait toujours le même
      résultat passerait le test précédent sans rien générer du tout.
    */
    test('deux tirages ne donnent pas le même écran', async () => {
        const zone = gmos.fenetre.locator('main').last();
        const premier = await zone.innerText();

        for (let i = 0; i < 4; i++) {
            await gmos.fenetre.getByRole('button', { name: /Générer PNJ/ }).first().click();
            await gmos.fenetre.waitForTimeout(400);
            if ((await zone.innerText()) !== premier) return;
        }

        expect(await zone.innerText(), 'quatre tirages ont rendu exactement le même écran')
            .not.toBe(premier);
    });
});

test.describe('les cinq natures', () => {
    test('sont toutes offertes', async () => {
        for (const nature of ['PNJ', 'Lieux', 'Objets', 'Événements', 'Rumeurs']) {
            await expect(
                gmos.fenetre.getByTitle(nature).first(),
                `l'onglet « ${nature} » manque`,
            ).toBeVisible();
        }
    });
});
