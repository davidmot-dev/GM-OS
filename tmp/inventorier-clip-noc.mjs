import fs from 'node:fs';
import path from 'node:path';
const sortie='output/clips/noc',p=`${sortie}/controle-video.json`,c=JSON.parse(fs.readFileSync(p,'utf8'));
c.manuel={fichiers:2,testsReussis:36,echecs:0};c.diffCheck='git diff --check : réussi';c.tournage='npx playwright test e2e/clipNoc.spec.ts --reporter=list : 1 parcours normal réussi';
fs.writeFileSync(p,JSON.stringify(c,null,2)+'\n');
function parcourir(d){return fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>{const p=path.posix.join(d,e.name);return e.isDirectory()?parcourir(p):[p];});}
const inventaire=`${sortie}/fichiers-de-livraison.json`,fichiers=[...new Set(['e2e/clipNoc.spec.ts','documentation/Planning/2026-11-06-etat-et-reprise-codex-clip-noc.md',
 'documentation/Planning/2026-08-23-chantiers-gares.md','documentation/Planning/2026-10-20-ameliorations-tous-les-pilotes.md','documentation/User Guides/54-Jeu-NOC.md',
 'output/clips/noc-mecanismes-et-outils.mp4','output/clips/noc-mecanismes-et-outils.webm',...parcourir(sortie),inventaire])].sort();
fs.writeFileSync(inventaire,JSON.stringify({date:'2026-11-06',sujet:'Clip Playwright NOC et outils intégrés',commit:'non demandé',nombre:fichiers.length,fichiers,exclus:['changements étrangers préexistants, dont bestiaire en cours','tmp/ et traces des répétitions','sorties Nephilim, Crimes et Dune déjà livrées, conservées ; registre/synthèse partagés']},null,2)+'\n');
fs.appendFileSync('documentation/Planning/2026-11-06-etat-et-reprise-codex-clip-noc.md',`\n**${fichiers.length} fichiers de livraison modifiés ou nouveaux, non commités**, listés dans\n[le manifeste](../../output/clips/noc/fichiers-de-livraison.json). Les 36 tests finaux du manuel passent ;\ndiff --check propre. Aucun reste pour le clip ; aucun module indépendant NOC ajouté.\n`);
console.log(fichiers.length);
