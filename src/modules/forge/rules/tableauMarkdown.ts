/**
 * **La ligne de séparation d'un tableau Markdown** — une règle pour les quatre lecteurs du corpus
 * (catalogue, bestiaire, F4, liste de F3), posée le 07/11/2026.
 *
 * David, sur Cthulhu Hack : *« j'ai essayé de forger les équipements… et cela n'a pas
 * fonctionné »*. La fiche était bonne — cinquante objets en tableaux —, mais le carnet séparait
 * l'en-tête par `|:- |`, un seul tiret, ce que le Markdown accepte. Les quatre lecteurs exigeaient
 * `-{2,}` chacun de leur côté : aucun tableau, zéro objet, sans autre signe que « aucun tableau
 * d'équipement lisible ».
 *
 * La règle est **stricte sur la forme** plutôt que lâche sur le nombre de tirets : chaque case ne
 * contient que des tirets, deux-points et blancs. Une ligne de données qui commence par « -2 » n'est
 * pas une séparation.
 */
export function estUneLigneDeSeparation(ligne: string | undefined): boolean {
    if (!ligne) return false;
    const interieur = ligne.trim().replace(/^\|/, '').replace(/\|$/, '');
    const cases = interieur.split('|');
    return cases.length > 0 && cases.every(c => /^\s*:?-+:?\s*$/.test(c));
}
