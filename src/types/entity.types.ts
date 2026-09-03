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
    /**
     * **La nature du lien, sous son nom canonique.** Elle décide de la couleur
     * et de la physique du graphe, et ne change jamais d'une campagne à
     * l'autre — voir `session/logic/relationsSociales.ts`.
     */
    type: 'ally' | 'neutral' | 'hostile' | 'family' | 'romantic' | 'mentor' | 'rival' | 'other';
    /**
     * **Le nom que le meneur donne à CETTE relation** — « Serment de sang »,
     * « Dette de jeu ». Facultatif : sans lui, on affiche le nom de la nature.
     *
     * *C'est le patron de `RangeInfo` du Cortex* : un canonique qui sert à
     * comparer, un libellé qui sert à lire. Un type entièrement libre aurait
     * rendu la palette et la physique indécidables ; ici « Serment de sang »
     * fondé sur `ally` s'attire et se colore comme une alliance, et porte son
     * nom. Aucune donnée existante n'est invalidée.
     */
    libelle?: string;
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
}
