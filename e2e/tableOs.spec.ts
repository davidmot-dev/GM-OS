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

    /**
     * ⭐ **Le collage, de bout en bout.** Ce que les essais unitaires ne peuvent
     * pas voir : que l'aperçu chiffre avant qu'on applique, que l'import
     * REMPLACE bien les entrées, et que la bande de couverture relit derrière —
     * *c'est cette seconde lecture qui autorise à coller du texte brut.*
     *
     * ⚠️ Seul le chemin **déterministe** est éprouvé ici. « Ranger par l'IA »
     * demande un modèle, et une instance d'essai n'en a pas : *un test qui
     * prétendrait le couvrir donnerait une couverture décorative.*
     */
    test('coller une table de manuel la range, et la bande la relit', async () => {
        /* L'essai précédent a refermé l'atelier : on le rouvre sur une table
           neuve. *Un essai qui suppose l'état laissé par son voisin casse le
           jour où l'on réordonne le fichier.* */
        await gmos.fenetre.getByRole('button', { name: /Atelier des tables/i }).click();
        await expect(atelier()).toBeVisible();

        await atelier().getByRole('button', { name: 'Importer' }).click();
        const importeur = gmos.fenetre.getByRole('dialog', { name: 'Importer une table' });
        await expect(importeur).toBeVisible();

        await importeur.getByLabel('Texte à importer').fill([
            'Table des avaries',
            '1-5   Rien de notable',
            '6-12  Un bruit dans la coursive',
            '13-17 Une ombre passe',
            '18-19 Le courant saute',
            '20    Elle est là',
        ].join(String.fromCharCode(10)));

        /* L'aperçu compte avant d'appliquer — et il dit ce qu'il n'a pas su
           rattacher, ici le titre de la table. */
        await expect(importeur).toContainText('5 entrée(s) lue(s)');
        await expect(importeur).toContainText('1 ligne(s) non rattachée(s)');

        gmos.fenetre.once('dialog', d => d.accept());
        await importeur.getByRole('button', { name: 'Ranger tel quel' }).click();
        await expect(importeur).toBeHidden();

        /*
          ⭐ **La relecture, et ce qu'elle dit vraiment.** Les bornes collées vont
          jusqu'à 20, sur le `1d6` d'une table neuve. Il n'y a pourtant **aucun
          trou** — les six valeurs sont couvertes par les deux premières entrées.
          Ce que la bande signale, c'est que la plupart des entrées sont **hors
          de portée** : c'est ça, le symptôme d'une table collée sur le mauvais
          dé. *J'attendais « sans entrée » ; l'écran avait raison et mon essai
          avait tort.*
        */
        await expect(atelier()).toContainText('6 valeurs tirables');
        await expect(atelier()).toContainText('entrée(s) sur 5 n’y sont atteignables');

        /* Le bon dé, et la remarque disparaît. */
        await atelier().getByTitle('Le dé de cette table').selectOption('1d20');
        await expect(atelier()).toContainText('couverture complète');
        await expect(atelier()).not.toContainText('atteignables qu’avec un modificateur');

        /* Et on le referme, pour laisser l'écran comme on l'a trouvé. */
        await atelier().getByRole('button', { name: 'Fermer l’atelier' }).click();
        await expect(atelier()).toBeHidden();
    });

    /**
     * ⛔ **Le trou que David a désigné**, en demandant ce que l'import acceptait :
     * *« est-ce que je peux importer des fichiers JSON ? »*. Non — et le prompt
     * livré avec GM-OS fait justement produire du JSON à ChatGPT. *Un import qui
     * refuse le format que l'application elle-même écrit.*
     *
     * Mesuré avant d'être comblé : un JSON collé donnait huit entrées de
     * charabia — `11-15 {`, `16-24 "name": …`.
     */
    test('une table JSON collée est reconnue, avec son nom et son dé', async () => {
        await gmos.fenetre.getByRole('button', { name: /Atelier des tables/i }).click();

        /* ⚠️ **Sur une table NEUVE.** L'atelier garde en mémoire celle qu'on y a
           laissée, et le nom importé ne remplace jamais un nom déjà tapé — c'est
           voulu, et c'est ce qui a fait rougir cet essai la première fois. */
        await atelier().getByRole('button', { name: 'Nouvelle table' }).click();

        await atelier().getByRole('button', { name: 'Importer' }).click();
        const importeur = gmos.fenetre.getByRole('dialog', { name: 'Importer une table' });

        await importeur.getByLabel('Texte à importer').fill(JSON.stringify({
            name: 'Avaries mineures',
            dice: 'd66',
            entries: [
                { min: 11, max: 40, title: 'Fuite', description: 'Un sifflement.' },
                { min: 41, max: 66, title: 'Court-circuit', description: 'Le noir.' },
            ],
        }, null, 4));

        await expect(importeur).toContainText('Table JSON reconnue');
        await expect(importeur).toContainText('2 entrée(s) lue(s)');
        await expect(importeur).toContainText('« Avaries mineures »');
        await expect(importeur).toContainText('dé d66');

        gmos.fenetre.once('dialog', d => d.accept());
        await importeur.getByRole('button', { name: 'Ranger tel quel' }).click();
        await expect(importeur).toBeHidden();

        /* Le nom ET le dé sont arrivés : la table est complète sans qu'on ait
           rien retapé, et la bande le confirme. */
        await expect(atelier().getByPlaceholder('Titre de la table')).toHaveValue('Avaries mineures');
        await expect(atelier()).toContainText('36 valeurs tirables');
        await expect(atelier()).toContainText('couverture complète');

        await atelier().getByRole('button', { name: 'Fermer l’atelier' }).click();
        await expect(atelier()).toBeHidden();
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
