import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface PerformanceState {
    isLowGraphics: boolean;
    autoPerformanceEnabled: boolean;
    setLowGraphics: (enabled: boolean) => void;
    setAutoPerformance: (enabled: boolean) => void;
}

export const usePerformanceStore = create<PerformanceState>()(
    persist(
        (set) => ({
            isLowGraphics: false,
            autoPerformanceEnabled: true,
            setLowGraphics: (enabled) => set({ isLowGraphics: enabled }),
            setAutoPerformance: (enabled) => set({ autoPerformanceEnabled: enabled }),
        }),
        {
            name: 'gmos-performance-storage',
        }
    )
);
