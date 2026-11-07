import fs from 'node:fs';
let s=fs.readFileSync('e2e/clipCoc.spec.ts','utf8');
s=s.slice(0,s.indexOf("test('COC")).replaceAll('COC','ALIEN').replaceAll('Coc','Alien').replaceAll('coc','alien').replaceAll('clip-amelia','clip-nel').replaceAll('ALIEN-2.2.0-d20.gmos-driver','ALIEN-1.9.0.gmos-driver');
s=s.replace("import type { useCombatStore } from '../src/modules/combat/useCombatStore';\r\n",'').replace('useCombatStore: typeof useCombatStore; ','');
s=s.replace('palette verte et cuivre','palette de terminal vert et ambre').replaceAll('#d4a46f','#a4f49b').replace('#272044,#0a0619','#16302a,#050d0c');
s=s.replace("import type { useSessionOSStore }", "import type { VueDesModulesMJ } from '../src/modules/modulesDuJeu/protocole';\nimport type { VueCombatSpatial } from '../outils/alien/modules/combat-spatial/moteur.mjs';\nimport type { useSessionOSStore }");
fs.writeFileSync('e2e/clipAlien.spec.ts',s+fs.readFileSync('tmp/clip-alien-corps.txt','utf8'));
fs.mkdirSync('output/clips/alien/pilote',{recursive:true});fs.copyFileSync('Export Dirvers/Alien_driver_gmos_1793655035463.gmos-driver','output/clips/alien/pilote/ALIEN-1.9.0.gmos-driver');
