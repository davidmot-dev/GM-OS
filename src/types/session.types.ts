/**
 * GM-OS v6 — Session Domain Types
 *
 * Regroupe les interfaces liées au cycle de vie d'une session de jeu
 * (GameSession, Snapshots, Messages, Notifications).
 *
 * @module types/session
 */

import type { Playlist } from '../modules/music/useMusicStore';
import type { Atmosphere } from '../modules/sound/useSoundStore';
import type { AmbientTrackState } from '../modules/ambient/useAmbientStore';
import type { LightScene } from '../modules/light/useLightStore';
import type { ImageMedia, ImageFolder } from '../modules/image/types';
import type { WebLink } from '../modules/web/types';
import type { Combatant } from '../modules/combat/useCombatStore';

// ─────────────────────────────────────────────
// Checklist
// ─────────────────────────────────────────────

export interface SessionChecklistItem {
    id: string;
    text: string;
    isCompleted: boolean;
}

// ─────────────────────────────────────────────
// Module Snapshots
// ─────────────────────────────────────────────

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

export interface SessionFeedback {
    characterId: string;
    characterName: string;
    funRating: number;      // 1 to 5 stars
    storyRating: number;    // 1 to 5 stars
    combatRating: number;   // 1 to 5 stars
    notes: string;          // Comments/Notes written by the player
    timestamp: number;
}

// ─────────────────────────────────────────────
// Game Session
// ─────────────────────────────────────────────

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
    feedbacks?: SessionFeedback[];
}

// ─────────────────────────────────────────────
// Messaging & Notifications
// ─────────────────────────────────────────────

export interface RemoteNotification {
    id: string;
    type: 'vitals_update' | 'action' | 'alert';
    characterId: string;
    characterName: string;
    playerName: string;
    message: string;
    timestamp: number;
    isRead: boolean;
}

export interface HubNotification {
    id: string;
    type: 'message' | 'alert' | 'system';
    title: string;
    content: string;
    fromName: string;
    timestamp: number;
}

export interface SessionMessage {
    id: string;
    fromId: string;       // ID du perso ou 'GM'
    fromName: string;
    toId: string;         // ID du perso ou 'GM'
    toName: string;
    content: string;
    timestamp: number;
    isRead: boolean;
}
