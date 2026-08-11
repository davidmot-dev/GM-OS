import type { HealthSystem } from '../../../types/entity.types';

/**
 * Vaincre quelqu'un quand le jeu ne compte pas de points de vie.
 *
 * **Le dernier morceau du mur n° 1.** Les points de vie sont devenus
 * facultatifs, mais Dune ne se contente pas de ne pas en avoir : il remplace la
 * jauge par une **tâche étendue**. « L'attrition corporelle et l'élimination
 * physique sont gérées à travers une tâche étendue de défaite. Une attaque
 * réussie génère une progression numérique fixe vers un seuil prédéterminé »
 * (`docs/systems/dune/rules/sante-et-blessures.md`).
 *
 * Et ce seuil n'est pas un nombre du système : **il vaut la compétence
 * défensive de la cible**, de quatre à huit. Il se lit donc sur la fiche, comme
 * le seuil d'un jet se lit sur la fiche — même mécanique que `DescripteurDeJet`,
 * pour la même raison : une valeur qui dépend du personnage ne peut pas vivre
 * dans le pilote.
 *
 * L'horloge de `HealthInterpreter` porte exactement cette forme — des segments
 * qu'on remplit — à ceci près que son nombre de segments était figé à six. Il
 * suffisait de le faire venir de la fiche.
 *
 * **Ce que ce module ne fait pas.** Il ne décide pas qu'un personnage est
 * vaincu, ne joue pas « Survivre à la défaite », n'inflige aucune blessure
 * durable. Ce sont des choix de table, pris par le meneur, et les coûts en
 * Impulsion restent dans la fiche de règles qu'il lit. L'outil tient le compte.
 */

/** D'où vient le seuil de la tâche, et comment la progression s'y ajoute. */
export interface TacheDeDefaite {
    /**
     * Section de la fiche où lire la compétence défensive. Le meneur y choisit
     * un champ, exactement comme le joueur choisit sa compétence pour un jet.
     */
    sectionDuSeuil: string;
    /** Champ retenu à défaut de choix — la compétence la plus souvent défensive. */
    champParDefaut?: string;
    /** Bornes du seuil, pour ramener une fiche aberrante dans le raisonnable. */
    seuil: { min: number; max: number };
    /** Ce qu'une attaque réussie ajoute, avant la qualité de l'atout. */
    progressionDeBase: number;
    /** La qualité de l'atout offensif s'ajoute à la progression, de 0 à ce maximum. */
    qualiteMax: number;
    label?: string;
}

export interface SeuilDeDefaite {
    valeur: number;
    /** Le champ effectivement lu, pour pouvoir l'afficher. */
    champ?: string;
    /**
     * Ce qui n'a pas pu être résolu — **jamais une exception**.
     *
     * Un champ absent de la fiche est une erreur de configuration, pas une
     * raison d'empêcher un combat de se dérouler. On retombe sur le minimum et
     * on dit pourquoi, comme `preparerLeJet` le fait pour les jets.
     */
    avertissements: string[];
}

/** Le nombre lu sur la fiche, ou `null` s'il n'y est pas. */
function valeurDuChamp(valeurs: Record<string, unknown>, champ: string): number | null {
    const brut = valeurs[champ];
    if (brut === undefined || brut === null || brut === '') return null;
    const n = typeof brut === 'number' ? brut : Number(brut);
    return Number.isFinite(n) ? n : null;
}

/**
 * Le seuil de défaite d'une cible, lu sur sa fiche.
 *
 * Fonction pure : elle ne lit aucun état global et ne lance rien.
 */
export function seuilDeDefaite(
    tache: TacheDeDefaite,
    valeursDeLaFiche: Record<string, unknown>,
    champChoisi?: string,
): SeuilDeDefaite {
    const avertissements: string[] = [];
    const champ = champChoisi || tache.champParDefaut;

    if (!champ) {
        avertissements.push('Aucune compétence défensive retenue : seuil au minimum.');
        return { valeur: tache.seuil.min, avertissements };
    }

    const lu = valeurDuChamp(valeursDeLaFiche, champ);
    if (lu === null) {
        avertissements.push(`« ${champ} » est absent de la fiche : seuil au minimum.`);
        return { valeur: tache.seuil.min, champ, avertissements };
    }

    const borne = Math.min(tache.seuil.max, Math.max(tache.seuil.min, lu));
    if (borne !== lu) {
        avertissements.push(`Seuil ramené entre ${tache.seuil.min} et ${tache.seuil.max}.`);
    }
    return { valeur: borne, champ, avertissements };
}

/**
 * Ce qu'une attaque réussie fait progresser.
 *
 * « Deux points de progression, plus la valeur de qualité de l'atout offensif,
 * d'une échelle de zéro (ordinaire) à quatre (dévastateur). »
 */
export function progressionDeLAttaque(tache: TacheDeDefaite, qualiteDeLAtout = 0): number {
    const qualite = Math.min(tache.qualiteMax, Math.max(0, Math.floor(qualiteDeLAtout)));
    return tache.progressionDeBase + qualite;
}

/**
 * L'horloge de défaite d'une cible, prête à être posée sur un combattant.
 *
 * C'est le point où le mur tombe pour de bon : le nombre de segments **vient de
 * la fiche** au lieu du six codé en dur de `createDefault`.
 */
export function horlogeDeDefaite(
    tache: TacheDeDefaite,
    valeursDeLaFiche: Record<string, unknown>,
    champChoisi?: string,
): { sante: HealthSystem; seuil: SeuilDeDefaite } {
    const seuil = seuilDeDefaite(tache, valeursDeLaFiche, champChoisi);
    return {
        sante: {
            type: 'clocks',
            data: { filled: 0, segments: seuil.valeur, champDuSeuil: seuil.champ },
            state: 'healthy',
            badges: [],
        },
        seuil,
    };
}
