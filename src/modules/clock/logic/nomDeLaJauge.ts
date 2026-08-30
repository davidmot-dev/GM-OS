/**
 * **Le nom d'une jauge qu'on vient de créer.**
 *
 * *Signalé par David le 2026-08-30 :* **« quand j'ajoute une jauge, son nom est
 * toujours Jauge 6, alors que je l'ai déclarée Impulsion »**.
 *
 * Le champ de saisie était non contrôlé et n'agissait que sur `Entrée` ; les
 * boutons `+4 / +6 / +8…` ne l'avaient jamais lu. *Deux chemins pour un même
 * geste, et un seul lisait ce que l'utilisateur avait écrit* — le motif habituel
 * du projet, cette fois côté saisie.
 *
 * La règle vit ici plutôt que dans le composant : elle tient en trois lignes,
 * mais c'est précisément le genre de trois lignes qu'un second bouton
 * réimplémente de travers six mois plus tard.
 */

/** Ce que propose le pupitre. Le premier est aussi ce que fait `Entrée`. */
export const SEGMENTS_PROPOSES = [4, 6, 8, 10, 12] as const;

/**
 * Ce que crée `Entrée`, faute de bouton choisi.
 *
 * Six, parce que c'était déjà le comportement du champ avant ce correctif :
 * *réparer une divergence ne doit pas changer le geste qui marchait.*
 */
export const SEGMENTS_PAR_DEFAUT = 6;

/**
 * Le nom retenu : celui qui a été saisi, sinon le libellé par défaut.
 *
 * **Le repli n'est pas un détail.** Un champ vide est le cas le plus courant —
 * on clique `+6` pour poser une jauge sans y penser — et une jauge sans nom ne
 * se distingue d'aucune autre dans la grille. Mieux vaut « Jauge 6 seg » que
 * rien.
 */
export function nomDeLaJauge(saisi: string, libelleParDefaut: string): string {
    return saisi.trim() || libelleParDefaut;
}
