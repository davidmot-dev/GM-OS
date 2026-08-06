import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface PerformanceState {
    isLowGraphics: boolean;
    /** Laisse l'application décider du mode selon l'appareil détecté. */
    autoPerformanceEnabled: boolean;
    /** Réglage automatique : n'a d'effet que tant que l'utilisateur n'a pas tranché. */
    setLowGraphics: (enabled: boolean) => void;
    /**
     * Choix explicite de l'utilisateur : il désactive la détection automatique.
     *
     * Sans cela, la détection reprend la main au changement suivant et le
     * bouton devient à sens unique — activable, jamais désactivable.
     */
    setLowGraphicsByUser: (enabled: boolean) => void;
    setAutoPerformance: (enabled: boolean) => void;
}

export const usePerformanceStore = create<PerformanceState>()(
    persist(
        (set) => ({
            isLowGraphics: false,
            autoPerformanceEnabled: true,
            setLowGraphics: (enabled) => set({ isLowGraphics: enabled }),
            setLowGraphicsByUser: (enabled) => set({ isLowGraphics: enabled, autoPerformanceEnabled: false }),
            setAutoPerformance: (enabled) => set({ autoPerformanceEnabled: enabled }),
        }),
        {
            name: 'gmos-performance-storage',
        }
    )
);
