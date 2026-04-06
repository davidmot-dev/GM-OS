import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useRuleEngine } from './useRuleEngine';
import { useSessionOSStore } from '../useSessionOSStore';
import { useGemStore } from '../../../stores/useGemStore';

// Mock the sessionOS store
vi.mock('../useSessionOSStore', () => ({
    useSessionOSStore: vi.fn()
}));

// Mock the gem store
vi.mock('../../../stores/useGemStore', () => ({
    useGemStore: vi.fn()
}));

// Mock toast
vi.mock('../../../stores/useToastStore', () => ({
    gmToast: vi.fn()
}));

// Mock persona service
vi.mock('../../ai/PersonaGeneratorService', () => ({
    personaGeneratorService: {
        generateAllPersonas: vi.fn().mockResolvedValue({ 'gem-1': 'AI instructions' })
    }
}));

describe('useRuleEngine', () => {
    const mockDriver = {
        id: 'engine-1',
        name: 'D&D 5e',
        dice: { engine: 'standard', defaultDice: '1d20', logic: 'sum' },
        combat: {
            initiativeFormula: 'dex',
            statsToTrack: [],
            defaultHealthType: 'hp'
        },
        tactical: {
            useTacticalAI: true,
            ranges: {
                contact: { label: 'Contact', maxUnits: 1, modifier: 0 }
            }
        }
    };

    const mockStore = {
        editingDriverId: 'engine-1',
        customGameDrivers: [mockDriver],
        getGameDriver: vi.fn().mockReturnValue(mockDriver),
        setEditingDriverId: vi.fn(),
        updateGameDriver: vi.fn(),
        setCurrentView: vi.fn(),
        customSheetTemplates: []
    };

    const mockGemStore = {
        gems: [{ id: 'gem-1', name: 'Alchemist', icon: 'Beaker' }],
        syncGemsWithDefaults: vi.fn()
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (useSessionOSStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector: (state: typeof mockStore) => unknown) => {
            if (typeof selector === 'function') {
                return selector(mockStore);
            }
            return mockStore;
        });
        (useGemStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockGemStore);
    });

    it('returns the editing driver properly', () => {
        const { result } = renderHook(() => useRuleEngine());
        expect(result.current.driver).toEqual(mockDriver);
        expect(result.current.activeSection).toBe('core');
        expect(mockStore.getGameDriver).toHaveBeenCalledWith('engine-1');
    });

    it('syncs gems on mount', () => {
        renderHook(() => useRuleEngine());
        expect(mockGemStore.syncGemsWithDefaults).toHaveBeenCalled();
    });

    it('handles tab changes', () => {
        const { result } = renderHook(() => useRuleEngine());
        act(() => {
            result.current.setActiveSection('combat');
        });
        expect(result.current.activeSection).toBe('combat');
    });

    it('calls updateGameDriver on handleUpdate', () => {
        const { result } = renderHook(() => useRuleEngine());
        act(() => {
            result.current.handleUpdate({ name: 'Pathfinder' });
        });
        expect(mockStore.updateGameDriver).toHaveBeenCalledWith('engine-1', { name: 'Pathfinder' });
    });

    it('exits editing mode on handleBack', () => {
        const { result } = renderHook(() => useRuleEngine());
        act(() => {
            result.current.handleBack();
        });
        expect(mockStore.setEditingDriverId).toHaveBeenCalledWith(null);
        expect(mockStore.setCurrentView).toHaveBeenCalledWith('templates');
    });
});
