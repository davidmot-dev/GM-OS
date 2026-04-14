import { describe, it, expect } from 'vitest';
import { TacticalNarrativeService } from '../logic/TacticalNarrativeService';
import type { Combatant } from '../../combat/useCombatStore';
import type { MapToken, DangerZone } from '../../map/types';

describe('TacticalNarrativeService', () => {
    const mockActor: Partial<Combatant> = {
        id: '1',
        name: 'Elara',
        faction: 'player',
        hp: 20,
        hpMax: 20,
        statuses: []
    };

    const mockEnemies: Partial<Combatant>[] = [
        { id: '2', name: 'Orc 1', faction: 'enemy', hp: 10, hpMax: 10, statuses: [] },
        { id: '3', name: 'Orc 2', faction: 'enemy', hp: 5, hpMax: 10, statuses: [] }
    ];

    const mockTokens: Partial<MapToken>[] = [
        { id: 't1', name: 'Elara', x: 100, y: 100 },
        { id: 't2', name: 'Orc 1', x: 150, y: 100 }, // 50px away (1 unit)
        { id: 't3', name: 'Orc 2', x: 50, y: 100 }   // 50px away (1 unit)
    ];

    const mockZones: Partial<DangerZone>[] = [
        { id: 'z1', name: 'Feu', x: 110, y: 110, radius: 1 }
    ];

    it('should generate a correct narrative report', () => {
        const report = TacticalNarrativeService.getSituationalReport(
            mockActor as Combatant,
            [mockActor, ...mockEnemies] as Combatant[],
            mockTokens as MapToken[],
            mockZones as DangerZone[],
            50
        );

        expect(report).toContain('## ANALYSE TACTIQUE MICRO : Elara');
        expect(report).toContain('* Orc 1 à 1 cases [Portée Contact]');
        expect(report).toContain('* Orc 2 à 1 cases [Portée Contact]');
        expect(report).toContain('ALERTE : FLANQUÉ par Orc 1 et Orc 2 !');
        expect(report).toContain('RISQUES TERRAIN : Feu');
    });

    it('should handle missing tokens gracefully', () => {
        const report = TacticalNarrativeService.getSituationalReport(
            mockActor as Combatant,
            [mockActor] as Combatant[],
            [] as MapToken[],
            [] as DangerZone[]
        );

        expect(report).toContain("Absent de la carte Atlas");
    });

    it('should calculate faction health correctly', () => {
        const report = TacticalNarrativeService.getSituationalReport(
            mockActor as Combatant,
            [mockActor, ...mockEnemies] as Combatant[],
            mockTokens as MapToken[],
            [] as DangerZone[]
        );

        // My faction: Elara (20/20) = 100%
        // Enemy faction: Orc 1 (10/10) + Orc 2 (5/10) = 15/20 = 75%
        expect(report).toContain('Morphologie du Combat : Allies 100% vs Enemies 75%');
    });
});
