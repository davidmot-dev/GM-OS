/**
 * Types liés aux items et à l'inventaire.
 */

export interface InventoryItem {
    id: string;
    name: string;
    type: 'weapon' | 'armor' | 'consumable' | 'currency' | 'other' | string;
    rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | string;
    weight: number;
    quantity: number;
    description: string;
    value?: number;
    properties: Record<string, string | number | boolean | object | null>;
}

export interface LootHistoryEntry {
    id: string;
    itemId: string;
    itemName: string;
    itemType: string;
    rarity: string;
    quantity: number;
    value: number;
    recipientId: string;
    recipientName: string;
    recipientPortrait?: string;
    timestamp: number;
}
