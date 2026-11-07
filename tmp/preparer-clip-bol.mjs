import fs from 'node:fs';
let s=fs.readFileSync('e2e/clipAlien.spec.ts','utf8');s=s.slice(0,s.indexOf("test('Alien"));
s=s.split('\n').filter(l=>!l.includes('import type { VueDesModulesMJ }')&&!l.includes('import type { VueCombatSpatial }')).join('\n');
s=s.replaceAll('ALIEN','BOL').replaceAll('Alien','Bol').replaceAll('alien','bol').replaceAll('clip-nel','clip-krongar').replaceAll('BOL-1.9.0','BOL-2.0.0').replaceAll('#a4f49b','#dfbc72');
fs.writeFileSync('e2e/clipBol.spec.ts',s+fs.readFileSync('tmp/clip-bol-corps.txt','utf8'));
let m=fs.readFileSync('outils/clips/monter_clip_alien.mjs','utf8').replaceAll('alien','bol').replaceAll('bol-mecanismes-modules-et-tablette','barbarians-of-lemuria-mecanismes-et-tablette');fs.writeFileSync('outils/clips/monter_clip_bol.mjs',m);
fs.mkdirSync('output/clips/bol/pilote',{recursive:true});fs.copyFileSync('Export Dirvers/corriges/BOL_driver_gmos_2.0.0.gmos-driver','output/clips/bol/pilote/BOL-2.0.0.gmos-driver');
