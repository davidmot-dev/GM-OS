import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { RollResult } from '../modules/dice/DiceEngine';

export interface QuickRoll {
    id: string;
    label: string;
    formula: string;
}

export interface RollRecord extends RollResult {
    id: string;
    timestamp: Date;
    title: string;
    batchId?: string;
}

interface DiceState {
    lastRoll: RollRecord | null;
    history: RollRecord[];
    quickRolls: QuickRoll[];
    isDiceProjected: boolean;
    projectionTrigger: number;
    enable3D: boolean;
    setLastRoll: (roll: RollRecord) => void;
    setIsDiceProjected: (projected: boolean) => void;
    setEnable3D: (enabled: boolean) => void;
    triggerDiceProjection: () => void;
    clearHistory: () => void;
    addQuickRoll: (label: string, formula: string) => void;
    removeQuickRoll: (id: string) => void;
}

export const useDiceStore = create<DiceState>()(
    persist(
        (set) => ({
            lastRoll: null,
            history: [],
            quickRolls: [
                { id: 'qr1', label: 'dice.quick_rolls.defaults.attack', formula: '1d20+7' },
                { id: 'qr2', label: 'dice.quick_rolls.defaults.damage', formula: '1d8+4' },
                { id: 'qr3', label: 'dice.quick_rolls.defaults.d66', formula: '1d66' }
            ],
            isDiceProjected: false,
            projectionTrigger: 0,
            enable3D: true,
            setLastRoll: (roll) => set((state) => ({
                lastRoll: roll,
                history: [roll, ...state.history].slice(0, 50)
            })),
            setIsDiceProjected: (isDiceProjected) => set({ isDiceProjected }),
            setEnable3D: (enable3D) => set({ enable3D }),
            triggerDiceProjection: () => set({ projectionTrigger: Date.now() }),
            clearHistory: () => set({ history: [], lastRoll: null, isDiceProjected: false, projectionTrigger: 0 }),
            addQuickRoll: (label, formula) => set((state) => ({
                quickRolls: [...state.quickRolls, { id: Math.random().toString(36).substring(7), label, formula }]
            })),
            removeQuickRoll: (id) => set((state) => ({
                quickRolls: state.quickRolls.filter(qr => qr.id !== id)
            }))
        }),
        {
            name: 'gmos-dice-storage',
            version: 1,
            migrate: (persistedState: any, version: number) => {
                if (version === 0 && persistedState.quickRolls) {
                    return {
                        ...persistedState,
                        quickRolls: persistedState.quickRolls.map((qr: any) => {
                            if (qr.label === 'Attaque Épée Longue') return { ...qr, label: 'dice.quick_rolls.defaults.attack' };
                            if (qr.label === 'Dégâts') return { ...qr, label: 'dice.quick_rolls.defaults.damage' };
                            if (qr.label === 'Lancer D66') return { ...qr, label: 'dice.quick_rolls.defaults.d66' };
                            return qr;
                        })
                    };
                }
                return persistedState;
            }
        }
    )
);

// Cross-store access
if (typeof window !== 'undefined') {
    (window as unknown as Record<string, unknown>).useDiceStore = useDiceStore;
}
