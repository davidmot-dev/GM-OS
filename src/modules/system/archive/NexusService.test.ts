/**
 * Nexus-OS — Tests Unitaires
 *
 * Protocole de test "High-Reliability" conforme au blueprint (section 5).
 * Couvre : scraper, collectAssetPaths, validateManifest, remapPaths, isDangerousPath.
 *
 * @see docs/blueprints/nexus_os_specification.md — Section 5
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NexusService } from './NexusService';
import { NEXUS_SCHEMA_VERSION } from './nexus.types';
import type { NexusCampaignState, NexusManifest } from './nexus.types';
import type { Campaign, Entity, Player, GameSession, AtlasMap, WikiEntry, Clue } from '../../session/store/types';

// ─────────────────────────────────────────────
// MOCKS
// ─────────────────────────────────────────────

// Mock du store SessionOS (lecture seule dans NexusService)
vi.mock('../../session/useSessionOSStore', () => ({
    useSessionOSStore: {
        getState: vi.fn(),
        setState: vi.fn(),
    },
}));

// Mock du MediaStore
vi.mock('../../../stores/useMediaStore', () => ({
    useMediaStore: {
        getState: vi.fn(() => ({
            addMedia: vi.fn().mockResolvedValue('m-new-imported-id'),
            initDB: vi.fn().mockResolvedValue(undefined),
            mediaList: [],
        })),
    },
}));

// Mock du ToastStore
vi.mock('../../../stores/useToastStore', () => ({
    gmToast: vi.fn(),
}));

// ─────────────────────────────────────────────
// FIXTURES
// ─────────────────────────────────────────────

const CAMPAIGN_ID = 'c-test-001';

const mockCampaign: Campaign = {
    id: CAMPAIGN_ID,
    name: 'Torg Eternity — La Tempête',
    system: 'torg',
    description: 'Une campagne épique',
    wallpaperUrl: 'm-wallpaper-001',
    activeLocationIds: ['am-map-001'],
    nodePositions: {},
    isGraphLocked: false,
};

const mockEntity: Entity = {
    id: 'e-001',
    name: 'Dr. Mobius',
    type: 'npc',
    role: 'boss',
    status: 'alive',
    avatar: 'm-avatar-001',
    hp: 100,
    maxHp: 100,
    ac: 15,
    speed: 30,
    initiative: 5,
    description: 'Le grand vilain',
    roleplayingNotes: '',
    gmSecretInfo: 'Il est son propre père',
    linkedMapIds: [],
    campaignId: CAMPAIGN_ID,
    templateId: 'tpl-torg',
};

const mockEntityOtherCampaign: Entity = {
    ...mockEntity,
    id: 'e-002',
    name: 'Cosm Stranger',
    campaignId: 'c-other',
    avatar: 'm-avatar-999',
};

const mockPlayer: Player = {
    id: 'p-001',
    realName: 'David',
    isOnline: true,
    avatarUrl: '',
    characters: [
        {
            id: 'pc-001',
            name: 'Raven McCaw',
            classRace: 'Élu / Ithilien',
            portraitUrl: 'm-portrait-001',
            tokenUrl: 'm-token-001',
            hp: 80,
            maxHp: 80,
            campaignId: CAMPAIGN_ID,
            templateId: 'tpl-torg',
            sheetData: {},
        },
        {
            id: 'pc-other',
            name: 'Autre Perso',
            classRace: 'Autre',
            portraitUrl: 'm-portrait-999',
            tokenUrl: undefined,
            hp: 50,
            maxHp: 50,
            campaignId: 'c-other',
            templateId: 'tpl-generic',
            sheetData: {},
        },
    ],
};

const mockSession: GameSession = {
    id: 's-001',
    campaignId: CAMPAIGN_ID,
    number: 1,
    date: '2026-04-01',
    status: 'done',
    publicSummary: 'La première session',
    gmSecrets: 'Secrets du MJ',
    checklist: [],
    sessionEntityIds: ['e-001'],
};

const mockAtlasMap: AtlasMap = {
    id: 'am-map-001',
    name: 'Donjon Principal',
    fileUrl: 'm-map-file-001',
    isVideo: false,
    type: 'dungeon',
    narrativeDescription: 'Un donjon sombre',
    gmNotes: '',
    linkedEntities: [],
    campaignId: CAMPAIGN_ID,
};

const mockWikiEntry: WikiEntry = {
    id: 'w-001',
    campaignId: CAMPAIGN_ID,
    title: 'La Maison des Tempêtes',
    content: 'Description du lieu...',
    category: 'location',
    tags: ['donjon', 'principal'],
    imageUrls: ['m-wiki-img-001', 'm-wiki-img-002'],
    linkedEntityIds: ['e-001'],
};

const mockClue: Clue = {
    id: 'cl-001',
    campaignId: CAMPAIGN_ID,
    title: 'La Clé Dorée',
    content: 'Une clé étrange trouvée...',
    mediaUrl: 'm-clue-img-001',
    isRevealed: false,
};

const mockStoreState = {
    campaigns: [mockCampaign, { id: 'c-other', name: 'Autre', system: 'generic', activeLocationIds: [] }],
    entities: [mockEntity, mockEntityOtherCampaign],
    players: [mockPlayer],
    sessions: [mockSession, { ...mockSession, id: 's-other', campaignId: 'c-other' }],
    atlasMaps: [mockAtlasMap],
    wikiEntries: [mockWikiEntry],
    timelineEvents: [],
    clues: [mockClue],
    decks: [],
    deckStates: {},
    customGameDrivers: [],
    customSheetTemplates: [],
    updateCampaign: vi.fn(),
};

// ─────────────────────────────────────────────
// SETUP
// ─────────────────────────────────────────────

let service: NexusService;

beforeEach(async () => {
    vi.clearAllMocks();
    service = NexusService.getInstance();

    // Mock du store
    const { useSessionOSStore } = await import('../../session/useSessionOSStore');
    vi.mocked(useSessionOSStore.getState).mockReturnValue(mockStoreState as never);
});

// ─────────────────────────────────────────────
// T1 : scrapeCampaignData — Isolation des données
// ─────────────────────────────────────────────

describe('scrapeCampaignData', () => {
    it('extrait uniquement la campagne cible', () => {
        const result = service.scrapeCampaignData(CAMPAIGN_ID);
        expect(result.campaign.id).toBe(CAMPAIGN_ID);
        expect(result.campaign.name).toBe('Torg Eternity — La Tempête');
    });

    it('filtre les entités par campaignId', () => {
        const result = service.scrapeCampaignData(CAMPAIGN_ID);
        expect(result.entities).toHaveLength(1);
        expect(result.entities[0].id).toBe('e-001');
        // S'assure que l'entité de l'autre campagne n'est pas incluse
        expect(result.entities.find((e) => e.campaignId !== CAMPAIGN_ID)).toBeUndefined();
    });

    it('filtre les personnages joueurs par campaignId', () => {
        const result = service.scrapeCampaignData(CAMPAIGN_ID);
        // Le joueur doit avoir uniquement le personnage de la bonne campagne
        expect(result.players).toHaveLength(1);
        expect(result.players[0].characters).toHaveLength(1);
        expect(result.players[0].characters[0].id).toBe('pc-001');
    });

    it('filtre les sessions par campaignId', () => {
        const result = service.scrapeCampaignData(CAMPAIGN_ID);
        expect(result.sessions).toHaveLength(1);
        expect(result.sessions[0].id).toBe('s-001');
    });

    it('filtre les cartes atlas par campaignId', () => {
        const result = service.scrapeCampaignData(CAMPAIGN_ID);
        expect(result.atlasMaps).toHaveLength(1);
        expect(result.atlasMaps[0].fileUrl).toBe('m-map-file-001');
    });

    it('lève une erreur si la campagne est introuvable', () => {
        expect(() => service.scrapeCampaignData('c-inexistant')).toThrow(
            '[NexusService] Campagne introuvable : c-inexistant'
        );
    });

    it('inclut les indices (clues) de la campagne', () => {
        const result = service.scrapeCampaignData(CAMPAIGN_ID);
        expect(result.clues).toHaveLength(1);
        expect(result.clues[0].mediaUrl).toBe('m-clue-img-001');
    });
});

// ─────────────────────────────────────────────
// T2 : collectAssetPaths — Moissonnage global
// ─────────────────────────────────────────────

describe('collectAssetPaths', () => {
    it('collecte le wallpaper de la campagne', () => {
        const state = service.scrapeCampaignData(CAMPAIGN_ID);
        const assets = service.collectAssetPaths(state);
        expect(assets.has('m-wallpaper-001')).toBe(true);
    });

    it('collecte l\'avatar des entités', () => {
        const state = service.scrapeCampaignData(CAMPAIGN_ID);
        const assets = service.collectAssetPaths(state);
        expect(assets.has('m-avatar-001')).toBe(true);
        // L'avatar de l'entité de l'autre campagne NE doit PAS être inclus
        expect(assets.has('m-avatar-999')).toBe(false);
    });

    it('collecte les portraits et tokens des personnages joueurs', () => {
        const state = service.scrapeCampaignData(CAMPAIGN_ID);
        const assets = service.collectAssetPaths(state);
        expect(assets.has('m-portrait-001')).toBe(true);
        expect(assets.has('m-token-001')).toBe(true);
        // PJ d'une autre campagne ne doit pas être inclus
        expect(assets.has('m-portrait-999')).toBe(false);
    });

    it('collecte les fichiers de carte (atlas)', () => {
        const state = service.scrapeCampaignData(CAMPAIGN_ID);
        const assets = service.collectAssetPaths(state);
        expect(assets.has('m-map-file-001')).toBe(true);
    });

    it('collecte plusieurs images wiki', () => {
        const state = service.scrapeCampaignData(CAMPAIGN_ID);
        const assets = service.collectAssetPaths(state);
        expect(assets.has('m-wiki-img-001')).toBe(true);
        expect(assets.has('m-wiki-img-002')).toBe(true);
    });

    it('collecte les médias des indices (clues)', () => {
        const state = service.scrapeCampaignData(CAMPAIGN_ID);
        const assets = service.collectAssetPaths(state);
        expect(assets.has('m-clue-img-001')).toBe(true);
    });

    it('ignore les URLs HTTP distantes', () => {
        const stateWithHttpUrl: NexusCampaignState = {
            ...service.scrapeCampaignData(CAMPAIGN_ID),
            campaign: {
                ...mockCampaign,
                wallpaperUrl: 'https://external.cdn.com/image.png',
            },
        };
        const assets = service.collectAssetPaths(stateWithHttpUrl);
        expect(assets.has('https://external.cdn.com/image.png')).toBe(false);
    });

    it('ignore les blob URLs', () => {
        const stateWithBlob: NexusCampaignState = {
            ...service.scrapeCampaignData(CAMPAIGN_ID),
            campaign: {
                ...mockCampaign,
                wallpaperUrl: 'blob:http://localhost/some-blob-id',
            },
        };
        const assets = service.collectAssetPaths(stateWithBlob);
        expect(assets.has('blob:http://localhost/some-blob-id')).toBe(false);
    });
});

// ─────────────────────────────────────────────
// T4 : validateManifest — Sécurité & Intégrité
// ─────────────────────────────────────────────

describe('validateManifest', () => {
    const validManifest: NexusManifest = {
        schemaVersion: NEXUS_SCHEMA_VERSION,
        bundleId: 'nexus-test-001',
        campaignId: CAMPAIGN_ID,
        campaignName: 'Test Campaign',
        exportedAt: new Date().toISOString(),
        gmosVersion: '5.3.0',
        requiredDriverIds: ['torg'],
        requiredTemplateIds: [],
        assetMap: [
            {
                originalRef: 'm-wallpaper-001',
                relativePath: 'assets/profiles/wallpaper.png',
                checksum: 'sha256-abc123',
                sizeBytes: 1024,
                mimeType: 'image/png',
            },
        ],
        stats: {
            entityCount: 1,
            sessionCount: 1,
            atlasMapCount: 1,
            wikiEntryCount: 0,
            clueCount: 0,
            assetCount: 1,
            totalSizeBytes: 1024,
        },
    };

    it('valide un manifeste correct sans erreur', () => {
        const errors = service.validateManifest(validManifest);
        expect(errors).toHaveLength(0);
    });

    it('rejette un non-objet', () => {
        const errors = service.validateManifest('not an object');
        expect(errors.length).toBeGreaterThan(0);
    });

    it('rejette un manifeste avec une mauvaise version de schéma', () => {
        const invalidManifest = { ...validManifest, schemaVersion: 99 };
        const errors = service.validateManifest(invalidManifest);
        expect(errors.some((e) => e.includes('schéma incompatible'))).toBe(true);
    });

    it('rejette un manifeste sans campaignId', () => {
        // Destructuring intentionnel : on teste ce qui se passe sans campaignId
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { campaignId: _campaignId, ...withoutId } = validManifest;
        const errors = service.validateManifest(withoutId);
        expect(errors.some((e) => e.includes('campaignId'))).toBe(true);
    });

    it('détecte les chemins d\'assets malveillants (path traversal)', () => {
        const maliciousManifest = {
            ...validManifest,
            assetMap: [
                {
                    originalRef: 'm-test',
                    relativePath: '../../etc/passwd',  // ATTAQUE
                    checksum: 'sha256-xxx',
                    sizeBytes: 100,
                    mimeType: 'text/plain',
                },
            ],
        };
        const errors = service.validateManifest(maliciousManifest);
        expect(errors.some((e) => e.includes('malveillant'))).toBe(true);
    });
});

// ─────────────────────────────────────────────
// T4 (suite) : isDangerousPath — Sanitisation
// ─────────────────────────────────────────────

describe('isDangerousPath', () => {
    it('accepte les chemins relatifs sûrs dans assets/', () => {
        expect(service.isDangerousPath('assets/profiles/avatar.png')).toBe(false);
        expect(service.isDangerousPath('assets/maps/map.jpg')).toBe(false);
        expect(service.isDangerousPath('assets/decks/torg/tarot')).toBe(false);
    });

    it('rejette les path traversal avec ../', () => {
        expect(service.isDangerousPath('../etc/passwd')).toBe(true);
        expect(service.isDangerousPath('../../windows/system32')).toBe(true);
    });

    it('rejette les path traversal avec ..\\', () => {
        expect(service.isDangerousPath('..\\etc\\passwd')).toBe(true);
    });

    it('rejette les chemins absolus Windows', () => {
        expect(service.isDangerousPath('C:/Users/admin/secret.txt')).toBe(true);
    });

    it('rejette les chaînes vides ou nulles', () => {
        expect(service.isDangerousPath('')).toBe(true);
        expect(service.isDangerousPath(null as unknown as string)).toBe(true);
    });
});

// ─────────────────────────────────────────────
// T3 : remapPaths — Round-trip de relocalisation
// ─────────────────────────────────────────────

describe('remapPaths', () => {
    it('remappe le wallpaper de la campagne', () => {
        const state = service.scrapeCampaignData(CAMPAIGN_ID);
        const assetMap = { 'm-wallpaper-001': '/local/media/wallpaper.png' };
        const remapped = service.remapPaths(state, assetMap);
        expect(remapped.campaign.wallpaperUrl).toBe('/local/media/wallpaper.png');
    });

    it('remappe les avatars des entités', () => {
        const state = service.scrapeCampaignData(CAMPAIGN_ID);
        const assetMap = { 'm-avatar-001': '/local/media/avatar.png' };
        const remapped = service.remapPaths(state, assetMap);
        expect(remapped.entities[0].avatar).toBe('/local/media/avatar.png');
    });

    it('remappe les portraits et tokens des personnages', () => {
        const state = service.scrapeCampaignData(CAMPAIGN_ID);
        const assetMap = {
            'm-portrait-001': '/local/media/portrait.png',
            'm-token-001': '/local/media/token.png',
        };
        const remapped = service.remapPaths(state, assetMap);
        const char = remapped.players[0].characters[0];
        expect(char.portraitUrl).toBe('/local/media/portrait.png');
        expect(char.tokenUrl).toBe('/local/media/token.png');
    });

    it('préserve les refs non-mappées (fichiers non trouvés)', () => {
        const state = service.scrapeCampaignData(CAMPAIGN_ID);
        const assetMap = {}; // Aucune correspondance
        const remapped = service.remapPaths(state, assetMap);
        // Les refs originales sont conservées (pas de perte de données)
        expect(remapped.campaign.wallpaperUrl).toBe('m-wallpaper-001');
        expect(remapped.entities[0].avatar).toBe('m-avatar-001');
    });

    it('remappe les images wiki', () => {
        const state = service.scrapeCampaignData(CAMPAIGN_ID);
        const assetMap = {
            'm-wiki-img-001': '/local/wiki1.png',
            'm-wiki-img-002': '/local/wiki2.png',
        };
        const remapped = service.remapPaths(state, assetMap);
        expect(remapped.wikiEntries[0].imageUrls).toEqual(['/local/wiki1.png', '/local/wiki2.png']);
    });

    it('remappe les médias des indices (clues)', () => {
        const state = service.scrapeCampaignData(CAMPAIGN_ID);
        const assetMap = { 'm-clue-img-001': '/local/clue.png' };
        const remapped = service.remapPaths(state, assetMap);
        expect(remapped.clues[0].mediaUrl).toBe('/local/clue.png');
    });

    it('round-trip : originalRef -> relativePath -> resolvedPath (T3 blueprint)', () => {
        // Simule l'export puis l'import
        const originalPath = 'm-map-file-001';
        const resolvedLocalPath = '/home/user/gmos-media/Map.jpg';

        // Export : collecte la ref
        const state = service.scrapeCampaignData(CAMPAIGN_ID);
        const assetRefs = service.collectAssetPaths(state);
        expect(assetRefs.has(originalPath)).toBe(true);

        // Import : remap (simule le round-trip assets/maps/Map.jpg → chemin local)
        const assetMap = { [originalPath]: resolvedLocalPath };
        const remapped = service.remapPaths(state, assetMap);

        // Vérification Round-Trip
        expect(remapped.atlasMaps[0].fileUrl).toBe(resolvedLocalPath);
    });
});

// ─────────────────────────────────────────────
// T5 : detectConflicts — Détection des collisions ID
// ─────────────────────────────────────────────

describe('detectConflicts', () => {
    const baseManifest: NexusManifest = {
        schemaVersion: NEXUS_SCHEMA_VERSION,
        bundleId: 'nexus-test-001',
        campaignId: CAMPAIGN_ID,
        campaignName: 'Bundle Importé',
        exportedAt: '2026-04-03T12:00:00.000Z',
        gmosVersion: '5.3.0',
        requiredDriverIds: ['torg'],
        requiredTemplateIds: [],
        assetMap: [],
        stats: {
            entityCount: 1,
            sessionCount: 1,
            atlasMapCount: 0,
            wikiEntryCount: 0,
            clueCount: 0,
            assetCount: 0,
            totalSizeBytes: 0,
        },
    };

    const baseState: NexusCampaignState = {
        campaign: { ...mockCampaign, id: CAMPAIGN_ID },
        entities: [mockEntity],
        players: [],
        sessions: [mockSession],
        atlasMaps: [],
        wikiEntries: [],
        timelineEvents: [],
        clues: [],
        deckManifests: [],
        deckSessionStates: [],
    };

    it('détecte un conflit quand la campagne importée a le même ID', () => {
        const conflicts = service.detectConflicts(baseManifest, baseState);
        expect(conflicts).toHaveLength(1);
        expect(conflicts[0].type).toBe('campaign');
        expect(conflicts[0].existingId).toBe(CAMPAIGN_ID);
        expect(conflicts[0].incomingName).toBe('Bundle Importé');
    });

    it('retourne zéro conflit si la campagne importée a un ID différent', () => {
        const differentState: NexusCampaignState = {
            ...baseState,
            campaign: { ...mockCampaign, id: 'c-brand-new-id' },
        };
        const conflicts = service.detectConflicts(baseManifest, differentState);
        expect(conflicts).toHaveLength(0);
    });

    it('inclut le nombre d\'entités et de sessions du bundle dans le conflit', () => {
        const conflicts = service.detectConflicts(baseManifest, baseState);
        expect(conflicts[0].entityCount).toBe(1); // depuis manifest.stats
        expect(conflicts[0].sessionCount).toBe(1); // depuis manifest.stats
    });

    it('utilise entityCount de l\'état si le manifest n\'a pas de stats', () => {
        const manifestWithoutStats = { ...baseManifest, stats: undefined };
        const stateWith3Entities: NexusCampaignState = {
            ...baseState,
            entities: [mockEntity, mockEntity, mockEntity],
        };
        const conflicts = service.detectConflicts(
            manifestWithoutStats as NexusManifest,
            stateWith3Entities
        );
        expect(conflicts[0].entityCount).toBe(3);
    });
});

// ─────────────────────────────────────────────
// T6 : applyResolutionToState — Clonage des UUIDs
// ─────────────────────────────────────────────

describe('applyResolutionToState', () => {
    const baseState: NexusCampaignState = {
        campaign: { ...mockCampaign, id: CAMPAIGN_ID },
        entities: [
            { ...mockEntity, id: 'e-001', campaignId: CAMPAIGN_ID },
            { ...mockEntity, id: 'e-002', campaignId: CAMPAIGN_ID, name: 'Cosm Warlord' },
        ],
        players: [],
        sessions: [{ ...mockSession, id: 's-001', campaignId: CAMPAIGN_ID }],
        atlasMaps: [{ ...mockAtlasMap, id: 'am-001', campaignId: CAMPAIGN_ID }],
        wikiEntries: [{ ...mockWikiEntry, id: 'w-001', campaignId: CAMPAIGN_ID }],
        timelineEvents: [],
        clues: [{ ...mockClue, id: 'cl-001', campaignId: CAMPAIGN_ID }],
        deckManifests: [],
        deckSessionStates: [],
    };

    it('ne modifie rien si la stratégie n\'est pas "clone"', () => {
        const replaced = service.applyResolutionToState(baseState, { strategy: 'replace' });
        expect(replaced.campaign.id).toBe(CAMPAIGN_ID);
        expect(replaced.entities[0].id).toBe('e-001');
    });

    it('génère un nouvel ID de campagne pour la stratégie "clone"', () => {
        const cloned = service.applyResolutionToState(baseState, { strategy: 'clone' });
        expect(cloned.campaign.id).not.toBe(CAMPAIGN_ID);
        expect(cloned.campaign.id).toMatch(/^camp-/);
    });

    it('ajoute "(Copie)" au nom de la campagne clonée', () => {
        const cloned = service.applyResolutionToState(baseState, { strategy: 'clone' });
        expect(cloned.campaign.name).toContain('(Copie)');
    });

    it('régénère les IDs de toutes les entités lors du clonage', () => {
        const cloned = service.applyResolutionToState(baseState, { strategy: 'clone' });
        // Tous les IDs doivent être différents des originaux
        expect(cloned.entities[0].id).not.toBe('e-001');
        expect(cloned.entities[1].id).not.toBe('e-002');
        // Tous les IDs doivent commencer par npc-
        expect(cloned.entities[0].id).toMatch(/^npc-/);
    });

    it('met à jour le campaignId des entités clonées avec le nouvel ID', () => {
        const cloned = service.applyResolutionToState(baseState, { strategy: 'clone' });
        const newCampaignId = cloned.campaign.id;
        cloned.entities.forEach((e) => {
            expect(e.campaignId).toBe(newCampaignId);
        });
    });

    it('régénère les IDs des sessions et cartes atlas lors du clonage', () => {
        const cloned = service.applyResolutionToState(baseState, { strategy: 'clone' });
        expect(cloned.sessions[0].id).not.toBe('s-001');
        expect(cloned.sessions[0].id).toMatch(/^sess-/);
        expect(cloned.atlasMaps[0].id).not.toBe('am-001');
        expect(cloned.atlasMaps[0].id).toMatch(/^map-/);
    });

    it('les entités originales ne sont pas mutées (immutabilité)', () => {
        const originalEntityId = baseState.entities[0].id;
        service.applyResolutionToState(baseState, { strategy: 'clone' });
        // L'état original est intact
        expect(baseState.entities[0].id).toBe(originalEntityId);
        expect(baseState.campaign.id).toBe(CAMPAIGN_ID);
    });
});

// ─────────────────────────────────────────────
// T7 : splitAssetRefs — Séparation Media Hub vs. chemins absolus
// ─────────────────────────────────────────────

describe('splitAssetRefs (via service privé exposé par cast)', () => {
    // Note : splitAssetRefs est privé — on le teste via collectAssetPaths + vérification
    // des chemin qui matchent /^m-/ versus les autres.
    // On utilise un cast forcé pour tester la logique métier isolément.

    it('sépare correctement les IDs Media Hub des chemins absolus', () => {
        // Accès au membre privé uniquement en test
        const split = (service as unknown as {
            splitAssetRefs: (refs: Set<string>) => { absolutePaths: string[]; mediaHubIds: string[] };
        }).splitAssetRefs;

        const refs = new Set([
            'm-avatar-001',
            'm-wallpaper-999',
            '/Users/david/images/map.jpg',
            'C:\\Users\\david\\map.jpg',
        ]);

        const result = split.call(service, refs);
        expect(result.mediaHubIds).toContain('m-avatar-001');
        expect(result.mediaHubIds).toContain('m-wallpaper-999');
        expect(result.absolutePaths).toContain('/Users/david/images/map.jpg');
        expect(result.absolutePaths).toContain('C:\\Users\\david\\map.jpg');
        expect(result.mediaHubIds).toHaveLength(2);
        expect(result.absolutePaths).toHaveLength(2);
    });

    it('retourne des tableaux vides si le Set est vide', () => {
        const split = (service as unknown as {
            splitAssetRefs: (refs: Set<string>) => { absolutePaths: string[]; mediaHubIds: string[] };
        }).splitAssetRefs;

        const result = split.call(service, new Set<string>());
        expect(result.mediaHubIds).toHaveLength(0);
        expect(result.absolutePaths).toHaveLength(0);
    });
});

// ─────────────────────────────────────────────
// T8 : scrapeCampaignData — Niveau 3 (relations sociales cross-campagne)
// ─────────────────────────────────────────────

describe('scrapeCampaignData — niveau 3 (relations cross-campagne)', () => {
    it('inclut les entités liées par des relations sociales (cross-campagne)', async () => {
        // Arrange : ajouter une relation de e-001 (camp A) vers e-002 (camp B)
        const entityWithRelation: Entity = {
            ...mockEntity,
            id: 'e-001',
            campaignId: CAMPAIGN_ID,
            relations: [
                {
                    targetId: 'e-002',
                    targetType: 'npc',
                    type: 'rival',
                    description: 'Ennemi juré',
                },
            ],
        };

        const { useSessionOSStore } = await import('../../session/useSessionOSStore');
        vi.mocked(useSessionOSStore.getState).mockReturnValue({
            ...mockStoreState,
            entities: [entityWithRelation, mockEntityOtherCampaign],
            customGameDrivers: [],
            customSheetTemplates: [],
            decks: [],
            deckStates: {},
        } as never);

        const result = service.scrapeCampaignData(CAMPAIGN_ID);

        // entities inclut e-001 (campagne cible) + e-002 (cross-campagne via relation)
        const entityIds = result.entities.map((e) => e.id);
        expect(entityIds).toContain('e-001');
        expect(entityIds).toContain('e-002');
        // relatedEntities liste séparément les entités cross-campagne
        expect(result.relatedEntities).toHaveLength(1);
        expect(result.relatedEntities?.[0].id).toBe('e-002');
    });

    it('n\'inclut pas les entités cross-campagne si aucune relation n\'existe', async () => {
        const { useSessionOSStore } = await import('../../session/useSessionOSStore');
        vi.mocked(useSessionOSStore.getState).mockReturnValue({
            ...mockStoreState,
            entities: [mockEntity, mockEntityOtherCampaign],
            customGameDrivers: [],
            customSheetTemplates: [],
            decks: [],
            deckStates: {},
        } as never);

        const result = service.scrapeCampaignData(CAMPAIGN_ID);
        const entityIds = result.entities.map((e) => e.id);
        // Seulement e-001, pas e-002
        expect(entityIds).toContain('e-001');
        expect(entityIds).not.toContain('e-002');
        expect(result.relatedEntities).toHaveLength(0);
    });
});
