import type { HueLight, HueLightState } from '../useLightStore';

/**
 * **Rendre la pièce après un essai — la quatrième porte du retour.**
 *
 * ⚠️ Il en existait **trois**, et le dépôt répète qu'il ne faut pas les
 * aligner : le retour automatique vise la dernière scène choisie puis
 * l'éclairage normal, le *Stop All* vise l'éclairage normal **directement**, et
 * l'extinction d'urgence ne vise rien — elle éteint. Voir
 * `troisPortesDuRetour.test.ts`.
 *
 * ⛔ **Aucune des trois ne convient ici, et s'en servir ferait un dégât
 * précis.** Un essai se lance en **préparant** une scène — un dimanche
 * après-midi, à côté de quelqu'un qui lit. Les trois portes retombent sur une
 * *scène* ; quand aucune n'a jamais été jouée et qu'aucun éclairage normal
 * n'est désigné, elles **éteignent la pièce**. *Essayer une ambiance ne peut
 * pas laisser la pièce plus sombre qu'on l'a trouvée.*
 *
 * D'où une quatrième visée, qui n'appartient qu'à l'essai : **ce que la pièce
 * montrait juste avant**. Elle ne se confond avec aucune des trois, et c'est ce
 * qui justifie qu'elle existe.
 */

/**
 * **La photographie de la pièce au moment où l'essai commence.**
 *
 * Elle porte les deux réponses possibles, parce qu'on ne sait pas encore
 * laquelle servira : la scène qui jouait (elle seule sait rendre les *effets*),
 * et à défaut le miroir des lampes.
 */
export interface PieceAvantLEssai {
    /** La scène qui jouait, s'il y en avait une. */
    sceneActive: string | null;
    /** Le miroir des lampes, en brillance **nominale**. */
    etats: Record<string, HueLightState>;
}

/**
 * ⛔ **Les états sont COPIÉS, jamais empruntés.** L'essai écrit dans le miroir
 * à chaque lampe qu'il pose (`setLightState` appelle `updateLightState`) : une
 * photographie qui garderait les objets du magasin se mettrait donc à jour
 * toute seule, et rendrait à la fin exactement l'ambiance dont on voulait
 * sortir. *Une photographie qui change avec son sujet n'est pas une
 * photographie.*
 */
export function photographierLaPiece(
    lampes: Record<string, HueLight>,
    sceneActive: string | null,
): PieceAvantLEssai {
    const etats: Record<string, HueLightState> = {};
    for (const [id, lampe] of Object.entries(lampes)) etats[id] = { ...lampe.state };
    return { sceneActive, etats };
}

/** Les deux façons de rendre la pièce, et elles ne coûtent pas la même chose. */
export type RetourDEssai =
    /** Rejouer la scène : elle seule rallume les **effets** qui tournaient. */
    | { rejouer: string }
    /** Reposer le miroir : il n'y avait pas de scène à qui redonner la main. */
    | { reposer: Record<string, HueLightState> };

/**
 * **Ce qu'il faut rejouer pour rendre la pièce.**
 *
 * La scène d'abord, parce qu'elle porte ce que le miroir ne porte pas : une
 * lampe qui *battait* redevient une lampe qui bat, là où reposer son dernier
 * état la figerait sur l'image d'un battement.
 *
 * ⚠️ Et on vérifie qu'elle existe encore. Rien n'interdit d'effacer une tuile
 * pendant qu'un essai tourne ; `applyScene` sur une scène disparue **ne fait
 * rien du tout** et la pièce resterait sur l'essai, sans message. *Un retour
 * qui échoue en silence est pire que pas de retour.*
 */
export function retourDeLEssai(
    avant: PieceAvantLEssai,
    scenes: Record<string, unknown>,
): RetourDEssai {
    if (avant.sceneActive && scenes[avant.sceneActive]) return { rejouer: avant.sceneActive };
    return { reposer: avant.etats };
}
