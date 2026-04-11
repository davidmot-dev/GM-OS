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
import i18next from 'i18next';
import { DeckInterpreter } from '../logic/DeckInterpreter';
import type { DeckManifest, DeckSessionState } from './types';
import { gmToast } from '../../../stores/useToastStore';

export interface DeckSliceState {
    decks: DeckManifest[];
    deckStates: Record<string, DeckSessionState>;
    selectedDeckId: string | null;
    isProjecting: boolean;
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
    selectDeck: (id: string | null) => void;
    toggleProjection: () => void;
}

export type DeckSlice = DeckSliceState & DeckSliceActions;

export const createDeckSlice: StateCreator<DeckSlice, [], [], DeckSlice> = (set, get) => ({
    // Initial State
    decks: [],
    deckStates: {},
    selectedDeckId: null,
    isProjecting: false,

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
                    remainingIndices: DeckInterpreter.initializeIndices(newDeck),
                    discardedIndices: [],
                    currentCardIndex: null
                }
            }
        }));
        gmToast(i18next.t('modules:session.toasts.deck_added', { name: newDeck.name }), 'success');
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
            const newStates = { ...state.deckStates };
            delete newStates[id];
            return {
                decks: state.decks.filter(d => d.id !== id),
                deckStates: newStates
            };
        });
    },

    drawCard: (deckId) => {
        const state = get().deckStates[deckId];
        const deck = get().decks.find(d => d.id === deckId);
        if (!state || !deck) return;

        let workingRemaining = [...state.remainingIndices];
        const workingDiscard = [...state.discardedIndices];

        // 1. Gérer la carte actuellement affichée (la carte "précédente")
        if (state.currentCardIndex !== null) {
            if (deck.useDiscard) {
                // Elle va dans la défausse
                workingDiscard.push(state.currentCardIndex);
            } else {
                // Elle retourne dans le paquet au hasard
                workingRemaining.push(state.currentCardIndex);
                workingRemaining = DeckInterpreter.shuffle(workingRemaining);
            }
        }

        // 2. Piocher la nouvelle carte
        const { card, newRemaining } = DeckInterpreter.draw(workingRemaining);
        
        if (card === null) {
            gmToast(i18next.t('modules:session.toasts.deck_empty'), "info");
            return;
        }

        set((store) => ({
            deckStates: {
                ...store.deckStates,
                [deckId]: {
                    ...state,
                    remainingIndices: newRemaining,
                    discardedIndices: workingDiscard,
                    currentCardIndex: card
                }
            }
        }));


        gmToast(i18next.t('modules:session.toasts.card_drawn', { name: deck.name }), 'success');

        // [PREMIUM] Projection & Journalisation
        if (get().isProjecting) {
            import('../../image/useImageStore').then(async mod => {
                const cardImageUrl = DeckInterpreter.getCardImage(deck, card);
                const metadata = DeckInterpreter.getCardMetadata(deck, card);
                const cardName = metadata?.name || `Carte #${card + (deck.startAtZero ? 0 : 1)}`;
                
                if (cardImageUrl) {
                    // Projection as Entity for better UI focus (Full card view)
                    await mod.useImageStore.getState().projectEntity({
                        id: `card-${deckId}-${card}-${Date.now()}`,
                        name: cardName,
                        subtitle: `Oracle : ${deck.name}`,
                        avatar: cardImageUrl,
                        type: 'Oracle',
                        lore: metadata?.description || ""
                    });
                }
            });
        }

        import('../../journal/useJournalStore').then(mod => {
            const journal = mod.useJournalStore.getState();
            if (journal.isRecording) {
                const cardName = DeckInterpreter.getCardMetadata(deck, card)?.name || `Carte #${card + (deck.startAtZero ? 0 : 1)}`;
                journal.addEvent({
                    type: 'ORACLE',
                    title: i18next.t('modules:session.events.card_draw_title', { card: cardName }),
                    content: i18next.t('modules:session.events.card_draw_content', { deck: deck.name, card: cardName }),
                    metadata: { 
                        deckId, 
                        cardIndex: card,
                        imageUrl: DeckInterpreter.getCardImage(deck, card)
                    }
                });
            }
        });
    },

    discardCard: (deckId) => {
        const state = get().deckStates[deckId];
        const deck = get().decks.find(d => d.id === deckId);
        if (!state || state.currentCardIndex === null) return;

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
        const deck = get().decks.find(d => d.id === deckId);
        if (!deck) return;

        set((store) => ({
            deckStates: {
                ...store.deckStates,
                [deckId]: {
                    deckId,
                    remainingIndices: DeckInterpreter.initializeIndices(deck),
                    discardedIndices: [],
                    currentCardIndex: null
                }
            }
        }));
        gmToast(i18next.t('modules:session.toasts.deck_shuffled'), "info");
    },

    resetDeck: (deckId) => {
        const deck = get().decks.find(d => d.id === deckId);
        if (!deck) return;

        set((store) => ({
            deckStates: {
                ...store.deckStates,
                [deckId]: {
                    deckId,
                    remainingIndices: DeckInterpreter.initializeIndices(deck),
                    discardedIndices: [],
                    currentCardIndex: null
                }
            }
        }));
    },

    selectDeck: (id) => {
        set({ selectedDeckId: id });
    },

    toggleProjection: () => {
        const wasProjecting = get().isProjecting;
        set({ isProjecting: !wasProjecting });

        import('../../image/useImageStore').then(async mod => {
            if (wasProjecting) {
                // ❌ Désactivation → vider les Hubs
                mod.useImageStore.getState().projectEntity(null);
                gmToast(i18next.t('modules:session.toasts.projection_off'), "info");
            } else {
                // ✅ Activation → projeter la carte courante si elle existe
                gmToast(i18next.t('modules:session.toasts.projection_on'), "info");

                // Chercher la carte active parmi tous les decks (prioriser activeDeckId si possible)
                const state = get();
                const decks = state.decks;
                const deckStates = state.deckStates;

                for (const deck of decks) {
                    const deckState = deckStates[deck.id];
                    if (deckState && deckState.currentCardIndex !== null) {
                        const card = deckState.currentCardIndex;
                        const cardImageUrl = DeckInterpreter.getCardImage(deck, card);
                        const metadata = DeckInterpreter.getCardMetadata(deck, card);
                        const cardName = metadata?.name || `Carte #${card + (deck.startAtZero ? 0 : 1)}`;

                        if (cardImageUrl) {
                            await mod.useImageStore.getState().projectEntity({
                                id: `card-${deck.id}-${card}-${Date.now()}`,
                                name: cardName,
                                subtitle: `Oracle : ${deck.name}`,
                                avatar: cardImageUrl,
                                type: 'Oracle',
                                lore: metadata?.description || ''
                            });
                        }
                        break; // Projeter seulement le premier deck avec une carte active
                    }
                }
            }
        });
    }
});
