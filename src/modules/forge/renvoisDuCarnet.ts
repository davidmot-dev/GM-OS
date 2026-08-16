/**
 * Les renvois internes du carnet, retirés localement.
 *
 * **Constaté sur la charge réelle du 2026-08-15, l'inventaire de « Le secret de
 * Milo ».** Malgré la consigne, NotebookLM a truffé sa réponse de ses numéros de
 * référence internes : « … un riche collectionneur excentrique amnésique, Milo
 * Torricelli [1-4]. Ils doivent ensuite traquer la sororité … [3, 5, 6] ».
 *
 * **Ces nombres ne désignent rien hors du carnet.** Ils numérotent ses sources
 * *dans la conversation qui vient d'avoir lieu*, et cette numérotation change
 * d'une requête à l'autre. Une fiche qui les conserve porte donc des citations
 * qui ressemblent à des références et n'en sont pas — le défaut exact des
 * numéros de page, qui a valu au corpus de règles neuf fiches citant au-delà de
 * la dernière page du livre. *Les uns comme les autres sont faux une fois sortis
 * d'ici.*
 *
 * **Pourquoi on les retire au lieu de le redemander.** La consigne a été
 * renforcée dans l'invite, et c'est le bon geste — *le levier est l'invite* —
 * mais l'insertion de ces renvois n'est pas une réponse du modèle : c'est le
 * système de citation du carnet, appliqué après coup. On ne peut pas compter sur
 * une invite pour désarmer quelque chose que le modèle n'écrit pas lui-même.
 */

/**
 * Un renvoi du carnet : des chiffres, des virgules et des tirets entre crochets.
 *
 * **Volontairement étroit.** `[1-4]`, `[3, 5, 6]`, `[9, 47-51]` — rien d'autre.
 * Un crochet contenant la moindre lettre est laissé en place : le corpus est
 * plein de markdown légitime, et *retirer trop est pire que retirer trop peu*
 * puisque la perte, elle, est muette.
 */
const RENVOI = /\s*\[\d+(?:\s*[-–,]\s*\d+)*\]/g;

/** Le texte du carnet, débarrassé de ses renvois internes. */
export function retirerLesRenvoisDuCarnet(texte: string): string {
    return texte
        .replace(RENVOI, '')
        // Le renvoi précède souvent la ponctuation finale : « … Torricelli [1-4]. »
        // Sans cette passe, on laisserait une espace avant le point.
        .replace(/ +([.,;:!?…])/g, '$1')
        .replace(/[ \t]+$/gm, '');
}

/** Combien de renvois un texte porte — pour le dire à l'écran plutôt que d'agir en silence. */
export function compterLesRenvois(texte: string): number {
    return texte.match(RENVOI)?.length ?? 0;
}
