/**
 * Les ressources qui appartiennent à la table, et non aux personnages.
 *
 * **Le mur qu'elles abattent.** Un pilote ne connaissait que des champs de
 * fiche, donc individuels. Or les ressources les plus manipulées d'une partie de
 * Dune ne le sont pas : l'Impulsion est une réserve **commune aux joueurs**,
 * bornée de 0 à 6, qui perd un point en fin de scène ; la Menace appartient au
 * meneur et n'a pas de plafond (`docs/systems/dune/rules/monnaie-de-table.md`).
 * Les mettre sur la fiche aurait été faux dans les deux sens — six joueurs
 * auraient eu six Impulsions, et la Menace serait devenue la propriété d'un
 * personnage.
 *
 * **Ce que le modèle porte, et rien de plus** : combien il y en a, entre quelles
 * bornes, à qui elles sont, ce qu'elles perdent en fin de scène, et où va ce
 * qu'on ne peut pas payer. Il ne dit pas *à quoi* on les dépense — acheter un
 * dé, annuler une complication, hausser une difficulté sont des décisions de
 * table, et elles restent dans les fiches de règles que le meneur lit.
 *
 * Tout ici est pur : ces fonctions ne lisent aucun état global et ne lèvent
 * jamais. C'est le store qui applique, et c'est ce qui les rend vérifiables.
 */

/** À qui la réserve appartient. Détermine qui la manipule, pas comment. */
export type ProprietaireDeRessource = 'joueurs' | 'meneur';

export interface RessourceDeTable {
    /** `impulsion`, `menace`. Sert de clé dans l'état. */
    id: string;
    label: string;
    proprietaire: ProprietaireDeRessource;
    /** Valeur au début d'une chronique. */
    depart: number;
    min: number;
    /**
     * Plafond. **Absent = sans plafond** — c'est le cas de la Menace, et c'est
     * une différence de nature, pas un oubli : mettre un très grand nombre
     * aurait rendu les deux cas indistinguables.
     */
    max?: number;
    /** Ce que la réserve perd à la fin de chaque scène. L'Impulsion : un point. */
    erosionFinDeScene?: number;
    /**
     * Où va ce que la réserve ne peut pas payer.
     *
     * **La règle que rien d'autre ne saurait exprimer** : à zéro d'Impulsion,
     * l'achat d'un dé se paie en Menace — le manque ne bloque pas la dépense, il
     * **alimente la réserve adverse**. Une jauge individuelle serait simplement
     * tombée à zéro et aurait refusé.
     */
    reportSurEpuisement?: string;
    description?: string;
}

/** Ce que chaque réserve contient, à un instant donné. */
export type EtatDesRessources = Record<string, number>;

/** Un mouvement sur une réserve, tel qu'on peut l'afficher. */
export interface MouvementDeReserve {
    ressourceId: string;
    /** Négatif pour une dépense, positif pour un gain. */
    delta: number;
}

export interface ResultatDeMouvement {
    etat: EtatDesRessources;
    mouvements: MouvementDeReserve[];
    /**
     * Ce qui n'a pas pu entrer parce que la réserve plafonnait.
     *
     * « À six points, tout gain est perdu. » Le dire plutôt que de le taire :
     * un joueur qui gagne trois points et n'en voit arriver qu'un doit savoir
     * pourquoi.
     */
    perdu: number;
    avertissements: string[];
}

/** Chaque réserve à sa valeur de départ. */
export function etatInitial(ressources: RessourceDeTable[]): EtatDesRessources {
    const etat: EtatDesRessources = {};
    for (const r of ressources) etat[r.id] = r.depart;
    return etat;
}

/** La valeur d'une réserve, ou son départ si l'état ne la connaît pas encore. */
export function valeurDe(
    ressources: RessourceDeTable[],
    etat: EtatDesRessources,
    id: string,
): number {
    const courante = etat[id];
    if (typeof courante === 'number' && Number.isFinite(courante)) return courante;
    return ressources.find(r => r.id === id)?.depart ?? 0;
}

/** Comment une dépense se répartit — **sans rien appliquer**. */
export interface VentilationDeDepense {
    /** Ce que la réserve elle-même peut payer. */
    surLaReserve: number;
    /** Le manque, qui part ailleurs. Zéro si la réserve suffit. */
    reporte: number;
    /** Sur quelle réserve part le manque. Absent si rien n'est reporté. */
    ressourceDeReport?: string;
    /** Le manque, quand aucun report n'est déclaré : la dépense sera partielle. */
    impaye: number;
}

/**
 * Ce qu'une dépense coûterait, avant de la faire.
 *
 * Séparée de `depenser` pour la même raison que `preparerLeJet` l'est du
 * lancer : le panneau doit pouvoir **annoncer** « 3 points — 2 d'Impulsion,
 * 1 de Menace » avant que le joueur ne s'engage. Une dépense qui alimente la
 * réserve du meneur ne doit jamais être une surprise.
 */
export function ventilerLaDepense(
    ressources: RessourceDeTable[],
    etat: EtatDesRessources,
    id: string,
    montant: number,
): VentilationDeDepense {
    const demande = Math.max(0, Math.floor(montant));
    const ressource = ressources.find(r => r.id === id);
    if (!ressource) return { surLaReserve: 0, reporte: 0, impaye: demande };

    const disponible = Math.max(0, valeurDe(ressources, etat, id) - ressource.min);
    const surLaReserve = Math.min(disponible, demande);
    const manque = demande - surLaReserve;

    if (manque === 0) return { surLaReserve, reporte: 0, impaye: 0 };
    if (ressource.reportSurEpuisement) {
        return { surLaReserve, reporte: manque, ressourceDeReport: ressource.reportSurEpuisement, impaye: 0 };
    }
    return { surLaReserve, reporte: 0, impaye: manque };
}

/**
 * Dépense sur une réserve, en reportant ce qu'elle ne peut pas payer.
 *
 * **N'échoue pas.** Une réserve trop basse rend un avertissement, pas un refus :
 * arbitrer si la dépense a lieu est le rôle du meneur, pas de l'outil. On suit
 * l'état ; on ne le défend pas contre la table.
 */
export function depenser(
    ressources: RessourceDeTable[],
    etat: EtatDesRessources,
    id: string,
    montant: number,
): ResultatDeMouvement {
    const ventilation = ventilerLaDepense(ressources, etat, id, montant);
    const suivant = { ...etat };
    const mouvements: MouvementDeReserve[] = [];
    const avertissements: string[] = [];

    const ressource = ressources.find(r => r.id === id);
    if (!ressource) {
        return {
            etat: suivant,
            mouvements: [],
            perdu: 0,
            avertissements: [`« ${id} » n'est pas une ressource de ce système.`],
        };
    }

    if (ventilation.surLaReserve > 0) {
        suivant[id] = valeurDe(ressources, etat, id) - ventilation.surLaReserve;
        mouvements.push({ ressourceId: id, delta: -ventilation.surLaReserve });
    }

    if (ventilation.reporte > 0 && ventilation.ressourceDeReport) {
        // Le report est un **gain** sur l'autre réserve : ce qu'on ne paie pas
        // en Impulsion, le meneur l'encaisse en Menace.
        const report = gagner(ressources, suivant, ventilation.ressourceDeReport, ventilation.reporte);
        const cible = ressources.find(r => r.id === ventilation.ressourceDeReport);
        avertissements.push(
            `${ventilation.reporte} point${ventilation.reporte > 1 ? 's' : ''} de ${ressource.label} manquant${ventilation.reporte > 1 ? 's' : ''} : ${cible?.label ?? ventilation.ressourceDeReport} augmente d'autant.`,
        );
        return {
            etat: report.etat,
            mouvements: [...mouvements, ...report.mouvements],
            perdu: report.perdu,
            avertissements: [...avertissements, ...report.avertissements],
        };
    }

    if (ventilation.impaye > 0) {
        avertissements.push(
            `${ressource.label} : ${ventilation.impaye} point${ventilation.impaye > 1 ? 's' : ''} non payé${ventilation.impaye > 1 ? 's' : ''}, la réserve est au plancher.`,
        );
    }

    return { etat: suivant, mouvements, perdu: 0, avertissements };
}

/**
 * Ajoute à une réserve, en signalant ce que le plafond refuse.
 */
export function gagner(
    ressources: RessourceDeTable[],
    etat: EtatDesRessources,
    id: string,
    montant: number,
): ResultatDeMouvement {
    const demande = Math.max(0, Math.floor(montant));
    const ressource = ressources.find(r => r.id === id);
    if (!ressource) {
        return {
            etat: { ...etat },
            mouvements: [],
            perdu: 0,
            avertissements: [`« ${id} » n'est pas une ressource de ce système.`],
        };
    }

    const avant = valeurDe(ressources, etat, id);
    const apres = ressource.max === undefined ? avant + demande : Math.min(ressource.max, avant + demande);
    const gagne = apres - avant;
    const perdu = demande - gagne;

    const avertissements: string[] = [];
    if (perdu > 0) {
        avertissements.push(
            `${ressource.label} plafonne à ${ressource.max} : ${perdu} point${perdu > 1 ? 's' : ''} perdu${perdu > 1 ? 's' : ''}.`,
        );
    }

    return {
        etat: { ...etat, [id]: apres },
        mouvements: gagne > 0 ? [{ ressourceId: id, delta: gagne }] : [],
        perdu,
        avertissements,
    };
}

/** Pose une réserve à une valeur choisie, en la ramenant dans ses bornes. */
export function fixer(
    ressources: RessourceDeTable[],
    etat: EtatDesRessources,
    id: string,
    valeur: number,
): ResultatDeMouvement {
    const ressource = ressources.find(r => r.id === id);
    if (!ressource) {
        return {
            etat: { ...etat },
            mouvements: [],
            perdu: 0,
            avertissements: [`« ${id} » n'est pas une ressource de ce système.`],
        };
    }
    const avant = valeurDe(ressources, etat, id);
    const borne = Math.max(ressource.min, ressource.max === undefined ? valeur : Math.min(ressource.max, valeur));
    return {
        etat: { ...etat, [id]: borne },
        mouvements: borne === avant ? [] : [{ ressourceId: id, delta: borne - avant }],
        perdu: 0,
        avertissements: [],
    };
}

/**
 * L'érosion de fin de scène, sur toutes les réserves qui en déclarent une.
 *
 * **Pourquoi c'est un geste et pas un effet de bord.** « À la fin de la scène
 * active, le groupe doit retirer un point d'Impulsion. » Rien dans
 * l'application ne sait quand une scène se termine — c'est le meneur qui le
 * décide. On lui donne le bouton plutôt que de deviner.
 */
export function finDeScene(
    ressources: RessourceDeTable[],
    etat: EtatDesRessources,
): ResultatDeMouvement {
    let courant = { ...etat };
    const mouvements: MouvementDeReserve[] = [];
    const avertissements: string[] = [];

    for (const r of ressources) {
        if (!r.erosionFinDeScene) continue;
        const avant = valeurDe(ressources, courant, r.id);
        const apres = Math.max(r.min, avant - r.erosionFinDeScene);
        if (apres === avant) continue;
        courant = { ...courant, [r.id]: apres };
        mouvements.push({ ressourceId: r.id, delta: apres - avant });
    }

    return { etat: courant, mouvements, perdu: 0, avertissements };
}
