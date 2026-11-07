import fs from 'node:fs';
let s=fs.readFileSync('tmp/inventorier-clip-alien.mjs','utf8').replaceAll('alien','bol').replaceAll('clipAlien','clipBol').replaceAll('Clip Playwright Alien, trois modules','Clip Playwright Barbarians of Lemuria').replaceAll('export Alien original','export BoL original').replaceAll('bol-mecanismes-modules-et-tablette','barbarians-of-lemuria-mecanismes-et-tablette');
fs.writeFileSync('tmp/inventorier-clip-bol.mjs',s);
