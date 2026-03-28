/**
 * Session-OS Store — Root Assembler (index.ts)
 *
 * Ce fichier assemble tous les slices en un seul store unifié.
 * Il contient uniquement :
 * 1. L'assemblage des slices (via le Slice Pattern Zustand)
 * 2. Les actions cross-domain (qui touchent à plusieurs slices)
 * 3. La configuration Persist (clé localStorage inchangée)
 *
 * IMPORTANT : Ne pas ajouter de logique métier ici.
 * Toute logique d'un seul domaine doit être dans son slice dédié.
 *
 * @module session/store/index
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { gmToast } from '../../../stores/useToastStore';
import { DEFAULT_GAME_DRIVERS } from '../../../data/defaultGameDrivers';
import { hueEngine } from '../../light/HueEngine';
import { useJournalStore } from '../../journal/useJournalStore';
import { DEFAULT_SHEET_TEMPLATES } from '../../../data/defaultSheetTemplates';
import { resolveSheetTemplate } from '../logic/templateResolver';

import { createCampaignSlice, type CampaignSlice } from './campaignSlice';
import { createSessionSlice, type SessionSlice } from './sessionSlice';
import { createEntitySlice, type EntitySlice } from './entitySlice';
import { createAtlasSlice, type AtlasSlice } from './atlasSlice';
import { createChronicleSlice, type ChronicleSlice } from './chronicleSlice';
import { createForgeSlice, type ForgeSlice } from './forgeSlice';
import { createUiSlice, type UiSlice } from './uiSlice';
import { createCluesSlice, type CluesSlice } from './cluesSlice';
import { createDeckSlice, type DeckSlice } from './deckSlice';

import type {
    Campaign,
    Entity,
    AtlasMap,
    WikiEntry,
    Clue,
    EntityRelation,
    SessionModuleSnapshot,
} from './types';
import type { Playlist } from '../../music/useMusicStore';
import type { Atmosphere } from '../../sound/useSoundStore';
import type { AmbientTrackState } from '../../ambient/useAmbientStore';
import type { LightScene } from '../../light/useLightStore';
import type { ImageMedia, ImageFolder } from '../../image/types';
import type { WebLink } from '../../web/types';
import type { Combatant } from '../../combat/useCombatStore';

// ─────────────────────────────────────────────
// Cross-domain actions type
// ─────────────────────────────────────────────

interface CrossDomainActions {
    // Actions touchant plusieurs slices simultanément
    launchSession: (sessionId: string) => void;
    saveSystemSnapshot: (sessionId: string) => void;
    applySystemSnapshot: (snapshot: SessionModuleSnapshot) => Promise<void>;
    clearDiceRolls: () => void;

    // Sélecteurs cross-domain
    getActiveDriver: () => import('../../../types/drivers').GameDriver | null;
    getBackupData: () => {
        campaigns: Campaign[];
        sessions: import('./types').GameSession[];
        entities: Entity[];
        players: import('./types').Player[];
        atlasMaps: AtlasMap[];
        timelineEvents: import('./types').TimelineEvent[];
        wikiEntries: WikiEntry[];
        clues: Clue[];
        activeCampaignId: string | null;
    };

    // Overrides des setters UI (avec effets de bord cross-domain)
    setActiveCampaign: (id: string | null) => void;
    setCurrentView: (view: UiSlice['currentView']) => void;
    setSelectedAtlasMap: (id: string | null) => void;
    autoSelectFirstMap: () => void;
    autoSelectFirstEntity: () => void;

    // AI Generation (cross-domain: entity + UI flags)
    generateEntityPortrait: (entityId: string, instructions?: string) => Promise<void>;
    generateAtlasMapImage: (mapId: string, instructions?: string) => Promise<void>;
    generatePlayerPortrait: (playerId: string, characterId: string, instructions?: string) => Promise<void>;

    // Import massif (Chronicle Forge)
    addChronicle: (data: {
        campaign: Omit<Campaign, 'id'>;
        entities: (Omit<Entity, 'id' | 'campaignId' | 'relations'> & {
            relations?: { targetName: string; type: EntityRelation['type']; description: string }[];
        })[];
        atlasMaps: Omit<AtlasMap, 'id' | 'campaignId'>[];
        wikiEntries: Omit<WikiEntry, 'id' | 'campaignId'>[];
    }) => void;

    exportActiveCampaignToObsidian: () => Promise<void>;
    reconcileTemplates: () => void;
}

// ─────────────────────────────────────────────
// Full Store Type
// ─────────────────────────────────────────────

export type SessionOSStore = CampaignSlice &
    SessionSlice &
    EntitySlice &
    AtlasSlice &
    ChronicleSlice &
    ForgeSlice &
    UiSlice &
    CluesSlice &
    DeckSlice &
    CrossDomainActions;

// ─────────────────────────────────────────────
// Mock Data (Données de démonstration)
// ─────────────────────────────────────────────

const INITIAL_DATA = {
    campaigns: [
        {
            id: 'c-1',
            name: 'The Eternal Quest',
            system: 'generic',
            description: 'A dark fantasy adventure in the Underdark.',
            synopsis: 'The party is currently investigating the iron citadel.',
            activeSessionId: 's-1',
            activeLocationIds: ['am-1', 'am-2'],
            notebookUrl: 'https://notebooklm.google.com/notebook/campaign-c1-override',
        },
        {
            id: 'c-2',
            name: "Les Ombres d'Eldoria",
            system: 'generic',
            description: "Un voyage épique dans les terres d'Eldoria.",
            synopsis: "Le groupe enquête sur la disparition du roi d'Eldoria.",
            activeLocationIds: ['am-3'],
        },
    ] as Campaign[],
    sessions: [
        {
            id: 's-1',
            campaignId: 'c-1',
            number: 4,
            date: new Date().toISOString(),
            status: 'active' as const,
            publicSummary: 'The party has arrived at the gates of Ironhelm Fortress.',
            gmSecrets: 'Captain Varick is actually a Doppelganger.',
            checklist: [
                { id: 'item-1', text: 'Review map coordinates', isCompleted: true },
                { id: 'item-2', text: 'Audit NPC stat blocks', isCompleted: true },
                { id: 'item-3', text: 'Set atmospheric lighting', isCompleted: false },
                { id: 'item-4', text: 'Queue combat soundtrack', isCompleted: false },
            ],
            sessionEntityIds: ['e-1', 'e-4'],
        },
    ],
    entities: [
        {
            id: 'e-1', name: 'Baron Varick', type: 'npc' as const, role: 'hostile' as const, status: 'alive' as const,
            avatar: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Varick&backgroundColor=b6e3f4',
            hp: 85, maxHp: 85, ac: 16, speed: 30, initiative: 3,
            description: 'Doppelganger / Seigneur de Guerre',
            roleplayingNotes: "Parle avec une autorité froide et calculée.",
            gmSecretInfo: "C'est un Doppelganger.",
            linkedMapIds: ['am-1'], campaignId: 'c-1', templateId: 'generic', sheetData: {},
        },
        {
            id: 'e-2', name: 'Sylvara la Driade', type: 'npc' as const, role: 'neutral' as const, status: 'alive' as const,
            avatar: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Sylvara&backgroundColor=ffdfbf',
            hp: 52, maxHp: 52, ac: 14, speed: 35, initiative: 4,
            description: 'Driade / Gardienne de la Forêt',
            roleplayingNotes: 'Méfiante envers les étrangers.',
            gmSecretInfo: 'Elle sait où se trouve le portail vers le plan Féerique.',
            linkedMapIds: ['am-2'], campaignId: 'c-1', templateId: 'generic', sheetData: {},
        },
        {
            id: 'e-3', name: 'Ignathor', type: 'monster' as const, role: 'boss' as const, status: 'alive' as const,
            avatar: 'https://api.dicebear.com/9.x/bottts/svg?seed=Ignathor&backgroundColor=ffd5dc',
            hp: 256, maxHp: 256, ac: 22, speed: 40, initiative: 0,
            description: 'Dragon Rouge Ancien / Boss Final',
            roleplayingNotes: 'Arrogant, condescendant.',
            gmSecretInfo: "Faiblesse secrète : l'Orbe de Feu Primordial.",
            linkedMapIds: ['am-3'], campaignId: 'c-2', templateId: 'generic', sheetData: {},
        },
        {
            id: 'e-4', name: 'Capitaine Ren', type: 'npc' as const, role: 'ally' as const, status: 'alive' as const,
            avatar: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Ren&backgroundColor=c0aede',
            hp: 68, maxHp: 75, ac: 18, speed: 30, initiative: 2,
            description: "Humain / Garde d'Élite",
            roleplayingNotes: 'Loyale, directe, professionnelle.',
            gmSecretInfo: 'Elle suspecte que Varick n\'est pas qui il prétend être.',
            linkedMapIds: ['am-1'], campaignId: 'c-1', templateId: 'generic', sheetData: {},
        },
    ] as Entity[],
    players: [
        {
            id: 'p-1', realName: 'Thomas D.',
            avatarUrl: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Thomas&backgroundColor=b6e3f4',
            isOnline: true,
            characters: [
                { id: 'pc-1', name: 'Aldric le Paladin', classRace: 'Humain / Serment des Anciens', portraitUrl: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Aldric&backgroundColor=b6e3f4', hp: 42, maxHp: 58, campaignId: 'c-1', templateId: 'generic', sheetData: {}, inventory: '' },
            ],
        },
        {
            id: 'p-2', realName: 'Marie C.',
            avatarUrl: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Marie&backgroundColor=ffdfbf',
            isOnline: false,
            characters: [
                { id: 'pc-3', name: 'Elowen la Druide', classRace: 'Elfe / Cercle de la Lune', portraitUrl: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Elowen&backgroundColor=ffdfbf', hp: 60, maxHp: 60, campaignId: 'c-2', templateId: 'generic', sheetData: {}, inventory: '' },
            ],
        },
        {
            id: 'p-3', realName: 'Lucas R.',
            avatarUrl: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Lucas&backgroundColor=c0aede',
            isOnline: true,
            characters: [
                { id: 'pc-4', name: 'Balder le Barbare', classRace: 'Nain / Voie du Berserker', portraitUrl: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Balder&backgroundColor=ffd5dc', hp: 72, maxHp: 90, campaignId: 'c-1', templateId: 'generic', sheetData: {}, inventory: '' },
            ],
        },
    ],
    atlasMaps: [
        { id: 'am-1', name: "Forteresse d'Ironhelm", fileUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=1200', isVideo: false, type: 'battlemap' as const, campaignId: 'c-1', narrativeDescription: "Une imposante forteresse de pierre noire.", gmNotes: "Baron Varick est un doppelganger.", linkedEntities: [{ id: 'le-1', name: 'Baron Varick', category: 'npc' as const }] },
        { id: 'am-2', name: 'Forêt des Murmures', fileUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&q=80&w=1200', isVideo: false, type: 'region' as const, campaignId: 'c-1', narrativeDescription: 'Une forêt ancienne.', gmNotes: 'Les Driades ici sont hostiles.', linkedEntities: [] },
        { id: 'am-3', name: 'Caverne du Dragon Rouge', fileUrl: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&q=80&w=1200', isVideo: false, type: 'dungeon' as const, campaignId: 'c-2', narrativeDescription: "Un réseau de tunnels.", gmNotes: 'Ignathor dort dans la chambre finale.', linkedEntities: [] },
    ] as AtlasMap[],
    timelineEvents: [
        { id: 'te-1', campaignId: 'c-1', date: '14 Janvier, 1492 DR', title: "Arrivée à Ironhelm", description: 'Le groupe arrive aux portes de la forteresse.', type: 'session' as const, involvedEntityIds: ['p-1', 'p-2'] },
    ],
    wikiEntries: [
        { id: 'we-1', campaignId: 'c-1', title: "La Forteresse d'Ironhelm", content: "# Ironhelm\nUne pile de pierre noire.", category: 'location' as const, tags: ['nain', 'forteresse'], imageUrls: [], linkedEntityIds: ['am-1'] },
    ],
    clues: [
        { id: 'clue-1', campaignId: 'c-1', title: "Le Médaillon Sanglant", content: "Un médaillon trouvé sur un garde mort, marqué du sceau de Varick.", locationId: 'am-1', ownerId: 'e-1', isRevealed: false },
    ] as Clue[],
};

// ─────────────────────────────────────────────
// Store Assembly
// ─────────────────────────────────────────────

export const useSessionOSStore = create<SessionOSStore>()(
    persist(
        (set, get, api) => ({
            // ── Slice Assembly ──────────────────────────
            ...createCampaignSlice(set as Parameters<typeof createCampaignSlice>[0], get as Parameters<typeof createCampaignSlice>[1], api as Parameters<typeof createCampaignSlice>[2]),
            ...createSessionSlice(set as Parameters<typeof createSessionSlice>[0], get as Parameters<typeof createSessionSlice>[1], api as Parameters<typeof createSessionSlice>[2]),
            ...createEntitySlice(set as Parameters<typeof createEntitySlice>[0], get as Parameters<typeof createEntitySlice>[1], api as Parameters<typeof createEntitySlice>[2]),
            ...createAtlasSlice(set as Parameters<typeof createAtlasSlice>[0], get as Parameters<typeof createAtlasSlice>[1], api as Parameters<typeof createAtlasSlice>[2]),
            ...createChronicleSlice(set as Parameters<typeof createChronicleSlice>[0], get as Parameters<typeof createChronicleSlice>[1], api as Parameters<typeof createChronicleSlice>[2]),
            ...createForgeSlice(set as Parameters<typeof createForgeSlice>[0], get as Parameters<typeof createForgeSlice>[1], api as Parameters<typeof createForgeSlice>[2]),
            ...createUiSlice(set as Parameters<typeof createUiSlice>[0], get as Parameters<typeof createUiSlice>[1], api as Parameters<typeof createUiSlice>[2]),
            ...createCluesSlice(set as Parameters<typeof createCluesSlice>[0], get as Parameters<typeof createCluesSlice>[1], api as Parameters<typeof createCluesSlice>[2]),
            ...createDeckSlice(set as Parameters<typeof createDeckSlice>[0], get as Parameters<typeof createDeckSlice>[1], api as Parameters<typeof createDeckSlice>[2]),

            // ── Hydratation des données initiales ─────────
            campaigns: INITIAL_DATA.campaigns,
            sessions: INITIAL_DATA.sessions,
            entities: INITIAL_DATA.entities,
            players: INITIAL_DATA.players,
            atlasMaps: INITIAL_DATA.atlasMaps,
            timelineEvents: INITIAL_DATA.timelineEvents,
            wikiEntries: INITIAL_DATA.wikiEntries,
            clues: INITIAL_DATA.clues,
            activeCampaignId: 'c-1',
            selectedPlayerId: 'p-1',
            selectedAtlasMapId: 'am-1',
            selectedEntityId: 'e-1',

            // ── Cross-domain Overrides ─────────────────────

            /** Override setActiveCampaign pour déclencher le Journal Store */
            setActiveCampaign: (id) => {
                set({
                    activeCampaignId: id,
                    currentView: 'cockpit',
                    selectedSessionId: null,
                    selectedAtlasMapId: null,
                });
                if (id) {
                    const campaign = get().campaigns.find((c) => c.id === id);
                    useJournalStore.getState().stopJournal();
                    useJournalStore.getState().addEvent({
                        type: 'SYSTEM',
                        title: 'Campagne activée',
                        content: `La campagne "${campaign?.name || id}" est maintenant active.`,
                    });
                }
            },

            /** Override setCurrentView pour effets de bord UI */
            setCurrentView: (view) => {
                set({ currentView: view });
                if (view === 'npc-gallery') {
                    set({ isAddingEntity: false, selectedEntityId: null });
                } else if (view === 'world-atlas') {
                    set({ selectedAtlasMapId: null });
                }
            },

            /** Override setSelectedAtlasMap pour logguer dans le Journal */
            setSelectedAtlasMap: (id) => {
                set({ selectedAtlasMapId: id });
                const map = get().atlasMaps.find((m) => m.id === id);
                if (map) {
                    useJournalStore.getState().addEvent({
                        type: 'LOCATION',
                        title: `📍 Navigation: ${map.name}`,
                        content: map.narrativeDescription || `Le groupe se déplace vers ${map.name}.`,
                    });
                }
            },

            /** Auto-sélection de la première carte de la campagne active */
            autoSelectFirstMap: () => {
                const { atlasMaps, activeCampaignId, selectedAtlasMapId } = get();
                const campaignMaps = atlasMaps.filter((m) => m.campaignId === activeCampaignId);
                const currentMap = atlasMaps.find((m) => m.id === selectedAtlasMapId);
                if (!currentMap || currentMap.campaignId !== activeCampaignId) {
                    set({ selectedAtlasMapId: campaignMaps[0]?.id ?? null });
                }
            },

            /** Auto-sélection de la première entité de la campagne active */
            autoSelectFirstEntity: () => {
                const { entities, activeCampaignId, selectedEntityId } = get();
                const campaignEntities = entities.filter((e) => e.campaignId === activeCampaignId);
                const currentEntity = entities.find((e) => e.id === selectedEntityId);
                if (!currentEntity || currentEntity.campaignId !== activeCampaignId) {
                    set({ selectedEntityId: campaignEntities[0]?.id ?? null });
                }
            },

            clearDiceRolls: () => set({ diceRolls: [] }),

            // ── Selectors ──────────────────────────────────

            getActiveDriver: () => {
                const { activeCampaignId, campaigns, customGameDrivers } = get();
                const campaign = campaigns.find((c) => c.id === activeCampaignId);
                if (!campaign) return null;
                return (
                    customGameDrivers.find((d) => d.id === campaign.system) ??
                    DEFAULT_GAME_DRIVERS.find((d) => d.id === campaign.system) ??
                    null
                );
            },

            getBackupData: () => {
                const { campaigns, sessions, entities, players, atlasMaps, timelineEvents, wikiEntries, clues, activeCampaignId } = get();
                return { campaigns, sessions, entities, players, atlasMaps, timelineEvents, wikiEntries, clues, activeCampaignId };
            },

            // ── Snapshot System ────────────────────────────

            saveSystemSnapshot: (sessionId) => {
                try {
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
                        music: musicState ? { activePlaylistId: musicState.activePlaylistId, playlists: musicState.playlists, deckA: musicState.deckA, deckB: musicState.deckB, crossfader: musicState.crossfader, masterVolume: musicState.masterVolume } : undefined,
                        sound: soundState ? { activeAtmosphereId: soundState.activeAtmosphereId, masterVolume: soundState.masterVolume, activePadIds: [], atmospheres: soundState.atmospheres } : undefined,
                        ambient: ambientState ? { activeTracks: ambientState.tracks.map(t => ({ id: t.id, url: t.url, volume: t.volume, isPlaying: t.isPlaying })), masterVolume: ambientState.masterVolume, tracks: ambientState.tracks } : undefined,
                        light: lightState ? { activeSceneId: lightState.activeSceneId as string, globalBrightness: lightState.globalBrightness as number, scenes: lightState.scenes } : undefined,
                        image: imageState ? { projections: imageState.projections, mediaList: imageState.mediaList, folders: imageState.folders } : undefined,
                        web: webState ? { links: webState.links.map(l => l.url), fullLinks: webState.links } : undefined,
                        combat: combatState ? { combatants: combatState.combatants, currentTurnIdx: combatState.currentTurnIdx, round: combatState.round } : undefined,
                    };

                    set((state) => ({
                        sessions: state.sessions.map((s) =>
                            s.id === sessionId ? { ...s, moduleSnapshot: snapshot } : s
                        ),
                    }));
                } catch (err) {
                    console.error('Failed to save system snapshot:', err);
                }
            },

            applySystemSnapshot: async (snapshot) => {
                try {
                    type SnapshotStore<T> = { getState: () => { applySnapshot?: (s: T) => void | Promise<void> } };
                    if (snapshot.music) (window as unknown as { useMusicStore?: SnapshotStore<typeof snapshot.music> }).useMusicStore?.getState().applySnapshot?.(snapshot.music);
                    if (snapshot.sound) (window as unknown as { useSoundStore?: SnapshotStore<typeof snapshot.sound> }).useSoundStore?.getState().applySnapshot?.(snapshot.sound);
                    if (snapshot.ambient) (window as unknown as { useAmbientStore?: SnapshotStore<typeof snapshot.ambient> }).useAmbientStore?.getState().applySnapshot?.(snapshot.ambient);
                    if (snapshot.light) {
                        (window as unknown as { useLightStore?: SnapshotStore<typeof snapshot.light> }).useLightStore?.getState().applySnapshot?.(snapshot.light);
                        if (snapshot.light.activeSceneId) hueEngine.applyScene(snapshot.light.activeSceneId, true);
                    }
                    if (snapshot.image) (window as unknown as { useImageStore?: SnapshotStore<typeof snapshot.image> }).useImageStore?.getState().applySnapshot?.(snapshot.image);
                    if (snapshot.web) (window as unknown as { useWebStore?: SnapshotStore<typeof snapshot.web> }).useWebStore?.getState().applySnapshot?.(snapshot.web);
                    if (snapshot.combat) (window as unknown as { useCombatStore?: SnapshotStore<typeof snapshot.combat> }).useCombatStore?.getState().applySnapshot?.(snapshot.combat);
                    gmToast('État du système restauré avec succès !', 'success');
                } catch (err) {
                    console.error('Failed to apply system snapshot:', err);
                }
            },

            // ── AI Generation ──────────────────────────────

            generateEntityPortrait: async (entityId, instructions) => {
                const entity = get().entities.find((e) => e.id === entityId);
                if (!entity) return;
                set({ isGeneratingAIImage: true });
                try {
                    const { aiService } = await import('../../ai/AIService');
                    const cleanDesc = (entity.description || '').replace(/\n/g, ' ').substring(0, 300);
                    const prompt = instructions ?? `A professional fantasy RPG character portrait of ${entity.name}. ${cleanDesc}. High quality digital art, cinematic lighting, 8k.`;
                    const mediaId = await aiService.generateImage(prompt);
                    get().updateEntity(entityId, { avatar: mediaId });
                } catch (err) {
                    console.error('AI Portrait Error:', err);
                } finally {
                    set({ isGeneratingAIImage: false });
                }
            },

            generateAtlasMapImage: async (mapId, instructions) => {
                const map = get().atlasMaps.find((m) => m.id === mapId);
                if (!map) return;
                set({ isGeneratingAIImage: true });
                try {
                    const { aiService } = await import('../../ai/AIService');
                    const cleanDesc = (map.narrativeDescription || '').replace(/\n/g, ' ').substring(0, 300);
                    const prompt = instructions ?? `Fantasy RPG environment art: ${map.name}. ${cleanDesc}. Cinematic, epic scale, high quality.`;
                    const mediaId = await aiService.generateImage(prompt);
                    get().updateAtlasMap(mapId, { fileUrl: mediaId, isVideo: false });
                } catch (err) {
                    console.error('AI Map Error:', err);
                } finally {
                    set({ isGeneratingAIImage: false });
                }
            },

            generatePlayerPortrait: async (playerId, characterId, instructions) => {
                const player = get().players.find((p) => p.id === playerId);
                const char = player?.characters.find((c) => c.id === characterId);
                if (!char) return;
                set({ isGeneratingAIImage: true });
                try {
                    const { aiService } = await import('../../ai/AIService');
                    const prompt = `A heroic character portrait of ${char.name}. ${char.classRace}. Professional digital art, cinematic lighting, 8k. ${instructions ? `Additional: ${instructions}` : ''}`;
                    const mediaId = await aiService.generateImage(prompt);
                    get().updateCharacterVisuals(playerId, characterId, { portraitUrl: mediaId });
                } catch (err) {
                    console.error('AI Player Portrait Error:', err);
                } finally {
                    set({ isGeneratingAIImage: false });
                }
            },

            // ── Chronicle Forge (Import Massif) ────────────

            addChronicle: ({ campaign, entities, atlasMaps, wikiEntries }) => {
                const campaignId = `c-${Date.now()}`;
                const newCampaign: Campaign = { ...campaign, id: campaignId, activeLocationIds: [] };

                const entityIdMap: Record<string, string> = {};
                const newEntities: Entity[] = entities.map((e) => {
                    const id = `e-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
                    entityIdMap[e.name] = id;
                    return { ...e, id, campaignId, relations: [] };
                });

                // Résoudre les relations par nom
                newEntities.forEach((entity, idx) => {
                    const rawRelations = entities[idx].relations ?? [];
                    entity.relations = rawRelations.map((r) => ({
                        targetId: entityIdMap[r.targetName] ?? '',
                        targetType: 'npc' as const,
                        type: r.type,
                        description: r.description,
                    })).filter((r) => r.targetId);
                });

                const newAtlasMaps: AtlasMap[] = atlasMaps.map((m) => ({
                    ...m,
                    id: `am-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                    campaignId,
                    linkedEntities: [],
                }));

                const newWikiEntries: WikiEntry[] = wikiEntries.map((w) => ({
                    ...w,
                    id: `we-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                    campaignId,
                }));

                set((state) => ({
                    campaigns: [...state.campaigns, newCampaign],
                    entities: [...state.entities, ...newEntities],
                    atlasMaps: [...state.atlasMaps, ...newAtlasMaps],
                    wikiEntries: [...state.wikiEntries, ...newWikiEntries],
                    activeCampaignId: campaignId,
                    currentView: 'cockpit',
                }));

                gmToast(`Chronique "${newCampaign.name}" importée avec ${newEntities.length} entités.`, 'success');
            },

            exportActiveCampaignToObsidian: async () => {
                const { obsidianExportService } = await import('../ObsidianExportService');
                const state = get();
                const campaign = state.campaigns.find((c) => c.id === state.activeCampaignId);
                if (!campaign) return;
                await obsidianExportService.exportCampaign(campaign, state.entities, state.atlasMaps, state.wikiEntries);
            },

            // ── Session Launch ─────────────────────────────

            launchSession: (sessionId) => {
                const { sessions, campaigns } = get();
                const session = sessions.find((s) => s.id === sessionId);
                if (!session) return;

                // 1. Mettre à jour les statuts des sessions (une seule active par campagne)
                const updatedSessions = sessions.map(s => {
                    if (s.campaignId === session.campaignId) {
                        if (s.id === sessionId) return { ...s, status: 'active' as const };
                        if (s.id !== sessionId && s.status === 'active') return { ...s, status: 'done' as const };
                    }
                    return s;
                });

                // 2. Mettre à jour l'activeSessionId de la campagne
                const updatedCampaigns = campaigns.map(c => {
                    if (c.id === session.campaignId) {
                        return { ...c, activeSessionId: sessionId };
                    }
                    return c;
                });

                // 3. Initialiser le Journal OS
                useJournalStore.getState().startJournal(
                    session.campaignId,
                    `Session #${session.number}`,
                    { publicSummary: session.publicSummary }
                );

                // 4. Mettre à jour le store et basculer sur le cockpit
                set({ 
                    sessions: updatedSessions, 
                    campaigns: updatedCampaigns,
                    currentView: 'cockpit' 
                });
            },

            /** 
             * Réconcilie les templates des personnages en fonction de leur campagne.
             * Force le template correct si le personnage est sur 'generic'.
             */
            reconcileTemplates: () => {
                const { players, campaigns, customSheetTemplates } = get();
                const allTemplates = [...DEFAULT_SHEET_TEMPLATES, ...customSheetTemplates];
                
                let hasChanges = false;
                const newPlayers = players.map(p => ({
                    ...p,
                    characters: p.characters.map(c => {
                        if (!c.campaignId) return c;
                        
                        const resolvedTemplate = resolveSheetTemplate(c, campaigns, allTemplates);
                        if (c.templateId !== resolvedTemplate.id) {
                            hasChanges = true;
                            console.log(`[Reconcile] Template de ${c.name} changé : ${c.templateId} -> ${resolvedTemplate.id}`);
                            return { ...c, templateId: resolvedTemplate.id };
                        }
                        return c;
                    })
                }));

                if (hasChanges) {
                    set({ players: newPlayers });
                }
            },
        }),
        {
            name: 'gmos-v5-session-os-storage', // ← Clé inchangée pour préserver les données existantes
            version: 10,
            migrate: (persistedState: unknown, version: number) => {
                console.log(`[Store Migration] Migrating from version ${version} to 10`);
                return persistedState;
            },
            onRehydrateStorage: () => (state) => {
                if (state) {
                    // Sanitize stale blob URLs from persistent storage
                    (state.atlasMaps || []).forEach(m => {
                        if (m.fileUrl?.startsWith('blob:')) m.fileUrl = '';
                    });
                    
                    // Lancement de la réconciliation des templates
                    if (typeof state.reconcileTemplates === 'function') {
                        state.reconcileTemplates();
                    }
                }
            },
            partialize: (state) => ({
                campaigns: state.campaigns,
                sessions: state.sessions,
                entities: state.entities,
                players: state.players,
                atlasMaps: state.atlasMaps,
                timelineEvents: state.timelineEvents,
                wikiEntries: state.wikiEntries,
                clues: state.clues,
                customSheetTemplates: state.customSheetTemplates,
                customGameDrivers: state.customGameDrivers,
                activeCampaignId: state.activeCampaignId,
                decks: state.decks,
                deckStates: state.deckStates,
                selectedDeckId: state.selectedDeckId,
                isProjecting: state.isProjecting,
            }),
        }
    )
);

// ─────────────────────────────────────────────
// Cross-Window Synchronization
// ─────────────────────────────────────────────

/**
 * Synchronisation automatique entre les fenêtres (Cockpit MJ, Hub TabletTE, etc.)
 * Écoute les changements du localStorage émis par d'autres fenêtres et synchronise 
 * l'état local du store sans recharger la page.
 */
if (typeof window !== 'undefined') {
    window.addEventListener('storage', (event) => {
        if (event.key === 'gmos-v5-session-os-storage') {
            // Force la ré-hydratation du store avec les nouvelles données du disque
            useSessionOSStore.persist.rehydrate();
        }
    });
}
