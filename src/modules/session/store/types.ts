/**
 * Session-OS Store — Shared Types
 *
 * Ce fichier centralise toutes les interfaces de domaine utilisées
 * par les slices et les composants. Il évite les dépendances circulaires.
 *
 * @module session/store/types
 */

import type { Playlist } from '../../music/useMusicStore';
import type { Atmosphere } from '../../sound/useSoundStore';
import type { AmbientTrackState } from '../../ambient/useAmbientStore';
import type { LightScene } from '../../light/useLightStore';
import type { ImageMedia, ImageFolder } from '../../image/types';
import type { WebLink } from '../../web/types';
import type { Combatant } from '../../combat/useCombatStore';
import type { SheetTemplate } from '../../../data/defaultSheetTemplates';
import type { GameDriver } from '../../../types/drivers';
import type { ModuleID, ThemeID } from '../../../store/useSessionStore';

// ─────────────────────────────────────────────
// UI / Layout
// ─────────────────────────────────────────────

export interface LayoutConfig {
    activeModule: ModuleID;
    isAIPanelOpen: boolean;
    isTacticalPanelOpen: boolean;
    theme: ThemeID;
    themeColor: string;
}

export type CurrentView =
    | 'cockpit'
    | 'campaign-details'
    | 'campaign-editor'
    | 'npc-gallery'
    | 'social-graph'
    | 'world-atlas'
    | 'library'
    | 'players'
    | 'templates'
    | 'session-prep'
    | 'session-focus'
    | 'timeline-wiki'
    | 'forge'
    | 'template-editor'
    | 'driver-editor'
    | 'storyboard'
    | 'deck-library'
    | 'deck-player'
    | 'campaign-details'
    | 'campaign-form';

// ─────────────────────────────────────────────
// Entity / Health
// ─────────────────────────────────────────────

export interface DamageImpact {
    value: number;
    type?: string;
    location?: string;
    isRecovery?: boolean;
}

export interface EntityRelation {
    targetId: string;
    targetType: 'pc' | 'npc';
    type: 'ally' | 'neutral' | 'hostile' | 'family' | 'romantic' | 'mentor' | 'rival' | 'other';
    description: string;
}

export interface PersistenceBadge {
    id: string;
    label: string;
    description: string;
    severity: 'minor' | 'major' | 'critical';
    location?: string;
}

export interface HealthSystem {
    type: string;
    data: Record<string, string | number | boolean | object | null>;
    state: 'healthy' | 'scratched' | 'wounded' | 'critical' | 'dead';
    badges: PersistenceBadge[];
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
    sheetData?: Record<string, string | number | boolean>;
    healthSystem?: HealthSystem;
    relations?: EntityRelation[];
    faction?: string;
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
    sheetData: Record<string, string | number | boolean>;
    description?: string;
    gmNotes?: string;
    linkedDocumentIds?: string[];
    inventory?: string;
    healthSystem?: HealthSystem;
    relations?: EntityRelation[];
    faction?: string;
}

export interface Player {
    id: string;
    realName: string;
    email?: string;
    avatarUrl: string;
    isOnline: boolean;
    characters: PlayerCharacter[];
}

// ─────────────────────────────────────────────
// Campaign
// ─────────────────────────────────────────────

export interface Campaign {
    id: string;
    name: string;
    system: string;
    description?: string;
    synopsis?: string;
    notes?: string;
    gmNotes?: string;
    activeSessionId?: string;
    wallpaperUrl?: string;
    activeLocationIds: string[];
    ragPath?: string;
    aiPersonas?: Record<string, string>;
    layoutConfig?: LayoutConfig;
    notebookUrl?: string;
    systemPath?: string;
    campaignPath?: string;

    // Social Graph Optimization
    nodePositions?: Record<string, { x: number; y: number }>;
    isGraphLocked?: boolean;
}

// ─────────────────────────────────────────────
// Session
// ─────────────────────────────────────────────

export interface SessionChecklistItem {
    id: string;
    text: string;
    isCompleted: boolean;
}

export interface SessionModuleSnapshot {
    timestamp: number;
    music?: {
        activePlaylistId: string | null;
        playlists?: Playlist[];
        deckA: { activePadId: string | null; volume: number; isLooping: boolean; isPlaying: boolean };
        deckB: { activePadId: string | null; volume: number; isLooping: boolean; isPlaying: boolean };
        crossfader: number;
        masterVolume: number;
    };
    sound?: {
        activeAtmosphereId: string | null;
        masterVolume: number;
        activePadIds: string[];
        atmospheres?: Atmosphere[];
    };
    ambient?: {
        activeTracks: { id: string; url: string; volume: number; isPlaying: boolean }[];
        masterVolume: number;
        tracks?: AmbientTrackState[];
    };
    light?: {
        activeSceneId: string | null;
        globalBrightness: number;
        scenes?: Record<string, LightScene>;
    };
    image?: {
        projections: Record<string, string | null>;
        mediaList?: ImageMedia[];
        folders?: ImageFolder[];
    };
    web?: {
        links: string[];
        fullLinks?: WebLink[];
    };
    combat?: {
        combatants: Combatant[];
        currentTurnIdx: number;
        round: number;
    };
}

export interface GameSession {
    id: string;
    campaignId: string;
    number: number;
    date: string;
    status: 'planned' | 'active' | 'done';
    publicSummary: string;
    gmSecrets: string;
    checklist: SessionChecklistItem[];
    activeTrackId?: string;
    sessionEntityIds: string[];
    externalLink?: string;
    filePath?: string;
    sessionNotes?: string;
    moduleSnapshot?: SessionModuleSnapshot;
}

// ─────────────────────────────────────────────
// Atlas
// ─────────────────────────────────────────────

export type AtlasEntityCategory = 'npc' | 'lieu' | 'objet' | 'evenement';

export interface AtlasLinkedEntity {
    id: string;
    name: string;
    category: AtlasEntityCategory;
    favoriteId?: string;
    entityId?: string;
    mapId?: string;
    wikiEntryId?: string;
}

export interface AtlasMap {
    id: string;
    name: string;
    fileUrl: string;
    isVideo: boolean;
    type: 'battlemap' | 'world-map' | 'region' | 'city' | 'dungeon';
    narrativeDescription: string;
    gmNotes: string;
    linkedEntities: AtlasLinkedEntity[];
    campaignId: string;
}

// ─────────────────────────────────────────────
// Chronicle (Wiki + Timeline)
// ─────────────────────────────────────────────

export interface TimelineEvent {
    id: string;
    campaignId: string;
    date: string;
    title: string;
    description: string;
    type: 'quest' | 'combat' | 'lore' | 'major-event' | 'session';
    involvedEntityIds: string[];
    locationId?: string;
    sessionId?: string;
}

export interface WikiEntry {
    id: string;
    campaignId: string;
    title: string;
    content: string;
    category: 'npc' | 'location' | 'organization' | 'lore' | 'item' | 'clue' | 'rumor' | 'other';
    tags: string[];
    imageUrls: string[];
    linkedEntityIds: string[];
}

export interface InventoryItem {
    id: string;
    name: string;
    type: 'weapon' | 'armor' | 'consumable' | 'currency' | 'other' | string;
    rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | string;
    weight: number;
    quantity: number;
    description: string;
    properties: Record<string, string | number | boolean | object | null>;
}

// ─────────────────────────────────────────────
// Clues (Indices)
// ─────────────────────────────────────────────

export interface Clue {
    id: string;
    campaignId: string;
    title: string;
    content: string;
    mediaUrl?: string;
    
    // Triple-Liaison (FK)
    locationId?: string;     // Lien vers AtlasMap
    ownerId?: string;        // Lien vers Entity (PNJ)
    eventId?: string;        // Lien vers TimelineEvent
    
    // Traçabilité
    isRevealed: boolean;
    revealedAt?: number;
    campaignMoment?: string; // Acte, Chapitre, etc.
}

// ─────────────────────────────────────────────
// Deck-OS (Cartes & Paquets)
// ─────────────────────────────────────────────

export type CardFormat = 'poker' | 'tarot';
export type CardOrientation = 'portrait' | 'landscape';

export interface DeckManifest {
    id: string;
    name: string;
    systemId: string;       // Liaison au GameDriver (ex: "torg")
    folderPath: string;     // Chemin : "assets/decks/[system_id]/[deck_id]"
    cardCount: number;      // Nombre total de cartes (N)
    format: CardFormat;
    orientation: CardOrientation;
    useDiscard: boolean;    // Si vrai, les cartes tirées vont en défausse
    extension?: string;     // Optionnel : extension de fichier (ex: ".jpg", default: ".png")
    filenamePattern?: string; // Optionnel : pattern (ex: "card_{n}" ou "{n}")
    startAtZero?: boolean;  // Si vrai, l'index commence à 0 (default: false = 1)
    padding?: number;       // Optionnel : nombre de chiffres (ex: 2 pour "01")
    cardMetadata?: Record<number, { name?: string; description?: string }>; // Optionnel : métadonnées par index
}

export interface DeckSessionState {
    deckId: string;
    remainingIndices: number[];     // Indices [1..N] des cartes dans la pioche
    discardedIndices: number[];     // Indices des cartes en défausse
    currentCardIndex: number | null; // Carte actuellement face visible
}

// ─────────────────────────────────────────────
// Re-exports (pour compatibilité descendante)
// ─────────────────────────────────────────────
export type { SheetTemplate, GameDriver };
