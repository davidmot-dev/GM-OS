/**
 * Session-OS Store — Shared Types
 *
 * Ce fichier centralise les interfaces spécifiques au cycle de vie d'une session.
 * Les types domaine (Entity, Player, Campaign, etc.) ont été migrés vers src/types/domain/
 * pour plus de granularité et de découplage, mais sont ré-exportés ici pour compatibilité.
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

// Re-exports Domain (Backward Compatibility)
export type { LayoutConfig, CurrentView, Campaign } from '../../../types/domain/campaign.types';
export type { HealthSystem, DamageImpact, PersistenceBadge } from '../../../types/domain/health.types';
export type { Entity, PlayerCharacter, EntityRelation } from '../../../types/domain/entity.types';
export type { Player } from '../../../types/domain/player.types';
export type { InventoryItem, LootHistoryEntry } from '../../../types/domain/item.types';
export type { AtlasMap, AtlasLinkedEntity, AtlasEntityCategory } from '../../../types/domain/atlas.types';
export type { TimelineEvent, WikiEntry, Clue } from '../../../types/domain/journal.types';
export type { DeckManifest, DeckSessionState, CardFormat, CardOrientation } from '../../../types/domain/deck.types';
export type { 
    ClientContext, 
    RemoteNotification, 
    HubNotification, 
    SessionMessage, 
    TransferRequest 
} from '../../../types/shared';

// ─────────────────────────────────────────────
// Session-Specific Types
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
// Re-exports (pour compatibilité descendante)
// ─────────────────────────────────────────────
export type { SheetTemplate, GameDriver };
