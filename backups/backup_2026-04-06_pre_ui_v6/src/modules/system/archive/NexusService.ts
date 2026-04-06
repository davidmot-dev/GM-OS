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
import { useMediaStore } from '../../../stores/useMediaStore';
import { useSoundStore } from '../../sound/useSoundStore';
import { useMusicStore } from '../../music/useMusicStore';
import { gmToast } from '../../../stores/useToastStore';
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
    NexusConflictResolution,
    OnConflictCallback,
} from './nexus.types';
import {
    NEXUS_SCHEMA_VERSION,
    DEFAULT_NEXUS_EXPORT_OPTIONS,
} from './nexus.types';
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

    private emitProgress(phase: NexusOperationPhase, progress: number, message: string): void {
        this.progressCallback?.({ phase, progress, message });
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
            throw new Error(`[NexusService] Campagne introuvable : ${campaignId}`);
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
     * Compte les URLs HTTP/HTTPS dans les données de campagne (à des fins de diagnostic).
     * Ces URLs sont intentionnellement ignorées par l'export (médias distants non-portables).
     */
    private collectHttpUrls(state: NexusCampaignState): number {
        const foundUrls: string[] = [];
        const check = (ref: string | undefined | null) => {
            if (ref && (ref.startsWith('http://') || ref.startsWith('https://'))) {
                foundUrls.push(ref);
            }
        };
        check(state.campaign.wallpaperUrl);
        state.entities.forEach(e => check(e.avatar));
        state.players.forEach(p => p.characters.forEach(c => { check(c.portraitUrl); check(c.tokenUrl); }));
        state.atlasMaps.forEach(m => check(m.fileUrl));
        state.wikiEntries.forEach(w => w.imageUrls?.forEach(url => check(url)));
        state.clues.forEach(cl => check(cl.mediaUrl));

        if (foundUrls.length > 0) {
            console.warn(`[NexusService] ${foundUrls.length} URL(s) HTTP/HTTPS détectée(s) (non-portables) :`, foundUrls);
        }

        return foundUrls.length;
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
            bundleId: `nexus-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
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
            gmToast('Export Nexus non disponible hors Electron.', 'error');
            return { success: false, missingAssets: [], error: 'Bridge IPC non disponible.' };
        }

        try {
            // Phase 1 : Scraping
            this.emitProgress('scraping', 10, 'Extraction des données de campagne...');
            const state = this.scrapeCampaignData(campaignId);

            // Phase 2 : Harvesting — collecte et séparation des refs d'assets
            this.emitProgress('harvesting', 25, 'Cartographie des dépendances médias...');
            const assetRefs = options.includeAssets
                ? this.collectAssetPaths(state)
                : new Set<string>();

            // Phase 2b : Résolution des Media Hub IDs (IDB → base64)
            const { absolutePaths, mediaHubIds } = this.splitAssetRefs(assetRefs);
            let inlineAssets: Record<string, string> = {};

            // Log diagnostic : combien de médias ont été trouvés au total ?
            const totalRefs = assetRefs.size;
            const httpCount = this.collectHttpUrls(state); // pour info uniquement
            console.log(
                `[NexusService] Harvest : ${totalRefs} ref(s) locales, ${absolutePaths.length} chemin(s) absolu(s), ${mediaHubIds.length} ID(s) Media Hub, ${httpCount} URL(s) HTTP ignorées.`
            );
            this.emitProgress(
                'harvesting', 28,
                `${totalRefs} média(s) local/MediaHub trouvé(s) — ${httpCount} URL(s) externe(s) ignorées`
            );

            if (mediaHubIds.length > 0) {
                // CRITIQUE : s'assurer que le MediaHub est initialisé avant la résolution
                const mediaStore = useMediaStore.getState();
                if (!mediaStore.isInitialized) {
                    this.emitProgress('harvesting', 29, 'Initialisation du Media Hub...');
                    await mediaStore.initDB();
                }

                this.emitProgress(
                    'harvesting', 30,
                    `Résolution de ${mediaHubIds.length} média(s) du Media Hub...`
                );
                inlineAssets = await this.resolveMediaHubAssets(
                    mediaHubIds,
                    (done, total) => {
                        const pct = 30 + Math.round((done / total) * 15); // 30→45%
                        this.emitProgress('harvesting', pct, `Médias résolus : ${done}/${total}`);
                    }
                );
                const resolvedCount = Object.keys(inlineAssets).length;
                const failedCount = mediaHubIds.length - resolvedCount;
                console.log(
                    `[NexusService] ${resolvedCount}/${mediaHubIds.length} Media Hub IDs résolus en base64.` +
                    (failedCount > 0 ? ` ${failedCount} ID(s) non-résolvables (blob absent du MediaHub).` : '')
                );
                if (failedCount > 0) {
                    this.emitProgress(
                        'harvesting', 45,
                        `⚠ ${failedCount} média(s) non trouvés dans le Media Hub (seront ignorés)`
                    );
                }
            }

            // Phase 3 : Manifest
            this.emitProgress('packaging', 50, 'Construction du manifeste...');
            const partialManifest = this.buildManifest(state, assetRefs);
            const stateJson = JSON.stringify(state);

            // Phase 4 : Sélection du chemin de sortie
            const outputPath = await window.appBridge.nexus.selectExportPath();
            if (!outputPath) {
                this.emitProgress('idle', 0, '');
                return { success: false, missingAssets: [], error: 'Export annulé par l\'utilisateur.' };
            }

            // Phase 4.5 : Streaming des assets vers le main process (un par un)
            // ⚠ Le contexte preload ne peut pas sérialiser un objet de 200MB en un seul invoke.
            // On utilise registerAsset (un asset à la fois) puis clearAssets pour nettoyer.
            if (Object.keys(inlineAssets).length > 0) {
                this.emitProgress('packaging', 55, `Transfert de ${Object.keys(inlineAssets).length} média(s) vers l'archiveur...`);
                // Vider d'abord le cache (sécurité si un export précédent a échoué)
                await window.appBridge.nexus.clearAssets();
                let streamed = 0;
                const total = Object.keys(inlineAssets).length;
                for (const [id, dataUrl] of Object.entries(inlineAssets)) {
                    await window.appBridge.nexus.registerAsset(id, dataUrl);
                    streamed++;
                    const pct = 55 + Math.round((streamed / total) * 15); // 55→70%
                    this.emitProgress('packaging', pct, `Média transféré : ${streamed}/${total}`);
                }
            }

            // Phase 5 : Appel au bridge IPC pour la compression ZIP
            this.emitProgress('packaging', 70, 'Création de l\'archive...');
            const result = await window.appBridge.nexus.exportBundle(
                campaignId,
                outputPath,
                stateJson,
                JSON.stringify(partialManifest),
                absolutePaths       // Chemins absolus → copiage direct par le main process
                // Les Media Hub IDs sont déjà dans le cache du main process via registerAsset
            );

            if (result.success) {
                this.emitProgress('done', 100, 'Export terminé avec succès !');
                gmToast(`Campagne exportée : ${state.campaign.name}.gmos`, 'success');
            } else {
                this.emitProgress('error', 0, result.error ?? 'Erreur inconnue');
                gmToast('Erreur lors de l\'export.', 'error');
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
            return ['Le manifeste n\'est pas un objet JSON valide.'];
        }

        const m = manifest as Record<string, unknown>;

        if (m.schemaVersion !== NEXUS_SCHEMA_VERSION) {
            errors.push(
                `Version de schéma incompatible : attendu ${NEXUS_SCHEMA_VERSION}, reçu ${m.schemaVersion}.`
            );
        }

        if (typeof m.campaignId !== 'string' || !m.campaignId) {
            errors.push('Le champ campaignId est manquant ou invalide.');
        }

        if (typeof m.campaignName !== 'string' || !m.campaignName) {
            errors.push('Le champ campaignName est manquant ou invalide.');
        }

        if (typeof m.exportedAt !== 'string') {
            errors.push('Le champ exportedAt est manquant ou invalide.');
        }

        // Validation des entrées d'assets (protection path traversal)
        const assetMap = m.assetMap as AssetEntry[] | undefined;
        if (assetMap) {
            assetMap.forEach((entry, idx) => {
                if (this.isDangerousPath(entry.relativePath)) {
                    errors.push(`Asset [${idx}] contient un chemin malveillant : "${entry.relativePath}"`);
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

        // Snapshot de l'état avant injection (rollback si nécessaire)
        const previousState = {
            campaigns: [...store.campaigns],
            entities: [...store.entities],
            players: [...store.players],
            sessions: [...store.sessions],
            atlasMaps: [...store.atlasMaps],
        };

        try {
            // 1. Campagne : mise à jour ou ajout
            const campaignExists = store.campaigns.some((c: Campaign) => c.id === campaignId);
            if (campaignExists) {
                store.updateCampaign(campaignId, state.campaign);
            } else {
                // Inject directement avec l'ID préservé
                useSessionOSStore.setState((s) => ({
                    campaigns: [...s.campaigns, state.campaign],
                }));
            }

            // 2. Entités : suppression des anciennes, injection des nouvelles
            // On ne touche qu'aux entités de cette campagne
            useSessionOSStore.setState((s) => ({
                entities: [
                    ...s.entities.filter((e: Entity) => e.campaignId !== campaignId),
                    ...state.entities,
                ],
            }));

            // 3. Joueurs & Personnages : fusion propre
            // On preserve les joueurs existants, on met à jour leurs personnages pour cette campagne
            useSessionOSStore.setState((s) => {
                const playersWithoutThisCampaign = s.players.map((p: Player) => ({
                    ...p,
                    characters: p.characters.filter((c) => c.campaignId !== campaignId),
                }));

                // Merge : pour les joueurs importés, leurs personnages remplacent les anciens
                const mergedPlayers = playersWithoutThisCampaign.map((existing: Player) => {
                    const imported = state.players.find((p: Player) => p.id === existing.id);
                    if (!imported) return existing;
                    return {
                        ...existing,
                        characters: [
                            ...existing.characters,
                            ...imported.characters,
                        ],
                    };
                });

                // Joueurs entièrement nouveaux (non présents dans le store actuel)
                const newPlayers = state.players.filter(
                    (p: Player) => !s.players.some((ep: Player) => ep.id === p.id)
                );

                return { players: [...mergedPlayers, ...newPlayers] };
            });

            // 4. Sessions
            useSessionOSStore.setState((s) => ({
                sessions: [
                    ...s.sessions.filter((se: GameSession) => se.campaignId !== campaignId),
                    ...state.sessions,
                ],
            }));

            // 5. Atlas Maps
            useSessionOSStore.setState((s) => ({
                atlasMaps: [
                    ...s.atlasMaps.filter((m: AtlasMap) => m.campaignId !== campaignId),
                    ...state.atlasMaps,
                ],
            }));

            // 6. Wiki, Timeline, Clues
            if (store.wikiEntries !== undefined) {
                useSessionOSStore.setState((s) => ({
                    wikiEntries: [
                        ...((s.wikiEntries ?? []).filter((w: WikiEntry) => w.campaignId !== campaignId)),
                        ...state.wikiEntries,
                    ],
                }));
            }

            if (store.timelineEvents !== undefined) {
                useSessionOSStore.setState((s) => ({
                    timelineEvents: [
                        ...((s.timelineEvents ?? []).filter((e: TimelineEvent) => e.campaignId !== campaignId)),
                        ...state.timelineEvents,
                    ],
                }));
            }

            if (store.clues !== undefined) {
                useSessionOSStore.setState((s) => ({
                    clues: [
                        ...((s.clues ?? []).filter((cl: Clue) => cl.campaignId !== campaignId)),
                        ...state.clues,
                    ],
                }));
            }

            console.log(`[NexusService] État injecté avec succès pour la campagne : ${campaignId}`);

        } catch (err) {
            // Rollback : restauration de l'état précédent
            console.error('[NexusService] Injection échouée, rollback...', err);
            useSessionOSStore.setState({
                campaigns: previousState.campaigns,
                entities: previousState.entities,
                players: previousState.players,
                sessions: previousState.sessions,
                atlasMaps: previousState.atlasMaps,
            });
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
     */
    public detectConflicts(
        manifest: NexusManifest,
        campaignState: NexusCampaignState
    ): NexusConflict[] {
        const store = useSessionOSStore.getState();
        const conflicts: NexusConflict[] = [];

        const existingCampaign = store.campaigns.find(
            (c: Campaign) => c.id === campaignState.campaign.id
        );

        if (existingCampaign) {
            conflicts.push({
                type: 'campaign',
                existingId: existingCampaign.id,
                existingName: existingCampaign.name,
                incomingName: manifest.campaignName,
                exportedAt: manifest.exportedAt,
                entityCount: manifest.stats?.entityCount ?? campaignState.entities.length,
                sessionCount: manifest.stats?.sessionCount ?? campaignState.sessions.length,
            });
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
                return { success: false, failedAssets: [], warnings: [], error: 'Import annulé.' };
            }

            // Phase 2 : Lecture de l'archive par le bridge
            this.emitProgress('importing', 10, 'Lecture de l\'archive...');
            const raw: NexusImportRaw = await window.appBridge.nexus.importBundle(filePath);

            if (!raw.success || !raw.manifestJson || !raw.stateJson) {
                const errMsg = raw.error ?? 'Archive illisible ou corrompue.';
                this.emitProgress('error', 0, errMsg);
                gmToast(errMsg, 'error');
                return { success: false, failedAssets: [], warnings: [], error: errMsg };
            }

            // Phase 3 : Parsing & Validation du manifeste
            this.emitProgress('importing', 30, 'Validation du manifeste...');
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
                const errMsg = `Archive invalide : ${validationErrors.join('; ')}`;
                this.emitProgress('error', 0, errMsg);
                gmToast(errMsg, 'error');
                return { success: false, failedAssets: [], warnings: [], error: errMsg };
            }

            // Phase 4 : Parsing de l'état
            let campaignState: NexusCampaignState;
            try {
                campaignState = JSON.parse(raw.stateJson) as NexusCampaignState;
            } catch {
                const errMsg = 'L\'état de campagne (state.json) est corrompu.';
                this.emitProgress('error', 0, errMsg);
                gmToast(errMsg, 'error');
                return { success: false, failedAssets: [], warnings: [], error: errMsg };
            }

            // Phase 5 : Remappage des assets
            this.emitProgress('remapping', 60, 'Relocalisation des médias...');
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

                        const newMediaId = await mediaStore.addMedia(
                            new File([blob], fileName, { type: blob.type })
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
            const conflicts = this.detectConflicts(manifest, campaignState);
            let resolution: NexusConflictResolution = { strategy: 'replace' };

            if (conflicts.length > 0) {
                if (onConflict) {
                    // Suspendre la progression HUD le temps de l'interaction utilisateur
                    this.emitProgress('remapping', 75, 'En attente de la décision utilisateur...');
                    resolution = await onConflict(conflicts);
                } else {
                    // Pas de callback : fallback silencieux vers "replace"
                    console.warn('[NexusService] Conflit détecté, aucun callback défini — stratégie "replace" appliquée.');
                }
            }

            // Annulation demandée par l'utilisateur
            if (resolution.strategy === 'cancel') {
                this.emitProgress('idle', 0, '');
                gmToast('Import annulé.', 'info');
                return { success: false, failedAssets: [], warnings: [], error: 'Import annulé par l\'utilisateur.' };
            }

            // Phase 6 : Remappage des chemins dans l'état
            let remappedState = this.remapPaths(campaignState, assetMap);

            // Si stratégie "clone" : régénération des UUIDs
            if (resolution.strategy === 'clone') {
                this.emitProgress('remapping', 80, 'Clonage de la campagne...');
                remappedState = this.applyResolutionToState(remappedState, resolution);
            }

            this.emitProgress('injecting', 85, 'Injection dans la base de données...');
            this.injectState(remappedState);

            // Phase 7 : Restauration des stores audio (Sound Pads + Music Playlists)
            if (remappedState.atmospheres && remappedState.atmospheres.length > 0) {
                useSoundStore.setState({ atmospheres: remappedState.atmospheres });
                console.log(`[NexusService] ${remappedState.atmospheres.length} atmosphère(s) audio restaurée(s).`);
            }

            if (remappedState.playlists && remappedState.playlists.length > 0) {
                const musicState = useMusicStore.getState();
                const existingIds = new Set(musicState.playlists.map(p => p.id));
                const newPlaylists = remappedState.playlists.filter(p => !existingIds.has(p.id));
                const updatedPlaylists = musicState.playlists.map(p => {
                    const incoming = remappedState.playlists!.find(ip => ip.id === p.id);
                    return incoming ?? p;
                });
                useMusicStore.setState({ playlists: [...updatedPlaylists, ...newPlaylists] });
                console.log(`[NexusService] ${remappedState.playlists.length} playlist(s) musicale(s) restaurée(s).`);
            }

            // Phase 8 : Succès
            this.emitProgress('done', 100, 'Import terminé !');

            const warnings: string[] = [];
            if (manifest.requiredDriverIds.length > 0) {
                warnings.push(
                    `Drivers requis : ${manifest.requiredDriverIds.join(', ')} — vérifiez qu'ils sont bien installés.`
                );
            }
            if (failedAssets.length > 0) {
                warnings.push(`${failedAssets.length} asset(s) n'ont pas pu être importés.`);
            }

            gmToast(`Campagne "${manifest.campaignName}" importée avec succès !`, 'success');

            return {
                success: true,
                campaignName: manifest.campaignName,
                failedAssets,
                warnings,
            };

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
