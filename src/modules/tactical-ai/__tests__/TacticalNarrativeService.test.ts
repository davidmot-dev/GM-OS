import { describe, it, expect } from 'vitest';
import { TacticalNarrativeService } from '../logic/TacticalNarrativeService';
import type { Combatant } from '../../combat/useCombatStore';
import type { MapToken, DangerZone } from '../../map/types';
import type { TacticalConfig } from '../../../types/drivers';

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
        expect(report).toContain('* Orc 1 à 1 unités [Portée Contact]');
        expect(report).toContain('* Orc 2 à 1 unités [Portée Contact]');
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

    /**
     * **Le rapport parle la langue DU JEU.**
     *
     * Il écrivait « à 3 cases » sur tous les systèmes, alors qu'Alien compte en
     * zones et d'autres en mètres — *une convention d'un système appliquée à
     * tous.* Et il annonçait « Portée Contact » quand le pilote déclare « au
     * toucher » : cinq libellés collectés par la Forge depuis les fiches, et
     * rien ne les lisait. **Un champ rempli que rien ne lit est un champ qui
     * finira faux sans qu'on le sache.**
     */
    const configZones: TacticalConfig = {
        uniteDeDistance: 'zones',
        useTacticalAI: true,
        ranges: {
            contact: { label: 'au toucher', maxUnits: 1, modifier: 0 },
            courte: { label: 'tranche courte', maxUnits: 2, modifier: 0 },
            moyenne: { label: 'tranche moyenne', maxUnits: 3, modifier: -1 },
            longue: { label: 'tranche longue', maxUnits: 4, modifier: -2 },
            extreme: { label: 'hors de portée', maxUnits: 5, modifier: -3 },
        },
    };

    it("emploie l'unité du pilote, et le nom qu'il donne à la bande", () => {
        const report = TacticalNarrativeService.getSituationalReport(
            mockActor as Combatant,
            [mockActor, ...mockEnemies] as Combatant[],
            mockTokens as MapToken[],
            [] as DangerZone[],
            50,
            undefined,
            configZones,
        );

        expect(report).toContain('à 1 zones');
        expect(report, 'la bande porte le nom du jeu').toContain('[Portée au toucher]');
        expect(report, 'et plus jamais la grille de personne').not.toContain('cases');
    });

    it('dit « unités » quand le pilote ne nomme rien — jamais « cases »', () => {
        // *On ne remplace pas une convention inventée par une autre.* Sans
        // déclaration, le mot ne prétend ni grille, ni mètre, ni zone.
        const report = TacticalNarrativeService.getSituationalReport(
            mockActor as Combatant,
            [mockActor, ...mockEnemies] as Combatant[],
            mockTokens as MapToken[],
            [] as DangerZone[],
        );

        expect(report).toContain('à 1 unités');
        expect(report).not.toContain('cases');
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
