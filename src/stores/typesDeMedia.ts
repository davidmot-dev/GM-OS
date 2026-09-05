import type { MediaType } from './useMediaStore';

/**
 * **Ce qu'un fichier est, et ce que le sélecteur accepte — une seule table.**
 *
 * Deux endroits répondaient chacun de leur côté, et se contredisaient :
 *
 * - `addMedia` classait le fichier **après** l'avoir reçu, avec sa propre liste
 *   d'extensions et **les images pour repli** — donc tout ce qu'il ne
 *   reconnaissait pas devenait une image, et n'affichait qu'une vignette
 *   cassée ;
 * - `MediaBrowser` fabriquait le filtre du sélecteur **avant**, par
 *   `allowedTypes.map(t => t + '/*')` — ce qui donne `document/*`, **qui n'est
 *   pas un type MIME**. Demander un document ouvrait donc un sélecteur dont le
 *   filtre ne désigne rien.
 *
 * *Un classement et un filtre qui ne parlent pas de la même chose finissent
 * toujours par se démentir.* Ils lisent désormais la même table.
 */

/** Ce que le Hub sait ranger comme document. */
export const EXTENSIONS_DE_DOCUMENT = [
    '.pdf', '.doc', '.docx', '.odt', '.txt', '.rtf', '.md', '.csv', '.json',
] as const;

const MIMES_DE_DOCUMENT = new Set([
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.oasis.opendocument.text',
    'application/rtf',
    'text/plain',
    'text/markdown',
    'text/csv',
    'application/json',
]);

/**
 * Les extensions d'image, en plus du préfixe MIME.
 *
 * **Le type d'un fichier n'est pas toujours renseigné.** Windows rend une
 * chaîne vide pour des formats qu'il ne connaît pas (`.jfif`, `.avif` selon les
 * versions), et sans cette liste ces images-là tomberaient dans le repli.
 */
const EXTENSIONS_D_IMAGE = [
    '.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.svg', '.avif',
    '.heic', '.heif', '.tif', '.tiff', '.ico', '.jfif',
] as const;

/**
 * Les extensions de vidéo, pour les mêmes raisons que celles d'image.
 *
 * Image-OS en a besoin **sans le fichier** : il ne garde qu'un identifiant et
 * un nom, jamais le blob. Reconnaître une vidéo à son nom est donc le seul
 * moyen d'afficher la bonne vignette avant de l'avoir chargée.
 */
export const EXTENSIONS_DE_VIDEO = [
    '.mp4', '.webm', '.mov', '.m4v', '.ogv', '.mkv', '.avi',
] as const;

const finitPar = (nom: string, extensions: readonly string[]) => {
    const minuscule = nom.toLowerCase();
    return extensions.some((ext) => minuscule.endsWith(ext));
};

/**
 * Le type sous lequel ranger un fichier.
 *
 * ⚠️ **Le repli est `document`, et non `image`.** Un fichier qu'on ne sait pas
 * classer rendait jusqu'au 2026-09-04 une vignette d'image cassée ; il rend
 * désormais une carte neutre qui affiche son extension. *Se tromper en le
 * disant vaut mieux que se tromper en le cachant.*
 */
export function typeDuFichier(file: { type?: string; name: string }): MediaType {
    const mime = file.type ?? '';

    if (mime.startsWith('audio/')) return 'audio';
    if (mime.startsWith('video/') || finitPar(file.name, EXTENSIONS_DE_VIDEO)) return 'video';
    if (mime.startsWith('image/') || finitPar(file.name, EXTENSIONS_D_IMAGE)) return 'image';
    if (MIMES_DE_DOCUMENT.has(mime) || finitPar(file.name, EXTENSIONS_DE_DOCUMENT)) return 'document';

    return 'document';
}

/**
 * La valeur de l'attribut `accept` du sélecteur de fichiers.
 *
 * Les trois familles média ont un préfixe MIME utilisable tel quel ; les
 * documents n'en ont pas, et se désignent par leurs extensions.
 */
export function filtreDeSelection(types?: readonly MediaType[]): string {
    if (!types || types.length === 0) return '*/*';

    return types
        .flatMap((type) => (type === 'document' ? [...EXTENSIONS_DE_DOCUMENT] : [`${type}/*`]))
        .join(',');
}

/**
 * Ce format s'affiche-t-il dans une fenêtre d'aperçu ?
 *
 * Le navigateur rend nativement les PDF et le texte brut. Les formats
 * bureautiques (`.doc`, `.docx`, `.odt`, `.rtf`) ne s'affichent pas : mieux
 * vaut le dire que montrer un cadre blanc.
 */
export function documentAffichable(nom: string): boolean {
    return finitPar(nom, ['.pdf', '.txt', '.md', '.csv', '.json']);
}

/**
 * Ce nom de fichier désigne-t-il une vidéo ?
 *
 * ⚠️ **Le nom, pas le type MIME.** Image-OS ne détient qu'un identifiant et un
 * nom ; le fichier lui-même vit dans le Media Hub. *Un pad doit savoir ce qu'il
 * montre avant d'avoir chargé quoi que ce soit,* sous peine d'afficher une case
 * vide le temps d'un aller-retour — ou pour toujours, si le chargement échoue.
 *
 * Le projecteur, lui, a le blob en main et se fie au type MIME : il est plus
 * sûr, et il l'a. *Chacun juge avec ce dont il dispose ; c'est la table des
 * extensions qui les empêche de se contredire.*
 */
export function estUneVideo(nom: string): boolean {
    return finitPar(nom, EXTENSIONS_DE_VIDEO);
}

/** L'extension d'un fichier, en majuscules, pour l'afficher. */
export function extensionDe(nom: string): string {
    const morceaux = nom.split('.');
    return morceaux.length > 1 ? morceaux[morceaux.length - 1].toUpperCase() : 'FICHIER';
}
