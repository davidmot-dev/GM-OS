import { describe, it, expect } from 'vitest';
import { DiceEngine } from './DiceEngine';

describe('DiceEngine Alignment', () => {
    it('should correctly apply YZE mechanics with modifiers from config', () => {
        const config = {
            defaultDice: '3',
            logic: 'count-success',
            engine: 'year-zero' as const
        };
        
        // Rolling 3 base + 2 modifier = 5 dice total
        const res = DiceEngine.rollFromConfig(config, { modifier: 2 });
        expect(res.rolls.length).toBe(5);
        expect(res.modifier).toBe(0); // YZE modifier is consumed by pool size
    });

    it('should support both yze and year-zero identifiers', () => {
        const configYze = { defaultDice: '1', logic: 'count-success', engine: 'yze' as any };
        const configYearZero = { defaultDice: '1', logic: 'count-success', engine: 'year-zero' as any };
        
        expect(DiceEngine.rollFromConfig(configYze).rolls.length).toBe(1);
        expect(DiceEngine.rollFromConfig(configYearZero).rolls.length).toBe(1);
    });

    it('should apply modifiers to standard success counting pools', () => {
        const config = {
            defaultDice: '2d10',
            logic: 'count-success',
            successThreshold: 8
        };
        
        // 2d10 + 1 modifier (mod applied to count)
        const res = DiceEngine.rollFromConfig(config, { modifier: 1 });
        expect(res.rolls.filter(r => typeof r.val === 'number').length).toBe(2);
        expect(res.modifier).toBe(1);
    });
});
