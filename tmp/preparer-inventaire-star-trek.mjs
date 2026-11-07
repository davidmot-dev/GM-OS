import fs from 'node:fs';
let t=fs.readFileSync('tmp/inventorier-clip-symbaroum.mjs','utf8');
t=t.replaceAll('clipSymbaroum','clipStarTrek').replaceAll('54-Jeu-Symbaroum','54-Jeu-Star-Trek').replaceAll('Symbaroum','Star Trek').replaceAll('symbaroum','star-trek').replaceAll('star-trek-mecanismes-et-outils','star-trek-mecanismes-et-modules');
t=t.replace('NOC et Rêve de Dragon déjà livrés','NOC, Rêve de Dragon et Symbaroum déjà livrés');
fs.writeFileSync('tmp/inventorier-clip-star-trek.mjs',t);
