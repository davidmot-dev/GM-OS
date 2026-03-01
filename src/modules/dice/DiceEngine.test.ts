import { describe, it, expect, vi } from 'vitest';
import { DiceEngine } from './DiceEngine';

describe('DiceEngine', () => {
    describe('roll()', () => {
        it('devrait retourner un nombre entre 1 et N', () => {
            for (let i = 0; i < 100; i++) {
                const result = DiceEngine.roll(6);
                expect(result).toBeGreaterThanOrEqual(1);
                expect(result).toBeLessThanOrEqual(6);
            }
        });

        it('devrait retourner 0 si le nombre de faces est inférieur à 1', () => {
            expect(DiceEngine.roll(0)).toBe(0);
            expect(DiceEngine.roll(-1)).toBe(0);
        });
    });

    describe('parseAndRoll()', () => {
        it('devrait analyser correctement "2d6+5"', () => {
            // On mock Math.random pour avoir des résultats prévisibles
            const spy = vi.spyOn(Math, 'random')
                .mockReturnValueOnce(0) // d6 -> 1
                .mockReturnValueOnce(0.999); // d6 -> 6

            const { total, rolls, modifier } = DiceEngine.parseAndRoll('2d6+5');

            expect(total).toBe(12); // 1 + 6 + 5
            expect(rolls).toEqual([1, 6]);
            expect(modifier).toBe(5);

            spy.mockRestore();
        });

        it('devrait fonctionner sans modificateur (ex: "1d20")', () => {
            const spy = vi.spyOn(Math, 'random').mockReturnValue(0.5); // d20 -> 11
            const { total, rolls, modifier } = DiceEngine.parseAndRoll('1d20');

            expect(total).toBe(11);
            expect(modifier).toBe(0);
            spy.mockRestore();
        });

        it('devrait gérer les modificateurs négatifs (ex: "1d10-2")', () => {
            const spy = vi.spyOn(Math, 'random').mockReturnValue(0.9); // d10 -> 10
            const { total, modifier } = DiceEngine.parseAndRoll('1d10-2');

            expect(total).toBe(8);
            expect(modifier).toBe(-2);
            spy.mockRestore();
        });

        it('devrait lever une erreur pour un format invalide', () => {
            expect(() => DiceEngine.parseAndRoll('invalid')).toThrow("Format de formule invalide");
            expect(() => DiceEngine.parseAndRoll('d6')).toThrow("Format de formule invalide");
        });
    });
});
