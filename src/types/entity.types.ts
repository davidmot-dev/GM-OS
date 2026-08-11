/**
 * GM-OS v6 — Entity Domain Types
 *
 * Regroupe toutes les interfaces liées aux entités de combat et de jeu
 * (PNJ, monstres, blessures, états...).
 * 
 * @module types/entity
 */

// ─────────────────────────────────────────────
// Health & Damage
// ─────────────────────────────────────────────

export interface DamageImpact {
    value: number;
    type?: string;
    location?: string;
    isRecovery?: boolean;
}

export interface PersistenceBadge {
    id: string;
    label: string;
    description: string;
    severity: 'minor' | 'major' | 'critical';
    location?: string;
}

/**
 * Les cinq façons dont un jeu compte les dégâts.
 *
 * **Pourquoi une union et non `string`.** `HealthInterpreter` en connaît cinq et
 * `HealthManager` les propose toutes, mais `defaultHealthType` n'en déclarait que
 * trois : un pilote ne pouvait pas dire « blessures » ni « cases », et rien ne
 * le signalait. Un type ouvert laisse aussi passer les noms voisins — c'est
 * `'clock'` au singulier, écrit côté tablette, qui n'a jamais rien affiché.
 */
export type HealthSystemType = 'hp' | 'clocks' | 'anatomy' | 'wounds' | 'boxes';

export interface HealthSystem {
    type: HealthSystemType;
    data: Record<string, unknown>;
    state: 'healthy' | 'scratched' | 'wounded' | 'critical' | 'dead';
    badges: PersistenceBadge[];
}

// ─────────────────────────────────────────────
// Relations
// ─────────────────────────────────────────────

export interface EntityRelation {
    targetId: string;
    targetType: 'pc' | 'npc';
    type: 'ally' | 'neutral' | 'hostile' | 'family' | 'romantic' | 'mentor' | 'rival' | 'other';
    description: string;
}

// ─────────────────────────────────────────────
// Entity (NPC / Monster)
// ─────────────────────────────────────────────

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
    isEncounterInstance?: boolean;
}
