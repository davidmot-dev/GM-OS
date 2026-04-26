import type { TableData, TableEntry } from './types';

export class TableEngine {
    /**
     * Rolls a specific dice formula.
     * Supports standard (1d20, 2d6) and concat (d66, d444) formulas.
     */
    static rollDice(formula: string): number {
        const cleanFormula = formula.toLowerCase().trim();

        // 1. Handle "Concatenation" dice (GM-OS v3 Legacy: d44, d66, d88, d666, etc.)
        // These dice work by rolling multiple individual dice and stringing them together.
        const concatMatch = cleanFormula.match(/^d([468])\1+$/);
        if (concatMatch) {
            const side = parseInt(concatMatch[1]);
            const count = cleanFormula.length - 1; // Number of digits (e.g., d666 is 3)

            let resultStr = "";
            for (let i = 0; i < count; i++) {
                resultStr += (Math.floor(Math.random() * side) + 1).toString();
            }
            return parseInt(resultStr);
        }

        // 2. Handle Standard dice (1d10, 2d6, 1d100+5, etc.)
        const standardMatch = cleanFormula.match(/^(\d+)?d(\d+)([+-]\d+)?$/);
        if (standardMatch) {
            const count = parseInt(standardMatch[1] || "1");
            const sides = parseInt(standardMatch[2]);
            const mod = parseInt(standardMatch[3] || "0");

            let total = 0;
            for (let i = 0; i < count; i++) {
                total += Math.floor(Math.random() * sides) + 1;
            }
            return total + mod;
        }

        // 3. Fallback for raw numbers (if someone just puts "100" in dice field)
        const numericVal = parseInt(cleanFormula);
        if (!isNaN(numericVal)) return numericVal;

        return 1;
    }

    /**
     * Resolves a table entry based on a final roll value.
     */
    static resolveEntry(table: TableData, value: number): TableEntry {
        if (table.entries.length === 0) {
            throw new Error("Table has no entries");
        }

        // Find match where value is between min and max (inclusive)
        const match = table.entries.find(e => value >= e.min && value <= e.max);

        if (match) return match;

        // If no match found, handle out-of-bounds
        // Sort to find boundaries
        const sorted = [...table.entries].sort((a, b) => a.min - b.min);

        if (value < sorted[0].min) return sorted[0];
        return sorted[sorted.length - 1];
    }
}
