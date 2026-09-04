import { DiceEngine } from '../../dice/DiceEngine';

/**
 * Combien d'exemplaires — un nombre, une plage, ou une formule de dés.
 *
 * **Extraite de `LootGenerator` le 2026-09-04**, où elle était privée. Elle est
 * désormais lue par trois appelants : les tables du pilote, le butin déclaré par
 * un oracle de Table-OS, et l'entrée de type `oracle` qui fait le pont entre les
 * deux. *Trois copies de la même règle auraient divergé le jour où l'une accepte
 * « 2d6+2 » et pas les autres.*
 *
 * Les trois formes acceptées :
 * - `3` → trois ;
 * - `1` avec `max: 6` → un tirage plat entre un et six ;
 * - `"1d100"` → la formule passe au moteur de dés.
 *
 * Rien, c'est un. Une formule illisible vaut un aussi : une quantité est un
 * détail de mise en scène, elle ne mérite pas d'interrompre un tirage.
 */
export function resoudreUneQuantite(min?: number | string, max?: number | string): number {
    try {
        if (min === undefined || min === null || min === '') return 1;

        const minStr = String(min).trim();

        if (minStr.toLowerCase().includes('d')) {
            return DiceEngine.rollFormula(minStr).total;
        }

        const minVal = parseInt(minStr);
        if (isNaN(minVal)) return 1;

        if (max === undefined || max === null || max === '') return minVal;

        const maxVal = parseInt(String(max));
        if (isNaN(maxVal) || maxVal <= minVal) return minVal;

        return Math.floor(Math.random() * (maxVal - minVal + 1)) + minVal;
    } catch (e) {
        console.error('[quantiteDeButin] formule illisible :', min, e);
        return 1;
    }
}
