/**
 * Session-OS Store — Loot Slice
 *
 * Gère le pool de butin de la session (objets trouvés mais non encore distribués).
 *
 * @module session/store/lootSlice
 */

import type { StateCreator } from 'zustand';
import { gmToast } from '../../../stores/useToastStore';
import type { InventoryItem, LootHistoryEntry } from './types';

export interface LootSliceState {
    lootPool: InventoryItem[];
    lootHistory: LootHistoryEntry[];
}

export interface LootSliceActions {
    addLootToPool: (items: InventoryItem[]) => void;
    removeFromPool: (itemId: string) => void;
    clearLootPool: () => void;
    assignLootToCharacter: (itemId: string, playerId: string, characterId: string) => void;
    clearLootHistory: () => void;
}

export type LootSlice = LootSliceState & LootSliceActions;

export const createLootSlice: StateCreator<LootSlice, [], [], LootSlice> = (set, get) => ({
    // Initial State
    lootPool: [],
    lootHistory: [],

    // Actions
    addLootToPool: (items) => {
        set((state) => ({ lootPool: [...state.lootPool, ...items] }));
        gmToast(`${items.length} objet(s) ajouté(s) au butin de session.`, 'info');
    },

    removeFromPool: (itemId) =>
        set((state) => ({
            lootPool: state.lootPool.filter((it) => it.id !== itemId),
        })),

    clearLootPool: () => {
        set({ lootPool: [] });
        gmToast("Butin de session vidé.", "info");
    },

    clearLootHistory: () => {
        set({ lootHistory: [] });
        gmToast("Historique du butin vidé.", "info");
    },

    assignLootToCharacter: (itemId, playerId, characterId) => {
        const state = get() as any; // Casté pour accéder aux autres slices via le root store
        const item = state.lootPool.find((it: InventoryItem) => it.id === itemId);

        if (!item) {
            gmToast("Erreur : Objet introuvable dans le pool.", "error");
            return;
        }

        // 1. Ajouter à l'inventaire du personnage (via entitySlice)
        if (typeof state.addInventoryItem === 'function') {
            state.addInventoryItem(playerId, characterId, item);
            
            // 2. Retirer du pool
            get().removeFromPool(itemId);
            
            const char = state.players.flatMap((p: any) => p.characters).find((c: any) => c.id === characterId);
            
            // 3. Enregistrer dans l'historique
            const historyEntry: LootHistoryEntry = {
                id: `hist-${crypto.randomUUID()}`,
                itemId: item.id,
                itemName: item.name,
                itemType: item.type,
                rarity: item.rarity,
                quantity: item.quantity,
                value: item.value || 0,
                recipientId: characterId,
                recipientName: char?.name || 'Inconnu',
                recipientPortrait: char?.portraitUrl || '',
                timestamp: Date.now()
            };

            set((state) => ({ 
                lootHistory: [historyEntry, ...state.lootHistory] 
            }));

            gmToast(`"${item.name}" donné à ${char?.name || 'un joueur'}.`, 'success');
        } else {
            console.error("[LootSlice] addInventoryItem non trouvé dans le store.");
        }
    },
});
