import { diceActions } from './diceActions';
import { audioActions } from './audioActions';
import { combatActions } from './combatActions';
import { sessionActions } from './sessionActions';
import { obsidianActions } from './obsidianActions';
import { whiteboardActions } from './whiteboardActions';
import { sceneActions } from './sceneActions';
import { tableActions } from './tableActions';
import { deckActions } from './deckActions';
import { HIGH_FREQUENCY_ACTIONS, type ActionContext, type ActionRegistry } from './types';

export type { ActionContext, ActionRegistry } from './types';
export { HIGH_FREQUENCY_ACTIONS } from './types';

/**
 * Demande de diffusion complète émise par un client. Le handler est vide : la
 * synchronisation de fin de traitement, appliquée à toute action reconnue,
 * suffit à la satisfaire.
 *
 * (L'ancienne suite de `if` synchronisait deux fois pour ce type — une fois
 * dans la branche, une fois à la fin.)
 */
const syncActions: ActionRegistry = {
    'remote:request-sync': () => {
        console.log('[Actions] Forced sync request from tablet');
    },
};

/**
 * Liste exhaustive de ce que l'application accepte d'exécuter sur ordre du
 * réseau. Tout type absent de ce registre est ignoré et signalé.
 */
export const actionRegistry: ActionRegistry = {
    ...diceActions,
    ...syncActions,
    ...audioActions,
    ...combatActions,
    ...sessionActions,
    ...obsidianActions,
    ...whiteboardActions,
    ...sceneActions,
    ...tableActions,
    ...deckActions,
};

/** Types reconnus, utile aux tests et à l'inspection. */
export const KNOWN_ACTION_TYPES: readonly string[] = Object.keys(actionRegistry);

export function isKnownActionType(type: string): boolean {
    return Object.prototype.hasOwnProperty.call(actionRegistry, type);
}

/**
 * Exécute une action reçue d'un client distant.
 *
 * Retourne `true` si l'action a été reconnue et traitée.
 */
export function dispatchRemoteAction(
    action: { type: string; payload?: any },
    ctx: ActionContext
): boolean {
    const { type, payload } = action || {};

    if (!type || typeof type !== 'string') {
        console.warn('[Actions] Action reçue sans type exploitable, ignorée:', action);
        return false;
    }

    // hasOwnProperty plutôt qu'un accès direct : sans cela, un client pourrait
    // envoyer type: "constructor" ou "toString" et atteindre le prototype.
    if (!isKnownActionType(type)) {
        console.warn(`[Actions] Type d'action inconnu, ignoré: ${type}`);
        return false;
    }

    console.log(`[Actions] [RemoteAction] type: ${type}`, payload);

    try {
        actionRegistry[type](payload, ctx);
    } catch (err) {
        // Un handler qui échoue ne doit pas emporter la boucle de réception.
        console.error(`[Actions] Handler en échec pour "${type}":`, err);
        return false;
    }

    // Diffusion immédiate après traitement, sauf pour les actions qui arrivent
    // par rafales et déclencheraient une diffusion complète à chaque événement.
    if (!HIGH_FREQUENCY_ACTIONS.has(type)) {
        ctx.sync(true);
    }

    return true;
}
