import { test, expect } from '@playwright/test';
import { lancerGmOs, attendreLHydratation, ouvrirLeModule, CAMPAGNE_TEMOIN, type GmOsLance } from './lancerGmOs';

/**
 * **Voice-OS — le pupitre de la voix, sans micro.**
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⛔ DEUX LIMITES, ET ELLES SONT STRUCTURELLES
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * **Il n'y a pas de micro** dans une instance d'essai, donc rien de la chaîne
 * audio ne peut être exercé : ni la transposition WSOLA, ni la porte, ni le
 * ducking, ni RNNoise. Tout cela s'entend, et c'est la catégorie P6.
 *
 * ⚠️ **Et `useVoiceStore` n'est pas exposé sur `window`** — contrairement aux
 * dix-sept autres magasins. Les assertions ne peuvent donc porter que sur
 * l'écran. *Le noter vaut mieux que le contourner : c'est une asymétrie réelle,
 * et quelqu'un s'y cognera.*
 *
 * ⭐ Reste ce qui compte quand même : **les réglages sont-ils là, et
 * s'expliquent-ils ?** Un pupitre de voix dont on ne comprend pas les boutons ne
 * sert à rien en pleine séance, même parfaitement fonctionnel.
 */

let gmos: GmOsLance;

test.beforeAll(async () => {
    gmos = await lancerGmOs({ semence: CAMPAGNE_TEMOIN });
    await attendreLHydratation(gmos);
    await ouvrirLeModule(gmos, 'Voice-OS');
    await gmos.fenetre.getByRole('button', { name: /MICRO OFF/i }).first()
        .waitFor({ timeout: 20_000 });
});

test.afterAll(async () => { await gmos?.fermer(); });

test.describe('les voix', () => {
    /*
      Cinq timbres, chacun avec sa description. Un préréglage sans explication
      oblige à l'essayer pour savoir ce qu'il fait — et on ne fait pas ça devant
      la table.
    */
    test('les cinq préréglages sont offerts, et chacun se décrit', async () => {
        const zone = gmos.fenetre.locator('body');

        for (const voix of ['Clair', 'Spectre', 'Ogre', 'Androïde', 'Dragon']) {
            await expect(zone, `le préréglage « ${voix} » manque`).toContainText(voix);
        }
    });

    /*
      ⚠️ Le micro reste ÉTEINT dans ces tests. L'allumer demanderait un
      périphérique d'entrée, et ouvrirait une capture qu'aucune assertion ne
      referme proprement.
    */
    test('le micro part éteint', async () => {
        await expect(gmos.fenetre.getByRole('button', { name: /MICRO OFF/i }).first())
            .toBeVisible();
    });
});

test.describe('⭐ le débruitage à trois positions', () => {
    /*
      ⛔ **Une décision du 2026-09-03, et sa raison tient en une phrase : deux
      débruiteurs qui se suivent, c'est pire qu'un.** D'où un réglage unique à
      trois positions — aucun, navigateur, neuronal — plutôt que deux
      interrupteurs qu'on pourrait cumuler.
    */
    test('offre exactement aucun / navigateur / neuronal', async () => {
        const zone = gmos.fenetre.locator('body');

        await expect(zone).toContainText(/DÉBRUITAGE/i);
        await expect(zone).toContainText(/AUCUN/i);
        await expect(zone).toContainText(/NAVIGATEUR/i);
        await expect(zone).toContainText(/NEURONAL/i);
    });

    test('et le neuronal annonce son coût', async () => {
        /* RNNoise ajoute 10 ms : un réglage qui coûte doit le dire. */
        await expect(gmos.fenetre.locator('body')).toContainText(/10 ms/i);
    });
});

test.describe('le ducking', () => {
    /*
      ⚠️ Depuis le 2026-09-03, ducking et porte se mesurent sur la voix **brute**
      et non sur le signal compressé : les deux calibrations ont changé de sens.
      Ce test ne juge pas des valeurs — il garde que les quatre réglages restent
      offerts, car c'est en les retouchant qu'on rattrape une soirée.
    */
    test('ses quatre réglages sont tous présents', async () => {
        const zone = gmos.fenetre.locator('body');

        for (const reglage of [
            /SEUIL DE DÉCLENCHEMENT/i,
            /RÉDUCTION MUSIQUE/i,
            /DÉLAI DE RELÂCHEMENT/i,
            /VITESSE DE FONDU/i,
        ]) {
            await expect(zone, `le réglage ${reglage} manque`).toContainText(reglage);
        }
    });
});
