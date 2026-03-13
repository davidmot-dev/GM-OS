// src/types/drivers.ts
import { SheetTemplate } from '../data/defaultSheetTemplates';

export type DiceRollLogic = 'sum' | 'highest' | 'lowest' | 'count-success' | 'd100-low' | 'd100-high';

export interface DiceConfig {
    defaultDice: string; // e.g. "1d20", "3d6"
    logic: DiceRollLogic;
    successThreshold?: number; // e.g. 8 for WoD, or dynamic
    critRange?: number; // e.g. 20 for 5e, 1 for d100
}

export interface CombatStatMapping {
    fieldId: string; // ID from the sheet template
    label: string;
    isMainHP: boolean;
    isResource: boolean; // Magic points, Sanity, etc.
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
    
    // Combat configuration
    combat: {
        statsToTrack: CombatStatMapping[];
        initiativeFormula: string; // e.g. "dex", "dex + int", "1d10"
    };

    // Linked assets
    templateId: string; // The ID of the primary SheetTemplate used by this system
    defaultNotebookUrl?: string; // Default NotebookLM for this system
    
    // Metadata for AI
    aiInstructions: string; // Specialized instructions for the Oracle/Sage to understand rules
    aiPersonas?: Record<string, string>; // gemId -> instructions override
}
