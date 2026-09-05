import { estUneVideo } from '../../../stores/typesDeMedia';
import { videoDuMarqueur } from '../../web/youtube';

/**
 * **Ce qu'on projette : une image, une vidéo, ou une vidéo distante.**
 *
 * Écrit le 2026-09-05, sur un retour de David : *« la vidéo ne se lance pas sur
 * le Player Hub »*.
 *
 * ⛔ **Le Hub ne peut pas le deviner, et c'est le cœur du défaut.** Les écrans de
 * projection reçoivent un **identifiant de média** et vont chercher le fichier :
 * ils ont le type MIME sous la main. Le Hub, lui, reçoit une **adresse déjà
 * résolue** — `http://…/temp/m-1757…` — parce qu'une tablette ne peut pas lire
 * la base du meneur. Cette adresse **n'a pas d'extension**, et rien dedans ne
 * distingue un film d'une photographie.
 *
 * *Un destinataire qui ne peut pas déduire doit être informé.* Le meneur décide
 * donc ici, où il a la bibliothèque sous les yeux, et l'annonce dans le message.
 */

/** Ce que le Hub doit savoir dessiner. */
export type NatureDuMedia = 'image' | 'video' | 'youtube';

/** Le peu qu'on lit de la bibliothèque du Media Hub. */
interface FicheDeMedia {
    id: string;
    name: string;
    type: string;
}

/**
 * La nature de ce qu'on s'apprête à projeter.
 *
 * L'ordre des questions n'est pas indifférent :
 *
 * 1. **Le marqueur d'abord** — `__youtube__…` ne désigne aucun fichier, et le
 *    chercher dans la bibliothèque ne rendrait jamais rien.
 * 2. **La fiche du Media Hub ensuite** : c'est *lui* qui a classé le fichier à
 *    l'import, avec sa table d'extensions. *On recopie son verdict plutôt que
 *    d'en rendre un second — deux classements pour un même fichier finissent par
 *    se contredire.*
 * 3. **Le nom en dernier recours**, pour un chemin de disque qui n'est jamais
 *    passé par le Hub.
 */
export function natureDuMedia(
    chemin: string,
    bibliotheque: readonly FicheDeMedia[],
): NatureDuMedia {
    if (videoDuMarqueur(chemin)) return 'youtube';

    const fiche = bibliotheque.find((m) => m.id === chemin);
    if (fiche) return fiche.type === 'video' ? 'video' : 'image';

    return estUneVideo(chemin) ? 'video' : 'image';
}
