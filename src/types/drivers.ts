// src/types/drivers.ts

export type LootEntryType = 'item' | 'currency' | 'table';

export interface LootEntry {
    id: string;
    type: LootEntryType;
    name: string;
    weight: number;
    minAmount?: number | string; // 1, "1d6", etc.
    maxAmount?: number | string;
    metadata?: Record<string, unknown>;
}

export interface LootTable {
    id: string;
    name: string;
    description?: string;
    entries: LootEntry[];
    rolls?: number | string; 
    rollMode?: 'weighted' | 'independent'; // Unique choice vs Every line independently
}

export interface EncounterEntity {
    templateId: string; // The ID of the Entity prototype
    count: number | string; // e.g., 1, "2d4"
    role?: 'mook' | 'elite' | 'boss';
}

export interface EncounterTemplate {
    id: string;
    name: string;
    description?: string;
    entities: EncounterEntity[];
}

export type DiceRollLogic = 'sum' | 'highest' | 'lowest' | 'count-success' | 'd100-low' | 'd100-high';

export interface DiceConfig {
    defaultDice: string; // e.g. "1d20", "3d6"
    logic: DiceRollLogic;
    engine?: 'standard' | 'formula' | 'pool' | 'pool_explode' | 'threshold' | 'advantage' | 'disadvantage' | 'exploding' | 'fate' | 'rolemaster' | 'yze' | '2d20'; // Specific specialized logic
    successThreshold?: number; // e.g. 8 for WoD, or dynamic
    critRange?: number; // e.g. 20 for 5e, 1 for d100
}

export interface TacticalRangeThreshold {
    label: string;
    maxUnits: number; // renamed from maxDistance for clarity (grid units)
    modifier: number;
}

export interface TacticalConfig {
    ranges: {
        contact: TacticalRangeThreshold;
        courte: TacticalRangeThreshold;
        moyenne: TacticalRangeThreshold;
        longue: TacticalRangeThreshold;
        extreme: TacticalRangeThreshold;
    };
    useTacticalAI: boolean;
}

export interface GaugeConfig {
    fieldId: string;
    label: string;
    color: string; // Tailwind color class or hex, e.g. "bg-emerald-500" or "#10b981"
    style: 'bar' | 'segmented' | 'neon';
}

export interface CombatStatMapping {
    fieldId: string; // ID from the sheet template
    label: string;
    isMainHP: boolean;
    isResource: boolean; // Magic points, Sanity, etc.
}

export interface UIConfig {
    gauges: GaugeConfig[];
    initiativeStyle?: 'list' | 'grid';
    themeColor?: string; // Global accent for this system
}

export interface GameDriver {
    id: string;
    name: string;
    author: string;
    version: string;
    description: string;
    emoji: string;
    
    // Mechanics
    dice: DiceConfig;
    
    // Tactical configuration
    tactical?: TacticalConfig;

    // Combat configuration
    combat: {
        statsToTrack: CombatStatMapping[];
        initiativeFormula: string; // e.g. "dex", "dex + int", "1d10"
        initiativeSort?: 'asc' | 'desc'; // Default: 'desc'
        initiativeCards?: number; // If set, use a unique card pool 1-N
        damageTypes?: string[]; // e.g. ["Feu", "Froid", "Physique", "Psychique"]
        defaultHealthType?: 'hp' | 'clocks' | 'anatomy';
    };

    // UI Customization
    ui_config?: UIConfig;

    // Linked assets
    templateId: string; // The ID of the primary SheetTemplate used by this system
    defaultNotebookUrl?: string; // Default NotebookLM for this system
    
    // Loot & Encounters
    lootTables?: LootTable[];
    encounterTemplates?: EncounterTemplate[];

    // Metadata for AI
    aiInstructions: string; // Specialized instructions for the Oracle/Sage to understand rules
    aiPersonas?: Record<string, string>; // gemId -> instructions override
}
