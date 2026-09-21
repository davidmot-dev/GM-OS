/**
 * **Une vidéo boucle-t-elle ?**
 *
 * David, le 2026-09-21, après avoir éprouvé la projection : *« c'est bien que
 * cela boucle, mais je voudrais avoir le choix »*. La question traînait au
 * registre depuis le 2026-09-05, à l'état de *choix à confirmer* — la boucle
 * était le comportement d'origine, jamais décidé.
 *
 * ⛔ **Cette règle existe parce que DEUX lecteurs la posent.** La fenêtre de
 * projection (`ProjectorView`) et le fond du Player Hub (`FondProjete`) rendent
 * chacun leur `<video>`. *Deux lecteurs d'une même vérité finissent toujours
 * par diverger* — et la divergence serait ici particulièrement absurde : la
 * même vidéo bouclant sur le moniteur et s'arrêtant sur l'écran de la table.
 *
 * ⭐ **L'absence vaut BOUCLE**, et c'est ce qui compte le plus dans ce fichier.
 * Toutes les vidéos déjà rangées dans la bibliothèque n'ont pas ce champ : les
 * lire comme « joue une fois » changerait le comportement de toutes les
 * ambiances existantes d'un coup, sans que personne ne l'ait demandé. *Un champ
 * neuf ne doit jamais rendre faux ce qui marchait avant lui.*
 */

/** Ce que la règle a besoin de savoir d'un média — et rien de plus. */
export interface VideoBouclable {
    /** `undefined` sur tout ce qui a été importé avant ce réglage. */
    boucler?: boolean;
}

/**
 * **La boucle d'une vidéo, absence comprise.**
 *
 * Seul un `false` explicite arrête la lecture : c'est un choix que le meneur a
 * posé. Tout le reste — `true`, `undefined`, un média introuvable — boucle.
 */
export const laVideoBoucle = (media: VideoBouclable | null | undefined): boolean =>
    media?.boucler !== false;

/** Ce que vaut le réglage après un clic sur l'interrupteur. */
export const boucleApresBascule = (media: VideoBouclable | null | undefined): boolean =>
    !laVideoBoucle(media);
