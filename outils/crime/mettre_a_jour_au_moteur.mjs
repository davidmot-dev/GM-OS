// Remplace le gabarit crimes-fr du moteur de fiches par la fiche reconstruite — 2026-10-22, Claude Code
// (Crimes C2 : les compteurs d'atteintes sous les Potentiels). Même geste que integrer_au_moteur.mjs,
// mais pour une fiche DÉJÀ intégrée : le gabarit est remplacé tel quel, à sa place, et BUILTIN_VERSION
// monte d'un cran — sans cela une bibliothèque déjà garnie garderait l'ancien. Les autres gabarits ne
// bougent pas.
// Usage : node outils/crime/mettre_a_jour_au_moteur.mjs
import fs from 'node:fs';
import assert from 'node:assert/strict';

const moteur = 'docs/fiches/Character_Sheet_Manager.html';
const fiche = 'docs/fiches/Crimes/crimes-fiche-personnage-interactive.html';
const gabarit = JSON.parse(fs.readFileSync(fiche, 'utf8')
    .match(/<script\b[^>]*\bid=["']character-sheet-template["'][^>]*>([\s\S]*?)<\/script>/i)[1]).template;
assert.equal(gabarit.id, 'crimes-fr');

let source = fs.readFileSync(moteur, 'utf8');
const version = Number(source.match(/const BUILTIN_VERSION=(\d+);/)?.[1]);
assert.ok(version >= 14, 'BUILTIN_VERSION attendu à 14 ou plus');
const expression = /(<script id="builtinTemplates" type="application\/json">)([\s\S]*?)(<\/script>)/;
const bloc = source.match(expression);
const modeles = JSON.parse(bloc[2]);
const i = modeles.findIndex(t => t.id === gabarit.id);
assert.ok(i >= 0, 'crimes-fr devait déjà être dans le moteur');
const avant = structuredClone(modeles);
modeles[i] = { ...gabarit, _builtin: true };
assert.deepEqual(modeles.filter((_, j) => j !== i), avant.filter((_, j) => j !== i));

source = source.replace(expression, () => bloc[1] + JSON.stringify(modeles).replaceAll('<', '\\u003c') + bloc[3]);
// Relancée après une retouche de la fiche, la recette ne monte pas la version une seconde fois.
const motif = 'Crimes, les atteintes sous les Potentiels (2026-10-22)';
const deja = source.includes(`/* ${version} : ${motif}. */`);
if (!deja) {
    source = source.replace(`const BUILTIN_VERSION=${version};`,
        `/* ${version + 1} : ${motif}. */ const BUILTIN_VERSION=${version + 1};`);
}
fs.writeFileSync(moteur, source);
console.log(JSON.stringify({ version: deja ? version : version + 1, remplace: gabarit.id, gabarits: modeles.map(t => t.id) }));
