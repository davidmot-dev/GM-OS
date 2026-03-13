
import { describe, it, expect } from 'vitest';
import { TacticalService } from './TacticalService';
import type { MapToken } from './useMapStore';

describe('TacticalService', () => {
    const service = TacticalService.getInstance();
    const tokenA: MapToken = { id: 'a', name: 'Attacker', avatar: '', x: 0, y: 0, size: 1 };
    
    it('should calculate contact range correctly', () => {
        const tokenB: MapToken = { id: 'b', name: 'Target', avatar: '', x: 10, y: 10, size: 1 }; // Dist ~14px
        const info = service.getRangeInfo(tokenA, tokenB, 50);
        expect(info.category).toBe('Contact');
        expect(info.modifier).toBe(-3);
    });

    it('should calculate short range correctly', () => {
        const tokenB: MapToken = { id: 'b', name: 'Target', avatar: '', x: 70, y: 0, size: 1 }; // Dist 70px (1.4 units)
        const info = service.getRangeInfo(tokenA, tokenB, 50);
        expect(info.category).toBe('Courte');
        expect(info.modifier).toBe(0);
    });

    it('should calculate extreme range correctly', () => {
        const tokenB: MapToken = { id: 'b', name: 'Target', avatar: '', x: 1000, y: 0, size: 1 }; // Dist 1000px (20 units)
        const info = service.getRangeInfo(tokenA, tokenB, 50);
        expect(info.category).toBe('Extrême');
        expect(info.modifier).toBe(-3);
    });
});
