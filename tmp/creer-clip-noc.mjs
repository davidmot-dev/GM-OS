import fs from 'node:fs';
let h=fs.readFileSync('e2e/clipDune.spec.ts','utf8').split("test('les mécanismes")[0];
h=h.replace("import type { ConflitDune } from '../src/modules/dice/systemes/conflitsDeDune';","import type { useDiceStore } from '../src/stores/useDiceStore';");
h=h.replaceAll('Dune','Noc').replaceAll('DUNE','NOC').replaceAll('dune','noc').replaceAll('clip-lysa','clip-ilya');
h=h.replace('useRessourcesDeTableStore: typeof useRessourcesDeTableStore;', 'useRessourcesDeTableStore: typeof useRessourcesDeTableStore; useDiceStore: typeof useDiceStore;');
h=h.replaceAll('#e5bc74','#70c4c0').replaceAll('#433019','#1c3a36').replaceAll('palette sable et or','palette verte et cuivre');
const corps=fs.readFileSync('tmp/clip-noc-corps.txt','utf8');fs.writeFileSync('e2e/clipNoc.spec.ts',h+corps);
