// Sélection des seules données cartographiques de Cyol ; aucun script d'origine exécuté.
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
const source = fs.readFileSync(new URL('../reference-cyol/originaux/tmr.js', import.meta.url), 'utf8');
const tableau = nom => source.match(new RegExp('var ' + nom + ' = \\[([\\s\\S]*?)\\];'))?.[1];
const genres = tableau('typeCases').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
const noms = [...tableau('nomCases').matchAll(/'((?:\\.|[^'\\])*)'/g)].map(m => m[1].replace(/\\(['\\])/g, '$1'));
const cases = []; let index = 0;
for (let col = 0; col < 13; col++) for (let ligne = 0; ligne < (col % 2 ? 14 : 15); ligne++) {
    cases.push({ id: String.fromCharCode(65 + col) + (ligne + 1), col, ligne, genre: genres[index], nom: noms[index++] });
}
if (index !== 189 || genres.length !== index || noms.length !== index) throw new Error('Carte source inattendue.');
const notice = `/* Données adaptées de « Les Terres Médianes du Rêve : Outils », Cyol, corrections Kroc.
 * https://scriptarium.org/RdD/tmr/ — CC BY 3.0 France
 * https://creativecommons.org/licenses/by/3.0/fr/
 * 18/10/2026 : tableaux typeCases/nomCases convertis en cases nommées ; rendu GM-OS original.
 * Ni images ni code Hexagon.js repris. Voir CREDITS.md et preparer-carte.mjs. */\n`;
fs.writeFileSync(fileURLToPath(new URL('cases.mjs', import.meta.url)), notice + 'export const CASES = ' + JSON.stringify(cases, null, 2) + ';\n');
console.log('189 cases sélectionnées, sans exécution du script tiers.');
