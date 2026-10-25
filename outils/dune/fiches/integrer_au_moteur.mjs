// Intègre les gabarits dune-pj-fr et dune-maison-fr au moteur de fiches — 2026-10-25, Claude Code
// (cahier des fiches, § 8.3), à la demande de David : « est-ce que tu peux les connecter comme il faut ».
// Ajoute les deux gabarits livrés, tels quels, avec `_builtin: true`, et monte BUILTIN_VERSION 16 → 17 :
// sans cela une bibliothèque déjà garnie ne les reçoit jamais. Les autres gabarits ne bougent pas.
// Usage : node outils/dune/fiches/integrer_au_moteur.mjs
import fs from 'node:fs';
import assert from 'node:assert/strict';

const moteur = 'docs/fiches/Character_Sheet_Manager.html';
const fiches = [
    ['docs/fiches/Dune/Dune_Fiche_PJ_interactive.html', 'dune-pj-fr'],
    ['docs/fiches/Dune/Dune_Fiche_Maison_interactive.html', 'dune-maison-fr'],
];
const gabarits = fiches.map(([fichier, id]) => {
    const gabarit = JSON.parse(fs.readFileSync(fichier, 'utf8')
        .match(/<script\b[^>]*\bid=["']character-sheet-template["'][^>]*>([\s\S]*?)<\/script>/i)[1]).template;
    assert.equal(gabarit.id, id);
    return gabarit;
});

let source = fs.readFileSync(moteur, 'utf8');
const ancienneVersion = source.match(/(\/\* 16 : [^*]*\*\/ )?const BUILTIN_VERSION=16;/);
assert.ok(ancienneVersion, 'BUILTIN_VERSION attendu à 16');
const expression = /(<script id="builtinTemplates" type="application\/json">)([\s\S]*?)(<\/script>)/;
const bloc = source.match(expression);
const modeles = JSON.parse(bloc[2]);
for (const g of gabarits) assert.ok(!modeles.some(t => t.id === g.id), `${g.id} est déjà dans le moteur`);
const avant = structuredClone(modeles);
modeles.push(...gabarits.map(g => ({ ...g, _builtin: true })));
assert.deepEqual(modeles.slice(0, avant.length), avant);

source = source.replace(expression, () => bloc[1] + JSON.stringify(modeles).replaceAll('<', '\u003c') + bloc[3]);
source = source.replace(ancienneVersion[0], () => ancienneVersion[0].replace('const BUILTIN_VERSION=16;',
    '/* 17 : les fiches PJ et Maison de Dune (2026-10-25). */ const BUILTIN_VERSION=17;'));
fs.writeFileSync(moteur, source);
console.log(JSON.stringify({ version: 17, ajoutes: gabarits.map(g => g.id), gabarits: modeles.map(t => t.id) }));
