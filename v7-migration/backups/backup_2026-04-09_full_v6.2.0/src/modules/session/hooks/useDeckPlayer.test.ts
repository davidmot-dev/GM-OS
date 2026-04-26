import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useDeckPlayer } from './useDeckPlayer';
import { useSessionOSStore } from '../useSessionOSStore';
import { useImageStore } from '../../image/useImageStore';
import type { DeckManifest } from '../store/types';

// Mock stores
vi.mock('../useSessionOSStore', () => ({
    useSessionOSStore: vi.fn()
}));

vi.mock('../../image/useImageStore', () => ({
    useImageStore: {
        getState: vi.fn()
    }
}));

const mockDecks: DeckManifest[] = [
    { id: 'deck-1', name: 'Deck 1', folderPath: 'path/1', cardCount: 1, format: 'poker' as const, orientation: 'portrait' as const, useDiscard: true, systemId: 'sys-1' },
    { id: 'deck-generic', name: 'Loot', folderPath: 'path/gen', cardCount: 10, format: 'poker' as const, orientation: 'portrait' as const, useDiscard: false, systemId: 'generic' }
];

const mockDeckStates = {
    'deck-1': { deckId: 'deck-1', remainingIndices: [1], discardedIndices: [], currentCardIndex: 1 },
    'deck-generic': { deckId: 'deck-generic', remainingIndices: [1, 2, 3], discardedIndices: [], currentCardIndex: 2 }
};

describe('useDeckPlayer', () => {
    let mockStore: {
        decks: DeckManifest[];
        deckStates: Record<string, { deckId: string; remainingIndices: number[]; discardedIndices: number[]; currentCardIndex: number | null }>;
        drawCard: ReturnType<typeof vi.fn>;
        discardCard: ReturnType<typeof vi.fn>;
        shuffleDeck: ReturnType<typeof vi.fn>;
        isProjecting: boolean;
        toggleProjection: ReturnType<typeof vi.fn>;
        selectedDeckId: string | null;
        selectDeck: ReturnType<typeof vi.fn>;
        activeCampaignId: string;
        campaigns: { id: string; name: string; system: string }[];
    };

    const mockImageStoreState = {
        projectEntity: vi.fn()
    };

    beforeEach(() => {
        vi.clearAllMocks();
        mockStore = {
            decks: mockDecks,
            deckStates: mockDeckStates,
            drawCard: vi.fn(),
            discardCard: vi.fn(),
            shuffleDeck: vi.fn(),
            isProjecting: false,
            toggleProjection: vi.fn(),
            selectedDeckId: null,
            selectDeck: vi.fn(),
            activeCampaignId: 'c-1',
            campaigns: [{ id: 'c-1', name: 'Test', system: 'sys-1' }]
        };
        (useSessionOSStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockStore);
        (useImageStore.getState as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockImageStoreState);
    });

    it('initializes with matching system deck', () => {
        const { result } = renderHook(() => useDeckPlayer());
        expect(result.current.activeDeckId).toBe('deck-1');
        expect(result.current.activeDeck?.name).toBe('Deck 1');
    });

    it('falls back to generic deck if system match is missing', () => {
        mockStore.campaigns = [{ id: 'c-1', name: 'Other', system: 'other-sys' }];
        const { result } = renderHook(() => useDeckPlayer());
        expect(result.current.activeDeckId).toBe('deck-generic');
    });

    it('returns null if no matching system or generic deck is found', () => {
        mockStore.decks = [mockDecks[0]]; // Only sys-1
        mockStore.campaigns = [{ id: 'c-1', name: 'Other', system: 'other-sys' }];
        const { result } = renderHook(() => useDeckPlayer());
        expect(result.current.activeDeckId).toBe(null);
        expect(result.current.activeDeck).toBeUndefined();
    });

    it('prioritizes explicit selectedDeckId even if system mismatches', () => {
        mockStore.selectedDeckId = 'deck-1';
        mockStore.campaigns = [{ id: 'c-1', name: 'Generic', system: 'generic' }];
        const { result } = renderHook(() => useDeckPlayer());
        expect(result.current.activeDeckId).toBe('deck-1');
    });

    it('computes card URLs correctly', () => {
        const { result } = renderHook(() => useDeckPlayer());
        expect(result.current.cardBackUrl).toBe('path/1/back.png');
        expect(result.current.currentCardUrl).toBe('path/1/card_1.png');
    });

    it('handles flip and updates state locally', () => {
        const { result } = renderHook(() => useDeckPlayer());
        expect(result.current.isFlipped).toBe(false);
        act(() => { result.current.handleFlip(); });
        expect(result.current.isFlipped).toBe(true);
    });

    it('syncs flip with projection when active', () => {
        mockStore.isProjecting = true;
        const { result } = renderHook(() => useDeckPlayer());
        act(() => { result.current.handleFlip(); });
        expect(mockImageStoreState.projectEntity).toHaveBeenCalledWith(expect.objectContaining({
            name: '▪▪▪ Carte Cachée ▪▪▪'
        }));
    });
});
