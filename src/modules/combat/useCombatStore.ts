import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface StatusEffect {
    id: string; // Unique ID for the status instance
    name: string;
    duration: number; // 0 means infinite
    icon: string; // e.g. '🔥', '🤢', or a lucide icon name
}

export interface Combatant {
    id: string;
    name: string;
    init: number;
    hp: number;
    hpMax: number;
    isPlayer: boolean;
    sourcePlayerId?: string; // Link to Session OS PlayerCharacter
    sourceEntityId?: string; // Link to Session OS NPC/Monster
    avatar?: string;
    statuses: StatusEffect[];
}

interface CombatState {
    combatants: Combatant[];
    currentTurnIdx: number;
    round: number;

    // --- Actions --- //

    // CRUD
    addCombatant: (combatant: Omit<Combatant, 'id'>) => void;
    removeCombatant: (id: string) => void;
    updateCombatant: (id: string, updates: Partial<Combatant>) => void;
    clearCombatants: () => void;

    // Initiative
    setInitiative: (id: string, init: number) => void;
    sortInitiative: (ascending?: boolean) => void;
    rollAutoInitiative: (diceMax: number) => void;
    reorderCombatants: (startIndex: number, endIndex: number) => void;

    // Turns
    nextTurn: () => void;
    prevTurn: () => void;
    resetCombat: () => void;

    // Statuses
    addStatus: (combatantId: string, status: Omit<StatusEffect, 'id'>) => void;
    removeStatus: (combatantId: string, statusId: string) => void;

    // Sync
    syncCombatantHPToSession: () => void;
}

export const useCombatStore = create<CombatState>()(
    persist(
        (set, get) => ({
            combatants: [],
            currentTurnIdx: 0,
            round: 1,

            addCombatant: (combatant) => set((state) => ({
                combatants: [...state.combatants, { ...combatant, id: Math.random().toString(36).substring(2, 9) }]
            })),

            removeCombatant: (id) => set((state) => {
                const newCombatants = state.combatants.filter(c => c.id !== id);
                // Adjust turn index if we removed someone before the current turn
                let newIdx = state.currentTurnIdx;
                const removedIdx = state.combatants.findIndex(c => c.id === id);
                if (removedIdx < newIdx) {
                    newIdx = Math.max(0, newIdx - 1);
                } else if (newIdx >= newCombatants.length) {
                    newIdx = 0; // Wrap around if we removed the last person
                }
                return { combatants: newCombatants, currentTurnIdx: newIdx };
            }),

            updateCombatant: (id, updates) => set((state) => ({
                combatants: state.combatants.map(c => c.id === id ? { ...c, ...updates } : c)
            })),

            clearCombatants: () => set({ combatants: [], currentTurnIdx: 0, round: 1 }),

            setInitiative: (id, init) => set((state) => ({
                combatants: state.combatants.map(c => c.id === id ? { ...c, init } : c)
            })),

            sortInitiative: (ascending = false) => set((state) => {
                const sorted = [...state.combatants].sort((a, b) => ascending ? a.init - b.init : b.init - a.init);
                return { combatants: sorted, currentTurnIdx: 0 }; // Usually reset turn on manual sort
            }),

            rollAutoInitiative: (diceMax) => set((state) => {
                const newCombatants = [...state.combatants];
                const assignedInits = new Set(newCombatants.map(c => c.init).filter(i => i !== 0));

                newCombatants.forEach(c => {
                    if (c.init === 0 || isNaN(c.init)) { // Also handle NaN just in case
                        let rolled = 0;
                        let attempts = 0;
                        do {
                            rolled = Math.floor(Math.random() * diceMax) + 1;
                            attempts++;
                        } while (assignedInits.has(rolled) && attempts < 50); // Avoid infinite loop

                        c.init = rolled;
                        assignedInits.add(rolled);
                    }
                });

                // Auto sort descending
                newCombatants.sort((a, b) => b.init - a.init);
                return { combatants: newCombatants, currentTurnIdx: 0 };
            }),

            reorderCombatants: (startIndex, endIndex) => set((state) => {
                const result = Array.from(state.combatants);
                const [removed] = result.splice(startIndex, 1);
                result.splice(endIndex, 0, removed);
                return { combatants: result };
            }),

            nextTurn: () => set((state) => {
                if (state.combatants.length === 0) return state;

                let nextIdx = state.currentTurnIdx + 1;
                let nextRound = state.round;

                if (nextIdx >= state.combatants.length) {
                    nextIdx = 0;
                    nextRound++;
                }

                // Decrease status durations for the person whose turn is STARTING
                const newCombatants = state.combatants.map((c, i) => {
                    if (i === nextIdx) {
                        return {
                            ...c,
                            statuses: c.statuses.reduce((acc, s) => {
                                if (s.duration === 0) {
                                    acc.push(s); // Infinite duration stays
                                } else if (s.duration > 1) {
                                    acc.push({ ...s, duration: s.duration - 1 }); // Decrement
                                }
                                // If s.duration === 1, it becomes 0 and gets removed
                                return acc;
                            }, [] as StatusEffect[])
                        };
                    }
                    return c;
                });

                const activeCombatant = newCombatants[nextIdx];
                if (activeCombatant && typeof window !== 'undefined') {
                    // Integration with Map-OS: highlight/center on token
                    const bridge = (window as unknown as { appBridge?: { highlightMapToken?: (name: string) => void } }).appBridge;
                    bridge?.highlightMapToken?.(activeCombatant.name);
                }

                return {
                    currentTurnIdx: nextIdx,
                    round: nextRound,
                    combatants: newCombatants
                };
            }),

            prevTurn: () => set((state) => {
                if (state.combatants.length === 0) return state;

                let prevIdx = state.currentTurnIdx - 1;
                let prevRound = state.round;

                if (prevIdx < 0) {
                    prevIdx = state.combatants.length - 1;
                    prevRound = Math.max(1, prevRound - 1);
                }

                const activeCombatant = state.combatants[prevIdx];
                if (activeCombatant && typeof window !== 'undefined') {
                    const bridge = (window as unknown as { appBridge?: { highlightMapToken?: (name: string) => void } }).appBridge;
                    bridge?.highlightMapToken?.(activeCombatant.name);
                }

                return { currentTurnIdx: prevIdx, round: prevRound };
            }),

            resetCombat: () => set((state) => ({
                currentTurnIdx: 0,
                round: 1,
                combatants: state.combatants.map(c => ({ ...c, init: 0 }))
            })),

            addStatus: (combatantId, status) => set((state) => ({
                combatants: state.combatants.map(c => {
                    if (c.id === combatantId) {
                        return {
                            ...c,
                            statuses: [...c.statuses, { ...status, id: Math.random().toString(36).substring(2, 9) }]
                        };
                    }
                    return c;
                })
            })),

            removeStatus: (combatantId, statusId) => set((state) => ({
                combatants: state.combatants.map(c => {
                    if (c.id === combatantId) {
                        return {
                            ...c,
                            statuses: c.statuses.filter(s => s.id !== statusId)
                        };
                    }
                    return c;
                })
            })),

            syncCombatantHPToSession: () => {
                const { combatants } = get();
                // We use a dynamic import or window access to avoid circular dependency if possible,
                // but for GM-OS we often use the global state access.
                // For strict typing, we'll try to get the store from the window if it's been registered there,
                // or just rely on the fact that this is a companion app where we control the environment.
                
                // Let's assume the session store is available via its own hook or a global reg.
                // In GM-OS v5, we often use 'window.useSessionOSStore' if we register it, or just use it.
                // However, the cleanest way is often to just use the reactive nature if possible, 
                // but for a "push" sync, we need the action.

                const sessionStore = (window as unknown as Record<string, { 
                    getState: () => {
                        players: { id: string, characters: { id: string }[] }[],
                        updateCharacterHP: (pId: string, cId: string, hp: number) => void,
                        updateEntityHP?: (eId: string, hp: number) => void
                    }
                }>).useSessionOSStore?.getState?.();
                
                if (!sessionStore) return;

                combatants.forEach(c => {
                    if (c.isPlayer && c.sourcePlayerId) {
                        // Find the player who owns this character
                        sessionStore.players.forEach((p: { id: string, characters: { id: string }[] }) => {
                            const char = p.characters.find(char => char.id === c.sourcePlayerId);
                            if (char) {
                                sessionStore.updateCharacterHP(p.id, char.id, c.hp);
                            }
                        });
                    } else if (!c.isPlayer && c.sourceEntityId) {
                        if (typeof sessionStore.updateEntityHP === 'function') {
                            sessionStore.updateEntityHP(c.sourceEntityId, c.hp);
                        }
                    }
                });
            }
        }),
        {
            name: 'gmos-combat-storage',
            partialize: (state) => ({ combatants: state.combatants, round: state.round, currentTurnIdx: state.currentTurnIdx })
        }
    )
);
