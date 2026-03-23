import { describe, it, expect, beforeEach } from 'vitest';
import { useMapStore } from '../useMapStore';

describe('Danger Zone Presets Logic', () => {
    beforeEach(() => {
        // Reset or clear presets if needed, though useMapStore is a singleton in tests
    });

    it('should add a new danger zone preset', () => {
        const initialCount = useMapStore.getState().dangerZonePresets.length;
        const newPreset = {
            name: 'Test Lava',
            color: '#ff4400',
            hueSceneId: 'lava-hue'
        };

        useMapStore.getState().addDangerZonePreset(newPreset);
        
        const presets = useMapStore.getState().dangerZonePresets;
        expect(presets.length).toBe(initialCount + 1);
        const added = presets.find(p => p.name === 'Test Lava');
        expect(added).toBeDefined();
        expect(added?.id).toBeDefined();
        expect(added?.hueSceneId).toBe('lava-hue');
    });

    it('should update an existing preset', () => {
        const presets = useMapStore.getState().dangerZonePresets;
        const target = presets[0];
        const newName = 'Updated Name ' + Math.random();

        useMapStore.getState().updateDangerZonePreset(target.id, { name: newName });
        
        const updated = useMapStore.getState().dangerZonePresets.find(p => p.id === target.id);
        expect(updated?.name).toBe(newName);
    });

    it('should remove a preset', () => {
        const presets = useMapStore.getState().dangerZonePresets;
        const target = presets[presets.length - 1];
        const initialCount = presets.length;

        useMapStore.getState().removeDangerZonePreset(target.id);
        
        const finalPresets = useMapStore.getState().dangerZonePresets;
        expect(finalPresets.length).toBe(initialCount - 1);
        expect(finalPresets.find(p => p.id === target.id)).toBeUndefined();
    });
});
