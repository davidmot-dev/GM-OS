// Intègre le gabarit traveller-fr au moteur de fiches — 2026-11-26, Claude Code (cahier des fiches,
// § 8.3), à la demande de David (« finir le pilote » Traveller, « Tout, dans l'ordre » ; fiche livrée
// par GM-OS Studio le 26/11).
// Ajoute le gabarit livré, tel quel, avec `_builtin: true`, et monte BUILTIN_VERSION 28 → 29 : sans
// cela une bibliothèque déjà garnie ne le reçoit jamais. Les autres gabarits ne bougent pas.
// Usage : node outils/traveller/integrer_au_moteur.mjs
import fs from 'node:fs';
import assert from 'node:assert/strict';

const moteur = 'docs/fiches/Character_Sheet_Manager.html';
const fichier = 'docs/fiches/Traveller/traveller-fiche-personnage-interactive.html';
const gabarit = JSON.parse(fs.readFileSync(fichier, 'utf8')
    .match(/<script\b[^>]*\bid=["']character-sheet-template["'][^>]*>([\s\S]*?)<\/script>/i)[1]).template;
assert.equal(gabarit.id, 'traveller-fr');

let source = fs.readFileSync(moteur, 'utf8');
assert.ok(source.includes('const BUILTIN_VERSION=28;'), 'BUILTIN_VERSION attendu à 28');
const expression = /(<script id="builtinTemplates" type="application\/json">)([\s\S]*?)(<\/script>)/;
const bloc = source.match(expression);
const modeles = JSON.parse(bloc[2]);
assert.ok(!modeles.some(t => t.id === gabarit.id), `${gabarit.id} est déjà dans le moteur`);
const avant = structuredClone(modeles);
modeles.push({ ...gabarit, _builtin: true });
assert.deepEqual(modeles.slice(0, avant.length), avant);

source = source.replace(expression, () => bloc[1] + JSON.stringify(modeles).replaceAll('<', '\\u003c') + bloc[3]);
source = source.replace('/* 28 : la fiche standard de Pénombre (2026-11-22). */ const BUILTIN_VERSION=28;',
    () => '/* 28 : la fiche standard de Pénombre (2026-11-22). */ /* 29 : la fiche de Traveller (2026-11-26). */ const BUILTIN_VERSION=29;');
assert.ok(source.includes('const BUILTIN_VERSION=29;'), 'la version doit monter à 29');
fs.writeFileSync(moteur, source);
console.log(JSON.stringify({ version: 29, ajoute: gabarit.id, gabarits: modeles.map(t => t.id) }));
