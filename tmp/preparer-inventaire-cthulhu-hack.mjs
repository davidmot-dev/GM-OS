import fs from 'node:fs';
let s=fs.readFileSync('tmp/inventorier-clip-degenesis.mjs','utf8').replaceAll('degenesis','cthulhu-hack').replaceAll('Degenesis','CthulhuHack');
s=s.replace("sujet:'Clip Playwright CthulhuHack'","sujet:'Clip Playwright Cthulhu Hack'");
s=s.replace("films Nephilim, Crimes, Dune, NOC, Rêve de Dragon, Symbaroum et Star Trek déjà livrés", "films Nephilim, Crimes, Dune, NOC, Rêve de Dragon, Symbaroum, Star Trek et Degenesis déjà livrés");
s=s.replace("changements étrangers : bestiaire, chemins des livres et autres chantiers", "changements étrangers : Forge, équipement, bestiaire, chemins des livres et autres chantiers");
fs.writeFileSync('tmp/inventorier-clip-cthulhu-hack.mjs',s);
