import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useMapStore } from '../useMapStore';

// Mock dependances if needed
vi.mock('../../journal/useJournalStore', () => ({
    useJournalStore: {
        getState: () => ({
            addEvent: vi.fn()
        })
    }
}));

describe('MapFogRegistry', () => {
    beforeEach(() => {
        // Reset state before each test
        useMapStore.setState({
            mapUrl: null,
            fogDataUrl: null,
            fogRegistry: {},
            layerVisibility: {
                fog: true,
                grid: true,
                tokens: true,
                magic: true,
                danger: true,
                weather: true,
                ambiance: true
            }
        });
    });

    it('should save fog to registry when setFogDataUrl is called', async () => {
        const store = useMapStore.getState();
        await store.setMap('map-1', false, 'Map One');
        
        await store.setFogDataUrl('data:image/png;base64,fog1');
        
        const state = useMapStore.getState();
        expect(state.fogRegistry['map-1']).toBe('data:image/png;base64,fog1');
        expect(state.fogDataUrl).toBe('data:image/png;base64,fog1');
    });

    it('should load fog from registry when switching back to a map', async () => {
        const store = useMapStore.getState();
        
        // Setup registry
        useMapStore.setState({
            fogRegistry: {
                'map-1': 'data:image/png;base64,fog1',
                'map-2': 'data:image/png;base64,fog2'
            }
        });

        // Load map 1
        await store.setMap('map-1', false, 'Map One');
        expect(useMapStore.getState().fogDataUrl).toBe('data:image/png;base64,fog1');

        // Switch to map 2
        await store.setMap('map-2', false, 'Map Two');
        expect(useMapStore.getState().fogDataUrl).toBe('data:image/png;base64,fog2');
    });

    it('should reset fog to null if map is not in registry', async () => {
        const store = useMapStore.getState();
        
        await store.setMap('map-1', false, 'Map One');
        await store.setFogDataUrl('data:image/png;base64,fog1');
        
        // Switch to unknown map
        await store.setMap('map-new', false, 'New Map');
        expect(useMapStore.getState().fogDataUrl).toBe(null);
    });

    it('should toggle layer visibility', () => {
        const store = useMapStore.getState();
        
        expect(useMapStore.getState().layerVisibility.fog).toBe(true);
        
        store.toggleLayer('fog');
        expect(useMapStore.getState().layerVisibility.fog).toBe(false);
        
        store.toggleLayer('fog');
        expect(useMapStore.getState().layerVisibility.fog).toBe(true);
    });
});
