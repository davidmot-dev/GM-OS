import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DiceEngine } from '../dice/DiceEngine';
import { gmToast } from '../../stores/useToastStore';
import { useJournalStore } from '../journal/useJournalStore';
import type { HealthSystem, Player, Entity, PlayerCharacter } from '../session/useSessionOSStore';

/**
 * Représente un effet d'état appliqué à un combattant (ex: Brûlé, Étourdi).
 */
export interface StatusEffect {
    /** Identifiant unique de l'instance d'effet */
    id: string; 
    /** Nom de l'effet (utilisé pour les conflits et la logique) */
    name: string;
    /** Durée en rounds (0 = infini) */
    duration: number; 
    /** Icône représentative (Emoji ou nom Lucide) */
    icon: string; 
}

/**
 * Entité participant à un combat.
 * Peut être liée à un personnage joueur (PC) ou un PNJ (NPC).
 */
export interface Combatant {
    id: string;
    name: string;
    /** Valeur d'initiative pour l'ordre de passage */
    init: number;
    hp: number;
    hpMax: number;
    /** Indique si le combattant est un PJ */
    isPlayer: boolean;
    /** Faction pour l'affichage et l'IA (Ami, Ennemi, Neutre) */
    faction: 'player' | 'enemy' | 'neutral' | 'ally';
    /** ID du combattant actuellement ciblé */
    targetId?: string;
    /** Lien vers l'ID du PlayerCharacter dans Session-OS (si isPlayer: true) */
    sourcePlayerId?: string; 
    /** Lien vers l'ID de l'entité NPC/Monstre dans Session-OS (si isPlayer: false) */
    sourceEntityId?: string; 
    /** URL de l'avatar ou du jeton */
    avatar?: string;
    /** Liste des effets d'état actifs */
    statuses: StatusEffect[];
    /** Statistiques additionnelles (Mana, Santé Mentale, etc.) */
    extraStats?: Record<string, { value: number; max: number }>; 
    resistances?: string[];
    vulnerabilities?: string[];
    immunities?: string[];
    /** Système de santé spécifique (ex: D&D 5e, Savage Worlds) */
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
                        id: Math.random().toString(36).substring(2, 9),
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
                            let evaluatedFormula = formula;
                            if (resolver) {
                                const varRegex = /\[([^\]]+)\]|\\b([a-zA-ZÀ-ÿ_]+)\\b/gi;
                                const matches = Array.from(formula.matchAll(varRegex));
                                matches.sort((a, b) => b[0].length - a[0].length);
                                matches.forEach(match => {
                                    const fullMatch = match[0];
                                    const innerVar = match[1] || match[2];
                                    if (innerVar.toLowerCase() === 'd' && /^\\d*d\\d+$/i.test(fullMatch)) return;
                                    const val = resolver(innerVar, c);
                                    if (val !== undefined && !Number.isNaN(val)) {
                                        evaluatedFormula = evaluatedFormula.replace(fullMatch, val.toString());
                                    }
                                });
                            }
                            evaluatedFormula = evaluatedFormula.replace(/[a-zA-ZÀ-ÿ_]+/g, (match) => {
                                if (match.toLowerCase() === 'd') return match;
                                return '0';
                            });
                            evaluatedFormula = evaluatedFormula.replace(/[^0-9dD+\\-\\*/\\s]/g, '');
                            try {
                                const res = DiceEngine.rollFormula(evaluatedFormula);
                                rolled = Number.isNaN(res.total) ? 0 : res.total;
                            } catch {
                                rolled = Math.floor(Math.random() * diceMax) + 1;
                            }
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
                                statuses: c.statuses.reduce((acc, s) => {
                                    if (s.duration === 0) acc.push(s);
                                    else if (s.duration > 1) acc.push({ ...s, duration: s.duration - 1 });
                                    return acc;
                                }, [] as StatusEffect[])
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
                    const conflicts = STATUS_CONFLICT_MAP[status.name] || [];
                    return {
                        combatants: state.combatants.map(c => {
                            if (c.id === combatantId) {
                                const filteredStatuses = c.statuses.filter(s => !conflicts.includes(s.name));
                                return {
                                    ...c,
                                    statuses: [...filteredStatuses, { ...status, id: Math.random().toString(36).substring(2, 9) }]
                                };
                            }
                            return c;
                        })
                    };
                });
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
                const { combatants } = get();
                const sessionStore = (window as unknown as { useSessionOSStore?: { getState: () => any } }).useSessionOSStore?.getState();
                if (!sessionStore) return;
                combatants.forEach(c => {
                    if (c.isPlayer && c.sourcePlayerId) {
                        sessionStore.players.forEach((p: Player) => {
                            const char = p.characters.find((char: PlayerCharacter) => char.id === c.sourcePlayerId);
                            if (char) sessionStore.updateCharacterHP(p.id, char.id, c.hp);
                        });
                    } else if (!c.isPlayer && c.sourceEntityId) {
                        if (typeof sessionStore.updateEntityHP === 'function') sessionStore.updateEntityHP(c.sourceEntityId, c.hp);
                    }
                });
            },

            propagateStatusToSession: () => {
                const { combatants } = get();
                const sessionStore = (window as unknown as { useSessionOSStore?: { getState: () => any } }).useSessionOSStore?.getState();
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
                    const isHeal = amount < 0;
                    const sessionStore = (window as unknown as { useSessionOSStore?: { getState: () => any } }).useSessionOSStore?.getState();
                    const newCombatants = state.combatants.map(c => {
                        if (!targetIds.includes(c.id)) return c;
                        if (sessionStore) {
                            const targetId = c.isPlayer ? c.sourcePlayerId : c.sourceEntityId;
                            const targetType = c.isPlayer ? 'pc' : 'npc';
                            if (targetId) {
                                sessionStore.handleApplyImpact(targetId, targetType, { value: Math.abs(amount), type, isRecovery: isHeal });
                                const updatedSource = targetType === 'pc' 
                                    ? (sessionStore.players as Player[]).flatMap((p: Player) => p.characters).find((char: PlayerCharacter) => char.id === targetId)
                                    : (sessionStore.entities as Entity[]).find((e: Entity) => e.id === targetId);
                                if (updatedSource && updatedSource.healthSystem) c.healthSystem = updatedSource.healthSystem;
                            }
                        }
                        let finalAmount = amount;
                        if (!isHeal) {
                            if (c.immunities?.includes(type)) finalAmount = 0;
                            else if (c.resistances?.includes(type)) finalAmount = Math.floor(amount / 2);
                            else if (c.vulnerabilities?.includes(type)) finalAmount = amount * 2;
                        }
                        const newHp = Math.min(c.hpMax, Math.max(0, c.hp - finalAmount));
                        let newStatuses = [...c.statuses];
                        const typeLower = type.toLowerCase();
                        let statusToAdd: Omit<StatusEffect, 'id'> | null = null;
                        if (typeLower.includes('feu')) statusToAdd = { name: 'En feu', duration: 3, icon: '🔥' };
                        else if (typeLower.includes('froid')) statusToAdd = { name: 'Gelé', duration: 2, icon: '❄️' };
                        else if (typeLower.includes('acide')) statusToAdd = { name: 'Corrodé', duration: 2, icon: '🧪' };
                        else if (typeLower.includes('foudre')) statusToAdd = { name: 'Choqué', duration: 1, icon: '⚡' };
                        else if (isHeal) statusToAdd = { name: 'Soin', duration: 1, icon: '💖' };

                        if (statusToAdd) {
                            const conflicts = STATUS_CONFLICT_MAP[statusToAdd.name] || [];
                            newStatuses = newStatuses.filter(s => !conflicts.includes(s.name));
                            newStatuses.push({ ...statusToAdd, id: Math.random().toString(36).substring(2, 9) });
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

// Export for cross-store access (safe window cast)
if (typeof window !== 'undefined') {
    (window as unknown as { useCombatStore: typeof useCombatStore }).useCombatStore = useCombatStore;
}
