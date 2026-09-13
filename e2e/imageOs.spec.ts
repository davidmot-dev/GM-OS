import { test, expect } from '@playwright/test';
import { lancerGmOs, attendreLHydratation, ouvrirLeModule, CAMPAGNE_TEMOIN, type GmOsLance } from './lancerGmOs';

/**
 * **Image-OS — la régie visuelle, et surtout : sur QUEL écran.**
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QUI EST TESTABLE SANS UNE SEULE IMAGE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Le profil d'essai n'a aucun média : rien ne peut donc être projeté, et
 * *qu'une image s'affiche vraiment à la table* restera hors de portée.
 *
 * ⭐ **Mais le choix de la cible, lui, est entièrement testable — et c'est la
 * décision la plus lourde de conséquences du module.** Se tromper d'écran, ce
 * n'est pas ne rien montrer : c'est montrer à la table ce qui était pour le
 * meneur. *Une projection mal dirigée ne se rattrape pas : elle a déjà été vue.*
 *
 * ⚠️ Et l'état vide compte aussi. Une médiathèque sans média doit **le dire** ;
 * un écran blanc à cet endroit se lit comme un module cassé.
 */

async function image(gmos: GmOsLance) {
    return gmos.fenetre.evaluate(() => {
        const i = (window as never as {
            useImageStore: { getState: () => Record<string, unknown> };
        }).useImageStore.getState();
        return {
            medias: ((i.mediaList as unknown[]) ?? []).length,
            cible: i.projectionTarget as string,
            dossiers: ((i.folders as unknown[]) ?? []).length,
            ecrans: ((i.displays as unknown[]) ?? []).length,
            diaporamas: ((i.diaporamas as unknown[]) ?? []).length,
        };
    });
}

let gmos: GmOsLance;

test.beforeAll(async () => {
    gmos = await lancerGmOs({ semence: CAMPAGNE_TEMOIN });
    await attendreLHydratation(gmos);
    await ouvrirLeModule(gmos, 'Image-OS');
    await gmos.fenetre.getByRole('button', { name: /^Player Hub$/ }).first()
        .waitFor({ timeout: 20_000 });
});

test.afterAll(async () => { await gmos?.fermer(); });

test.describe('la régie', () => {
    test('annonce une médiathèque vide plutôt que rien', async () => {
        expect((await image(gmos)).medias, 'un profil d’essai n’a aucun média').toBe(0);

        await expect(gmos.fenetre.locator('body')).toContainText(/0 ITEM/i);
    });

    test('propose le Player Hub comme cible', async () => {
        await expect(gmos.fenetre.getByRole('button', { name: /^Player Hub$/ }).first())
            .toBeVisible();
    });
});

test.describe('⭐ choisir l’écran', () => {
    /*
      ⛔ **Le geste dont l'erreur ne se rattrape pas.** Envoyer au mauvais écran,
      c'est montrer aux joueurs ce qui était pour le meneur — et c'est vu avant
      qu'on ait pu cliquer ailleurs.
    */
    test('changer de cible atteint le magasin', async () => {
        const depart = (await image(gmos)).cible;

        /*
          ⭐ **Le libellé d'un écran a changé le 2026-09-12, et en mieux.**

          Il était « Écran 2528732444 » — l'identifiant système brut — parce que
          la liste des écrans n'était remplie **que par l'écran des Réglages** :
          partout ailleurs, `getDisplayLabel` n'avait rien à quoi se raccrocher.
          Le démarrage la recense désormais, et le nom devient « Moniteur 2 » —
          ou celui que le meneur a donné.

          On accepte les trois formes : *ce test garde le geste de projection,
          pas le vocabulaire.*
        */
        const autre = gmos.fenetre
            .getByRole('button', { name: /^(Écran \d+|Moniteur \d+)$/ }).first();
        test.skip(await autre.count() === 0, 'aucun second écran détecté sur cette machine');

        await autre.click();
        await expect.poll(async () => (await image(gmos)).cible, { timeout: 10_000 })
            .not.toBe(depart);

        /* Et l'on revient au Hub : le geste doit être réversible. */
        await gmos.fenetre.getByRole('button', { name: /^Player Hub$/ }).first().click();
        await expect.poll(async () => (await image(gmos)).cible, { timeout: 10_000 })
            .toBe(depart);
    });
});

test.describe('ranger les médias', () => {
    /*
      Un dossier est le seul rangement d'Image-OS. S'il ne se crée pas, une
      médiathèque de plusieurs centaines d'images devient impraticable — et ça
      ne se découvre qu'une fois qu'elle est pleine.
    */
    test('un dossier se crée', async () => {
        const avant = (await image(gmos)).dossiers;

        await gmos.fenetre.getByTitle('Nouveau dossier').first().click();

        /*
          ⚠️ **Le nom se demande dans un modal interne** (`gmPrompt`), pas dans
          une invite du navigateur. Ma première version cliquait puis attendait :
          rien ne se créait, et le test accusait le module. *Un geste en deux
          temps testé en un seul temps échoue toujours, et pour la mauvaise
          raison.*
        */
        const modal = gmos.fenetre.locator('div.fixed.inset-0').last();
        await modal.locator('input').first().fill('Cartes de la station');
        await modal.getByRole('button', { name: /^(Confirm|Confirmer|OK|Valider)$/i }).last().click();

        await expect.poll(async () => (await image(gmos)).dossiers, { timeout: 10_000 })
            .toBeGreaterThan(avant);

        await expect(gmos.fenetre.locator('body')).toContainText('Cartes de la station');
    });
});


test.describe('⭐ les diaporamas', () => {
    /*
      Demandés par David le 2026-09-13 : *« créer des diaporamas avec plusieurs
      images et un fondu entre chacune d'entre elles, [puis] appeler ce
      diaporama dans un Storyboard »*.

      ⚠️ **Ce que ce fichier ne peut pas dire** : qu'un diaporama **tourne**.
      Le profil d'essai n'a aucun média, donc aucun diaporama ne peut dépasser
      zéro image. L'horloge, la boucle, la cadence relue à chaque tour et ce qui
      l'arrête vivent dans `src/modules/image/diaporamaQuiTourne.test.ts`, avec
      des minuteurs feints. *Ici on garde le geste : créer, voir, et se faire
      refuser un lancement impossible.*
    */
    test('un diaporama se crée et apparaît', async () => {
        const avant = (await image(gmos)).diaporamas;

        await gmos.fenetre.getByText('Diaporamas', { exact: true }).first().click();
        await gmos.fenetre.getByTitle('Nouveau diaporama').first().click();

        /* Même piège que le dossier plus haut : le nom se demande dans un modal
           interne, et un geste en deux temps testé en un seul échoue toujours. */
        const modal = gmos.fenetre.locator('div.fixed.inset-0').last();
        await modal.locator('input').first().fill('Le voyage en train');
        await modal.getByRole('button', { name: /^(Confirm|Confirmer|OK|Valider)$/i }).last().click();

        await expect.poll(async () => (await image(gmos)).diaporamas, { timeout: 10_000 })
            .toBeGreaterThan(avant);

        await expect(gmos.fenetre.locator('body')).toContainText('Le voyage en train');
    });

    /*
      ⛔ **La règle des deux images, à l'écran.** Une seule image ne tourne pas :
      la reprojeter en boucle rejouerait son fondu d'entrée toutes les six
      secondes, soit *un décor fixe qui clignote*. Le bouton doit donc refuser,
      et **le dire** — un bouton actif qui ne fait rien est pire.
    */
    test('et son lancement est refusé tant qu’il n’a pas deux images', async () => {
        const lancer = gmos.fenetre.getByRole('button', { name: /^Lancer sur / }).first();

        await expect(lancer).toBeVisible();
        await expect(lancer).toBeDisabled();
        await expect(lancer).toHaveAttribute('title', /au moins deux images/i);
    });
});
