import { aiService } from '../../ai/AIService';
import { SCHEMA_DE_L_EFFET, ETAPES_MAXIMUM, type EffetPropose } from './effetPropose';
import { DUREE_MINIMALE_MS } from './effetDAtelier';

/**
 * **Demander une suite d'étapes à l'IA, à partir d'une phrase.**
 *
 * Demandé par David le 2026-09-20, dans la foulée de l'atelier : *« rajoute la
 * possibilité de se faire aider par l'IA comme fait précédemment »*. Le patron
 * est celui du § 89 — schéma imposé au décodeur, `sansPersona`, et **rien
 * n'est écrit tant que le meneur n'a pas dit oui.**
 *
 * ⭐ **Et c'est ici que le modèle vaut le plus cher de tout Light-OS.** Composer
 * une ambiance, c'était choisir une couleur par lampe ; composer un effet,
 * c'est trouver un **rythme** — deux éclairs rapprochés puis vingt secondes de
 * calme. *Le meneur sait ce qu'il veut entendre bien avant de savoir en quels
 * nombres ça s'écrit.*
 */

/**
 * **L'invite — et l'ordre compte, comme toujours.**
 *
 * ⭐ *Ce qui décide du COMPTE s'énonce avant ce qui décide du CONTENU.* Ici le
 * compte, ce sont les **bornes** : elles sont la seule chose qu'un modèle ne
 * peut pas deviner, et la seule dont la violation ne se voit pas à l'œil — une
 * étape de 20 ms ne paraît pas fausse, elle noie le pont.
 */
const INVITE_SYSTEME = `Tu composes un effet lumineux pour une lampe connectée, dans un outil de jeu de rôle.

UN EFFET EST UNE SUITE D'ÉTAPES, JOUÉE EN BOUCLE. Chaque étape dit où va la lampe, et en combien de temps.

BORNES — la partie la plus importante, elles ne se négocient pas :
- "etapes" : de 2 à ${ETAPES_MAXIMUM} entrées. En dessous de deux, rien ne bouge.
- "duree" : un entier en MILLISECONDES, au minimum ${DUREE_MINIMALE_MS}. C'est le temps passé sur l'étape, fondu compris.
- "fondu" : un entier en MILLISECONDES, entre 0 et la "duree" de la MÊME étape. Jamais plus.
- "brillance" : un entier de 0 à 100, en pourcentage. 0 éteint la lampe pour la durée de l'étape.
- "couleur" : un hexadécimal et rien d'autre — "#ff9a3c". Jamais un nom de couleur.
- "alea" : un entier de 0 à 100.

CE QUE CHAQUE RÉGLAGE PRODUIT :
- fondu = 0 : la lampe change D'UN COUP. C'est ce qu'il faut pour un éclair, un flash, un gyrophare.
- fondu = duree : la lampe GLISSE sans jamais s'arrêter. C'est ce qu'il faut pour une respiration, un lever de soleil, une dérive.
- brillance = 0 sur une étape courte : un NOIR franc entre deux flashes. C'est ce qui donne le rythme.
- "alea" secoue la brillance et la durée de chaque passage. À 0 l'effet est un métronome ; vers 30 il devient vivant ; au-delà de 60 il part dans tous les sens.

COMMENT COMPOSER :
- Cherche le GESTE, pas la couleur moyenne. Ce qu'on reconnaît d'un orage, c'est le contraste entre l'éclair et l'attente — pas la teinte du ciel.
- Une suite dont toutes les étapes durent pareil sonne comme une machine. Les durées inégales font le naturel.
- Une flamme, une bougie, un feu : des étapes courtes, des couleurs proches, un alea haut.
- Un orage, un gyrophare, une alarme : des étapes très courtes et très contrastées, un alea bas — leur rythme EST leur identité.
- Une respiration, une aube, un abysse : peu d'étapes, longues, fondu égal à la durée, alea bas.

ENFIN :
- "nom" : deux à quatre mots, en français. Le nom de l'effet, pas la demande recopiée.
- "justification" : UNE phrase, en français, qui dit ce qu'on voit dans la pièce.

Réponds en JSON strict, sans commentaire.`;

/**
 * **Composer un effet à partir de la demande du meneur.**
 *
 * `sansPersona` : c'est une composition structurée, pas une prise de parole de
 * meneur — ni la voix de la campagne ni le RAG n'ont rien à y faire.
 *
 * ⚠️ **Rien n'est écrit.** La fonction rend une proposition ; l'écran la
 * montre, et c'est le meneur qui remplace ses étapes ou refuse. *L'atelier
 * enregistre en continu et n'a pas d'annulation : écraser d'office effacerait
 * son travail sans retour.*
 *
 * @throws si le modèle est injoignable ou rend une réponse illisible —
 *         l'appelant le dit à l'écran, *un geste sans effet passe pour une
 *         panne.*
 */
export async function proposerUnEffet(demande: string): Promise<EffetPropose> {
    const propre = demande.trim();
    if (!propre) throw new Error('DEMANDE_VIDE');

    return aiService.generateJSON<EffetPropose>(
        `EFFET DEMANDÉ : ${propre}`,
        INVITE_SYSTEME,
        undefined,
        {
            sansPersona: true,
            schema: SCHEMA_DE_L_EFFET as unknown as Record<string, unknown>,
            libelle: `Effet lumineux — ${propre.slice(0, 40)}`,
        },
    );
}
