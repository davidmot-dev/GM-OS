import { useCallback, useSyncExternalStore } from 'react';
import { crossWindowSync } from '../../../services/CrossWindowEventService';

/**
 * Indique si un jeton est tenu par une autre fenêtre, de façon **réactive**.
 *
 * `crossWindowSync.isTokenLocked()` était appelé directement pendant le rendu,
 * sans que rien n'y soit abonné : un verrou pris ou relâché ailleurs
 * n'entraînait aucun re-rendu, et le jeton continuait de s'afficher comme
 * saisissable jusqu'au rendu suivant, quelle qu'en soit la cause.
 *
 * La protection tenait — `requestLock` refuse, donc le glissement ne démarrait
 * pas —, mais l'écran mentait : le curseur et l'apparence invitaient à saisir un
 * jeton qui ne répondait plus.
 *
 * `useSyncExternalStore` convient exactement ici : l'état vit hors de React, et
 * ses changements ne sont pas tous des événements — un verrou expire au bout de
 * cinq secondes sans que personne n'émette rien. Le service programme le réveil
 * correspondant.
 */
export function useTokenLock(tokenId: string): boolean {
    const subscribe = useCallback(
        (onChange: () => void) => crossWindowSync.subscribeLocks(onChange),
        [],
    );

    const getSnapshot = useCallback(
        () => crossWindowSync.isTokenLocked(tokenId),
        [tokenId],
    );

    // Hors navigateur, aucun verrou n'a de sens : le rendu serveur ne saisit rien.
    return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
