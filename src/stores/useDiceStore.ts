import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { RollResult } from '../modules/dice/DiceEngine';

export interface RollRecord extends RollResult {
    id: string;
    timestamp: Date;
    title: string;
}

interface DiceState {
    lastRoll: RollRecord | null;
    history: RollRecord[];
    isDiceProjected: boolean;
    projectionTrigger: number; // Timestamp pour déclencher l'affichage temporaire
    setLastRoll: (roll: RollRecord) => void;
    setIsDiceProjected: (projected: boolean) => void;
    triggerDiceProjection: () => void;
    clearHistory: () => void;
}

export const useDiceStore = create<DiceState>()(
    persist(
        (set) => ({
            lastRoll: null,
            history: [],
            isDiceProjected: false,
            projectionTrigger: 0,
            setLastRoll: (roll) => set((state) => ({
                lastRoll: roll,
                history: [roll, ...state.history].slice(0, 50)
            })),
            setIsDiceProjected: (isDiceProjected) => set({ isDiceProjected }),
            triggerDiceProjection: () => set({ projectionTrigger: Date.now() }),
            clearHistory: () => set({ history: [], lastRoll: null, isDiceProjected: false, projectionTrigger: 0 })
        }),
        {
            name: 'gmos-dice-storage'
        }
    )
);

// Cross-store access
if (typeof window !== 'undefined') {
    (window as unknown as Record<string, unknown>).useDiceStore = useDiceStore;
}
