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


/**
 * **Ce que devient le fond quand un message d'image arrive.**
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⛔ LE DÉFAUT QUI A MENÉ ICI
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Le 2026-09-17, David : *« sur le Player Hub, peux-tu, sans qu'il n'y ait
 * conflit, projeter l'image de base de la campagne lorsque le Player Hub
 * n'affiche rien ? »*.
 *
 * **Ce décor existait déjà** — il est le repli de `fondDuPlayerHub` depuis
 * toujours, la campagne ouverte en a un, et il est bien diffusé au Hub. Mais
 * quatre endroits de `useHubSync` écrivaient :
 *
 * ```ts
 * setLiveImagePath(data || null);
 * ```
 *
 * Or arrêter une projection envoie une **chaîne vide**. `'' || null` vaut
 * **`null`**, c'est-à-dire *« écran éteint »* et non *« plus rien à montrer »* —
 * donc un écran noir, définitivement, au lieu du décor de la campagne.
 *
 * ⚠️ **Le correctif du 2026-09-13 avait traité le chemin qui avait fait mal, pas
 * la règle** : `FULL_RESET` posait déjà `undefined` — correctement —, et les
 * quatre autres chemins écrivaient toujours `null`. *La question « qui d'autre a
 * la même rustine à poser ? » n'avait pas été posée.*
 *
 * ⭐ ***Une distinction énoncée dans un commentaire et non tenue par une fonction
 * ne survit pas à son quatrième appelant.*** Elle tient désormais ici, à un seul
 * endroit, et les quatre appelants y passent.
 */
export function imageApresMessage(donnees: string | null | undefined): string | null | undefined {
    /*
      Une charge vide veut dire **« on ne montre plus rien »**, jamais « éteins
      l'écran ». Le vrai noir est un geste à part, explicite, qui passe par le
      message `BLACKOUT` — voir `noircirLePlayerHub`.
    */
    return donnees ? donnees : undefined;
}


/** Le minimum qu'on ait besoin de savoir d'une campagne pour en tirer son décor. */
export interface CampagneConnue {
    id: string;
    wallpaperUrl?: string | null;
}

/**
 * **Le décor de la campagne ouverte — envoyé si on l'a reçu, déduit sinon.**
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⛔ LE DÉFAUT QUI A MENÉ ICI
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Le 2026-09-17, David, après un premier correctif : *« l'image de fond
 * n'apparaît pas quand je lance le Player Hub »*.
 *
 * Le Hub lisait **un seul champ**, `activeCampaignWallpaper`, et ce champ est le
 * seul des deux qui **ne soit pas persisté** : au lancement il vaut `null`, et il
 * ne se remplit qu'à l'arrivée d'une synchronisation complète. Or ce que le Hub
 * possède déjà, **sur son disque**, suffisait :
 *
 * | Champ | Persisté ? |
 * | --- | --- |
 * | `activeCampaignId` | ✅ |
 * | `campaigns[].wallpaperUrl` | ✅ |
 * | `activeCampaignWallpaper` | ⛔ **non** |
 *
 * ⭐ ***La même vérité était DÉDUITE d'un côté et ATTENDUE de l'autre.*** Le
 * synchroniseur du meneur écrit `activeCampaign?.wallpaperUrl || …` — il déduit.
 * Le Hub, lui, attendait qu'on la lui envoie. *Un écran qui attend ce qu'il peut
 * calculer reste vide aussi longtemps que le réseau met à répondre.*
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⚠️ POURQUOI L'ENVOYÉ PASSE QUAND MÊME D'ABORD
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * La valeur envoyée est **déjà résolue** en adresse utilisable par n'importe quel
 * écran. Le repli local, lui, rend une **référence média** (`m-…`) : elle ne se
 * résout que dans une fenêtre qui partage la base du meneur — le Player Hub et le
 * projecteur, jamais une tablette servie depuis une autre origine.
 *
 * *Le repli comble une attente, il ne remplace pas le transport.*
 */
export function papierPeintDeLaCampagne(
    envoye: string | null | undefined,
    campagnes: readonly CampagneConnue[] | null | undefined,
    campagneOuverte: string | null | undefined,
): string | null {
    if (envoye) return envoye;
    if (!campagneOuverte || !campagnes) return null;

    const campagne = campagnes.find(c => String(c.id) === String(campagneOuverte));
    return campagne?.wallpaperUrl || null;
}
