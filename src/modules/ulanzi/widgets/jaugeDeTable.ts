import { LARGEUR, type RectanglePlein } from './defileDesQuarts';
import { barreDeSegments, nomPourLaMatrice, CARACTERES_TENUS } from './compteARebours';

/**
 * **Les réserves de table, déclarées par les pilotes — étape C du § 14.**
 *
 * L'Impulsion et la Menace de Dune, et tout ce qu'un pilote déclarera ensuite.
 * **C'est l'étape qui démontre la thèse du § 12** : si ajouter un jeu coûte zéro
 * ligne de code, la librairie est juste ; s'il faut écrire quoi que ce soit,
 * elle ne l'est pas. Rien ici ne connaît Dune.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * DEUX NATURES DE RÉSERVE, ET LE DESSIN LE DIT
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * `RessourceDeTable.max` est **facultatif, et c'est une différence de nature,
 * pas un oubli** : l'Impulsion va de 0 à 6, la Menace n'a pas de plafond.
 *
 * - **Avec un plafond**, on dessine la barre de segments — le même vocabulaire
 *   que les horloges de tension, et l'on compte les cases.
 * - **Sans plafond**, il n'y a **aucune proportion à dessiner**. On montre le
 *   nombre à côté du nom, et pas de barre. *Inventer un plafond pour avoir une
 *   jolie jauge serait un mensonge de dessin* — et c'est exactement ce que le
 *   modèle des réserves refuse en laissant `max` absent plutôt qu'en posant un
 *   très grand nombre.
 */

/** La couleur d'une réserve, quand le pilote n'en déclare pas. */
export const COULEUR_DE_LA_RESERVE = '#C77DFF';
/** Une réserve à son minimum : il n'y a plus rien à dépenser. */
export const COULEUR_A_SEC = '#FF1744';

/** Ce que l'afficheur doit connaître d'une réserve. Plus étroit que le modèle. */
export interface ReserveAAfficher {
    id: string;
    nom: string;
    valeur: number;
    min: number;
    /** **Absent = sans plafond.** Voir l'en-tête : c'est une différence de nature. */
    max?: number;
}

export interface CompositionDeLaReserve {
    text: string;
    color: string;
    center: true;
    noScroll: true;
    draw: RectanglePlein[];
}

/**
 * `NOM 12` — le nom raccourci pour que la valeur tienne à côté.
 *
 * Employé **seulement** pour les réserves sans plafond, où le nombre est la
 * seule information : sans barre à compter, un nom seul ne dirait rien.
 */
export function nomEtValeur(nom: string, valeur: number): string {
    const chiffres = String(Math.round(valeur));
    // Un espace entre les deux, et ce qui reste pour le nom.
    const place = Math.max(1, CARACTERES_TENUS - chiffres.length - 1);
    return `${nomPourLaMatrice(nom, place)} ${chiffres}`;
}

/**
 * La réserve, traduite en ce que l'afficheur doit montrer.
 *
 * **Au minimum, elle passe au rouge.** Une réserve à sec change ce qu'on a le
 * droit de faire — chez Dune, à zéro d'Impulsion l'achat d'un dé se paie en
 * Menace. C'est la seule chose que la table doit voir de loin.
 */
export function composerJaugeDeTable(
    reserve: ReserveAAfficher,
    couleurChoisie?: string,
): CompositionDeLaReserve {
    const valeur = Math.round(reserve.valeur);
    const aSec = valeur <= reserve.min;
    // À sec, la couleur choisie s'efface : c'est la seule chose que la table
    // doit voir de loin, et la rendre réglable permettrait de la rendre muette.
    const couleur = aSec ? COULEUR_A_SEC : (couleurChoisie || COULEUR_DE_LA_RESERVE);

    if (reserve.max === undefined) {
        return {
            text: nomEtValeur(reserve.nom, valeur),
            color: couleur,
            center: true,
            noScroll: true,
            draw: [],
        };
    }

    /*
      La barre compte les crans **au-dessus du minimum** : une réserve qui va de
      2 à 6 en a quatre, pas six. Prendre `max` pour total ferait paraître pleine
      une réserve à son plancher.
    */
    const total = Math.max(0, reserve.max - reserve.min);
    return {
        text: nomPourLaMatrice(reserve.nom),
        color: couleur,
        center: true,
        noScroll: true,
        draw: barreDeSegments(Math.max(0, valeur - reserve.min), total, couleur),
    };
}

/** La largeur de la matrice, réexportée pour les tests de débordement. */
export const LARGEUR_DE_LA_MATRICE = LARGEUR;
