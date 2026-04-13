import { useState, useEffect } from 'react';
import { useSessionStore } from '../store/useSessionStore';
import { useMapStore } from '../modules/map/useMapStore';
import { useCombatStore } from '../modules/combat/useCombatStore';

/**
 * Hook utilitaire pour surveiller l'hydratation des stores persistants.
 * Garantit que les données du localStorage ont été chargées.
 */
export function useHydration() {
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        const checkHydration = () => {
            const stores = [
                useSessionStore,
                useMapStore,
                useCombatStore,
            ];

            const allHydrated = stores.every(store => {
                // @ts-ignore - persist might not be typed on all stores if not using middleware correctly
                return store.persist?.hasHydrated() ?? true;
            });

            if (allHydrated) {
                setHydrated(true);
            }
        };

        // Vérification initiale
        checkHydration();

        // Abonnements aux événements d'hydratation
        const unsubs = [
            // @ts-ignore
            useSessionStore.persist?.onFinishHydration(() => checkHydration()),
            // @ts-ignore
            useMapStore.persist?.onFinishHydration(() => checkHydration()),
            // @ts-ignore
            useCombatStore.persist?.onFinishHydration(() => checkHydration()),
        ];

        return () => {
            unsubs.forEach(unsub => {
                if (typeof unsub === 'function') unsub();
            });
        };
    }, []);

    return hydrated;
}
