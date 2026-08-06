import { useMemo, useEffect } from 'react';
import { usePerformanceStore } from '../stores/usePerformanceStore';

/**
 * Appareil considéré comme modeste, donc géré automatiquement.
 *
 * Une seule définition, partagée par l'effet qui impose le mode et par
 * l'interface qui décide d'afficher le réglage en lecture seule — sinon les
 * deux dérivent et le bouton ment.
 */
export function isAutoManagedDevice(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
        || (window.innerWidth <= 1024);
}

export function usePerformanceControl() {
    const { isLowGraphics, autoPerformanceEnabled, setLowGraphics } = usePerformanceStore();

    useEffect(() => {
        if (autoPerformanceEnabled) {
            const isTabletValue = isAutoManagedDevice();

            if (isTabletValue && !isLowGraphics) {
                console.log('[PerformanceControl] Tablet detected, enabling low graphics.');
                setLowGraphics(true);
            }
        }
    }, [autoPerformanceEnabled, isLowGraphics, setLowGraphics]);

    const performanceMode = useMemo(() => ({
        isLowGraphics,
        /**
         * Le mode est imposé par la détection : le réglage doit s'afficher en
         * lecture seule, car tout choix contraire serait aussitôt écrasé.
         */
        isManagedAutomatically: autoPerformanceEnabled && isAutoManagedDevice(),
        // Helper classes for tailwind
        blurClass: isLowGraphics ? 'backdrop-blur-none' : 'backdrop-blur-xl',
        heavyBlurClass: isLowGraphics ? 'backdrop-blur-none' : 'backdrop-blur-3xl',
        shadowClass: isLowGraphics ? 'shadow-lg' : 'shadow-[0_0_50px_rgba(var(--accent-rgb),0.2)]',
        glowClass: isLowGraphics ? '' : 'shadow-glow-accent',
        animateClass: isLowGraphics ? '' : 'animate-pulse'
    }), [isLowGraphics, autoPerformanceEnabled]);

    return performanceMode;
}
