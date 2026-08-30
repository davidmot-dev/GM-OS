/**
 * **Se placer dans un morceau — la conversion d'un clic en secondes.**
 *
 * Quatre lignes, isolées parce que c'est exactement là qu'un défaut se loge :
 * un clic à gauche du cadre donne un décalage négatif, un cadre de largeur nulle
 * — l'instant où la platine vient d'apparaître — donne une division par zéro.
 * `audioElement.currentTime = NaN` **lève une exception**, et `= -3` est ignoré
 * en silence : le curseur bougerait et la lecture resterait où elle est.
 */

export interface CadreDeLaBarre {
    left: number;
    width: number;
}

/**
 * L'instant de la piste visé par un pointeur, borné à la piste.
 *
 * Rend `0` quand rien n'est mesurable — pas de largeur, pas de durée — plutôt
 * qu'un `NaN` qui traverserait tout le chemin jusqu'à lever au dernier étage.
 */
export function secondesAuPointeur(
    clientX: number,
    cadre: CadreDeLaBarre,
    dureeSec: number,
): number {
    if (!Number.isFinite(dureeSec) || dureeSec <= 0) return 0;
    if (!Number.isFinite(cadre.width) || cadre.width <= 0) return 0;
    if (!Number.isFinite(clientX)) return 0;

    const fraction = (clientX - cadre.left) / cadre.width;
    return Math.min(1, Math.max(0, fraction)) * dureeSec;
}

/**
 * Le pas d'un déplacement au clavier.
 *
 * Cinq secondes pour parcourir, une seule avec `Shift` pour caler précisément —
 * *« commencer à mon moment précis »* était la demande, et cinq secondes ne
 * suffisent pas à tomber sur une mesure.
 */
export function pasDuClavier(avecShift: boolean): number {
    return avecShift ? 1 : 5;
}
