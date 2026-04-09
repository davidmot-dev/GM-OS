import { describe, it, expect } from 'vitest';
import { calculationEngine } from './CalculationEngine';

describe('CalculationEngine', () => {
    it('should perform basic math', () => {
        expect(calculationEngine.evaluate('10 + 5')).toBe(15);
        expect(calculationEngine.evaluate('10 * 2')).toBe(20);
        expect(calculationEngine.evaluate('10 / 2')).toBe(5);
        expect(calculationEngine.evaluate('2 ^ 3')).toBe(8);
        expect(calculationEngine.evaluate('10 - 2 * 3')).toBe(4); // Order of ops
    });

    it('should resolve variables with @ prefix', () => {
        const context = { Str: 18, Level: 5 };
        expect(calculationEngine.evaluate('@Str + @Level', context)).toBe(23);
        expect(calculationEngine.evaluate('(@Str - 10) / 2', context)).toBe(4);
    });

    it('should handle dice notation', () => {
        // Since random is involved, we check if it returns a number within range
        const result = calculationEngine.evaluate('1d1'); 
        expect(result).toBe(1);

        const result2 = calculationEngine.evaluate('1d20');
        expect(result2).toBeGreaterThanOrEqual(1);
        expect(result2).toBeLessThanOrEqual(20);

        const result3 = calculationEngine.evaluate('2d6 + 4');
        expect(result3).toBeGreaterThanOrEqual(6);
        expect(result3).toBeLessThanOrEqual(16);
    });

    it('should support standard functions', () => {
        expect(calculationEngine.evaluate('min(10, 20)')).toBe(10);
        expect(calculationEngine.evaluate('max(10, 20)')).toBe(20);
        expect(calculationEngine.evaluate('floor(10.5)')).toBe(10);
        expect(calculationEngine.evaluate('ceil(10.1)')).toBe(11);
        expect(calculationEngine.evaluate('abs(-5)')).toBe(5);
    });

    it('should extract variables correctly', () => {
        const formula = '1d20 + @StrMod + @Proficiency - @Penalty';
        const vars = calculationEngine.getVariables(formula);
        expect(vars).toContain('StrMod');
        expect(vars).toContain('Proficiency');
        expect(vars).toContain('Penalty');
        expect(vars).toHaveLength(3);
    });

    it('should handle invalid formulas gracefully', () => {
        // Should return 0 and log error (we verify 0)
        expect(calculationEngine.evaluate('invalid + @formula')).toBe(0);
        expect(calculationEngine.evaluate('10 / 0')).toBe(Infinity); // Standard JS behavior
    });
});
