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
import type { Acte, Scene } from '../../../types/trame.types';
import type { RencontrePreparee } from '../../../types/rencontres.types';
import type { Atmosphere } from '../../sound/useSoundStore';
import type { Playlist } from '../../music/useMusicStore';
import type { DeckManifest, DeckSessionState } from '../../session/store/types';
import type { SatellitesDeLaCampagne } from './satellitesDeLaCampagne';
import type { ObjetDuButin } from '../../session/store/lootSlice';
import type { LootHistoryEntry } from '../../../types/player.types';
import type { SessionMessage } from '../../../types/session.types';

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
/** `medias` : l'archive des médias d'une campagne (`.gmos-medias`), lot E5 du 2026-10-19. */
export type NexusBundleType = 'campaign' | 'driver' | 'medias';

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
/**
 * **L'archive d'une campagne.** Depuis le lot E2 (2026-10-19), elle emporte aussi
 * ce qui vit hors du magasin de session (`SatellitesDeLaCampagne` : storyboard,
 * réserves de table, combats préparés, favoris, tuiles de Light-OS), le butin et
 * les messages. Tous facultatifs : une archive d'avant s'importe sans rien perdre.
 */
export interface NexusCampaignState extends SatellitesDeLaCampagne {
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
    /**
     * **La trame — actes et scènes.**
     *
     * Absente de l'archive jusqu'au 2026-09-04 : une campagne emportée sur une
     * autre machine y arrivait **sans son plan narratif**. Tout ce que la Forge
     * de campagne avait écrit — les actes, les scènes, leur ordre — restait sur
     * la machine d'origine, et rien ne le signalait.
     *
     * *Même famille que Music-OS et le bestiaire, oubliés des sauvegardes le
     * 2026-08-30 : la trame a été ajoutée à `donneesDeLaSession` et jamais ici.*
     *
     * **Facultatives**, pour qu'un `.gmos` d'avant cette date s'importe sans
     * rien perdre ni rien inventer.
     */
    actes?: Acte[];
    scenes?: Scene[];
    /** Les rencontres préparées (2026-10-12). Facultatives, comme la trame. */
    rencontres?: RencontrePreparee[];
    /**
     * **Les journaux de seance de la campagne — ajoutes le 2026-09-12.**
     *
     * Une campagne emportee arrivait sans son vecu : le fil des seances, les
     * scenes traversees, les comptes rendus. *Tout le travail d'apres-partie
     * restait sur la machine d'origine*, comme la trame avant le 04/09.
     *
     * ⚠️ **Seuls les journaux qui connaissent leur campagne voyagent.**
     * `campaignId` est facultatif sur un journal : ceux d'avant le rattachement
     * n'en portent pas, et les emporter au hasard les collerait a une campagne
     * qui n'est pas la leur. *Mieux vaut laisser un journal chez lui que le
     * rattacher a tort.*
     *
     * **Facultatifs**, pour qu'un `.gmos` d'avant cette date s'importe sans
     * rien perdre ni rien inventer.
     */
    journaux?: unknown[];
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
    /** Instances privées du MJ ; jamais placées dans Campaign ni dans la synchronisation commune. */
    modulesDuJeu?: Record<string, import('../../modulesDuJeu/protocole').InstanceSauvegardee>;
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
    /** Lot E2 : le butin de la campagne — disponible, distribué, mis de côté. */
    lootPool?: ObjetDuButin[];
    lootHistory?: LootHistoryEntry[];
    lootReserve?: ObjetDuButin[];
    /** Lot E2 : les messages échangés à la table. */
    messages?: SessionMessage[];
}

/**
 * Représentation sérialisée d'un GameDriver et de ses dépendances.
 */
export interface NexusDriverState {
    /** Le système de règles exporté */
    gameDriver: import('../../../types/drivers').GameDriver;
    /** Le template de fiche personnalisé exporté avec ce driver, le cas échéant */
    sheetTemplate?: import('../../../data/defaultSheetTemplates').SheetTemplate;
    /**
     * Le bestiaire du jeu — les gabarits d'adversaires rangés par le meneur.
     *
     * *Demandé par David le 2026-09-03 : « je veux tes 2 suggestions ».*
     * Partager un jeu sans ses adversaires, c'est partager un livre de règles
     * sans son bestiaire : le destinataire aurait les échelles mais devrait
     * tout refabriquer.
     *
     * **Absent des bundles antérieurs**, et c'est pourquoi il est facultatif :
     * un `.gmos-driver` d'hier s'importe sans rien perdre ni rien inventer.
     */
    bestiaire?: import('../../combat/useBestiaireStore').GabaritDAdversaire[];
}

// ─────────────────────────────────────────────
// OPTIONS & RÉSULTATS
// ─────────────────────────────────────────────

/**
 * Options passées à la fonction d'export.
 */
export interface NexusExportOptions {
    /**
     * Inclure les fichiers médias dans le bundle (défaut : `true`).
     *
     * **Offert dans le panneau depuis le 2026-09-05** (point N6). Il était lu
     * par `exportBundle` mais **aucun écran ne le passait** : l'archive
     * emportait toujours tout. Une campagne bien illustrée pèse des centaines
     * de mégaoctets, ce qui ne s'envoie pas par courriel — d'où la case.
     */
    includeAssets: boolean;
}

/*
  **`includeSounds` a été retiré le 2026-09-05.** Il était déclaré ici,
  documenté, posé à `true` par défaut — et **lu nulle part**. *Une option qui
  n'a jamais rien commandé est pire qu'une option absente : elle promet un
  réglage.* Les sons suivent `includeAssets` comme le reste des médias.
*/
export const DEFAULT_NEXUS_EXPORT_OPTIONS: NexusExportOptions = {
    includeAssets: true,
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
    /** Ce qui est entré, ligne à ligne — la sauvegarde préalable, le choix, les décomptes (lot E6). */
    bilan?: string[];
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
    /** À la fin d'un import : ce qui est entré. L'écran reste ouvert pour qu'on le lise (lot E6). */
    bilan?: string[];
}

// ─────────────────────────────────────────────
// CONFLICT RESOLVER
// ─────────────────────────────────────────────

/**
 * Stratégie de résolution choisie par l'utilisateur.
 * - `replace` : Écrase la campagne existante avec le contenu du bundle
 * - `clone`   : Importe la campagne avec de nouveaux UUIDs (coexistence)
 * - `rejouer` : Comme `clone`, et le parcours est effacé — séances, journaux,
 *               passages, scènes terminées, indices révélés ; les réserves de
 *               table reviennent au départ. Lot E4 du chantier des archives
 *               (2026-10-19), voir `rejouerLaCampagne.ts`.
 * - `cancel`  : Abandonne l'import sans modification
 */
export type NexusConflictStrategy = 'replace' | 'clone' | 'rejouer' | 'cancel';

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
    /** Archive des médias : la campagne qui les reçoit (lot E5). */
    campagneCible?: string;
}

/**
 * **La campagne qui arrive**, décrite à celui qui choisit comment l'importer.
 *
 * Lot E4 (2026-10-19) : le choix n'était proposé qu'en cas de conflit. Or on
 * rejoue le plus souvent une campagne qui n'est plus là — purgée, ou emportée
 * sur un autre poste : il n'y a pas de conflit, et il faut pourtant pouvoir
 * choisir « rejouer ». Une campagne qui arrive demande donc toujours.
 */
export interface ArriveeDUneCampagne {
    nom: string;
    exporteeLe: string;
    entites: number;
    seances: number;
    /** L'aperçu : ce que l'archive porte, compté (lot E6, `recensementDeLArchive.ts`). */
    contenu?: import('./recensementDeLArchive').LigneDuRecensement[];
    /** Le nombre de médias embarqués. */
    medias?: number;
    /**
     * `medias` : une archive des médias (`.gmos-medias`, lot E5). L'écran ne
     * propose alors ni remplacer ni rejouer, mais **la campagne qui les reçoit**.
     */
    genre?: 'campagne' | 'medias';
    /** Archive des médias : les campagnes du poste, au choix. */
    campagnes?: { id: string; name: string }[];
    /** Archive des médias : la campagne proposée d'abord (celle d'origine si elle est là, sinon l'active). */
    campagneParDefaut?: string;
}

/** Ce que l'écran présente : les conflits (peut-être aucun) et la campagne qui arrive. */
export interface ChoixDImport {
    conflicts: NexusConflict[];
    arrivee?: ArriveeDUneCampagne;
}

/**
 * Callback que le composant UI doit implémenter pour permettre
 * à l'utilisateur de résoudre les conflits avant l'injection.
 *
 * Appelé pour un pilote en conflit, et pour **toute** campagne qui arrive
 * (avec `arrivee`, conflits éventuellement vides).
 *
 * @param conflicts - Liste des conflits détectés
 * @param arrivee - La campagne de l'archive, quand c'en est une
 * @returns Une Promise résolue quand l'utilisateur a choisi sa stratégie
 */
export type OnConflictCallback = (
    conflicts: NexusConflict[],
    arrivee?: ArriveeDUneCampagne,
) => Promise<NexusConflictResolution>;
