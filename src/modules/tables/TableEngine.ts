import type { TableData, TableEntry } from './types';
import { lireLaFormule } from './logic/formeDeLaTable';

export class TableEngine {
    /**
     * Lance une formule — standard (`1d20`, `2d6+5`) ou juxtaposée (`d66`).
     *
     * ⚠️ **La formule se lit dans `logic/formeDeLaTable.ts`, jamais ici.** Ce
     * corps portait ses propres expressions régulières, et le contrôle de forme
     * en aurait eu une seconde copie : *deux lectures auraient divergé le jour
     * où l'une accepte `1d66` et pas l'autre* — c'est-à-dire précisément le
     * défaut du 2026-09-15, mais en pire, puisque le contrôle aurait alors
     * déclaré saine une table que ce moteur casse.
     *
     * ⛔ **Une formule illisible rend 1**, comme avant. C'est un repli discret,
     * et c'est pour ça que `controlerLaTable` le signale : ici on ne peut plus
     * rien dire, il n'y a pas d'écran au bout.
     */
    static rollDice(formula: string): number {
        const de = lireLaFormule(formula);

        if (de.genre === 'juxtapose') {
            // Des chiffres collés, pas une somme : d66 rend 11 à 66, jamais 17.
            let chiffres = "";
            for (let i = 0; i < de.nombre; i++) {
                chiffres += (Math.floor(Math.random() * de.faces) + 1).toString();
            }
            return parseInt(chiffres);
        }

        if (de.genre === 'standard') {
            let total = 0;
            for (let i = 0; i < de.nombre; i++) {
                total += Math.floor(Math.random() * de.faces) + 1;
            }
            return total + de.modificateur;
        }

        // Un nombre nu dans le champ « dice » vaut ce nombre.
        if (de.genre === 'fixe') return de.faces;

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
