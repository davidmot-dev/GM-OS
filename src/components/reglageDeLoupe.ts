/**
 * **Le réglage de la loupe de lecture, sans React.**
 *
 * Séparé du composant pour deux raisons. La première tient à l'outillage : un
 * fichier qui exporte à la fois un composant et des constantes casse le
 * rafraîchissement à chaud. La seconde est celle que ce dépôt suit partout
 * ailleurs — `jetonsDeTheme` à côté d'`AtelierDuTheme` : *ce qui se calcule
 * s'éprouve mieux loin de ce qui s'affiche.*
 */

/** La clé du confort de lecture, propre à cet appareil. */
export const CLE = 'gmos.loupe-lecture';

export const LOUPE_MIN = 0.7;
export const LOUPE_MAX = 3;
export const PAS = 0.1;

/**
 * Ramène un facteur dans les bornes, arrondi au dixième.
 *
 * L'arrondi n'est pas cosmétique : sans lui, dix pas de 0,1 donnent
 * 1,0999999999999999 et le pourcentage affiché part à la virgule.
 */
export function borner(facteur: number): number {
    const arrondi = Math.round(facteur * 10) / 10;
    return Math.min(LOUPE_MAX, Math.max(LOUPE_MIN, arrondi));
}

/**
 * Le dernier réglage de cet appareil, ou 1.
 *
 * ⚠️ **Lecture défensive.** Le hub et le projecteur partagent le `localStorage`
 * du meneur, et cette clé peut être lue par une fenêtre qui n'a pas de loupe.
 * Une valeur illisible ne doit jamais empêcher un document de s'afficher : on
 * retombe sur 1, taille normale.
 */
export function lireLeReglage(): number {
    try {
        const brut = window.localStorage.getItem(CLE);
        if (!brut) return 1;
        const n = Number(brut);
        return Number.isFinite(n) && n > 0 ? borner(n) : 1;
    } catch {
        return 1;
    }
}

/**
 * Retient le réglage, ou l'oublie sans bruit.
 *
 * Un stockage refusé — fenêtre privée, quota plein — ne doit pas empêcher de
 * lire : *un confort qui échoue ne casse jamais son écran.* La loupe marche
 * encore, elle ne se souviendra simplement pas.
 */
export function memoriser(facteur: number): void {
    try {
        window.localStorage.setItem(CLE, String(facteur));
    } catch {
        /* cf. ci-dessus : oublier est acceptable, échouer ne l'est pas. */
    }
}
