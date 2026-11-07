import fs from 'node:fs';
let t=fs.readFileSync('e2e/clipSymbaroum.spec.ts','utf8').split("test('les mécanismes")[0];
t=t.replaceAll('Symbaroum','Degenesis').replaceAll('symbaroum','degenesis').replaceAll('SYMBAROUM','DEGENESIS').replaceAll('clip-elena','clip-falberg');
t=t.replace('Degenesis-2.0.0.gmos-driver','Degenesis-2.3.0.gmos-driver').replaceAll('#a5bf82','#d4a46f');
t=t.replace("import type { useSessionOSStore }", "import type { useCombatStore } from '../src/modules/combat/useCombatStore';\nimport type { useRoundDeDegenesisStore } from '../src/modules/combat/useRoundDeDegenesisStore';\nimport type { useJetsLiesDeDegenesisStore } from '../src/modules/combat/useJetsLiesDeDegenesisStore';\nimport type { EtatDegenesisDeLaFiche } from '../src/modules/dice/systemes/maximaDeDegenesis';\nimport type { useSessionOSStore }");
t=t.replace('useSessionOSStore: typeof useSessionOSStore;', 'useSessionOSStore: typeof useSessionOSStore; useCombatStore: typeof useCombatStore; useRoundDeDegenesisStore: typeof useRoundDeDegenesisStore; useJetsLiesDeDegenesisStore: typeof useJetsLiesDeDegenesisStore;');
fs.mkdirSync('output/clips/degenesis/pilote',{recursive:true});fs.copyFileSync('Export Dirvers/corriges/Degenesis_driver_gmos_finir.gmos-driver','output/clips/degenesis/pilote/Degenesis-2.3.0.gmos-driver');
fs.writeFileSync('e2e/clipDegenesis.spec.ts',t+fs.readFileSync('tmp/clip-degenesis-corps.txt','utf8'));
