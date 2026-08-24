import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { stockageLocalDuMJ } from '../utils/ecritureReserveeAuMJ';
import { consignerLeJet } from '../modules/journal/consignerLeJet';
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
            setLastRoll: (roll) => {
                /*
                  **Le journal se sert ICI, au goulot des deux écrans qui
                  lancent** — le pupitre du meneur et la tablette des joueurs.

                  Ce registre garde cinquante lancers pour l'écran et rien pour
                  l'histoire : il ne survit pas à la séance et n'entre dans aucun
                  résumé. Les dés étaient l'un des trois modules muets relevés à
                  la revue des 36 émetteurs, alors que la musique — geste
                  identique — émettait déjà.

                  La décision de ce qui vaut d'être écrit n'est pas prise ici :
                  elle vit dans `consignerLeJet`, avec le panneau de fiche pour
                  second appelant.
                */
                consignerLeJet({
                    titre: roll.title,
                    totalDisplay: roll.totalDisplay,
                    degre: roll.degre,
                    tagSuccess: roll.tagSuccess,
                });
                set((state) => ({
                    lastRoll: roll,
                    history: [roll, ...state.history].slice(0, 50),
                }));
            },
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
            /*
              **Seule la fenêtre MJ écrit ce store.**

              Le hub reçoit les jets par `useHubSync` et les applique en
              `setState`.
              Or le hub et le projecteur tournent sur la **même origine** que le
              MJ (`electron/main.ts` ne change que la chaîne de requête), donc
              dans le **même `localStorage`**, sous cette même clé. Un `setState`
              sur un store persisté écrit : la fenêtre secondaire réécrivait le
              magasin du MJ avec **sa** vue, qui est partielle — ce qu'elle n'a
              jamais reçu repart tel qu'elle l'avait à SON démarrage.

              **Rien n'est perdu pour autant, et c'est ce qui rend la garde sûre
              ici** : la synchronisation entre fenêtres est
              **bidirectionnelle** (`CrossWindowEventService.init` — *« everyone
              subscribes to their local store to broadcast changes »*). Ce que la
              fenêtre secondaire change part au MJ, qui l'applique
              (`applyRemoteUpdate`) puis rediffuse la version qui fait autorité.
              **C'est donc le MJ qui écrit sur le disque, et lui seul** ;
              l'écriture du hub n'était qu'un doublon — un doublon partiel, donc
              destructeur.

              Même garde que `PersistenceService` depuis la perte des campagnes
              du 2026-08-07, et que `useCombatStore` depuis le 2026-08-24.
              Détail et liste complète : `utils/ecritureReserveeAuMJ.ts`.
            */
            storage: stockageLocalDuMJ(),
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
