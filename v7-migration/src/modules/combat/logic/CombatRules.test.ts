import { describe, it, expect, vi } from 'vitest';
import { 
    calculateDamageImpact, 
    resolveInitiativeFormula, 
    filterConflictingStatuses,
    processStatusDurations
} from './CombatRules';
import type { Combatant } from '../types';

describe('CombatRules Engine', () => {
    
    const mockCombatant: Combatant = {
        id: '1',
        name: 'Target',
        hp: 50,
        hpMax: 100,
        init: 0,
        isPlayer: false,
        faction: 'enemy',
        statuses: [],
        resistances: ['feu'],
        vulnerabilities: ['foudre'],
        immunities: ['poison']
    };

    describe('calculateDamageImpact', () => {
        it('should calculate normal damage', () => {
            const res = calculateDamageImpact({ amount: 10, type: 'physique', target: mockCombatant });
            expect(res.finalAmount).toBe(10);
            expect(res.newHp).toBe(40);
        });

        it('should handle resistance (half damage)', () => {
            const res = calculateDamageImpact({ amount: 20, type: 'feu', target: mockCombatant });
            expect(res.finalAmount).toBe(10);
            expect(res.newHp).toBe(40);
        });

        it('should handle vulnerability (double damage)', () => {
            const res = calculateDamageImpact({ amount: 10, type: 'foudre', target: mockCombatant });
            expect(res.finalAmount).toBe(20);
            expect(res.newHp).toBe(30);
        });

        it('should handle immunity (zero damage)', () => {
            const res = calculateDamageImpact({ amount: 99, type: 'poison', target: mockCombatant });
            expect(res.finalAmount).toBe(0);
            expect(res.newHp).toBe(50);
        });

        it('should apply auto status according to type', () => {
            const res = calculateDamageImpact({ amount: 5, type: 'feu', target: mockCombatant });
            expect(res.statusToAdd?.name).toBe('En feu');
        });

        it('should handle healing', () => {
            const res = calculateDamageImpact({ amount: -20, type: 'soin', target: mockCombatant });
            expect(res.finalAmount).toBe(-20);
            expect(res.newHp).toBe(70);
            expect(res.statusToAdd?.name).toBe('Soin');
        });

        it('should cap HP at hpMax', () => {
            const res = calculateDamageImpact({ amount: -100, type: 'soin', target: mockCombatant });
            expect(res.newHp).toBe(100);
        });
    });

    describe('filterConflictingStatuses', () => {
        it('should remove conflicting statuses', () => {
            const current = [
                { id: 'a', name: 'Mouillé', duration: 3, icon: '💧' }
            ];
            const filtered = filterConflictingStatuses(current, 'En feu');
            expect(filtered).toHaveLength(0);
        });

        it('should keep non-conflicting statuses', () => {
            const current = [
                { id: 'a', name: 'Béni', duration: 0, icon: '✨' }
            ];
            const filtered = filterConflictingStatuses(current, 'En feu');
            expect(filtered).toHaveLength(1);
            expect(filtered[0].name).toBe('Béni');
        });
    });

    describe('resolveInitiativeFormula', () => {
        it('should resolve a simple formula', () => {
            const init = resolveInitiativeFormula({ 
                formula: '10+5', 
                combatant: mockCombatant 
            });
            expect(init).toBe(15);
        });

        it('should resolve variables with resolver', () => {
            const resolver = vi.fn().mockReturnValue(5);
            const init = resolveInitiativeFormula({ 
                formula: '1d1+[Dex]', 
                combatant: mockCombatant,
                resolver
            });
            expect(resolver).toHaveBeenCalledWith('Dex', mockCombatant);
            expect(init).toBe(6);
        });
    });

    describe('processStatusDurations', () => {
        it('should reduce durations by 1', () => {
            const statuses = [
                { id: '1', name: 'A', duration: 3, icon: '' },
                { id: '2', name: 'B', duration: 1, icon: '' }
            ];
            const processed = processStatusDurations(statuses);
            expect(processed).toHaveLength(1);
            expect(processed[0].duration).toBe(2);
        });

        it('should keep permanent statuses (duration 0)', () => {
            const statuses = [
                { id: '1', name: 'P', duration: 0, icon: '' }
            ];
            const processed = processStatusDurations(statuses);
            expect(processed).toHaveLength(1);
            expect(processed[0].duration).toBe(0);
        });
    });
});
