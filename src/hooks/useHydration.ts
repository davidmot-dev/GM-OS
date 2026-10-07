import { useState, useEffect } from 'react';
import { useSessionStore } from '../store/useSessionStore';
import { useMapStore } from '../modules/map/useMapStore';
import { useCombatStore } from '../modules/combat/useCombatStore';
import { useSessionOSStore } from '../modules/session/store';
import { reportStorageUsage } from '../modules/session/logic/storageDiagnostics';

/**
 * Hook utilitaire pour surveiller l'hydratation des stores persistants.
 * Garantit que les données du localStorage ont été chargées.
 */
export function useHydration() {
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        // Chaque store qui finit son hydratation rappelle checkHydration :
        // on ne veut mesurer qu'une fois.
        let hasReported = false;

        const checkHydration = () => {
            const stores = [
                useSessionStore,
                useMapStore,
                useCombatStore,
                // Indispensable depuis le passage à IndexedDB : ce store s'hydrate
                // désormais de façon asynchrone. Sans lui dans la liste, l'app se
                // déclarerait prête avec une base de campagne encore vide.
                useSessionOSStore,
            ];

            const allHydrated = stores.every(store => {
                return store.persist?.hasHydrated() ?? true;
            });

            if (allHydrated) {
                setHydrated(true);
                if (!hasReported) {
                    hasReported = true;
                    // Une fois les stores chargés, on connaît l'occupation réelle.
                    reportStorageUsage();
                }
            }
        };

        // Vérification initiale
        checkHydration();

        // Abonnements aux événements d'hydratation
        const unsubs = [
            useSessionStore.persist?.onFinishHydration(() => checkHydration()),
            useMapStore.persist?.onFinishHydration(() => checkHydration()),
            useCombatStore.persist?.onFinishHydration(() => checkHydration()),
            useSessionOSStore.persist?.onFinishHydration(() => checkHydration()),
        ];

        return () => {
            unsubs.forEach(unsub => {
                if (typeof unsub === 'function') unsub();
            });
        };
    }, []);

    return hydrated;
}
