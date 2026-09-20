/**
 * **Ce qu'un moment fait d'Ambient-OS — le thème ET la scène.**
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LE MAILLON QUI MANQUAIT
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * David, le 2026-09-20 : *« dans le master storyboard, je ne peux pas choisir
 * le thème sur lequel je veux charger une ambiance d'Ambient-OS »*.
 *
 * ⛔ **Un moment ne savait dire que le MÉLANGE, jamais la MATIÈRE.** Ambient-OS
 * porte deux notions que rien ne reliait ici :
 *
 * | | Ce que c'est |
 * | :--- | :--- |
 * | **Le thème** (`presets`) | *quels sons* remplissent les huit pistes |
 * | **La scène** (`scenes`) | *à quel volume* ces huit pistes jouent |
 *
 * Une scène ne charge rien : elle pose des volumes sur ce qui se trouve là. Un
 * moment qui disait « Tension » l'appliquait donc au thème d'une scène
 * précédente — **ou à huit emplacements vides.**
 *
 * ⛔ **Et huit emplacements vides ne produisent aucune erreur.** Le magasin
 * n'allume une piste que si elle porte une adresse ; sans adresse, la boucle
 * passe. *Une ambiance qui ne sort pas ressemble à une ambiance discrète.*
 * C'est probablement l'incident sans trace du 13/09 — *« la séquence s'est mal
 * exécutée en séance : pas d'image projetée, lumières éteintes, ambiance
 * interrompue »*.
 */

/** Ce que le moment déclare côté ambiance — les deux champs sont facultatifs. */
export interface MomentDAmbiance {
    ambientThemeId?: string;
    ambientSceneId?: string;
}

/** L'ordre des gestes, décidé une fois pour toutes. */
export interface GesteDAmbiance {
    /** Le thème à charger d'abord, ou `null`. */
    themeId: string | null;
    /** La scène à appliquer ensuite, ou `null`. */
    sceneId: string | null;
    /**
     * Faut-il lancer les pistes du thème telles quelles ?
     *
     * ⭐ **Seulement quand aucune scène ne suit.** Un thème se charge **à
     * l'arrêt** dans Ambient-OS, et c'est voulu à l'écran : on prépare, puis on
     * lance. Mais un moment de storyboard est un **déclenchement** — *s'il ne
     * produit aucun son, il passe pour une panne.*
     *
     * ⛔ Et quand une scène suit, on ne lance **pas** : tout se mettrait à
     * sonner une seconde avant que la scène n'éteigne ce qu'elle n'a pas
     * demandé. *Un coup de tonnerre au mauvais moment est pire qu'un silence.*
     */
    jouerLeTheme: boolean;
}

/** L'ordre des gestes pour ce moment. */
export function gesteDAmbiance(moment: MomentDAmbiance | null | undefined): GesteDAmbiance {
    const themeId = moment?.ambientThemeId || null;
    const sceneId = moment?.ambientSceneId || null;

    return { themeId, sceneId, jouerLeTheme: themeId !== null && sceneId === null };
}

/** Le moment demande-t-il quelque chose à Ambient-OS ? */
export const demandeUneAmbiance = (geste: GesteDAmbiance): boolean =>
    geste.themeId !== null || geste.sceneId !== null;

/**
 * **Y a-t-il seulement de quoi jouer ?**
 *
 * ⚠️ La question se pose **après** le chargement du thème, et c'est elle qui
 * transforme un silence en message. Une piste compte dès qu'elle porte une
 * adresse — qu'elle sonne ou non est l'affaire de la scène.
 */
export const laMatiereEstPresente = (
    pistes: readonly { url?: string }[] | null | undefined,
): boolean => (pistes ?? []).some(p => Boolean(p?.url));
