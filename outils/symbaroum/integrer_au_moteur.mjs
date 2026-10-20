// Intègre le gabarit symbaroum-fr au moteur de fiches — 2026-10-20, Claude Code (cahier des fiches, § 8.3).
// Ajoute le gabarit livré, tel quel, avec `_builtin: true`, et monte BUILTIN_VERSION 13 → 14 : sans
// cela une bibliothèque déjà garnie ne le reçoit jamais. Les autres gabarits ne bougent pas.
// Usage : node outils/symbaroum/integrer_au_moteur.mjs
import fs from 'node:fs';
import assert from 'node:assert/strict';

const moteur = 'docs/fiches/Character_Sheet_Manager.html';
const fiche = 'docs/fiches/Symbaroum/symbaroum-fiche-personnage-interactive.html';
const gabarit = JSON.parse(fs.readFileSync(fiche, 'utf8')
    .match(/<script\b[^>]*\bid=["']character-sheet-template["'][^>]*>([\s\S]*?)<\/script>/i)[1]).template;
assert.equal(gabarit.id, 'symbaroum-fr');

let source = fs.readFileSync(moteur, 'utf8');
const ancienneVersion = source.match(/(\/\* 13 : [^*]*\*\/ )?const BUILTIN_VERSION=13;/);
assert.ok(ancienneVersion, 'BUILTIN_VERSION attendu à 13');
const expression = /(<script id="builtinTemplates" type="application\/json">)([\s\S]*?)(<\/script>)/;
const bloc = source.match(expression);
const modeles = JSON.parse(bloc[2]);
assert.ok(!modeles.some(t => t.id === gabarit.id), 'symbaroum-fr est déjà dans le moteur');
const avant = structuredClone(modeles);
modeles.push({ ...gabarit, _builtin: true });
assert.deepEqual(modeles.slice(0, -1), avant);

source = source.replace(expression, () => bloc[1] + JSON.stringify(modeles).replaceAll('<', '\\u003c') + bloc[3]);
source = source.replace(ancienneVersion[0], () => ancienneVersion[0].replace('const BUILTIN_VERSION=13;',
    '/* 14 : la fiche de personnage de Symbaroum (2026-10-20). */ const BUILTIN_VERSION=14;'));
fs.writeFileSync(moteur, source);
console.log(JSON.stringify({ version: 14, ajoute: gabarit.id, gabarits: modeles.map(t => t.id) }));
