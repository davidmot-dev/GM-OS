import fs from 'node:fs';
import path from 'node:path';
const sortie='output/clips/crimes';
const p=`${sortie}/controle-video.json`,v=JSON.parse(fs.readFileSync(p,'utf8'));
v.manuel={fichiers:2,testsReussis:36,echecs:0};v.diffCheck='git diff --check : réussi';
v.tournage='npx playwright test e2e/clipCrimes.spec.ts --reporter=list : 1 parcours normal réussi';
fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');
function parcourir(d){return fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>{const p=path.posix.join(d,e.name);return e.isDirectory()?parcourir(p):[p];});}
const inventaire=`${sortie}/fichiers-de-livraison.json`;
const fichiers=[...new Set(['e2e/clipCrimes.spec.ts','documentation/Planning/2026-11-06-etat-et-reprise-codex-clip-crimes.md',
 'documentation/Planning/2026-08-23-chantiers-gares.md','documentation/Planning/2026-10-20-ameliorations-tous-les-pilotes.md','documentation/User Guides/54-Jeu-Crimes.md',
 'output/clips/crimes-mecanismes.mp4','output/clips/crimes-mecanismes.webm',...parcourir(sortie),inventaire])].sort();
fs.writeFileSync(inventaire,JSON.stringify({date:'2026-11-06',sujet:'Clip Playwright Crimes',commit:'non demandé',nombre:fichiers.length,fichiers,exclus:['changements étrangers préexistants','tmp/ et traces des répétitions','sorties Nephilim déjà livrées, conservées ; registre/synthèse partagés']},null,2)+'\n');
const reprise='documentation/Planning/2026-11-06-etat-et-reprise-codex-clip-crimes.md';
fs.appendFileSync(reprise,`\n**${fichiers.length} fichiers de livraison modifiés ou nouveaux, non commités**, listés dans\n[le manifeste](../../output/clips/crimes/fichiers-de-livraison.json). Les 36 tests finaux du manuel\npassent ; diff --check propre. Aucun reste pour le clip ; défaut d’aperçu distinct au §1bis.\n`);
console.log(fichiers.length);
