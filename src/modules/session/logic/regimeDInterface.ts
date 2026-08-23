import type { MomentDeJeu } from '../../ai/budgetsDeTemps';

/**
 * **Les deux régimes d'interface — axe N, troisième temps.**
 *
 * Les deux premiers temps ont classé les vues (`affiniteDesVues.ts`) et
 * dédoublé la disposition par moment (`useLayoutManager`). Le troisième est le
 * seul qui touche au **dessin**, et le plan du 2026-08-07 dit exactement ce
 * qu'il faut changer — trois choses, et *pas* la liste des boutons :
 *
 * > *« la **densité** (à table on regarde de loin, parfois debout, souvent en
 * > parlant), les **valeurs par défaut** (en préparation on veut choisir, en
 * > séance on veut que ce soit déjà choisi), et **ce qui est à portée de main**
 * > (aucune action destructive ni monopolisante près de ce qu'on touche en
 * > partie). »*
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LE GARDE-FOU, QUI EST IMPÉRATIF
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * > *« Toute vue dédoublée partage ses composants, jamais son implémentation.
 * > Sans quoi on refabrique en série la duplication de plomberie des deux
 * > Forges. »* — et la réponse du plan à la question « faut-il des interfaces
 * > distinctes par mode ? » est nette : **pas deux implémentations, deux
 * > compositions.**
 *
 * D'où ce fichier. Il n'existe pas pour décider à la place des modules, mais
 * pour que **les cinq modules concernés — combat, carte, PNJ, Oracle, journal —
 * composent de la même manière**. Cinq tables de tailles écrites à la main
 * auraient divergé au premier ajustement, et *une divergence de densité ne se
 * voit qu'à la table, une fois qu'il est trop tard pour la corriger.*
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * UN SEUL FAIT, TROIS CONSÉQUENCES
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * `aLaTable` est le seul état — il n'y a pas trois booléens à tenir cohérents.
 * Les trois axes du plan en découlent, et sont **nommés séparément** parce
 * qu'ils se lisent différemment sur les lieux d'appel : un module qui écrit
 * `if (regime.aLaTable)` ne dit pas *pourquoi*, un module qui écrit
 * `if (!regime.destructifAPortee)` le dit.
 */

/** Vrai pendant qu'on joue. `MomentDeJeu` reste la source, jamais recalculée ici. */
export interface RegimeDInterface {
    moment: MomentDeJeu;
    /** **La densité.** À table on regarde de loin, debout, en parlant. */
    aLaTable: boolean;
    /**
     * **Ce qui est à portée de main.** Faux en partie : une action destructive
     * ou monopolisante s'éloigne de ce qu'on touche pendant qu'on joue.
     *
     * *Ce n'est pas « on la cache »* — elle reste atteignable, elle cesse
     * seulement d'être voisine du bouton qu'on presse dix fois par tour.
     */
    destructifAPortee: boolean;
    /**
     * **Les valeurs par défaut.** Vrai en partie : ce qui peut être choisi
     * d'avance l'est, et l'écran ne pose pas de question qu'il sait résoudre.
     */
    prechoisir: boolean;
}

export function regimeDInterface(moment: MomentDeJeu): RegimeDInterface {
    const aLaTable = moment === 'partie';
    return {
        moment,
        aLaTable,
        destructifAPortee: !aLaTable,
        prechoisir: aLaTable,
    };
}

/**
 * Les tailles, **écrites une fois pour les cinq modules**.
 *
 * Chaque entrée est un couple `[atelier, table]`. Les valeurs de table ne sont
 * pas « un peu plus grandes » : elles visent une lecture **à deux mètres, de
 * biais**, ce qui est la posture réelle d'un meneur debout qui parle.
 *
 * *Ce sont des propositions à corriger à la table, pas des constantes établies.*
 * Le plan est explicite : ce temps-ci ne se juge qu'en jouant.
 */
const TAILLES = {
    /** Un nombre qui décide — points de vie, tour, compte à rebours. */
    chiffre: ['text-lg', 'text-3xl'],
    /** Un nom qu'on doit reconnaître sans le lire en entier. */
    nom: ['text-sm', 'text-lg'],
    /** Un libellé de service, qui n'a pas à se lire de loin. */
    libelle: ['text-[10px]', 'text-xs'],
    /** Une cible qu'on touche sans viser. */
    cible: ['h-8', 'h-12'],
    /** L'espace entre deux choses qu'il ne faut pas confondre. */
    espace: ['gap-2', 'gap-4'],
    /** La respiration d'un panneau entier. */
    marge: ['p-3', 'p-5'],
} as const;

export type NomDeTaille = keyof typeof TAILLES;

/**
 * La classe utilitaire correspondant au régime.
 *
 * @example `<span className={taille(regime, 'chiffre')}>{pv}</span>`
 */
export function taille(regime: RegimeDInterface, nom: NomDeTaille): string {
    return TAILLES[nom][regime.aLaTable ? 1 : 0];
}

/** Toutes les tailles d'un coup, pour un composant qui en emploie plusieurs. */
export function tailles(regime: RegimeDInterface): Record<NomDeTaille, string> {
    const sortie = {} as Record<NomDeTaille, string>;
    for (const nom of Object.keys(TAILLES) as NomDeTaille[]) {
        sortie[nom] = taille(regime, nom);
    }
    return sortie;
}
