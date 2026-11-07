import fs from 'node:fs';
let t=fs.readFileSync('e2e/clipSymbaroum.spec.ts','utf8').split("test('les mécanismes")[0];
t=t.replaceAll('Symbaroum','Star Trek').replaceAll('Symbaroum.spec','StarTrek.spec').replaceAll('symbaroum','star-trek').replaceAll('SYMBAROUM','STAR_TREK').replaceAll('clip-elena','clip-tvael').replaceAll('hasardClipStar Trek','hasardClipStarTrek').replaceAll('clipStar Trek','clipStarTrek');
t=t.replaceAll('#a5bf82','#f6b26b');
t=t.replace("import type { useSessionOSStore }", "import { creerFiction } from '../outils/star-trek/lcars/fiction.mjs';\nimport { exporterConfiguration } from '../outils/star-trek/lcars/configuration.mjs';\nimport type { CommandeDeModule } from '../src/modules/modulesDuJeu/protocole';\nimport type { VueOperations, VaisseauVu } from '../outils/star-trek/operations/moteur.mjs';\nimport type { VueLcarsMJ } from '../outils/star-trek/lcars/moteur.mjs';\nimport type { useRessourcesDeTableStore } from '../src/modules/table/useRessourcesDeTableStore';\nimport type { useSessionOSStore }");
t=t.replace('useSessionOSStore: typeof useSessionOSStore;','useSessionOSStore: typeof useSessionOSStore; useRessourcesDeTableStore: typeof useRessourcesDeTableStore;');
fs.writeFileSync('e2e/clipStarTrek.spec.ts',t+fs.readFileSync('tmp/clip-star-trek-corps.txt','utf8'));
fs.mkdirSync('output/clips/star-trek/pilote',{recursive:true});
fs.copyFileSync('scratch/recette-pilotes/ST_driver_gmos_finir.gmos-driver','output/clips/star-trek/pilote/Star-Trek-2.0.0.gmos-driver');
