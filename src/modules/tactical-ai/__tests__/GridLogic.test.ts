import { describe, it, expect } from 'vitest';
import { GridEngine } from '../logic/GridEngine';
import type { Combatant } from '../../combat/useCombatStore';
import { tacticalService } from '../../map/TacticalService';
import type { MapToken } from '../../map/types';
import type { TacticalConfig } from '../../../types/drivers';

describe('Sprint 2: Grid & Logic', () => {
  describe('GridEngine', () => {
    it('should calculate Euclidean distance correctly', () => {
      const p1 = { x: 0, y: 0 };
      const p2 = { x: 30, y: 40 }; // 3-4-5 triangle
      const dist = GridEngine.calculateDistance(p1, p2);
      expect(dist).toBe(50);
    });

    it('should translate px to units correctly', () => {
      expect(GridEngine.pxToUnits(100, 50)).toBe(2);
      expect(GridEngine.pxToUnits(75, 50)).toBe(1.5);
    });

    it('should resolve range categories correctly', () => {
      expect(GridEngine.getRangeInfo(0.2).category).toBe('Contact');
      expect(GridEngine.getRangeInfo(1.5).category).toBe('Contact');
      expect(GridEngine.getRangeInfo(3.0).category).toBe('Courte');
      expect(GridEngine.getRangeInfo(10.0).category).toBe('Moyenne');
      expect(GridEngine.getRangeInfo(40.0).category).toBe('Longue');
      expect(GridEngine.getRangeInfo(100.0).category).toBe('Extrême');
    });

    it('should identify conflicting statuses', () => {
      const mockCombatant = {
        name: 'Test',
        statuses: [
          { name: 'En feu' },
          { name: 'Mouillé' }
        ]
      } as unknown as Combatant;
      const conflicts = GridEngine.getConflictingStatuses(mockCombatant);
      expect(conflicts).toContain('Mouillé');
      expect(conflicts).toContain('En feu');
    });
  });
});

/**
 * **Le test que le plan du 2026-08-07 réclamait, et qui n'avait jamais été
 * écrit.**
 *
 * *« Ajouter un test qui vérifie que les trois appelants produisent la même
 * catégorie pour la même distance — c'est la cohérence entre modules qui a
 * manqué, pas le calcul lui-même. »* (axe 1)
 *
 * Le défaut d'origine : `TacticalNarrativeService` ne transmettait pas la
 * configuration tactique du système à `GridEngine`, là où le pupitre et
 * l'orchestrateur la transmettaient. **Le même combattant à la même distance
 * était donc « Courte » sur un écran et « Contact » sur l'autre**, sans que rien
 * ne le signale — et c'est le rapport envoyé au modèle qui avait tort.
 */
describe('les appelants s’accordent sur la même distance', () => {
    const config: TacticalConfig = {
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

    /** Deux jetons séparés d'un nombre d'unités donné, sur une grille de 50 px. */
    const jetons = (unites: number) => [
        { id: 'a', name: 'A', x: 0, y: 0 } as MapToken,
        { id: 'b', name: 'B', x: unites * 50, y: 0 } as MapToken,
    ] as const;

    it('rendent la même bande, avec et sans configuration', () => {
        for (const unites of [0.5, 1, 1.8, 2.5, 3.5, 4.5, 10]) {
            const [a, b] = jetons(unites);

            // Le moteur, seule source du calcul.
            const duMoteur = GridEngine.getRangeInfo(unites, config);
            // La carte, qui passe par les pixels avant d'y revenir.
            const deLaCarte = tacticalService.getRangeInfo(a, b, 50, config);

            expect(deLaCarte.category, `à ${unites} unités`).toBe(duMoteur.category);
            expect(deLaCarte.modifier, `à ${unites} unités`).toBe(duMoteur.modifier);
        }
    });

    it('rendent la bande du PILOTE, et non celle du repli, dès qu’il en déclare une', () => {
        // Le repli interne place « Courte » jusqu'à 3,5 unités ; cette
        // configuration l'arrête à 2. Une distance de 3 sépare donc les deux —
        // c'est exactement l'écart que le défaut d'origine produisait.
        expect(GridEngine.getRangeInfo(3).category, 'sans pilote').toBe('Courte');
        expect(GridEngine.getRangeInfo(3, config).category, 'avec pilote').toBe('Moyenne');
    });

    it('portent le nom que le pilote donne à la bande', () => {
        expect(GridEngine.getRangeInfo(1, config).label).toBe('au toucher');
        // Sans pilote, le nom canonique — jamais un vide.
        expect(GridEngine.getRangeInfo(1).label).toBe('Contact');
    });
});
