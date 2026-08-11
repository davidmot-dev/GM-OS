/**
 * De quoi un jet se compose — le chaînon manquant entre la fiche et les dés.
 *
 * **Le mur qu'il abat.** Un pilote savait dire « 2d20, compte les réussites,
 * seuil 8 ». Mais chez Dune le seuil n'est pas 8 : il vaut **une compétence plus
 * un principe**, choisis test par test, de 8 à 16. `successThreshold` étant un
 * nombre fixe, on y inscrivait le minimum — et lancer avec cette valeur
 * sous-estimait systématiquement le personnage, sans que rien ne le dise.
 *
 * Le pilote ne pouvait pas mieux faire : rien, dans son modèle, ne reliait un
 * jet aux **champs de la fiche**. Cliquer sur « Combat » ne suffisait pas — il
 * fallait aussi savoir quel Principe le joueur invoque, et que les deux
 * s'additionnent.
 *
 * **Ce que le descripteur ajoute, et rien de plus** : la liste des composantes
 * que le joueur choisit, la façon dont elles forment le seuil, et le sens de la
 * comparaison. Il ne décrit ni les modificateurs de situation, ni les cas
 * particuliers — ceux-là restent dans les fiches de règles, que le meneur lit.
 * L'outil calcule ce qui est mécanique ; il n'arbitre pas.
 */

/** Un choix que le joueur fait sur sa fiche au moment de lancer. */
export interface ComposanteDeJet {
    /** Identifiant de la composante — `competence`, `principe`, `attribut`. */
    id: string;
    label: string;
    /**
     * Section de la fiche où choisir. Le joueur retient **un** champ de cette
     * section, et c'est sa valeur qui entre dans le calcul.
     */
    sectionId: string;
}

export type SensDuJet = 'sous-ou-egal' | 'superieur-ou-egal';

export interface DescripteurDeJet {
    /**
     * Composantes additionnées pour former le seuil. Chez Dune : une compétence
     * et un principe. Chez un jeu à compétence seule : une seule composante.
     */
    seuil: ComposanteDeJet[];
    /**
     * Réserve de dés : combien on en lance de base, jusqu'à combien, et à
     * combien de faces.
     *
     * `cout` donne le prix de chaque dé supplémentaire, dans l'ordre — chez
     * Dune, un, deux puis trois points. Le prix n'est pas constant, donc un
     * seul nombre n'aurait pas suffi. `ressource` désigne la réserve de table
     * qui paie ; sans elle, les dés sont gratuits et le panneau ne demande
     * rien.
     */
    reserve: { base: number; max: number; faces: number; cout?: number[]; ressource?: string };
    /** Chaque dé est-il une réussite en dessous ou au-dessus du seuil ? */
    sens: SensDuJet;
    /** Un dé à cette valeur ou en deçà compte double. Chez Dune, le 1 naturel. */
    critique?: number;
    /** Un dé à cette valeur ou au-delà déclenche une complication. Chez Dune, le 20. */
    complication?: number;
    /** Bornes de la difficulté que le meneur fixe, et sa valeur usuelle. */
    difficulte: { min: number; max: number; defaut: number };
}

/** Ce que le joueur a retenu sur sa fiche pour ce jet précis. */
export interface ChoixDuJoueur {
    /** Composante → identifiant du champ retenu. `{ competence: 'combat' }`. */
    champs: Record<string, string>;
    /** Dés supplémentaires achetés, au-delà de la réserve de base. */
    desSupplementaires?: number;
    /** Difficulté fixée par le meneur. */
    difficulte?: number;
    /**
     * Valeur sous laquelle un dé compte double, quand elle diffère du critique
     * ordinaire — chez Dune, la compétence seule avec la spécialisation.
     */
    critiqueEtendu?: number;
}

/** Un jet prêt à partir, et de quoi expliquer d'où il sort. */
export interface JetPrepare {
    seuil: number;
    /** Le détail du seuil, pour l'afficher : `[{ label: 'Combat', valeur: 6 }, …]`. */
    composantes: { label: string; champ: string; valeur: number }[];
    nombreDeDes: number;
    /** Dés effectivement achetés, plafond appliqué. */
    desAchetes: number;
    /**
     * Ce que ces dés coûtent, et sur quelle réserve de table.
     *
     * Le coût est **annoncé, jamais prélevé ici** : cette fonction est pure et
     * ne connaît pas l'état de la table. C'est l'appelant qui dépense, et
     * seulement s'il lance.
     */
    cout: { total: number; ressource?: string };
    faces: number;
    sens: SensDuJet;
    doubleSous: number;
    difficulte: number;
    /**
     * Ce qui n'a pas pu être résolu.
     *
     * **Jamais une exception.** Un champ absent de la fiche est une erreur de
     * configuration, pas une raison d'empêcher un joueur de lancer en pleine
     * partie. On lance avec ce qu'on a, et on dit ce qui manquait — l'inverse
     * de la jauge à zéro qui se tait.
     */
    avertissements: string[];
}

/** Le nombre lu sur la fiche, ou zéro si le champ n'y est pas. */
function valeurDuChamp(valeurs: Record<string, unknown>, champ: string): number | null {
    const brut = valeurs[champ];
    if (brut === undefined || brut === null || brut === '') return null;
    const n = typeof brut === 'number' ? brut : Number(brut);
    return Number.isFinite(n) ? n : null;
}

/**
 * Compose un jet à partir du descripteur, de la fiche et des choix du joueur.
 *
 * Fonction pure : elle ne lance aucun dé et ne lit aucun état global. C'est ce
 * qui la rend vérifiable — et c'est `DiceEngine` qui lance ensuite, avec les
 * paramètres qu'elle rend.
 */
export function preparerLeJet(
    descripteur: DescripteurDeJet,
    valeursDeLaFiche: Record<string, unknown>,
    choix: ChoixDuJoueur,
): JetPrepare {
    const avertissements: string[] = [];
    const composantes: JetPrepare['composantes'] = [];
    let seuil = 0;

    for (const composante of descripteur.seuil) {
        const champ = choix.champs[composante.id];
        if (!champ) {
            avertissements.push(`${composante.label} : aucun champ retenu.`);
            continue;
        }
        const valeur = valeurDuChamp(valeursDeLaFiche, champ);
        if (valeur === null) {
            // Le cas exact que le contrôle de cohérence attrape sur le pilote :
            // un identifiant qui ne correspond à aucun champ de la fiche.
            avertissements.push(`${composante.label} : « ${champ} » est absent de la fiche.`);
            continue;
        }
        seuil += valeur;
        composantes.push({ label: composante.label, champ, valeur });
    }

    // Les dés achetés ne franchissent pas le plafond du système : chez Dune,
    // cinq dés au total, quoi qu'on dépense.
    const demandes = descripteur.reserve.base + Math.max(0, choix.desSupplementaires ?? 0);
    const nombreDeDes = Math.min(demandes, descripteur.reserve.max);
    if (demandes > descripteur.reserve.max) {
        avertissements.push(`Réserve plafonnée à ${descripteur.reserve.max} dés.`);
    }

    // Le prix croît dé après dé : on additionne les échelons réellement
    // franchis, pas le nombre de dés fois un prix moyen.
    const desAchetes = nombreDeDes - descripteur.reserve.base;
    const echelons = descripteur.reserve.cout ?? [];
    const total = echelons.slice(0, Math.max(0, desAchetes)).reduce((s, c) => s + c, 0);

    const difficulteDemandee = choix.difficulte ?? descripteur.difficulte.defaut;
    const difficulte = Math.min(
        descripteur.difficulte.max,
        Math.max(descripteur.difficulte.min, difficulteDemandee),
    );
    if (difficulte !== difficulteDemandee) {
        avertissements.push(
            `Difficulté ramenée entre ${descripteur.difficulte.min} et ${descripteur.difficulte.max}.`,
        );
    }

    return {
        seuil,
        composantes,
        nombreDeDes,
        desAchetes: Math.max(0, desAchetes),
        cout: { total, ressource: descripteur.reserve.ressource },
        faces: descripteur.reserve.faces,
        sens: descripteur.sens,
        // La spécialisation élargit le critique ; sans elle, le critique ordinaire.
        doubleSous: Math.max(choix.critiqueEtendu ?? 0, descripteur.critique ?? 0),
        difficulte,
        avertissements,
    };
}

/**
 * Le jet a-t-il réussi ?
 *
 * Séparé du lancer parce que la difficulté est fixée par le meneur, souvent
 * après coup, et que le même jet peut donc changer de verdict sans être relancé.
 */
export function verdict(reussites: number, difficulte: number): {
    reussi: boolean;
    /** Réussites au-delà du nécessaire — l'Impulsion, chez Dune. */
    excedent: number;
} {
    return { reussi: reussites >= difficulte, excedent: Math.max(0, reussites - difficulte) };
}
