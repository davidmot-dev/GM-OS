import { test, expect } from '@playwright/test';
import { lancerGmOs, attendreLHydratation, ouvrirLeModule, CAMPAGNE_TEMOIN, type GmOsLance } from './lancerGmOs';

/**
 * **Map-OS — le plateau, sa météo, son heure, et ce qui part chez les joueurs.**
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QUI EST TESTABLE SANS CARTE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Le profil d'essai n'a aucune image : il n'y a donc pas de plateau à regarder.
 * Mais **tout ce qui l'habille est de l'état pur** — météo, moment de la
 * journée, grille, brouillard, cible de projection — et cet état est ce qui
 * voyage jusqu'aux écrans des joueurs.
 *
 * ⭐ **C'est justement le trajet qui compte.** Map-OS tient deux jeux de
 * champs : l'état du meneur, et son reflet `projected*` que la table voit. *Les
 * deux peuvent diverger sans que rien ne le signale* — et alors le meneur
 * regarde une carte que personne d'autre ne voit.
 */

async function plateau(gmos: GmOsLance) {
    return gmos.fenetre.evaluate(() => {
        const m = (window as never as {
            useMapStore: { getState: () => Record<string, unknown> };
        }).useMapStore.getState();
        return {
            meteo: m.weatherType as string,
            moment: m.timeOfDay as string,
            grille: m.isGridEnabled as boolean,
            jetons: ((m.tokens as unknown[]) ?? []).length,
            zones: ((m.dangerZones as unknown[]) ?? []).length,
            /* Le reflet que la table voit. */
            meteoProjetee: m.projectedWeatherType as string,
            momentProjete: m.projectedTimeOfDay as string,
        };
    });
}

let gmos: GmOsLance;

test.beforeAll(async () => {
    gmos = await lancerGmOs({ semence: CAMPAGNE_TEMOIN });
    await attendreLHydratation(gmos);
    await ouvrirLeModule(gmos, 'Cartographie');
    await gmos.fenetre.getByRole('button', { name: /PROJETER LA CARTE/i }).first()
        .waitFor({ timeout: 20_000 });
});

test.afterAll(async () => { await gmos?.fermer(); });

test.describe('le plateau vide', () => {
    test('part sans jeton ni zone, et le dit', async () => {
        const p = await plateau(gmos);

        expect(p.jetons).toBe(0);
        expect(p.zones).toBe(0);
        await expect(gmos.fenetre.locator('body')).toContainText(/Aucune zone active/i);
    });

    /*
      ⭐ L'état vide le plus utile du module : les pions viennent de Combat-OS,
      et l'écran le **dit** au lieu de laisser un plateau nu. *Un vide qui
      explique où trouver ce qui manque vaut une page de documentation.*
    */
    test('et renvoie vers Combat-OS pour les pions', async () => {
        await expect(gmos.fenetre.locator('body'))
            .toContainText(/Aucun combattant actif/i);
        await expect(gmos.fenetre.locator('body'))
            .toContainText(/Combat OS/i);
    });
});

test.describe('habiller la scène', () => {
    test('la météo se choisit et atteint le magasin', async () => {
        await gmos.fenetre.getByRole('button', { name: /^PLUIE$/i }).first().click();

        await expect.poll(async () => (await plateau(gmos)).meteo, { timeout: 10_000 })
            .toMatch(/rain|pluie/i);

        /* Et l'on revient au sec : le geste est réversible. */
        await gmos.fenetre.getByRole('button', { name: /^AUCUN$/i }).first().click();
        await expect.poll(async () => (await plateau(gmos)).meteo, { timeout: 10_000 })
            .toMatch(/none|aucun|clear/i);
    });

    /*
      ⚠️ Le moment de la journée n'est pas cosmétique : il décide de la teinte de
      la carte chez les joueurs. Une nuit qui reste en plein jour chez eux, et
      l'ambiance tombe à plat sans que le meneur comprenne pourquoi.
    */
    test('le moment de la journée se choisit', async () => {
        const depart = (await plateau(gmos)).moment;

        await gmos.fenetre.getByRole('button', { name: /^NUIT$/i }).first().click();

        await expect.poll(async () => (await plateau(gmos)).moment, { timeout: 10_000 })
            .not.toBe(depart);
    });
});

test.describe('⭐ ce que la table voit', () => {
    /*
      ⛔ **Deux jeux de champs, et rien ne crie s'ils divergent.** L'état du
      meneur change tout de suite ; le reflet `projected*` n'est mis à jour qu'au
      moment où l'on projette. Ce test fige la frontière : *changer la météo chez
      soi ne doit PAS la changer chez les joueurs tant qu'on n'a pas projeté.*
    */
    test('le reflet des joueurs ne suit pas de lui-même', async () => {
        const avant = await plateau(gmos);

        await gmos.fenetre.getByRole('button', { name: /^BROUILLARD$/i }).first().click();
        await expect.poll(async () => (await plateau(gmos)).meteo, { timeout: 10_000 })
            .not.toBe(avant.meteo);

        expect(
            (await plateau(gmos)).meteoProjetee,
            'la table a vu le changement sans qu’on ait projeté',
        ).toBe(avant.meteoProjetee);
    });

    test('et le bouton de projection existe', async () => {
        await expect(gmos.fenetre.getByRole('button', { name: /PROJETER LA CARTE/i }).first())
            .toBeVisible();
    });
});
