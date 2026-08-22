/**
 * Marquer une fiche comme relue — **le geste qui manquait à la boucle.**
 *
 * **Le marqueur existait, écrit par trois endroits et lu par personne.**
 * `relu: false` part avec chaque fiche produite depuis des semaines ; le
 * 2026-08-22, **194 fiches** le portaient sans qu'aucun lecteur n'existe. C'est
 * le motif corrigé trois fois cette semaine — le libellé des portées, l'unité de
 * distance, le champ `moteur` — mais à l'échelle du corpus entier, et avec une
 * différence : *ici le champ ne finira pas faux, il est déjà sans effet.*
 *
 * **Ce que l'axe O appelle « la boucle de revue ».** Le journal des lacunes
 * attrape ce qui manque ; **rien n'attrape ce qui est faux**. Une fiche erronée
 * produit une recherche réussie, une citation confiante, et aucun signal — pire,
 * la citation renforce la confiance.
 *
 * **On relit à l'usage, pas en série.** Arbitrage de David du 2026-08-07 :
 * relire vraiment une fiche prend trois à cinq minutes, donc dix fiches forgées
 * créeraient trois quarts d'heure de lecture qui ne seront pas faits. *Toute
 * conception qui ignore ce calcul produit un rituel non tenu.* La fiche vient de
 * répondre à une question, le meneur a la question sous les yeux : c'est le seul
 * moment où il peut juger.
 */

/** Ce qu'une fiche déclare de sa relecture. */
export type EtatDeRelecture = 'relue' | 'non-relue' | 'sans-marque';

/**
 * L'état déclaré par un frontmatter, sans rien supposer.
 *
 * `sans-marque` n'est pas `non-relue` : un extrait brut, une décharge, une note
 * du meneur n'ont jamais prétendu être des fiches. *L'absence n'est pas un
 * zéro* — les afficher comme « non relues » ferait crier l'écran sur des
 * documents qui n'ont rien à se reprocher.
 */
export function etatDeRelecture(relu: boolean | undefined): EtatDeRelecture {
    if (relu === true) return 'relue';
    if (relu === false) return 'non-relue';
    return 'sans-marque';
}

/**
 * Réécrit le frontmatter d'une fiche pour la déclarer relue.
 *
 * **Ne touche QUE cette ligne.** Le reste du fichier — les autres champs, le
 * corps, jusqu'aux fins de ligne — sort tel qu'il est entré. C'est la même
 * discipline que la déclaration d'un corpus : *on ne réécrit pas un fichier
 * depuis ce qu'un seul écran en connaît.*
 *
 * Rend `null` quand il n'y a rien à faire — pas de frontmatter, pas de marque,
 * ou déjà relue. **Un appelant qui reçoit `null` n'écrit pas** : réécrire un
 * fichier identique à lui-même en change la date et fait mentir l'index.
 */
export function marquerCommeRelue(markdown: string): string | null {
    const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---/.exec(markdown);
    if (!frontmatter) return null;

    const ligne = /^relu\s*:\s*(true|false)\s*$/m.exec(frontmatter[1]);
    if (!ligne || ligne[1] === 'true') return null;

    /*
      **On remplace dans le frontmatter, pas dans le document.** Une fiche peut
      parfaitement contenir « relu: false » dans son corps — en citant une règle
      de revue, par exemple. Borner la substitution à la tête est ce qui empêche
      d'aller réécrire une phrase que quelqu'un a écrite exprès.
    */
    const teteCorrigee = frontmatter[1].replace(ligne[0], ligne[0].replace('false', 'true'));
    return markdown.replace(frontmatter[1], teteCorrigee);
}
