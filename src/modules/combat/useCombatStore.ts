import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useJournalStore } from '../journal/useJournalStore';
import { 
    type Combatant, 
    type StatusEffect 
} from './types';
import { 
    STATUS_CONFLICT_MAP, 
    calculateDamageImpact, 
    filterConflictingStatuses, 
    generateEffectId, 
    processStatusDurations, 
    resolveInitiativeFormula 
} from './logic/CombatRules';

interface CombatState {
    combatants: Combatant[];
    currentTurnIdx: number;
    round: number;
    isCombatProjected: boolean;
    isRemoteSyncing?: boolean;

    // Actions
    addCombatant: (combatant: Omit<Combatant, 'id'>) => void;
    removeCombatant: (id: string) => void;
    updateCombatant: (id: string, updates: Partial<Combatant>) => void;
    clearCombatants: () => void;
    setInitiative: (id: string, init: number) => void;
    sortInitiative: (ascending?: boolean) => void;
    rollAutoInitiative: (params: { diceMax?: number; formula?: string; resolver?: (name: string, combatant: Combatant) => number; sortOrder?: 'asc' | 'desc'; cards?: number }) => void;
    reorderCombatants: (startIndex: number, endIndex: number) => void;
    nextTurn: () => void;
    prevTurn: () => void;
    resetCombat: () => void;
    addStatus: (combatantId: string, status: Omit<StatusEffect, 'id'>) => void;
    removeStatus: (combatantId: string, statusId: string) => void;
    setIsCombatProjected: (projected: boolean) => void;
    syncCombatantHPToSession: () => void;
    propagateStatusToSession: () => void;
    broadcastSync: () => void;
    applyDamage: (amount: number, type: string, targetIds: string[]) => void;
    setTarget: (combatantId: string, targetId: string | null) => void;
    applySnapshot: (snapshot: { combatants: Combatant[]; currentTurnIdx: number; round: number }) => void;
    reset: () => void;
}

export const useCombatStore = create<CombatState>()(
    persist(
        (set, get) => ({
            combatants: [],
            currentTurnIdx: 0,
            round: 1,
            isCombatProjected: true,

            applySnapshot: (snapshot) => {
                set({
                    combatants: snapshot.combatants,
                    currentTurnIdx: snapshot.currentTurnIdx,
                    round: snapshot.round
                });
                get().broadcastSync();
            },

            reset: () => {
                set({
                    combatants: [],
                    currentTurnIdx: 0,
                    round: 1
                });
                get().broadcastSync();
            },

            broadcastSync: async () => {
                // Simplified for v7/Tauri
                if (typeof window === 'undefined') return;
                const bridge = (window as any).appBridge;
                if (!bridge?.remote?.sendSync) return;
                
                const { combatants, currentTurnIdx, round, isCombatProjected } = get();
                
                bridge.remote.sendSync({
                    combat: { combatants, currentTurnIdx, round, isCombatProjected }
                });
            },

            addCombatant: (combatant) => {
                set((state) => ({
                    combatants: [...state.combatants, { 
                        ...combatant, 
                        id: generateEffectId(),
                        faction: combatant.faction || (combatant.isPlayer ? 'player' : 'enemy'),
                        statuses: combatant.statuses || []
                    } as Combatant]
                }));
                get().broadcastSync();
            },

            removeCombatant: (id) => {
                set((state) => {
                    const newCombatants = state.combatants.filter(c => c.id !== id);
                    let newIdx = state.currentTurnIdx;
                    const removedIdx = state.combatants.findIndex(c => c.id === id);
                    if (removedIdx < newIdx) {
                        newIdx = Math.max(0, newIdx - 1);
                    } else if (newIdx >= newCombatants.length) {
                        newIdx = 0;
                    }
                    return { combatants: newCombatants, currentTurnIdx: newIdx };
                });
                get().broadcastSync();
            },

            updateCombatant: (id, updates) => {
                set((state) => ({
                    combatants: state.combatants.map(c => c.id === id ? { ...c, ...updates } : c)
                }));
                get().broadcastSync();
            },

            clearCombatants: () => {
                const { combatants, round } = get();
                if (combatants.length > 0) {
                    useJournalStore.getState().addEvent({
                        type: 'COMBAT',
                        title: 'Combat : Fin',
                        content: `Combat terminé après ${round} rounds.`
                    });
                }
                set({ combatants: [], currentTurnIdx: 0, round: 1 });
                get().broadcastSync();
            },

            setInitiative: (id, init) => {
                set((state) => ({
                    combatants: state.combatants.map(c => c.id === id ? { ...c, init } : c)
                }));
                get().broadcastSync();
            },

            sortInitiative: (ascending = false) => {
                set((state) => {
                    const sorted = [...state.combatants].sort((a, b) => ascending ? a.init - b.init : b.init - a.init);
                    return { combatants: sorted, currentTurnIdx: 0 };
                });
                get().broadcastSync();
            },

            rollAutoInitiative: ({ diceMax = 20, formula, resolver, sortOrder = 'desc' }) => {
                set((state) => {
                    const combatants = state.combatants;
                    if (combatants.length === 0) return state;

                    const newCombatants = combatants.map(c => {
                        let rolled = 0;
                        if (formula) {
                            rolled = resolveInitiativeFormula({
                                formula,
                                combatant: c,
                                resolver,
                                diceMax
                            });
                        } else {
                            rolled = Math.floor(Math.random() * diceMax) + 1;
                        }
                        return { ...c, init: Number.isNaN(rolled) ? 0 : rolled };
                    });

                    newCombatants.sort((a, b) => sortOrder === 'desc' ? b.init - a.init : a.init - b.init);
                    return { combatants: newCombatants, currentTurnIdx: 0 };
                });
                get().broadcastSync();
            },

            reorderCombatants: (startIndex, endIndex) => {
                set((state) => {
                    const result = Array.from(state.combatants);
                    const [removed] = result.splice(startIndex, 1);
                    result.splice(endIndex, 0, removed);
                    return { combatants: result };
                });
                get().broadcastSync();
            },

            nextTurn: () => {
                set((state) => {
                    if (state.combatants.length === 0) return state;
                    let nextIdx = state.currentTurnIdx + 1;
                    let nextRound = state.round;
                    if (nextIdx >= state.combatants.length) {
                        nextIdx = 0;
                        nextRound++;
                    }
                    const newCombatants = state.combatants.map((c, i) => {
                        if (i === nextIdx) {
                            return {
                                ...c,
                                statuses: processStatusDurations(c.statuses)
                            };
                        }
                        return c;
                    });
                    return { currentTurnIdx: nextIdx, round: nextRound, combatants: newCombatants };
                });
                get().broadcastSync();
            },

            prevTurn: () => {
                set((state) => {
                    if (state.combatants.length === 0) return state;
                    let prevIdx = state.currentTurnIdx - 1;
                    let prevRound = state.round;
                    if (prevIdx < 0) {
                        prevIdx = state.combatants.length - 1;
                        prevRound = Math.max(1, prevRound - 1);
                    }
                    return { currentTurnIdx: prevIdx, round: prevRound };
                });
                get().broadcastSync();
            },

            resetCombat: () => {
                set((state) => ({
                    currentTurnIdx: 0,
                    round: 1,
                    combatants: state.combatants.map(c => ({ ...c, init: 0 }))
                }));
                get().broadcastSync();
            },

            addStatus: (combatantId, status) => {
                set((state) => ({
                    combatants: state.combatants.map(c => {
                        if (c.id === combatantId) {
                            const filteredStatuses = filterConflictingStatuses(c.statuses, status.name);
                            return {
                                ...c,
                                statuses: [...filteredStatuses, { ...status, id: generateEffectId() }]
                            };
                        }
                        return c;
                    })
                }));
                get().broadcastSync();
            },

            removeStatus: (combatantId, statusId) => {
                set((state) => ({
                    combatants: state.combatants.map(c => {
                        if (c.id === combatantId) {
                            return { ...c, statuses: c.statuses.filter(s => s.id !== statusId) };
                        }
                        return c;
                    })
                }));
                get().broadcastSync();
            },

            setIsCombatProjected: (projected: boolean) => {
                set({ isCombatProjected: projected });
                get().broadcastSync();
            },

            syncCombatantHPToSession: () => {
                // To be implemented with useSessionOSStore
            },

            propagateStatusToSession: () => {
                // To be implemented with useSessionOSStore
            },

            applyDamage: (amount, type, targetIds) => {
                set((state) => {
                    const newCombatants = state.combatants.map(c => {
                        if (!targetIds.includes(c.id)) return c;
                        const { newHp, statusToAdd } = calculateDamageImpact({ amount, type, target: c });
                        let newStatuses = [...c.statuses];
                        if (statusToAdd) {
                            const filtered = filterConflictingStatuses(newStatuses, statusToAdd.name);
                            newStatuses = [...filtered, { ...statusToAdd, id: generateEffectId() }];
                        }
                        return { ...c, hp: newHp, statuses: newStatuses };
                    });
                    return { combatants: newCombatants };
                });
                get().broadcastSync();
            },

            setTarget: (combatantId, targetId) => {
                set((state) => ({
                    combatants: state.combatants.map(c => 
                        c.id === combatantId ? { ...c, targetId: targetId || undefined } : c
                    )
                }));
                get().broadcastSync();
            }
        }),
        {
            name: 'gmos-combat-storage',
            partialize: (state) => ({ 
                combatants: state.combatants, 
                round: state.round, 
                currentTurnIdx: state.currentTurnIdx,
                isCombatProjected: state.isCombatProjected 
            })
        }
    )
);
