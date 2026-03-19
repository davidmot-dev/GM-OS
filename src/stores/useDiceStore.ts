import { create } from 'zustand';
import type { RollResult } from '../modules/dice/DiceEngine';

interface RollRecord extends RollResult {
    id: string;
    timestamp: Date;
    title: string;
}

interface DiceState {
    lastRoll: RollRecord | null;
    history: RollRecord[];
    setLastRoll: (roll: RollRecord) => void;
    clearHistory: () => void;
}

export const useDiceStore = create<DiceState>((set) => ({
    lastRoll: null,
    history: [],
    setLastRoll: (roll) => set((state) => ({
        lastRoll: roll,
        history: [roll, ...state.history].slice(0, 50)
    })),
    clearHistory: () => set({ history: [], lastRoll: null })
}));

// Cross-store access
if (typeof window !== 'undefined') {
    (window as any).useDiceStore = useDiceStore;
}
