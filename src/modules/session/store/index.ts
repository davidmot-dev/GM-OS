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
import {
    handleGenerateEntityPortrait,
    handleGenerateAtlasMapImage,
    handleGeneratePlayerPortrait,
    handleAddChronicle,
    handleExportActiveCampaignToObsidian
} from '../logic/crossDomainHelpers';
import { DEFAULT_GAME_DRIVERS } from '../../../data/defaultGameDrivers';
import { hueEngine } from '../../light/HueEngine';
import { useJournalStore } from '../../journal/useJournalStore';
import { DEFAULT_SHEET_TEMPLATES } from '../../../data/defaultSheetTemplates';
import { resolveSheetTemplate } from '../logic/templateResolver';

import { createCampaignSlice, type CampaignSlice } from './campaignSlice';
import { INITIAL_DATA } from '../data/sessionMocks';
import { useMediaStore } from '../../../stores/useMediaStore';
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

    // Atomic Navigation Helpers (évite les race conditions lors du changement de vue)
    navigateToAtlasMap: (id: string) => void;
    navigateToNpcDetail: (id: string) => void;
    navigateToPlayerDetail: (playerId: string, characterId: string) => void;

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
        campaign: Omit<Campaign, 'id'> & { id?: string };
        entities: (Omit<Entity, 'id' | 'campaignId' | 'relations'> & {
            relations?: { targetName: string; type: EntityRelation['type']; description: string }[];
        })[];
        atlasMaps: Omit<AtlasMap, 'id' | 'campaignId'>[];
        wikiEntries: Omit<WikiEntry, 'id' | 'campaignId'>[];
        existingCampaignId?: string;
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
// Moved to src/modules/session/data/sessionMocks.ts


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
                    selectedDeckId: null,
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

            /** Override deleteCampaign pour un nettoyage en cascade */
            deleteCampaign: (id) => {
                const state = get();
                const campaign = state.campaigns.find((c) => c.id === id);
                if (!campaign) return;

                // 1. Appel du delete de base du slice (pour virer la campagne de la liste)
                // Note: On le fait manuellement ici pour avoir un contrôle total sur l'ordre
                set((state) => ({
                    campaigns: state.campaigns.filter((c) => c.id !== id),
                    activeCampaignId: state.activeCampaignId === id ? null : state.activeCampaignId,
                    
                    // 2. Nettoyage massif (Session-OS)
                    entities: state.entities.filter(e => e.campaignId !== id),
                    sessions: state.sessions.filter(s => s.campaignId !== id),
                    atlasMaps: state.atlasMaps.filter(m => m.campaignId !== id),
                    wikiEntries: state.wikiEntries.filter(w => w.campaignId !== id),
                    timelineEvents: state.timelineEvents.filter(t => t.campaignId !== id),
                    clues: state.clues.filter(c => c.campaignId !== id),
                    
                    // Détachement des personnages PJ (on ne les supprime pas car ils sont liés aux Players)
                    players: state.players.map(p => ({
                        ...p,
                        characters: p.characters.map(c => 
                            c.campaignId === id ? { ...c, campaignId: null } : c
                        )
                    }))
                }));

                // 3. Nettoyage Media-OS (Async - IndexedDB)
                useMediaStore.getState().removeCampaignReference(id);

                gmToast(`Campagne "${campaign.name}" et ses données liées ont été supprimées.`, 'info');
            },

            /** Override setCurrentView pour effets de bord UI */
            setCurrentView: (view) => {
                set({ currentView: view });
                if (view === 'npc-gallery') {
                    set({ isAddingEntity: false, selectedEntityId: null });
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

            navigateToAtlasMap: (id) => {
                // On regroupe les deux changements d'état dans un seul appel atomique
                set({ 
                    selectedAtlasMapId: id,
                    currentView: 'world-atlas'
                });
                
                const map = get().atlasMaps.find((m) => m.id === id);
                if (map) {
                    useJournalStore.getState().addEvent({
                        type: 'LOCATION',
                        title: `📍 Navigation Rapide: ${map.name}`,
                        content: map.narrativeDescription || `Accès direct à la carte ${map.name} depuis le Master Cockpit.`,
                    });
                }
            },

            navigateToNpcDetail: (id) => {
                // On regroupe les deux changements d'état
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
                    const musicState = window.useMusicStore?.getState();
                    const soundState = window.useSoundStore?.getState();
                    const ambientState = window.useAmbientStore?.getState();
                    const lightState = window.useLightStore?.getState();
                    const imageState = window.useImageStore?.getState();
                    const webState = window.useWebStore?.getState();
                    const combatState = window.useCombatStore?.getState();

                    const snapshot: SessionModuleSnapshot = {
                        timestamp: Date.now(),
                        music: musicState ? { activePlaylistId: musicState.activePlaylistId, playlists: musicState.playlists, deckA: musicState.deckA, deckB: musicState.deckB, crossfader: musicState.crossfader, masterVolume: musicState.masterVolume } : undefined,
                        sound: soundState ? { activeAtmosphereId: soundState.activeAtmosphereId, masterVolume: soundState.masterVolume, activePadIds: [], atmospheres: soundState.atmospheres } : undefined,
                        ambient: ambientState ? { activeTracks: ambientState.tracks.map((t: import('../../ambient/useAmbientStore').AmbientTrackState) => ({ id: t.id, url: t.url, volume: t.volume, isPlaying: t.isPlaying })), masterVolume: ambientState.masterVolume, tracks: ambientState.tracks } : undefined,
                        light: lightState ? { activeSceneId: lightState.activeSceneId as string, globalBrightness: lightState.globalBrightness as number, scenes: lightState.scenes } : undefined,
                        image: imageState ? { projections: imageState.projections, mediaList: imageState.mediaList, folders: imageState.folders } : undefined,
                        web: webState ? { links: webState.links.map((l: import('../../web/types').WebLink) => l.url), fullLinks: webState.links } : undefined,
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
                    if (snapshot.music) window.useMusicStore?.getState().applySnapshot?.(snapshot.music);
                    if (snapshot.sound) window.useSoundStore?.getState().applySnapshot?.(snapshot.sound);
                    if (snapshot.ambient) window.useAmbientStore?.getState().applySnapshot?.(snapshot.ambient);
                    if (snapshot.light) {
                        window.useLightStore?.getState().applySnapshot?.(snapshot.light);
                        if (snapshot.light.activeSceneId) hueEngine.applyScene(snapshot.light.activeSceneId, true);
                    }
                    if (snapshot.image) window.useImageStore?.getState().applySnapshot?.(snapshot.image);
                    if (snapshot.web) window.useWebStore?.getState().applySnapshot?.(snapshot.web);
                    if (snapshot.combat) window.useCombatStore?.getState().applySnapshot?.(snapshot.combat);
                    gmToast('État du système restauré avec succès !', 'success');
                } catch (err) {
                    console.error('Failed to apply system snapshot:', err);
                }
            },

            // ── AI Generation ──────────────────────────────

            generateEntityPortrait: async (entityId, instructions) => handleGenerateEntityPortrait(set, get, entityId, instructions),

            generateAtlasMapImage: async (mapId, instructions) => handleGenerateAtlasMapImage(set, get, mapId, instructions),

            generatePlayerPortrait: async (playerId, characterId, instructions) => handleGeneratePlayerPortrait(set, get, playerId, characterId, instructions),

            // ── Chronicle Forge (Import Massif) ────────────

            addChronicle: (payload) => handleAddChronicle(set, get, payload),

            exportActiveCampaignToObsidian: () => handleExportActiveCampaignToObsidian(get),

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
                    currentView: 'cockpit',
                    selectedDeckId: null
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

                // 1. Repair Campaign Systems (Force generic if missing)
                const newCampaigns = campaigns.map(c => {
                    if (c.system && c.system !== 'generic') {
                        const existsInTemplates = allTemplates.some(t => t.id === c.system);
                        const existsInDrivers = DEFAULT_GAME_DRIVERS.some(d => d.id === c.system) || 
                                              get().customGameDrivers.some(d => d.id === c.system);
                        
                        if (!existsInTemplates && !existsInDrivers) {
                            hasChanges = true;
                            console.warn(`[Reconcile] Système '${c.system}' introuvable pour la campagne '${c.name}'. Réinitialisation sur 'generic'.`);
                            return { ...c, system: 'generic' };
                        }
                    }
                    return c;
                });

                // 2. Reconcile Player Templates
                const newPlayers = players.map(p => ({
                    ...p,
                    characters: p.characters.map(char => {
                        if (!char.campaignId) return char;
                        
                        const resolvedTemplate = resolveSheetTemplate(char, newCampaigns, allTemplates);
                        if (char.templateId !== resolvedTemplate.id) {
                            hasChanges = true;
                            console.log(`[Reconcile] Template de ${char.name} changé : ${char.templateId} -> ${resolvedTemplate.id}`);
                            return { ...char, templateId: resolvedTemplate.id };
                        }
                        return char;
                    })
                }));

                if (hasChanges) {
                    set({ players: newPlayers, campaigns: newCampaigns });
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
                    
                    // Nettoyer la persistance indésirable
                    state.selectedDeckId = null;

                    // Lancement de la réconciliation des templates
                    if (typeof state.reconcileTemplates === 'function') {
                        state.reconcileTemplates();
                    }
                }
            },
            partialize: (state) => {
                const isElectron = typeof window !== 'undefined' && !!(window as unknown as { appBridge?: unknown }).appBridge;
                
                // Si on n'est pas dans Electron (ex: Tablet Hub), on ne persiste que le strict minimum
                // pour éviter le QuotaExceededError du localStorage (limité à 5 Mo).
                // Les données lourdes seront resynchronisées via WebSocket/Sync dès la connexion.
                if (!isElectron) {
                    return {
                        activeCampaignId: state.activeCampaignId,
                        currentView: state.currentView,
                        selectedPlayerId: state.selectedPlayerId,
                        selectedAtlasMapId: state.selectedAtlasMapId,
                        selectedEntityId: state.selectedEntityId,
                        isProjecting: state.isProjecting,
                    };
                }

                // Dans Electron (Master), on persiste tout pour le fonctionnement hors-ligne.
                return {
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
                    isProjecting: state.isProjecting,
                    currentView: state.currentView,
                };
            },
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
