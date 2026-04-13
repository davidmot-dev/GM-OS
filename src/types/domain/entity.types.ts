import type { HealthSystem } from './health.types';
import type { InventoryItem } from './item.types';

/**
 * Types liés aux entités de jeu (PC, NPC, Monstres).
 */

export interface EntityRelation {
    targetId: string;
    targetType: 'pc' | 'npc';
    type: 'ally' | 'neutral' | 'hostile' | 'family' | 'romantic' | 'mentor' | 'rival' | 'other';
    description: string;
}

export interface Entity {
    id: string;
    name: string;
    type: 'pc' | 'npc' | 'monster';
    role: 'ally' | 'neutral' | 'hostile' | 'boss';
    status: 'alive' | 'injured' | 'dead' | 'unknown';
    avatar: string;
    hp: number;
    maxHp: number;
    ac: number;
    speed: number;
    initiative: number;
    description: string;
    roleplayingNotes: string;
    gmSecretInfo: string;
    linkedMapIds: string[];
    campaignId: string;
    sourceRef?: string;
    templateId?: string;
    sheetData?: Record<string, unknown>;
    healthSystem?: HealthSystem;
    relations?: EntityRelation[];
    faction?: string;
    isVisibleByPlayers?: boolean;
}

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
