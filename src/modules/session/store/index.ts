/**
 * Session-OS Store — Root Assembler (index.ts)
 *
 * Ce fichier assemble tous les slices en un seul store unifié.
 * Il délègue la logique complexe aux services dédiés (SessionManager, SnapshotService).
 *
 * @module session/store/index
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
    handleGenerateEntityPortrait,
    handleGenerateAtlasMapImage,
    handleGeneratePlayerPortrait,
    handleAddChronicle,
    handleExportActiveCampaignToObsidian
} from '../logic/crossDomainHelpers';
import { DEFAULT_GAME_DRIVERS } from '../../../data/defaultGameDrivers';
import { DEFAULT_SHEET_TEMPLATES } from '../../../data/defaultSheetTemplates';

import { createCampaignSlice, type CampaignSlice } from './campaignSlice';
import { INITIAL_DATA } from '../data/sessionMocks';
import { createSessionSlice, type SessionSlice } from './sessionSlice';
import { createEntitySlice, type EntitySlice } from './entitySlice';
import { createAtlasSlice, type AtlasSlice } from './atlasSlice';
import { createChronicleSlice, type ChronicleSlice } from './chronicleSlice';
import { createForgeSlice, type ForgeSlice } from './forgeSlice';
import { createUiSlice, type UiSlice } from './uiSlice';
import { createCluesSlice, type CluesSlice } from './cluesSlice';
import { createDeckSlice, type DeckSlice } from './deckSlice';
import { createLootSlice, type LootSlice } from './lootSlice';

import type {
    Campaign,
    Entity,
    AtlasMap,
    WikiEntry,
    Clue,
    EntityRelation,
    SessionModuleSnapshot,
} from './types';

import { SessionManager } from '../logic/SessionManager';
import { SnapshotService } from '../logic/SnapshotService';
import { PersistenceService, syncStorageAcrossWindows } from '../logic/PersistenceService';

// ─────────────────────────────────────────────
// Cross-domain actions type
// ─────────────────────────────────────────────

interface CrossDomainActions {
    // Actions déléguées au SessionManager ou SnapshotService
    launchSession: (sessionId: string) => void;
    saveSystemSnapshot: (sessionId: string) => void;
    applySystemSnapshot: (snapshot: SessionModuleSnapshot) => Promise<void>;
    clearDiceRolls: () => void;
    setLastBackupAt: (timestamp: string) => void;

    // Sélecteurs 
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

    // Navigation
    navigateToAtlasMap: (id: string) => void;
    navigateToNpcDetail: (id: string) => void;
    navigateToPlayerDetail: (playerId: string, characterId: string) => void;

    // Overrides
    setActiveCampaign: (id: string | null) => void;
    setCurrentView: (view: UiSlice['currentView']) => void;
    setSelectedAtlasMap: (id: string | null) => void;
    autoSelectFirstMap: () => void;
    autoSelectFirstEntity: () => void;

    // AI & Chronicles
    generateEntityPortrait: (entityId: string, instructions?: string) => Promise<void>;
    generateAtlasMapImage: (mapId: string, instructions?: string) => Promise<void>;
    generatePlayerPortrait: (playerId: string, characterId: string, instructions?: string) => Promise<void>;
    addChronicle: (data: any) => void;
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
    LootSlice &
    CrossDomainActions;

// ─────────────────────────────────────────────
// Store Assembly
// ─────────────────────────────────────────────

export const useSessionOSStore = create<SessionOSStore>()(
    persist(
        (set, get, api) => ({
            // ── Slice Assembly ──────────────────────────
            ...createCampaignSlice(set as any, get as any, api as any),
            ...createSessionSlice(set as any, get as any, api as any),
            ...createEntitySlice(set as any, get as any, api as any),
            ...createAtlasSlice(set as any, get as any, api as any),
            ...createChronicleSlice(set as any, get as any, api as any),
            ...createForgeSlice(set as any, get as any, api as any),
            ...createUiSlice(set as any, get as any, api as any),
            ...createCluesSlice(set as any, get as any, api as any),
            ...createDeckSlice(set as any, get as any, api as any),
            ...createLootSlice(set as any, get as any, api as any),

            lastBackupAt: null as string | null,

            // ── Data Initialization ──────────────────────
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

            // ── Cross-domain Overrides (via SessionManager) ──────────

            setActiveCampaign: (id) => SessionManager.setActiveCampaign(set, get, id),
            
            deleteCampaign: (id) => SessionManager.deleteCampaign(set, get, id),

            setCurrentView: (view) => {
                set({ currentView: view });
                if (view === 'npc-gallery') {
                    set({ isAddingEntity: false, selectedEntityId: null });
                }
            },

            setSelectedAtlasMap: (id) => SessionManager.navigateToAtlasMap(set, get, id),

            navigateToAtlasMap: (id) => SessionManager.navigateToAtlasMap(set, get, id),

            navigateToNpcDetail: (id) => {
                set({ 
                    selectedEntityId: id,
                    currentView: 'npc-gallery',
                    isAddingEntity: false 
                });
            },

            navigateToPlayerDetail: (playerId, characterId) => {
                set({
                    selectedPlayerId: playerId,
                    selectedCharacterId: characterId,
                    currentView: 'players'
                });
            },

            autoSelectFirstMap: () => {
                const { atlasMaps, activeCampaignId, selectedAtlasMapId } = get();
                const campaignMaps = atlasMaps.filter((m) => m.campaignId === activeCampaignId);
                const currentMap = atlasMaps.find((m) => m.id === selectedAtlasMapId);
                if (!currentMap || currentMap.campaignId !== activeCampaignId) {
                    set({ selectedAtlasMapId: campaignMaps[0]?.id ?? null });
                }
            },

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

            // ── Snapshot System (via SnapshotService) ──────

            saveSystemSnapshot: async (sessionId) => {
                const snapshot = await SnapshotService.captureSnapshot();
                set((state) => ({
                    sessions: state.sessions.map((s) =>
                        s.id === sessionId ? { ...s, moduleSnapshot: snapshot } : s
                    ),
                }));
            },

            applySystemSnapshot: async (snapshot) => SnapshotService.applySnapshot(snapshot),

            // ── AI & Chronicles ────────────────────────────

            generateEntityPortrait: async (entityId, instructions) => handleGenerateEntityPortrait(set, get, entityId, instructions),
            generateAtlasMapImage: async (mapId, instructions) => handleGenerateAtlasMapImage(set, get, mapId, instructions),
            generatePlayerPortrait: async (playerId, characterId, instructions) => handleGeneratePlayerPortrait(set, get, playerId, characterId, instructions),
            addChronicle: (payload) => handleAddChronicle(set, get, payload),
            exportActiveCampaignToObsidian: () => handleExportActiveCampaignToObsidian(get),

            // ── Session Operations ─────────────────────────

            setLastBackupAt: (timestamp) => set({ lastBackupAt: timestamp }),

            launchSession: (sessionId) => SessionManager.launchSession(set, get, sessionId),

            /** 
             * Reconcile character templates based on campaign system.
             */
            reconcileTemplates: () => {
                const { players, campaigns, customSheetTemplates } = get();
                const { resolveSheetTemplate } = require('../logic/templateResolver');
                const allTemplates = [...DEFAULT_SHEET_TEMPLATES, ...customSheetTemplates];
                
                let hasChanges = false;
                const newCampaigns = campaigns.map(c => {
                    if (c.system && c.system !== 'generic') {
                        const existsInTemplates = allTemplates.some(t => t.id === c.system);
                        const existsInDrivers = DEFAULT_GAME_DRIVERS.some(d => d.id === c.system) || 
                                               get().customGameDrivers.some(d => d.id === c.system);
                        if (!existsInTemplates && !existsInDrivers) {
                            hasChanges = true;
                            return { ...c, system: 'generic' };
                        }
                    }
                    return c;
                });

                const newPlayers = players.map(p => ({
                    ...p,
                    characters: p.characters.map(char => {
                        if (!char.campaignId) return char;
                        const resolvedTemplate = resolveSheetTemplate(char, newCampaigns, allTemplates);
                        if (char.templateId !== resolvedTemplate.id) {
                            hasChanges = true;
                            return { ...char, templateId: resolvedTemplate.id };
                        }
                        return char;
                    })
                }));

                if (hasChanges) set({ players: newPlayers, campaigns: newCampaigns });
            },
        }),
        PersistenceService
    )
);

// ── Cross-Window Sync ───────────────────────────
syncStorageAcrossWindows(() => useSessionOSStore.persist.rehydrate());
