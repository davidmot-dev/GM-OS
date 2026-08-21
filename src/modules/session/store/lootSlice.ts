/**
 * Session-OS Store — Loot Slice
 *
 * Gère le pool de butin de la session (objets trouvés mais non encore distribués).
 *
 * @module session/store/lootSlice
 */

import type { StateCreator } from 'zustand';
import i18next from 'i18next';
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

            /*
              **Le troisième chemin d'un objet qui change de mains, et le seul
              qui ne disait rien.**

              Un objet arrive dans l'inventaire d'un PJ par trois portes :
              `NPCCard.handleGive` depuis une entité NPC-OS, `approveItemTransfer`
              d'un PJ à l'autre, et celle-ci depuis le butin de séance. Les deux
              premières consignent ; celle-ci n'écrivait que dans `lootHistory`,
              qui n'est lu que par son propre écran. Le même geste était donc
              consigné deux fois sur trois — et le meneur qui relit son fil pour
              savoir quand Brucelin a reçu l'Épée n'y trouvait rien.

              *Plusieurs écrivains pour une même donnée* : le motif de la semaine,
              et ici c'est un écrivain de moins qu'il n'en fallait.

              **`SYSTEM`, donc `trace`, et c'est une décision de David du
              2026-08-21** : un don d'objet s'écrit au journal — le fil doit
              pouvoir le rendre — mais **n'entre pas dans le résumé**. Les trois
              portes sont ainsi d'accord, ce qui était la question posée.
            */
            const journal = (window as unknown as {
                useJournalStore?: { getState: () => { addEvent: (e: unknown) => void } };
            }).useJournalStore?.getState();
            journal?.addEvent({
                type: 'SYSTEM',
                title: i18next.t('modules:session.events.loot_grant_title', { item: item.name }),
                content: i18next.t('modules:session.events.loot_grant_content', {
                    item: item.name,
                    // La quantité ne se dit que si elle apprend quelque chose :
                    // « ×1 » sur chaque ligne est du bruit qui se lit à chaque fois.
                    quantite: item.quantity > 1 ? ` ×${item.quantity}` : '',
                    recipient: char?.name || 'un joueur',
                }),
                metadata: { itemId: item.id, characterId, playerId },
            });

            gmToast(`"${item.name}" donné à ${char?.name || 'un joueur'}.`, 'success');
        } else {
            console.error("[LootSlice] addInventoryItem non trouvé dans le store.");
        }
    },
});
