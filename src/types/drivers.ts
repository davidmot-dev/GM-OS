// src/types/drivers.ts

export type DiceRollLogic = 'sum' | 'highest' | 'lowest' | 'count-success' | 'd100-low' | 'd100-high';
export type LootRollMode = 'weighted' | 'independent';

export interface LootEntry {
    name: string;
    weight: number; // Probabilité ou poids relatif
    type: 'item' | 'table' | 'currency' | 'other';
    minAmount?: number | string; // Supporte les formules comme "1d6"
    maxAmount?: number;
    metadata?: Record<string, any>; // Rareté, poids, description, etc.
}

export interface LootTable {
    id: string;
    name: string;
    description?: string;
    rollMode: LootRollMode;
    rolls?: number | string; // Nombre de tirages (ex: 3 ou "1d4")
    entries: LootEntry[];
}

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
    lootTables?: LootTable[]; // Optional tables for item/treasure generation
    encounterTemplates?: EncounterTemplate[]; // Optional templates for combat encounters
    defaultNotebookUrl?: string; // Default NotebookLM for this system
    
    // Metadata for AI
    aiInstructions: string; // Specialized instructions for the Oracle/Sage to understand rules
    aiPersonas?: Record<string, string>; // gemId -> instructions override
    ragPath?: string; // Hérité : visait le dossier des fiches. Préférer `corpusId`.
    /**
     * Dossier de corpus sous `docs/systems/` — `dune`, `blade-runner`.
     *
     * **Pourquoi ce champ existe.** L'identifiant d'un pilote est fabriqué par
     * la Forge avec `custom-${Date.now()}` : il ne dit rien du jeu. Or trois
     * artefacts doivent se ranger sous le même dossier — les fiches, les
     * personas et l'index du livre — et deux d'entre eux n'ont aucun moyen
     * d'être redirigés ailleurs. Sans ce champ, un pilote nommé « Dune » mais
     * identifié `custom-1754…` écrit son corpus à côté du sien.
     *
     * Absent, `resoudreCorpus` retombe sur le nom affiché puis l'identifiant.
     */
    corpusId?: string;
}

export interface EncounterEntity {
    templateId: string;
    count: string | number;
    role?: 'normal' | 'elite' | 'boss';
}

export interface EncounterTemplate {
    id: string;
    name: string;
    entities: EncounterEntity[];
}
