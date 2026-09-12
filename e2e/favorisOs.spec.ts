import { test, expect } from '@playwright/test';
import { lancerGmOs, attendreLHydratation, ouvrirLeModule, CAMPAGNE_TEMOIN, type GmOsLance } from './lancerGmOs';

/**
 * **Favorite-OS — le codex du meneur, et sa recherche.**
 *
 * Ce module n'est pas une catégorie de plus : c'est **un raccourci personnel**
 * vers ce qu'on veut sous la main sans le chercher. Sa valeur tient donc à deux
 * choses, et elles sont toutes deux vérifiables ici : que les entrées
 * **arrivent** à l'écran, et que **la recherche les retrouve**.
 *
 * ⚠️ *Un filtre qui n'enlève rien passe plus facilement inaperçu qu'un filtre
 * qui enlève tout — et il est tout aussi faux.* D'où les deux sens vérifiés :
 * ce qui doit rester, et ce qui doit disparaître.
 */

interface Favori { id: string; name?: string; title?: string; }

async function favoris(gmos: GmOsLance): Promise<Favori[]> {
    return gmos.fenetre.evaluate(() =>
        ((window as never as {
            useFavoriteStore: { getState: () => { favorites?: Favori[] } };
        }).useFavoriteStore.getState().favorites ?? []) as never);
}

/** Le libellé lisible d'un favori, quel que soit le champ qui le porte. */
const libelle = (f: Favori) => f.name ?? f.title ?? '';

let gmos: GmOsLance;

test.beforeAll(async () => {
    gmos = await lancerGmOs({ semence: CAMPAGNE_TEMOIN });
    await attendreLHydratation(gmos);
    await ouvrirLeModule(gmos, 'Favoris');
    await gmos.fenetre.getByPlaceholder('Chercher dans le Panthéon...')
        .waitFor({ timeout: 20_000 });
});

test.afterAll(async () => { await gmos?.fermer(); });

test.describe('le codex', () => {
    test('offre ses cinq filtres', async () => {
        const zone = gmos.fenetre.locator('body');

        for (const filtre of ['Toutes les Entités', 'PNJs', 'Lieux', 'Objets', 'Lore']) {
            await expect(zone, `le filtre « ${filtre} » manque`).toContainText(filtre);
        }
    });

    /*
      ⭐ L'écran doit s'accorder au magasin : soit il montre des entrées, soit il
      dit qu'il n'y en a pas. *Un codex vide sans un mot se lit comme un codex
      cassé.*
    */
    test('ce que le magasin détient est à l’écran, ou son absence est dite', async () => {
        const liste = await favoris(gmos);
        const zone = gmos.fenetre.locator('body');

        if (liste.length === 0) {
            await expect(zone).toContainText(/aucun|vide|rien/i);
            return;
        }

        const premier = libelle(liste[0]);
        expect(premier, 'un favori sans libellé est introuvable pour le meneur').not.toBe('');
        await expect(zone).toContainText(premier, { timeout: 15_000 });
    });
});

test.describe('la recherche', () => {
    test('retrouve ce qui existe et écarte le reste', async () => {
        const liste = await favoris(gmos);
        test.skip(liste.length === 0, 'aucun favori : la recherche n’a rien à filtrer');

        const cible = libelle(liste[0]);
        const champ = gmos.fenetre.getByPlaceholder('Chercher dans le Panthéon...');
        const zone = gmos.fenetre.locator('body');

        /* Le sens qui rassure : ce qu'on cherche reste. */
        await champ.fill(cible);
        await expect(zone).toContainText(cible, { timeout: 10_000 });

        /*
          ⛔ Et le sens qui trouve les défauts : une recherche sans résultat doit
          faire DISPARAÎTRE ce qui ne correspond pas. Un filtre décoratif passe
          le premier test et échoue ici.
        */
        await champ.fill('zzz-introuvable-zzz');
        await expect(zone).not.toContainText(cible, { timeout: 10_000 });

        await champ.fill('');
        await expect(zone).toContainText(cible, { timeout: 10_000 });
    });
});
