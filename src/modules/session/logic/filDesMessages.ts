import type { SessionMessage } from '../../../types/session.types';

/**
 * **Le fil des messages de séance — ce que le meneur garde.**
 *
 * Posé le 2026-10-12, après la première séance jouée : les messages entre
 * joueurs disparaissaient, souvent tous d'un coup. Ils ne vivaient qu'en
 * mémoire, cent au plus, toutes campagnes confondues.
 *
 * Décision de David (12/10) : **un fil de campagne**, qui continue d'une séance
 * à l'autre. Le plafond est donc **par campagne** — un fil chargé dans une
 * campagne ne doit pas effacer celui d'une autre.
 */

/** Le plafond par campagne : du texte court, mille messages pèsent peu. */
export const MESSAGES_PAR_CAMPAGNE = 1000;

/**
 * **Ajoute un message au fil**, sans doublon, en le rangeant dans sa campagne.
 *
 * Un message arrivé sans campagne (une tablette d'avant le 12/10, ou qui n'en
 * connaissait pas encore) reçoit celle **du meneur** : c'est lui qui fait foi.
 * Seuls les messages de la même campagne comptent pour le plafond.
 */
export function ajouterAuFil(
    messages: readonly SessionMessage[],
    message: SessionMessage,
    campagneActive: string | null | undefined,
    plafond = MESSAGES_PAR_CAMPAGNE,
): SessionMessage[] {
    if (messages.some(m => m.id === message.id)) return messages as SessionMessage[];
    const range: SessionMessage = message.campaignId || !campagneActive
        ? message
        : { ...message, campaignId: campagneActive };

    const suite = [...messages, range];
    const deLaCampagne = suite.filter(m => m.campaignId === range.campaignId);
    if (deLaCampagne.length <= plafond) return suite;

    const enTrop = new Set(deLaCampagne.slice(0, deLaCampagne.length - plafond).map(m => m.id));
    return suite.filter(m => !enTrop.has(m.id));
}
