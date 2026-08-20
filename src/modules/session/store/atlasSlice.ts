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
    toggleMapVisited: (id: string) => void;
    autoSelectFirstMap: () => void;
}

export type AtlasSlice = AtlasSliceState & AtlasSliceActions;

// ─────────────────────────────────────────────
// Creator
// ─────────────────────────────────────────────

// Ni `get` ni le journal ici : le seul usage qu'en faisait ce slice était
// l'émetteur mort de `setSelectedAtlasMap`.
export const createAtlasSlice: StateCreator<AtlasSlice, [], [], AtlasSlice> = (set) => ({
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

    // Note: setSelectedAtlasMap et autoSelectFirstMap sont implémentés dans le root
    // store, car ils dépendent du journalStore et de activeCampaignId (cross-slice).
    // Les deux corps ci-dessous sont donc vides, et doivent le rester.
    setSelectedAtlasMap: () => {
        /*
          **Implémentée dans le root store**, qui la remplace par
          `SessionManager.navigateToAtlasMap` — la note ci-dessus le disait déjà,
          mais le corps était resté ici, avec son `addEvent` complet.

          Un émetteur qui ne part jamais est pire qu'un émetteur absent : il en
          existait deux exemplaires identiques du même événement « Navigation »,
          et corriger celui-ci n'aurait rien changé au journal, sans que rien ne
          l'explique. Vidée comme `autoSelectFirstMap` juste en dessous, qui a
          toujours été honnête sur son sort.
        */
    },

    toggleMapVisited: (id: string) =>
        set((state) => ({
            atlasMaps: state.atlasMaps.map((m) =>
                m.id === id ? { ...m, isVisited: !m.isVisited } : m
            ),
        })),

    autoSelectFirstMap: () => {
        // Implémentée dans le root store (dépend de activeCampaignId du campaignSlice)
    },
});
