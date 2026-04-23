/**
 * GM-OS v6 — Player Domain Types
 *
 * Regroupe les interfaces liées aux joueurs et à leurs personnages,
 * y compris l'inventaire et les transferts d'objets.
 *
 * @module types/player
 */

import type { HealthSystem, EntityRelation } from './entity.types';

// ─────────────────────────────────────────────
// Inventory
// ─────────────────────────────────────────────

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

export interface TransferRequest {
    id: string;
    fromCharacterId: string;
    fromCharacterName: string;
    toCharacterId: string;
    toCharacterName: string;
    item: InventoryItem;
    timestamp: number;
    status: 'pending' | 'approved' | 'rejected';
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

// ─────────────────────────────────────────────
// Player Character (PJ)
// ─────────────────────────────────────────────

export interface PlayerCharacter {
    id: string;
    name: string;
    classRace: string;
    portraitUrl: string;
    tokenUrl?: string;
    hp: number;
    maxHp: number;
    campaignId: string | null;
    templateId: string;
    sheetData: Record<string, unknown>;
    description?: string;
    gmNotes?: string;
    playerNotes?: string;
    linkedDocumentIds?: string[];
    inventory?: string;
    inventoryItems?: InventoryItem[];
    healthSystem?: HealthSystem;
    relations?: EntityRelation[];
    faction?: string;
    hubOptions?: {
        showHP: boolean;
        showMP: boolean;
        showAP: boolean;
        showInventory: boolean;
        showRelations: boolean;
    };
}

// ─────────────────────────────────────────────
// Player (Joueur physique)
// ─────────────────────────────────────────────

export interface Player {
    id: string;
    realName: string;
    email?: string;
    avatarUrl: string;
    isOnline: boolean;
    characters: PlayerCharacter[];
}
