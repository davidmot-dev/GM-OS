import { useMemo } from 'react';
import { calculationEngine } from '../logic/CalculationEngine';
import type { PlayerCharacter, Entity } from '../store/types';
import type { SheetTemplate } from '../../../data/defaultSheetTemplates';

/**
 * useSheetCalculator
 * Hook to evaluate formulas within a character context.
 */
export function useSheetCalculator(
    character: PlayerCharacter | Entity | null, 
    template: SheetTemplate | null = null,
    overrideData?: Record<string, any>
) {
    /**
     * Context Preparation
     * Merges basic attributes (hp, maxHp) with dynamic sheetData and labels.
     */
    const context = useMemo(() => {
        if (!character) return {};
        
        const ctx: Record<string, any> = {
            name: character.name,
            hp: (character as PlayerCharacter).hp || 0,
            maxHp: (character as PlayerCharacter).maxHp || 0,
            ...(character.sheetData || {}),
            ...(overrideData || {})
        };

        // Enrich and initialize EVERY field from the template
        if (template) {
            template.sections.forEach(section => {
                section.fields.forEach(field => {
                    // Resolve value priority: 1. override (local), 2. saved, 3. default
                    const rawValue = (overrideData && overrideData[field.id] !== undefined) 
                        ? overrideData[field.id] 
                        : (character.sheetData && character.sheetData[field.id] !== undefined)
                            ? character.sheetData[field.id]
                            : field.defaultValue;

                    // Sanitize label to be a valid variable name
                    const sanitizedLabel = field.label
                        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                        .replace(/[^a-zA-Z0-9]/g, '');
                    
                    const numValue = (typeof rawValue === 'number') ? rawValue : parseFloat(String(rawValue)) || 0;

                    if (sanitizedLabel) {
                        ctx[sanitizedLabel] = numValue;
                    }
                    
                    // Also ensure the ID-based mapping is a number for the engine
                    ctx[field.id] = numValue;
                });
            });
        }
        
        return ctx;
    }, [character, template, overrideData]);

    /**
     * evaluateFormula
     * Evaluates a single formula string using the character's context.
     */
    const evaluateFormula = (formula: string): number => {
        if (!formula || !character) return 0;
        return calculationEngine.evaluate(formula, context);
    };

    /**
     * bulkEvaluate
     * Evaluates multiple formulas at once. Useful for complex sheets.
     */
    const bulkEvaluate = (formulas: Record<string, string>): Record<string, number> => {
        const results: Record<string, number> = {};
        if (!character) return results;

        for (const [key, formula] of Object.entries(formulas)) {
            results[key] = calculationEngine.evaluate(formula, context);
        }
        return results;
    };

    return {
        evaluateFormula,
        bulkEvaluate,
        context
    };
}
