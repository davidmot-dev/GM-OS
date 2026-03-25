// src/types/drivers.ts

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
    
    // Metadata for AI
    aiInstructions: string; // Specialized instructions for the Oracle/Sage to understand rules
    aiPersonas?: Record<string, string>; // gemId -> instructions override
}
 
export interface LootEntry {
    name: string;
    weight: number;
    type: 'item' | 'currency' | 'table';
    minAmount?: string | number;
    maxAmount?: string | number;
    metadata?: Record<string, unknown>;
}

export interface LootTable {
    id?: string;
    name: string;
    rolls?: number | string; // Numeric or dice formula
    rollMode?: 'weighted' | 'independent'; // 'weighted' (pick one) vs 'independent' (each line has its % chance)
    entries: LootEntry[];
}
