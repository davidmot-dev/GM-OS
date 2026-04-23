/**
 * Nexus-OS — Types du Bundle `.gmos`
 *
 * Définit toutes les interfaces du système de packaging/portabilité.
 * Ce fichier est la "source de vérité" du format d'archive Nexus.
 *
 * @module system/archive/nexus.types
 */

import type {
    Campaign,
    Entity,
    Player,
    GameSession,
    AtlasMap,
    WikiEntry,
    TimelineEvent,
    Clue,
} from '../../session/store/types';
import type { Atmosphere } from '../../sound/useSoundStore';
import type { Playlist } from '../../music/useMusicStore';
import type { DeckManifest, DeckSessionState } from '../../session/store/types';

// ─────────────────────────────────────────────
// CONSTANTES
// ─────────────────────────────────────────────

/** Version du schéma du manifeste. Incrémenter lors de changements incompatibles. */
export const NEXUS_SCHEMA_VERSION = 1;

/** Extension officielle des archives Nexus-OS (Campagnes) */
export const NEXUS_EXTENSION = '.gmos';

/** Extension officielle des archives Nexus-OS (Game Drivers) */
export const NEXUS_DRIVER_EXTENSION = '.gmos-driver';

/** Type de bundle Nexus-OS */
export type NexusBundleType = 'campaign' | 'driver';

// ─────────────────────────────────────────────
// MANIFEST
// ─────────────────────────────────────────────

/**
 * Entrée dans la table de correspondance des assets.
 * Mappe un chemin/ID original vers le chemin relatif dans l'archive.
 */
export interface AssetEntry {
    /** Identifiant ou chemin d'origine (ex: "m-17389...", "C:/Users/Me/map.jpg") */
    originalRef: string;
    /** Chemin relatif dans l'archive (ex: "assets/profiles/avatar.png") */
    relativePath: string;
    /** Hash SHA-256 du fichier (pour vérification d'intégrité) */
    checksum: string;
    /** Taille en octets */
    sizeBytes: number;
    /** Type MIME du fichier */
    mimeType: string;
}

/**
 * Manifeste principal de l'archive `.gmos`.
 * Décrit le contenu et les métadonnées du bundle.
 */
export interface NexusManifest {
    /** Version du schéma (pour compatibilité ascendante) */
    schemaVersion: typeof NEXUS_SCHEMA_VERSION;
    /** Identifiant unique de l'archive */
    bundleId: string;
    /** Type du bundle (rétrocompatibilité: par défaut 'campaign' si absent) */
    bundleType?: NexusBundleType;
    /** ID de la campagne source (optionnel si bundleType === 'driver') */
    campaignId?: string;
    /** Nom de la campagne (optionnel si bundleType === 'driver') */
    campaignName?: string;
    /** ID du GameDriver source (si bundleType === 'driver') */
    driverId?: string;
    /** Nom du GameDriver (si bundleType === 'driver') */
    driverName?: string;
    /** Timestamp ISO 8601 de l'export */
    exportedAt: string;
    /** Version de GM-OS ayant généré l'archive */
    gmosVersion: string;

    /** Drivers requis (manifeste uniquement, non embarqués) */
    requiredDriverIds: string[];
    /** Templates requis (manifeste uniquement) */
    requiredTemplateIds: string[];

    /** Table de correspondance des assets récoltés */
    assetMap: AssetEntry[];

    /** Statistiques (pour le dashboard de portabilité) */
    stats: {
        entityCount: number;
        sessionCount: number;
        atlasMapCount: number;
        wikiEntryCount: number;
        clueCount: number;
        assetCount: number;
        totalSizeBytes: number;
    };
}

// ─────────────────────────────────────────────
// ÉTAT SÉRIALISÉ (state.json)
// ─────────────────────────────────────────────

/**
 * Représentation sérialisée des slices de store liés à la campagne.
 * Exclut les préférences locales et les données non-portables.
 */
export interface NexusCampaignState {
    /** La campagne elle-même */
    campaign: Campaign;
    /** Entités (PNJ, Monstres) appartenant à cette campagne + entités cross-campagne liées par relations */
    entities: Entity[];
    /** Joueurs et leurs personnages liés à cette campagne */
    players: Player[];
    /** Sessions de jeu de cette campagne */
    sessions: GameSession[];
    /** Cartes d'atlas de cette campagne */
    atlasMaps: AtlasMap[];
    /** Entrées Wiki de cette campagne */
    wikiEntries: WikiEntry[];
    /** Événements de timeline de cette campagne */
    timelineEvents: TimelineEvent[];
    /** Indices (clues) de cette campagne */
    clues: Clue[];
    /** Paquets de cartes (manifestes uniquement) */
    deckManifests: DeckManifest[];
    /** États de session des decks */
    deckSessionStates: DeckSessionState[];
    /**
     * Niveau 3 — Entités référencées par des relations sociales mais appartenant
     * à d'autres campagnes. Incluses pour préserver la cohérence du réseau social.
     */
    relatedEntities?: Entity[];
    /**
     * Niveau 4 — Snapshot des GameDrivers personnalisés requis par cette campagne.
     * Permet à l'importateur de vérifier leur disponibilité sur la machine cible.
     */
    requiredDriverData?: import('../../../types/drivers').GameDriver[];
    /**
     * Niveau 4 — Snapshot des SheetTemplates personnalisés requis.
     */
    requiredTemplateData?: import('../../../data/defaultSheetTemplates').SheetTemplate[];
    /**
     * Niveau 5 — Atmosphères SoundBoard (pads audio).
     * Chaque Atmosphere contient ses SoundPads avec leur filePath.
     */
    atmospheres?: Atmosphere[];
    /**
     * Niveau 5 — Playlists musicales (Music Decks).
     * Chaque Playlist contient ses MusicPads avec leur url.
    /**
     * Niveau 5 — Playlists musicales (Music Decks).
     * Chaque Playlist contient ses MusicPads avec leur url.
     */
    playlists?: Playlist[];
}

/**
 * Représentation sérialisée d'un GameDriver et de ses dépendances.
 */
export interface NexusDriverState {
    /** Le système de règles exporté */
    gameDriver: import('../../../types/drivers').GameDriver;
    /** Le template de fiche personnalisé exporté avec ce driver, le cas échéant */
    sheetTemplate?: import('../../../data/defaultSheetTemplates').SheetTemplate;
}

// ─────────────────────────────────────────────
// OPTIONS & RÉSULTATS
// ─────────────────────────────────────────────

/**
 * Options passées à la fonction d'export.
 */
export interface NexusExportOptions {
    /** Inclure les fichiers médias dans le bundle (défaut: true) */
    includeAssets: boolean;
    /**
     * Inclure les fichiers audio (Sound Pads, Music Playlists).
     * Activé par défaut — peut être désactivé pour réduire la taille du bundle.
     */
    includeSounds: boolean;
}

export const DEFAULT_NEXUS_EXPORT_OPTIONS: NexusExportOptions = {
    includeAssets: true,
    includeSounds: true,
};

/**
 * Résultat retourné par le service d'export.
 */
export interface NexusExportResult {
    success: boolean;
    outputPath?: string;
    manifest?: NexusManifest;
    /** Assets qui n'ont pas pu être moissonnés (fichiers introuvables) */
    missingAssets: string[];
    error?: string;
}

/**
 * Données brutes retournées par le bridge IPC lors de l'import.
 * Le renderer reçoit le contenu JSON, pas l'objet JS directement.
 */
export interface NexusImportRaw {
    success: boolean;
    manifestJson?: string;
    stateJson?: string;
    /** Map: relativePath -> base64 data URL du fichier extrait */
    assetData?: Record<string, string>;
    /** Atmosphères SoundBoard sérialisées (pour restauration directe dans useSoundStore) */
    atmospheresJson?: string;
    /** Playlists musicales sérialisées (pour restauration directe dans useMusicStore) */
    playlistsJson?: string;
    error?: string;
}

/**
 * Résultat final de l'import, après parsing et validation.
 */
export interface NexusImportResult {
    success: boolean;
    campaignName?: string;
    /** Assets qui n'ont pas pu être réimportés */
    failedAssets: string[];
    /** Avertissements non-bloquants */
    warnings: string[];
    error?: string;
}

// ─────────────────────────────────────────────
// ÉTAT DE PROGRESSION (pour le HUD v2)
// ─────────────────────────────────────────────

export type NexusOperationPhase =
    | 'idle'
    | 'scraping'
    | 'remote_check'   // NOUVEAU : Vérification des URLs distantes
    | 'harvesting'
    | 'packaging'
    | 'importing'
    | 'remapping'
    | 'injecting'
    | 'done'
    | 'error';

export interface NexusProgress {
    phase: NexusOperationPhase;
    /** Progression de 0 à 100 */
    progress: number;
    message: string;
    /** Indique si le HUD doit s'arrêter pour attendre une décision du MJ */
    interactionRequired?: boolean;
    /** Type d'interaction demandée (ex: résolution d'URLs distantes) */
    interactionType?: 'remote_assets_found';
    /** Nombre d'URLs distantes détectées */
    remoteUrlCount?: number;
    error?: string;
}

// ─────────────────────────────────────────────
// CONFLICT RESOLVER
// ─────────────────────────────────────────────

/**
 * Stratégie de résolution choisie par l'utilisateur.
 * - `replace` : Écrase la campagne existante avec le contenu du bundle
 * - `clone`   : Importe la campagne avec de nouveaux UUIDs (coexistence)
 * - `cancel`  : Abandonne l'import sans modification
 */
export type NexusConflictStrategy = 'replace' | 'clone' | 'cancel';

/**
 * Description d'un conflit détecté lors de l'import.
 */
export interface NexusConflict {
    /** Type d'entité en conflit */
    type: 'campaign' | 'driver';
    /** ID en conflit dans le store actuel */
    existingId: string;
    /** Nom de l'entité existante */
    existingName: string;
    /** Nom de l'entité dans le bundle importé */
    incomingName: string;
    /** Date d'export du bundle */
    exportedAt: string;
    /** Nombre d'entités dans le bundle (spécifique aux campagnes) */
    entityCount?: number;
    /** Nombre de sessions dans le bundle (spécifique aux campagnes) */
    sessionCount?: number;
}

/**
 * Résolution choisie par l'utilisateur pour un ensemble de conflits.
 * Passée en retour du callback `onConflict`.
 */
export interface NexusConflictResolution {
    strategy: NexusConflictStrategy;
}

/**
 * Callback que le composant UI doit implémenter pour permettre
 * à l'utilisateur de résoudre les conflits avant l'injection.
 *
 * @param conflicts - Liste des conflits détectés
 * @returns Une Promise résolue quand l'utilisateur a choisi sa stratégie
 */
export type OnConflictCallback = (
    conflicts: NexusConflict[]
) => Promise<NexusConflictResolution>;
