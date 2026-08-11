import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { gmToast } from '../../stores/useToastStore';
import { useJournalStore } from '../journal/useJournalStore';
import type { Player, Entity, PlayerCharacter, SessionOSState } from '../session/useSessionOSStore';
import { 
    type Combatant, 
    type StatusEffect 
} from './types';
import { 
    calculateDamageImpact, 
    filterConflictingStatuses, 
    generateEffectId, 
    processStatusDurations, 
    resolveInitiativeFormula
} from './logic/CombatRules';
import { HealthInterpreter } from '../session/logic/HealthInterpreter';

// Re-export pour compatibilité descendante
export type { Combatant, StatusEffect };
export { STATUS_CONFLICT_MAP, COMBAT_AUTO_STATUS_RULES } from './logic/CombatRules';

/**
 * Interface d'état globale pour le Combat-OS.
 * Gère le cycle de vie d'un combat, de l'initiative au résumé final.
 */
interface CombatState {
    /** Liste des combattants actifs sur le plateau */
    combatants: Combatant[];
    /** Index du combattant dont c'est le tour */
    currentTurnIdx: number;
    /** Numéro du round actuel */
    round: number;
    /** Indique si le tracker de combat est projeté sur le Player Hub */
    isCombatProjected: boolean;
    /** État de synchronisation avec les terminaux distants */
    isRemoteSyncing?: boolean;

    // --- Actions --- //

    // CRUD
    /** Ajoute un nouveau participant au combat */
    addCombatant: (combatant: Omit<Combatant, 'id'>) => void;
    /** Retire un participant du combat */
    removeCombatant: (id: string) => void;
    /** Met à jour les données d'un combattant */
    updateCombatant: (id: string, updates: Partial<Combatant>) => void;
    /** Vide la liste complète des combattants et génère un rapport dans le Journal */
    clearCombatants: () => void;

    // Initiative
    /** Définit manuellement l'initiative d'un combattant */
    setInitiative: (id: string, init: number) => void;
    /** Trie la liste par initiative */
    sortInitiative: (ascending?: boolean) => void;
    /** Lance l'initiative automatique pour tous les combattants via DiceEngine ou formules */
    rollAutoInitiative: (params: { diceMax?: number; formula?: string; resolver?: (name: string, combatant: Combatant) => number; sortOrder?: 'asc' | 'desc'; cards?: number }) => void;
    /** Réordonne manuellement les combattants (ex: via Drag & Drop) */
    reorderCombatants: (startIndex: number, endIndex: number) => void;

    // Turns
    /** Passe au tour suivant et réduit la durée des effets d'état */
    nextTurn: () => void;
    /** Revient au tour précédent */
    prevTurn: () => void;
    /**
     * Désigne directement le combattant actif.
     *
     * Ce que `nextTurn` ne sait pas faire : il avance d'un cran dans une liste
     * triée. Quand l'ordre d'action n'est pas un classement — l'alternance de
     * Dune, où le camp actif choisit son intervenant — c'est le seul geste qui
     * ait un sens.
     */
    setCurrentTurnTo: (combatantId: string) => void;
    /** Réinitialise les rounds et les initiatives sans vider la liste */
    resetCombat: () => void;

    // Statuses
    /** Ajoute un effet d'état à un combattant (gère les conflits automatiques) */
    addStatus: (combatantId: string, status: Omit<StatusEffect, 'id'>) => void;
    /** Retire un effet d'état spécifique */
    removeStatus: (combatantId: string, statusId: string) => void;
    /** Active/Désactive la projection sur le Player Hub */
    setIsCombatProjected: (projected: boolean) => void;

    // Sync
    /** Synchronise les PV actuels des combattants vers Session-OS (Persistance) */
    syncCombatantHPToSession: () => void;
    /** Synchronise un combattant spécifique vers Session-OS */
    syncCombatantToSession: (id: string) => void;
    /** Propage les états critiques (mort, etc.) vers Session-OS */
    propagateStatusToSession: () => void;
    /** Envoie l'état actuel du combat vers les écrans distants via le Bridge */
    broadcastSync: () => void;
    
    // Damage/Heal
    /** Applique des dégâts ou des soins à un groupe de cibles (gère résistances/vulnérabilités) */
    applyDamage: (amount: number, type: string, targetIds: string[]) => void;
    /** Définit la cible prioritaire d'un participant */
    setTarget: (combatantId: string, targetId: string | null) => void;
    
    // Snapshot System
    /** Restaure l'état du combat à partir d'un snapshot de session */
    applySnapshot: (snapshot: { combatants: Combatant[]; currentTurnIdx: number; round: number }) => void;
    /** Réinitialise complètement le store */
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
                if (typeof window === 'undefined') return;
                const bridge = (window as any).appBridge;
                if (!bridge?.remote?.sendSync) return;
                
                const { combatants, currentTurnIdx, round, isCombatProjected } = get();
                const { resolveToSendableUrl } = await import('../../utils/mediaResolver');

                const resolvedCombatants = (await Promise.all(
                    combatants.map(async (c) => ({
                        ...c,
                        avatar: await resolveToSendableUrl(c.avatar)
                    }))
                )).filter(c => c.isPlayer || !c.statuses.some(s => {
                    const n = s.name.toLowerCase();
                    return n === 'invisible' || n === 'invisibilité' || n === 'caché' || n === 'hidden';
                }));
                
                bridge.remote.sendSync({
                    combat: { combatants: resolvedCombatants, currentTurnIdx, round, isCombatProjected }
                });
            },

            addCombatant: (combatant) => {
                set((state) => ({
                    combatants: [...state.combatants, { 
                        ...combatant, 
                        id: generateEffectId(),
                        faction: combatant.faction || (combatant.isPlayer ? 'player' : 'enemy')
                    }]
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
                get().syncCombatantToSession(id);
                get().broadcastSync();
            },

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

            rollAutoInitiative: ({ diceMax = 20, formula, resolver, sortOrder = 'desc', cards }) => {
                set((state) => {
                    const combatants = state.combatants;
                    if (combatants.length === 0) {
                        gmToast("Aucun combattant dans la liste !", "warning");
                        return state;
                    }

                    const newCombatants = combatants.map(c => ({ ...c }));
                    let cardPool: number[] = [];
                    if (cards && cards > 0) {
                        cardPool = Array.from({ length: cards }, (_, i) => i + 1);
                        for (let i = cardPool.length - 1; i > 0; i--) {
                            const j = Math.floor(Math.random() * (i + 1));
                            [cardPool[i], cardPool[j]] = [cardPool[j], cardPool[i]];
                        }
                    }

                    let cardIdx = 0;
                    newCombatants.forEach(c => {
                        let rolled = 0;
                        if (cardPool.length > 0) {
                            if (cardIdx < cardPool.length) rolled = cardPool[cardIdx++];
                            else rolled = Math.floor(Math.random() * (cards || 10)) + 1;
                        } else if (formula) {
                            rolled = resolveInitiativeFormula({
                                formula,
                                combatant: c,
                                resolver,
                                diceMax
                            });
                        } else {
                            rolled = Math.floor(Math.random() * diceMax) + 1;
                        }
                        c.init = Number.isNaN(rolled) ? 0 : rolled;
                    });

                    newCombatants.sort((a, b) => sortOrder === 'desc' ? b.init - a.init : a.init - b.init);
                    gmToast(`Initiative système lancée (${sortOrder === 'desc' ? 'Décroissant' : 'Croissant'})`, "success");
                    
                    useJournalStore.getState().addEvent({
                        type: 'COMBAT',
                        title: 'Combat : Initiative',
                        content: `Round ${state.round} - L'initiative a été tirée pour ${newCombatants.length} combattants.`,
                        metadata: { round: state.round, count: newCombatants.length }
                    });

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
                    const activeCombatant = newCombatants[nextIdx];
                    if (activeCombatant && typeof window !== 'undefined') {
                        const bridge = (window as any).appBridge;
                        if (bridge && bridge.highlightMapToken) {
                            bridge.highlightMapToken(activeCombatant.name);
                        }
                    }
                    
                    const newState = { currentTurnIdx: nextIdx, round: nextRound, combatants: newCombatants };
                    return newState;
                });
                get().broadcastSync();
            },

            setCurrentTurnTo: (combatantId) => {
                set((state) => {
                    const idx = state.combatants.findIndex(c => c.id === combatantId);
                    if (idx < 0) return state;
                    // Même traitement des durées que `nextTurn` : un effet doit
                    // décroître parce qu'un tour commence, pas parce qu'on a
                    // cliqué sur un bouton plutôt qu'un autre.
                    const newCombatants = state.combatants.map((c, i) =>
                        i === idx ? { ...c, statuses: processStatusDurations(c.statuses) } : c
                    );
                    const actif = newCombatants[idx];
                    if (actif && typeof window !== 'undefined') {
                        const bridge = (window as any).appBridge;
                        if (bridge && bridge.highlightMapToken) {
                            bridge.highlightMapToken(actif.name);
                        }
                    }
                    return { currentTurnIdx: idx, combatants: newCombatants };
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
                    const activeCombatant = state.combatants[prevIdx];
                    if (activeCombatant && typeof window !== 'undefined') {
                        const bridge = (window as any).appBridge;
                        if (bridge && bridge.highlightMapToken) {
                            bridge.highlightMapToken(activeCombatant.name);
                        }
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
                set((state) => {
                    return {
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
                    };
                });
                get().syncCombatantToSession(combatantId);
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
                get().syncCombatantToSession(combatantId);
                get().broadcastSync();
            },

            setIsCombatProjected: (projected: boolean) => {
                set({ isCombatProjected: projected });
                get().broadcastSync();
            },

            syncCombatantToSession: (id: string) => {
                const combatant = get().combatants.find(c => c.id === id);
                if (!combatant) return;

                const sessionStore = (window as unknown as { useSessionOSStore?: { getState: () => SessionOSState } }).useSessionOSStore?.getState();
                if (!sessionStore) return;

                // 1. Sync HP
                if (combatant.isPlayer && combatant.sourcePlayerId) {
                    sessionStore.players.forEach((p: Player) => {
                        const char = p.characters.find((char: PlayerCharacter) => char.id === combatant.sourcePlayerId);
                        if (char) sessionStore.updateCharacterHP(p.id, char.id, combatant.hp);
                    });
                } else if (!combatant.isPlayer && combatant.sourceEntityId) {
                    if (typeof sessionStore.updateEntityHP === 'function') {
                        sessionStore.updateEntityHP(combatant.sourceEntityId, combatant.hp);
                    }
                    
                    // 2. Sync Narrative & Status
                    const isMort = combatant.statuses.some(s => s.name.toLowerCase() === 'mort' || s.icon === '💀');
                    const entityUpdates: Partial<Entity> = {
                        status: isMort ? 'dead' : 'alive',
                        roleplayingNotes: combatant.roleplayingNotes,
                        gmSecretInfo: combatant.gmSecretInfo
                    };
                    
                    if (typeof sessionStore.updateEntity === 'function') {
                        sessionStore.updateEntity(combatant.sourceEntityId, entityUpdates);
                    }
                }
            },

            syncCombatantHPToSession: () => {
                const { combatants } = get();
                combatants.forEach(c => get().syncCombatantToSession(c.id));
            },

            propagateStatusToSession: () => {
                const { combatants } = get();
                const sessionStore = (window as unknown as { useSessionOSStore?: { getState: () => SessionOSState } }).useSessionOSStore?.getState();
                if (!sessionStore) return;
                combatants.forEach(c => {
                    const isMort = c.statuses.some(s => s.name.toLowerCase() === 'mort' || s.icon === '💀');
                    if (isMort && !c.isPlayer && c.sourceEntityId) {
                        if (typeof sessionStore.updateEntity === 'function') {
                            sessionStore.updateEntity(c.sourceEntityId, { status: 'dead' });
                            gmToast(`${c.name} marqué comme MORT dans la Galerie.`, "info");
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

            applyDamage: (amount, type, targetIds) => {
                set((state) => {
                    const newCombatants = state.combatants.map(c => {
                        if (!targetIds.includes(c.id)) return c;

                        // Calcul pur des conséquences (Moteur de règles)
                        const { finalAmount, newHp, statusToAdd } = calculateDamageImpact({ amount, type, target: c });

                        let newStatuses = [...c.statuses];
                        if (statusToAdd) {
                            const filtered = filterConflictingStatuses(newStatuses, statusToAdd.name);
                            newStatuses = [...filtered, { ...statusToAdd, id: generateEffectId() }];
                        }

                        /**
                         * **Le système de santé suit enfin les dégâts.**
                         *
                         * `HealthInterpreter` sait remplir une horloge, cocher une
                         * case, descendre un palier de blessure — cinq modèles,
                         * purs et testés. Rien ne l'appelait ici : on n'écrivait
                         * que `hp`, si bien qu'un combattant à horloges encaissait
                         * des coups sans que son horloge ne bouge. Le modèle
                         * existait, il n'était pas branché.
                         *
                         * Les résistances ont déjà été appliquées ci-dessus, par
                         * les listes du combattant. On ne transmet donc pas le
                         * `type` : `processResistances` les rejouerait depuis les
                         * étiquettes de la fiche de santé, et un coup de feu
                         * résisté serait divisé deux fois.
                         */
                        const healthSystem = c.healthSystem
                            ? HealthInterpreter.calculateNextState(c.healthSystem, {
                                value: Math.abs(finalAmount),
                                isRecovery: finalAmount < 0,
                            })
                            : c.healthSystem;

                        return { ...c, hp: newHp, healthSystem, statuses: newStatuses };
                    });
                    return { combatants: newCombatants };
                });
                
                // Synchronisation différée pour la stabilité
                targetIds.forEach(id => get().syncCombatantToSession(id));
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

// Export for cross-store access (safe window cast)
if (typeof window !== 'undefined') {
    (window as unknown as { useCombatStore: typeof useCombatStore }).useCombatStore = useCombatStore;
}
