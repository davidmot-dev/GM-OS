import type { Combatant } from '../types';

/**
 * L'ordre du tour quand il n'est pas un classement.
 *
 * **Le mur qu'il abat.** Le pilote ne savait exprimer l'initiative que d'une
 * façon : une formule évaluée par combattant, puis un tri. Chez Dune, le livre
 * ne classe jamais personne — « le meneur choisit le premier personnage à agir »,
 * puis « les activations alternent entre les camps ». Trier par Mobilité était
 * une invention de notre part, assumée faute de mieux
 * (`docs/systems/dune/rules/initiative-et-deroulement-du-tour.md`).
 *
 * Un ordre d'action n'est donc pas toujours une liste triée : c'est parfois une
 * **machine à états sur les camps**, où le tour se gagne et se garde.
 *
 * **Ce que ce module fait, et rien de plus** : il dit qui peut agir, ce que
 * garder la main coûterait, et quand le round s'achève. Il ne dépense rien — les
 * réserves de table sont ailleurs — et il n'empêche rien : refuser une rétention
 * interdite est une décision d'écran, et le meneur reste maître de sa table.
 *
 * Tout est pur. Aucun état global, aucune exception.
 */

/**
 * Les deux camps.
 *
 * **Une limite portée par le livre lui-même** : « les sources ne précisent pas
 * comment s'organise l'alternance si plus de deux camps s'affrontent ». On n'en
 * invente donc pas un troisième — les neutres rejoignent les adversaires, ce qui
 * est faux mais visible, plutôt qu'un camp fantôme qui n'aurait jamais la main.
 */
export type Camp = 'joueurs' | 'adversaires';

export type ModeDInitiative = 'formule' | 'alternance';

/** Ce qu'un geste coûte, et sur quelle réserve de table. */
export interface CoutDInitiative {
    montant: number;
    ressource: string;
}

export interface DescripteurDInitiative {
    mode: ModeDInitiative;
    /**
     * Garder la main au lieu de la passer. Chez Dune : deux points d'Impulsion
     * pour les joueurs — ou deux points de Menace concédés au meneur, ce que le
     * report de la réserve traite tout seul.
     */
    coutDeRetention?: CoutDInitiative;
    /** Ouvrir le round suivant avec son propre camp, plutôt que de céder. */
    coutDOuverture?: CoutDInitiative;
    /**
     * Tours d'affilée qu'un même camp peut prendre. Chez Dune : deux — « conserver
     * l'initiative est impossible tant qu'au moins un ennemi n'a pas agi ».
     */
    activationsConsecutivesMax?: number;
}

export interface EtatDuTour {
    round: number;
    /** Le camp qui a la main : c'est chez lui qu'on choisit le prochain à agir. */
    campActif: Camp;
    /** Qui a déjà pris son tour dans ce round. Le round s'achève quand tous y sont. */
    ontAgi: string[];
    /** Tours pris d'affilée par le camp qui a la main. Zéro quand il vient de la recevoir. */
    activationsConsecutives: number;
    /**
     * Une action vient d'être résolue et le camp doit choisir : céder ou garder.
     *
     * C'est l'étape 4 de la procédure du livre, et elle mérite un champ. Sans
     * elle, rien ne distingue « le camp a la main et va désigner quelqu'un » de
     * « le camp vient d'agir et n'a pas encore dit ce qu'il faisait » — deux
     * moments où l'écran ne doit pas proposer la même chose.
     */
    enAttenteDeDecision: boolean;
    /** Le dernier à avoir agi — c'est lui qui désigne l'ouverture du round suivant. */
    dernierAgissant?: string;
}

/** L'autre camp. */
export const autreCamp = (camp: Camp): Camp => (camp === 'joueurs' ? 'adversaires' : 'joueurs');

/**
 * De quel camp relève un combattant.
 *
 * Les alliés du meneur agissent avec les joueurs : le livre oppose des camps,
 * pas des fiches. `faction` distingue déjà `ally` de `enemy` — s'en servir ici
 * est ce qui empêche un PNJ allié de se retrouver dans le camp d'en face.
 */
export function campDe(combattant: Combatant): Camp {
    if (combattant.isPlayer) return 'joueurs';
    return combattant.faction === 'player' || combattant.faction === 'ally' ? 'joueurs' : 'adversaires';
}

/** Le round s'ouvre, et le meneur désigne qui commence. */
export function ouvrirLeRound(camp: Camp, round = 1): EtatDuTour {
    return { round, campActif: camp, ontAgi: [], activationsConsecutives: 0, enAttenteDeDecision: false };
}

/** Ceux qui n'ont pas encore agi, tous camps confondus. */
export function restants(combattants: Combatant[], etat: EtatDuTour): Combatant[] {
    return combattants.filter(c => !etat.ontAgi.includes(c.id));
}

/**
 * Qui peut agir maintenant.
 *
 * Ceux du camp actif qui n'ont pas encore joué — et, s'il n'en reste aucun, ceux
 * de l'autre camp : « si un camp n'a plus de personnages disponibles, les
 * combattants restants de l'autre camp effectuent leurs tours les uns après les
 * autres dans l'ordre de leur choix. » Sans ce repli, un round ne s'achèverait
 * jamais dès que les camps sont d'effectifs inégaux — le cas le plus banal.
 */
export function candidats(combattants: Combatant[], etat: EtatDuTour): Combatant[] {
    const libres = restants(combattants, etat);
    const duCamp = libres.filter(c => campDe(c) === etat.campActif);
    return duCamp.length > 0 ? duCamp : libres;
}

/** Tout le monde a joué : le round est fini. */
export function roundTermine(combattants: Combatant[], etat: EtatDuTour): boolean {
    return combattants.length > 0 && restants(combattants, etat).length === 0;
}

/**
 * Un combattant prend son tour.
 *
 * **La main ne passe pas ici.** Le livre sépare les deux gestes : « une fois
 * l'action résolue, le joueur ou le meneur décide s'il laisse le camp adverse
 * choisir le prochain intervenant, ou s'il conserve l'initiative ». Fusionner
 * l'action et la cession aurait rendu la rétention impossible à exprimer —
 * c'est précisément l'erreur que le mode « formule » commettait.
 */
export function agir(etat: EtatDuTour, combattantId: string): EtatDuTour {
    if (etat.ontAgi.includes(combattantId)) return etat;
    return {
        ...etat,
        ontAgi: [...etat.ontAgi, combattantId],
        dernierAgissant: combattantId,
        activationsConsecutives: etat.activationsConsecutives + 1,
        enAttenteDeDecision: true,
    };
}

/** Le camp actif cède : l'adversaire choisit le prochain intervenant. */
export function passerLaMain(etat: EtatDuTour): EtatDuTour {
    return {
        ...etat,
        campActif: autreCamp(etat.campActif),
        activationsConsecutives: 0,
        enAttenteDeDecision: false,
    };
}

/** Ce que la rétention exige, et pourquoi elle serait refusée. */
export interface RetentionPossible {
    possible: boolean;
    /** Dit à l'écran, jamais deviné : un bouton grisé sans motif est une énigme. */
    raison?: string;
    cout?: CoutDInitiative;
}

export function retentionPossible(
    descripteur: DescripteurDInitiative,
    combattants: Combatant[],
    etat: EtatDuTour,
): RetentionPossible {
    const cout = descripteur.coutDeRetention;
    const max = descripteur.activationsConsecutivesMax;

    if (max !== undefined && etat.activationsConsecutives >= max) {
        return {
            possible: false,
            raison: `Ce camp a déjà enchaîné ${etat.activationsConsecutives} tours : il faut qu'un adversaire agisse.`,
            cout,
        };
    }

    const libres = restants(combattants, etat).filter(c => campDe(c) === etat.campActif);
    if (libres.length === 0) {
        return { possible: false, raison: 'Plus personne de ce camp n\'a de tour à prendre.', cout };
    }

    return { possible: true, cout };
}

/**
 * Le camp actif garde la main.
 *
 * Le camp ne change pas — c'est tout l'intérêt — et son compteur d'activations,
 * déjà incrémenté par `agir`, tient le plafond. Seule la décision se referme,
 * pour que l'écran revienne à la désignation d'un intervenant.
 *
 * **Le paiement n'est pas fait ici** : ce module ne connaît pas les réserves, et
 * mélanger les deux aurait rendu l'un intestable sans l'autre.
 */
export function conserverLaMain(etat: EtatDuTour): EtatDuTour {
    return { ...etat, enAttenteDeDecision: false };
}

/**
 * Le camp qui ouvrirait le round suivant sans rien payer.
 *
 * « Le dernier personnage à avoir agi désigne le camp qui commencera le round
 * suivant, ou paie le coût requis pour permettre à son propre camp de débuter. »
 * Céder est donc gratuit, et reprendre se paie.
 */
export function ouvertureGratuite(combattants: Combatant[], etat: EtatDuTour): Camp {
    const dernier = combattants.find(c => c.id === etat.dernierAgissant);
    return dernier ? autreCamp(campDe(dernier)) : etat.campActif;
}

/** Le round suivant s'ouvre sur le camp désigné. */
export function ouvrirLeRoundSuivant(etat: EtatDuTour, camp: Camp): EtatDuTour {
    return ouvrirLeRound(camp, etat.round + 1);
}
