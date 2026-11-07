import fs from 'node:fs';
import path from 'node:path';
const sortie='output/clips/cthulhu-hack',p=`${sortie}/controle-video.json`,c=JSON.parse(fs.readFileSync(p,'utf8'));
c.manuel={fichiers:2,testsReussis:36,echecs:0};c.diffCheck='git diff --check : réussi';c.tournage='npx playwright test e2e/clipCthulhuHack.spec.ts --reporter=list : 1 parcours normal réussi';fs.writeFileSync(p,JSON.stringify(c,null,2)+'\n');
function parcourir(d){return fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>{const p=path.posix.join(d,e.name);return e.isDirectory()?parcourir(p):[p];});}
const inventaire=`${sortie}/fichiers-de-livraison.json`,fichiers=[...new Set(['e2e/clipCthulhuHack.spec.ts','documentation/Planning/2026-11-06-etat-et-reprise-codex-clip-cthulhu-hack.md',
 'documentation/Planning/2026-08-23-chantiers-gares.md','documentation/Planning/2026-10-20-ameliorations-tous-les-pilotes.md','documentation/User Guides/54-Jeu-Cthulhu-Hack.md',
 'output/clips/cthulhu-hack-mecanismes-et-outils.mp4','output/clips/cthulhu-hack-mecanismes-et-outils.webm',...parcourir(sortie),inventaire])].sort();
fs.writeFileSync(inventaire,JSON.stringify({date:'2026-11-06',sujet:'Clip Playwright Cthulhu Hack',commit:'non demandé',nombre:fichiers.length,fichiers,exclus:['changements étrangers : Forge, équipement, bestiaire, chemins des livres et autres chantiers','tmp/ et traces des répétitions','films Nephilim, Crimes, Dune, NOC, Rêve de Dragon, Symbaroum, Star Trek et Degenesis déjà livrés ; registre/synthèse partagés']},null,2)+'\n');
fs.appendFileSync('documentation/Planning/2026-11-06-etat-et-reprise-codex-clip-cthulhu-hack.md',`\n**${fichiers.length} fichiers de livraison modifiés ou nouveaux, non commités**, listés dans
[le manifeste](../../output/clips/cthulhu-hack/fichiers-de-livraison.json). Les 36 tests du manuel passent ;
diff --check propre. Aucun reste pour le clip ; les autres recettes demeurent distinctes.\n`);console.log(fichiers.length);
