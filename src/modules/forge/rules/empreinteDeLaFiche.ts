/**
 * L'empreinte d'une fiche — **ce qui permet de savoir qu'on l'a corrigée.**
 *
 * **Le point 4 de l'axe O : la provenance se déduit, elle ne se déclare pas.**
 * Trois états — *générée / relue / corrigée* — dont le troisième n'est jamais
 * demandé au meneur : si le contenu diffère de l'empreinte enregistrée à la
 * génération, c'est qu'il a édité. *Un état qu'on demande est un état qu'on
 * oublie de mettre à jour.*
 *
 * **Et le point 5, qui est la vraie raison d'être de ce module.** Une reforge
 * qui retombe sur le même slug **écrase en place** — c'est le comportement
 * voulu tant que la fiche n'a pas été touchée, et c'est une perte silencieuse
 * dès qu'elle l'a été. Le plan le dit sans détour : *sans quoi le MJ cesse de
 * corriger.*
 *
 * **On empreinte le CORPS, jamais le frontmatter.** Marquer une fiche relue
 * réécrit sa tête : si l'empreinte la couvrait, relire une fiche la ferait
 * passer pour corrigée — et le dispositif qui doit protéger les corrections
 * prendrait sa propre trace pour une correction.
 */

/** La ligne du frontmatter qui porte l'empreinte. */
export const CLEF_EMPREINTE = 'empreinte';

/**
 * Le corps d'un markdown : tout ce qui suit le frontmatter.
 *
 * Un document sans frontmatter est **tout entier** son corps — c'est le cas des
 * notes et des décharges brutes, et elles n'ont pas à être traitées à part.
 */
export function corpsDeLaFiche(markdown: string): string {
    const frontmatter = /^---\r?\n[\s\S]*?\r?\n---\r?\n?/.exec(markdown);
    return frontmatter ? markdown.slice(frontmatter[0].length) : markdown;
}

/**
 * Une empreinte stable du corps, en hexadécimal.
 *
 * **FNV-1a, et non un hachage cryptographique.** On cherche à savoir si un
 * humain a édité un texte, pas à résister à quelqu'un qui voudrait nous
 * tromper : `crypto.subtle` est asynchrone et forcerait tout le chemin
 * d'écriture à le devenir, pour une garantie dont personne n'a besoin ici.
 *
 * Les fins de ligne sont normalisées et les blancs de bord retirés : un fichier
 * qui traverse Git sous Windows change de `\r\n` sans que personne ne l'ait
 * touché, et *une empreinte qui change toute seule accuse à tort.*
 */
export function empreinteDuCorps(markdown: string): string {
    const texte = corpsDeLaFiche(markdown).replace(/\r\n/g, '\n').trim();

    let hash = 0x811c9dc5;
    for (let i = 0; i < texte.length; i++) {
        hash ^= texte.charCodeAt(i);
        hash = Math.imul(hash, 0x01000193) >>> 0;
    }
    return hash.toString(16).padStart(8, '0');
}

/** L'empreinte déclarée par le frontmatter, si elle y est. */
export function empreinteDeclaree(markdown: string): string | null {
    const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---/.exec(markdown);
    if (!frontmatter) return null;

    const ligne = new RegExp(`^${CLEF_EMPREINTE}\\s*:\\s*(\\S+)\\s*$`, 'm').exec(frontmatter[1]);
    return ligne ? ligne[1] : null;
}

/**
 * Cette fiche a-t-elle été retouchée depuis sa génération ?
 *
 * **Rend `false` quand on ne sait pas**, et c'est délibéré : une fiche sans
 * empreinte — toutes celles d'avant ce jour — ne doit pas être traitée comme
 * corrigée. *Le doute penche du côté du comportement d'avant*, sans quoi la
 * nouveauté bloquerait des reforges qui marchaient hier.
 */
export function aEteRetouchee(markdown: string): boolean {
    const declaree = empreinteDeclaree(markdown);
    if (!declaree) return false;
    return declaree !== empreinteDuCorps(markdown);
}

export type ProvenanceDeLaFiche = 'generee' | 'relue' | 'corrigee' | 'inconnue';

/**
 * Les trois états de l'axe O, déduits et jamais demandés.
 *
 * **`corrigee` l'emporte sur `relue`** : une fiche que le meneur a éditée porte
 * sa marque de relecture, mais ce qui compte alors est qu'elle ne vient plus du
 * modèle.
 */
export function provenanceDeLaFiche(markdown: string): ProvenanceDeLaFiche {
    if (aEteRetouchee(markdown)) return 'corrigee';

    const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---/.exec(markdown);
    if (!frontmatter) return 'inconnue';

    const relu = /^relu\s*:\s*(true|false)\s*$/m.exec(frontmatter[1]);
    if (!relu) return 'inconnue';
    return relu[1] === 'true' ? 'relue' : 'generee';
}
