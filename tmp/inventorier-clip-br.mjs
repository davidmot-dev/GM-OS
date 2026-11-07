import fs from 'node:fs';
import path from 'node:path';
const sortie='output/clips/blade-runner',p=`${sortie}/controle-video.json`,c=JSON.parse(fs.readFileSync(p,'utf8'));
c.manuel={fichiers:2,testsReussis:36,echecs:0};c.diffCheck='git diff --check : réussi';c.tournage='npx playwright test e2e/clipBladeRunner.spec.ts --reporter=list : 1 parcours normal réussi';fs.writeFileSync(p,JSON.stringify(c,null,2)+'\n');
function parcourir(d){return fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>{const p=path.posix.join(d,e.name);return e.isDirectory()?parcourir(p):[p];});}
const inventaire=`${sortie}/fichiers-de-livraison.json`,fichiers=[...new Set(['outils/clips/monter_clip_blade_runner.mjs','e2e/clipBladeRunner.spec.ts','documentation/Planning/2026-11-07-etat-et-reprise-codex-clip-blade-runner.md',
 'documentation/Planning/2026-08-23-chantiers-gares.md','documentation/Planning/2026-10-20-ameliorations-tous-les-pilotes.md','documentation/User Guides/54-Jeu-Blade-Runner.md',
 'output/clips/blade-runner-mecanismes-et-tablette.mp4','output/clips/blade-runner-mecanismes-et-tablette.webm',...parcourir(sortie),inventaire])].sort();
for(const f of fichiers)if(f!==inventaire&&!fs.existsSync(f))throw Error(`Fichier absent : ${f}`);
fs.writeFileSync(inventaire,JSON.stringify({date:'2026-11-07',sujet:'Clip Playwright Blade Runner et joueur tactile',commit:'non demandé',nombre:fichiers.length,fichiers,exclus:['changements étrangers : Forge, équipement, bestiaire, chemins des livres et autres chantiers','tmp/ et traces des répétitions','films précédents déjà livrés ; registre/synthèse partagés','export Blade Runner original conservé sans modification']},null,2)+'\n');
fs.appendFileSync('documentation/Planning/2026-11-07-etat-et-reprise-codex-clip-blade-runner.md',`\n**${fichiers.length} fichiers de livraison modifiés ou nouveaux, non commités**, listés dans
[le manifeste](../../output/clips/blade-runner/fichiers-de-livraison.json). Les 36 tests du manuel passent ;
diff --check propre. Aucun reste pour le clip ; les autres recettes demeurent distinctes.\n`);console.log(fichiers.length);
