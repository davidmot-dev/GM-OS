import fs from 'node:fs';
let t=fs.readFileSync('tmp/inventorier-clip-symbaroum.mjs','utf8');
t=t.replaceAll('clipSymbaroum','clipDegenesis').replaceAll('Symbaroum','Degenesis').replaceAll('symbaroum','degenesis');
t=t.replace('NOC et Rêve de Dragon déjà livrés','NOC, Rêve de Dragon, Symbaroum et Star Trek déjà livrés');
fs.writeFileSync('tmp/inventorier-clip-degenesis.mjs',t);
