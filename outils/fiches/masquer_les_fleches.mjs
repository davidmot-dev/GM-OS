// Masque les flèches des champs nombre dans des gabarits du moteur de fiches — 2026-11-27, Claude
// Code, à la demande de David (« Corrige aussi Crimes et Star Trek », après le § 280 de Traveller).
//
// Chromium dessine ses flèches dans un champ nombre et leur réserve la place, même hors survol. Dans
// une case de 10 à 24 px, le chiffre est coupé ou disparaît : « 12 » lu « 1 » sur les atteintes de
// Crimes, un « 8 » coupé en deux sur les attributs de Star Trek et les Motivations de Dune, rien
// dans les compteurs de compétence de Crimes. `appearance:textfield`, que portaient Crimes et Dune,
// ne retire pas ces flèches dans Chromium : il faut viser `::-webkit-inner-spin-button`.
//
// Pour chaque gabarit nommé, la même règle est ajoutée à la fin de sa CSS :
// - dans le moteur `docs/fiches/Character_Sheet_Manager.html`, dont BUILTIN_VERSION monte UNE fois ;
// - dans la fiche livrée, quand elle existe (son manifeste, et sa feuille de style autonome si elle
//   y porte la même CSS).
// Les CSS sources des constructeurs (Crimes, Dune) portent la même règle à part. Rejouable : un
// second passage ne change rien.
// Usage : node outils/fiches/masquer_les_fleches.mjs
import fs from 'node:fs';
import assert from 'node:assert/strict';

export const regle = id => {
    const T = `.sheet[data-template="${id}"]`;
    return ` ${T} input[type=number]{appearance:textfield;-moz-appearance:textfield;}`
        + ` ${T} input[type=number]::-webkit-inner-spin-button,${T} input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none;margin:0;}`;
};

const GABARITS = [
    { id: 'crimes-fr', fiche: 'docs/fiches/Crimes/crimes-fiche-personnage-interactive.html' },
    { id: 'dune-pj-fr', fiche: 'docs/fiches/Dune/Dune_Fiche_PJ_interactive.html' },
    // La Maison n'a pas de case étroite, mais elle partage la CSS de Dune (outils/dune/fiches/champs.css).
    { id: 'dune-maison-fr', fiche: 'docs/fiches/Dune/Dune_Fiche_Maison_interactive.html' },
    { id: 'star-trek-adventures-2e-dossier-personnel-fr',
        fiche: 'docs/fiches/Star Trek/star_trek_adventures_2e_dossier_personnel_interactif_recale_v2.html' },
];

const expressionDuManifeste = /(<script\b[^>]*\bid=["']character-sheet-template["'][^>]*>)([\s\S]*?)(<\/script>)/i;
const moteur = 'docs/fiches/Character_Sheet_Manager.html';
let source = fs.readFileSync(moteur, 'utf8');
const expression = /(<script id="builtinTemplates" type="application\/json">)([\s\S]*?)(<\/script>)/;
const bloc = source.match(expression);
const modeles = JSON.parse(bloc[2]);
const avant = structuredClone(modeles);
const rapport = [];

for (const { id, fiche } of GABARITS) {
    const ajout = regle(id);

    // 1 · La fiche livrée.
    let html = fs.readFileSync(fiche, 'utf8');
    const blocDuManifeste = html.match(expressionDuManifeste);
    const manifeste = JSON.parse(blocDuManifeste[2]);
    assert.equal(manifeste.template.id, id);
    const cssLivree = manifeste.template.customCss;
    let autonome = 'sans objet';
    if (!cssLivree.includes(ajout.trim())) {
        const occurrences = html.split(cssLivree).length - 1;
        manifeste.template.customCss = cssLivree + ajout;
        // La feuille de style autonome d'abord (elle précède le manifeste), puis le manifeste.
        if (occurrences >= 1 && html.indexOf(cssLivree) < html.indexOf(blocDuManifeste[0])) {
            html = html.replace(cssLivree, () => manifeste.template.customCss);
            autonome = 'corrigée';
        } else {
            autonome = 'non trouvée';
        }
        html = html.replace(expressionDuManifeste, () => blocDuManifeste[1]
            + JSON.stringify(manifeste).replaceAll('</', '<\\/') + blocDuManifeste[3]);
        fs.writeFileSync(fiche, html);
    }
    // Une page autonome qui a sa propre feuille de style (Star Trek, sans `data-template`) reçoit la
    // règle sous sa forme générale : elle n'affiche qu'une fiche.
    html = fs.readFileSync(fiche, 'utf8');
    const finDuStyle = html.indexOf('</style>');
    if (finDuStyle > 0 && finDuStyle < html.search(expressionDuManifeste) && !html.slice(0, finDuStyle).includes('inner-spin-button')) {
        html = html.slice(0, finDuStyle)
            + 'input[type=number]{appearance:textfield;-moz-appearance:textfield}'
            + 'input[type=number]::-webkit-inner-spin-button,input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}\n'
            + html.slice(finDuStyle);
        fs.writeFileSync(fiche, html);
        autonome = 'règle générale ajoutée';
    }

    // 2 · Le moteur : seule la CSS du gabarit change.
    const i = modeles.findIndex(t => t.id === id);
    assert.ok(i >= 0, `${id} doit être dans le moteur`);
    if (!modeles[i].customCss.includes(ajout.trim())) modeles[i] = { ...modeles[i], customCss: modeles[i].customCss + ajout };
    assert.deepEqual({ ...modeles[i], customCss: '' }, { ...avant[i], customCss: '' }, `${id} : seule la CSS change`);
    rapport.push({ id, feuilleAutonome: autonome });
}
assert.deepEqual(
    modeles.filter(t => !GABARITS.some(g => g.id === t.id)),
    avant.filter(t => !GABARITS.some(g => g.id === t.id)),
    'les autres gabarits ne bougent pas',
);

source = source.replace(expression, () => bloc[1] + JSON.stringify(modeles).replaceAll('<', '\\u003c') + bloc[3]);
const version = Number(source.match(/const BUILTIN_VERSION=(\d+);/)?.[1]);
assert.ok(version >= 30, 'BUILTIN_VERSION attendu à 30 ou plus');
const motif = 'Crimes, Dune et Star Trek, les flèches des champs nombre masquées (2026-11-27)';
const monte = !source.includes(`: ${motif}. */`);
if (monte) {
    source = source.replace(`const BUILTIN_VERSION=${version};`,
        `/* ${version + 1} : ${motif}. */ const BUILTIN_VERSION=${version + 1};`);
}
fs.writeFileSync(moteur, source);
console.log(JSON.stringify({ version: monte ? version + 1 : version, gabarits: rapport }));
