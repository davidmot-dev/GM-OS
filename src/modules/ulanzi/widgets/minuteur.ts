import { LARGEUR, type RectanglePlein } from './defileDesQuarts';
import { barreDeSegments, COULEURS_DU_COMPTE } from './compteARebours';

/**
 * **Le compte à rebours du minuteur — le widget que le plan classait premier.**
 *
 * § 8.1 : *« le meilleur candidat de loin, et le seul qui change la façon de
 * JOUER plutôt que de s'informer. Barre + nombre : exactement ce que 32 × 8 rend
 * bien. »* Il arrive en dernier parce qu'il demandait deux choses que les deux
 * autres n'ont pas demandées.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QU'IL A COÛTÉ, ET QUI N'ÉTAIT PAS DANS LE PLAN
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * **1. Le minuteur ne descendait que sur son propre écran.** Son battement
 * vivait dans un effet de `ClockDashboard` ; quitter Clock-OS l'arrêtait. Il
 * aurait fallu le découvrir sur l'objet, en pleine séance. Voir
 * `useBattementDuMinuteur`.
 *
 * **2. `MM:SS` demande une seconde de fraîcheur.** Le battement de l'afficheur
 * republie toutes les trente secondes — un compte à rebours y aurait été faux
 * vingt-neuf secondes sur trente. David a tranché le 2026-08-30 : **MM:SS en
 * permanence**, donc l'afficheur pousse ce widget à la seconde. Ce qui a forcé
 * le battement à ne publier **que ce qui a changé**, plutôt que tout à cadence
 * fixe.
 *
 * ⚠️ **Le libellé du minuteur ne tient pas à l'écran.** `MM:SS` occupe déjà cinq
 * des sept caractères, et la barre prend le bas. On n'affiche donc que le temps.
 * C'est acceptable **parce qu'il n'y a qu'un minuteur** : il s'identifie en
 * étant le seul widget qui compte des secondes. Le jour où il y en aurait deux,
 * ce choix serait à refaire.
 */

/** En dessous, chaque seconde compte vraiment : la barre passe au rouge. */
export const SECONDES_CRITIQUES = 10;

export const COULEURS_DU_MINUTEUR = {
    /** Le temps qui reste, tant qu'il en reste. */
    encours: '#3A9EFF',
    /** Les dix dernières secondes. */
    critique: '#FF8C1A',
    /** Zéro. */
    fini: COULEURS_DU_COMPTE.pleine,
} as const;

/** Ce que l'afficheur doit connaître du minuteur. */
export interface MinuteurAAfficher {
    /** Secondes restantes. */
    restant: number;
    /** Durée totale, pour la barre. */
    duree: number;
}

export interface CompositionDuMinuteur {
    text: string;
    color: string;
    center: true;
    noScroll: true;
    draw: RectanglePlein[];
}

/**
 * `MM:SS`, et **jamais autre chose**.
 *
 * Cinq caractères, quelle que soit la durée : un affichage dont la largeur
 * change saute à l'œil sur une matrice, et l'on croit que quelque chose s'est
 * passé. Au-delà de 99 minutes on plafonne — un minuteur de plus d'une heure
 * trente n'est plus un compte à rebours de table.
 */
export function enMinutesSecondes(secondes: number): string {
    const total = Math.max(0, Math.floor(secondes));
    const minutes = Math.min(99, Math.floor(total / 60));
    const reste = total % 60;
    return `${String(minutes).padStart(2, '0')}:${String(reste).padStart(2, '0')}`;
}

/**
 * Le minuteur, traduit en ce que l'afficheur doit montrer.
 *
 * La barre dit la **proportion écoulée**, pas un nombre de segments : un
 * minuteur n'a pas de crans, et prétendre le contraire aurait été un mensonge de
 * dessin. On réutilise donc la jauge continue de `barreDeSegments`, qui existe
 * déjà pour les horloges trop finement découpées — *une seule façon de dessiner
 * une barre.*
 */
export function composerMinuteur(
    minuteur: MinuteurAAfficher,
    couleurChoisie?: string,
): CompositionDuMinuteur {
    const restant = Math.max(0, Math.floor(minuteur.restant));
    const duree = Math.max(0, Math.floor(minuteur.duree));

    /*
      **La couleur choisie ne vaut que pour le temps qui coule.** Les dix
      dernières secondes et le zéro gardent les leurs : ce sont les seules
      choses que la table doit lire de l'autre bout de la pièce, et les rendre
      réglables reviendrait à permettre de les rendre indistinctes.
    */
    const couleur = restant <= 0
        ? COULEURS_DU_MINUTEUR.fini
        : restant <= SECONDES_CRITIQUES
            ? COULEURS_DU_MINUTEUR.critique
            : (couleurChoisie || COULEURS_DU_MINUTEUR.encours);

    /*
      La barre se remplit avec ce qui RESTE, et se vide en avançant. Une barre
      qui se remplit à mesure que le temps passe dirait l'inverse de ce que le
      chiffre annonce, et l'œil croit la barre avant de lire le chiffre.
    */
    return {
        text: enMinutesSecondes(restant),
        color: couleur,
        center: true,
        noScroll: true,
        draw: duree > 0 ? barreDeSegments(restant, duree, couleur) : [],
    };
}

/**
 * **Y a-t-il un minuteur à montrer ?**
 *
 * Non posé — durée nulle — il n'y a rien à afficher, et pousser un `00:00`
 * permanent occuperait un tour de rotation pour ne rien dire. Un minuteur
 * **arrivé à zéro**, lui, se montre : c'est précisément le moment qu'on attend.
 * Il ne disparaît qu'à la remise à zéro.
 */
export function ilYAUnMinuteur(etat: { timerDuration?: number }): boolean {
    return (etat.timerDuration ?? 0) > 0;
}

/** La largeur de la matrice, réexportée pour les tests de débordement. */
export const LARGEUR_DE_LA_MATRICE = LARGEUR;
