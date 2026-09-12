import { test, expect } from '@playwright/test';
import { lancerGmOs, attendreLHydratation, ouvrirLeModule, CAMPAGNE_TEMOIN, type GmOsLance } from './lancerGmOs';

/**
 * **Chaque module s'ouvre, et rien ne casse en s'ouvrant.**
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LE FILET LE PLUS LARGE, ET POURQUOI IL PASSE EN PREMIER
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * 4 230 tests unitaires couvrent la logique de GM-OS. **Aucun ne monte un
 * module dans la vraie application.** Un composant qui lève à l'affichage — une
 * clé de traduction absente, un champ `undefined` sur une donnée fraîche, un
 * import circulaire — passe donc au travers de tout, et ne se découvre qu'en
 * cliquant. *C'est exactement ce que ce dépôt a payé le 2026-08-31, quand la
 * projection d'une fiche était cassée depuis avril et que personne ne le
 * savait.*
 *
 * Ce fichier ouvre **les modules de la barre latérale**, un par un,
 * et refuse la moindre exception. Il ne vérifie pas ce qu'ils font : il vérifie
 * qu'ils **existent, se montent et ne crient pas**. Les gestes propres à chaque
 * module vivent dans leurs fichiers respectifs.
 *
 * ⭐ **Un seul lancement pour tous.** Relancer l'application par
 * module coûterait trois minutes pour la même information — et la navigation
 * d'un module à l'autre est justement ce qu'un meneur fait en séance.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⚠️ CE QUE CE FICHIER NE PEUT PAS DIRE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Une instance d'essai n'a **ni média, ni clé d'API, ni corpus, et ses appareils
 * sont muets** (`GMOS_SANS_APPAREILS=1`). Music-OS s'ouvre donc sur une
 * bibliothèque vide, l'Oracle sans modèle, Light-OS sans pont. *Qu'un module
 * s'ouvre ne dit rien de ce qu'il fait quand il a de quoi travailler* — et ce
 * qui sort vraiment des enceintes ou des lampes reste hors de portée de tout
 * test, comme le dit la catégorie P6 du registre.
 */

/**
 * Les libellés exacts des boutons, relevés dans l'application.
 *
 * ⚠️ **Écrits en dur, et c'est voulu.** Les dériver de l'application les ferait
 * s'accorder avec elle quoi qu'elle devienne — un module renommé ou disparu ne
 * ferait alors plus rougir personne. *Une liste attendue n'a de valeur que si
 * elle peut contredire le code.*
 */
const LES_PANNEAUX = [
    'Tableau de Bord',
    'Journal de Jeu',
    'Forge',
    'Musique',
    'Effets Sonores',
    'Ambiances',
    'Voice-OS',
    'Favoris',
    'Nexus Wiki',
    'Cortex IA',
    'Combat-OS',
    'Dice-OS',
    'Galerie PNJ',
    'Cartographie',
    'Image-OS',
    'Horloge & Temps',
    'Light-OS',
    'Tables Aléatoires',
    'Navigateur Web',
    'Tableau Blanc',
] as const;

/**
 * **Le bruit qu'on accepte — nommé, et rien d'autre.**
 *
 * ⛔ Une garde qui laisse tout passer ressemble beaucoup à une garde qui marche.
 * Chaque ligne ici doit porter **pourquoi** elle est tolérée ; sans raison
 * écrite, elle n'a pas sa place, et le test doit rougir.
 */
const BRUIT_CONNU: readonly { motif: RegExp; pourquoi: string }[] = [
    {
        motif: /ResizeObserver loop completed with undelivered notifications/,
        pourquoi:
            "Avertissement de Chromium, pas une exception de l'application : un rappel de " +
            "ResizeObserver a redimensionné quelque chose, ce qui en a déclenché un autre. " +
            "Il n'interrompt rien et le rendu suivant le résorbe. Toute application qui " +
            "observe des conteneurs le produit.",
    },
];

function estDuBruitConnu(ligne: string): boolean {
    return BRUIT_CONNU.some(b => b.motif.test(ligne));
}

let gmos: GmOsLance;
/** Les exceptions de l'écran, collectées sur toute la traversée. */
const incidents: string[] = [];

test.beforeAll(async () => {
    /* Semé : un module qui s'ouvre sur une campagne vide n'exerce que ses états
       vides. Le témoin lui donne des PNJ, des scènes, un paquet et des joueurs. */
    gmos = await lancerGmOs({ semence: CAMPAGNE_TEMOIN });
    gmos.fenetre.on('pageerror', e => incidents.push(`[exception] ${e.message}`));
    gmos.fenetre.on('console', m => {
        if (m.type() === 'error') incidents.push(`[console] ${m.text().slice(0, 200)}`);
    });
    await attendreLHydratation(gmos);
});

test.afterAll(async () => { await gmos?.fermer(); });

test.describe('les modules de la barre latérale', () => {
    /*
      ⛔ Le bouton d'abord : s'il manque, le module est **inatteignable**, et
      c'est un défaut plus grave qu'un module qui s'affiche mal. Ce dépôt a
      trouvé quatre fois une « chaîne complète sans bouton au bout ».
    */
    test('ont tous leur bouton', async () => {
        for (const nom of LES_PANNEAUX) {
            await expect(
                gmos.fenetre.getByRole('button', { name: new RegExp(`^${nom}$`) }).first(),
                `le bouton « ${nom} » est introuvable`,
            ).toBeVisible();
        }
    });

    for (const nom of LES_PANNEAUX) {
        test(`« ${nom} » s'ouvre et affiche quelque chose`, async () => {
            await ouvrirLeModule(gmos, nom);

            /*
              On attend du contenu, pas un délai. Un module qui lève au montage
              laisse la zone principale vide : c'est ce vide-là qu'on refuse.
            */
            await expect.poll(
                () => gmos.fenetre.locator('main').last().innerText(),
                { timeout: 15_000, message: `« ${nom} » n'a rien affiché` },
            ).not.toBe('');
        });
    }

    /*
      ⛔ **LA MÉDIATHÈQUE N'EST PAS UN PANNEAU — c'est une surcouche modale.**
      Découvert en écrivant ce fichier : `fixed inset-0 z-[100]`, elle **couvre
      la barre latérale**, et tant qu'elle est ouverte plus aucun module n'est
      cliquable. Le test la traversait comme les autres et bloquait sur le
      module suivant. *Un module qu'on croit être un panneau et qui est un
      modal, ça ne se voit pas dans une liste de boutons.*
    */
    test('la Médiathèque s’ouvre en surcouche, et se referme', async () => {
        const surcouches = () => gmos.fenetre.locator('div.fixed.inset-0').filter({ hasText: 'MEDIA HUB' });

        await ouvrirLeModule(gmos, 'Médiathèque');
        await expect(surcouches().first()).toBeVisible({ timeout: 15_000 });

        /*
          ⚠️ Le bouton de fermeture s'intitule **« Désactiver l'Interface »** —
          voir le § 1 bis du registre. On le vise par ce libellé parce que c'est
          celui qui existe, pas parce qu'il est bon.
        */
        await gmos.fenetre.getByTitle("Désactiver l'Interface").click();
        await expect(surcouches()).toHaveCount(0, { timeout: 10_000 });

        /* Et la navigation repart : c'est ce que le blocage empêchait. */
        await ouvrirLeModule(gmos, 'Dice-OS');
        await expect.poll(() => gmos.fenetre.locator('main').last().innerText())
            .toContain('DICE-OS');
    });

    /*
      ⭐ **L'assertion qui vaut pour toutes les autres.** Une exception au
      montage n'empêche pas toujours l'affichage — React remonte un arbre
      partiel, et l'écran paraît normal. Sans cette vérification, la traversée
      entière pourrait passer au vert sur une application qui crie.
    */
    test('la traversée n’a produit aucune exception', () => {
        const reels = incidents.filter(l => !estDuBruitConnu(l));

        expect(reels, `l'écran a crié pendant la traversée :\n${reels.join('\n')}`)
            .toEqual([]);
    });
});
