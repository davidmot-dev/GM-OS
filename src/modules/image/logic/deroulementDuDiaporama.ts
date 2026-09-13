import type { Diaporama, ImageMedia } from '../types';

/**
 * **Ce qui décide du déroulement d'un diaporama — sans écran et sans horloge.**
 *
 * Demandé par David le 2026-09-13 : *« pouvoir créer des diaporamas avec
 * plusieurs images et un fondu entre chacune d'entre elles »*.
 *
 * Tout ce qui se décide ici se décide **avant** que quoi que ce soit ne parte
 * vers un écran : quelles images composent réellement le diaporama, laquelle
 * vient ensuite, et combien de temps celle du moment reste. *Le reste — la
 * projection, le fondu, le minuteur — n'a plus de choix à faire.*
 */

/**
 * La durée d'affichage la plus courte qu'on accepte.
 *
 * ⛔ **Elle n'est pas une politesse, elle protège d'un écran illisible.** Le
 * fondu d'entrée dure `FONDU_DE_LIMAGE_MS` (700 ms) ; une cadence plus courte
 * que lui ferait partir chaque image **avant d'être entièrement apparue** — la
 * table ne verrait qu'un battement trouble, jamais une image. On garde une
 * seconde pleine au-delà du fondu.
 */
export const CADENCE_MINIMALE_MS = 1700;

/** Ce qu'un diaporama neuf propose : six secondes, la durée d'un plan qu'on regarde. */
export const CADENCE_PAR_DEFAUT_MS = 6000;

/**
 * **Les images réellement projetables d'un diaporama, dans l'ordre.**
 *
 * ⚠️ **Un média effacé de la bibliothèque est sauté, il n'arrête pas le
 * diaporama.** Le diaporama ne retient que des identifiants ; rien n'empêche le
 * meneur de supprimer une image qu'il y avait mise, des semaines plus tard.
 * *Un diaporama qui s'arrêterait sur un trou serait une panne en pleine séance
 * pour une suppression faite hors séance* — et le meneur n'aurait aucun moyen
 * de rattacher l'une à l'autre.
 *
 * Le trou se voit là où il se répare : dans l'écran du diaporama, qui compte ce
 * qu'il a. Il ne se voit jamais à la table.
 */
export function imagesDuDiaporama(
    diaporama: Diaporama,
    mediaList: readonly ImageMedia[],
): ImageMedia[] {
    const parId = new Map(mediaList.map(m => [m.id, m]));
    return diaporama.imageIds
        .map(id => parId.get(id))
        .filter((m): m is ImageMedia => m !== undefined);
}

/**
 * **L'index suivant — et il boucle.**
 *
 * Tranché par David le 2026-09-13 : *« il boucle »*. C'est ce qu'on attend d'un
 * décor — la table ne doit pas voir la fin d'un diaporama d'ambiance, et un
 * moment de storyboard dure ce qu'il dure, pas ce que dure la liste.
 *
 * `direction` sert aussi au feuilletage à la main (les flèches ◀ ▶ d'Image-OS,
 * qui pilotent désormais le diaporama en cours). *Reculer depuis la première
 * mène à la dernière, pour la même raison qu'avancer depuis la dernière mène à
 * la première.*
 */
export function indexSuivant(index: number, total: number, direction: 1 | -1 = 1): number {
    if (total <= 0) return 0;
    return ((index + direction) % total + total) % total;
}

/**
 * **Combien de temps l'image du moment reste à l'écran.**
 *
 * Une seule durée pour tout le diaporama — choix de David le 2026-09-13, contre
 * une durée par image : *deux réglages à poser, rien à régler image par image.*
 *
 * ⚠️ La borne est appliquée **ici, à la lecture**, et non à l'écriture du
 * réglage. Un diaporama importé, restauré d'une sauvegarde ancienne ou modifié
 * à la main peut porter n'importe quoi ; *une valeur n'est sûre que là où on
 * s'en sert.*
 */
export function cadenceDuDiaporama(diaporama: Pick<Diaporama, 'dureeParImageMs'>): number {
    const duree = Number(diaporama.dureeParImageMs);
    if (!Number.isFinite(duree)) return CADENCE_PAR_DEFAUT_MS;
    return Math.max(CADENCE_MINIMALE_MS, Math.round(duree));
}

/**
 * **Un diaporama peut-il tourner ?**
 *
 * Il lui faut **deux** images projetables. Avec une seule, il n'y a rien à
 * enchaîner : la projeter est un geste d'image, pas de diaporama — et faire
 * tourner un minuteur qui reprojette la même image toutes les six secondes
 * rejouerait son fondu d'entrée, donc **ferait clignoter un décor fixe**.
 */
export function peutTourner(images: readonly ImageMedia[]): boolean {
    return images.length >= 2;
}
