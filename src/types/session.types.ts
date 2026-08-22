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

    /**
     * L'acte dans lequel cette séance est censée se dérouler.
     *
     * **La face PRÉVUE de la trame**, et elle seule. Le document du 2026-08-08
     * distingue deux relations entre une séance et des scènes : ce qui a été
     * *anticipé* — de la préparation, donc ici — et ce qui a été *traversé*, qui
     * relève de la capture en partie et n'existe pas encore. *« La divergence
     * entre les deux est elle-même intéressante : c'est là que la partie s'est
     * écartée du plan, donc là où il s'est passé quelque chose. »*
     *
     * **La séance n'est pas rangée sous l'acte pour autant.** Une séance coupe
     * la trame arbitrairement : ce sont deux axes qui se croisent, et ce champ
     * est une prévision, pas une hiérarchie.
     */
    acteId?: string;
    /**
     * Les scènes qu'on pense jouer.
     *
     * Facultatif, et lu avec un repli partout : les séances écrites avant le
     * 2026-08-15 n'en portent pas. Le déclarer obligatoire l'aurait rendu
     * `undefined` à l'exécution en prétendant le contraire — c'est déjà le cas
     * de `sessionEntityIds`, que tous ses lecteurs protègent par un `|| []`.
     */
    scenesPrevuesIds?: string[];

    /**
     * Instant du clic sur « pause » — **axe G.**
     *
     * **Un champ, et surtout pas un quatrième statut.** Les statuts sont
     * `planned | active | done` et **cinq composants testent
     * `status === 'active'`** : un statut `paused` les ferait tous considérer la
     * séance comme absente, alors que le Hub reste affiché, la projection en
     * cours et les scènes ouvertes. *Un champ séparé laisse les cinq lecteurs
     * intacts.*
     *
     * Absent quand la séance tourne. Nettoyé à la reprise **et à la clôture** :
     * un champ qu'on oublie de nettoyer devient un état permanent.
     */
    pausedAt?: number;
    /**
     * Durée annoncée de la pause, en millisecondes.
     *
     * Elle sert au plafond — *« pause de 15 min : cette Forge en demande 4, on y
     * va »* — et **jamais à interrompre** : le chronomètre compte au-delà sans
     * rien couper. Absente, on suppose un quart d'heure.
     */
    pauseDureePrevueMs?: number;
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
