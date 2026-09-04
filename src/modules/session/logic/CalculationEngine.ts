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

    /**
     * **Les tirages retenus, par champ.**
     *
     * Défaut F3 du § 12m, corrigé le 2026-09-04. `roll()` appelait
     * `Math.random()` à chaque évaluation : un dé dans une formule de fiche
     * était donc **relancé à chaque frappe**, dans n'importe quel autre champ.
     * *Un total qui bouge tout seul n'est pas un calcul, c'est un bruit.*
     *
     * La clé est `<champ>|<formule>` : changer la formule invalide le tirage
     * retenu, ce qui est juste — ce n'est plus le même dé.
     *
     * Le tableau garde **un tirage par dé de la formule**, dans l'ordre où ils
     * apparaissent : `1d6 + 1d20` en retient deux, indépendamment.
     */
    private tiragesRetenus = new Map<string, number[]>();

    /** La clé en cours d'évaluation, et le rang du dé dans la formule. */
    private cleCourante: string | null = null;
    private rangDuDe = 0;

    constructor() {
        this.parser = new Parser();
        
        // Define standard RPG helper functions
        this.parser.functions.roll = (count: number, sides: number) => {
            const rang = this.rangDuDe++;

            /*
              Sans clé, on lance vraiment — c'est le comportement d'un appel
              ponctuel, et celui que le reste du code attend depuis toujours.
            */
            if (this.cleCourante !== null) {
                const retenus = this.tiragesRetenus.get(this.cleCourante);
                const dejaLa = retenus?.[rang];
                if (dejaLa !== undefined) return dejaLa;
            }

            let total = 0;
            for (let i = 0; i < count; i++) {
                total += Math.floor(Math.random() * sides) + 1;
            }

            if (this.cleCourante !== null) {
                const retenus = this.tiragesRetenus.get(this.cleCourante) ?? [];
                retenus[rang] = total;
                this.tiragesRetenus.set(this.cleCourante, retenus);
            }

            return total;
        };
    }

    /**
     * Oublie les tirages retenus, pour qu'un prochain calcul relance les dés.
     *
     * Sans argument, oublie tout — c'est ce qu'on veut en changeant de fiche.
     */
    relancerLesDes(champ?: string): void {
        if (champ === undefined) {
            this.tiragesRetenus.clear();
            return;
        }
        for (const cle of [...this.tiragesRetenus.keys()]) {
            if (cle.startsWith(`${champ}|`)) this.tiragesRetenus.delete(cle);
        }
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
        prepared = prepared.replace(/@([a-zA-Z0-9_]+)/g, (_, varName) => {
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
    /**
     * @param champ Quand il est fourni, **les dés de la formule sont retenus**
     *              sous ce nom : recalculer ne les relance pas. C'est ce qu'il
     *              faut pour un champ de fiche. Sans lui, chaque évaluation
     *              lance de vrais dés.
     */
    evaluate(formula: string, context: Record<string, any> = {}, champ?: string): number {
        this.cleCourante = champ === undefined ? null : `${champ}|${formula.trim()}`;
        this.rangDuDe = 0;
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
        } finally {
            /* Toujours refermer : une formule en erreur ne doit pas laisser la
               clé ouverte sur l'évaluation suivante. */
            this.cleCourante = null;
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
