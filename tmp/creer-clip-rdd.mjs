import fs from 'node:fs';
let h=fs.readFileSync('e2e/clipNoc.spec.ts','utf8').split("test('les mécanismes")[0];
h=h.replace("import type { useRessourcesDeTableStore } from '../src/modules/table/useRessourcesDeTableStore';","import type { useCombatStore } from '../src/modules/combat/useCombatStore';\nimport { initialiserSanteVoyageur } from '../src/modules/session/logic/santeDuVoyageur';");
h=h.replace("import type { useDiceStore } from '../src/stores/useDiceStore';","import type { VueTMRMJ } from '../outils/reve-de-dragon/tmr/moteur.mjs';");
h=h.replace('useRessourcesDeTableStore: typeof useRessourcesDeTableStore; useDiceStore: typeof useDiceStore;', 'useCombatStore: typeof useCombatStore;');
h=h.replaceAll('NOC','RDD').replaceAll('Noc','Rdd').replaceAll('noc','rdd').replaceAll('clip-ilya','clip-nitouche').replaceAll('#70c4c0','#bda8ef').replaceAll('#1c3a36','#272044');
h=h.replace('output/campagnes-tests/rdd/Rdd-2.0.0.gmos-driver','output/campagnes-tests/reve-de-dragon/Reve-de-Dragon-2.0.0.gmos-driver').replace('output/campagnes-tests/rdd/RDD-2.0.0.gmos-driver','output/campagnes-tests/reve-de-dragon/Reve-de-Dragon-2.0.0.gmos-driver');
h=h.replace('mécanismes particuliers de RDD','mécanismes particuliers de Rêve de Dragon');
fs.writeFileSync('e2e/clipReveDeDragon.spec.ts',h+fs.readFileSync('tmp/clip-rdd-corps.txt','utf8'));
