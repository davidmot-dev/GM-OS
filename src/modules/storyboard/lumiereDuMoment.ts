/**
 * **Ce qu'une séquence laisse allumé derrière elle.**
 *
 * *Demandé par David le 2026-09-13 : « quand je passe d'une séquence à l'autre,
 * il faut respecter les paramètres de la scène suivante — s'il n'y a pas de
 * configuration pour la lumière, il faut retourner vers le "Home" de Light-OS.
 * Et quand j'arrête une séquence, il faut tout arrêter, sauf Light-OS qui va
 * vers son "Home". »*
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LA RÈGLE, EN UNE PHRASE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * ⭐ **Un moment décrit l'état complet de la table, pas ce qui change.** Ce
 * qu'il ne déclare pas doit revenir à son repos, au lieu de survivre du moment
 * précédent.
 *
 * Le son l'applique depuis le 2026-09-02 (`sonsDuMoment.ts`), l'image depuis le
 * 2026-08-31 (`cibleDeLImageDuMoment`). **La lumière était la dernière à ne pas
 * le faire** : `if (moment.lightSceneId)` appliquait une scène, et son absence
 * ne faisait rien du tout — la scène du moment précédent restait sur la pièce.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⛔ ON NE RAMÈNE QUE CE QUE LA SÉQUENCE A POSÉ
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * **Tranché par David le 2026-09-13**, et c'est la même doctrine que le son.
 * Un moment sans lumière ne renvoie au Home **que si la séquence avait elle-même
 * posé une scène**. Si le meneur a choisi son éclairage à la main puis
 * joue un moment qui ne parle pas de lumière, *son choix reste* : une séquence
 * muette sur un sujet n'a rien à dire dessus.
 *
 * ⚠️ **Le « Home » n'est pas la dernière scène choisie.** C'est
 * `revenirALEclairageNormal`, qui vise l'**éclairage normal désigné** —
 * `revertToManualScene` ramènerait la scène d'alerte qui jouait il y a trois
 * secondes, ce qui est exactement ce qu'on ne veut pas en sortant d'un moment.
 */

/** Ce qu'il faut faire de la lumière quand une séquence prend la main, ou s'arrête. */
export type GesteDeLumiere =
    /** La nouvelle séquence déclare une scène : on l'applique. */
    | 'appliquer'
    /** Elle n'en déclare pas, et la précédente en avait posé une : retour au Home. */
    | 'revenir-au-home'
    /** Rien à faire — personne n'a rien posé, ou le meneur règle à la main. */
    | 'rien';

/**
 * Ce que devient la lumière quand une séquence prend la main sur une autre.
 *
 * @param posee   la scène que la séquence en cours avait posée, ou `null`
 * @param annoncee la scène que la nouvelle séquence déclare, ou `null`
 */
export function ceQueLaPriseDeMainFaitALaLumiere(
    posee: string | null | undefined,
    annoncee: string | null | undefined,
): GesteDeLumiere {
    if (annoncee) return 'appliquer';
    return posee ? 'revenir-au-home' : 'rien';
}

/**
 * Ce que devient la lumière quand on arrête une séquence.
 *
 * ⭐ **Toujours le Home si la séquence avait posé une scène** — c'est le seul
 * point où la lumière se distingue du reste : *« tout arrêter, sauf Light-OS qui
 * va vers son Home »*. On ne laisse pas la pièce dans le noir d'un arrêt, ni
 * dans l'ambiance rouge du moment qu'on vient de fermer.
 */
export function ceQuUnArretFaitALaLumiere(posee: string | null | undefined): GesteDeLumiere {
    return posee ? 'revenir-au-home' : 'rien';
}
