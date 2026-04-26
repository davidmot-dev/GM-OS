import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useDeckLibrary } from './useDeckLibrary';
import { useSessionOSStore } from '../useSessionOSStore';
import type { DeckManifest } from '../store/types';

// Mock store
vi.mock('../useSessionOSStore', () => ({
    useSessionOSStore: vi.fn()
}));

const mockDecks: DeckManifest[] = [
    { id: 'deck-1', name: 'Generic Deck', systemId: 'generic', folderPath: 'path/1', cardCount: 10, format: 'poker' as const, orientation: 'portrait' as const, useDiscard: true },
    { id: 'deck-2', name: 'Torg Deck', systemId: 'torg', folderPath: 'path/2', cardCount: 20, format: 'tarot' as const, orientation: 'landscape' as const, useDiscard: true }
];

const mockCampaigns = [
    { id: 'camp-1', name: 'Campaign 1', system: 'torg' }
];

describe('useDeckLibrary', () => {
    const mockStore = {
        decks: mockDecks,
        addDeck: vi.fn(),
        updateDeck: vi.fn(),
        deleteDeck: vi.fn(),
        activeCampaignId: 'camp-1',
        campaigns: mockCampaigns,
        customSheetTemplates: [],
        customGameDrivers: []
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (useSessionOSStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockStore);
    });

    it('filters decks by current system and generic', () => {
        const { result } = renderHook(() => useDeckLibrary());
        expect(result.current.filteredDecks).toHaveLength(2);
        expect(result.current.currentSystemId).toBe('torg');
    });

    it('manages addition state', () => {
        const { result } = renderHook(() => useDeckLibrary());
        expect(result.current.isAdding).toBe(false);
        
        act(() => {
            result.current.setIsAdding(true);
        });
        expect(result.current.isAdding).toBe(true);
    });

    it('populates form for editing', () => {
        const { result } = renderHook(() => useDeckLibrary());
        
        act(() => {
            result.current.handleEdit(mockDecks[1]); // Torg Deck
        });
        
        expect(result.current.editingDeckId).toBe('deck-2');
        expect(result.current.form.name).toBe('Torg Deck');
        expect(result.current.form.systemId).toBe('torg');
    });

    it('calls addDeck on handleSave for new deck', () => {
        const { result } = renderHook(() => useDeckLibrary());
        
        act(() => {
            result.current.form.setName('New Deck');
            result.current.form.setFolderPath('new/path');
        });
        
        act(() => {
            result.current.handleSave();
        });
        
        expect(mockStore.addDeck).toHaveBeenCalledWith(expect.objectContaining({
            name: 'New Deck',
            folderPath: 'new/path'
        }));
    });

    it('calls updateDeck on handleSave for existing deck', () => {
        const { result } = renderHook(() => useDeckLibrary());
        
        act(() => {
            result.current.handleEdit(mockDecks[1]);
        });
        
        act(() => {
            result.current.form.setName('Updated Torg Deck');
        });
        
        act(() => {
            result.current.handleSave();
        });
        
        expect(mockStore.updateDeck).toHaveBeenCalledWith('deck-2', expect.objectContaining({
            name: 'Updated Torg Deck'
        }));
    });
});
