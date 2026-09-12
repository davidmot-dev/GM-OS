import { test, expect } from '@playwright/test';
import { lancerGmOs, attendreLHydratation, ouvrirLeModule, CAMPAGNE_TEMOIN, type GmOsLance } from './lancerGmOs';

/**
 * **Table-OS — consulter un oracle : un univers, une table, un résultat.**
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LA CHAÎNE QUE CE FICHIER GARDE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Trois maillons, et chacun peut casser sans bruit : **l'univers** peuple la
 * liste des tables, **la table** peuple le tirage, **le tirage** rend une ligne
 * qu'on lit à voix haute. Un maillon rompu laisse une liste vide ou un bouton
 * sans effet — et en séance, on suppose qu'on a mal cliqué.
 *
 * ⚠️ **Les univers sont livrés avec GM-OS**, pas tirés du corpus : une instance
 * d'essai au corpus vide en propose quand même (Alien, Blade Runner, Cthulhu
 * Hack…). C'est ce qui rend ce module testable ici, contrairement à Loot-OS.
 */

let gmos: GmOsLance;

/** Les deux listes : l'univers, puis la table. */
function listes(gmos: GmOsLance) {
    return gmos.fenetre.locator('select');
}

test.beforeAll(async () => {
    gmos = await lancerGmOs({ semence: CAMPAGNE_TEMOIN });
    await attendreLHydratation(gmos);
    await ouvrirLeModule(gmos, 'Tables Aléatoires');
    await listes(gmos).first().waitFor({ timeout: 20_000 });
});

test.afterAll(async () => { await gmos?.fermer(); });

test.describe('choisir', () => {
    test('des univers sont proposés, même sans corpus', async () => {
        const options = await listes(gmos).first().locator('option').allTextContents();

        expect(options.length, 'aucun univers proposé').toBeGreaterThan(1);
        expect(options.join(' | ')).toMatch(/Alien|Blade Runner|Cthulhu/);
    });

    /*
      ⛔ **Le maillon qui casse le plus silencieusement.** Si choisir un univers
      ne peuple pas les tables, la seconde liste reste sur « Choisir une
      table… » — ce qui ressemble exactement à « je n'ai pas encore choisi ».
    */
    test('choisir un univers peuple la liste des tables', async () => {
        const univers = (await listes(gmos).first().locator('option').allTextContents())
            .find(o => !/Choisir/i.test(o))!;

        await listes(gmos).first().selectOption({ label: univers });

        await expect.poll(
            async () => (await listes(gmos).nth(1).locator('option').count()),
            { timeout: 15_000, message: `« ${univers} » n'a proposé aucune table` },
        ).toBeGreaterThan(1);
    });
});

test.describe('tirer', () => {
    test('le tirage rend un résultat lisible', async () => {
        const tables = await listes(gmos).nth(1).locator('option').allTextContents();
        const table = tables.find(o => !/Choisir/i.test(o))!;

        await listes(gmos).nth(1).selectOption({ label: table });

        const avant = await gmos.fenetre.locator('body').innerText();
        await gmos.fenetre.getByRole('button', { name: /^LANCER$/i }).first().click();

        /*
          On ne peut pas prédire le résultat — c'est un tirage. Ce qu'on exige,
          c'est que l'écran **change** : un bouton qui ne produit rien est le
          défaut le plus courant de cette famille.
        */
        await expect.poll(
            async () => (await gmos.fenetre.locator('body').innerText()) !== avant,
            { timeout: 15_000, message: 'le tirage n’a rien changé à l’écran' },
        ).toBe(true);
    });

    /*
      ⚠️ Deux tirages sur la même table : s'ils rendent toujours exactement le
      même écran, ce n'est plus un oracle. Une table à une seule entrée existe,
      d'où les quatre essais avant de conclure.
    */
    test('deux tirages ne se ressemblent pas toujours', async () => {
        const zone = gmos.fenetre.locator('body');
        const premier = await zone.innerText();

        for (let i = 0; i < 4; i++) {
            await gmos.fenetre.getByRole('button', { name: /^LANCER$/i }).first().click();
            await gmos.fenetre.waitForTimeout(500);
            if ((await zone.innerText()) !== premier) return;
        }

        expect(await zone.innerText(), 'quatre tirages ont rendu le même écran')
            .not.toBe(premier);
    });
});
