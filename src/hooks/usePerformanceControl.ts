import { useMemo, useEffect } from 'react';
import { usePerformanceStore } from '../stores/usePerformanceStore';

export function usePerformanceControl() {
    const { isLowGraphics, autoPerformanceEnabled, setLowGraphics } = usePerformanceStore();

    // Détection automatique : ne s'applique que tant que l'utilisateur n'a pas
    // fait de choix explicite. `setLowGraphicsByUser` coupe `autoPerformanceEnabled`,
    // ce qui neutralise cet effet — sans quoi il rétablirait aussitôt le mode
    // performance et le bouton deviendrait à sens unique.
    useEffect(() => {
        if (!autoPerformanceEnabled) return;

        const isTabletValue = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
            || (window.innerWidth <= 1024);

        if (isTabletValue && !isLowGraphics) {
            console.log('[PerformanceControl] Tablet detected, enabling low graphics.');
            setLowGraphics(true);
        }
    }, [autoPerformanceEnabled, isLowGraphics, setLowGraphics]);

    const performanceMode = useMemo(() => ({
        isLowGraphics,
        // Helper classes for tailwind
        blurClass: isLowGraphics ? 'backdrop-blur-none' : 'backdrop-blur-xl',
        heavyBlurClass: isLowGraphics ? 'backdrop-blur-none' : 'backdrop-blur-3xl',
        shadowClass: isLowGraphics ? 'shadow-lg' : 'shadow-[0_0_50px_rgba(var(--accent-rgb),0.2)]',
        glowClass: isLowGraphics ? '' : 'shadow-glow-accent',
        animateClass: isLowGraphics ? '' : 'animate-pulse'
    }), [isLowGraphics]);

    return performanceMode;
}
