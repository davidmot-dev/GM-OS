import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DiceEngine } from './DiceEngine';

describe('DiceEngine', () => {
    beforeEach(() => {
        // Mock Math.random to a known sequence or fixed value
        vi.spyOn(Math, 'random').mockReturnValue(0.5); // 0.5 * 6 = 3, + 1 = 4.
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should calculate multiple dice with modifiers (2d6+5) via parseAndRoll', () => {
        const result = DiceEngine.rollFormula('2d6+5');
        // 2 dice of 6 sides: both roll 4. Total = 4 + 4 + 5 = 13.
        expect(result.total).toBe(13);
        expect(result.rolls.length).toBe(2);
    });

    it('should handle formula with negative dice (2d6-1d4)', () => {
        // d6 -> 4, d4 -> 3
        const result = DiceEngine.rollFormula('2d6-1d4');
        expect(result.total).toBe(4 + 4 - 3);
        expect(result.rolls.length).toBe(3);
        expect(result.rolls[2].isCritMin).toBe(true); // Since it was negative it counts as critMin in our logic
    });

    it('should handle Digits Dice like d66', () => {
        // baseFace for d66 = 6. -> rolls 4 and 4 -> 44.
        const result = DiceEngine.rollDigits(66, 1, 0);
        expect(result.total).toBe(44);
        expect(result.rolls.length).toBe(2);
        expect(result.rolls[0].val).toBe(4);
    });

    it('should handle Exploding sum dice', () => {
        vi.spyOn(Math, 'random').mockReturnValueOnce(0.99).mockReturnValueOnce(0.5);
        // roll 6, then roll 4. total = 10
        const result = DiceEngine.rollStandard(6, 1, 0, true);
        expect(result.total).toBe(10);
        expect(result.rolls.length).toBe(2);
        expect(result.rolls[1].isExploded).toBe(true);
    });

    it('should handle Pool explode', () => {
        // 1d6 pool target 5. roll 6 (success, explode). then roll 4 (fail).
        vi.spyOn(Math, 'random').mockReturnValueOnce(0.99).mockReturnValueOnce(0.5);
        const result = DiceEngine.rollPool(6, 1, 0, 5, true);
        expect(result.successes).toBe(1);
        expect(result.rolls.length).toBe(2);
        expect(result.rolls[1].isExploded).toBe(true);
    });

    it('should handle Threshold under rule', () => {
        const result = DiceEngine.rollThreshold(20, 1, 0, 10, 'under');
        // rolled 11
        expect(result.total).toBe(11);
        expect(result.tagSuccess).toBe(false);
    });

    it('should handle YZE base and gear dice', () => {
        // mock for 6, 1, 3
        vi.spyOn(Math, 'random').mockReturnValueOnce(0.99).mockReturnValueOnce(0.01).mockReturnValue(0.5);
        const result = DiceEngine.rollYZE(2, 1);
        expect(result.successes).toBe(1);
        expect(result.fails).toBe(0);
    });
});
