import fs from 'node:fs';
let s=fs.readFileSync('e2e/clipBol.spec.ts','utf8');s=s.slice(0,s.indexOf("test('Barbarians"));
s=s.replaceAll('BOL','BR').replaceAll('Bol','BladeRunner').replaceAll('bol','blade-runner').replaceAll('clip-krongar','clip-kessler').replaceAll('#dfbc72','#e2ad6e');
s=s.replace("import type { useSessionOSStore }", "import type { useCombatStore } from '../src/modules/combat/useCombatStore';\nimport type { useSessionOSStore }").replace('type Fenetre = Window & {','type Fenetre = Window & { useCombatStore: typeof useCombatStore;');
fs.writeFileSync('e2e/clipBladeRunner.spec.ts',s+fs.readFileSync('tmp/clip-br-corps.txt','utf8'));
let m=fs.readFileSync('outils/clips/monter_clip_bol.mjs','utf8').replaceAll('barbarians-of-lemuria-mecanismes-et-tablette','blade-runner-mecanismes-et-tablette').replaceAll("'bol'","'blade-runner'");fs.writeFileSync('outils/clips/monter_clip_blade_runner.mjs',m);
fs.mkdirSync('output/clips/blade-runner/pilote',{recursive:true});fs.copyFileSync('scratch/recette-br/BladeRunner_driver_gmos_finir.gmos-driver','output/clips/blade-runner/pilote/BR-2.0.0.gmos-driver');
