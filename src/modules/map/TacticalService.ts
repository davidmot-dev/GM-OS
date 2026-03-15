
import type { MapToken } from './useMapStore';
import { GridEngine } from '../tactical-ai/logic/GridEngine';
import type { TacticalConfig } from '../../types/drivers';

export interface TacticalRange {
    category: 'Contact' | 'Courte' | 'Moyenne' | 'Longue' | 'Extrême';
    modifier: number;
    distancePx: number;
    distanceUnits: number;
}

export class TacticalService {
    private static instance: TacticalService;
    
    public static getInstance(): TacticalService {
        if (!TacticalService.instance) {
            TacticalService.instance = new TacticalService();
        }
        return TacticalService.instance;
    }

    public calculateDistance(tokenA: MapToken, tokenB: MapToken): number {
        return GridEngine.calculateDistance(
            { x: tokenA.x, y: tokenA.y },
            { x: tokenB.x, y: tokenB.y }
        );
    }

    static pxToUnits(px: number, gridSize: number = 50): number {
        return GridEngine.pxToUnits(px, gridSize);
    }

    public getRangeInfo(tokenA: MapToken, tokenB: MapToken, gridSize: number = 50, config?: TacticalConfig): TacticalRange {
        const distPx = this.calculateDistance(tokenA, tokenB);
        
        // Use GridEngine for unit conversion and system-driven thresholds
        const units = distPx / gridSize;
        const gridInfo = GridEngine.getRangeInfo(units, config);

        return {
            category: gridInfo.category,
            modifier: gridInfo.modifier,
            distancePx: distPx,
            distanceUnits: gridInfo.distanceUnits
        };
    }
}

export const tacticalService = TacticalService.getInstance();
