import fs from 'node:fs';
let t=fs.readFileSync('e2e/clipReveDeDragon.spec.ts','utf8').split("test('les mécanismes")[0];
t=t.replace(/import type .*useCombatStore.*\n/,'').replace(/import .*initialiserSanteVoyageur.*\n/,'').replace(/import type .*VueTMRMJ.*\n/,'');
t=t.replaceAll('Rêve de Dragon','Symbaroum').replaceAll('rdd','symbaroum').replaceAll('RDD','SYMBAROUM').replaceAll('clip-nitouche','clip-elena').replaceAll('clipReveDeDragon','clipSymbaroum');
t=t.replace('output/campagnes-tests/reve-de-dragon/Reve-de-Dragon-2.0.0.gmos-driver','output/clips/symbaroum/pilote/Symbaroum-2.0.0.gmos-driver');
t=t.replace(/; useCombatStore: typeof useCombatStore/,'').replaceAll('#bda8ef','#a5bf82');
fs.writeFileSync('e2e/clipSymbaroum.spec.ts',t+fs.readFileSync('tmp/clip-symbaroum-corps.txt','utf8'));
fs.mkdirSync('output/clips/symbaroum/pilote',{recursive:true});
fs.copyFileSync('scratch/recette-pilotes/Symbaroum_driver_gmos_finir.gmos-driver','output/clips/symbaroum/pilote/Symbaroum-2.0.0.gmos-driver');
