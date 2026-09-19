/**
 * **À qui appartient une chose — étiquette et pool commun.**
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POURQUOI CE FICHIER EST ICI, ET PAS DANS UN MODULE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Cette règle a été écrite le 2026-08-30 pour les atmosphères de Music-OS, sur
 * une demande de David : *« lier une config Music-OS à une campagne »*. Le
 * 2026-09-19, les tuiles de Light-OS ont eu besoin **exactement de la même**.
 *
 * Elle a donc été remontée ici plutôt que recopiée. *Plusieurs écrivains pour
 * une même vérité est le défaut que ce projet paie le plus souvent* — et deux
 * copies de ce classement auraient divergé le jour où l'une apprend à traiter
 * les orphelines et pas l'autre. `music/logic/playlistsDeLaCampagne.ts` garde
 * son vocabulaire et ses noms : il ne fait plus que rhabiller ces fonctions.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LA RÈGLE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * **Étiquette, pas cloison.** Une chose porte le nom d'une campagne, ou rien —
 * et « rien » veut dire *commune*, visible partout. Une nappe de tension écrite
 * une fois sert dans les trois campagnes sans être recopiée trois fois.
 *
 * **Ce qui n'a pas d'étiquette est commun.** C'est ce qui rend la bascule
 * indolore : rien de ce qui existait avant ce champ ne disparaît le jour de la
 * mise à jour. *Un choix de conception qui fait s'évanouir du travail existant
 * n'est pas un choix, c'est une perte.* Et c'est aussi ce qui évite une
 * **migration** — l'endroit où les données de ce projet sont déjà mortes deux
 * fois.
 *
 * Ces fonctions sont pures et ignorent tout des magasins : c'est ici que se
 * décide ce qu'on voit, et le même verdict doit servir à **l'écran comme au
 * clavier**. Deux filtres écrits séparément finiraient par diverger, et l'écart
 * ne se verrait qu'en séance — une touche qui lance l'ambiance d'une autre
 * campagne.
 */

/** Le propriétaire d'une chose commune. Aucune campagne ne la revendique. */
export const COMMUNE = null;

export interface Rattachable {
    id: string;
    /**
     * La campagne propriétaire, `null`/absent pour une chose commune.
     *
     * *Absent* et *`null`* disent exactement la même chose, et c'est
     * délibéré : la première signature vient de ce qui existait avant le
     * champ, la seconde d'un rattachement retiré à la main.
     */
    campagneId?: string | null;
}

export interface ClasseesParCampagne<T> {
    /** Écrites pour la campagne ouverte. */
    deLaCampagne: T[];
    /** Sans propriétaire : utilisables partout. */
    communes: T[];
    /**
     * Rattachées à une campagne qui n'existe plus.
     *
     * Elles restent **visibles**. Une campagne supprimée emporterait sinon son
     * travail dans un angle mort dont rien ne signalerait l'existence : le
     * meneur verrait du travail s'évanouir sans cause apparente. Montrées,
     * elles se re-rattachent ou se suppriment en un geste.
     */
    orphelines: T[];
    /** Rattachées à une autre campagne, bien vivante. Masquées. */
    desAutres: T[];
}

/**
 * Range les choses selon leur propriétaire, vu depuis une campagne donnée.
 *
 * `campagnesConnues` est facultatif : sans lui, on ne peut pas distinguer une
 * chose d'une autre campagne d'une chose orpheline, et tout ce qui est rattaché
 * ailleurs tombe dans `desAutres`.
 */
export function classerParCampagne<T extends Rattachable>(
    choses: readonly T[],
    campagneId: string | null,
    campagnesConnues?: Iterable<string>,
): ClasseesParCampagne<T> {
    const connues = campagnesConnues ? new Set(campagnesConnues) : null;
    const classees: ClasseesParCampagne<T> = {
        deLaCampagne: [],
        communes: [],
        orphelines: [],
        desAutres: [],
    };

    for (const chose of choses) {
        const proprietaire = chose.campagneId ?? COMMUNE;

        if (proprietaire === COMMUNE) classees.communes.push(chose);
        else if (campagneId !== null && proprietaire === campagneId) classees.deLaCampagne.push(chose);
        else if (connues && !connues.has(proprietaire)) classees.orphelines.push(chose);
        else classees.desAutres.push(chose);
    }

    return classees;
}

/**
 * Ce que l'écran doit montrer — la campagne, puis les communes, puis les
 * orphelines.
 *
 * **Aucune campagne ouverte : rien n'est masqué.** Il n'existe alors aucun
 * critère de tri, et masquer sur un critère absent reviendrait à cacher la
 * bibliothèque entière derrière un écran vide — indiscernable d'une perte de
 * données pour qui la regarde.
 */
export function visiblesDansLaCampagne<T extends Rattachable>(
    choses: readonly T[],
    campagneId: string | null,
    campagnesConnues?: Iterable<string>,
): T[] {
    if (campagneId === null) return [...choses];

    const classees = classerParCampagne(choses, campagneId, campagnesConnues);
    return [...classees.deLaCampagne, ...classees.communes, ...classees.orphelines];
}

/**
 * Ce qui doit être sélectionné après un changement de campagne.
 *
 * On garde la sélection en cours si elle reste visible — changer de campagne ne
 * doit pas la déplacer sans raison. Sinon on prend la première visible : **une
 * sélection pointant sur une chose masquée laisserait l'écran allumé sur rien**,
 * ou pire, sur celle d'une autre campagne.
 *
 * Rend `null` quand il n'y a rien à sélectionner — c'est un état légitime
 * (campagne neuve, rien de commun), pas une erreur.
 */
export function selectionApresChangement<T extends Rattachable>(
    choses: readonly T[],
    campagneId: string | null,
    actuelle: string | null,
    campagnesConnues?: Iterable<string>,
): string | null {
    const visibles = visiblesDansLaCampagne(choses, campagneId, campagnesConnues);
    if (actuelle !== null && visibles.some(c => c.id === actuelle)) return actuelle;
    return visibles[0]?.id ?? null;
}
