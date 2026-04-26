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

export function syncHealthSystem(currentHp: number, maxHp: number, existingHealth?: HealthSystem): HealthSystem | undefined {
    // If there's an existing system that isn't HP, do not override it.
    if (existingHealth && existingHealth.type !== 'hp') {
        return existingHealth;
    }
    const health = existingHealth || HealthInterpreter.createDefault('hp');
    return {
        ...health,
        data: { ...health.data, current: currentHp, max: maxHp },
        state: currentHp <= 0 ? 'dead' : (currentHp / maxHp) <= 0.25 ? 'critical' : (currentHp / maxHp) <= 0.5 ? 'wounded' : 'healthy'
    };
}

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
    updateEntityMaxHP: (entityId: string, maxHp: number) => void;
    updateEntityHealth: (entityId: string, health: HealthSystem) => void;
    toggleEntityVisibility: (entityId: string) => void;
    updateEntitySheetData: (id: string, fieldId: string, value: string | number | boolean) => void;
    autoSelectFirstEntity: () => void;

    // Players & Characters
    addPlayer: (player: Omit<Player, 'id'>) => void;
    deletePlayer: (playerId: string) => void;
    togglePlayerOnline: (playerId: string) => void;
    updatePlayer: (playerId: string, updates: Partial<Player>) => void;
    addCharacterToPlayer: (playerId: string, character: Omit<PlayerCharacter, 'id'>) => void;
    deleteCharacter: (playerId: string, characterId: string) => void;
    linkCharacterToCampaign: (playerId: string, characterId: string, campaignId: string | null, templateId?: string) => void;
    updateCharacterHP: (playerId: string, characterId: string, hp: number) => void;
    updateCharacterMaxHP: (playerId: string, characterId: string, maxHp: number) => void;
    updateCharacterHealth: (playerId: string, characterId: string, health: HealthSystem) => void;
    updateCharacter: (playerId: string, characterId: string, updates: Partial<PlayerCharacter>) => void;
    updateCharacterSheetData: (playerId: string, characterId: string, fieldId: string, value: string | number | boolean) => void;
    updateCharacterVisuals: (playerId: string, characterId: string, updates: { portraitUrl?: string; tokenUrl?: string }) => void;
    updateCharacterNarrative: (playerId: string, characterId: string, updates: { description?: string; gmNotes?: string; playerNotes?: string; linkedDocumentIds?: string[]; inventory?: string }) => void;
    remoteUpdateCharacterNarrative: (playerId: string, characterId: string, updates: { description?: string; playerNotes?: string; inventory?: string }) => void;
    addLootToCharacter: (playerId: string, characterId: string, item: string) => void;
    updateCharacterHubOptions: (playerId: string, characterId: string, options: Partial<PlayerCharacter['hubOptions']>) => void;
    remoteUpdateCharacterVitals: (playerId: string, characterId: string, updates: { hp?: number; mp?: number; ap?: number }) => void;

    // Inventory Management (Structured)
    addInventoryItem: (playerId: string, characterId: string, item: Omit<import('./types').InventoryItem, 'id'>) => void;
    removeInventoryItem: (playerId: string, characterId: string, itemId: string) => void;
    remoteRemoveInventoryItem: (playerId: string, characterId: string, itemId: string) => void;

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
            entities: state.entities.map((e) => {
                if (e.id !== id) return e;
                const newEntity = { ...e, ...updates };

                // Auto-sync HealthSystem
                const currentVal = updates.hp !== undefined ? updates.hp : newEntity.hp;
                const maxVal = updates.maxHp !== undefined ? updates.maxHp : newEntity.maxHp;
                newEntity.healthSystem = syncHealthSystem(currentVal, maxVal, newEntity.healthSystem);

                return newEntity;
            }),
        })),

    deleteEntity: (id) => {
        const entity = get().entities.find((e) => e.id === id);
        set((state) => ({ entities: state.entities.filter((e) => e.id !== id) }));
        if (entity) gmToast(`"${entity.name}" supprimé.`, 'info');
    },

    updateEntityHP: (entityId: string, hp: number) =>
        set((state) => ({
            entities: state.entities.map((e) => {
                if (e.id !== entityId) return e;
                
                // Calcul du nouvel état de santé
                const nextHp = Math.max(0, hp);
                const status = nextHp <= 0 ? 'dead' : nextHp < e.maxHp * 0.25 ? 'injured' : 'alive';
                
                // Préparation de la mise à jour
                const updated = { ...e, hp: nextHp, status } as Entity;

                // Synchronisation forcée du HealthSystem
                updated.healthSystem = syncHealthSystem(nextHp, e.maxHp, e.healthSystem);
                
                return updated;
            }),
        })),

    updateEntityMaxHP: (entityId: string, maxHp: number) =>
        set((state) => ({
            entities: state.entities.map((e) => {
                if (e.id !== entityId) return e;
                
                const nextMax = Math.max(1, maxHp);
                const updated = { ...e, maxHp: nextMax } as Entity;

                // Synchronisation forcée du HealthSystem
                updated.healthSystem = syncHealthSystem(e.hp, nextMax, e.healthSystem);
                return updated;
            }),
        })),

    updateEntityHealth: (entityId: string, health) =>
        set((state) => ({
            entities: state.entities.map((e) => {
                if (e.id !== entityId) return e;
                const updated = { ...e, healthSystem: health } as Entity;
                // Sync back to standard HP fields if type is HP
                if (health.type === 'hp') {
                    updated.hp = Number(health.data.current) || 0;
                    updated.maxHp = Number(health.data.max) || 10;
                    updated.status = updated.hp <= 0 ? 'dead' : updated.hp < updated.maxHp * 0.25 ? 'injured' : 'alive';
                }
                return updated;
            }),
        })),

    toggleEntityVisibility: (entityId) =>
        set((state) => ({
            entities: state.entities.map((e) => 
                e.id === entityId ? { ...e, isVisibleByPlayers: !e.isVisibleByPlayers } : e
            )
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

    updatePlayer: (playerId, updates) =>
        set((state) => ({
            players: state.players.map((p) =>
                p.id === playerId ? { ...p, ...updates } : p
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

    linkCharacterToCampaign: (playerId, characterId, campaignId, templateId) =>
        set((state) => ({
            players: state.players.map((p) =>
                p.id === playerId
                    ? {
                          ...p,
                          characters: p.characters.map((c) => {
                              if (c.id !== characterId) return c;
                              
                              // Deep Correction: If template is generic or none, and a system is provided, use it.
                              const newTemplateId = (c.templateId === 'generic' || !c.templateId) && templateId 
                                ? templateId 
                                : c.templateId;
                                
                              return { ...c, campaignId, templateId: newTemplateId };
                          }),
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
                          characters: p.characters.map((c) => {
                                if (c.id !== characterId) return c;
                                const nextHp = Math.max(0, hp);
                                const updated = { ...c, hp: nextHp } as PlayerCharacter;
                                
                                // Synchronisation forcée du HealthSystem
                                updated.healthSystem = syncHealthSystem(nextHp, c.maxHp, c.healthSystem);
                                return updated;
                          }),
                      }
                    : p
            ),
        })),

    updateCharacterMaxHP: (playerId, characterId, maxHp) =>
        set((state) => ({
            players: state.players.map((p) =>
                p.id === playerId
                    ? {
                          ...p,
                          characters: p.characters.map((c) => {
                                if (c.id !== characterId) return c;
                                const nextMax = Math.max(1, maxHp);
                                const updated = { ...c, maxHp: nextMax } as PlayerCharacter;
                                
                                // Synchronisation forcée du HealthSystem
                                updated.healthSystem = syncHealthSystem(c.hp, nextMax, c.healthSystem);
                                return updated;
                          }),
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
                          characters: p.characters.map((c) => {
                                if (c.id !== characterId) return c;
                                const updated = { ...c, healthSystem: health } as PlayerCharacter;
                                // Sync back to standard HP fields if type is HP
                                if (health.type === 'hp') {
                                    updated.hp = Number(health.data.current) || 0;
                                    updated.maxHp = Number(health.data.max) || 10;
                                }
                                return updated;
                          }),
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
                          characters: p.characters.map((c) => {
                                if (c.id !== characterId) return c;
                                const updated = { ...c, ...updates };

                                // Auto-sync HealthSystem
                                const currentVal = updates.hp !== undefined ? updates.hp : updated.hp;
                                const maxVal = updates.maxHp !== undefined ? updates.maxHp : updated.maxHp;
                                updated.healthSystem = syncHealthSystem(currentVal, maxVal, updated.healthSystem);
                                return updated;
                          }),
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

    remoteUpdateCharacterNarrative: (playerId, characterId, updates) => {
        // Mettre à jour le store local (tablette) pour un retour visuel immédiat
        get().updateCharacterNarrative(playerId, characterId, updates);

        // Envoyer l'action au MJ via le pont distant (Electron/WebSocket)
        if (typeof window !== 'undefined') {
            if (window.appBridge?.remote?.broadcastToTablets) {
                // Mode Electron (MJ ou Hub intégré)
                window.appBridge.remote.broadcastToTablets(
                    'session:update-character-narrative',
                    { playerId, characterId, updates }
                );
            } else {
                // Mode Browser (Tablette distante) via CustomEvent capturé par useHubSync
                window.dispatchEvent(new CustomEvent('session:update-character-narrative', {
                    detail: { playerId, characterId, updates }
                }));
            }
        }
    },

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

    addInventoryItem: (playerId, characterId, item) => {
        const newItem: import('./types').InventoryItem = { 
            ...item, 
            id: `it-${crypto.randomUUID()}` 
        };
        set((state) => ({
            players: state.players.map((p) =>
                p.id === playerId
                    ? {
                        ...p,
                        characters: p.characters.map((c) =>
                            c.id === characterId
                                ? { ...c, inventoryItems: [...(c.inventoryItems ?? []), newItem] }
                                : c
                        ),
                    }
                    : p
            ),
        }));
    },

    removeInventoryItem: (playerId, characterId, itemId) => {
        set((state) => ({
            players: state.players.map((p) =>
                p.id === playerId
                    ? {
                        ...p,
                        characters: p.characters.map((c) =>
                            c.id === characterId
                                ? { ...c, inventoryItems: (c.inventoryItems ?? []).filter(i => i.id !== itemId) }
                                : c
                        ),
                    }
                    : p
            ),
        }));
    },

    remoteRemoveInventoryItem: (playerId: string, characterId: string, itemId: string) => {
        // 1. Mise à jour locale (tablette) pour feedback immédiat
        get().removeInventoryItem(playerId, characterId, itemId);

        // 2. Broadcast vers le Master (pont WebSocket) via un CustomEvent capturé par useHubSync
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('session:remove-inventory-item', {
                detail: { playerId, characterId, itemId }
            }));
        }
    },

    updateCharacterHubOptions: (playerId, characterId, options) =>
        set((state) => ({
            players: state.players.map((p) =>
                p.id === playerId
                    ? {
                          ...p,
                          characters: p.characters.map((c) =>
                              c.id === characterId
                                  ? { ...c, hubOptions: { ...(c.hubOptions ?? { showHP: true, showMP: true, showAP: true, showInventory: true, showRelations: true }), ...options } }
                                  : c
                          ),
                      }
                    : p
            ),
        })),

    remoteUpdateCharacterVitals: (playerId, characterId, updates) => {
        const player = get().players.find((p) => p.id === playerId);
        const character = player?.characters.find((c) => c.id === characterId);

        if (!player || !character) return;

        // Apply updates locally
        if (updates.hp !== undefined) get().updateCharacterHP(playerId, characterId, updates.hp);

        // Notify MJ
        const messageParts = [];
        if (updates.hp !== undefined) messageParts.push(`PV: ${updates.hp}/${character.maxHp}`);

        if (messageParts.length > 0) {
            const store = get() as unknown as import('./index').SessionOSStore;
            store.addRemoteNotification?.({
                type: 'vitals_update',
                characterId,
                characterName: character.name,
                playerName: player.realName,
                message: `Modification à distance : ${messageParts.join(', ')}`,
            });
        }
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
