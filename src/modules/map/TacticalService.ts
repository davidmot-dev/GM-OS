
import type { MapToken } from './useMapStore';

export interface TacticalRange {
    category: 'Contact' | 'Courte' | 'Moyenne' | 'Longue' | 'Extrême';
    modifier: number;
    distancePx: number;
    distanceUnits: number;
}

export class TacticalService {
    private static instance: TacticalService;
    
    // Default Pixels Per Unit (e.g., 50px = 2 meters)
    private pixelsPerUnit = 50; 

    public static getInstance(): TacticalService {
        if (!TacticalService.instance) {
            TacticalService.instance = new TacticalService();
        }
        return TacticalService.instance;
    }

    public calculateDistance(tokenA: MapToken, tokenB: MapToken): number {
        const dx = tokenA.x - tokenB.x;
        const dy = tokenA.y - tokenB.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    public getRangeInfo(tokenA: MapToken, tokenB: MapToken, gridSize: number = 50): TacticalRange {
        const distPx = this.calculateDistance(tokenA, tokenB);
        const units = distPx / gridSize;

        // Thresholds based on Alien RPG (simplified for 2m/grid squares)
        // Contact: < 0.5 units
        // Courte: < 1.5 units (same zone)
        // Moyenne: < 5 units (adj zones (~10-15m))
        // Longue: < 15 units (~30-50m)
        // Extrême: > 15 units

        let category: TacticalRange['category'] = 'Extrême';
        let modifier = -3;

        if (units < 0.45) {
            category = 'Contact';
            modifier = -3; // Harder to shoot at contact unless defenseless (+3 in Alien)
        } else if (units < 2) {
            category = 'Courte';
            modifier = 0;
        } else if (units < 6) {
            category = 'Moyenne';
            modifier = -1;
        } else if (units < 15) {
            category = 'Longue';
            modifier = -2;
        }

        return {
            category,
            modifier,
            distancePx: distPx,
            distanceUnits: Math.round(units * 10) / 10
        };
    }
}

export const tacticalService = TacticalService.getInstance();
