import { formeCanonique, cleDeComparaison, memeTag, distance } from './vocabulaireDesTags';

/**
 * **Ce que GM-OS devine d'un fichier qu'on vient de déposer.**
 *
 * ⭐ **La plupart des fichiers portent leur étiquette dans leur nom**, et
 * personne ne la retape : `taverne-nuit-pluie.jpg` dit trois choses, et il
 * arrivait dans la bibliothèque sans aucune. *Le travail était déjà fait, il
 * n'était simplement pas lu.*
 *
 * ⛔ **On propose, on ne pose jamais.** Un nom de fichier est un indice, pas
 * une déclaration : `IMG_4821.jpg` n'apprend rien, et `final_v2_corrigé.png`
 * apprend le contraire de ce qu'il dit. *Une étiquette fausse posée d'office
 * est pire qu'une absence d'étiquette : elle se retrouve dans un filtre.*
 *
 * ⚠️ **Et une proposition préfère TOUJOURS un mot du vocabulaire existant.**
 * Deviner `tavernes` quand la bibliothèque connaît déjà `taverne`, ce serait
 * fabriquer le doublon qu'on cherche à éviter — par automatisme, donc à
 * grande échelle.
 */

/**
 * Les mots qui ne disent rien d'un fichier.
 *
 * ⚠️ Ils sont là pour ce qu'ils **coûtent**, pas pour ce qu'ils sont : une
 * étiquette `img` sur trois cents fichiers est une étiquette qui ne sépare
 * rien, donc une ligne de plus dans une liste latérale déjà longue.
 */
const MOTS_VIDES = new Set([
    'img', 'image', 'photo', 'pic', 'dsc', 'dscn', 'screenshot', 'capture',
    'final', 'finale', 'copy', 'copie', 'new', 'nouveau', 'sans', 'titre',
    'untitled', 'export', 'rendu', 'version', 'def', 'ok', 'test', 'tmp',
    'the', 'and', 'for', 'les', 'des', 'une', 'aux', 'par', 'sur', 'avec',
    'wallpaper', 'fond', 'background', 'hd', 'full', 'max', 'min', 'web',
]);

/** Trois lettres : en dessous, un mot ne désigne rien qu'on puisse filtrer. */
const LONGUEUR_MINIMALE = 3;

/**
 * **Les mots qu'un nom de fichier contient vraiment.**
 *
 * On coupe sur tout ce qui n'est pas une lettre — tirets, soulignés, espaces,
 * points — et on jette les nombres : *une date ou un compteur n'est pas un
 * sujet.*
 */
export function motsDuNom(nom: string): string[] {
    const sansExtension = nom.replace(/\.[a-z0-9]{1,5}$/i, '');

    const mots = sansExtension
        .split(/[^\p{L}]+/u)
        .map(m => formeCanonique(m))
        .filter(m => m.length >= LONGUEUR_MINIMALE)
        .filter(m => !MOTS_VIDES.has(cleDeComparaison(m)));

    /* Dédoublonné en gardant l'ordre du nom : le premier mot d'un fichier est
       presque toujours son sujet. */
    const vus = new Set<string>();
    return mots.filter(m => {
        const cle = cleDeComparaison(m);
        if (vus.has(cle)) return false;
        vus.add(cle);
        return true;
    });
}

/**
 * **Le mot du vocabulaire existant qui correspond, ou le mot tel quel.**
 *
 * Exact d'abord, puis à une faute de frappe près. *C'est ce qui fait qu'un
 * import massif enrichit le vocabulaire au lieu de le diluer.*
 */
export function alignerSurLeVocabulaire(mot: string, connus: readonly string[]): string {
    const exact = connus.find(t => memeTag(t, mot));
    if (exact) return formeCanonique(exact);

    const cle = cleDeComparaison(mot);
    if (cle.length >= 4) {
        const proche = connus.find(t => distance(cle, cleDeComparaison(t)) <= 1);
        if (proche) return formeCanonique(proche);
    }
    return formeCanonique(mot);
}

export interface SourcesDeProposition {
    /** Le nom du fichier. */
    nom: string;
    /** Le dossier où on le range, s'il y en a un. */
    collection?: string | null;
    /** La campagne ouverte, s'il y en a une. */
    campagne?: string | null;
    /** Le vocabulaire déjà employé dans la bibliothèque. */
    connus?: readonly string[];
    /** Ce que le média porte déjà — on ne propose pas ce qui est là. */
    deja?: readonly string[];
}

/**
 * **Les étiquettes proposées pour un média, dans l'ordre où on les montre.**
 *
 * Le **nom du fichier** d'abord, parce que c'est lui qui parle du contenu ; la
 * **collection** et la **campagne** ensuite, parce qu'elles parlent du
 * rangement. *Un fichier rangé dans « Donjons » pour la campagne « Milo » est
 * probablement un donjon de Milo — mais on le propose, on ne l'affirme pas.*
 */
export function tagsProposes(sources: SourcesDeProposition, maximum = 6): string[] {
    const connus = sources.connus ?? [];
    const deja = sources.deja ?? [];

    const candidats = [
        ...motsDuNom(sources.nom ?? ''),
        ...(sources.collection ? [sources.collection] : []),
        ...(sources.campagne ? [sources.campagne] : []),
    ];

    const proposees: string[] = [];
    for (const brut of candidats) {
        const tag = alignerSurLeVocabulaire(brut, connus);
        if (!tag) continue;
        if (deja.some(d => memeTag(d, tag))) continue;
        if (proposees.some(p => memeTag(p, tag))) continue;
        proposees.push(tag);
        if (proposees.length >= maximum) break;
    }
    return proposees;
}
