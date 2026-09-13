/**
 * **Ce que l'écran des joueurs montre derrière les cartes.**
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⛔ TROIS ÉTATS, ET LEUR DISTINCTION N'ÉTAIT ÉCRITE NULLE PART
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Le fond du Player Hub tenait dans un ternaire d'une ligne, sans un mot
 * d'explication :
 *
 * ```ts
 * const backgroundPath = liveImagePath !== undefined
 *     ? liveImagePath
 *     : (activeHubId || activeCampaignWallpaper);
 * ```
 *
 * Il porte pourtant **trois** cas, et la nuance entre deux d'entre eux décide de
 * ce que voient les joueurs :
 *
 * | `imageEnDirect` | Ce que le fond devient |
 * | --- | --- |
 * | `undefined` | **rien n'est projeté** → le décor reprend la main |
 * | `null` | **la projection a été éteinte** → écran noir, délibérément |
 * | une adresse | cette image, assombrie derrière les cartes |
 *
 * ⭐ *`undefined` et `null` ne veulent pas dire la même chose ici* — l'un est
 * une absence, l'autre une décision. Un ternaire ne le disait pas.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QUE ÇA A COÛTÉ
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * `Ctrl+0`, livré le 2026-09-13, envoyait un `FULL_RESET` qui posait **`null`**.
 * David voulait fermer la carte de projection ; **tout l'écran passait au
 * noir**, décor compris. Il l'a vu tout de suite : *« je voulais que la fenêtre
 * encadrée en rouge se ferme, pas le background derrière cette fenêtre »*.
 *
 * ⚠️ Et j'avais affirmé la veille que le fond restait, en le déduisant d'une
 * règle voisine (`imageAvantLeMoment`) **au lieu de lire cette ligne**. *Une
 * doctrine juste appliquée au mauvais endroit reste une erreur.*
 */

export interface EtatDuFond {
    /** Ce que le meneur projette en ce moment : `undefined` = rien, `null` = éteint. */
    imageEnDirect: string | null | undefined;
    /** La projection en cours vers le Hub, telle que le magasin la connaît. */
    projectionVersLeHub?: string | null;
    /** Le papier peint de la campagne ouverte — le décor par défaut. */
    papierPeintDeLaCampagne?: string | null;
}

/**
 * L'adresse à dessiner en fond, ou `null` pour un écran noir.
 *
 * ⛔ **`undefined` doit retomber sur le décor, pas sur le noir.** C'est tout
 * l'objet de cette fonction : *une absence de projection n'est pas une
 * extinction*, et confondre les deux vide l'écran des joueurs au milieu d'une
 * scène.
 */
export function fondDuPlayerHub(etat: EtatDuFond): string | null {
    if (etat.imageEnDirect !== undefined) return etat.imageEnDirect;

    return etat.projectionVersLeHub || etat.papierPeintDeLaCampagne || null;
}
