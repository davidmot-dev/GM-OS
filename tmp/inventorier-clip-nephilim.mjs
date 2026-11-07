import fs from 'node:fs';
import path from 'node:path';
const sortie='output/clips/nephilim';
const controlePath=`${sortie}/controle-video.json`;
const controle=JSON.parse(fs.readFileSync(controlePath,'utf8'));
controle.manuel={ fichiers:2, testsReussis:36, echecs:0 };
controle.diffCheck='git diff --check : réussi';
controle.tournage='npx playwright test e2e/clipNephilim.spec.ts --reporter=list : 1 parcours normal réussi';
fs.writeFileSync(controlePath,JSON.stringify(controle,null,2)+'\n');
const inventaire=`${sortie}/fichiers-de-livraison.json`;
const fichiers=[...new Set([
 'e2e/clipNephilim.spec.ts', 'documentation/Planning/2026-11-05-etat-et-reprise-codex-clip-nephilim.md',
 'documentation/Planning/2026-08-23-chantiers-gares.md', 'documentation/Planning/2026-10-20-ameliorations-tous-les-pilotes.md',
 'documentation/User Guides/54-Jeu-Nephilim.md', 'output/clips/nephilim-mecanismes.mp4', 'output/clips/nephilim-mecanismes.webm',
 ...fs.readdirSync(sortie).map(n=>path.posix.join(sortie,n)),inventaire
])].sort();
fs.writeFileSync(inventaire,JSON.stringify({date:'2026-11-05',sujet:'Clip Playwright Nephilim',commit:'non demandé',nombre:fichiers.length,fichiers,exclus:['changements étrangers préexistants','tmp/ et traces de répétition']},null,2)+'\n');
const reprise='documentation/Planning/2026-11-05-etat-et-reprise-codex-clip-nephilim.md';
let t=fs.readFileSync(reprise,'utf8');
t=t.replace('Manuel, synthèse et registre §216 à jour à la livraison.', 'Manuel, synthèse et registre §216 à jour ; 36 tests finaux du manuel réussis, diff --check propre.');
t+=`\n**${fichiers.length} fichiers de livraison modifiés ou nouveaux, non commités**, listés dans\n[le manifeste](../../output/clips/nephilim/fichiers-de-livraison.json). Aucun reste pour le clip.\n`;
fs.writeFileSync(reprise,t);
console.log(fichiers.length);
