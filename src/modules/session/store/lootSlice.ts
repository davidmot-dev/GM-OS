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

/**
 * Un objet **dans le pool**, donc rattaché à la campagne où il a été trouvé.
 *
 * Le pool était unique pour toutes les campagnes : le trésor du donjon de l'une
 * attendait dans l'écran de l'autre. La marque disparaît quand l'objet passe
 * dans l'inventaire d'un personnage — là, c'est le personnage qui dit à quelle
 * campagne il appartient.
 */
export type ObjetDuButin = InventoryItem & { campaignId?: string };

/**
 * Cet objet appartient-il à la campagne ouverte ?
 *
 * **Une seule écriture de la règle**, lue par les deux écrans et par les deux
 * boutons « Tout vider ». Sans quoi un objet pouvait s'afficher sans que le
 * bouton l'emporte — ou l'inverse, ce qui est pire.
 *
 * **Sans marque, il appartient à celle qu'on regarde** : le butin d'avant le
 * 2026-09-04 n'en porte aucune, et le faire disparaître aurait été une perte
 * silencieuse de plus.
 */
export const estDeLaCampagne = (
    marque: string | undefined,
    campagne: string | null | undefined,
): boolean => marque === undefined || marque === (campagne ?? undefined);

export interface LootSliceState {
    lootPool: ObjetDuButin[];
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
        // Casté pour lire la campagne ouverte via le store racine, comme
        // `assignLootToCharacter` lit `players` et `addInventoryItem`.
        const campaignId = (get() as unknown as { activeCampaignId?: string | null }).activeCampaignId ?? undefined;
        const marques: ObjetDuButin[] = items.map(item => ({ ...item, campaignId }));
        set((state) => ({ lootPool: [...state.lootPool, ...marques] }));
        gmToast(`${items.length} objet(s) ajouté(s) au butin de séance.`, 'info');
    },

    removeFromPool: (itemId) =>
        set((state) => ({
            lootPool: state.lootPool.filter((it) => it.id !== itemId),
        })),

    /**
     * Vide le butin **de la campagne ouverte**, et d'elle seule.
     *
     * « Tout vider » ne peut pas emporter ce que l'écran ne montrait pas : le
     * bouton porte sur ce que le meneur a sous les yeux.
     */
    clearLootPool: () => {
        const campaignId = (get() as unknown as { activeCampaignId?: string | null }).activeCampaignId ?? undefined;
        set((state) => ({
            lootPool: state.lootPool.filter((it) => !estDeLaCampagne(it.campaignId, campaignId)),
        }));
        gmToast("Butin de séance vidé.", "info");
    },

    clearLootHistory: () => {
        const campaignId = (get() as unknown as { activeCampaignId?: string | null }).activeCampaignId ?? undefined;
        set((state) => ({
            lootHistory: state.lootHistory.filter((e) => !estDeLaCampagne(e.campaignId, campaignId)),
        }));
        gmToast("Historique du butin vidé.", "info");
    },

    assignLootToCharacter: (itemId, playerId, characterId) => {
        const state = get() as any; // Casté pour accéder aux autres slices via le root store
        const item = state.lootPool.find((it: ObjetDuButin) => it.id === itemId);

        if (!item) {
            gmToast("Erreur : Objet introuvable dans le pool.", "error");
            return;
        }

        // 1. Ajouter à l'inventaire du personnage (via entitySlice)
        if (typeof state.addInventoryItem === 'function') {
            // La marque de campagne appartient au pool : dans un inventaire, c'est
            // le personnage qui dit de quelle campagne il est.
            const { campaignId, ...objet } = item;
            state.addInventoryItem(playerId, characterId, objet);

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
                campaignId: campaignId ?? state.activeCampaignId ?? undefined,
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

            /*
              **L'objet s'annonce sur les tablettes.**

              `addHubNotification` existait, `HubNotificationCenter` l'affichait
              avec un retour haptique — et **personne ne l'appelait**. Un écran
              sans écrivain, exactement comme les trois `LootNotification` morts
              qui accompagnaient ce module. Un objet qui change de mains est le
              premier candidat : le joueur n'avait aucun signal, il fallait qu'il
              pense à rouvrir son inventaire.
            */
            if (typeof state.addHubNotification === 'function') {
                state.addHubNotification({
                    type: 'system',
                    title: i18next.t('modules:session.events.loot_grant_title', { item: item.name }),
                    content: i18next.t('modules:loot.notifications.hub_content', {
                        item: item.name,
                        quantite: item.quantity > 1 ? ` ×${item.quantity}` : '',
                        recipient: char?.name || 'un joueur',
                    }),
                    fromName: i18next.t('modules:loot.title'),
                });
            }

            gmToast(`"${item.name}" donné à ${char?.name || 'un joueur'}.`, 'success');
        } else {
            console.error("[LootSlice] addInventoryItem non trouvé dans le store.");
        }
    },
});
