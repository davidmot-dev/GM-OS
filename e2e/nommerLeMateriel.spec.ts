import { test, expect } from '@playwright/test';
import { lancerGmOs, attendreLHydratation, type GmOsLance } from './lancerGmOs';

/**
 * **Donner un nom à un moniteur, et le retrouver.**
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⛔ LE GESTE QUE TRENTE-SIX TESTS N'ONT PAS VU
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Le 2026-09-12, les alias du matériel sont passés à une clé stable. L'écriture
 * a suivi, **la lecture des champs de saisie non** : ils interrogeaient toujours
 * `aliases[deviceId]` en direct. Un champ contrôlé dont la valeur ne change
 * jamais **refuse la frappe** — David, dans l'heure : *« je n'arrive pas à
 * donner un nom au moniteur »*.
 *
 * ⭐ Les trente-six tests écrits ce jour-là éprouvaient la signature, la
 * migration, la résolution — *la mécanique interne*. Pas une fois **le geste**.
 * Celui-ci tape dans le vrai champ, du vrai écran des Réglages.
 *
 * ⚠️ Il ne vérifie pas que le nom survit à un redémarrage : le profil d'essai
 * est jetable, et une instance qui repartirait du même profil ne prouverait rien
 * de plus que le test unitaire. *La persistance se garde là où elle vit.*
 */

let gmos: GmOsLance;

const champDuMoniteur = () => gmos.fenetre.getByPlaceholder(/Assigner un alias \(ex: TV Salon\)/).first();
const champDeLaSortie = () => gmos.fenetre.getByPlaceholder(/Assigner un alias \(ex: Enceintes MJ\)/).first();

test.beforeAll(async () => {
    gmos = await lancerGmOs();
    await attendreLHydratation(gmos);
    await gmos.fenetre.getByTitle(/Paramètres de l’OS|Paramètres de l'OS/).click();
});

test.afterAll(async () => { await gmos?.fermer(); });

test.describe('⛔ nommer un moniteur', () => {
    /*
      **LE TEST DE LA RÉGRESSION.** Un champ contrôlé qui n'affiche pas ce qu'on
      y tape est indiscernable d'un champ en lecture seule : rien ne plante, et
      rien ne se passe.
    */
    test('le champ accepte la frappe et la garde', async () => {
        const champ = champDuMoniteur();
        await expect(champ, 'aucun moniteur listé dans les Réglages').toBeVisible();

        await champ.fill('Écran de la table');

        await expect(champ, 'le champ a refusé la frappe').toHaveValue('Écran de la table');
    });

    /*
      ⭐ Et le nom doit **tenir** quand on regarde ailleurs puis qu'on revient :
      c'est là que se voit un alias écrit sous une clé qu'on ne relit pas.
    */
    test('et il le garde après un aller-retour dans les Réglages', async () => {
        /*
          ⚠️ **On ferme par le bouton, et pas par Échap — constaté en écrivant ce
          test** : les Paramètres n'écoutent pas Échap, et le modal reste alors à
          l'écran en avalant tous les clics. C'est le défaut de la Médiathèque,
          corrigé le 12/09 au § 47, sur un autre écran. *Une famille de défauts ne
          se referme pas écran par écran.* Consigné au § 1 bis.
        */
        await gmos.fenetre.getByLabel(/Fermer les paramètres/i).click();
        await gmos.fenetre.getByTitle(/Paramètres de l’OS|Paramètres de l'OS/).click();

        await expect(champDuMoniteur()).toHaveValue('Écran de la table');
    });

    test('effacer le nom le rend vraiment vide', async () => {
        const champ = champDuMoniteur();

        await champ.fill('');

        await expect(champ).toHaveValue('');
    });
});

test.describe('nommer une sortie audio', () => {
    /*
      ⚠️ Le même défaut frappait les deux champs — *une seule ligne changée, deux
      écrans cassés.* Celui-ci existe donc pour que la garde ne tienne pas qu'à
      moitié.
    */
    test('le champ accepte la frappe et la garde', async () => {
        const champ = champDeLaSortie();
        test.skip(await champ.count() === 0, 'aucune sortie audio sur cette machine d’essai');

        await champ.fill('Enceintes du fond');

        await expect(champ, 'le champ a refusé la frappe').toHaveValue('Enceintes du fond');
    });
});
