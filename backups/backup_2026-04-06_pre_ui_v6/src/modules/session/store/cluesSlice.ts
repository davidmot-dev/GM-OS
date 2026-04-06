/**
 * Session-OS Store — Clues Slice
 *
 * Gère le système d'Indices (Clues) interconnectés.
 * Un indice peut être lié à un lieu, un PNJ et/ou un événement.
 *
 * @module session/store/cluesSlice
 */

import type { StateCreator } from 'zustand';
import type { Clue } from './types';

// ─────────────────────────────────────────────
// State
// ─────────────────────────────────────────────

export interface CluesSliceState {
    clues: Clue[];
}

// ─────────────────────────────────────────────
// Actions
// ─────────────────────────────────────────────

export interface CluesSliceActions {
    addClue: (clue: Omit<Clue, 'id' | 'isRevealed' | 'revealedAt'>) => void;
    updateClue: (id: string, updates: Partial<Clue>) => void;
    deleteClue: (id: string) => void;
    revealClue: (id: string) => void;
}

export type CluesSlice = CluesSliceState & CluesSliceActions;

// ─────────────────────────────────────────────
// Creator (Winston Pattern)
// ─────────────────────────────────────────────

export const createCluesSlice: StateCreator<CluesSlice, [], [], CluesSlice> = (set) => ({
    // Initial State
    clues: [],

    // Actions
    addClue: (clue) => {
        const newClue: Clue = {
            ...clue,
            id: `clue-${Date.now()}`,
            isRevealed: false,
        };
        set((state) => ({ clues: [...state.clues, newClue] }));
    },

    updateClue: (id, updates) =>
        set((state) => ({
            clues: state.clues.map((c) => (c.id === id ? { ...c, ...updates } : c)),
        })),

    deleteClue: (id) =>
        set((state) => ({
            clues: state.clues.filter((c) => c.id !== id),
        })),

    revealClue: (id) =>
        set((state) => ({
            clues: state.clues.map((c) =>
                c.id === id
                    ? { ...c, isRevealed: true, revealedAt: Date.now() }
                    : c
            ),
        })),
});
