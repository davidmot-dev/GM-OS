// Rend lisibles les chiffres de la fiche Traveller — 2026-11-27, Claude Code, à la demande de David
// (« vérifier le lien avec la fiche HTML pour Traveller, j'ai l'impression que les caractéristiques
// ne se lient pas »).
//
// Le lien marchait : GM-OS écrivait bien FOR, DEX… dans `attributes.*.value` (l'e2e le vérifie),
// mais la fiche ne les MONTRAIT pas. Une case de caractéristique fait 20 px de large, une case de MD
// 16 px, un niveau de compétence 8,3 px ; le moteur leur met 4 px de marge de chaque côté, et
// Chromium y dessine ses flèches de champ nombre. Il ne restait aucune place pour le chiffre. Les
// vingt autres gabarits du moteur masquent ces flèches ; celui de Traveller ne le faisait pas.
//
// Ce script ajoute la même règle au gabarit, aux deux endroits où il vit :
// - la fiche livrée `docs/fiches/Traveller/traveller-fiche-personnage-interactive.html` (le manifeste
//   ET la feuille de style de la fiche autonome) ;
// - le moteur `docs/fiches/Character_Sheet_Manager.html`, dont il monte BUILTIN_VERSION d'un cran
//   (sans cela une bibliothèque déjà garnie garderait l'ancien gabarit).
// `construire-fiche.py` porte la même règle, pour qu'une régénération la garde. Rejouable : un
// second passage ne change rien.
// Usage : node outils/traveller/chiffres_lisibles.mjs
import fs from 'node:fs';
import assert from 'node:assert/strict';

const T = '.sheet[data-template="traveller-fr"]';
export const REGLE = ` ${T} input[type=number]{appearance:textfield;-moz-appearance:textfield;}`
    + ` ${T} input[type=number]::-webkit-inner-spin-button,${T} input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none;margin:0;}`
    + ` ${T} .attribute-value,${T} .modifier{padding:0;}`;

const fiche = 'docs/fiches/Traveller/traveller-fiche-personnage-interactive.html';
const moteur = 'docs/fiches/Character_Sheet_Manager.html';
const expressionDuManifeste = /(<script\b[^>]*\bid=["']character-sheet-template["'][^>]*>)([\s\S]*?)(<\/script>)/i;

// 1 · La fiche livrée : le manifeste, puis la feuille de style de la page autonome.
let html = fs.readFileSync(fiche, 'utf8');
const blocDuManifeste = html.match(expressionDuManifeste);
const manifeste = JSON.parse(blocDuManifeste[2]);
const cssAvant = manifeste.template.customCss;
const dejaFait = cssAvant.includes(REGLE.trim());
if (!dejaFait) {
    assert.equal(html.split(cssAvant).length, 2, 'la feuille de style autonome doit porter la même CSS une fois');
    manifeste.template.customCss = cssAvant + REGLE;
    html = html.replace(cssAvant, () => manifeste.template.customCss);
    html = html.replace(expressionDuManifeste, () => blocDuManifeste[1]
        + JSON.stringify(manifeste).replaceAll('</', '<\\/') + blocDuManifeste[3]);
    fs.writeFileSync(fiche, html);
}
const gabarit = JSON.parse(fs.readFileSync(fiche, 'utf8').match(expressionDuManifeste)[2]).template;
assert.equal(gabarit.id, 'traveller-fr');
assert.ok(gabarit.customCss.endsWith(REGLE));

// 2 · Le moteur : le gabarit remplacé à sa place, les autres intacts.
let source = fs.readFileSync(moteur, 'utf8');
const version = Number(source.match(/const BUILTIN_VERSION=(\d+);/)?.[1]);
assert.ok(version >= 29, 'BUILTIN_VERSION attendu à 29 ou plus');
const expression = /(<script id="builtinTemplates" type="application\/json">)([\s\S]*?)(<\/script>)/;
const bloc = source.match(expression);
const modeles = JSON.parse(bloc[2]);
const i = modeles.findIndex(t => t.id === gabarit.id);
assert.ok(i >= 0, 'traveller-fr devait déjà être dans le moteur');
const avant = structuredClone(modeles);
modeles[i] = { ...gabarit, _builtin: true };
assert.deepEqual(modeles.filter((_, j) => j !== i), avant.filter((_, j) => j !== i));
assert.deepEqual({ ...modeles[i], customCss: '' }, { ...avant[i], customCss: '' }, 'seule la CSS change');

source = source.replace(expression, () => bloc[1] + JSON.stringify(modeles).replaceAll('<', '\\u003c') + bloc[3]);
const motif = 'Traveller, les chiffres des caractéristiques et des compétences lisibles (2026-11-27)';
const monte = !source.includes(`: ${motif}. */`);
if (monte) {
    source = source.replace(`const BUILTIN_VERSION=${version};`,
        `/* ${version + 1} : ${motif}. */ const BUILTIN_VERSION=${version + 1};`);
}
fs.writeFileSync(moteur, source);
console.log(JSON.stringify({ fiche: dejaFait ? 'déjà corrigée' : 'corrigée', version: monte ? version + 1 : version }));
