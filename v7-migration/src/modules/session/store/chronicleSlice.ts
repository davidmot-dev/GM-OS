/**
 * Session-OS Store — Chronicle Slice
 *
 * Gère le Wiki et la Timeline de campagne.
 * Point d'intégration futur pour le système d'Indices (Clues).
 *
 * @module session/store/chronicleSlice
 */

import type { StateCreator } from 'zustand';
import type { WikiEntry, TimelineEvent } from './types';

// ─────────────────────────────────────────────
// State
// ─────────────────────────────────────────────

export interface ChronicleSliceState {
    wikiEntries: WikiEntry[];
    timelineEvents: TimelineEvent[];
}

// ─────────────────────────────────────────────
// Actions
// ─────────────────────────────────────────────

export interface ChronicleSliceActions {
    // Wiki
    addWikiEntry: (entry: Omit<WikiEntry, 'id'>) => void;
    updateWikiEntry: (id: string, updates: Partial<WikiEntry>) => void;
    deleteWikiEntry: (id: string) => void;
    // Timeline
    addTimelineEvent: (event: Omit<TimelineEvent, 'id'>) => void;
    updateTimelineEvent: (id: string, updates: Partial<TimelineEvent>) => void;
    deleteTimelineEvent: (id: string) => void;
}

export type ChronicleSlice = ChronicleSliceState & ChronicleSliceActions;

// ─────────────────────────────────────────────
// Creator
// ─────────────────────────────────────────────

export const createChronicleSlice: StateCreator<ChronicleSlice, [], [], ChronicleSlice> = (set) => ({
    // Initial State
    wikiEntries: [],
    timelineEvents: [],

    // Wiki Actions
    addWikiEntry: (entry) => {
        const newEntry: WikiEntry = { ...entry, id: `we-${Date.now()}` };
        set((state) => ({ wikiEntries: [...state.wikiEntries, newEntry] }));
    },

    updateWikiEntry: (id, updates) =>
        set((state) => ({
            wikiEntries: state.wikiEntries.map((e) => (e.id === id ? { ...e, ...updates } : e)),
        })),

    deleteWikiEntry: (id) =>
        set((state) => ({
            wikiEntries: state.wikiEntries.filter((e) => e.id !== id),
        })),

    // Timeline Actions
    addTimelineEvent: (event) => {
        const newEvent: TimelineEvent = { ...event, id: `te-${Date.now()}` };
        set((state) => ({ timelineEvents: [...state.timelineEvents, newEvent] }));
    },

    updateTimelineEvent: (id, updates) =>
        set((state) => ({
            timelineEvents: state.timelineEvents.map((e) =>
                e.id === id ? { ...e, ...updates } : e
            ),
        })),

    deleteTimelineEvent: (id) =>
        set((state) => ({
            timelineEvents: state.timelineEvents.filter((e) => e.id !== id),
        })),
});
