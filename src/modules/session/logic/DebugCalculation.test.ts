import { describe, it, expect } from 'vitest';
import { calculationEngine } from './CalculationEngine';

// Simulating the logic from useSheetCalculator
function getContext(character: any, template: any) {
    const ctx: Record<string, any> = {
        hp: character.hp || 0,
        maxHp: character.maxHp || 0,
        ...character.sheetData
    };

    if (template) {
        template.sections.forEach((section: any) => {
            section.fields.forEach((field: any) => {
                const rawValue = character.sheetData[field.id] ?? field.defaultValue ?? 0;
                
                const sanitizedLabel = field.label
                    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                    .replace(/[^a-zA-Z0-9]/g, '');
                
                if (sanitizedLabel) {
                    ctx[sanitizedLabel] = Number(rawValue) || 0;
                }
                ctx[field.id] = Number(rawValue) || 0;
            });
        });
    }
    return ctx;
}

describe('Calculation Engine Debug', () => {
    const template = {
        sections: [
            {
                fields: [
                    { id: 'f1', label: 'Richesse', type: 'number' },
                    { id: 'f2', label: 'Points de Vie', type: 'number' }
                ]
            }
        ]
    };

    const character = {
        hp: 10,
        maxHp: 20,
        sheetData: {
            f1: 100,
            f2: 50
        }
    };

    it('should resolve @Richesse', () => {
        const ctx = getContext(character, template);
        expect(ctx.Richesse).toBe(100);
        const result = calculationEngine.evaluate('@Richesse + 10', ctx);
        expect(result).toBe(110);
    });

    it('should resolve @PointsdeVie (sanitized label)', () => {
        const ctx = getContext(character, template);
        expect(ctx.PointsdeVie).toBe(50);
        const result = calculationEngine.evaluate('@PointsdeVie + 5', ctx);
        expect(result).toBe(55);
    });

    it('should handle @hp and @maxHp', () => {
        const ctx = getContext(character, template);
        const result = calculationEngine.evaluate('@hp + @maxHp', ctx);
        expect(result).toBe(30);
    });
    
    it('should return default 0 for non-existent variables present in template', () => {
         const ctx = getContext(character, template);
         // @Force is NOT in sheetData but IS in template (hypothetically)
         // Wait, the template in the test has f1/f2. Let's add f3 (Force)
         const extendedTemplate = {
             sections: [{
                 fields: [
                     ...template.sections[0].fields,
                     { id: 'f3', label: 'Force', type: 'number', defaultValue: 10 }
                 ]
             }]
         };
         
         const ctxExt = getContext(character, extendedTemplate);
         expect(ctxExt.Force).toBe(10); // From defaultValue
         const result = calculationEngine.evaluate('@Force + 5', ctxExt);
         expect(result).toBe(15);
    });
});
