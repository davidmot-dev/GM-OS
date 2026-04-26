import { describe, it, expect } from 'vitest';
import { syncHealthSystem } from './entitySlice';
import { HealthInterpreter } from '../logic/HealthInterpreter';


describe('syncHealthSystem (entitySlice.ts)', () => {
    it('creates a new health system correctly if none exists', () => {
        const hp = 50;
        const maxHp = 100;
        const result = syncHealthSystem(hp, maxHp);
        
        expect(result).toBeDefined();
        expect(result?.type).toBe('hp');
        expect(result?.data.current).toBe(50);
        expect(result?.data.max).toBe(100);
        expect(result?.state).toBe('wounded');
    });

    it('updates an existing hp health system correctly', () => {
        const existingHealth = HealthInterpreter.createDefault('hp');
        existingHealth.data.current = 10;
        existingHealth.data.max = 100;
        existingHealth.state = 'critical';

        const updated = syncHealthSystem(80, 100, existingHealth);
        
        expect(updated?.data.current).toBe(80);
        expect(updated?.data.max).toBe(100);
        expect(updated?.state).toBe('healthy');
    });

    it('returns critical when hp is below 25%', () => {
        const result = syncHealthSystem(20, 100);
        expect(result?.state).toBe('critical');
    });

    it('returns dead when hp is 0', () => {
        const result = syncHealthSystem(0, 100);
        expect(result?.state).toBe('dead');
    });

    it('does not override a non-hp system (e.g. clocks)', () => {
        const existingHealth = HealthInterpreter.createDefault('clocks');
        const updated = syncHealthSystem(50, 100, existingHealth);
        
        // It should return the exact same system unmodified 
        expect(updated).toBe(existingHealth);
        expect(updated?.type).toBe('clocks');
    });
});
