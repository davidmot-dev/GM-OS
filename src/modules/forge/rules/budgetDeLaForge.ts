import { CHARS_PER_TOKEN, estimateTokens } from '../../../../electron/ragSelection';

/**
 * Ce que la Forge peut réellement envoyer — **et ce qu'elle a dû laisser.**
 *
 * **Axe E.4 du plan du 2026-08-07 : « plafonner `MAX_TEXT_CHARS` sur le `num_ctx`
 * réel, et avertir dans l'UI quand un document est écarté ».** Le plan décrivait
 * un plafond ; le code en portait trois défauts, et deux étaient muets.
 *
 * 1. **Le plafond était écrit en dur** — `100000` caractères, sans aucun rapport
 *    avec la fenêtre du modèle. Sur un `num_ctx` de 16 384, cela représente
 *    environ quatre fois ce qui peut entrer : *on payait le temps d'envoyer un
 *    texte dont les trois quarts allaient être coupés par le décodeur.*
 * 2. **Le dernier document passait quand même.** La garde valait « si le cumul
 *    est SOUS le plafond, ajoute le document ENTIER » : un livre de 300 Ko
 *    entrait tout entier tant que le cumul était à 99 999.
 * 3. **Et les documents suivants disparaissaient sans un mot.** Une fois le
 *    plafond atteint, la boucle cessait simplement d'ajouter. Aucun message,
 *    aucune trace : *le meneur croit avoir forgé depuis quatre livres, la Forge
 *    en a lu deux.*
 *
 * Le troisième est le vrai sujet. C'est la dernière troncature muette du chemin
 * IA — les autres sont tombées le 21/08 — et le journal de la Forge l'attendait
 * déjà : son commentaire annonce *« une ligne par groupe, une par lacune et une
 * par fichier écarté »*. Le canal existait, personne ne lui parlait.
 */

/** Un document déposé dans la Forge : du texte, ou une pièce jointe. */
export interface PieceDeLaForge {
    name: string;
    type: string;
    content: string;
    mimeType?: string;
}

export interface EcartDeLaForge {
    nom: string;
    raison: 'budget' | 'tronque' | 'trop-de-pieces';
    /** Ce qui a survécu, en caractères, quand le document a été coupé. */
    garde?: number;
}

export interface TexteDeLaForge {
    texte: string;
    pieces: { data: string; mimeType: string }[];
    /** Ce que la Forge n'a pas pu prendre — **jamais vide en silence**. */
    ecarts: EcartDeLaForge[];
}

/**
 * Le budget de texte, en caractères, pour une fenêtre de contexte donnée.
 *
 * **La réserve n'est pas une précaution, c'est une place déjà prise.** L'invite
 * de la Forge, ses instructions finales et le schéma imposé au décodeur partent
 * dans la même fenêtre que les documents, et la réponse doit encore y tenir :
 * `num_predict` vaut 2 048. Compter la fenêtre entière comme disponible ferait
 * couper le décodeur au moment de répondre — *une troncature déplacée n'est pas
 * une troncature évitée.*
 */
export function budgetEnCaracteres(numCtx: number, reserveEnTokens: number): number {
    const disponible = Math.max(0, numCtx - reserveEnTokens);
    return Math.floor(disponible * CHARS_PER_TOKEN);
}

/**
 * Compose le texte à envoyer, **et dit tout ce qu'il a fallu laisser.**
 *
 * **Un document trop gros est COUPÉ, pas jeté** : la première moitié d'un
 * chapitre vaut mieux que rien, et c'est déjà ce que faisait le code — mais il
 * ne le disait qu'à la console. Un document qui n'entre plus du tout est écarté,
 * et **nommé**.
 */
export function preparerLeTexte(
    pieces: readonly PieceDeLaForge[],
    budgetChars: number,
    maxPieces: number,
): TexteDeLaForge {
    const morceaux: string[] = [];
    const jointes: TexteDeLaForge['pieces'] = [];
    const ecarts: EcartDeLaForge[] = [];
    let utilise = 0;

    for (const piece of pieces) {
        if (piece.type !== 'text') {
            if (jointes.length < maxPieces) {
                jointes.push({ data: piece.content, mimeType: piece.mimeType || 'application/pdf' });
            } else {
                ecarts.push({ nom: piece.name, raison: 'trop-de-pieces' });
            }
            continue;
        }

        const entete = `\n\nCONTENU DU DOCUMENT [${piece.name}] :\n\n`;
        const restant = budgetChars - utilise - entete.length;

        /*
          **Sous mille caractères, on n'ampute pas, on écarte.** Un fragment de
          quelques lignes ne renseigne sur rien et coûte son en-tête ; le meneur
          préfère lire « écarté » que découvrir une fiche dérivée d'un tiers de
          paragraphe.
        */
        if (restant < 1000) {
            ecarts.push({ nom: piece.name, raison: 'budget' });
            continue;
        }

        if (piece.content.length <= restant) {
            morceaux.push(entete + piece.content);
            utilise += entete.length + piece.content.length;
        } else {
            morceaux.push(`${entete}${piece.content.slice(0, restant)}\n\n[TEXTE TRONQUÉ]`);
            utilise = budgetChars;
            ecarts.push({ nom: piece.name, raison: 'tronque', garde: restant });
        }
    }

    return { texte: morceaux.join(''), pieces: jointes, ecarts };
}

/** Ce qu'on écrit au journal de la Forge pour un écart. Une ligne, lisible. */
export function direLEcart(ecart: EcartDeLaForge): string {
    switch (ecart.raison) {
        case 'tronque':
            return `TRONQUÉ : « ${ecart.nom} » ne tenait pas dans la fenêtre du modèle — `
                + `${ecart.garde} caractères envoyés, la suite est perdue pour cette forge.`;
        case 'trop-de-pieces':
            return `ÉCARTÉ : « ${ecart.nom} » — trop de pièces jointes pour un seul envoi.`;
        default:
            return `ÉCARTÉ : « ${ecart.nom} » n'est pas entré dans la fenêtre du modèle. `
                + 'La forge ne l\'a pas lu.';
    }
}

/** Le coût en jetons d'un texte, pour l'annoncer avant de partir. */
export const coutEnTokens = estimateTokens;
