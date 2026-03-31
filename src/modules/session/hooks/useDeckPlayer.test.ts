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
    { id: 'deck-1', name: 'Deck 1', folderPath: 'path/1', cardCount: 1, format: 'poker' as const, orientation: 'portrait' as const, useDiscard: true, systemId: 'sys-1' }
];

const mockDeckStates = {
    'deck-1': { deckId: 'deck-1', remainingIndices: [1], discardedIndices: [], currentCardIndex: 1 }
};

describe('useDeckPlayer', () => {
    const mockStore = {
        decks: mockDecks,
        deckStates: mockDeckStates,
        drawCard: vi.fn(),
        discardCard: vi.fn(),
        shuffleDeck: vi.fn(),
        isProjecting: false,
        toggleProjection: vi.fn()
    };

    const mockImageStoreState = {
        projectEntity: vi.fn()
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (useSessionOSStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockStore);
        (useImageStore.getState as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockImageStoreState);
    });

    it('initializes with first deck as default', () => {
        const { result } = renderHook(() => useDeckPlayer());
        expect(result.current.activeDeckId).toBe('deck-1');
        expect(result.current.activeDeck).toEqual(mockDecks[0]);
    });

    it('computes card URLs correctly', () => {
        const { result } = renderHook(() => useDeckPlayer());
        // card_1.png (shifted by 1 as startAtZero defaults to false)
        expect(result.current.cardBackUrl).toBe('path/1/back.png');
        expect(result.current.currentCardUrl).toBe('path/1/card_1.png');
    });

    it('handles flip and updates state locally', () => {
        const { result } = renderHook(() => useDeckPlayer());
        expect(result.current.isFlipped).toBe(false);
        
        act(() => {
            result.current.handleFlip();
        });
        
        expect(result.current.isFlipped).toBe(true);
        expect(mockImageStoreState.projectEntity).not.toHaveBeenCalled();
    });

    it('syncs flip with projection when active', () => {
        mockStore.isProjecting = true;
        const { result } = renderHook(() => useDeckPlayer());
        
        act(() => {
            result.current.handleFlip();
        });
        
        expect(mockImageStoreState.projectEntity).toHaveBeenCalledWith(expect.objectContaining({
            name: '▪▪▪ Carte Cachée ▪▪▪'
        }));
    });

    it('handles draw', () => {
        const { result } = renderHook(() => useDeckPlayer());
        
        act(() => {
            result.current.handleDraw();
        });
        
        expect(mockStore.drawCard).toHaveBeenCalledWith('deck-1');
        expect(result.current.isFlipped).toBe(false);
        expect(result.current.drawCount).toBe(1);
    });
});
