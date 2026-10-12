/**
 * **À qui un message de séance est-il destiné — une règle, écrite une fois.**
 *
 * Posée le 2026-10-12, après la première séance jouée. La lecture du code a
 * trouvé que **toutes les tablettes recevaient tous les messages privés** : le
 * relais de joueur à joueur partait vers chaque socket, le message privé du
 * meneur aussi, et l'état complet portait les cinquante derniers à chaque
 * joueur. Chaque tablette les rangeait tous et n'en cachait qu'à l'affichage.
 * *Un message privé caché à l'affichage n'est pas un message privé : il est sur
 * la tablette d'à côté.*
 *
 * Elle vit dans `electron/` parce que le serveur ne lit que ce dossier, et
 * `src/` l'importe — comme `corpusSysteme` et `motsDeLaQuestion`. Quatre
 * lecteurs, une règle : l'acheminement par le serveur, le fil rendu à une
 * tablette qui se reconnecte, l'état complet envoyé à la tablette du meneur,
 * et l'affichage chez le meneur.
 *
 * ⛔ **Décision de David (12/10) : les messages de joueur à joueur sont gardés
 * par le meneur, mais cachés.** GM-OS les conserve pour pouvoir les rendre aux
 * tablettes ; il ne les montre pas, ni sur l'écran principal ni sur la tablette
 * du meneur.
 */

/** L'identifiant du meneur dans `fromId` / `toId`. */
export const ID_DU_MENEUR = 'GM';
/** Le destinataire « tous les joueurs ». */
export const ID_DE_TOUS = 'all';

/** Ce que la règle lit d'un message — la forme minimale, sans dépendre de `src/`. */
export interface MessageAchemine {
    fromId: string;
    toId?: string;
    campaignId?: string;
    timestamp: number;
}

/** Qui lit : le meneur (écran principal, tablette appairée), ou un joueur. */
export type Lecteur =
    | { role: 'meneur' }
    | { role: 'joueur'; characterId?: string };

/** Un message à tous : `all`, ou sans destinataire (les plus anciens). */
export const estPourTous = (message: Pick<MessageAchemine, 'toId'>): boolean =>
    !message.toId || message.toId === ID_DE_TOUS;

/** Un message de joueur à joueur : ni le meneur ni « tous » n'y figurent. */
export const estEntreJoueurs = (message: Pick<MessageAchemine, 'fromId' | 'toId'>): boolean =>
    !estPourTous(message) && message.fromId !== ID_DU_MENEUR && message.toId !== ID_DU_MENEUR;

/** Le lecteur que désigne un rôle du serveur. Les rôles appairés sont le meneur. */
export const lecteurDuRole = (role: string | undefined, characterId?: string): Lecteur =>
    role === 'gm' || role === 'remote' ? { role: 'meneur' } : { role: 'joueur', characterId };

/**
 * **Ce message est-il pour ce lecteur ?**
 *
 * - un joueur : il l'a envoyé, il en est le destinataire, ou c'est un message à
 *   tous. Sans personnage, il ne reçoit que les messages à tous.
 * - le meneur : tout, **sauf** ce que deux joueurs se disent.
 */
export function messagePourLeLecteur(
    message: Pick<MessageAchemine, 'fromId' | 'toId'>,
    lecteur: Lecteur,
): boolean {
    if (lecteur.role === 'meneur') return !estEntreJoueurs(message);
    if (estPourTous(message)) return true;
    if (!lecteur.characterId) return false;
    return message.fromId === lecteur.characterId || message.toId === lecteur.characterId;
}

/**
 * **Le fil d'un lecteur pour une campagne**, du plus ancien au plus récent, et
 * seulement les `plafond` derniers.
 *
 * Un message sans campagne (d'avant le 12/10) n'appartient à aucune : il n'est
 * rendu à personne plutôt qu'à la mauvaise table.
 */
export function filDuLecteur<M extends MessageAchemine>(
    messages: readonly M[],
    campagneId: string | null | undefined,
    lecteur: Lecteur,
    plafond = 200,
): M[] {
    if (!campagneId) return [];
    return messages
        .filter(m => m.campaignId === campagneId && messagePourLeLecteur(m, lecteur))
        .sort((a, b) => a.timestamp - b.timestamp)
        .slice(-plafond);
}
