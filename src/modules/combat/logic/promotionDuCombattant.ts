/**
 * **Ce qu'il faut savoir pour ranger un combattant ailleurs.**
 *
 * *Demandé par David le 2026-09-03, en lisant la fiche d'un adversaire fabriqué :
 * « rajoute un bouton pour l'envoyer au Bestiaire ou à la campagne ».*
 *
 * Deux règles seulement, mais chacune évite un désagrément qui se découvrirait
 * plus tard.
 */

/**
 * Le nom sous lequel ranger un exemplaire — **sans son numéro de série**.
 *
 * L'atelier numérote les exemplaires d'un groupe : « Tireur 1 », « Tireur 2 ».
 * Ranger le second sous ce nom-là remplirait le bestiaire de « Tireur 2 »,
 * « Garde 3 », « Pillard 4 » — *un bestiaire dont les noms portent des numéros
 * d'exemplaires ne se relit pas.* On retire donc le numéro final, et lui seul :
 * un « Chien à deux têtes » garde ses deux têtes.
 */
export function nomDeGabarit(nom: string): string {
    /* On coupe les espaces AVANT de chercher le numéro : sans cela, « Pillard 4 »
       suivi d'une espace ne correspond plus, et le numéro reste. */
    const propre = nom.trim();
    return propre.replace(/\s+\d+$/, '').trim() || propre;
}

/**
 * D'où vient un combattant fabriqué, quand il vient de l'atelier.
 *
 * **Porté par le combattant lui-même, et c'est le point.** L'archétype et le
 * rang sont connus au moment de la fabrique et perdus dès qu'on ferme
 * l'atelier ; sans eux, ranger l'adversaire au bestiaire obligerait à les
 * redemander — ou à inventer « quelconque / piétaille » pour un boss.
 *
 * *Une information qu'on possède à la seconde où on la produit ne se redemande
 * pas plus tard : elle voyage.*
 */
export interface OrigineFabriquee {
    archetypeId: string;
    rangId: string;
}

/** L'origine d'un combattant, ou le repli neutre s'il n'a pas été fabriqué. */
export function origineOuDefaut(origine: OrigineFabriquee | undefined): OrigineFabriquee {
    return origine ?? { archetypeId: 'quelconque', rangId: 'pietaille' };
}
