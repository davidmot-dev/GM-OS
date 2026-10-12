/**
 * GM-OS — Les rencontres préparées.
 *
 * **Né du débriefing de la première séance jouée** (11/10/2026) : Combat-OS n'a
 * pas servi, *« la mise en place est trop longue »*. David demande de prévoir
 * les rencontres à l'avance, de les lier à une scène, et de n'ajouter les PJ
 * qu'au moment où le combat démarre. Plan :
 * `documentation/Planning/2026-10-12-rencontres-preparees.md`.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * UNE COLLECTION DE LA CAMPAGNE, LA SCÈNE EN RENVOI FACULTATIF
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Une rencontre peut n'appartenir à **aucune** scène (décision du 12/10 : la
 * patrouille aléatoire). Elle ne vit donc pas sur `Scene`, comme les
 * enchaînements : elle aurait demandé deux rangements, et rattacher une
 * patrouille à une scène serait devenu un déménagement. Ici, c'est un champ.
 *
 * ⛔ **Une rencontre est un MODÈLE**, elle ne se consomme pas : chaque
 * invocation fabrique des exemplaires neufs (fuite, retour, scène rejouée).
 */

/** Le camp d'une ligne, celui de `Combatant`. Ennemi par défaut. */
export type CampDeRencontre = 'enemy' | 'ally' | 'neutral';

/**
 * Une ligne de rencontre : **des renvois, pas des fiches**. Le gabarit est lu au
 * moment de l'invocation — retouché la veille, il donne des adversaires
 * retouchés.
 */
export type LigneDeRencontre =
    | {
        genre: 'gabarit';
        gabaritId: string;
        nombre: number;
        faction?: CampDeRencontre;
        /*
          ⚠️ **Le repli du gabarit.** Le bestiaire appartient au JEU, pas à la
          campagne : une campagne emportée par Nexus-OS arrive avec des
          `gabaritId` inconnus. Ces trois champs permettent de fabriquer encore,
          à partir de l'archétype.
        */
        nom: string;
        archetypeId: string;
        rangId: string;
    }
    | {
        genre: 'archetype';
        archetypeId: string;
        rangId: string;
        nombre: number;
        nom?: string;
        faction?: CampDeRencontre;
    }
    | {
        /** Un PNJ de la campagne, envoyé tel qu'il est. */
        genre: 'entite';
        entiteId: string;
        faction?: CampDeRencontre;
    };

export interface RencontrePreparee {
    id: string;
    campaignId: string;
    /** Absente : une rencontre libre, invocable dans n'importe quelle scène. */
    sceneId?: string;
    /** « La patrouille », « Les renforts au round 3 ». */
    nom: string;
    /** Tactique, déclencheur, terrain. */
    notes?: string;
    lignes: LigneDeRencontre[];
    creeeLe: number;
}
