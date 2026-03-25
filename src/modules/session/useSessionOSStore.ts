import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { gmToast } from '../../stores/useToastStore';
import { DEFAULT_SHEET_TEMPLATES, type SheetTemplate } from '../../data/defaultSheetTemplates';
import { DEFAULT_GAME_DRIVERS } from '../../data/defaultGameDrivers';
import { hueEngine } from '../light/HueEngine';
import type { Playlist } from '../music/useMusicStore';
import type { Atmosphere } from '../sound/useSoundStore';
import type { AmbientTrackState } from '../ambient/useAmbientStore';
import type { LightScene } from '../light/useLightStore';
import { useJournalStore } from '../journal/useJournalStore';
import type { ImageMedia, ImageFolder } from '../image/types';
import type { WebLink } from '../web/types';
import type { Combatant } from '../combat/useCombatStore';
import type { GameDriver } from '../../types/drivers';
import { obsidianExportService } from './ObsidianExportService';
import { useObsidianStore } from './useObsidianStore';
import { HealthInterpreter } from './logic/HealthInterpreter';
import { useClockStore, type TensionClock } from '../../store/useClockStore';
import { useWhiteboardStore, type DrawingPath } from '../whiteboard/useWhiteboardStore';
import type { SessionSnapshot } from '../journal/types';

export interface InventoryItem {
    id: string;
    name: string;
    type: 'item' | 'currency' | 'other';
    rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
    weight: number;
    quantity: number;
    description: string;
    properties?: Record<string, unknown>;
}

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

export interface HealthSystem {
    type: string; // 'hp', 'wounds', 'clocks', 'anatomy', etc.
    data: Record<string, string | number | boolean | object | null>;
    state: 'healthy' | 'scratched' | 'wounded' | 'critical' | 'dead';
    badges: PersistenceBadge[];
}

export interface Campaign {
    id: string;
    name: string;
    system: string;
    wallpaperUrl?: string;
    activeLocationIds: string[];
    ragPath?: string;
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
    description: string;      // race/class subtitle
    roleplayingNotes: string; // how to play this NPC
    gmSecretInfo: string;     // private GM info
    linkedMapIds: string[];   // AtlasMap IDs
    campaignId: string;
    sourceRef?: string;
    templateId?: string;           // ID of the sheet template used
    sheetData?: Record<string, string | number | boolean>; // fieldId -> value
    healthSystem?: HealthSystem;   // New modular health system
}

export interface PlayerCharacter {
    id: string;
    name: string;          // "Aldric le Paladin"
    classRace: string;     // "Human / Oath of Ancients"
    portraitUrl: string;
    tokenUrl?: string;     // Small token image for Map-OS / Combat-OS
    hp: number;
    maxHp: number;
    campaignId: string | null;
    templateId: string;           // ID of the sheet template used
    sheetData: Record<string, string | number | boolean>; // fieldId -> value
    description?: string;          // Player-visible character description
    gmNotes?: string;              // GM-only secret notes
    linkedDocumentIds?: string[];  // Media Hub document IDs
    inventory?: string;            // Player's items/loot
    healthSystem?: HealthSystem;   // New modular health system
}

export interface Player {
    id: string;
    realName: string;      // "Thomas D."
    email?: string;
    avatarUrl: string;
    isOnline: boolean;
    characters: PlayerCharacter[];
}

export interface SessionChecklistItem {
    id: string;
    text: string;
    isCompleted: boolean;
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
    activeTrackId?: string; // e.g., Audio track or Encounters
    sessionEntityIds: string[]; // IDs of NPCs/monsters active in this session
    externalLink?: string;
    filePath?: string;
    sessionNotes?: string;
    moduleSnapshot?: SessionModuleSnapshot;
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
        atmospheres?: Atmosphere[]; // Snapshot of all atmospheres/pads
    };
    ambient?: {
        activeTracks: { id: string; url: string; volume: number; isPlaying: boolean }[];
        masterVolume: number;
        tracks?: AmbientTrackState[]; // Snapshot of all 8 tracks
    };
    light?: {
        activeSceneId: string | null;
        globalBrightness: number;
        scenes?: Record<string, LightScene>; // Snapshot of all 18 scenes
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

export type AtlasEntityCategory = 'npc' | 'lieu' | 'objet' | 'evenement';

export interface AtlasLinkedEntity {
    id: string;
    name: string;
    category: AtlasEntityCategory;
    favoriteId?: string;
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

export interface Campaign {
    id: string;
    name: string;
    system: string;
    description: string;
    synopsis: string;
    notes?: string; // Global campaign/scenario notes
    gmNotes?: string; // Secret GM notes
    activeSessionId?: string;
    wallpaperUrl?: string; // for Projector
    activeLocationIds: string[]; // IDs of AtlasMap entities pinned to this campaign
    notebookUrl?: string; // URL for NotebookLM integration
    systemPath?: string; // Explicit path to system rules (e.g. "systems/dune")
    campaignPath?: string; // Explicit path to campaign notes (e.g. "campaigns/dune")
}

export interface TimelineEvent {
    id: string;
    campaignId: string;
    date: string; // In-game date
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
    content: string; // Markdown
    category: 'npc' | 'location' | 'organization' | 'lore' | 'item' | 'clue' | 'rumor' | 'other';
    tags: string[];
    imageUrls: string[];
    linkedEntityIds: string[];
}

export interface SessionOSState {
    campaigns: Campaign[];
    sessions: GameSession[];
    entities: Entity[];
    players: Player[];
    atlasMaps: AtlasMap[];
    customSheetTemplates: SheetTemplate[];
    customGameDrivers: GameDriver[];
    timelineEvents: TimelineEvent[];
    wikiEntries: WikiEntry[];

    // UI State
    activeCampaignId: string | null;
    selectedSessionId: string | null;
    selectedPlayerId: string | null;
    selectedCharacterId: string | null;
    selectedAtlasMapId: string | null;
    selectedEntityId: string | null;
    editingTemplateId: string | null;
    editingDriverId: string | null;
    currentView: 'cockpit' | 'campaign-details' | 'npc-gallery' | 'world-atlas' | 'library' | 'players' | 'templates' | 'session-prep' | 'session-focus' | 'timeline-wiki' | 'forge' | 'template-editor' | 'driver-editor' | 'storyboard';
    diceRolls: { die: number, result: number, timestamp: number }[];
    isAddingEntity: boolean;
    isGeneratingAIImage: boolean; // For loading feedback

    // Actions
    setActiveCampaign: (id: string | null) => void;
    setCurrentView: (view: SessionOSState['currentView']) => void;
    setSelectedSession: (id: string | null) => void;
    setSelectedPlayer: (id: string | null) => void;
    setSelectedCharacter: (id: string | null) => void;
    setEditingTemplateId: (id: string | null) => void;
    setIsAddingEntity: (isAdding: boolean) => void;
    addSheetTemplate: (template: Omit<SheetTemplate, 'id' | 'isBuiltin'>) => void;
    updateSheetTemplate: (id: string, updates: Partial<SheetTemplate>) => void;
    deleteSheetTemplate: (id: string) => void;
    
    // Game Driver Actions (Rule Engine / "Brain")
    /** 
     * Saves or overwrites a rule engine driver. 
     * Drivers manage dice logic and AI resonance.
     */
    saveGameDriver: (driver: GameDriver) => void;
    /** Updates a specific driver's metadata or AI instructions. */
    updateGameDriver: (id: string, updates: Partial<GameDriver>) => void;
    /** Permanent deletion of a custom driver. */
    deleteGameDriver: (id: string) => void;
    /** Context management for the Driver Editor. */
    setEditingDriverId: (id: string | null) => void;
    /** 
     * Shadow Driver logic: Ensures every template has a linked editable driver.
     * If isBuiltin, creates a custom override driver for AI resonance.
     */
    getOrCreateDriverForTemplate: (templateId: string) => GameDriver;
    /** Retrieves a game driver by ID, prioritizing custom, then built-in, then generic. */
    getGameDriver: (id: string) => GameDriver | null;

    updateCharacterSheetData: (playerId: string, characterId: string, fieldId: string, value: string | number | boolean) => void;
    updateCharacterVisuals: (playerId: string, characterId: string, updates: { portraitUrl?: string; tokenUrl?: string }) => void;
    updateCharacterNarrative: (playerId: string, characterId: string, updates: { description?: string; gmNotes?: string; linkedDocumentIds?: string[]; inventory?: string }) => void;
    addCampaign: (campaign: Omit<Campaign, 'id'>) => void;
    updateCampaign: (id: string, updates: Partial<Campaign>) => void;
    deleteCampaign: (id: string) => void;
    addSession: (session: Omit<GameSession, 'id'>) => string;
    updateSession: (id: string, updates: Partial<GameSession>) => void;
    updateSessionPublicSummary: (sessionId: string, summary: string) => void;
    updateSessionGmSecrets: (sessionId: string, secrets: string) => void;
    updateSessionNotes: (sessionId: string, notes: string) => void;
    toggleChecklistItem: (sessionId: string, itemId: string) => void;
    addChecklistItem: (sessionId: string, text: string) => void;
    removeChecklistItem: (sessionId: string, itemId: string) => void;
    updateChecklistItem: (sessionId: string, itemId: string, text: string) => void;
    addPlayer: (player: Omit<Player, 'id'>) => void;
    deletePlayer: (playerId: string) => void;
    addCharacterToPlayer: (playerId: string, character: Omit<PlayerCharacter, 'id'>) => void;
    deleteCharacter: (playerId: string, characterId: string) => void;
    linkCharacterToCampaign: (playerId: string, characterId: string, campaignId: string | null) => void;
    updateCharacterHP: (playerId: string, characterId: string, hp: number) => void;
    updateCharacterHealth: (playerId: string, characterId: string, health: HealthSystem) => void;
    updateCharacter: (playerId: string, characterId: string, updates: Partial<PlayerCharacter>) => void;
    addAtlasMap: (map: Omit<AtlasMap, 'id'>) => void;
    updateAtlasMap: (id: string, updates: Partial<Omit<AtlasMap, 'id'>>) => void;
    deleteAtlasMap: (id: string) => void;
    setSelectedAtlasMap: (id: string | null) => void;
    autoSelectFirstMap: () => void;
    updateEntityHP: (entityId: string, hp: number) => void;
    updateEntityHealth: (entityId: string, health: HealthSystem) => void;
    addEntity: (entity: Omit<Entity, 'id'>) => void;
    addPersistenceBadge: (targetId: string, targetType: 'pc' | 'npc', badge: Omit<PersistenceBadge, 'id'>) => void;
    removePersistenceBadge: (targetId: string, targetType: 'pc' | 'npc', badgeId: string) => void;
    setSelectedEntity: (id: string | null) => void;
    autoSelectFirstEntity: () => void;
    updateEntity: (id: string, updates: Partial<Entity>) => void;
    updateEntitySheetData: (id: string, fieldId: string, value: string | number | boolean) => void;
    addLinkedEntity: (mapId: string, entity: Omit<AtlasLinkedEntity, 'id'>) => void;
    removeLinkedEntity: (mapId: string, entityId: string) => void;
    
    // Impact & Health System Actions
    handleApplyImpact: (targetId: string, targetType: 'pc' | 'npc', impact: DamageImpact) => void;
    
    // Session NPC Actions
    addEntityToSession: (sessionId: string, entityId: string) => void;
    removeEntityFromSession: (sessionId: string, entityId: string) => void;
    clearSessionEntities: (sessionId: string) => void;
    launchSession: (sessionId: string) => void;
    saveSystemSnapshot: (sessionId: string) => void;
    applySystemSnapshot: (snapshot: SessionModuleSnapshot) => Promise<void>;

    rollDice: (sides: number) => void;
    clearDiceRolls: () => void;
    togglePlayerOnline: (playerId: string) => void;
    addLootToCharacter: (playerId: string, characterId: string, item: string) => void;

    // AI Image Generation Actions
    generateEntityPortrait: (entityId: string, instructions?: string) => Promise<void>;
    generateAtlasMapImage: (mapId: string, instructions?: string) => Promise<void>;
    generatePlayerPortrait: (playerId: string, characterId: string, instructions?: string) => Promise<void>;
    
    // Obsidian Export
    exportActiveCampaignToObsidian: () => Promise<void>;
    // Timeline Actions
    addTimelineEvent: (event: Omit<TimelineEvent, 'id'>) => void;
    updateTimelineEvent: (id: string, updates: Partial<TimelineEvent>) => void;
    deleteTimelineEvent: (id: string) => void;

    // Wiki Actions
    addWikiEntry: (entry: Omit<WikiEntry, 'id'>) => void;
    updateWikiEntry: (id: string, updates: Partial<WikiEntry>) => void;
    deleteWikiEntry: (id: string) => void;

    /** Batch adds generated narrative content from Chronicle Forge */
    addChronicle: (data: {
      campaign: Omit<Campaign, 'id'>;
      entities: Omit<Entity, 'id' | 'campaignId'>[];
      atlasMaps: Omit<AtlasMap, 'id' | 'campaignId'>[];
      wikiEntries: Omit<WikiEntry, 'id' | 'campaignId'>[];
    }) => void;

    // Selectors
    getActiveDriver: () => GameDriver | null;
}

const mockTimelineEvents: TimelineEvent[] = [
    {
        id: 'te-1',
        campaignId: 'c-1',
        date: '14 Janvier, 1492 DR',
        title: 'Arrivée à Ironhelm',
        description: 'Le groupe arrive aux portes de la forteresse sous une brume épaisse.',
        type: 'session',
        involvedEntityIds: ['p-1', 'p-2', 'p-3'],
        locationId: 'am-1',
        sessionId: 's-1'
    },
    {
        id: 'te-2',
        campaignId: 'c-1',
        date: '15 Janvier, 1492 DR',
        title: 'L\'embuscade des Ghoules',
        description: 'Combat sanglant dans les tunnels nord contre des ghoules spectrales.',
        type: 'combat',
        involvedEntityIds: ['pc-1', 'pc-4', 'e-4'],
        locationId: 'am-1'
    }
];

const mockWikiEntries: WikiEntry[] = [
    {
        id: 'we-1',
        campaignId: 'c-1',
        title: 'La Forteresse d\'Ironhelm',
        content: '# Ironhelm\nUne pile de pierre noire bâtie par les nains du clan Ironfoot il y a trois siècles. Aujourd\'hui tenue par le Baron Varick.',
        category: 'location',
        tags: ['nain', 'forteresse', 'nord'],
        imageUrls: ['https://images.unsplash.com/photo-1518709268805-4e9042af9f23'],
        linkedEntityIds: ['am-1', 'e-1']
    },
    {
        id: 'we-2',
        campaignId: 'c-1',
        title: 'Le Culte de la Lune Pâle',
        content: 'Une mystérieuse organisation vénérant une entité lunaire oubliée. On dit qu\'ils peuvent changer de forme.',
        category: 'organization',
        tags: ['culte', 'secret', 'doppelganger'],
        imageUrls: [],
        linkedEntityIds: ['e-1']
    }
];

const mockCampaigns: Campaign[] = [
    {
        id: 'c-1',
        name: 'The Eternal Quest',
        system: 'generic',
        description: 'A dark fantasy adventure in the Underdark.',
        synopsis: 'The party is currently investigating the iron citadel.',
        activeSessionId: 's-1',
        activeLocationIds: ['am-1', 'am-2'],
        notebookUrl: 'https://notebooklm.google.com/notebook/campaign-c1-override'
    },
    {
        id: 'c-2',
        name: 'Les Ombres d\'Eldoria',
        system: 'coc7',
        description: 'Un voyage épique dans les terres d\'Eldoria.',
        synopsis: 'Le groupe enquête sur la disparition du roi d\'Eldoria.',
        activeLocationIds: ['am-3']
    }
];

const mockAtlasMaps: AtlasMap[] = [
    {
        id: 'am-1',
        name: "Forteresse d'Ironhelm",
        fileUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=1200',
        isVideo: false,
        type: 'battlemap',
        campaignId: 'c-1',
        narrativeDescription: "Une imposante forteresse de pierre noire dressée sur les hauteurs de la vallée des Ombres. Ses murs épais portent encore les cicatrices de siéges anciens, et les corbeau qui la survolent semblent éviter ses tours les plus hautes.",
        gmNotes: "Baron Varick est un doppelganger — il connaît les plans secrets des PJ. La tour nord est un passage secret vers les catacombes. Le pont-levis a un mécanisme défaillant, peut tomber prématurément.",
        linkedEntities: [
            { id: 'le-1', name: 'Baron Varick', category: 'npc' },
            { id: 'le-2', name: 'Garde Capitaine Ren', category: 'npc' },
            { id: 'le-3', name: 'Salle du Trône', category: 'lieu' },
            { id: 'le-4', name: 'Tour Nord (Passage Secret)', category: 'lieu' },
            { id: 'le-5', name: 'Siège des Orcs', category: 'evenement' }
        ]
    },
    {
        id: 'am-2',
        name: "Forêt des Murmures",
        fileUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&q=80&w=1200',
        isVideo: false,
        type: 'region',
        campaignId: 'c-1',
        narrativeDescription: "Une forêt ancienne où les arbres semblent souffler des mots oubliés quand le vent se lève. La lumière du soleil n'atteint jamais le sol.",
        gmNotes: "Les Driades ici sont hostiles depuis l'abattage de leur arbre-ancêtre. La clairière centrale est un portail vers le plan Féerique, actif seulement à la pleine lune.",
        linkedEntities: [
            { id: 'le-6', name: 'Sylvara la Driade', category: 'npc' },
            { id: 'le-7', name: 'La Clairière du Portail', category: 'lieu' },
            { id: 'le-8', name: "Pierre de l'Arbre-Ancêtre", category: 'objet' }
        ]
    },
    {
        id: 'am-3',
        name: "Caverne du Dragon Rouge",
        fileUrl: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&q=80&w=1200',
        isVideo: false,
        type: 'dungeon',
        campaignId: 'c-2',
        narrativeDescription: "Un réseau de tunnels creusés par des siècles de chaleur draconique. L'air y est irrespirable, chargé de soufre.",
        gmNotes: "Ignathor dort dans la chambre finale (DC 25 Discrétion pour ne pas le réveiller). Son trésor contient l'Orbe de Feu Primordial — artefact de campagne.",
        linkedEntities: [
            { id: 'le-9', name: 'Ignathor le Dragon Rouge', category: 'npc' },
            { id: 'le-10', name: "L'Orbe de Feu Primordial", category: 'objet' },
            { id: 'le-11', name: 'Réveil du Dragon', category: 'evenement' }
        ]
    }
];

const mockPlayers: Player[] = [
    {
        id: 'p-1',
        realName: 'Thomas D.',
        email: 't.daniels@gm-vault.com',
        avatarUrl: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Thomas&backgroundColor=b6e3f4',
        isOnline: true,
        characters: [
            {
                id: 'pc-1',
                name: 'Aldric le Paladin',
                classRace: 'Humain / Serment des Anciens',
                portraitUrl: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Aldric&backgroundColor=b6e3f4',
                hp: 42,
                maxHp: 58,
                campaignId: 'c-1',
                templateId: 'generic',
                sheetData: {},
                inventory: '',
            },
            {
                id: 'pc-2',
                name: 'Zorak l\'Assassin',
                classRace: 'Demi-Elfe / Voleur Arcanique',
                portraitUrl: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Zorak&backgroundColor=c0aede',
                hp: 35,
                maxHp: 35,
                campaignId: null,
                templateId: 'generic',
                sheetData: {},
                inventory: '',
            }
        ]
    },
    {
        id: 'p-2',
        realName: 'Marie C.',
        email: 'marie.c@players.net',
        avatarUrl: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Marie&backgroundColor=ffdfbf',
        isOnline: false,
        characters: [
            {
                id: 'pc-3',
                name: 'Elowen la Druide',
                classRace: 'Elfe / Cercle de la Lune',
                portraitUrl: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Elowen&backgroundColor=ffdfbf',
                hp: 60,
                maxHp: 60,
                campaignId: 'c-2',
                templateId: 'generic',
                sheetData: {},
                inventory: '',
            }
        ]
    },
    {
        id: 'p-3',
        realName: 'Lucas R.',
        avatarUrl: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Lucas&backgroundColor=c0aede',
        isOnline: true,
        characters: [
            {
                id: 'pc-4',
                name: 'Balder le Barbare',
                classRace: 'Nain / Voie du Berserker',
                portraitUrl: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Balder&backgroundColor=ffd5dc',
                hp: 72,
                maxHp: 90,
                campaignId: 'c-1',
                templateId: 'generic',
                sheetData: {},
                inventory: '',
            }
        ]
    }
];

const mockSessions: GameSession[] = [
    {
        id: 's-1',
        campaignId: 'c-1',
        number: 4,
        date: new Date().toISOString(),
        status: 'active',
        publicSummary: 'The party has arrived at the gates of Ironhelm Fortress. The guards seem uneasy about the heavy mist rolling in from the Forbidden Peaks.\n\nCurrently meeting with Captain Varick to discuss the recent disappearances near the old well.',
        gmSecrets: 'Captain Varick is actually a Doppelganger working for the Cult of the Pale Moon. He will try to separate the Cleric from the group.\n\nThe mist contains Spectral Ghouls.',
        checklist: [
            { id: 'item-1', text: 'Review map coordinates', isCompleted: true },
            { id: 'item-2', text: 'Audit NPC stat blocks', isCompleted: true },
            { id: 'item-3', text: 'Set atmospheric lighting', isCompleted: false },
            { id: 'item-4', text: 'Queue combat soundtrack', isCompleted: false },
        ],
        sessionEntityIds: ['e-1', 'e-4'] // Baron Varick and Captain Ren are active
    }
];

const mockEntities: Entity[] = [
    {
        id: 'e-1', name: 'Baron Varick', type: 'npc', role: 'hostile', status: 'alive',
        avatar: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Varick&backgroundColor=b6e3f4',
        hp: 85, maxHp: 85, ac: 16, speed: 30, initiative: 3,
        description: 'Doppelganger / Seigneur de Guerre',
        roleplayingNotes: 'Parle avec une autorité froide et calculée. Imite parfaitement les manières d\'un noble. Évite les confrontations directes, préfère manipuler. Voix grave, regard perçant.',
        gmSecretInfo: 'C\'est un Doppelganger — il connaît les noms et secrets de chaque PJ grâce à ses espions. Il cherche à séparer le Clerc du groupe lors du banquet. Son vrai nom est Ix\'thal.',
        linkedMapIds: ['am-1'],
        campaignId: 'c-1',
        templateId: 'generic',
        sheetData: { 'strength': 14, 'dexterity': 16 }
    },
    {
        id: 'e-2', name: 'Sylvara la Driade', type: 'npc', role: 'neutral', status: 'alive',
        avatar: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Sylvara&backgroundColor=ffdfbf',
        hp: 52, maxHp: 52, ac: 14, speed: 35, initiative: 4,
        description: 'Driade / Gardienne de la Forêt',
        roleplayingNotes: 'Méfiante envers les étrangers mais pas hostile. Parle lentement, comme si chaque mot avait du poids. Très liée à son arbre-ancêtre. Peut devenir alliée si les PJ promettent de protéger la forêt.',
        gmSecretInfo: 'Elle sait où se trouve le portail vers le plan Féerique mais refuse de le révéler sans une preuve de bonne foi (DC 18 Persuasion ou une offrande naturelle rare).',
        linkedMapIds: ['am-2'],
        campaignId: 'c-1',
        templateId: 'generic',
        sheetData: { 'wisdom': 18, 'charisma': 16 }
    },
    {
        id: 'e-3', name: 'Ignathor', type: 'monster', role: 'boss', status: 'alive',
        avatar: 'https://api.dicebear.com/9.x/bottts/svg?seed=Ignathor&backgroundColor=ffd5dc',
        hp: 256, maxHp: 256, ac: 22, speed: 40, initiative: 0,
        description: 'Dragon Rouge Ancien / Boss Final',
        roleplayingNotes: 'Arrogant, condescendant. Parle des humains comme de simples insectes. Aime les monologues. Ne se lève que si vraiment menacé — il enverra ses serviteurs en premier.',
        gmSecretInfo: 'Faiblesse secrète : l\'Orbe de Feu Primordial peut paralyser ses ailes (DC 20 Arcane pour le découvrir). Il négocie si sa horde est menacée.',
        linkedMapIds: ['am-3'],
        campaignId: 'c-2',
        templateId: 'generic',
        sheetData: { 'strength': 28, 'constitution': 24 }
    },
    {
        id: 'e-4', name: 'Capitaine Ren', type: 'npc', role: 'ally', status: 'alive',
        avatar: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Ren&backgroundColor=c0aede',
        hp: 68, maxHp: 75, ac: 18, speed: 30, initiative: 2,
        description: 'Humain / Garde d\'Élite',
        roleplayingNotes: 'Loyale, directe, professionnelle. Respecte la force et la compétence. Peut devenir une alliée précieuse si les PJ démontrent leur valeur au combat.',
        gmSecretInfo: 'Elle suspecte que Varick n\'est pas qui il prétend être — elle a remarqué des incohérences dans son comportement. Peut être recrutée si les PJ lui révèlent la vérité au bon moment.',
        linkedMapIds: ['am-1'],
        campaignId: 'c-1',
        templateId: 'generic',
        sheetData: { 'strength': 16, 'constitution': 14 }
    }
];

export const useSessionOSStore = create<SessionOSState>()(
    persist(
        (set, get) => ({
            campaigns: mockCampaigns,
            sessions: mockSessions,
            entities: mockEntities,
            players: mockPlayers,
            atlasMaps: mockAtlasMaps,
            customSheetTemplates: [],
            customGameDrivers: [],
            activeCampaignId: 'c-1',
            selectedSessionId: null,
            selectedPlayerId: 'p-1',
            selectedCharacterId: null,
            selectedAtlasMapId: 'am-1',
            selectedEntityId: 'e-1',
            editingTemplateId: null,
            editingDriverId: null,
            currentView: 'cockpit',
            diceRolls: [],
            isAddingEntity: false,
            isGeneratingAIImage: false,
            timelineEvents: mockTimelineEvents,
            wikiEntries: mockWikiEntries,

            setActiveCampaign: (id) => {
                set({ 
                    activeCampaignId: id, 
                    currentView: 'cockpit',
                    selectedSessionId: null,
                    selectedAtlasMapId: null
                });
                if (id) {
                    const campaign = get().campaigns.find(c => c.id === id);
                    useJournalStore.getState().stopJournal(); // Close previous journal if any
                    useJournalStore.getState().addEvent({
                        type: 'SYSTEM',
                        title: 'Campagne activée',
                        content: `La campagne "${campaign?.name || id}" est maintenant active.`
                    });
                }
            },

            setCurrentView: (view) => {
                set({ currentView: view });
                if (view === 'npc-gallery') {
                    get().autoSelectFirstEntity();
                } else if (view === 'world-atlas') {
                    get().autoSelectFirstMap();
                }
            },
            setSelectedSession: (id) => set({ selectedSessionId: id }),
            setSelectedPlayer: (id) => set({ selectedPlayerId: id, selectedCharacterId: null }),
            setSelectedCharacter: (id) => set({ selectedCharacterId: id }),
            setEditingTemplateId: (id) => set({ editingTemplateId: id }),
            setEditingDriverId: (id) => set({ editingDriverId: id }),
            setSelectedAtlasMap: (id) => {
                const { atlasMaps } = get();
                const map = atlasMaps.find(m => m.id === id);
                
                set({ selectedAtlasMapId: id });

                if (map) {
                    useJournalStore.getState().addEvent({
                        type: 'LOCATION',
                        title: `📍 Navigation: ${map.name}`,
                        content: map.narrativeDescription || `Le groupe se déplace vers ${map.name}.`
                    });
                }
            },

            autoSelectFirstMap: () => {
                const { atlasMaps, activeCampaignId, selectedAtlasMapId } = get();
                const campaignMaps = atlasMaps.filter(m => m.campaignId === activeCampaignId);
                
                // If current selection is not in this campaign or is null, select the first one
                const currentMap = atlasMaps.find(m => m.id === selectedAtlasMapId);
                if (!currentMap || currentMap.campaignId !== activeCampaignId) {
                    if (campaignMaps.length > 0) {
                        set({ selectedAtlasMapId: campaignMaps[0].id });
                    } else {
                        set({ selectedAtlasMapId: null });
                    }
                }
            },

            setSelectedEntity: (id) => set({ selectedEntityId: id, isAddingEntity: false }),
            
            autoSelectFirstEntity: () => {
                const { entities, activeCampaignId, selectedEntityId } = get();
                const campaignEntities = entities.filter(e => e.campaignId === activeCampaignId);
                
                // If current selection is not in this campaign or is null, select the first one
                const currentEntity = entities.find(e => e.id === selectedEntityId);
                if (!currentEntity || currentEntity.campaignId !== activeCampaignId) {
                    if (campaignEntities.length > 0) {
                        set({ selectedEntityId: campaignEntities[0].id });
                    } else {
                        set({ selectedEntityId: null });
                    }
                }
            },

            setIsAddingEntity: (isAdding) => set({ isAddingEntity: isAdding, selectedEntityId: null }),
            
            saveSystemSnapshot: (sessionId: string) => {
                try {
                    // Accessing other stores via their global accessors with unknown as bridge
                    const gWindow = window as unknown as { 
                        useMusicStore?: { getState: () => { playlists: Playlist[]; activePlaylistId: string | null; deckA: { activePadId: string | null; volume: number; isLooping: boolean; isPlaying: boolean }; deckB: { activePadId: string | null; volume: number; isLooping: boolean; isPlaying: boolean }; crossfader: number; masterVolume: number } };
                        useSoundStore?: { getState: () => { activeAtmosphereId: string | null; masterVolume: number; atmospheres: Atmosphere[] } };
                        useAmbientStore?: { getState: () => { tracks: AmbientTrackState[]; masterVolume: number } };
                        useLightStore?: { getState: () => { activeSceneId: string | null; globalBrightness: number; scenes: Record<string, LightScene> } };
                        useImageStore?: { getState: () => { projections: Record<string, string | null>; mediaList: ImageMedia[]; folders: ImageFolder[] } };
                        useWebStore?: { getState: () => { links: WebLink[] } };
                        useCombatStore?: { getState: () => { combatants: Combatant[]; currentTurnIdx: number; round: number } };
                    };

                    const musicState = gWindow.useMusicStore?.getState();
                    const soundState = gWindow.useSoundStore?.getState();
                    const ambientState = gWindow.useAmbientStore?.getState();
                    const lightState = gWindow.useLightStore?.getState();
                    const imageState = gWindow.useImageStore?.getState();
                    const webState = gWindow.useWebStore?.getState();
                    const combatState = gWindow.useCombatStore?.getState();

                    const snapshot: SessionModuleSnapshot = {
                        timestamp: Date.now(),
                        music: musicState ? {
                            activePlaylistId: musicState.activePlaylistId,
                            playlists: musicState.playlists,
                            deckA: { 
                                activePadId: musicState.deckA.activePadId, 
                                volume: musicState.deckA.volume, 
                                isLooping: musicState.deckA.isLooping, 
                                isPlaying: musicState.deckA.isPlaying 
                            },
                            deckB: { 
                                activePadId: musicState.deckB.activePadId, 
                                volume: musicState.deckB.volume, 
                                isLooping: musicState.deckB.isLooping, 
                                isPlaying: musicState.deckB.isPlaying 
                            },
                            crossfader: musicState.crossfader,
                            masterVolume: musicState.masterVolume
                        } : undefined,
                        sound: soundState ? {
                            activeAtmosphereId: soundState.activeAtmosphereId,
                            masterVolume: soundState.masterVolume,
                            activePadIds: soundState.atmospheres
                                .find(a => a.id === soundState.activeAtmosphereId)?.pads
                                ? Object.values(soundState.atmospheres.find(a => a.id === soundState.activeAtmosphereId)!.pads)
                                    .filter(p => p.isActive)
                                    .map(p => p.id)
                                : [],
                            atmospheres: soundState.atmospheres
                        } : undefined,
                        ambient: ambientState ? {
                            activeTracks: ambientState.tracks.map(t => ({
                                id: t.id,
                                url: t.url,
                                volume: t.volume,
                                isPlaying: t.isPlaying
                            })),
                            masterVolume: ambientState.masterVolume,
                            tracks: ambientState.tracks
                        } : undefined,
                        light: lightState ? {
                            activeSceneId: lightState.activeSceneId as string,
                            globalBrightness: lightState.globalBrightness as number,
                            scenes: lightState.scenes
                        } : undefined,
                         image: imageState ? {
                            projections: imageState.projections,
                            mediaList: imageState.mediaList,
                            folders: imageState.folders
                        } : undefined,
                        web: webState ? {
                            links: webState.links.map(l => l.url),
                            fullLinks: webState.links
                        } : undefined,
                        combat: combatState ? {
                            combatants: combatState.combatants,
                            currentTurnIdx: combatState.currentTurnIdx,
                            round: combatState.round
                        } : undefined
                    };

                    set(state => ({
                        sessions: state.sessions.map(s => s.id === sessionId ? { ...s, moduleSnapshot: snapshot } : s)
                    }));
                } catch (err) {
                    console.error("Failed to save system snapshot:", err);
                }
            },

            applySystemSnapshot: async (snapshot: SessionModuleSnapshot) => {
                try {
                    // Type for stores with applySnapshot
                    type SnapshotStore<T> = { getState: () => { applySnapshot?: (s: T) => void | Promise<void> } };

                    // 1. Music
                    if (snapshot.music) {
                        const musicStore = (window as unknown as { useMusicStore?: SnapshotStore<NonNullable<SessionModuleSnapshot['music']>> }).useMusicStore;
                        if (musicStore) {
                            musicStore.getState().applySnapshot?.(snapshot.music);
                        }
                    }

                    // 2. Sound
                    if (snapshot.sound) {
                        const soundStore = (window as unknown as { useSoundStore?: SnapshotStore<NonNullable<SessionModuleSnapshot['sound']>> }).useSoundStore;
                        if (soundStore) {
                            soundStore.getState().applySnapshot?.(snapshot.sound);
                        }
                    }

                    // 3. Ambient
                    if (snapshot.ambient) {
                        const ambientStore = (window as unknown as { useAmbientStore?: SnapshotStore<NonNullable<SessionModuleSnapshot['ambient']>> }).useAmbientStore;
                        if (ambientStore) {
                            ambientStore.getState().applySnapshot?.(snapshot.ambient);
                        }
                    }

                    // 4. Light
                    if (snapshot.light) {
                        const lightStore = (window as unknown as { useLightStore?: SnapshotStore<NonNullable<SessionModuleSnapshot['light']>> }).useLightStore;
                        if (lightStore) {
                            lightStore.getState().applySnapshot?.(snapshot.light);
                            // Trigger Hue Engine for the scene
                            if (snapshot.light.activeSceneId) {
                                hueEngine.applyScene(snapshot.light.activeSceneId, true);
                            }
                        }
                    }

                    // 5. Image
                    if (snapshot.image) {
                        const imageStore = (window as unknown as { useImageStore?: SnapshotStore<NonNullable<SessionModuleSnapshot['image']>> }).useImageStore;
                        if (imageStore) {
                            imageStore.getState().applySnapshot?.(snapshot.image);
                        }
                    }

                    // 6. Web
                    if (snapshot.web) {
                        const webStore = (window as unknown as { useWebStore?: SnapshotStore<NonNullable<SessionModuleSnapshot['web']>> }).useWebStore;
                        if (webStore) {
                            webStore.getState().applySnapshot?.(snapshot.web);
                        }
                    }

                    // 7. Combat
                    if (snapshot.combat) {
                        const combatStore = (window as unknown as { useCombatStore?: SnapshotStore<NonNullable<SessionModuleSnapshot['combat']>> }).useCombatStore;
                        if (combatStore) {
                            combatStore.getState().applySnapshot?.(snapshot.combat);
                        }
                    }
                    
                    gmToast("État du système restauré avec succès !", "success");
                } catch (err) {
                    console.error("Failed to apply system snapshot:", err);
                }
            },

            addSheetTemplate: (template) => set((state) => ({
                customSheetTemplates: [
                    ...state.customSheetTemplates,
                    { ...template, id: `custom-${Date.now()}` }
                ]
            })),

            updateSheetTemplate: (id, updates) => set((state) => ({
                customSheetTemplates: state.customSheetTemplates.map(t =>
                    t.id === id ? { ...t, ...updates } : t
                )
            })),

            deleteSheetTemplate: (id) => set((state) => ({
                customSheetTemplates: state.customSheetTemplates.filter(t => t.id !== id)
            })),

            saveGameDriver: (driver) => set((state) => ({
                customGameDrivers: [
                    ...state.customGameDrivers.filter(d => d.id !== driver.id),
                    driver
                ]
            })),

            updateGameDriver: (id, updates) => set((state) => ({
                customGameDrivers: state.customGameDrivers.map(d =>
                    d.id === id ? { ...d, ...updates } : d
                )
            })),

            deleteGameDriver: (id) => set((state) => ({
                customGameDrivers: state.customGameDrivers.filter(d => d.id !== id)
            })),

            getOrCreateDriverForTemplate: (templateId) => {
                const state = get();
                const existing = state.customGameDrivers.find(d => d.templateId === templateId);
                if (existing) return existing;

                // Create a default driver for this template
                const template = [...DEFAULT_SHEET_TEMPLATES, ...state.customSheetTemplates].find(t => t.id === templateId);
                const newDriver: GameDriver = {
                    id: `driver-${templateId}-${Date.now()}`,
                    name: template?.name || 'Système Inconnu',
                    author: 'User',
                    version: '1.0.0',
                    description: `Moteur de règles pour ${template?.name}`,
                    emoji: template?.emoji || '🎲',
                    templateId: templateId,
                    dice: { defaultDice: '1d20', logic: 'sum' },
                    combat: { 
                        statsToTrack: [], 
                        initiativeFormula: 'dex',
                        initiativeSort: 'desc',
                        initiativeCards: undefined
                    },
                    aiInstructions: '',
                    aiPersonas: {},
                    tactical: {
                        useTacticalAI: true,
                        ranges: {
                            contact: { label: 'Engagé (Contact)', maxUnits: 1.5, modifier: -3 },
                            courte: { label: 'Short (Courte)', maxUnits: 3.5, modifier: 0 },
                            moyenne: { label: 'Medium (Moyenne)', maxUnits: 12.5, modifier: -1 },
                            longue: { label: 'Long (Longue)', maxUnits: 50, modifier: -2 },
                            extreme: { label: 'Extreme (Extrême)', maxUnits: 200, modifier: -3 }
                        }
                    }
                };
                
                set(s => ({ customGameDrivers: [...s.customGameDrivers, newDriver] }));
                return newDriver;
            },

            updateCharacterSheetData: (playerId, characterId, fieldId, value) => set((state) => ({
                players: state.players.map(p => p.id === playerId ? {
                    ...p,
                    characters: p.characters.map(c => c.id === characterId ? {
                        ...c,
                        sheetData: { ...c.sheetData, [fieldId]: value }
                    } : c)
                } : p)
            })),

            updateCharacterVisuals: (playerId, characterId, updates) => set((state) => ({
                players: state.players.map(p => p.id === playerId ? {
                    ...p,
                    characters: p.characters.map(c => c.id === characterId ? { ...c, ...updates } : c)
                } : p)
            })),

            updateCharacterNarrative: (playerId, characterId, updates) => set((state) => ({
                players: state.players.map(p => p.id === playerId ? {
                    ...p,
                    characters: p.characters.map(c => c.id === characterId ? { ...c, ...updates } : c)
                } : p)
            })),

            addCampaign: (campaignData) => set((state) => ({
                campaigns: [...state.campaigns, { ...campaignData, id: crypto.randomUUID(), activeLocationIds: [] }]
            })),

            updateCampaign: (id, updates) => set((state) => {
                const updatedCampaigns = state.campaigns.map(c => {
                    if (c.id === id) {
                        // Auto-create/link driver if system changed
                        if (updates.system && updates.system !== c.system) {
                            const builtInDriver = DEFAULT_GAME_DRIVERS.find(d => d.id === updates.system);
                            const customDriverExists = state.customGameDrivers.some(d => d.id === updates.system);
                            
                            if (!builtInDriver && !customDriverExists) {
                                get().getOrCreateDriverForTemplate(updates.system);
                            }
                        }
                        return { ...c, ...updates };
                    }
                    return c;
                });
                return { campaigns: updatedCampaigns };
            }),

            deleteCampaign: (id) => set((state) => ({
                campaigns: state.campaigns.filter(c => c.id !== id),
                activeCampaignId: state.activeCampaignId === id ? null : state.activeCampaignId
            })),

            addSession: (sessionData) => {
                const newId = crypto.randomUUID();
                set((state) => ({
                    sessions: [...state.sessions, { ...sessionData, id: newId }]
                }));
                return newId;
            },

            updateSession: (id, updates) => set((state) => {
                const session = state.sessions.find(s => s.id === id);
                if (session && updates.status === 'done' && session.status === 'active') {
                    // Create Snapshot before stopping
                    const presentPCs = state.players
                        .filter(p => p.isOnline)
                        .flatMap(p => p.characters.filter(c => c.campaignId === session.campaignId))
                        .map(c => ({
                            name: c.name,
                            hp: c.hp,
                            maxHp: c.maxHp,
                            state: c.healthSystem?.state || 'healthy'
                        }));

                    const sessionEntities = state.entities
                        .filter(e => session.sessionEntityIds?.includes(e.id))
                        .map(e => ({
                            name: e.name,
                            hp: e.hp,
                            maxHp: e.maxHp,
                            status: e.status
                        }));

                    const pendingChecklist = session.checklist
                        .filter(item => !item.isCompleted)
                        .map(item => item.text);

                    const clocks = useClockStore.getState().tensions.map((t: TensionClock) => ({
                        name: t.name,
                        filled: t.filledSegments,
                        total: t.totalSegments
                    }));

                    const whiteboardSnapshot = (useWhiteboardStore.getState() as { paths: DrawingPath[] }).paths;

                    const snapshot: SessionSnapshot = {
                        notes: session.sessionNotes,
                        presentPCs,
                        sessionEntities,
                        pendingChecklist,
                        clocks,
                        whiteboardSnapshot
                    };

                    useJournalStore.getState().stopJournal(snapshot);
                }
                return {
                    sessions: state.sessions.map(s => s.id === id ? { ...s, ...updates } : s)
                };
            }),

            updateSessionPublicSummary: (sessionId, summary) => set((state) => ({
                sessions: state.sessions.map(s => s.id === sessionId ? { ...s, publicSummary: summary } : s)
            })),

            updateSessionNotes: (sessionId: string, notes: string) => set((state) => ({
                sessions: state.sessions.map(s => s.id === sessionId ? { ...s, sessionNotes: notes } : s)
            })),

            updateSessionGmSecrets: (sessionId, secrets) => set((state) => ({
                sessions: state.sessions.map(s => s.id === sessionId ? { ...s, gmSecrets: secrets } : s)
            })),

            toggleChecklistItem: (sessionId, itemId) => {
                const session = get().sessions.find(s => s.id === sessionId);
                const item = session?.checklist.find(i => i.id === itemId);
                const wasCompleted = item?.isCompleted;

                set((state) => ({
                    sessions: state.sessions.map(s => {
                        if (s.id === sessionId) {
                            return {
                                ...s,
                                checklist: s.checklist.map(i => i.id === itemId ? { ...i, isCompleted: !i.isCompleted } : i)
                            };
                        }
                        return s;
                    })
                }));

                // Log to journal if it was just marked as completed
                if (!wasCompleted && item) {
                    useJournalStore.getState().addEvent({
                        type: 'SYSTEM',
                        title: 'Checklist mise à jour',
                        content: `Élément complété : "${item.text}"`
                    });
                }
            },

            addChecklistItem: (sessionId, text) => set((state) => ({
                sessions: state.sessions.map(s => 
                    s.id === sessionId 
                        ? { ...s, checklist: [...s.checklist, { id: crypto.randomUUID(), text, isCompleted: false }] } 
                        : s
                )
            })),

            removeChecklistItem: (sessionId, itemId) => set((state) => ({
                sessions: state.sessions.map(s => 
                    s.id === sessionId 
                        ? { ...s, checklist: s.checklist.filter(item => item.id !== itemId) } 
                        : s
                )
            })),

            updateChecklistItem: (sessionId, itemId, text) => set((state) => ({
                sessions: state.sessions.map(s => 
                    s.id === sessionId 
                        ? { ...s, checklist: s.checklist.map(item => item.id === itemId ? { ...item, text } : item) } 
                        : s
                )
            })),

            rollDice: (sides) => {
                const result = Math.floor(Math.random() * sides) + 1;
                set(state => ({
                    diceRolls: [{ die: sides, result, timestamp: Date.now() }, ...state.diceRolls].slice(0, 10)
                }));
            },

            addLootToCharacter: (playerId, characterId, item) => {
                set(state => ({
                    players: state.players.map(p => 
                        p.id === playerId 
                            ? {
                                ...p,
                                characters: p.characters.map(c => 
                                    c.id === characterId 
                                        ? { 
                                            ...c, 
                                            inventory: (c.inventory ? c.inventory + '\n' : '') + item 
                                        } 
                                        : c
                                )
                            }
                            : p
                    )
                }));
                gmToast(`Butin ajouté à la fiche de ${item.split(':')[0]}`, "success");
            },



            generateEntityPortrait: async (entityId, instructions) => {
              const entity = get().entities.find(e => e.id === entityId);
              if (!entity) return;
              set({ isGeneratingAIImage: true });
              try {
                const { aiService } = await import('../ai/AIService');
                const cleanDesc = (entity.description || '').replace(/\n/g, ' ').substring(0, 300);
                const basePrompt = `A professional fantasy RPG character portrait of ${entity.name}. ${cleanDesc}. High quality digital art, cinematic lighting, 8k.`;
                const prompt = instructions ? instructions : basePrompt;
                
                console.log(`[useSessionOSStore] Requesting image for ${entity.name}...`);
                const mediaId = await aiService.generateImage(prompt);
                
                console.log(`[useSessionOSStore] Image received: ${mediaId.substring(0, 50)}...`);
                get().updateEntity(entityId, { avatar: mediaId });
                console.log(`[useSessionOSStore] Entity ${entityId} updated with new avatar.`);
              } catch (err) {
                console.error("AI Portrait Error:", err);
              } finally {
                set({ isGeneratingAIImage: false });
              }
            },

            generateAtlasMapImage: async (mapId, instructions) => {
              const map = get().atlasMaps.find(m => m.id === mapId);
              if (!map) return;
              set({ isGeneratingAIImage: true });
              try {
                const { aiService } = await import('../ai/AIService');
                const cleanDesc = (map.narrativeDescription || '').replace(/\n/g, ' ').substring(0, 300);
                const basePrompt = `Fantasy RPG environment art: ${map.name}. ${cleanDesc}. Cinematic, epic scale, high quality.`;
                const prompt = instructions ? instructions : basePrompt;
                const mediaId = await aiService.generateImage(prompt);
                get().updateAtlasMap(mapId, { fileUrl: mediaId, isVideo: false });
              } catch (err) {
                console.error("AI Map Error:", err);
              } finally {
                set({ isGeneratingAIImage: false });
              }
            },

            generatePlayerPortrait: async (playerId, characterId, instructions) => {
              const player = get().players.find(p => p.id === playerId);
              const char = player?.characters.find(c => c.id === characterId);
              if (!char) return;
              set({ isGeneratingAIImage: true });
              try {
                const { aiService } = await import('../ai/AIService');
                const prompt = `A heroic character portrait of ${char.name}. ${char.classRace}. Professional digital art, cinematic lighting, 8k. ${instructions ? `Additional: ${instructions}` : ''}`;
                const mediaId = await aiService.generateImage(prompt);
                get().updateCharacterVisuals(playerId, characterId, { portraitUrl: mediaId });
              } catch (err) {
                console.error("AI Player Portrait Error:", err);
              } finally {
                set({ isGeneratingAIImage: false });
              }
            },

            addPlayer: (playerData) => set((state) => ({
                players: [...state.players, { ...playerData, id: crypto.randomUUID() }]
            })),

            addCharacterToPlayer: (playerId, characterData) => set((state) => ({
                players: state.players.map(p =>
                    p.id === playerId
                        ? { ...p, characters: [...p.characters, { ...characterData, id: crypto.randomUUID() }] }
                        : p
                )
            })),

            deleteCharacter: (playerId, characterId) => set((state) => ({
                players: state.players.map(p =>
                    p.id === playerId
                        ? { ...p, characters: p.characters.filter(c => c.id !== characterId) }
                        : p
                ),
                selectedCharacterId: state.selectedCharacterId === characterId ? null : state.selectedCharacterId
            })),

            deletePlayer: (playerId) => set((state) => ({
                players: state.players.filter(p => p.id !== playerId),
                selectedPlayerId: state.selectedPlayerId === playerId ? null : state.selectedPlayerId,
                selectedCharacterId: state.players.find(p => p.id === playerId)?.characters.some(c => c.id === state.selectedCharacterId) 
                    ? null 
                    : state.selectedCharacterId
            })),

            linkCharacterToCampaign: (playerId, characterId, campaignId) => set((state) => ({
                players: state.players.map(p =>
                    p.id === playerId
                        ? { ...p, characters: p.characters.map(c => c.id === characterId ? { ...c, campaignId } : c) }
                        : p
                )
            })),

            updateCharacterHP: (playerId, characterId, hp) => set((state) => ({
                players: state.players.map(p =>
                    p.id === playerId
                        ? { ...p, characters: p.characters.map(c => c.id === characterId ? { ...c, hp: Math.max(0, Math.min(c.maxHp, hp)) } : c) }
                        : p
                )
            })),

            updateCharacterHealth: (playerId, characterId, health) => set((state) => ({
                players: state.players.map(p =>
                    p.id === playerId
                        ? { ...p, characters: p.characters.map(c => c.id === characterId ? { ...c, healthSystem: health } : c) }
                        : p
                )
            })),

            updateEntityHealth: (entityId, health) => set((state) => ({
                entities: state.entities.map(e => e.id === entityId ? { ...e, healthSystem: health } : e)
            })),

            addPersistenceBadge: (targetId, targetType, badgeData) => set((state) => {
                const badge: PersistenceBadge = { ...badgeData, id: crypto.randomUUID() };
                if (targetType === 'pc') {
                    return {
                        players: state.players.map(p => ({
                            ...p,
                            characters: p.characters.map(c => {
                                if (c.id === targetId) {
                                  const hs: HealthSystem = c.healthSystem || { 
                                    type: 'hp', 
                                    data: { current: c.hp, max: c.maxHp }, 
                                    state: 'healthy', 
                                    badges: [] 
                                  };
                                  return { ...c, healthSystem: { ...hs, badges: [...hs.badges, badge] } };
                                }
                                return c;
                            })
                        }))
                    };
                } else {
                    return {
                        entities: state.entities.map(e => {
                            if (e.id === targetId) {
                                const hs: HealthSystem = e.healthSystem || { 
                                  type: 'hp', 
                                  data: { current: e.hp, max: e.maxHp }, 
                                  state: 'healthy', 
                                  badges: [] 
                                };
                                return { ...e, healthSystem: { ...hs, badges: [...hs.badges, badge] } };
                            }
                            return e;
                        })
                    };
                }
            }),

            removePersistenceBadge: (targetId, targetType, badgeId) => set((state) => {
                if (targetType === 'pc') {
                    return {
                        players: state.players.map(p => ({
                            ...p,
                            characters: p.characters.map(c => {
                                if (c.id === targetId && c.healthSystem) {
                                    return { ...c, healthSystem: { ...c.healthSystem, badges: c.healthSystem.badges.filter(b => b.id !== badgeId) } };
                                }
                                return c;
                            })
                        }))
                    };
                } else {
                    return {
                        entities: state.entities.map(e => {
                            if (e.id === targetId && e.healthSystem) {
                                return { ...e, healthSystem: { ...e.healthSystem, badges: e.healthSystem.badges.filter(b => b.id !== badgeId) } };
                            }
                            return e;
                        })
                    };
                }
            }),

            updateCharacter: (playerId: string, characterId: string, updates) => set((state) => ({
                players: state.players.map(p =>
                    p.id === playerId
                        ? { ...p, characters: p.characters.map(c => c.id === characterId ? { ...c, ...updates } : c) }
                        : p
                )
            })),





            addAtlasMap: (mapData) => set((state) => ({
                atlasMaps: [...state.atlasMaps, { ...mapData, id: crypto.randomUUID() }]
            })),

            updateAtlasMap: (id, updates) => set((state) => ({
                atlasMaps: state.atlasMaps.map(m => m.id === id ? { ...m, ...updates } : m)
            })),

            deleteAtlasMap: (id) => set((state) => ({
                atlasMaps: state.atlasMaps.filter(m => m.id !== id),
                selectedAtlasMapId: state.selectedAtlasMapId === id ? null : state.selectedAtlasMapId
            })),

            updateEntity: (id, updates) => set((state) => {
                const sanitized = { ...updates };
                // Ensure no nulls in string fields
                if (sanitized.name === null) sanitized.name = '';
                if (sanitized.description === null) sanitized.description = '';
                if (sanitized.roleplayingNotes === null) sanitized.roleplayingNotes = '';
                if (sanitized.gmSecretInfo === null) sanitized.gmSecretInfo = '';
                
                return {
                    entities: state.entities.map(e => e.id === id ? { ...e, ...sanitized } : e)
                };
            }),

            updateEntitySheetData: (id: string, fieldId: string, value: string | number | boolean) => set(state => ({
                entities: state.entities.map(e => 
                    e.id === id 
                        ? { 
                            ...e, 
                            sheetData: { ...(e.sheetData || {}), [fieldId]: value ?? '' } 
                          } 
                        : e
                )
            })),

            updateEntityHP: (entityId, hp) => set((state) => ({
                entities: state.entities.map(e => e.id === entityId ? { ...e, hp: Math.max(0, Math.min(e.maxHp ?? 10, hp ?? 0)) } : e)
            })),

            addEntity: (entityData) => set((state) => {
                const entity = { ...entityData };
                // Sanitize
                entity.name = entity.name || '';
                entity.description = entity.description || '';
                entity.roleplayingNotes = entity.roleplayingNotes || '';
                entity.gmSecretInfo = entity.gmSecretInfo || '';
                entity.hp = entity.hp ?? 10;
                entity.maxHp = entity.maxHp ?? 10;
                entity.ac = entity.ac ?? 10;
                entity.speed = entity.speed ?? 30;
                entity.initiative = entity.initiative ?? 0;

                return {
                    entities: [...state.entities, { ...entity, id: crypto.randomUUID() }]
                };
            }),


            addLinkedEntity: (mapId, entityData) => set((state) => ({
                atlasMaps: state.atlasMaps.map(m =>
                    m.id === mapId
                        ? { ...m, linkedEntities: [...m.linkedEntities, { ...entityData, id: crypto.randomUUID() }] }
                        : m
                )
            })),

            removeLinkedEntity: (mapId, entityId) => set((state) => ({
                atlasMaps: state.atlasMaps.map(m =>
                    m.id === mapId
                        ? { ...m, linkedEntities: m.linkedEntities.filter(e => e.id !== entityId) }
                        : m
                )
            })),

            handleApplyImpact: (targetId, targetType, impact) => set((state) => {
                if (targetType === 'pc') {
                    return {
                        players: state.players.map(p => ({
                            ...p,
                            characters: p.characters.map(c => {
                                if (c.id === targetId) {
                                    const currentHS = c.healthSystem || HealthInterpreter.createDefault('hp');
                                    // Special case for HP: sync c.hp if system is hp
                                    if (currentHS.type === 'hp') {
                                        currentHS.data.current = c.hp;
                                        currentHS.data.max = c.maxHp;
                                    }
                                    const nextHS = HealthInterpreter.calculateNextState(currentHS, impact);
                                    
                                    const updates: Partial<PlayerCharacter> = { healthSystem: nextHS };
                                    if (nextHS.type === 'hp') {
                                        updates.hp = nextHS.data.current as number;
                                    }
                                    return { ...c, ...updates };
                                }
                                return c;
                            })
                        }))
                    };
                } else {
                    return {
                        entities: state.entities.map(e => {
                            if (e.id === targetId) {
                                const currentHS = e.healthSystem || HealthInterpreter.createDefault('hp');
                                if (currentHS.type === 'hp') {
                                    currentHS.data.current = e.hp;
                                    currentHS.data.max = e.maxHp;
                                }
                                const nextHS = HealthInterpreter.calculateNextState(currentHS, impact);
                                
                                const updates: Partial<Entity> = { healthSystem: nextHS };
                                if (nextHS.type === 'hp') {
                                    updates.hp = nextHS.data.current as number;
                                }
                                return { ...e, ...updates };
                            }
                            return e;
                        })
                    };
                }
            }),

            addEntityToSession: (sessionId, entityId) => set((state) => ({
                sessions: state.sessions.map(s => 
                    s.id === sessionId 
                        ? { ...s, sessionEntityIds: [...new Set([...(s.sessionEntityIds || []), entityId])] } 
                        : s
                )
            })),

            removeEntityFromSession: (sessionId, entityId) => set((state) => ({
                sessions: state.sessions.map(s => 
                    s.id === sessionId 
                        ? { ...s, sessionEntityIds: (s.sessionEntityIds || []).filter(id => id !== entityId) } 
                        : s
                )
            })),

            clearSessionEntities: (sessionId) => set((state) => ({
                sessions: state.sessions.map(s => 
                    s.id === sessionId ? { ...s, sessionEntityIds: [] } : s
                )
            })),

            clearDiceRolls: () => set({ diceRolls: [] }),

            togglePlayerOnline: (playerId) => set((state) => ({
                players: state.players.map(p =>
                    p.id === playerId ? { ...p, isOnline: !p.isOnline } : p
                )
            })),

            launchSession: (sessionId) => set((state) => {
                const session = state.sessions.find(s => s.id === sessionId);
                if (!session) return state;

                // Auto-apply snapshot if it exists
                if (session.moduleSnapshot) {
                    console.log("[useSessionOSStore] Auto-restoring snapshot for session:", session.id);
                    state.applySystemSnapshot(session.moduleSnapshot);
                }

                // Activate Journal Recording & Start new Journal entry
                const campaignLabel = state.campaigns.find(c => c.id === session.campaignId)?.name || 'Campagne';
                const presentPlayers = state.players.filter(p => p.isOnline).map(p => p.realName);
                
                useJournalStore.getState().startJournal(
                    campaignLabel, 
                    `Session #${session.number}`,
                    {
                        presentPlayers,
                        publicSummary: session.publicSummary
                    }
                );

                return {
                    sessions: state.sessions.map(s => {
                        if (s.campaignId === session.campaignId) {
                            const isStopping = s.status === 'active' && s.id !== sessionId;
                            if (isStopping) {
                                useJournalStore.getState().stopJournal();
                            }
                            return { ...s, status: s.id === sessionId ? 'active' : (s.status === 'active' ? 'done' : s.status) };
                        }
                        return s;
                    }),
                    campaigns: state.campaigns.map(c => 
                        c.id === session.campaignId ? { ...c, activeSessionId: sessionId } : c
                    ),
                    selectedSessionId: sessionId,
                    currentView: 'cockpit'
                };
            }),

            addTimelineEvent: (event) => set((state) => ({
                timelineEvents: [...state.timelineEvents, { ...event, id: crypto.randomUUID() }]
            })),

            updateTimelineEvent: (id, updates) => set((state) => ({
                timelineEvents: state.timelineEvents.map(e => e.id === id ? { ...e, ...updates } : e)
            })),

            deleteTimelineEvent: (id) => set((state) => ({
                timelineEvents: state.timelineEvents.filter(e => e.id !== id)
            })),

            addWikiEntry: (entry) => set((state) => ({
                wikiEntries: [...state.wikiEntries, { ...entry, id: crypto.randomUUID() }]
            })),

            updateWikiEntry: (id, updates) => set((state) => ({
                wikiEntries: state.wikiEntries.map(e => e.id === id ? { ...e, ...updates } : e)
            })),

            deleteWikiEntry: (id) => set((state) => ({
                wikiEntries: state.wikiEntries.filter(e => e.id !== id)
            })),

            addChronicle: ({ campaign, entities, atlasMaps, wikiEntries }) => set((state) => {
                const campaignId = crypto.randomUUID();
                const newCampaign: Campaign = { ...campaign, id: campaignId };
                
                const newEntities: Entity[] = entities.map(e => ({
                  ...e,
                  id: crypto.randomUUID(),
                  campaignId
                }));
                
                const newMaps: AtlasMap[] = atlasMaps.map(m => ({
                  ...m,
                  id: crypto.randomUUID(),
                  campaignId
                }));
                
                const newWikiEntries: WikiEntry[] = wikiEntries.map(w => ({
                  ...w,
                  id: crypto.randomUUID(),
                  campaignId
                }));

                const activeLocationIds = newMaps.map(m => m.id);
                newCampaign.activeLocationIds = activeLocationIds;

                return {
                  campaigns: [...state.campaigns, newCampaign],
                  entities: [...state.entities, ...newEntities],
                  atlasMaps: [...state.atlasMaps, ...newMaps],
                  wikiEntries: [...state.wikiEntries, ...newWikiEntries],
                  activeCampaignId: campaignId,
                  currentView: 'cockpit'
                };
            }),

            getGameDriver: (id) => {
                const state = get();
                // 1. Try exact ID match (built-in or custom)
                let driver = DEFAULT_GAME_DRIVERS.find(d => d.id === id) || 
                             state.customGameDrivers.find(d => d.id === id);
                
                // 2. If not found by ID, maybe 'id' provided was actually a templateId
                if (!driver) {
                    driver = state.customGameDrivers.find(d => d.templateId === id);
                }

                // 3. Last resort: generic fallback
                return driver || DEFAULT_GAME_DRIVERS.find(d => d.id === 'generic') || null;
            },

            getActiveDriver: () => {
                const state = get();
                const campaign = state.campaigns.find((c: Campaign) => c.id === state.activeCampaignId);
                if (!campaign) return null;
                return state.getGameDriver(campaign.system);
            },

            exportActiveCampaignToObsidian: async () => {
                const state = get();
                const activeCampaign = state.campaigns.find(c => c.id === state.activeCampaignId);
                
                if (!activeCampaign) {
                    gmToast("Aucune campagne active à exporter.", "error");
                    return;
                }

                const entities = state.entities.filter(e => e.campaignId === activeCampaign.id);
                const locations = state.atlasMaps.filter(m => m.campaignId === activeCampaign.id);
                const lore = state.wikiEntries.filter(w => w.campaignId === activeCampaign.id);
                
                // Get vault path from Obsidian store if possible
                const vaultPath = useObsidianStore.getState().vaultPath;

                gmToast("Exportation vers Obsidian en cours...", "info");
                
                const result = await obsidianExportService.exportCampaign(
                    activeCampaign,
                    entities,
                    locations,
                    lore,
                    vaultPath
                );

                if (result.success) {
                    gmToast(result.message, "success");
                } else {
                    gmToast(result.message, "error");
                }
            }

        }),
        {
            name: 'gmos-session-os-storage',
            onRehydrateStorage: () => (state) => {
                if (state) {
                    // Sanitize stale blob URLs from persistent storage
                    (state.atlasMaps || []).forEach(m => {
                        if (m.fileUrl?.startsWith('blob:')) m.fileUrl = '';
                    });
                    (state.campaigns || []).forEach(c => {
                        if (c.wallpaperUrl?.startsWith('blob:')) c.wallpaperUrl = '';
                    });
                }
            },
            partialize: (state) => ({
                activeCampaignId: state.activeCampaignId,
                campaigns: state.campaigns,
                atlasMaps: state.atlasMaps,
                players: state.players,
                entities: state.entities,
                customSheetTemplates: state.customSheetTemplates,
                customGameDrivers: state.customGameDrivers,
                sessions: state.sessions,
                timelineEvents: state.timelineEvents,
                wikiEntries: state.wikiEntries
            })
        }
    )
);

// Export for cross-store access
if (typeof window !== 'undefined') {
    (window as unknown as Record<string, unknown>).useSessionOSStore = useSessionOSStore;
}
