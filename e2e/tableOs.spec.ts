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

/**
 * **L'Atelier des tables — écrire un oracle, et le voir se relire.**
 *
 * Demandé par David le 2026-09-15. Ce que ces essais gardent, et qu'aucun test
 * unitaire ne peut voir :
 *
 * 1. **la bande de couverture réagit** — c'est elle qui rend visible le trou que
 *    personne ne voit dans un fichier JSON ;
 * 2. **l'aller-retour complet** : écrire depuis l'écran, puis retrouver la table
 *    dans le pupitre et pouvoir la tirer. C'est le seul essai qui traverse le
 *    pont, le confinement du chemin et le disque.
 *
 * ⚠️ **Il écrit vraiment dans `databases/tables/`.** D'où un univers jetable au
 * nom sans ambiguïté, supprimé par l'écran à la fin — et par `afterAll` si
 * l'essai s'arrête avant. *Un test qui laisse un fichier derrière lui finit par
 * être celui qui casse le suivant.*
 */
const UNIVERS_JETABLE = 'zz-atelier-essai';

test.afterAll(async () => {
    const fs = await import('node:fs/promises');
    await fs.rm(`databases/tables/${UNIVERS_JETABLE}`, { recursive: true, force: true });
});

test.describe('l’atelier des tables', () => {
    const atelier = () => gmos.fenetre.getByRole('dialog', { name: 'Atelier des tables' });

    test('la bande de couverture voit le trou, et le découpage le referme', async () => {
        await gmos.fenetre.getByRole('button', { name: /Atelier des tables/i }).click();
        await expect(atelier()).toBeVisible();

        /* Une table neuve naît découpée : sa couverture est complète par
           construction, et c'est déjà une garantie qui vaut d'être dite. */
        await expect(atelier()).toContainText('couverture complète');

        /* On creuse un trou : l'entrée 1 ne couvre plus que le 1. */
        await atelier().getByLabel('Borne haute de l’entrée 1').fill('1');
        await expect(atelier()).toContainText('1 sans entrée');

        await atelier().getByRole('button', { name: 'Découper' }).click();
        await expect(atelier()).toContainText('couverture complète');
    });

    test('une table écrite ici se retrouve dans le pupitre, et se tire', async () => {
        await atelier().getByPlaceholder('Titre de la table').fill('Essai de l’atelier');
        await atelier().getByPlaceholder('…ou un nouvel univers').fill(UNIVERS_JETABLE);
        await atelier().getByRole('button', { name: 'Enregistrer' }).click();

        /* La liste de gauche la montre : le pont a écrit, et le dossier se relit. */
        await expect(atelier().getByRole('button', { name: 'Essai de l’atelier' })).toBeVisible({ timeout: 10_000 });

        await atelier().getByRole('button', { name: 'Fermer l’atelier' }).click();
        await expect(atelier()).toBeHidden();

        await listes(gmos).first().selectOption(UNIVERS_JETABLE);
        await expect(listes(gmos).nth(1).locator('option')).toContainText(['Essai de l’atelier']);
    });

    test('et elle se supprime depuis l’atelier', async () => {
        await gmos.fenetre.getByRole('button', { name: /Atelier des tables/i }).click();
        await atelier().getByRole('button', { name: 'Essai de l’atelier' }).click();

        /* ⚠️ **Un seul écouteur, et posé juste avant le clic.** Un `once` armé
           « au cas où » ne se désarme pas : il reste en embuscade et c'est la
           confirmation suivante qu'il attrape, laissant la vraie sans réponse.
           *Un gestionnaire qui n'a rien attrapé n'est pas un gestionnaire
           inoffensif.* */
        gmos.fenetre.once('dialog', d => d.accept());
        await atelier().getByRole('button', { name: 'Supprimer' }).click();

        await expect(atelier().getByRole('button', { name: 'Essai de l’atelier' })).toBeHidden();
        await atelier().getByRole('button', { name: 'Fermer l’atelier' }).click();
    });
});
