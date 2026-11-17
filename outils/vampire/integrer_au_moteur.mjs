// Intègre le gabarit vampire-v5-fr au moteur de fiches — 17/11/2026, Claude Code (cahier des
// fiches, § 8.3), à la demande de David (« /finir-un-pilote Vampire », « l'ordre me convient » ;
// fiche livrée par GM-OS Studio le 17/11, `outils/vampire/construire-fiche.py`).
// Ajoute le gabarit livré, tel quel, avec `_builtin: true`, et monte BUILTIN_VERSION 26 → 27 : sans
// cela une bibliothèque déjà garnie ne le reçoit jamais. Les autres gabarits ne bougent pas.
// Usage : node outils/vampire/integrer_au_moteur.mjs
import fs from 'node:fs';
import assert from 'node:assert/strict';

const moteur = 'docs/fiches/Character_Sheet_Manager.html';
const fichier = 'docs/fiches/Vampire/vampire-v5-fiche-personnage-interactive.html';
const gabarit = JSON.parse(fs.readFileSync(fichier, 'utf8')
    .match(/<script\b[^>]*\bid=["']character-sheet-template["'][^>]*>([\s\S]*?)<\/script>/i)[1]).template;
assert.equal(gabarit.id, 'vampire-v5-fr');

let source = fs.readFileSync(moteur, 'utf8');
assert.ok(source.includes('const BUILTIN_VERSION=26;'), 'BUILTIN_VERSION attendu à 26');
const expression = /(<script id="builtinTemplates" type="application\/json">)([\s\S]*?)(<\/script>)/;
const bloc = source.match(expression);
const modeles = JSON.parse(bloc[2]);
assert.ok(!modeles.some(t => t.id === gabarit.id), `${gabarit.id} est déjà dans le moteur`);
const avant = structuredClone(modeles);
modeles.push({ ...gabarit, _builtin: true });
assert.deepEqual(modeles.slice(0, avant.length), avant);

source = source.replace(expression, () => bloc[1] + JSON.stringify(modeles).replaceAll('<', '\\u003c') + bloc[3]);
source = source.replace('const BUILTIN_VERSION=26;',
    () => '/* 27 : la fiche de personnage de Vampire : la Mascarade V5 (2026-11-17). */ const BUILTIN_VERSION=27;');
fs.writeFileSync(moteur, source);
console.log(JSON.stringify({ version: 27, ajoute: gabarit.id, gabarits: modeles.map(t => t.id) }));
