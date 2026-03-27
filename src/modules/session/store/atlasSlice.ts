/**
 * Session-OS Store — Atlas Slice
 *
 * Gère la cartographie de campagne :
 * - CRUD des cartes Atlas
 * - Entités liées géographiquement
 * - Auto-sélection intelligente
 *
 * @module session/store/atlasSlice
 */

import type { StateCreator } from 'zustand';
import { useJournalStore } from '../../journal/useJournalStore';
import type { AtlasMap, AtlasLinkedEntity } from './types';

// ─────────────────────────────────────────────
// State
// ─────────────────────────────────────────────

export interface AtlasSliceState {
    atlasMaps: AtlasMap[];
}

// ─────────────────────────────────────────────
// Actions
// ─────────────────────────────────────────────

export interface AtlasSliceActions {
    addAtlasMap: (map: Omit<AtlasMap, 'id'>) => void;
    updateAtlasMap: (id: string, updates: Partial<Omit<AtlasMap, 'id'>>) => void;
    deleteAtlasMap: (id: string) => void;
    addLinkedEntity: (mapId: string, entity: Omit<AtlasLinkedEntity, 'id'>) => void;
    removeLinkedEntity: (mapId: string, entityId: string) => void;
    setSelectedAtlasMap: (id: string | null) => void;
    autoSelectFirstMap: () => void;
}

export type AtlasSlice = AtlasSliceState & AtlasSliceActions;

// ─────────────────────────────────────────────
// Creator
// ─────────────────────────────────────────────

export const createAtlasSlice: StateCreator<AtlasSlice, [], [], AtlasSlice> = (set, get) => ({
    // Initial State
    atlasMaps: [],

    // Actions
    addAtlasMap: (map) => {
        const newMap: AtlasMap = { ...map, id: `am-${Date.now()}` };
        set((state) => ({ atlasMaps: [...state.atlasMaps, newMap] }));
    },

    updateAtlasMap: (id, updates) =>
        set((state) => ({
            atlasMaps: state.atlasMaps.map((m) => (m.id === id ? { ...m, ...updates } : m)),
        })),

    deleteAtlasMap: (id) =>
        set((state) => ({
            atlasMaps: state.atlasMaps.filter((m) => m.id !== id),
        })),

    addLinkedEntity: (mapId, entity) => {
        const newLinked: AtlasLinkedEntity = { ...entity, id: `le-${Date.now()}` };
        set((state) => ({
            atlasMaps: state.atlasMaps.map((m) =>
                m.id === mapId
                    ? { ...m, linkedEntities: [...m.linkedEntities, newLinked] }
                    : m
            ),
        }));
    },

    removeLinkedEntity: (mapId, entityId) =>
        set((state) => ({
            atlasMaps: state.atlasMaps.map((m) =>
                m.id === mapId
                    ? { ...m, linkedEntities: m.linkedEntities.filter((e) => e.id !== entityId) }
                    : m
            ),
        })),

    // Note: setSelectedAtlasMap et autoSelectFirstMap sont implémentés dans le root store
    // car ils dépendent du journalStore et de activeCampaignId (cross-slice).
    setSelectedAtlasMap: (id) => {
        const { atlasMaps } = get();
        const map = atlasMaps.find((m) => m.id === id);
        if (map) {
            useJournalStore.getState().addEvent({
                type: 'LOCATION',
                title: `📍 Navigation: ${map.name}`,
                content: map.narrativeDescription || `Le groupe se déplace vers ${map.name}.`,
            });
        }
    },

    autoSelectFirstMap: () => {
        // Implémentée dans le root store (dépend de activeCampaignId du campaignSlice)
    },
});
