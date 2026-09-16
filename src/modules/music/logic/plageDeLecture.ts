/**
 * **La plage de lecture — ce qui, dans un morceau, se joue vraiment.**
 *
 * Demandée par David le 2026-09-16 : *« définir une plage dans un morceau qui
 * se jouerait en boucle ou pas »*. ⛔ **Elle était déjà promise par le guide et
 * par la doc d'analyse, et elle n'existait nulle part** : `MusicPad.loopA` et
 * `loopB` étaient déclarés, initialisés à `null` en cinq endroits, **écrits par
 * personne et lus par personne**. Le moteur ne connaissait que la boucle du
 * morceau entier.
 *
 * **Deux réglages, pas trois.** La plage dit *quoi* jouer, le bouton 🔁 de la
 * platine dit *si ça se répète* — ce qui donne les quatre comportements
 * attendus sans ajouter un seul contrôle :
 *
 * | | 🔁 allumé | 🔁 éteint |
 * |---|---|---|
 * | **sans plage** | le morceau entier tourne | il joue une fois |
 * | **avec plage** | la plage tourne | la plage joue une fois |
 *
 * Ce fichier ne contient que l'arbitrage — *validation et arithmétique se
 * testent, un `HTMLAudioElement` ne se teste pas.*
 */

export interface PlageDeLecture {
    /** Début de la plage, en secondes. */
    entree: number;
    /** Fin de la plage, en secondes. */
    sortie: number;
}

/**
 * La plus courte plage qu'on accepte, en secondes.
 *
 * En dessous, la boucle repasserait son temps à se rembobiner : le son
 * n'aurait pas le temps d'exister entre deux sauts, et la minuterie tournerait
 * en rond à pleine vitesse. *Une plage d'une durée nulle n'est pas une plage
 * vide, c'est une boucle infinie.*
 */
export const PLAGE_MINIMALE_SEC = 0.25;

/**
 * Valide un couple de points, et le rend borné à la durée du morceau.
 *
 * Rend `null` dès que la plage ne veut rien dire — et c'est **la** garde qui
 * compte : rendre une plage douteuse ferait jouer trois secondes d'un morceau
 * de six minutes, sans rien dire et sans qu'on sache pourquoi.
 *
 * `duree` est facultative parce qu'**elle est souvent inconnue au moment où on
 * pose les points** : les métadonnées d'un fichier fraîchement chargé ne sont
 * pas encore lues. Sans elle, on valide ce qu'on peut ; avec elle, on borne.
 */
export function plageValide(
    entree: number | null | undefined,
    sortie: number | null | undefined,
    duree?: number
): PlageDeLecture | null {
    if (entree === null || entree === undefined) return null;
    if (sortie === null || sortie === undefined) return null;
    if (!Number.isFinite(entree) || !Number.isFinite(sortie)) return null;

    const debut = Math.max(0, entree);
    let fin = sortie;

    if (Number.isFinite(duree) && (duree as number) > 0) {
        const duree_ = duree as number;
        // Une sortie au-delà de la fin du morceau n'est pas une erreur du
        // meneur : c'est un morceau remplacé sous un pad qui gardait ses
        // points. On borne plutôt que de refuser — *refuser rendrait la plage
        // muette, borner la rend approximative et visible.*
        fin = Math.min(fin, duree_);
        if (debut >= duree_) return null;
    }

    if (fin - debut < PLAGE_MINIMALE_SEC) return null;

    return { entree: debut, sortie: fin };
}

/**
 * Où placer la tête de lecture au moment de lancer.
 *
 * **La plage définit ce qui se joue** : lancer avec la tête hors de la plage
 * l'amène à l'entrée. Mais une position déjà **dans** la plage est respectée —
 * le meneur qui s'est placé à l'oreille dans son passage ne veut pas être
 * ramené au début parce qu'il a appuyé sur Lecture.
 *
 * Rend `null` quand il n'y a rien à faire, pour que l'appelant n'ait pas à
 * comparer des flottants lui-même.
 */
export function positionDeDepart(position: number, plage: PlageDeLecture | null): number | null {
    if (!plage) return null;
    if (position >= plage.entree && position < plage.sortie) return null;
    return plage.entree;
}

/**
 * Le délai avant le prochain rendez-vous avec la sortie de la plage, en
 * millisecondes — ou `null` s'il n'y en a pas.
 *
 * ⚠️ **Le plancher n'est pas une précaution, il est nécessaire.** Un délai de
 * zéro replanifie immédiatement, et si la tête de lecture ne bouge pas (piste
 * en tampon, morceau terminé, `currentTime` figé), les rendez-vous
 * s'enchaînent sans fin dans la même milliseconde. *Ce qui se replanifie
 * tout seul doit avoir un pas minimal.*
 */
export function delaiAvantLaSortie(position: number, plage: PlageDeLecture | null): number | null {
    if (!plage) return null;
    const reste = plage.sortie - position;
    return Math.max(10, reste * 1000);
}

/**
 * La plage a-t-elle été dépassée ?
 *
 * Séparé du calcul de délai parce que les deux questions n'ont pas la même
 * réponse au bord : à l'instant exact de la sortie, il n'y a plus de délai à
 * attendre **et** il faut boucler.
 */
export function sortieAtteinte(position: number, plage: PlageDeLecture | null): boolean {
    if (!plage) return false;
    return position >= plage.sortie;
}
