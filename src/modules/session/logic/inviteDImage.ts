import type { Clue } from '../../../types/chronicle.types';

/**
 * **Ce qu'on demande au générateur pour un indice.**
 *
 * *Demandé par David le 2026-09-15 : « est-ce que tu peux brancher le générateur
 * d'image IA sur la définition des indices ? ».*
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⭐ UN INDICE N'EST PAS UN PORTRAIT, ET PAS NON PLUS UN DÉCOR
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Les trois générateurs qui existaient — portrait de PNJ, carte d'atlas,
 * portrait de PJ — demandent tous une **illustration**. Un indice, non : c'est
 * un **objet qu'on pose devant un joueur**. La lettre tachée, la clef rouillée,
 * le badge d'accès.
 *
 * *Registre tranché par David : la **pièce à conviction**.* Gros plan, fond
 * neutre, éclairage qui montre la matière et l'usure — ce qu'on photographie
 * pour un dossier, pas ce qu'on peint pour une couverture.
 *
 * > **Ce que ça change concrètement** : une scène illustrée montre *où* l'indice
 * > a été trouvé ; une pièce à conviction montre **l'indice**. Le joueur doit
 * > croire qu'il pourrait le prendre en main.
 *
 * ⚠️ **On écarte explicitement le texte lisible.** Ces modèles écrivent des
 * lettres qui n'en sont pas : un parchemin couvert de faux mots attire l'œil
 * dessus et détruit l'illusion. *Mieux vaut un document dont on devine l'écriture
 * qu'un document dont on lit le charabia.*
 *
 * ⚠️ **En anglais, comme les trois autres.** Ce n'est pas un choix de style :
 * les modèles de diffusion disponibles ici comprennent nettement mieux
 * l'anglais, et *changer de langue pour ce seul générateur donnerait des
 * résultats visiblement moins bons sans que personne ne sache pourquoi.*
 */

/** Ce que l'invite a besoin de connaître d'un indice. Plus étroit que `Clue`. */
export type IndiceIllustrable = Pick<Clue, 'title' | 'content'>;

/**
 * ⚠️ **Le contenu est tronqué, comme pour les PNJ et les cartes.**
 *
 * Les trois générateurs existants coupent à 300 caractères, et pour une bonne
 * raison : au-delà, le modèle dilue la description dans les consignes de style
 * et rend une image générique. *Un prompt qui dit tout ne dit plus rien.*
 */
export const LONGUEUR_DU_CONTENU = 300;

/** Le texte d'un indice, mis à plat et borné. */
function enUneLigne(texte: string | undefined, maximum: number): string {
    return (texte ?? '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, maximum);
}

/**
 * **L'invite pour l'image d'un indice.**
 *
 * `instructions` remplace entièrement l'invite composée — c'est le geste offert
 * par `AIPromptOverlay`, et il vaut ici comme chez les PNJ : *le meneur qui prend
 * la plume doit obtenir ce qu'il a écrit, pas ce qu'il a écrit noyé dans ce que
 * nous aurions dit.*
 */
export function invitePourUnIndice(
    indice: IndiceIllustrable,
    instructions?: string,
): string {
    const ecrite = (instructions ?? '').trim();
    if (ecrite) return ecrite;

    const titre = enUneLigne(indice.title, 120) || 'an unidentified piece of evidence';
    const contenu = enUneLigne(indice.content, LONGUEUR_DU_CONTENU);

    return [
        `Evidence photograph of a single object: ${titre}.`,
        contenu,
        'Close-up on the object itself, neutral background, forensic lighting.',
        'Visible texture, wear and material detail. Photographic, sharp focus.',
        /* Voir l'en-tête : un faux texte attire l'œil et détruit l'illusion. */
        'No readable text, no lettering, no captions.',
    ].filter(Boolean).join(' ');
}
