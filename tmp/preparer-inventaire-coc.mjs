import fs from 'node:fs';
let s=fs.readFileSync('tmp/inventorier-clip-cthulhu-hack.mjs','utf8').replaceAll('cthulhu-hack','coc').replaceAll('CthulhuHack','Coc').replaceAll('mecanismes-et-outils','mecanismes-et-tablette').replace('54-Jeu-Cthulhu-Hack.md','54-Jeu-COC.md');
s=s.replace("sujet:'Clip Playwright Cthulhu Hack'","sujet:'Clip Playwright COC et joueur tactile'");
s=s.replace("['e2e/clipCoc.spec.ts'","['outils/clips/monter_clip_coc.mjs','e2e/clipCoc.spec.ts'");
s=s.replace('Star Trek et Degenesis déjà livrés','Star Trek, Degenesis et Cthulhu Hack déjà livrés');
fs.writeFileSync('tmp/inventorier-clip-coc.mjs',s);
