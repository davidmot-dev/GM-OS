/**
 * **Les dés de ressource, qui s'usent** — Cthulhu Hack, demandé par David le
 * 2026-09-30.
 *
 * Une Ressource (Torche, Bagou, Santé mentale, Matériel…) est un dé. On le
 * lance quand on la sollicite : **un 1 ou un 2 la fait descendre d'un cran** —
 * d12 → d10 → d8 → d6 → d4 → épuisée. Le Matériel peut partir du d20 (« Bornes
 * d20 à épuisement », corpus du jeu) ; les autres plafonnent au d12.
 *
 * L'échelle vit ici, **une seule fois** : l'écran, le moteur et les essais la
 * lisent, aucun ne la recopie.
 */
export const ECHELLE_D_USURE = [20, 12, 10, 8, 6, 4] as const;

/** Les dés qu'une ressource peut être, du plus petit au plus grand — pour les choisir. */
export const DES_D_USURE = [...ECHELLE_D_USURE].reverse();

/** Un 1 ou un 2 fait descendre le dé. */
export function faitDescendre(valeur: number): boolean {
    return valeur <= 2;
}

/**
 * Le dé d'un cran plus bas, ou `null` quand la ressource s'épuise (sous le d4).
 * Un dé hors de l'échelle (un d100) n'a pas de cran : `null` aussi — mieux vaut
 * dire « épuisé » que d'inventer un dé.
 */
export function deDUnCranPlusBas(faces: number): number | null {
    const i = ECHELLE_D_USURE.indexOf(faces as typeof ECHELLE_D_USURE[number]);
    if (i < 0 || i === ECHELLE_D_USURE.length - 1) return null;
    return ECHELLE_D_USURE[i + 1];
}
