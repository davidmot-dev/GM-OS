import { Parser } from 'expr-eval';

/**
 * CalculationEngine
 * Pure logic for interpreting RPG formulas.
 * Supports: 
 * - Standard math (+, -, *, /, ^)
 * - Functions: min, max, floor, abs, ceil
 * - Dice notation: 1d20, 2d6+4 (via pre-processor)
 * - Variables: @Str, @Level (via context injection)
 */
export class CalculationEngine {
    private parser: Parser;

    constructor() {
        this.parser = new Parser();
        
        // Define standard RPG helper functions
        this.parser.functions.roll = (count: number, sides: number) => {
            // In a real session, this might use a seeded PRNG or trigger a store animation.
            // For pure calculation/preview, we return the average or a "default" roll if needed.
            // But usually, formulas in sheets are for STATIC bonuses or PREVIEWS.
            // For a "Calculation Engine", we return the SUM of random rolls.
            let total = 0;
            for (let i = 0; i < count; i++) {
                total += Math.floor(Math.random() * sides) + 1;
            }
            return total;
        };
    }

    /**
     * Pre-processes a string to make it compatible with expr-eval.
     * 1. 1d20 -> roll(1, 20)
     * 2. @Var -> Var
     */
    private prepareFormula(formula: string): { prepared: string; variables: string[] } {
        let prepared = formula.trim();

        // 1. Dice notation: 2d6 -> roll(2, 6)
        prepared = prepared.replace(/(\d+)d(\d+)/g, 'roll($1, $2)');

        // 2. Variables: @Strength -> Strength
        const variables: string[] = [];
        prepared = prepared.replace(/@([a-zA-Z0-9_]+)/g, (match, varName) => {
            variables.push(varName);
            return varName;
        });

        return { prepared, variables };
    }

    /**
     * Evaluates a formula with a given context.
     * @param formula The string formula (ex: "1d20 + @StrMod")
     * @param context Object containing variable values (ex: { StrMod: 3 })
     */
    evaluate(formula: string, context: Record<string, any> = {}): number {
        try {
            const { prepared } = this.prepareFormula(formula);
            
            // Clean context: remove @ prefix if user mistakenly kept it in data keys
            const cleanContext: Record<string, any> = {};
            for (const key in context) {
                const cleanKey = key.startsWith('@') ? key.slice(1) : key;
                cleanContext[cleanKey] = context[key];
            }

            return this.parser.evaluate(prepared, cleanContext);
        } catch (error) {
            console.error(`CalculationEngine Error: Failed to evaluate "${formula}"`, error);
            return 0;
        }
    }

    /**
     * Extracts all variable names from a formula.
     */
    getVariables(formula: string): string[] {
        return this.prepareFormula(formula).variables;
    }
}

export const calculationEngine = new CalculationEngine();
