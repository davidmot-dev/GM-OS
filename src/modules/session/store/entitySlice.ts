/**
 * Session-OS Store — Entity Slice
 *
 * Gère toutes les entités de jeu (PNJ, Monstres, PJ).
 * Intègre le système de santé modulaire via HealthInterpreter.
 *
 * @module session/store/entitySlice
 */

import type { StateCreator } from 'zustand';
import { gmToast } from '../../../stores/useToastStore';
import { useJournalStore } from '../../journal/useJournalStore';
import { HealthInterpreter } from '../logic/HealthInterpreter';
import type {
    Entity,
    Player,
    PlayerCharacter,
    HealthSystem,
    EntityRelation,
    PersistenceBadge,
    DamageImpact,
} from './types';

// ─────────────────────────────────────────────
// State
// ─────────────────────────────────────────────

export interface EntitySliceState {
    entities: Entity[];
    players: Player[];
}

// ─────────────────────────────────────────────
// Actions
// ─────────────────────────────────────────────

export interface EntitySliceActions {
    // Entities (NPC / Monsters)
    addEntity: (entity: Omit<Entity, 'id'>) => void;
    updateEntity: (id: string, updates: Partial<Entity>) => void;
    deleteEntity: (id: string) => void;
    updateEntityHP: (entityId: string, hp: number) => void;
    updateEntityHealth: (entityId: string, health: HealthSystem) => void;
    updateEntitySheetData: (id: string, fieldId: string, value: string | number | boolean) => void;
    autoSelectFirstEntity: () => void;

    // Players & Characters
    addPlayer: (player: Omit<Player, 'id'>) => void;
    deletePlayer: (playerId: string) => void;
    togglePlayerOnline: (playerId: string) => void;
    addCharacterToPlayer: (playerId: string, character: Omit<PlayerCharacter, 'id'>) => void;
    deleteCharacter: (playerId: string, characterId: string) => void;
    linkCharacterToCampaign: (playerId: string, characterId: string, campaignId: string | null) => void;
    updateCharacterHP: (playerId: string, characterId: string, hp: number) => void;
    updateCharacterHealth: (playerId: string, characterId: string, health: HealthSystem) => void;
    updateCharacter: (playerId: string, characterId: string, updates: Partial<PlayerCharacter>) => void;
    updateCharacterSheetData: (playerId: string, characterId: string, fieldId: string, value: string | number | boolean) => void;
    updateCharacterVisuals: (playerId: string, characterId: string, updates: { portraitUrl?: string; tokenUrl?: string }) => void;
    updateCharacterNarrative: (playerId: string, characterId: string, updates: { description?: string; gmNotes?: string; linkedDocumentIds?: string[]; inventory?: string }) => void;
    addLootToCharacter: (playerId: string, characterId: string, item: string) => void;

    // Health / Impact System
    handleApplyImpact: (targetId: string, targetType: 'pc' | 'npc', impact: DamageImpact) => void;
    addPersistenceBadge: (targetId: string, targetType: 'pc' | 'npc', badge: Omit<PersistenceBadge, 'id'>) => void;
    removePersistenceBadge: (targetId: string, targetType: 'pc' | 'npc', badgeId: string) => void;

    // Social Graph
    addRelation: (sourceId: string, sourceType: 'pc' | 'npc', relation: EntityRelation) => void;
    removeRelation: (sourceId: string, sourceType: 'pc' | 'npc', targetId: string) => void;
}

export type EntitySlice = EntitySliceState & EntitySliceActions;

// ─────────────────────────────────────────────
// Creator
// ─────────────────────────────────────────────

export const createEntitySlice: StateCreator<EntitySlice, [], [], EntitySlice> = (set, get) => ({
    // Initial State
    entities: [],
    players: [],

    // ─── Entities ────────────────────────────────

    addEntity: (entity) => {
        const newEntity: Entity = { ...entity, id: `e-${Date.now()}` };
        set((state) => ({ entities: [...state.entities, newEntity] }));
        gmToast(`Entité "${newEntity.name}" créée.`, 'success');
    },

    updateEntity: (id, updates) =>
        set((state) => ({
            entities: state.entities.map((e) => (e.id === id ? { ...e, ...updates } : e)),
        })),

    deleteEntity: (id) => {
        const entity = get().entities.find((e) => e.id === id);
        set((state) => ({ entities: state.entities.filter((e) => e.id !== id) }));
        if (entity) gmToast(`"${entity.name}" supprimé.`, 'info');
    },

    updateEntityHP: (entityId, hp) =>
        set((state) => ({
            entities: state.entities.map((e) =>
                e.id === entityId
                    ? { ...e, hp, status: hp <= 0 ? 'dead' : hp < e.maxHp * 0.25 ? 'injured' : 'alive' }
                    : e
            ),
        })),

    updateEntityHealth: (entityId, health) =>
        set((state) => ({
            entities: state.entities.map((e) =>
                e.id === entityId ? { ...e, healthSystem: health } : e
            ),
        })),

    updateEntitySheetData: (id, fieldId, value) =>
        set((state) => ({
            entities: state.entities.map((e) =>
                e.id === id ? { ...e, sheetData: { ...e.sheetData, [fieldId]: value } } : e
            ),
        })),

    autoSelectFirstEntity: () => {
        // Implémentée dans le root store (dépend de activeCampaignId du campaignSlice)
    },

    // ─── Players & Characters ────────────────────

    addPlayer: (player) => {
        const newPlayer: Player = { ...player, id: `p-${Date.now()}` };
        set((state) => ({ players: [...state.players, newPlayer] }));
    },

    deletePlayer: (playerId) =>
        set((state) => ({ players: state.players.filter((p) => p.id !== playerId) })),

    togglePlayerOnline: (playerId) =>
        set((state) => ({
            players: state.players.map((p) =>
                p.id === playerId ? { ...p, isOnline: !p.isOnline } : p
            ),
        })),

    addCharacterToPlayer: (playerId, character) => {
        const newChar: PlayerCharacter = { ...character, id: `pc-${Date.now()}` };
        set((state) => ({
            players: state.players.map((p) =>
                p.id === playerId ? { ...p, characters: [...p.characters, newChar] } : p
            ),
        }));
    },

    deleteCharacter: (playerId, characterId) =>
        set((state) => ({
            players: state.players.map((p) =>
                p.id === playerId
                    ? { ...p, characters: p.characters.filter((c) => c.id !== characterId) }
                    : p
            ),
        })),

    linkCharacterToCampaign: (playerId, characterId, campaignId) =>
        set((state) => ({
            players: state.players.map((p) =>
                p.id === playerId
                    ? {
                          ...p,
                          characters: p.characters.map((c) =>
                              c.id === characterId ? { ...c, campaignId } : c
                          ),
                      }
                    : p
            ),
        })),

    updateCharacterHP: (playerId, characterId, hp) =>
        set((state) => ({
            players: state.players.map((p) =>
                p.id === playerId
                    ? {
                          ...p,
                          characters: p.characters.map((c) =>
                              c.id === characterId ? { ...c, hp } : c
                          ),
                      }
                    : p
            ),
        })),

    updateCharacterHealth: (playerId, characterId, health) =>
        set((state) => ({
            players: state.players.map((p) =>
                p.id === playerId
                    ? {
                          ...p,
                          characters: p.characters.map((c) =>
                              c.id === characterId ? { ...c, healthSystem: health } : c
                          ),
                      }
                    : p
            ),
        })),

    updateCharacter: (playerId, characterId, updates) =>
        set((state) => ({
            players: state.players.map((p) =>
                p.id === playerId
                    ? {
                          ...p,
                          characters: p.characters.map((c) =>
                              c.id === characterId ? { ...c, ...updates } : c
                          ),
                      }
                    : p
            ),
        })),

    updateCharacterSheetData: (playerId, characterId, fieldId, value) =>
        set((state) => ({
            players: state.players.map((p) =>
                p.id === playerId
                    ? {
                          ...p,
                          characters: p.characters.map((c) =>
                              c.id === characterId
                                  ? { ...c, sheetData: { ...c.sheetData, [fieldId]: value } }
                                  : c
                          ),
                      }
                    : p
            ),
        })),

    updateCharacterVisuals: (playerId, characterId, updates) =>
        set((state) => ({
            players: state.players.map((p) =>
                p.id === playerId
                    ? {
                          ...p,
                          characters: p.characters.map((c) =>
                              c.id === characterId ? { ...c, ...updates } : c
                          ),
                      }
                    : p
            ),
        })),

    updateCharacterNarrative: (playerId, characterId, updates) =>
        set((state) => ({
            players: state.players.map((p) =>
                p.id === playerId
                    ? {
                          ...p,
                          characters: p.characters.map((c) =>
                              c.id === characterId ? { ...c, ...updates } : c
                          ),
                      }
                    : p
            ),
        })),

    addLootToCharacter: (playerId, characterId, item) => {
        set((state) => ({
            players: state.players.map((p) =>
                p.id === playerId
                    ? {
                          ...p,
                          characters: p.characters.map((c) =>
                              c.id === characterId
                                  ? { ...c, inventory: `${c.inventory ?? ''}\n- ${item}`.trim() }
                                  : c
                          ),
                      }
                    : p
            ),
        }));
    },

    // ─── Health / Impact System ───────────────────

    handleApplyImpact: (targetId, targetType, impact) => {
        const { entities, players } = get();

        if (targetType === 'npc') {
            const entity = entities.find((e) => e.id === targetId);
            if (!entity || !entity.healthSystem) return;

            const updatedHealth = HealthInterpreter.calculateNextState(entity.healthSystem, impact);
            const newHp = (updatedHealth.data.current as number) ?? entity.hp;
            get().updateEntityHealth(targetId, updatedHealth);
            get().updateEntityHP(targetId, newHp);

            useJournalStore.getState().addEvent({
                type: 'COMBAT',
                title: `💥 Impact sur ${entity.name}`,
                content: `HP : ${newHp} / ${entity.maxHp} — État : ${updatedHealth.state}`,
            });
        } else {
            const player = players.find((p) =>
                p.characters.some((c) => c.id === targetId)
            );
            const character = player?.characters.find((c) => c.id === targetId);
            if (!player || !character || !character.healthSystem) return;

            const updatedHealth = HealthInterpreter.calculateNextState(character.healthSystem, impact);
            const newHp = (updatedHealth.data.current as number) ?? character.hp;
            get().updateCharacterHealth(player.id, targetId, updatedHealth);
            get().updateCharacterHP(player.id, targetId, newHp);

            useJournalStore.getState().addEvent({
                type: 'COMBAT',
                title: `💥 Impact sur ${character.name}`,
                content: `HP : ${newHp} / ${character.maxHp} — État : ${updatedHealth.state}`,
            });
        }
    },

    addPersistenceBadge: (targetId, targetType, badge) => {
        const newBadge: PersistenceBadge = { ...badge, id: `badge-${Date.now()}` };

        if (targetType === 'npc') {
            set((state) => ({
                entities: state.entities.map((e) =>
                    e.id === targetId
                        ? {
                              ...e,
                              healthSystem: e.healthSystem
                                  ? { ...e.healthSystem, badges: [...e.healthSystem.badges, newBadge] }
                                  : undefined,
                          }
                        : e
                ),
            }));
        } else {
            set((state) => ({
                players: state.players.map((p) => ({
                    ...p,
                    characters: p.characters.map((c) =>
                        c.id === targetId
                            ? {
                                  ...c,
                                  healthSystem: c.healthSystem
                                      ? { ...c.healthSystem, badges: [...c.healthSystem.badges, newBadge] }
                                      : undefined,
                              }
                            : c
                    ),
                })),
            }));
        }
    },

    removePersistenceBadge: (targetId, targetType, badgeId) => {
        if (targetType === 'npc') {
            set((state) => ({
                entities: state.entities.map((e) =>
                    e.id === targetId
                        ? {
                              ...e,
                              healthSystem: e.healthSystem
                                  ? {
                                        ...e.healthSystem,
                                        badges: e.healthSystem.badges.filter((b) => b.id !== badgeId),
                                    }
                                  : undefined,
                          }
                        : e
                ),
            }));
        } else {
            set((state) => ({
                players: state.players.map((p) => ({
                    ...p,
                    characters: p.characters.map((c) =>
                        c.id === targetId
                            ? {
                                  ...c,
                                  healthSystem: c.healthSystem
                                      ? {
                                            ...c.healthSystem,
                                            badges: c.healthSystem.badges.filter((b) => b.id !== badgeId),
                                        }
                                      : undefined,
                              }
                            : c
                    ),
                })),
            }));
        }
    },

    // ─── Social Graph ─────────────────────────────

    addRelation: (sourceId, sourceType, relation) => {
        if (sourceType === 'npc') {
            set((state) => ({
                entities: state.entities.map((e) =>
                    e.id === sourceId
                        ? { ...e, relations: [...(e.relations ?? []), relation] }
                        : e
                ),
            }));
        } else {
            set((state) => ({
                players: state.players.map((p) => ({
                    ...p,
                    characters: p.characters.map((c) =>
                        c.id === sourceId
                            ? { ...c, relations: [...(c.relations ?? []), relation] }
                            : c
                    ),
                })),
            }));
        }
    },

    removeRelation: (sourceId, sourceType, targetId) => {
        if (sourceType === 'npc') {
            set((state) => ({
                entities: state.entities.map((e) =>
                    e.id === sourceId
                        ? {
                              ...e,
                              relations: (e.relations ?? []).filter((r) => r.targetId !== targetId),
                          }
                        : e
                ),
            }));
        } else {
            set((state) => ({
                players: state.players.map((p) => ({
                    ...p,
                    characters: p.characters.map((c) =>
                        c.id === sourceId
                            ? {
                                  ...c,
                                  relations: (c.relations ?? []).filter((r) => r.targetId !== targetId),
                              }
                            : c
                    ),
                })),
            }));
        }
    },
});
