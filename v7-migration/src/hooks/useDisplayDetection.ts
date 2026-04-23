import { useEffect } from 'react';
import { useSessionStore } from '../store/useSessionStore';
import { gmToast } from '../stores/useToastStore';
import { AppBridge } from '../bridge/AppBridge';

/**
 * Hook responsable de la détection des écrans et de la mise à jour du store.
 * Affiche également des notifications lors de l'ajout/retrait de moniteurs.
 */
export function useDisplayDetection(isActive: boolean = true) {
    const { setDisplayCount, displayCount } = useSessionStore();

    useEffect(() => {
        if (!isActive) return;

        // 1. Initial detection
        const checkInitialDisplays = async () => {
            if (AppBridge.displays.hasSupport) {
                try {
                    const displays = await AppBridge.displays.list();
                    if (Array.isArray(displays) && displays.length !== displayCount) {
                        setDisplayCount(displays.length);
                    }
                } catch (error) {
                    console.error('[useDisplayDetection] Error checking initial displays:', error);
                }
            }
        };

        checkInitialDisplays();

        // 2. Listen for changes
        if (AppBridge.app.hasSupport) {
            const cleanup = AppBridge.app.onDisplayChanged((count) => {
                const prevCount = useSessionStore.getState().displayCount;
                
                if (count > prevCount) {
                    gmToast(`Nouveau moniteur détecté (${count} écrans au total).`, 'info');
                } else if (count < prevCount) {
                    gmToast(`Moniteur déconnecté (${count} écrans restants).`, 'warning');
                }

                setDisplayCount(count);
            });

            return cleanup;
        }
    }, [setDisplayCount, displayCount, isActive]); // eslint-disable-line react-hooks/exhaustive-deps
}
