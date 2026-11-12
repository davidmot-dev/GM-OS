// Intègre le gabarit delta-green-agent-fr au moteur de fiches — 12/11/2026, Claude Code (cahier des
// fiches, § 8.3), à la demande de David (« /finir-un-pilote Delta Green » ; fiche construite par
// Codex le 12/11, `outils/delta-green/construire-fiche.py`).
// Ajoute le gabarit livré, tel quel, avec `_builtin: true`, et monte BUILTIN_VERSION 25 → 26 : sans
// cela une bibliothèque déjà garnie ne le reçoit jamais. Les autres gabarits ne bougent pas.
// Usage : node outils/delta-green/integrer_au_moteur.mjs
import fs from 'node:fs';
import assert from 'node:assert/strict';

const moteur = 'docs/fiches/Character_Sheet_Manager.html';
const fichier = 'docs/fiches/Delta Green/delta-green-fiche-agent-interactive.html';
const gabarit = JSON.parse(fs.readFileSync(fichier, 'utf8')
    .match(/<script\b[^>]*\bid=["']character-sheet-template["'][^>]*>([\s\S]*?)<\/script>/i)[1]).template;
assert.equal(gabarit.id, 'delta-green-agent-fr');

let source = fs.readFileSync(moteur, 'utf8');
assert.ok(source.includes('const BUILTIN_VERSION=25;'), 'BUILTIN_VERSION attendu à 25');
const expression = /(<script id="builtinTemplates" type="application\/json">)([\s\S]*?)(<\/script>)/;
const bloc = source.match(expression);
const modeles = JSON.parse(bloc[2]);
assert.ok(!modeles.some(t => t.id === gabarit.id), `${gabarit.id} est déjà dans le moteur`);
const avant = structuredClone(modeles);
modeles.push({ ...gabarit, _builtin: true });
assert.deepEqual(modeles.slice(0, avant.length), avant);

source = source.replace(expression, () => bloc[1] + JSON.stringify(modeles).replaceAll('<', '\\u003c') + bloc[3]);
source = source.replace('const BUILTIN_VERSION=25;',
    () => '/* 26 : la fiche d’Agent de Delta Green (2026-11-12). */ const BUILTIN_VERSION=26;');
fs.writeFileSync(moteur, source);
console.log(JSON.stringify({ version: 26, ajoute: gabarit.id, gabarits: modeles.map(t => t.id) }));
