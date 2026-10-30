// Intègre le gabarit degenesis-fr au moteur de fiches — 2026-10-30, Claude Code (cahier des fiches,
// § 8.3), à la demande de David (« finir le pilote », « tout, dans l'ordre »), fiche livrée par Codex le
// même jour. Ajoute le gabarit livré, tel quel, avec `_builtin: true`, et monte BUILTIN_VERSION 20 → 21 :
// sans cela une bibliothèque déjà garnie ne le reçoit jamais. Les autres gabarits ne bougent pas.
// Usage : node outils/degenesis/integrer_au_moteur.mjs
import fs from 'node:fs';
import assert from 'node:assert/strict';

const moteur = 'docs/fiches/Character_Sheet_Manager.html';
const fichier = 'docs/fiches/Degenesis/degenesis-fiche-personnage-interactive.html';
const gabarit = JSON.parse(fs.readFileSync(fichier, 'utf8')
    .match(/<script\b[^>]*\bid=["']character-sheet-template["'][^>]*>([\s\S]*?)<\/script>/i)[1]).template;
assert.equal(gabarit.id, 'degenesis-fr');

let source = fs.readFileSync(moteur, 'utf8');
assert.ok(source.includes('const BUILTIN_VERSION=20;'), 'BUILTIN_VERSION attendu à 20');
const expression = /(<script id="builtinTemplates" type="application\/json">)([\s\S]*?)(<\/script>)/;
const bloc = source.match(expression);
const modeles = JSON.parse(bloc[2]);
assert.ok(!modeles.some(t => t.id === gabarit.id), `${gabarit.id} est déjà dans le moteur`);
const avant = structuredClone(modeles);
modeles.push({ ...gabarit, _builtin: true });
assert.deepEqual(modeles.slice(0, avant.length), avant);

source = source.replace(expression, () => bloc[1] + JSON.stringify(modeles).replaceAll('<', '\\u003c') + bloc[3]);
source = source.replace('const BUILTIN_VERSION=20;',
    () => '/* 21 : la fiche de personnage de Degenesis (2026-10-30). */ const BUILTIN_VERSION=21;');
fs.writeFileSync(moteur, source);
console.log(JSON.stringify({ version: 21, ajoute: gabarit.id, gabarits: modeles.map(t => t.id) }));
