import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useCampaignEditor } from './useCampaignEditor';
import { useSessionOSStore } from '../store/index';
import { useGemStore } from '../../../stores/useGemStore';

// Mock stores
vi.mock('../store/index', () => ({
    useSessionOSStore: vi.fn()
}));

vi.mock('../../../stores/useGemStore', () => ({
    useGemStore: vi.fn()
}));

vi.mock('../../../stores/useToastStore', () => ({
    gmToast: vi.fn()
}));

vi.mock('../../ai/PersonaGeneratorService', () => ({
    personaGeneratorService: {
        generateAllPersonas: vi.fn().mockResolvedValue({ 'gem-1': 'AI instructions' })
    }
}));

describe('useCampaignEditor', () => {
    const mockCampaign = {
        id: 'c-1',
        name: 'The Great Campaign',
        system: 'dnd5e',
        description: 'A magical realm',
        synopsis: 'Save the world',
        activeLocationIds: ['loc-1']
    };

    const mockStore = {
        campaigns: [mockCampaign],
        activeCampaignId: 'c-1',
        atlasMaps: [{ id: 'map-1', campaignId: 'c-1', name: 'World Map' }],
        addCampaign: vi.fn(),
        updateCampaign: vi.fn(),
        activeCampaignFormSection: 'identity',
        setActiveCampaignFormSection: vi.fn(),
        customSheetTemplates: [],
        customGameDrivers: []
    };

    const mockGemStore = {
        gems: [{ id: 'gem-1', name: 'Alchemist', icon: 'Beaker' }],
        syncGemsWithDefaults: vi.fn()
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (useSessionOSStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockStore);
        (useGemStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockGemStore);
    });

    it('initializes with active campaign when not new', () => {
        const { result } = renderHook(() => useCampaignEditor({ onClose: vi.fn() }));
        expect(result.current.fullCampaign).toEqual(mockCampaign);
        expect(result.current.name).toBe('The Great Campaign');
        expect(result.current.isEdit).toBe(true);
    });

    it('initializes empty state when isNew is true', () => {
        const { result } = renderHook(() => useCampaignEditor({ isNew: true, onClose: vi.fn() }));
        expect(result.current.fullCampaign).toBeUndefined();
        expect(result.current.name).toBe('');
        expect(result.current.isEdit).toBe(false);
    });

    it('handles form submission for existing campaign', () => {
        const onClose = vi.fn();
        const { result } = renderHook(() => useCampaignEditor({ onClose }));
        
        act(() => {
            result.current.setName('Updated Name');
        });
        
        act(() => {
            result.current.handleSubmit();
        });
        
        expect(mockStore.updateCampaign).toHaveBeenCalledWith('c-1', expect.objectContaining({ name: 'Updated Name' }));
        expect(onClose).toHaveBeenCalled();
    });

    it('handles form submission for new campaign', () => {
        const onClose = vi.fn();
        // Since isNew = true, fullCampaign will be undefined
        const { result } = renderHook(() => useCampaignEditor({ isNew: true, onClose }));
        
        act(() => {
            result.current.setName('Brand New Campaign');
            result.current.setSystem('generic');
        });
        
        act(() => {
            result.current.handleSubmit();
        });
        
        expect(mockStore.addCampaign).toHaveBeenCalledWith(expect.objectContaining({
            name: 'Brand New Campaign',
            system: 'generic'
        }));
        expect(onClose).toHaveBeenCalled();
    });
});
