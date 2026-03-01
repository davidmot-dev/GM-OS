/**
 * Logique de base pour le lancer de dés.
 * Utilisable sous forme de classe pour le testing robuste.
 */
export class DiceEngine {
    /**
     * Lance un dé à N faces.
     */
    static roll(sides: number): number {
        if (sides < 1) return 0;
        return Math.floor(Math.random() * sides) + 1;
    }

    /**
     * Analyse une chaîne de type "2d6+5" et retourne le résultat.
     */
    static parseAndRoll(formula: string): { total: number; rolls: number[]; modifier: number } {
        const regex = /^(\d+)d(\d+)([+-]\d+)?$/i;
        const match = formula.trim().match(regex);

        if (!match) {
            throw new Error("Format de formule invalide (ex: 2d6+5)");
        }

        const count = parseInt(match[1]);
        const sides = parseInt(match[2]);
        const modifier = match[3] ? parseInt(match[3]) : 0;

        const rolls: number[] = [];
        for (let i = 0; i < count; i++) {
            rolls.push(this.roll(sides));
        }

        const total = rolls.reduce((a, b) => a + b, 0) + modifier;

        return { total, rolls, modifier };
    }
}
