import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DiceEngine } from '../dice/DiceEngine';
import { gmToast } from '../../stores/useToastStore';
import { useJournalStore } from '../journal/useJournalStore';
import type { HealthSystem } from '../session/useSessionOSStore';

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
    faction: 'player' | 'enemy' | 'neutral' | 'ally';
    targetId?: string;
    sourcePlayerId?: string; // Link to Session OS PlayerCharacter
    sourceEntityId?: string; // Link to Session OS NPC/Monster
    avatar?: string;
    statuses: StatusEffect[];
    extraStats?: Record<string, { value: number; max: number }>; // Dynamic stats (MP, Sanity...)
    resistances?: string[];
    vulnerabilities?: string[];
    immunities?: string[];
    healthSystem?: HealthSystem;
}

// Conflicting status effects: adding a key status will automatically remove the value statuses
export const STATUS_CONFLICT_MAP: Record<string, string[]> = {
    'En feu': ['Mouillé', 'Sous l\'eau', 'Gelé'],
    'Mouillé': ['En feu'],
    'Sous l\'eau': ['En feu'],
    'Gelé': ['En feu'],
    'Inconscient': ['Debout', 'En garde'],
    'Debout': ['À terre'],
    'À terre': ['Debout'],
    'Invisible': ['En feu', 'En garde'],
    'Béni': ['Maudit'],
    'Maudit': ['Béni'],
    'Effrayé': ['Concentration', 'Béni'],
    'Confus': ['Concentration'],
    'Épuisé': ['En garde', 'Concentration'],
    'Agrippé': ['Debout'],
    'Soin': ['Empoisonné', 'Saignement'],
    'Choqué': ['Concentration']
};


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
    rollAutoInitiative: (params: { diceMax?: number; formula?: string; resolver?: (name: string, combatant: Combatant) => number; sortOrder?: 'asc' | 'desc'; cards?: number }) => void;
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
    propagateStatusToSession: () => void;
    
    // Damage/Heal
    applyDamage: (amount: number, type: string, targetIds: string[]) => void;
    setTarget: (combatantId: string, targetId: string | null) => void;
    
    // Snapshot System
    applySnapshot: (snapshot: { combatants: Combatant[]; currentTurnIdx: number; round: number }) => void;
    reset: () => void;
}

export const useCombatStore = create<CombatState>()(
    persist(
        (set, get) => ({
            combatants: [],
            currentTurnIdx: 0,
            round: 1,

            applySnapshot: (snapshot) => set({
                combatants: snapshot.combatants,
                currentTurnIdx: snapshot.currentTurnIdx,
                round: snapshot.round
            }),

            reset: () => set({
                combatants: [],
                currentTurnIdx: 0,
                round: 1
            }),

            addCombatant: (combatant) => set((state) => ({
                combatants: [...state.combatants, { 
                    ...combatant, 
                    id: Math.random().toString(36).substring(2, 9),
                    faction: combatant.faction || (combatant.isPlayer ? 'player' : 'enemy')
                }]
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

            clearCombatants: () => {
                const { combatants, round } = get();
                
                if (combatants.length > 0) {
                    const survivors = combatants.filter(c => !c.statuses.some(s => s.name.toLowerCase() === 'mort' || s.icon === '💀'));
                    const casualities = combatants.filter(c => c.statuses.some(s => s.name.toLowerCase() === 'mort' || s.icon === '💀'));
                    
                    const summary = [
                        `Combat terminé après **${round} rounds**.`,
                        `**Participants :** ${combatants.length}`,
                        casualities.length > 0 ? `**Pertes :** ${casualities.map(c => c.name).join(', ')}` : '**Pertes :** Aucune',
                        `**Survivants :** ${survivors.map(c => c.name).join(', ')}`
                    ].join('\n');

                    useJournalStore.getState().addEvent({
                        type: 'COMBAT',
                        title: 'Combat : Résumé de fin',
                        content: summary,
                        metadata: { round, totalCombatants: combatants.length, casualitiesCount: casualities.length }
                    });
                }
                
                set({ combatants: [], currentTurnIdx: 0, round: 1 });
            },

            setInitiative: (id, init) => set((state) => ({
                combatants: state.combatants.map(c => c.id === id ? { ...c, init } : c)
            })),

            sortInitiative: (ascending = false) => set((state) => {
                const sorted = [...state.combatants].sort((a, b) => ascending ? a.init - b.init : b.init - a.init);
                return { combatants: sorted, currentTurnIdx: 0 }; // Usually reset turn on manual sort
            }),

            rollAutoInitiative: ({ diceMax = 20, formula, resolver, sortOrder = 'desc', cards }) => set((state) => {
                const combatants = state.combatants;
                if (combatants.length === 0) {
                    gmToast("Aucun combattant dans la liste !", "warning");
                    return state;
                }

                const newCombatants = combatants.map(c => ({ ...c }));
                
                // If cards mode is active, prepare a shuffled pool
                let cardPool: number[] = [];
                if (cards && cards > 0) {
                    cardPool = Array.from({ length: cards }, (_, i) => i + 1);
                    // Shuffle the pool (Fisher-Yates)
                    for (let i = cardPool.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [cardPool[i], cardPool[j]] = [cardPool[j], cardPool[i]];
                    }
                }

                let cardIdx = 0;
                newCombatants.forEach(c => {
                    // Logic: we reroll EVERYTHING if this is called, or only those at 0?
                    // User probably wants to reroll everyone when clicking "Jet Système"
                    let rolled = 0;
                    
                    if (cardPool.length > 0) {
                        if (cardIdx < cardPool.length) {
                            rolled = cardPool[cardIdx++];
                        } else {
                            rolled = Math.floor(Math.random() * (cards || 10)) + 1;
                        }
                    } else if (formula) {
                        let evaluatedFormula = formula;
                        if (resolver) {
                            // 1. Identify all potential variables (words like DEX, INT, or [MyStat])
                            // We match: [anything] or single words [a-zA-Z_]+
                            const varRegex = /\[([^\]]+)\]|\b([a-zA-ZÀ-ÿ_]+)\b/gi;
                            const matches = Array.from(formula.matchAll(varRegex));
                            
                            // Reorder matches by length descending to avoid partial replacements (e.g., 'int' in 'intelligence')
                            matches.sort((a, b) => b[0].length - a[0].length);

                            matches.forEach(match => {
                                const fullMatch = match[0];
                                const innerVar = match[1] || match[2];
                                
                                // Skip "d" as it's part of dice notation (e.g., 2d6)
                                if (innerVar.toLowerCase() === 'd' && /^\d*d\d+$/i.test(fullMatch)) return;

                                const val = resolver(innerVar, c);
                                // If the resolver found a numeric value, replace the match
                                // Otherwise, if it's just a label word, we'll strip it later
                                if (val !== undefined && !Number.isNaN(val)) {
                                    evaluatedFormula = evaluatedFormula.replace(fullMatch, val.toString());
                                }
                            });
                        }

                        // 2. Final Cleanup: Resolve remaining text to keep only math
                        // We keep: numbers, operators (+ - * /), and "d" for dice.
                        // We remove EVERYTHING else (including parentheses, labels, special chars).
                        evaluatedFormula = evaluatedFormula.replace(/[a-zA-ZÀ-ÿ_]+/g, (match) => {
                            // If it's a standalone "d", it's probably part of dice notation
                            if (match.toLowerCase() === 'd') return match;
                            // Otherwise, it's a label that couldn't be resolved -> replace with 0
                            return '0';
                        });

                        // 3. Remove all characters that are not math-related (parentheses, etc.)
                        // BUT preserve the "d" or "D" if it's part of a dice roll.
                        evaluatedFormula = evaluatedFormula.replace(/[^0-9dD+\-*/\s]/g, '');

                        try {
                            console.log(`[useCombatStore] Final cleaned formula for ${c.name}: "${evaluatedFormula}"`);
                            const res = DiceEngine.rollFormula(evaluatedFormula);
                            rolled = Number.isNaN(res.total) ? 0 : res.total;
                        } catch (err) {
                            console.error(`[useCombatStore] Formula error: ${evaluatedFormula}`, err);
                            rolled = Math.floor(Math.random() * diceMax) + 1;
                        }
                    } else {
                        rolled = Math.floor(Math.random() * diceMax) + 1;
                    }

                    c.init = Number.isNaN(rolled) ? 0 : rolled;
                });

                // Auto sort based on direction
                newCombatants.sort((a, b) => {
                    return sortOrder === 'desc' ? b.init - a.init : a.init - b.init;
                });
                
                gmToast(`Initiative système lancée (${sortOrder === 'desc' ? 'Décroissant' : 'Croissant'})`, "success");
                
                useJournalStore.getState().addEvent({
                    type: 'COMBAT',
                    title: 'Combat : Initiative',
                    content: `Round ${state.round} - L'initiative a été tirée pour ${newCombatants.length} combattants.`,
                    metadata: { round: state.round, count: newCombatants.length }
                });

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

            addStatus: (combatantId, status) => set((state) => {
                const conflicts = STATUS_CONFLICT_MAP[status.name] || [];
                return {
                    combatants: state.combatants.map(c => {
                        if (c.id === combatantId) {
                            // Filter out conflicting statuses
                            const filteredStatuses = c.statuses.filter(s => !conflicts.includes(s.name));
                            return {
                                ...c,
                                statuses: [...filteredStatuses, { ...status, id: Math.random().toString(36).substring(2, 9) }]
                            };
                        }
                        return c;
                    })
                };
            }),

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
                const sessionStore = (window as any).useSessionOSStore?.getState?.();
                
                if (!sessionStore) return;

                combatants.forEach(c => {
                    if (c.isPlayer && c.sourcePlayerId) {
                        sessionStore.players.forEach((p: any) => {
                            const char = p.characters.find((char: any) => char.id === c.sourcePlayerId);
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
            },

            propagateStatusToSession: () => {
                const { combatants } = get();
                const sessionStore = (window as any).useSessionOSStore?.getState?.();
                
                if (!sessionStore) return;

                combatants.forEach(c => {
                    const isMort = c.statuses.some(s => s.name.toLowerCase() === 'mort' || s.icon === '💀');
                    
                    if (isMort && !c.isPlayer && c.sourceEntityId) {
                        if (typeof sessionStore.updateEntity === 'function') {
                            sessionStore.updateEntity(c.sourceEntityId, { status: 'dead' });
                            gmToast(`${c.name} marqué comme MORT dans la Galerie.`, "info");

                            // Log to Journal
                            useJournalStore.getState().addEvent({
                                type: 'NPC',
                                title: `Décès : ${c.name}`,
                                content: `Le PNJ **${c.name}** a été marqué comme **MORT** suite au combat (Combat-OS).`,
                                metadata: { entityId: c.sourceEntityId }
                            });
                        }
                    }
                });
            },

            applyDamage: (amount, type, targetIds) => set((state) => {
                const isHeal = amount < 0;
                const sessionStore = (window as any).useSessionOSStore?.getState?.();

                const newCombatants = state.combatants.map(c => {
                    if (!targetIds.includes(c.id)) return c;

                    // 1. Sync with Session OS Health Systems if linked
                    if (sessionStore) {
                        const targetId = c.isPlayer ? c.sourcePlayerId : c.sourceEntityId;
                        const targetType = c.isPlayer ? 'pc' : 'npc';
                        
                        if (targetId) {
                            // Map damage type to a DamageImpact object for the HealthInterpreter
                            const impact = {
                                value: Math.abs(amount),
                                type: type,
                                isRecovery: isHeal
                            };
                            
                            // Call the session store's impact handler
                            // This will trigger the specialized logic (wounds, boxes, etc.)
                            sessionStore.handleApplyImpact(targetId, targetType, impact);
                            
                            // Also update the local combatant's healthSystem snapshot for the Hub/Remote
                            const updatedSource = targetType === 'pc' 
                                ? sessionStore.players.flatMap((p: any) => p.characters).find((char: any) => char.id === targetId)
                                : sessionStore.entities.find((e: any) => e.id === targetId);
                            
                            if (updatedSource && updatedSource.healthSystem) {
                                c.healthSystem = updatedSource.healthSystem;
                            }
                        }
                    }

                    // 2. Standard HP Logic (Legacy/Combat Snapshot)
                    let finalAmount = amount;
                    if (!isHeal) {
                        if (c.immunities?.includes(type)) finalAmount = 0;
                        else if (c.resistances?.includes(type)) finalAmount = Math.floor(amount / 2);
                        else if (c.vulnerabilities?.includes(type)) finalAmount = amount * 2;
                    }

                    const newHp = Math.min(c.hpMax, Math.max(0, c.hp - finalAmount));
                    
                    // Auto-Status Mapping
                    let newStatuses = [...c.statuses];
                    const typeLower = type.toLowerCase();
                    let statusToAdd: Omit<StatusEffect, 'id'> | null = null;

                    if (typeLower.includes('feu') || typeLower.includes('fire')) {
                        statusToAdd = { name: 'En feu', duration: 3, icon: '🔥' };
                    } else if (typeLower.includes('froid') || typeLower.includes('glace') || typeLower.includes('ice') || typeLower.includes('cold')) {
                        statusToAdd = { name: 'Gelé', duration: 2, icon: '❄️' };
                    } else if (typeLower.includes('acide') || typeLower.includes('acid')) {
                        statusToAdd = { name: 'Corrodé', duration: 2, icon: '🧪' };
                    } else if (typeLower.includes('éclair') || typeLower.includes('foudre') || typeLower.includes('lightn') || typeLower.includes('shock')) {
                        statusToAdd = { name: 'Choqué', duration: 1, icon: '⚡' };
                    } else if (typeLower.includes('poison')) {
                        statusToAdd = { name: 'Empoisonné', duration: 3, icon: '🤢' };
                    } else if (typeLower.includes('nécro') || typeLower.includes('necro')) {
                        statusToAdd = { name: 'Affaibli', duration: 2, icon: '💀' };
                    } else if (typeLower.includes('psych')) {
                        statusToAdd = { name: 'Confus', duration: 1, icon: '😵' };
                    } else if (typeLower.includes('radia') || typeLower.includes('solar') || typeLower.includes('lumi')) {
                        statusToAdd = { name: 'Ébloui', duration: 1, icon: '✨' };
                    } else if (isHeal || typeLower.includes('soin') || typeLower.includes('heal')) {
                        statusToAdd = { name: 'Soin', duration: 1, icon: '💖' };
                    }

                    if (statusToAdd) {
                        const conflicts = STATUS_CONFLICT_MAP[statusToAdd.name] || [];
                        newStatuses = newStatuses.filter(s => !conflicts.includes(s.name));
                        newStatuses.push({ 
                            ...statusToAdd, 
                            id: Math.random().toString(36).substring(2, 9) 
                        });
                        gmToast(`${c.name} : Statut auto [${statusToAdd.name}] appliqué`, "info");
                    }

                    if (finalAmount > 0) {
                        gmToast(`${c.name} subit ${finalAmount} dégâts (${type})`, "info");
                    } else if (finalAmount < 0) {
                        gmToast(`${c.name} récupère ${Math.abs(finalAmount)} PV`, "success");
                    }

                    return { ...c, hp: newHp, statuses: newStatuses };
                });


                return { combatants: newCombatants };
            }),

            setTarget: (combatantId, targetId) => set((state) => ({
                combatants: state.combatants.map(c => 
                    c.id === combatantId ? { ...c, targetId: targetId || undefined } : c
                )
            }))
        }),
        {
            name: 'gmos-combat-storage',
            partialize: (state) => ({ combatants: state.combatants, round: state.round, currentTurnIdx: state.currentTurnIdx })
        }
    )
);

// Export for cross-store access
if (typeof window !== 'undefined') {
    (window as unknown as Record<string, unknown>).useCombatStore = useCombatStore;
}
