/**
 * **Retrouver un effet parmi cinquante.**
 *
 * David, le 2026-09-18, après avoir essayé ses premières ambiances : *« je pense
 * que la liste déroulante n'est plus adaptée avec 40 items, je pense qu'il faut
 * passer par un écran volant. »*
 *
 * Il a raison, et le compte lui donne doublement raison : le catalogue porte
 * **48 effets**, rangés en six groupes, auxquels s'ajoutent ses ambiances. ⭐ *Une
 * liste déroulante de cinquante entrées n'est plus une liste, c'est un couloir* —
 * on y descend, on dépasse ce qu'on cherchait, on remonte.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QUE LA RECHERCHE DOIT TROUVER
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Le nom affiché, évidemment. Mais aussi **l'identifiant technique** — un meneur
 * qui a lu le guide tape parfois `aube-doree` — et, pour une ambiance, **le nom
 * de l'effet dont elle descend** : chercher « torche » doit ramener « Torche qui
 * faiblit » *et* la « Torche bleue » qu'on en a tirée. *Sinon la copie se perd
 * derrière son propre nom.*
 *
 * ⚠️ **Sans accent et sans casse.** « Aurore Boréale » se cherche « aurore
 * boreale », et personne ne va chercher la touche de l'accent aigu au milieu
 * d'une partie. C'est la même règle que l'Oracle, qui déaccentue le mot cherché.
 */

/** Une entrée cherchable, qu'elle vienne du catalogue ou du meneur. */
export interface EffetCherchable {
    /** `stores`, ou `variante:v-178…`. */
    valeur: string;
    /** Le nom tel qu'il s'affiche. */
    nom: string;
    /** Pour une ambiance : le nom de l'effet d'origine. */
    origine?: string;
}

/** Minuscules, sans accents — la forme sous laquelle on compare. */
export function nu(texte: string): string {
    return texte
        .normalize('NFD')
        .replace(/\p{Mn}/gu, '')
        .toLowerCase()
        .trim();
}

/**
 * Filtre une liste d'effets par ce que le meneur a tapé.
 *
 * Une recherche vide rend **tout**, dans l'ordre reçu : l'écran doit pouvoir
 * s'ouvrir sur le catalogue entier sans cas particulier.
 */
export function chercherUnEffet<T extends EffetCherchable>(
    effets: readonly T[],
    recherche: string,
): T[] {
    const mots = nu(recherche).split(/\s+/).filter(Boolean);
    if (mots.length === 0) return [...effets];

    return effets.filter(e => {
        /* Les trois champs sont concaténés : un mot peut tomber dans l'un et le
           suivant dans l'autre, et c'est très bien — « torche bleue » doit
           trouver une ambiance nommée « bleue » tirée de « Torche ». */
        const foin = nu(`${e.nom} ${e.valeur} ${e.origine ?? ''}`);
        return mots.every(mot => foin.includes(mot));
    });
}
