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
          ✅ **Échap ferme les Paramètres depuis le 2026-09-13** — la ligne du
          § 1 bis est sortie par le haut, et la famille entière avec elle : une
          trentaine de boîtes ne répondaient à rien. Voir
          `e2e/echapFermeLesSurcouches.spec.ts`.

          ⭐ **On garde le bouton ici, exprès.** C'est l'aller-retour du meneur
          qu'on éprouve, et il passe par le bouton visible ; Échap a son propre
          test. *Ce fichier a déjà payé la leçon inverse : il contournait le
          défaut en le décrivant, et n'a jamais rougi pour autant.*
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


/**
 * **Échap ferme les Paramètres.**
 *
 * ⚠️ **Ces trois tests vivaient dans leur propre fichier, et le fichier a dû
 * disparaître.** Écrit le 2026-09-13, il faisait la **trente-et-unième**
 * application Electron d'une même exécution — et à partir de là, un rendu
 * tombait (`Target crashed`), **jamais le même**. Quatre exécutions avec lui :
 * quatre victimes différentes, dont une **avant** lui dans l'ordre des fichiers.
 * La même suite sans lui : 168 verts, deux fois, comme la base de la veille.
 *
 * ⭐ *Le plafond n'est pas le nombre de tests, c'est le nombre de fichiers* :
 * un fichier = une application complète. Un test qui a besoin d'un écran déjà
 * ouvert ailleurs se range auprès de lui.
 *
 * Ils sont donc ici, où les Paramètres sont déjà ouverts — et le sujet est le
 * même écran.
 */
test.describe('⛔ la boîte dont on ne sortait qu’au bouton', () => {
    /*
      David, le 2026-09-12 : *« Échap ne ferme pas les Paramètres, et le modal
      avale alors tous les clics »*. La ligne a été différée avec son motif —
      **combien d'écrans étaient dans ce cas n'avait pas été compté**. Comptés
      le 13/09 : une trentaine, tous servis par le même `ModalProvider`.

      ⭐ Et le constat était **déjà dans ce fichier**, en commentaire, vingt
      lignes plus haut : *un test qui contourne un défaut le documente sans
      jamais le signaler.*
    */
    test('Échap ferme les Paramètres', async () => {
        /*
          Ils sont ouverts depuis le `beforeAll` et le sont restés : on ne les
          rouvre pas. **Le bouton de la barre latérale est sous le modal** —
          Playwright refuse ce clic en disant *`intercepts pointer events`*, ce
          qui est la phrase de David en langage d'outil : *« le modal avale
          alors tous les clics »*.

          ⚠️ Et la frappe part d'un **champ de saisie** — les tests du dessus
          viennent d'y taper. C'est le cas qui a fait écarter la règle des deux
          frappes : Échap doit fermer dès la première.
        */
        await expect(
            gmos.fenetre.getByLabel(/Fermer les paramètres/i),
            'les Paramètres n’étaient pas ouverts — cet enchaînement part de là',
        ).toBeVisible();

        await gmos.fenetre.keyboard.press('Escape');

        await expect(
            gmos.fenetre.getByLabel(/Fermer les paramètres/i),
            'la boîte est restée à l’écran',
        ).toBeHidden();
    });

    /*
      **Et l'application redevient cliquable** — c'est la seconde moitié de ce
      que David a signalé : *« le modal avale alors tous les clics »*. Une boîte
      qui disparaîtrait en laissant son fond en place ne vaudrait pas mieux.
    */
    test('et la barre latérale redevient cliquable', async () => {
        /*
          ⚠️ **Un vrai clic, pas un `toBeEnabled`.** Un bouton peut être actif et
          inatteignable : c'est exactement l'état décrit par David. Playwright
          refuse un clic intercepté par une surcouche — c'est donc le clic, et
          lui seul, qui prouve que le fond n'avale plus rien.
        */
        await gmos.fenetre.getByTitle(/Paramètres de l’OS|Paramètres de l'OS/).click();
        await expect(gmos.fenetre.getByLabel(/Fermer les paramètres/i)).toBeVisible();
    });

    /*
      ⭐ **Deux fois de suite.** L'inscription se retire au démontage ; si elle
      restait, la seconde ouverture trouverait deux écouteurs — et le registre
      cesserait de dire qui est au-dessus. *Un écouteur qui ne se retire pas ne
      se voit qu'à la deuxième fois.*
    */
    test('et ça tient à la deuxième ouverture', async () => {
        // Les Paramètres sont rouverts par le test précédent : on les referme.
        await gmos.fenetre.keyboard.press('Escape');

        await expect(gmos.fenetre.getByLabel(/Fermer les paramètres/i)).toBeHidden();
    });
});
