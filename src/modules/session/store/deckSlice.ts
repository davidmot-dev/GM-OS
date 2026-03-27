/**
 * Session-OS Store — Deck Slice
 * 
 * Gère les paquets de cartes (Drama Decks, Loot, etc.) :
 * - Manifestes des decks (Metadata)
 * - États de session (Pioche/Défausse)
 * 
 * @module session/store/deckSlice
 */

import type { StateCreator } from 'zustand';
import { DeckInterpreter } from '../logic/DeckInterpreter';
import type { DeckManifest, DeckSessionState } from './types';
import { gmToast } from '../../../stores/useToastStore';

export interface DeckSliceState {
    decks: DeckManifest[];
    deckStates: Record<string, DeckSessionState>;
}

export interface DeckSliceActions {
    addDeck: (deck: Omit<DeckManifest, 'id'>) => void;
    updateDeck: (id: string, updates: Partial<DeckManifest>) => void;
    deleteDeck: (id: string) => void;
    
    // Actions de session
    drawCard: (deckId: string) => void;
    discardCard: (deckId: string) => void;
    shuffleDeck: (deckId: string) => void;
    resetDeck: (deckId: string) => void;
}

export type DeckSlice = DeckSliceState & DeckSliceActions;

export const createDeckSlice: StateCreator<DeckSlice, [], [], DeckSlice> = (set, get) => ({
    // Initial State
    decks: [],
    deckStates: {},

    // Actions
    addDeck: (deck) => {
        const id = `deck-${Date.now()}`;
        const newDeck: DeckManifest = { ...deck, id };
        
        set((state) => ({
            decks: [...state.decks, newDeck],
            deckStates: {
                ...state.deckStates,
                [id]: {
                    deckId: id,
                    remainingIndices: DeckInterpreter.initializeIndices(deck.cardCount),
                    discardedIndices: [],
                    currentCardIndex: null
                }
            }
        }));
        gmToast(`Paquet "${newDeck.name}" ajouté.`, 'success');
    },

    updateDeck: (id, updates) => {
        set((state) => ({
            decks: state.decks.map(d => d.id === id ? { ...d, ...updates } : d)
        }));
        // Si le nombre de cartes change, on réinitialise l'état
        if (updates.cardCount !== undefined) {
            get().resetDeck(id);
        }
    },

    deleteDeck: (id) => {
        set((state) => {
            const { [id]: _, ...newStates } = state.deckStates;
            return {
                decks: state.decks.filter(d => d.id !== id),
                deckStates: newStates
            };
        });
    },

    drawCard: (deckId) => {
        const state = get().deckStates[deckId];
        if (!state) return;

        const { card, newRemaining } = DeckInterpreter.draw(state.remainingIndices);
        
        if (!card) {
            gmToast("Plus de cartes dans la pioche !", "info");
            return;
        }

        set((store) => ({
            deckStates: {
                ...store.deckStates,
                [deckId]: {
                    ...state,
                    remainingIndices: newRemaining,
                    currentCardIndex: card
                }
            }
        }));

        const deck = get().decks.find(d => d.id === deckId);
        gmToast(`Carte tirée (${deck?.name || 'Deck'})`, 'success');
    },

    discardCard: (deckId) => {
        const state = get().deckStates[deckId];
        const deck = get().decks.find(d => d.id === deckId);
        if (!state || !state.currentCardIndex) return;

        set((store) => ({
            deckStates: {
                ...store.deckStates,
                [deckId]: {
                    ...state,
                    discardedIndices: deck?.useDiscard 
                        ? [...state.discardedIndices, state.currentCardIndex as number]
                        : state.discardedIndices,
                    currentCardIndex: null
                }
            }
        }));
    },

    shuffleDeck: (deckId) => {
        const state = get().deckStates[deckId];
        if (!state) return;

        // On remet tout dans la pioche et on mélange
        const allIndices = [...state.remainingIndices, ...state.discardedIndices];
        if (state.currentCardIndex) allIndices.push(state.currentCardIndex);

        set((store) => ({
            deckStates: {
                ...store.deckStates,
                [deckId]: {
                    ...state,
                    remainingIndices: DeckInterpreter.shuffle(allIndices),
                    discardedIndices: [],
                    currentCardIndex: null
                }
            }
        }));
        gmToast("Paquet mélangé.", "info");
    },

    resetDeck: (deckId) => {
        const deck = get().decks.find(d => d.id === deckId);
        if (!deck) return;

        set((store) => ({
            deckStates: {
                ...store.deckStates,
                [deckId]: {
                    deckId,
                    remainingIndices: DeckInterpreter.initializeIndices(deck.cardCount),
                    discardedIndices: [],
                    currentCardIndex: null
                }
            }
        }));
    }
});
