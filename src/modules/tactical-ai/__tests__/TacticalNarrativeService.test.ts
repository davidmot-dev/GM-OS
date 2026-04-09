import { describe, it, expect } from 'vitest';
import { TacticalNarrativeService } from '../logic/TacticalNarrativeService';
import type { Combatant } from '../../combat/useCombatStore';
import type { MapToken, DangerZone } from '../../map/types';

describe('TacticalNarrativeService', () => {
    const mockActor: Partial<Combatant> = {
        id: '1',
        name: 'Elara',
        faction: 'Ami',
        hp: 20,
        hpMax: 20,
        statuses: []
    };

    const mockEnemies: Partial<Combatant>[] = [
        { id: '2', name: 'Orc 1', faction: 'Ennemi', hp: 10, hpMax: 10, statuses: [] },
        { id: '3', name: 'Orc 2', faction: 'Ennemi', hp: 5, hpMax: 10, statuses: [] }
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

        expect(report).toContain('SITUATION TACTIQUE POUR : Elara');
        expect(report).toContain('Orc 1 (Ennemi) à 1 cases [Portée Contact]');
        expect(report).toContain('Orc 2 (Ennemi) à 1 cases [Portée Contact]');
        expect(report).toContain('ALERTE : Elara est FLANQUÉ par Orc 1 et Orc 2 !');
        expect(report).toContain('DANGERS ENVIRONNEMENTAUX : Feu');
    });

    it('should handle missing tokens gracefully', () => {
        const report = TacticalNarrativeService.getSituationalReport(
            mockActor as Combatant,
            [mockActor] as Combatant[],
            [] as MapToken[],
            [] as DangerZone[]
        );

        expect(report).toContain("n'a pas de pion correspondant");
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
        expect(report).toContain('Santé globale du groupe Ami : 100%');
        expect(report).toContain('Santé globale du groupe adverse : 75%');
    });
});
