import { SessionOSState } from '../modules/session/useSessionOSStore';
import { MusicState } from '../modules/music/useMusicStore';
import { CombatState } from '../modules/combat/useCombatStore';
import { LightState } from '../modules/light/useLightStore';
import { MapState } from '../modules/map/useMapStore';
import { ImageState } from '../modules/image/useImageStore';
import { SoundState } from '../modules/sound/useSoundStore';
import { AmbientState } from '../modules/ambient/useAmbientStore';
import { StoryboardState } from '../modules/storyboard/useStoryboardStore';
import { ToastState } from '../stores/useToastStore';
import { FavoriteState } from '../modules/favorite/useFavoriteStore';
import { JournalState } from '../modules/journal/useJournalStore';
import { ObsidianState } from '../modules/session/useObsidianStore';
import { TacticalAIState } from '../modules/tactical-ai/useTacticalAIStore';
import { TaxonomyState } from '../modules/tactical-ai/useTaxonomyStore';
import { VoiceState } from '../modules/voice/useVoiceStore';
import { ClockState } from '../store/useClockStore';
import { ImageBridge } from '../modules/image/types';
import { WebState } from '../modules/web/useWebStore';
// Import de type seul, à travers la frontière des projets TypeScript :
// `mcpActivity` est volontairement sans dépendance à `electron` ni à `node`,
// et c'est le contrat du canal `mcp:activity` qu'on veut partager, pas du code.
import type { EvenementMcp } from '../../electron/mcpActivity';

declare global {
    export interface DisplayInfo {
        id: string;
        bounds: {
            x: number;
            y: number;
            width: number;
            height: number;
        };
        label: string;
    }

    export interface AIDocument {
        name: string;
        path: string;
        type: 'file' | 'directory';
        children?: AIDocument[];
        extension?: string;
    }

    export interface AIProxyResponse {
        ok: boolean;
        status?: number;
        statusText?: string;
        data: unknown;
    }

    export interface MCPTool {
        name: string;
        description: string;
        inputSchema: {
            type: "object";
            properties: Record<string, unknown>;
            required?: string[];
        };
    }

    export interface MCPCallResult {
        content: string;
    }

    export interface RemoteAction {
        type: string;
        payload?: unknown; // payload can be anything depending on the type
    }

    export interface NoteEntry {
        name: string;
        path: string;
        type: 'file' | 'directory';
        children?: NoteEntry[];
    }

    export interface ClientContext {
        deviceId: string;
        pseudo: string;
        role: 'combat' | 'narrative' | 'player' | 'remote';
        status: 'active' | 'ghost' | 'disconnected';
        lastSeen: number;
    }

    export interface SyncPayload {
        clock?: Partial<ClockState>;
        combat?: Partial<CombatState>;
        music?: Partial<MusicState>;
        sound?: Partial<SoundState>;
        ambient?: Partial<AmbientState>;
        whiteboard?: unknown;
        image?: Partial<ImageState>;
        light?: Partial<LightState>;
        storyboard?: Partial<StoryboardState>;
        session?: Partial<SessionOSState>;
        voiceLevel?: number;
        clients?: ClientContext[]; // The list of active clients for the MJ to see
    }

    interface AppBridge {
        image?: ImageBridge;
        session?: {
            launchHubWindow: (tag?: string) => void;
            saveSession: (data: Record<string, unknown>) => Promise<boolean>;
            loadSession: () => Promise<Record<string, unknown> | null>;
        };
        git?: {
          getStatus: () => Promise<{ available: boolean; isRepo: boolean; branch: string; exists: boolean }>;
          setupBranch: (branch: string) => Promise<{ success: boolean; branch: string }>;
          syncData: (directory: string, branch: string, message: string) => Promise<{ success: boolean; timestamp: string; error?: string }>;
          saveData: (data: any) => Promise<{ success: boolean; error?: string }>;
        };
        openFile?: (path: string) => void;
        openExternal?: (url: string) => void;
        utils?: {
            formatFileUrl: (path: string) => string;
        };
        web?: {
            openExternal: (url: string) => void;
            saveList: (data: unknown) => Promise<boolean>;
            loadList: () => Promise<unknown>;
        };
        on: (channel: string, callback: (event: any, ...args: any[]) => void) => void;
        off: (channel: string, callback: (event: any, ...args: any[]) => void) => void;
        send: (channel: string, ...args: any[]) => void;
        remote: {
            // `port` sert à charger l'app sur la tablette (Vite en dev) ;
            // `mediaPort` est celui du proxy média, toujours le SyncServer.
            getConnectionInfo?: () => Promise<{ ip: string; port: number; mediaPort?: number; mediaEpoch?: string }>;
            sendSync?: (payload: SyncPayload) => void;
            broadcastUIAction?: (action: any) => void;
            broadcastToTablets: (type: string, payload: unknown) => void;
            getDisplays: () => Promise<DisplayInfo[]>;
            openProjectionWindow: (displayId: string, url: string) => void;
            onAction: (callback: (data: RemoteAction) => void) => () => void;
            // Ordre des arguments aligné sur preload.ts : (buffer, id).
            // La déclaration les inversait, sans conséquence jusqu'ici faute d'appelant.
            cacheMedia: (buffer: ArrayBuffer, id: string) => Promise<boolean>;
            removeActions: () => void;
        };
        relay?: {
            // Relais entre fenêtres locales par le process principal.
            // Le message est une chaîne DÉJÀ sérialisée — le relais refuse les
            // objets. Voir electron/WindowRelay.ts pour la raison mesurée.
            publish: (type: string, message: string) => void;
            // `senderRole` est estampillé par le process principal : il dit d'où
            // vient réellement le message, indépendamment de ce qu'il contient.
            onMessage: (callback: (message: string, senderRole: string) => void) => () => void;
        };
        pairing?: {
            getSecret: () => Promise<string>;
            rotate: () => Promise<string>;
        };
        highlightMapToken?: (name: string) => void;
        app?: {
            quit: () => void;
            onDisplayChanged: (callback: (count: number) => void) => () => void;
        };
        logger?: {
            info: (message: string, ...args: any[]) => void;
            warn: (message: string, ...args: any[]) => void;
            error: (message: string, ...args: any[]) => void;
            debug: (message: string, ...args: any[]) => void;
        };
        security?: {
            getSecret: (id: string) => Promise<string | null>;
            /**
             * Rend ce que l'écriture a fait, et non un `true` de politesse.
             *
             * Une valeur vide est **refusée** : l'écrire supprimait l'entrée en
             * silence, et le champ de saisie appelle à chaque frappe.
             */
            saveSecret: (id: string, value: string) => Promise<{ ecrit: boolean; ecarte?: string; raison?: string }>;
            deleteSecret: (id: string) => Promise<{ ecrit: boolean; ecarte?: string; raison?: string }>;
            /**
             * L'état du coffre et les NOMS de ses entrées — jamais les valeurs.
             *
             * Sans lui, un écran de réglages ne peut pas distinguer « aucune clé
             * n'a jamais été saisie » de « le coffre n'a pas pu être lu ». La
             * seconde phrase est celle qui évite de tout retaper — et de tout
             * perdre.
             */
            etatDuCoffre?: () => Promise<{
                etat: 'jamais-lu' | 'vide' | 'lu' | 'illisible';
                entrees: string[];
            }>;
        };
        ai?: {
            listDocs: () => Promise<AIDocument[]>;
            /** Dossiers presents sous docs/systems/. */
            listSystems?: () => Promise<string[]>;
            /** Fichiers d'un dossier de `docs/`, sans récursion. */
            listDir?: (relativePath: string) => Promise<string[]>;
            /** Supprime un document. Réservé aux brouillons de la Forge. */
            deleteDoc?: (relativePath: string) => Promise<boolean>;
            /**
             * Crée les dossiers d'un corpus et rend ceux qui l'ont réellement
             * été — un dossier déjà présent n'y figure pas. C'est ce qui permet
             * de distinguer un corpus neuf d'un corpus rejoint.
             */
            createCorpus?: (dossiers: string[]) => Promise<string[]>;
            /**
             * Résout les sections citées par une fiche en pages du livre.
             *
             * `indexDisponible: false` distingue « pas d'index pour ce système »
             * de « aucune section résolue » : le premier n'accuse pas la fiche.
             */
            resolveSections?: (systeme: string, contenuFiche: string) => Promise<{
                indexDisponible: boolean;
                sources: string[];
                resolutions: {
                    demande: string;
                    statut: 'exact' | 'approche' | 'introuvable';
                    page?: number;
                    entree?: string;
                    score: number;
                }[];
                /** Pages citées au-delà de la pagination attestée par l'index. */
                pagesDouteuses: number[];
                plage: { min: number; max: number } | null;
            }>;
            readDoc: (filePath: string) => Promise<string | null>;
            writeDoc: (filePath: string, content: string) => Promise<boolean>;
            extractPdf: (filePath: string) => Promise<string>;
            extractPDF: (filePath: string) => Promise<string>;
            proxyRequest: (url: string, method: string, headers: Record<string, string>, body: unknown) => Promise<AIProxyResponse>;
            /**
             * Contexte RAG pour la question en cours.
             * `query` est ce qui permet de trier par sujet plutôt que par ordre
             * alphabétique ; `systemPath`/`campaignPath` sont les chemins déclarés
             * sur la fiche de campagne, qui priment sur la déduction par nom.
             */
            searchContext: (
                systemId: string,
                campaignName: string,
                options?: {
                    query?: string;
                    systemName?: string;
                    systemPath?: string;
                    campaignPath?: string;
                    maxTokens?: number;
                },
                /**
                 * **Le contexte ET les fiches qui l'ont fourni.**
                 *
                 * Ne rendait qu'une chaîne : la liste des fiches retenues était
                 * calculée dans le processus principal puis jetée au dernier
                 * étage. L'écran ne pouvait donc pas dire d'où venait une
                 * réponse, ni qu'une fiche n'avait jamais été relue.
                 */
            ) => Promise<{ context: string; sources: { path: string; relu?: boolean; aRegenerer?: boolean; provenance: string }[] }>;
            reindex: (customPath?: string) => Promise<boolean>;
            /**
             * `options.json` pose `format: 'json'` côté Ollama — le décodage
             * est alors contraint par une grammaire, et la sortie ne peut plus
             * être autre chose que du JSON valide.
             */
            ollamaChat: (
                model: string,
                messages: { role: string; content: string }[],
                endpoint?: string,
                options?: { json?: boolean; schema?: Record<string, unknown>; num_ctx?: number; num_predict?: number },
                requete?: { id: string; libelle: string },
            ) => Promise<string>;
            ollamaChatStream: (
                model: string,
                messages: { role: string; content: string }[],
                endpoint?: string,
                options?: { num_ctx?: number; num_predict?: number },
                requete?: { id: string; libelle: string },
            ) => Promise<unknown>;
            /** Arrête une requête en vol. `false` si elle était déjà finie. */
            ollamaAbort?: (requeteId: string) => Promise<boolean>;
            /** Combien de requêtes tournent chez Ollama. */
            ollamaEnVol?: () => Promise<{ id: string; libelle: string; depuis: number }[]>;
            ollamaStatus: (endpoint?: string) => Promise<boolean>;
            ollamaListModels: (endpoint?: string) => Promise<string[]>;
            ollamaPull: (model: string, endpoint?: string) => Promise<boolean>;
            ollamaGenerateImage: (model: string, prompt: string, endpoint?: string, requete?: { id: string; libelle: string }) => Promise<string>;
            onStreamToken: (callback: (token: string) => void) => () => void;
        };
        sound?: {
            loadAudios: () => Promise<string[]>;
        };
        tactical?: {
            listSounds: () => Promise<string[]>;
        };
        light?: {
            request: (url: string, method: string, body?: unknown) => Promise<any>;
        };
        mcp?: {
            listTools: (serverName: string) => Promise<MCPTool[]>;
            callTool: (serverName: string, toolName: string, args: Record<string, unknown>) => Promise<MCPCallResult>;
            reauthenticate: () => Promise<{ success: boolean; message: string }>;
            restart: () => Promise<{ success: boolean; message: string }>;
            checkStatus?: (serverName: string) => Promise<boolean>;
            /** S'abonne au journal d'activité du pont. Rend la fonction de désabonnement. */
            onActivity?: (callback: (evenement: EvenementMcp) => void) => () => void;
        };
        obsidian?: {
            listNotes: (vaultPath?: string) => Promise<NoteEntry[]>;
            readNote: (relativePath: string, vaultPath?: string) => Promise<string | null>;
            writeNote: (relativePath: string, content: string, vaultPath?: string) => Promise<boolean>;
            ensureDirectory: (relativePath: string, vaultPath?: string) => Promise<boolean>;
            selectVault: () => Promise<string | null>;
        };
        /**
         * Nexus-OS : Système de packaging & portabilité (.gmos)
         * Implémenté dans le main process Electron.
         */
        nexus?: {
            /**
             * Streame un seul asset Media Hub vers le cache du main process.
             * À appeler pour chaque asset AVANT exportBundle.
             */
            registerAsset: (mediaHubId: string, dataUrl: string) => Promise<{ ok: boolean; error?: string }>;
            /** Vide le cache d'assets du main process. */
            clearAssets: () => Promise<{ ok: boolean }>;
            /**
             * Exporte une campagne dans un bundle .gmos.
             * Les Media Hub assets sont transférés via registerAsset avant cet appel.
             */
            exportBundle: (
                campaignId: string,
                outputPath: string,
                stateJson: string,
                manifestJson: string,
                assetRefs: string[]
            ) => Promise<import('../modules/system/archive/nexus.types').NexusExportResult>;
            /**
             * Importe un bundle .gmos et retourne son contenu brut.
             * @param filePath - Chemin du fichier .gmos à importer
             */
            importBundle: (filePath: string) => Promise<import('../modules/system/archive/nexus.types').NexusImportRaw>;
            /** Ouvre un sélecteur de fichier pour choisir le chemin d'export. */
            selectExportPath: (bundleType?: 'campaign' | 'driver') => Promise<string | null>;
            /** Ouvre un sélecteur de fichier pour choisir un bundle .gmos à importer. */
            selectImportFile: () => Promise<string | null>;
        };
        npc?: {
            listDatabases: (category: string) => Promise<string[]>;
            loadDatabase: (category: string, name: string) => Promise<Record<string, string[]>>;
            selectAvatar: () => Promise<string | null>;
            saveAvatar: (buffer: ArrayBuffer, fileName: string) => Promise<string | null>;
        };
        logger?: {
            info: (message: string, ...args: any[]) => void;
            warn: (message: string, ...args: any[]) => void;
            error: (message: string, ...args: any[]) => void;
            debug: (message: string, ...args: any[]) => void;
        };
    }

    interface Window {
        appBridge?: AppBridge;
        useMusicStore: { getState: () => MusicState & { applySnapshot?: (s: unknown) => void }; setState: (s: Partial<MusicState>) => void; subscribe: (cb: (s: MusicState) => void) => () => void };
        useLightStore: { getState: () => LightState & { applySnapshot?: (s: unknown) => void }; setState: (s: Partial<LightState>) => void; subscribe: (cb: (s: LightState) => void) => () => void };
        useMapStore: { getState: () => MapState & { applySnapshot?: (s: unknown) => void }; setState: (s: Partial<MapState>) => void; subscribe: (cb: (s: MapState) => void) => () => void };
        useImageStore: { getState: () => ImageState & { applySnapshot?: (s: unknown) => void }; setState: (s: Partial<ImageState>) => void; subscribe: (cb: (s: ImageState) => void) => () => void };
        useSoundStore: { getState: () => SoundState & { applySnapshot?: (s: unknown) => void }; setState: (s: Partial<SoundState>) => void; subscribe: (cb: (s: SoundState) => void) => () => void };
        useAmbientStore: { getState: () => AmbientState & { applySnapshot?: (s: unknown) => void }; setState: (s: Partial<AmbientState>) => void; subscribe: (cb: (s: AmbientState) => void) => () => void };
        useStoryboardStore: { getState: () => StoryboardState & { applySnapshot?: (s: unknown) => void }; setState: (s: Partial<StoryboardState>) => void; subscribe: (cb: (s: StoryboardState) => void) => () => void };
        useToastStore: { getState: () => ToastState & { applySnapshot?: (s: unknown) => void }; setState: (s: Partial<ToastState>) => void; subscribe: (cb: (s: ToastState) => void) => () => void };
        useSessionOSStore: { getState: () => SessionOSState & { applySnapshot?: (s: unknown) => void }; setState: (s: Partial<SessionOSState>) => void; subscribe: (cb: (s: SessionOSState) => void) => () => void };
        useCombatStore: { getState: () => CombatState & { applySnapshot?: (s: unknown) => void }; setState: (s: Partial<CombatState>) => void; subscribe: (cb: (s: CombatState) => void) => () => void };
        useClockStore: { getState: () => ClockState; setState: (s: Partial<ClockState>) => void; subscribe: (cb: (s: ClockState) => void) => () => void };
        useFavoriteStore: { getState: () => FavoriteState; setState: (s: Partial<FavoriteState>) => void; subscribe: (cb: (s: FavoriteState) => void) => () => void };
        useJournalStore: { getState: () => JournalState; setState: (s: Partial<JournalState>) => void; subscribe: (cb: (s: JournalState) => void) => () => void };
        useObsidianStore: { getState: () => ObsidianState; setState: (s: Partial<ObsidianState>) => void; subscribe: (cb: (s: ObsidianState) => void) => () => void };
        useTacticalAIStore: { getState: () => TacticalAIState; setState: (s: Partial<TacticalAIState>) => void; subscribe: (cb: (s: TacticalAIState) => void) => () => void };
        useTaxonomyStore: { getState: () => TaxonomyState; setState: (s: Partial<TaxonomyState>) => void; subscribe: (cb: (s: TaxonomyState) => void) => () => void };
        useVoiceStore: { getState: () => VoiceState; setState: (s: Partial<VoiceState>) => void; subscribe: (cb: (s: VoiceState) => void) => () => void };
        useWebStore: { getState: () => WebState; setState: (s: Partial<WebState>) => void; subscribe: (cb: (s: WebState) => void) => () => void };
        
        hueEngine?: { 
            applyScene: (id: string | null, isAutomatic?: boolean) => Promise<void>; 
            revertToManualScene: () => Promise<void>;
            extinguishAll: () => Promise<void>;
            triggerFlash: (hex: string, duration?: number, intensity?: number) => Promise<void>;
            applyTacticalState: (hex: string, name: string, intensity?: number) => Promise<void>;
            clearTacticalState: () => Promise<void>;
        };
        soundEngine?: { 
            loadAudio: (id: string, path: string) => Promise<void>;
            play: (id: string, volume?: number, onEnded?: () => void) => void;
            stop: (id: string) => void;
            stopAll: () => void;
            setVolume: (id: string, volume: number) => void;
            setMasterVolume: (volume: number) => void;
        };
        musicEngine?: {
            setMasterVolume: (v: number) => void;
            setCrossfader: (v: number) => void;
            performAutoFade: (target: 'A' | 'B', durationMs: number) => void;
            resume: () => Promise<void>;
            deckA: any;
            deckB: any;
        };
        voiceEngine?: {
            initialize: () => Promise<void>;
            stop: () => void;
            refreshAvailableDevices: () => Promise<void>;
            updateOutputDevice: (id: string) => Promise<void>;
        };
        diceEngine?: {
            roll: (sides: number) => number;
            rollFormula: (formula: string) => any;
            rollFromConfig: (config: any, options?: any) => any;
        };
        highlightMapToken?: (name: string) => void;
    }
}

export {};
