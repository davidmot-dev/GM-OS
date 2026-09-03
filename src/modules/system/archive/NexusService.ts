/**
 * Nexus-OS — Service de Packaging & Portabilité
 *
 * Moteur principal d'export et d'import des campagnes au format `.gmos`.
 *
 * Architecture :
 * - Pattern Singleton (comme MediaCleanupService)
 * - Lecture des stores via .getState() — jamais de mutations lors de l'export
 * - Import exclusif : remplace les données de la campagne cible, ne fusionne pas
 * - Accès Electron via window.appBridge.nexus (pattern Bridge)
 *
 * Flux d'export :
 *   1. scrapeCampaignData()   — Extrait les slices Zustand
 *   2. collectAssetPaths()    — Liste tous les fichiers médias liés
 *   3. exportBundle()         — Orchestre et appelle le bridge IPC
 *
 * Flux d'import :
 *   1. importBundle()         — Valide, parse, remap les assets
 *   2. injectState()          — Injecte dans les stores (import exclusif)
 *
 * @module system/archive/NexusService
 */

import { useSessionOSStore } from '../../session/useSessionOSStore';
import { useBestiaireStore } from '../../combat/useBestiaireStore';
import { useMediaStore } from '../../../stores/useMediaStore';
import { useSoundStore } from '../../sound/useSoundStore';
import { useMusicStore } from '../../music/useMusicStore';
import { gmToast } from '../../../stores/useToastStore';
import i18next from 'i18next';
import type {
    NexusManifest,
    NexusCampaignState,
    NexusExportOptions,
    NexusExportResult,
    NexusImportRaw,
    NexusImportResult,
    NexusProgress,
    NexusOperationPhase,
    AssetEntry,
    NexusConflict,
    NexusDriverState,
    NexusConflictResolution,
    OnConflictCallback,
} from './nexus.types';
import {
    NEXUS_SCHEMA_VERSION,
    NEXUS_EXTENSION,
    DEFAULT_NEXUS_EXPORT_OPTIONS,
} from './nexus.types';
import type { GameDriver } from '../../../types/drivers';
import type { SheetTemplate } from '../../../data/defaultSheetTemplates';
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
import type { DeckManifest, DeckSessionState } from '../../session/store/types';

// ─────────────────────────────────────────────
// CONSTANTES INTERNES
// ─────────────────────────────────────────────

const GMOS_VERSION = '5.3.0';

/**
 * Chemins de destination dans l'archive pour chaque type d'asset.
 * Correspond à la structure définie dans le blueprint.
 */
const ASSET_PATHS = {
    profiles: 'assets/profiles',
    maps: 'assets/maps',
    decks: 'assets/decks',
    misc: 'assets/misc',
} as const;

// ─────────────────────────────────────────────
// PATTERN DE CHEMINS MALVEILLANTS
// ─────────────────────────────────────────────

/** Expressions régulières pour détecter les path traversal attacks */
const DANGEROUS_PATH_PATTERNS = [
    /\.\.\//g,      // ../
    /\.\.\\/g,      // ..\
    /^\/\//,        // //
    /^[a-zA-Z]:\//,  // Chemins absolus Windows lors de l'import
    /^\/(?!assets|manifest|state)/,  // Chemins absolus Unix hors des dossiers autorisés
];

// ─────────────────────────────────────────────
// SERVICE
// ─────────────────────────────────────────────

export class NexusService {
    private static instance: NexusService;

    /** Callback pour les mises à jour de progression (pour le HUD v2) */
    private progressCallback: ((progress: NexusProgress) => void) | null = null;

    /** Promise pour attendre une interaction utilisateur (ex: URLs distantes) */
    private interactionResolver: ((choice: 'localize' | 'ignore') => void) | null = null;

    /** ID de la campagne en cours d'export (pour lier les nouveaux médias) */
    private currentExportCampaignId: string | null = null;

    private constructor() {}

    public static getInstance(): NexusService {
        if (!NexusService.instance) {
            NexusService.instance = new NexusService();
        }
        return NexusService.instance;
    }

    /**
     * Enregistre un callback pour les mises à jour de progression.
     * Utilisé par le HUD v2 (non implémenté en V1).
     */
    public onProgress(callback: (progress: NexusProgress) => void): void {
        this.progressCallback = callback;
    }

    private emitProgress(
        phase: NexusOperationPhase,
        progress: number,
        message: string,
        extra?: Partial<NexusProgress>
    ): void {
        this.progressCallback?.({ phase, progress, message, ...extra });
    }

    /**
     * Appelé par le HUD pour résoudre une attente d'interaction.
     */
    public resolveInteraction(choice: 'localize' | 'ignore'): void {
        if (this.interactionResolver) {
            this.interactionResolver(choice);
            this.interactionResolver = null;
        }
    }

    // ─────────────────────────────────────────────
    // EXPORT : Scraping des données
    // ─────────────────────────────────────────────

    /**
     * Extrait toutes les données d'une campagne depuis les stores Zustand.
     * Opération en LECTURE SEULE. Ne mutate aucun store.
     *
     * @param campaignId - ID de la campagne à exporter
     * @returns Objet NexusCampaignState avec toutes les données liées
     * @throws Error si la campagne est introuvable
     */
    public scrapeCampaignData(campaignId: string): NexusCampaignState {
        const store = useSessionOSStore.getState();

        const campaign = store.campaigns.find((c: Campaign) => c.id === campaignId);
        if (!campaign) {
            throw new Error(`[NexusService] Campaign not found: ${campaignId}`);
        }

        // Niveau 1 : Données directement liées à la campagne
        const sessions = store.sessions.filter((s: GameSession) => s.campaignId === campaignId);
        const atlasMaps = store.atlasMaps.filter((m: AtlasMap) => m.campaignId === campaignId);
        const wikiEntries = store.wikiEntries?.filter((w: WikiEntry) => w.campaignId === campaignId) ?? [];
        const timelineEvents = store.timelineEvents?.filter((e: TimelineEvent) => e.campaignId === campaignId) ?? [];
        const clues = store.clues?.filter((cl: Clue) => cl.campaignId === campaignId) ?? [];

        // Niveau 2 : Entités et joueurs
        const entities = store.entities.filter((e: Entity) => e.campaignId === campaignId);

        // Pour les joueurs, on extrait uniquement les personnages liés à cette campagne
        const players: Player[] = store.players
            .map((p: Player) => ({
                ...p,
                characters: p.characters.filter((c) => c.campaignId === campaignId),
            }))
            .filter((p: Player) => p.characters.length > 0);

        // Niveau 3 : Entités liées par les relations sociales (cross-campagne)
        // Une entité de la campagne A peut avoir une relation vers une entité de la campagne B.
        // On inclut ces entités pour préserver la cohérence du réseau social.
        const relatedEntityIds = new Set<string>();
        entities.forEach((e) => {
            e.relations?.forEach((r) => {
                if (r.targetId) relatedEntityIds.add(r.targetId);
            });
        });
        // Exclure les entités déjà capturées au niveau 2 (même campaignId)
        const entityIds = new Set(entities.map((e: Entity) => e.id));
        const relatedEntities: Entity[] = store.entities.filter(
            (e: Entity) => relatedEntityIds.has(e.id) && !entityIds.has(e.id)
        );

        // Niveau 3 : Decks de cartes (liés via deckSlice)
        // Le DeckSlice utilise `decks` (manifestes) et `deckStates` (états de session)
        const deckManifests: DeckManifest[] = (store.decks ?? []).filter(
            (d: DeckManifest) => d.systemId === campaign.system
        );
        const deckSessionStates: DeckSessionState[] = Object.values(store.deckStates ?? {});

        // Niveau 4 : Snapshot des GameDrivers et SheetTemplates requis (manifeste uniquement)
        // Permet à l'importateur de vérifier la disponibilité des dépendances.
        const requiredDriverIds = campaign.system ? [campaign.system] : [];
        const requiredDriverData = (store.customGameDrivers ?? []).filter(
            (d) => requiredDriverIds.includes(d.id)
        );
        const allTemplateIds = [
            ...new Set([
                ...entities.map((e) => e.templateId).filter(Boolean) as string[],
                ...players.flatMap((p) =>
                    p.characters.map((c) => c.templateId).filter(Boolean)
                ) as string[],
            ]),
        ];
        const requiredTemplateData = (store.customSheetTemplates ?? []).filter(
            (t) => allTemplateIds.includes(t.id)
        );

        // Niveau 5 : Atmosphères de la SoundBoard (pads audio)
        // On exporte TOUTES les atmosphères — elles ne sont pas liées à une campagne spécifique
        // mais font partie de l'environnement de jeu du GM.
        const atmospheres = useSoundStore.getState().atmospheres;

        // Niveau 5 : Playlists musicales
        const playlists = useMusicStore.getState().playlists;

        return {
            campaign,
            entities: [...entities, ...relatedEntities],
            players,
            sessions,
            atlasMaps,
            wikiEntries,
            timelineEvents,
            clues,
            deckManifests,
            deckSessionStates,
            relatedEntities,       // Méta : entités cross-campagne (pour info)
            requiredDriverData,    // Snapshot des drivers personnalisés requis
            requiredTemplateData,  // Snapshot des templates personnalisés requis
            atmospheres,           // Niveau 5 : Sound pads
            playlists,             // Niveau 5 : Music playlists
        };
    }

    /**
     * Extrait les données d'un GameDriver et son template associé.
     */
    public scrapeDriverData(driverId: string): NexusDriverState {
        const store = useSessionOSStore.getState();
        const customGameDrivers = store.customGameDrivers ?? [];
        const customSheetTemplates = store.customSheetTemplates ?? [];

        const gameDriver = customGameDrivers.find((d: GameDriver) => d.id === driverId);
        if (!gameDriver) {
            throw new Error(`[NexusService] Driver not found: ${driverId}`);
        }

        // Si l'ID du driver correspond à un template (convention GM-OS), l'exporter
        const sheetTemplate = customSheetTemplates.find((t: SheetTemplate) => t.id === driverId);

        /*
          **Le bestiaire voyage avec son jeu.** Il est deja indexe par
          `driver.id` : le ramasser ici ne demande qu'une lecture. On l'omet
          quand il est vide plutot que d'ecrire un tableau nul — *un bundle ne
          doit pas grossir de champs qui ne disent rien.*
        */
        const bestiaire = useBestiaireStore.getState().gabaritsDuJeu(driverId);

        return {
            gameDriver,
            sheetTemplate,
            ...(bestiaire.length ? { bestiaire } : {}),
        };
    }


    // ─────────────────────────────────────────────
    // EXPORT : Moissonnage des assets (Harvest)
    // ─────────────────────────────────────────────

    /**
     * Collecte tous les chemins/IDs de médias référencés dans les données de campagne.
     * Implémente la "Cartographie des Dépendances d'Actifs" du blueprint (section 3).
     *
     * @param state - Données de campagne extraites par scrapeCampaignData
     * @returns Set des refs d'assets uniques (m-xxx IDs ou chemins locaux)
     */
    public collectAssetPaths(state: NexusCampaignState): Set<string> {
        const assets = new Set<string>();

        const addRef = (ref: string | undefined | null): void => {
            if (!ref || !this.isValidAssetRef(ref)) return;
            assets.add(ref);
        };

        // Campaign-OS
        addRef(state.campaign.wallpaperUrl);
        // ragPath est un dossier local — exclure (il peut être très volumineux)

        // NPC/PC-OS : avatars, portraits, tokens
        state.entities.forEach((e) => {
            addRef(e.avatar);
        });

        state.players.forEach((p) => {
            p.characters.forEach((c) => {
                addRef(c.portraitUrl);
                addRef(c.tokenUrl);
            });
        });

        // Map-OS : fichiers de carte (Image ou Vidéo)
        state.atlasMaps.forEach((m) => {
            addRef(m.fileUrl);
        });

        // Wiki-OS : galeries d'images
        state.wikiEntries.forEach((w) => {
            w.imageUrls?.forEach((url) => addRef(url));
        });

        // Clues-OS : médias d'indices
        state.clues.forEach((cl) => {
            addRef(cl.mediaUrl);
        });

        // Deck-OS : dossiers complets (référencés par folderPath)
        // Note: les decks sont copiés en tant que répertoires complets
        // Le bridge IPC gère la copie récursive via folderPath
        state.deckManifests.forEach((d) => {
            if (d.folderPath) addRef(d.folderPath);
        });

        // Sound-OS : fichiers audio liés aux Sound Pads (filePath absolu)
        // On n'exporte que les chemins absolus valides (pas les chemins réseaux)
        state.atmospheres?.forEach((atmos) => {
            Object.values(atmos.pads).forEach((pad) => {
                if (pad.filePath) addRef(pad.filePath);
            });
        });

        // Music-OS : URLs locales des Music Pads (type 'local' uniquement)
        // Les URLs 'link' (YouTube, Spotify, etc.) sont des liens distants — non-exportables
        state.playlists?.forEach((playlist) => {
            playlist.pads.forEach((pad) => {
                if (pad.type === 'local' && pad.url) addRef(pad.url);
            });
        });

        return assets;
    }

    /**
     * Vérifie qu'une référence d'asset est valide (m-xxx ID ou chemin local).
     * Exclut les URLs distantes (http/https).
     */
    private isValidAssetRef(ref: string): boolean {
        if (!ref) return false;
        if (ref.startsWith('http://') || ref.startsWith('https://')) return false;
        if (ref.startsWith('blob:')) return false;
        if (ref.trim() === '') return false;
        return true;
    }


    /**
     * Sépare les références d'assets en deux catégories :
     * - Chemins absolus (fichiers locaux accessibles par le main process)
     * - IDs Media Hub (m-xxx : Blobs stockés dans IndexedDB, inaccessibles par le main process)
     */
    private splitAssetRefs(refs: Set<string>): {
        absolutePaths: string[];
        mediaHubIds: string[];
    } {
        const absolutePaths: string[] = [];
        const mediaHubIds: string[] = [];

        for (const ref of refs) {
            if (/^m-/.test(ref)) {
                mediaHubIds.push(ref);
            } else {
                absolutePaths.push(ref);
            }
        }

        return { absolutePaths, mediaHubIds };
    }

    /**
     * Résout les IDs Media Hub (m-xxx) en data URLs base64.
     * Lit directement les Blobs depuis IndexedDB via useMediaStore.getMediaBlob().
     *
     * @param mediaHubIds - Liste des IDs m-xxx à résoudre
     * @param onProgress - Callback de progression optionnel
     * @returns Map: mediaHubId -> base64 data URL (les IDs non-résolvables sont omis)
     */
    public async resolveMediaHubAssets(
        mediaHubIds: string[],
        onProgress?: (resolved: number, total: number) => void
    ): Promise<Record<string, string>> {
        const mediaStore = useMediaStore.getState();
        const inlineAssets: Record<string, string> = {};
        let resolved = 0;

        for (const id of mediaHubIds) {
            try {
                const blob = await mediaStore.getMediaBlob(id);
                if (!blob) {
                    console.warn(`[NexusService] Media Hub ID non-résolvable : ${id}`);
                    resolved++;
                    onProgress?.(resolved, mediaHubIds.length);
                    continue;
                }

                // Convertir le Blob en base64 data URL
                const dataUrl = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result as string);
                    reader.onerror = () => reject(new Error(`FileReader échoué pour ${id}`));
                    reader.readAsDataURL(blob);
                });

                inlineAssets[id] = dataUrl;
                console.log(`[NexusService] Media Hub ID résolu : ${id} (${blob.size} octets)`);
            } catch (err) {
                console.error(`[NexusService] Erreur résolution ${id} :`, err);
            }

            resolved++;
            onProgress?.(resolved, mediaHubIds.length);
        }

        return inlineAssets;
    }

    /**
     * Détermine le dossier de destination dans l'archive pour un asset.
     * Utilisé par le bridge IPC (main process) pour organiser l'archive.
     * Exposé publiquement pour tests et pour le bridge lors de l'export.
     */
    public getAssetDestinationFolder(ref: string): string {
        if (ref.startsWith('assets/decks/')) return ASSET_PATHS.decks;

        const ext = ref.split('.').pop()?.toLowerCase() ?? '';
        const imageExts = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'];
        const videoExts = ['mp4', 'webm', 'mov'];

        if (imageExts.includes(ext)) {
            // Heuristique : les avatars/portraits sont probablement des profils
            if (ref.includes('avatar') || ref.includes('portrait') || ref.includes('token')) {
                return ASSET_PATHS.profiles;
            }
            return ASSET_PATHS.maps;
        }

        if (videoExts.includes(ext)) return ASSET_PATHS.maps;

        // IDs Media Hub (m-xxx) → profils par défaut
        if (ref.startsWith('m-')) return ASSET_PATHS.profiles;

        return ASSET_PATHS.misc;
    }

    // ─────────────────────────────────────────────
    // EXPORT : Construction du manifeste
    // ─────────────────────────────────────────────

    /**
     * Construit le manifeste de l'archive.
     * Les checksums réels sont calculés par le bridge IPC (accès natif au FS).
     * Ici, on fournit la liste et la structure attendues.
     */
    public buildManifest(
        state: NexusCampaignState,
        assetRefs: Set<string>
    ): Omit<NexusManifest, 'assetMap' | 'stats'> & { assetRefList: string[] } {
        return {
            schemaVersion: NEXUS_SCHEMA_VERSION,
            bundleId: `nexus-camp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            bundleType: 'campaign',
            campaignId: state.campaign.id,
            campaignName: state.campaign.name,
            exportedAt: new Date().toISOString(),
            gmosVersion: GMOS_VERSION,
            requiredDriverIds: state.campaign.system ? [state.campaign.system] : [],
            requiredTemplateIds: [
                ...new Set([
                    ...state.entities.map((e) => e.templateId).filter(Boolean) as string[],
                    ...state.players.flatMap((p) =>
                        p.characters.map((c) => c.templateId).filter(Boolean)
                    ) as string[],
                ]),
            ],
            assetRefList: Array.from(assetRefs),
        };
    }

    // ─────────────────────────────────────────────
    // EXPORT : Scan & Téléchargement des URLs distantes
    // ─────────────────────────────────────────────
    
    /**
     * Parcourt récursivement l'état de la campagne pour identifier les URLs distantes.
     * Cette méthode ne modifie pas l'état original mais retourne une liste d'URLs.
     */
    public scanForRemoteUrls(state: NexusCampaignState): string[] {
        const remoteUrls = new Set<string>();
        const httpRegex = /^https?:\/\//;

        const scan = (obj: unknown) => {
            if (!obj || typeof obj !== 'object') return;
            
            if (Array.isArray(obj)) {
                obj.forEach(scan);
                return;
            }

            Object.values(obj as Record<string, unknown>).forEach((value) => {
                if (typeof value === 'string' && httpRegex.test(value)) {
                    // Exclure les domaines connus non-portables/techniques si besoin
                    if (!value.includes('youtube.com') && !value.includes('spotify.com') && !value.includes('localhost')) {
                        remoteUrls.add(value);
                    }
                } else if (typeof value === 'object') {
                    scan(value);
                }
            });
        };

        scan(state);
        return Array.from(remoteUrls);
    }

    /**
     * Télécharge les URLs distantes et les remplace par des IDs Media Hub (m-xxx).
     * Modifie l'objet state passé en paramètre (clone d'export).
     */
    public async downloadAndLocalize(
        urls: string[],
        state: NexusCampaignState,
        onProgress?: (done: number, total: number) => void
    ): Promise<{ state: NexusCampaignState; failedCount: number }> {
        const mediaStore = useMediaStore.getState();
        const urlToMediaId = new Map<string, string>();
        let done = 0;
        let failedCount = 0;

        for (const url of urls) {
            try {
                const response = await fetch(url);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                
                const blob = await response.blob();
                const fileName = url.split('/').pop()?.split('?')[0] || 'remote_asset';
                const file = new File([blob], fileName, { type: blob.type });
                
                const campaignIds = this.currentExportCampaignId ? [this.currentExportCampaignId] : [];
                const mediaId = await mediaStore.addMedia(file, ['nexus-import'], campaignIds);
                
                urlToMediaId.set(url, mediaId);
            } catch (err) {
                failedCount++;
                const fileName = url.split('/').pop()?.split('?')[0] || 'asset';
                this.emitProgress('remote_check', (done / urls.length) * 100, `⚠️ ${i18next.t('modules:system.nexus.phases.error')} : ${fileName}`);
                console.error(`[NexusService] Échec localisation URL ${url} :`, err);
            }
            
            done++;
            onProgress?.(done, urls.length);
        }

        // 3. Remplacement récursif dans le state
        const replace = (obj: unknown) => {
            if (!obj || typeof obj !== 'object') return;
            
            if (Array.isArray(obj)) {
                obj.forEach(replace);
                return;
            }

            const record = obj as Record<string, unknown>;
            Object.keys(record).forEach(key => {
                const value = record[key];
                if (typeof value === 'string' && urlToMediaId.has(value)) {
                    record[key] = urlToMediaId.get(value);
                } else if (typeof value === 'object') {
                    replace(value);
                }
            });
        };

        replace(state);
        return { state, failedCount };
    }

    /**
     * Construit le manifeste pour un Game Driver.
     */
    public buildDriverManifest(
        state: NexusDriverState
    ): Omit<NexusManifest, 'assetMap' | 'stats'> & { assetRefList: string[] } {
        return {
            schemaVersion: NEXUS_SCHEMA_VERSION,
            bundleId: `nexus-drv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            bundleType: 'driver',
            driverId: state.gameDriver.id,
            driverName: state.gameDriver.name,
            exportedAt: new Date().toISOString(),
            gmosVersion: GMOS_VERSION,
            requiredDriverIds: [], 
            requiredTemplateIds: [], 
            assetRefList: [], 
        };
    }


    // ─────────────────────────────────────────────
    // EXPORT : Orchestrateur principal
    // ─────────────────────────────────────────────

    /**
     * Exporte une campagne complète dans un bundle `.gmos`.
     *
     * @param campaignId - ID de la campagne à exporter
     * @param options - Options d'export
     * @returns Résultat de l'opération
     */
    public async exportBundle(
        campaignId: string,
        options: NexusExportOptions = DEFAULT_NEXUS_EXPORT_OPTIONS
    ): Promise<NexusExportResult> {
        // Guard : vérification du pont IPC
        if (!window.appBridge?.nexus) {
            console.warn('[NexusService] appBridge.nexus non disponible. Mode développement Web?');
            gmToast(i18next.t('modules:session.campaign_details.status.no_electron'), 'error');
            return { success: false, missingAssets: [], error: i18next.t('modules:system.nexus.messages.bridge_unavailable') };
        }

        this.currentExportCampaignId = campaignId;

        try {
            // Phase 1 : Scraping
            this.emitProgress('scraping', 10, i18next.t('modules:system.nexus.messages.export_scraping'));
            let state = this.scrapeCampaignData(campaignId);

            // Phase 1b : Vérification des URLs distantes (NOUVEAU Nexus-OS v2)
            this.emitProgress('remote_check', 20, i18next.t('modules:system.nexus.phases.remote_check'));
            const remoteUrls = this.scanForRemoteUrls(state);

            if (remoteUrls.length > 0) {
                this.emitProgress('remote_check', 20, `${remoteUrls.length} actifs distants trouvés.`, {
                    interactionRequired: true,
                    interactionType: 'remote_assets_found',
                    remoteUrlCount: remoteUrls.length
                });

                // Attendre le choix de l'utilisateur (Pause du HUD)
                const choice = await new Promise<'localize' | 'ignore'>((resolve) => {
                    this.interactionResolver = resolve;
                });

                if (choice === 'localize') {
                    this.emitProgress('remote_check', 22, i18next.t('modules:system.nexus.hud.interaction.localize_all'));
                    const result = await this.downloadAndLocalize(remoteUrls, state, (done, total) => {
                        const subProgress = 22 + Math.round((done / total) * 13); // 22% to 35%
                        this.emitProgress('remote_check', subProgress, `${i18next.t('modules:system.nexus.hud.interaction.localize_all')} : ${done}/${total}`);
                    });
                    
                    state = result.state;
                    if (result.failedCount > 0) {
                        this.emitProgress('remote_check', 35, i18next.t('modules:system.nexus.phases.remote_check'));
                    } else {
                        this.emitProgress('remote_check', 35, i18next.t('modules:system.nexus.phases.remote_check'));
                    }
                } else {
                    this.emitProgress('remote_check', 35, i18next.t('modules:system.nexus.hud.interaction.ignore'));
                }
            } else {
                this.emitProgress('remote_check', 35, i18next.t('modules:system.nexus.phases.remote_check'));
            }

            // Phase 2 : Harvesting — collecte et séparation des refs d'assets locaux
            this.emitProgress('harvesting', 40, i18next.t('modules:system.nexus.phases.harvesting'));
            const assetRefs = options.includeAssets
                ? this.collectAssetPaths(state)
                : new Set<string>();

            // Phase 2b : Résolution des Media Hub IDs (IDB → base64)
            const { absolutePaths, mediaHubIds } = this.splitAssetRefs(assetRefs);
            let inlineAssets: Record<string, string> = {};

            if (mediaHubIds.length > 0) {
                const mediaStore = useMediaStore.getState();
                if (!mediaStore.isInitialized) {
                    await mediaStore.initDB();
                }

                this.emitProgress('harvesting', 45, i18next.t('modules:system.nexus.messages.media_transfer', { count: mediaHubIds.length }));
                inlineAssets = await this.resolveMediaHubAssets(mediaHubIds, (done, total) => {
                    const pct = 45 + Math.round((done / total) * 10); // 45→55%
                    this.emitProgress('harvesting', pct, i18next.t('modules:system.nexus.messages.media_transferred', { current: done, total }));
                });
            }

            // Phase 3 : Manifest
            this.emitProgress('packaging', 60, i18next.t('modules:system.nexus.messages.manifest_validation'));
            const partialManifest = this.buildManifest(state, assetRefs);
            const stateJson = JSON.stringify(state);

            // Phase 4 : Sélection du chemin de sortie
            const outputPath = await window.appBridge.nexus.selectExportPath();
            if (!outputPath) {
                this.emitProgress('idle', 0, '');
                return { success: false, missingAssets: [], error: i18next.t('modules:system.nexus.messages.export_cancelled') };
            }

            // Phase 4.5 : Transfert des assets vers le main process (Streaming)
            if (Object.keys(inlineAssets).length > 0) {
                this.emitProgress('packaging', 65, i18next.t('modules:system.nexus.messages.media_transfer', { count: Object.keys(inlineAssets).length }));
                await window.appBridge.nexus.clearAssets();
                let streamed = 0;
                const total = Object.keys(inlineAssets).length;
                for (const [id, dataUrl] of Object.entries(inlineAssets)) {
                    await window.appBridge.nexus.registerAsset(id, dataUrl);
                    streamed++;
                    const pct = 65 + Math.round((streamed / total) * 15); // 65→80%
                    this.emitProgress('packaging', pct, i18next.t('modules:system.nexus.messages.media_transferred', { current: streamed, total }));
                }
            }

            // Phase 5 : Finalisation
            this.emitProgress('packaging', 85, i18next.t('modules:system.nexus.messages.bundle_compression'));
            const result = await window.appBridge.nexus.exportBundle(
                campaignId,
                outputPath,
                stateJson,
                JSON.stringify(partialManifest),
                absolutePaths
            );

            if (result.success) {
                this.emitProgress('done', 100, i18next.t('modules:system.nexus.messages.export_success'));
                gmToast(`${i18next.t('modules:system.nexus.messages.export_success')} : ${state.campaign.name}${NEXUS_EXTENSION}`, 'success');
            } else {
                this.emitProgress('error', 0, result.error ?? i18next.t('modules:system.nexus.messages.unknown_error'));
                gmToast(i18next.t('modules:system.nexus.messages.export_error'), 'error');
            }

            return result;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Erreur inconnue';
            console.error('[NexusService] Export échoué:', err);
            this.emitProgress('error', 0, message);
            gmToast(`Export échoué : ${message}`, 'error');
            return { success: false, missingAssets: [], error: message };
        }
    }

    /**
     * Exporte un GameDriver dans un bundle `.gmos-driver`.
     */
    public async exportDriverBundle(
        driverId: string
    ): Promise<NexusExportResult> {
        if (!window.appBridge?.nexus) {
            console.warn('[NexusService] appBridge.nexus non disponible.');
            return { success: false, missingAssets: [], error: 'Bridge IPC non disponible.' };
        }

        try {
            this.emitProgress('scraping', 20, i18next.t('modules:system.nexus.messages.driver_scraping'));
            const state = this.scrapeDriverData(driverId);

            this.emitProgress('packaging', 50, i18next.t('modules:system.nexus.messages.manifest_validation'));
            const partialManifest = this.buildDriverManifest(state);
            const stateJson = JSON.stringify(state);

            const outputPath = await window.appBridge.nexus.selectExportPath('driver');
            if (!outputPath) {
                this.emitProgress('idle', 0, '');
                return { success: false, missingAssets: [], error: i18next.t('modules:system.nexus.messages.export_cancelled') };
            }

            this.emitProgress('packaging', 70, i18next.t('modules:system.nexus.messages.bundle_compression'));
            const result = await window.appBridge.nexus.exportBundle(
                driverId,
                outputPath,
                stateJson,
                JSON.stringify(partialManifest),
                [] 
            );

            if (result.success) {
                this.emitProgress('done', 100, i18next.t('modules:system.nexus.messages.export_success'));
                gmToast(`${i18next.t('modules:system.nexus.messages.export_success')} : ${state.gameDriver.name}.gmos-driver`, 'success');
            } else {
                this.emitProgress('error', 0, result.error ?? i18next.t('modules:system.nexus.messages.unknown_error'));
                gmToast(i18next.t('modules:system.nexus.messages.export_error'), 'error');
            }

            return result;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Erreur inconnue';
            console.error('[NexusService] Export échoué:', err);
            this.emitProgress('error', 0, message);
            gmToast(`Export driver échoué : ${message}`, 'error');
            return { success: false, missingAssets: [], error: message };
        }
    }

    // ─────────────────────────────────────────────
    // IMPORT : Validation du manifeste
    // ─────────────────────────────────────────────

    /**
     * Valide le schéma d'un manifeste JSON parsé.
     * Protège contre les archives corrompues ou malformées.
     *
     * @param manifest - Objet manifeste à valider
     * @returns Liste des erreurs de validation (vide = valide)
     */
    public validateManifest(manifest: unknown): string[] {
        const errors: string[] = [];

        if (typeof manifest !== 'object' || manifest === null) {
            return [i18next.t('modules:system.nexus.messages.invalid_archive', { errors: 'Not an object' })];
        }

        const m = manifest as Record<string, unknown>;

        if (m['schemaVersion'] !== NEXUS_SCHEMA_VERSION) {
            errors.push(
                i18next.t('modules:system.nexus.messages.invalid_archive', { errors: `Version schema: ${m['schemaVersion']}` })
            );
        }

        if (m['bundleType'] === 'driver') {
            if (typeof m['driverId'] !== 'string' || !m['driverId']) {
                errors.push(i18next.t('modules:system.nexus.messages.manifest_field_missing', { field: 'driverId' }));
            }
            if (typeof m['driverName'] !== 'string' || !m['driverName']) {
                errors.push(i18next.t('modules:system.nexus.messages.manifest_field_missing', { field: 'driverName' }));
            }
        } else {
            if (typeof m['campaignId'] !== 'string' || !m['campaignId']) {
                errors.push(i18next.t('modules:system.nexus.messages.manifest_field_missing', { field: 'campaignId' }));
            }
            if (typeof m['campaignName'] !== 'string' || !m['campaignName']) {
                errors.push(i18next.t('modules:system.nexus.messages.manifest_field_missing', { field: 'campaignName' }));
            }
        }

        if (typeof m['exportedAt'] !== 'string') {
            errors.push(i18next.t('modules:system.nexus.messages.manifest_field_missing', { field: 'exportedAt' }));
        }

        // Validation des entrées d'assets (protection path traversal)
        const assetMap = m['assetMap'] as AssetEntry[] | undefined;
        if (assetMap) {
            assetMap.forEach((entry) => {
                if (this.isDangerousPath(entry.relativePath)) {
                    errors.push(i18next.t('modules:system.nexus.messages.malicious_path', { path: entry.relativePath }));
                }
            });
        }

        return errors;
    }

    /**
     * Détecte les path traversal attacks dans un chemin relatif.
     */
    public isDangerousPath(path: string): boolean {
        if (!path || typeof path !== 'string') return true;
        return DANGEROUS_PATH_PATTERNS.some((pattern) => pattern.test(path));
    }

    // ─────────────────────────────────────────────
    // IMPORT : Remappage des chemins
    // ─────────────────────────────────────────────

    /**
     * Remappe les chemins d'assets dans les données extraites.
     * Transforme les chemins relatifs de l'archive en chemins locaux absolus.
     *
     * @param state - Données de campagne extraites de l'archive
     * @param assetMap - Table de correspondance relativePath -> resolvedLocalPath
     * @returns NexusCampaignState avec les chemins mis à jour
     */
    public remapPaths(
        state: NexusCampaignState,
        assetMap: Record<string, string>
    ): NexusCampaignState {
        const remap = (ref: string | undefined): string | undefined => {
            if (!ref) return undefined;
            return assetMap[ref] ?? ref;
        };

        return {
            ...state,
            campaign: {
                ...state.campaign,
                wallpaperUrl: remap(state.campaign.wallpaperUrl),
            },
            entities: state.entities.map((e) => ({
                ...e,
                avatar: remap(e.avatar) ?? e.avatar,
            })),
            players: state.players.map((p) => ({
                ...p,
                characters: p.characters.map((c) => ({
                    ...c,
                    portraitUrl: remap(c.portraitUrl) ?? c.portraitUrl,
                    tokenUrl: remap(c.tokenUrl),
                })),
            })),
            atlasMaps: state.atlasMaps.map((m) => ({
                ...m,
                fileUrl: remap(m.fileUrl) ?? m.fileUrl,
            })),
            wikiEntries: state.wikiEntries.map((w) => ({
                ...w,
                imageUrls: w.imageUrls?.map((url) => remap(url) ?? url) ?? [],
            })),
            clues: state.clues.map((cl) => ({
                ...cl,
                mediaUrl: remap(cl.mediaUrl),
            })),
            // Sound-OS : remap des filePaths des Sound Pads
            atmospheres: state.atmospheres?.map((atmos) => ({
                ...atmos,
                pads: Object.fromEntries(
                    Object.entries(atmos.pads).map(([padId, pad]) => [
                        padId,
                        { ...pad, filePath: pad.filePath ? (remap(pad.filePath) ?? pad.filePath) : null },
                    ])
                ),
            })),
            // Music-OS : remap des urls locales des Music Pads
            playlists: state.playlists?.map((playlist) => ({
                ...playlist,
                pads: playlist.pads.map((pad) =>
                    pad.type === 'local'
                        ? { ...pad, url: remap(pad.url) ?? pad.url }
                        : pad
                ),
            })),
        };
    }

    // ─────────────────────────────────────────────
    // IMPORT : Injection dans les stores
    // ─────────────────────────────────────────────

    /**
     * Injecte les données importées dans les stores Zustand.
     * IMPORT EXCLUSIF : les données existantes de cette campagne sont
     * remplacées, non fusionnées. Les autres campagnes ne sont pas touchées.
     *
     * @param state - Données à injecter (chemins déjà remappés)
     */
    private injectState(state: NexusCampaignState): void {
        const store = useSessionOSStore.getState();
        const campaignId = state.campaign.id;

        console.log(`[NexusService] Preparing atomic injection for campaign: ${campaignId}`);

        // 1. Campagnes
        const updatedCampaigns = store.campaigns.some(c => c.id === campaignId)
            ? store.campaigns.map(c => c.id === campaignId ? state.campaign : c)
            : [...store.campaigns, state.campaign];

        // 2. Entités
        const updatedEntities = [
            ...store.entities.filter(e => e.campaignId !== campaignId),
            ...state.entities,
        ];

        // 3. Joueurs & Personnages
        const playersWithoutThisCampaign = store.players.map(p => ({
            ...p,
            characters: p.characters.filter(c => c.campaignId !== campaignId),
        }));

        const mergedPlayers = playersWithoutThisCampaign.map(existing => {
            const imported = state.players.find(p => p.id === existing.id);
            if (!imported) return existing;
            return {
                ...existing,
                characters: [...existing.characters, ...imported.characters],
            };
        });

        const newPlayers = state.players.filter(
            p => !store.players.some(ep => ep.id === p.id)
        );
        const finalPlayers = [...mergedPlayers, ...newPlayers];

        // 4. Sous-systèmes (Sessions, Maps, Wiki, etc.)
        const nextPartialState: any = {
            campaigns: updatedCampaigns,
            entities: updatedEntities,
            players: finalPlayers,
            sessions: [
                ...store.sessions.filter(s => s.campaignId !== campaignId),
                ...state.sessions,
            ],
            atlasMaps: [
                ...store.atlasMaps.filter(m => m.campaignId !== campaignId),
                ...state.atlasMaps,
            ],
        };

        if (store.wikiEntries !== undefined) {
            nextPartialState.wikiEntries = [
                ...(store.wikiEntries.filter(w => w.campaignId !== campaignId)),
                ...(state.wikiEntries ?? []),
            ];
        }

        if (store.timelineEvents !== undefined) {
            nextPartialState.timelineEvents = [
                ...(store.timelineEvents.filter(e => e.campaignId !== campaignId)),
                ...(state.timelineEvents ?? []),
            ];
        }

        if (store.clues !== undefined) {
            nextPartialState.clues = [
                ...(store.clues.filter(c => c.campaignId !== campaignId)),
                ...(state.clues ?? []),
            ];
        }

        // Injection atomique
        useSessionOSStore.setState(nextPartialState);
        console.log(`[NexusService] Atomic injection complete for: ${campaignId}`);
    }

    /**
     * Stores Zustand : `useSessionOSStore.setState` mettra à jour à la fois 
     * `customGameDrivers` et `customSheetTemplates`.
     *
     * @param state - Données du driver à injecter
     */
    private injectDriverState(state: NexusDriverState): void {
        const store = useSessionOSStore.getState();
        const driverId = state.gameDriver.id;

        const previousState = {
            customGameDrivers: store.customGameDrivers ? [...store.customGameDrivers] : [],
            customSheetTemplates: store.customSheetTemplates ? [...store.customSheetTemplates] : [],
            /* Le bestiaire entre dans le rollback comme le reste : une injection
               qui echoue a mi-chemin ne doit pas laisser la moitie d'un jeu. */
            gabarits: [...useBestiaireStore.getState().gabarits],
        };

        try {
            useSessionOSStore.setState((s) => {
                const gameDrivers = s.customGameDrivers ?? [];
                const updatedDrivers = [
                    ...gameDrivers.filter((d: GameDriver) => d.id !== driverId),
                    state.gameDriver,
                ];

                const sheetTemplates = s.customSheetTemplates ?? [];
                let updatedTemplates = sheetTemplates;

                // Si le bundle contient un template, le lier au même ID
                if (state.sheetTemplate) {
                    updatedTemplates = [
                        ...sheetTemplates.filter((t: SheetTemplate) => t.id !== state.sheetTemplate!.id),
                        state.sheetTemplate,
                    ];
                }

                return {
                    customGameDrivers: updatedDrivers,
                    customSheetTemplates: updatedTemplates,
                };
            });
            /*
              **Les gabarits sont RE-CLES sur le pilote importe.** Ils portent
              deja le bon `jeuId` en principe — mais un bundle bricole a la main,
              ou un pilote renomme avant l'export, suffirait a les rendre
              invisibles : ils seraient importes puis introuvables, ce qui est
              pire que ne pas les importer du tout.

              `enregistrer` applique sa regle habituelle : meme nom pour le meme
              jeu, on remplace. Reimporter deux fois le meme bundle ne fabrique
              donc pas de doublons.
            */
            for (const gabarit of state.bestiaire ?? []) {
                useBestiaireStore.getState().enregistrer({
                    jeuId: driverId,
                    nom: gabarit.nom,
                    archetypeId: gabarit.archetypeId,
                    rangId: gabarit.rangId,
                    sheetData: gabarit.sheetData,
                    notes: gabarit.notes,
                });
            }
            if (state.bestiaire?.length) {
                console.log(`[NexusService] ${state.bestiaire.length} gabarit(s) d'adversaire importe(s)`);
            }
            console.log(`[NexusService] Driver injecté avec succès : ${driverId}`);
        } catch (err) {
            console.error('[NexusService] Injection driver échouée, rollback...', err);
            useSessionOSStore.setState({
                customGameDrivers: previousState.customGameDrivers,
                customSheetTemplates: previousState.customSheetTemplates,
            });
            useBestiaireStore.setState({ gabarits: previousState.gabarits });
            throw err;
        }
    }

    // ─────────────────────────────────────────────
    // IMPORT : Détection de conflits
    // ─────────────────────────────────────────────

    /**
     * Détecte les conflits entre les données d'un bundle importé
     * et celles du store actuel.
     *
     * Un conflit existe si la campagne du bundle possède le même ID
     * qu'une campagne déjà présente dans le store.
     * d'une campagne intégrée ou d'un driver déjà présent.
     */
    public detectConflicts(
        manifest: NexusManifest,
        incomingState?: NexusCampaignState | NexusDriverState
    ): NexusConflict[] {
        const store = useSessionOSStore.getState();
        const conflicts: NexusConflict[] = [];

        if (manifest.bundleType === 'driver') {
            const existingDriver = store.customGameDrivers?.find((d: GameDriver) => d.id === manifest.driverId);
            if (existingDriver) {
                conflicts.push({
                    type: 'driver',
                    existingId: existingDriver.id,
                    existingName: existingDriver.name,
                    incomingName: manifest.driverName ?? existingDriver.name,
                    exportedAt: manifest.exportedAt,
                });
            }
        } else {
            const castedState = incomingState as NexusCampaignState | undefined;
            const existingCampaign = store.campaigns.find(
                (c: Campaign) => c.id === (manifest.campaignId ?? castedState?.campaign.id)
            );

            if (existingCampaign) {
                conflicts.push({
                    type: 'campaign',
                    existingId: existingCampaign.id,
                    existingName: existingCampaign.name,
                    incomingName: manifest.campaignName ?? existingCampaign.name,
                    exportedAt: manifest.exportedAt,
                    entityCount: manifest.stats?.entityCount ?? castedState?.entities.length ?? 0,
                    sessionCount: manifest.stats?.sessionCount ?? castedState?.sessions.length ?? 0,
                });
            }
        }

        return conflicts;
    }

    /**
     * Applique la stratégie "Clone" à un état importé :
     * régénère tous les UUIDs internes pour que la campagne
     * importée coexiste avec la campagne originale sans écraser quoi que ce soit.
     */
    public applyResolutionToState(
        state: NexusCampaignState,
        resolution: NexusConflictResolution
    ): NexusCampaignState {
        if (resolution.strategy !== 'clone') return state;

        // Générer un nouvel ID pour la campagne
        const newCampaignId = `camp-${crypto.randomUUID()}`;
        const oldCampaignId = state.campaign.id;

        // Remap de tous les campaignId dans les sous-entités
        const remapId = (id: string) => (id === oldCampaignId ? newCampaignId : id);

        return {
            ...state,
            campaign: {
                ...state.campaign,
                id: newCampaignId,
                name: `${state.campaign.name} (Copie)`,
            },
            entities: state.entities.map((e) => ({
                ...e,
                id: `npc-${crypto.randomUUID()}`,
                campaignId: newCampaignId,
            })),
            sessions: state.sessions.map((s) => ({
                ...s,
                id: `sess-${crypto.randomUUID()}`,
                campaignId: remapId(s.campaignId),
            })),
            atlasMaps: state.atlasMaps.map((m) => ({
                ...m,
                id: `map-${crypto.randomUUID()}`,
                campaignId: remapId(m.campaignId),
            })),
            wikiEntries: state.wikiEntries.map((w) => ({
                ...w,
                id: `wiki-${crypto.randomUUID()}`,
                campaignId: remapId(w.campaignId),
            })),
            timelineEvents: state.timelineEvents.map((t) => ({
                ...t,
                id: `te-${crypto.randomUUID()}`,
                campaignId: remapId(t.campaignId),
            })),
            clues: state.clues.map((cl) => ({
                ...cl,
                id: `clue-${crypto.randomUUID()}`,
                campaignId: remapId(cl.campaignId),
            })),
        };
    }

    /**
     * Applique la stratégie "Clone" à un état importé de type Driver :
     * régénère l'ID du driver et de son template (s'il existe).
     */
    public applyResolutionToDriver(
        state: NexusDriverState,
        resolution: NexusConflictResolution
    ): NexusDriverState {
        if (resolution.strategy !== 'clone') return state;

        const newDriverId = `tpl-${crypto.randomUUID()}`;

        const newState: NexusDriverState = {
            gameDriver: {
                ...state.gameDriver,
                id: newDriverId,
                name: `${state.gameDriver.name} (Copie)`,
            },
        };

        if (state.sheetTemplate) {
            newState.sheetTemplate = {
                ...state.sheetTemplate,
                id: newDriverId,
                name: `${state.sheetTemplate.name} (Copie)`,
            };
        }

        return newState;
    }


    // ─────────────────────────────────────────────
    // IMPORT : Orchestrateur principal
    // ─────────────────────────────────────────────

    /**
     * Importe un bundle `.gmos` dans GM-OS.
     * Import EXCLUSIF : les données de la campagne cible sont remplacées.
     * Les autres campagnes ne sont pas affectées.
     *
     * @param onConflict - Callback UI appelé si un conflit est détecté.
     *                     La Promise doit être résolue avec la stratégie choisie.
     *                     Si absent, la stratégie "replace" est appliquée par défaut.
     * @returns Résultat de l'opération d'import
     */
    public async importBundle(onConflict?: OnConflictCallback): Promise<NexusImportResult> {
        // Guard : vérification du pont IPC
        if (!window.appBridge?.nexus) {
            console.warn('[NexusService] appBridge.nexus non disponible.');
            gmToast('Import Nexus non disponible hors Electron.', 'error');
            return { success: false, failedAssets: [], warnings: [], error: 'Bridge IPC non disponible.' };
        }

        try {
            // Phase 1 : Sélection du fichier
            const filePath = await window.appBridge.nexus.selectImportFile();
            if (!filePath) {
                return { success: false, failedAssets: [], warnings: [], error: i18next.t('modules:system.nexus.messages.import_cancelled') };
            }

            // Phase 2 : Lecture de l'archive par le bridge
            this.emitProgress('importing', 10, i18next.t('modules:system.nexus.messages.import_reading'));
            const raw: NexusImportRaw = await window.appBridge.nexus.importBundle(filePath);

            if (!raw.success || !raw.manifestJson || !raw.stateJson) {
                const errMsg = raw.error ?? i18next.t('modules:system.nexus.messages.archive_unreadable');
                this.emitProgress('error', 0, errMsg);
                gmToast(errMsg, 'error');
                return { success: false, failedAssets: [], warnings: [], error: errMsg };
            }

            // Phase 3 : Parsing & Validation du manifeste
            this.emitProgress('importing', 30, i18next.t('modules:system.nexus.messages.manifest_validation'));
            let manifest: NexusManifest;
            try {
                manifest = JSON.parse(raw.manifestJson) as NexusManifest;
            } catch {
                const errMsg = 'Le manifeste n\'est pas un JSON valide.';
                this.emitProgress('error', 0, errMsg);
                gmToast(errMsg, 'error');
                return { success: false, failedAssets: [], warnings: [], error: errMsg };
            }

            const validationErrors = this.validateManifest(manifest);
            if (validationErrors.length > 0) {
                const errMsg = i18next.t('modules:system.nexus.messages.invalid_archive', { errors: validationErrors.join('; ') });
                this.emitProgress('error', 0, errMsg);
                gmToast(errMsg, 'error');
                return { success: false, failedAssets: [], warnings: [], error: errMsg };
            }

            // Phase 4 : Parsing de l'état
            let campaignState: NexusCampaignState | undefined;
            let driverState: NexusDriverState | undefined;
            const isDriver = manifest.bundleType === 'driver';

            try {
                if (isDriver) {
                    driverState = JSON.parse(raw.stateJson) as NexusDriverState;
                } else {
                    campaignState = JSON.parse(raw.stateJson) as NexusCampaignState;
                }
            } catch {
                const errMsg = i18next.t('modules:system.nexus.messages.state_corrupted');
                this.emitProgress('error', 0, errMsg);
                gmToast(errMsg, 'error');
                return { success: false, failedAssets: [], warnings: [], error: errMsg };
            }

            // Phase 5 : Remappage des assets (campagnes uniquement)
            this.emitProgress('remapping', 60, i18next.t('modules:system.nexus.messages.remap_media'));
            const failedAssets: string[] = [];
            const assetMap: Record<string, string> = {};

            if (raw.assetData) {
                const mediaStore = useMediaStore.getState();
                for (const [relativePath, dataUrl] of Object.entries(raw.assetData)) {
                    if (this.isDangerousPath(relativePath)) {
                        console.warn(`[NexusService] Path dangereux ignoré : ${relativePath}`);
                        failedAssets.push(relativePath);
                        continue;
                    }

                    try {
                        const response = await fetch(dataUrl);
                        const blob = await response.blob();
                        const fileName = relativePath.split('/').pop() ?? 'asset';

                        const assetEntry = manifest.assetMap?.find(
                            (a) => a.relativePath === relativePath
                        );
                        const originalRef = assetEntry?.originalRef;

                        const campaignId = manifest.campaignId ?? (isDriver ? null : campaignState?.campaign.id);
                        const newMediaId = await mediaStore.addMedia(
                            new File([blob], fileName, { type: blob.type }),
                            ['nexus-import'],
                            campaignId ? [campaignId] : []
                        );

                        if (newMediaId && originalRef) {
                            assetMap[originalRef] = newMediaId;
                        }
                    } catch (assetErr) {
                        console.error(`[NexusService] Échec de l'import de l'asset : ${relativePath}`, assetErr);
                        failedAssets.push(relativePath);
                    }
                }
            }

            // Phase 5b : Détection et résolution des conflits
            const conflicts = this.detectConflicts(manifest, isDriver ? driverState : campaignState);
            let resolution: NexusConflictResolution = { strategy: 'replace' };

            if (conflicts.length > 0) {
                if (onConflict) {
                    // Suspendre la progression HUD le temps de l'interaction utilisateur
                    this.emitProgress('remapping', 75, i18next.t('modules:system.nexus.messages.waiting_user'));
                    resolution = await onConflict(conflicts);
                } else {
                    // Pas de callback : fallback silencieux vers "replace"
                    console.warn('[NexusService] Conflit détecté, aucun callback défini — stratégie "replace" appliquée.');
                }

                // Si stratégie 'replace' et qu'un ID de campagne est présent, on nettoie les anciennes références média
                // pour éviter de saturer le Media Hub avec des imports orphelins.
                if (resolution.strategy === 'replace' && manifest.campaignId) {
                    await useMediaStore.getState().removeCampaignReference(manifest.campaignId);
                }
            }

            // Annulation demandée par l'utilisateur
            if (resolution.strategy === 'cancel') {
                this.emitProgress('idle', 0, '');
                gmToast(i18next.t('modules:system.nexus.messages.import_cancelled'), 'info');
                return { success: false, failedAssets: [], warnings: [], error: i18next.t('modules:system.nexus.messages.import_cancelled') };
            }

            // Phrase 6 & 7 & 8 séparées par type
            if (isDriver && driverState) {
                // DRIVER IMPORT
                let finalState = driverState;
                if (resolution.strategy === 'clone') {
                    this.emitProgress('remapping', 80, 'Clonage du driver...');
                    finalState = this.applyResolutionToDriver(finalState, resolution);
                }

                this.emitProgress('injecting', 85, 'Injection dans la base de données système...');
                this.injectDriverState(finalState);

                // Fin Driver
                this.emitProgress('done', 100, i18next.t('modules:system.nexus.messages.import_success'));
                gmToast(`${i18next.t('modules:system.nexus.messages.import_success')} : ${manifest.driverName}`, 'success');

                return {
                    success: true,
                    campaignName: manifest.driverName,
                    failedAssets: [],
                    warnings: [],
                };
            } else if (campaignState) {
                // CAMPAIGN IMPORT
                // Phase 6 : Remappage des chemins dans l'état
                const remappedState = this.remapPaths(campaignState, assetMap);

                // Phrase 6 & 7 & 8 : Sync & Landing
                const finalState = resolution.strategy === 'clone'
                    ? this.applyResolutionToState(remappedState, resolution)
                    : remappedState;

                const store = useSessionOSStore.getState();
                
                // Activer le mode Sync (bloque les re-renders intempestifs)
                store.setSystemSyncing(true);

                try {
                    this.emitProgress('injecting', 85, i18next.t('modules:system.nexus.messages.injecting_campaign'));
                    this.injectState(finalState);

                    // Phase 7 : Restauration des stores audio
                    if (finalState.atmospheres && finalState.atmospheres.length > 0) {
                        useSoundStore.setState({ atmospheres: finalState.atmospheres });
                    }

                    if (finalState.playlists && finalState.playlists.length > 0) {
                        const musicState = useMusicStore.getState();
                        const existingIds = new Set(musicState.playlists.map(p => p.id));
                        const newPlaylists = finalState.playlists.filter(p => !existingIds.has(p.id));
                        const updatedPlaylists = musicState.playlists.map(p => {
                            const incoming = finalState.playlists!.find(ip => ip.id === p.id);
                            return incoming ?? p;
                        });
                        useMusicStore.setState({ playlists: [...updatedPlaylists, ...newPlaylists] });
                    }

                    // CRITIQUE : Navigation Landing Post-Import
                    console.log(`[NexusService] Finalizing import for ${finalState.campaign.id}. Landing on Cockpit.`);
                    store.setActiveCampaign(finalState.campaign.id);
                    store.setCurrentView('cockpit');

                    // Phase 8 : Succès
                    this.emitProgress('done', 100, i18next.t('modules:system.nexus.messages.import_success'));
                    gmToast(`${i18next.t('modules:system.nexus.messages.import_success')} : ${manifest.campaignName}`, 'success');

                    return {
                        success: true,
                        campaignName: manifest.campaignName,
                        failedAssets,
                        warnings: [],
                    };
                } finally {
                    // Désactiver le mode Sync
                    store.setSystemSyncing(false);
                }
            }

            return { success: false, failedAssets: [], warnings: [], error: 'Type de bundle inconnu ou état manquant.' };

        } catch (err) {
            const message = err instanceof Error ? err.message : 'Erreur inconnue';
            console.error('[NexusService] Import échoué:', err);
            this.emitProgress('error', 0, message);
            gmToast(`Import échoué : ${message}`, 'error');
            return { success: false, failedAssets: [], warnings: [], error: message };
        }
    }
}

// ─────────────────────────────────────────────
// SINGLETON EXPORT
// ─────────────────────────────────────────────

export const nexusService = NexusService.getInstance();
