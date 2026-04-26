import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface QuickRoll {
    id: string;
    label: string;
    formula: string;
}

export interface RollRecord {
    id: string;
    timestamp: number;
    title: string;
    total: number;
    formula: string;
    rolls: any[];
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
                { id: 'qr1', label: 'Attaque', formula: '1d20+7' },
                { id: 'qr2', label: 'Dégâts', formula: '1d8+4' },
                { id: 'qr3', label: 'D66', formula: '1d66' }
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
        }
    )
);

if (typeof window !== 'undefined') {
    (window as any).useDiceStore = useDiceStore;
}
