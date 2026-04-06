import { describe, it, expect } from 'vitest';
import { GridEngine } from '../logic/GridEngine';
import type { Combatant } from '../../combat/useCombatStore';

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
