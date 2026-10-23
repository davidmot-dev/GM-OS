// Remplace le gabarit nephilim-legende-fr du moteur de fiches par la fiche régénérée — 2026-10-23,
// Claude Code (Finir Nephilim : forme du Khaïba, second Ka-élément des formules, assemblage des
// constructs, livrés par le Studio). Même geste que outils/crime/mettre_a_jour_au_moteur.mjs : le
// gabarit est remplacé à sa place, BUILTIN_VERSION monte d'un cran, les autres gabarits ne bougent pas.
// Usage : node outils/nephilim-vecus/mettre_a_jour_au_moteur.mjs
import fs from 'node:fs';
import assert from 'node:assert/strict';

const moteur = 'docs/fiches/Character_Sheet_Manager.html';
const fiche = 'docs/fiches/Nephilim/nephilim-legende-interactive.html';
const gabarit = JSON.parse(fs.readFileSync(fiche, 'utf8')
    .match(/<script\b[^>]*\bid=["']character-sheet-template["'][^>]*>([\s\S]*?)<\/script>/i)[1]).template;
assert.equal(gabarit.id, 'nephilim-legende-fr');

let source = fs.readFileSync(moteur, 'utf8');
const version = Number(source.match(/const BUILTIN_VERSION=(\d+);/)?.[1]);
assert.ok(version >= 15, 'BUILTIN_VERSION attendu à 15 ou plus');
const expression = /(<script id="builtinTemplates" type="application\/json">)([\s\S]*?)(<\/script>)/;
const bloc = source.match(expression);
const modeles = JSON.parse(bloc[2]);
const i = modeles.findIndex(t => t.id === gabarit.id);
assert.ok(i >= 0, 'nephilim-legende-fr devait déjà être dans le moteur');
const avant = structuredClone(modeles);
modeles[i] = { ...gabarit, _builtin: true };
assert.deepEqual(modeles.filter((_, j) => j !== i), avant.filter((_, j) => j !== i));

source = source.replace(expression, () => bloc[1] + JSON.stringify(modeles).replaceAll('<', '\\u003c') + bloc[3]);
// Relancée après une retouche de la fiche, la recette ne monte pas la version une seconde fois.
const motif = 'Nephilim, forme du Khaïba, second élément et assemblage (2026-10-23)';
const deja = source.includes(`/* ${version} : ${motif}. */`);
if (!deja) {
    source = source.replace(new RegExp(`(/\\* ${version} : [^*]*\\*/ )?const BUILTIN_VERSION=${version};`),
        `/* ${version + 1} : ${motif}. */ const BUILTIN_VERSION=${version + 1};`);
}
fs.writeFileSync(moteur, source);
console.log(JSON.stringify({ version: deja ? version : version + 1, remplace: gabarit.id, gabarits: modeles.map(t => t.id) }));
