import fs from 'node:fs';
let s=fs.readFileSync('e2e/clipCthulhuHack.spec.ts','utf8').split("test('les mécanismes de Cthulhu Hack")[0];
s=s.replace("test, expect, type Locator, type Page","test, expect, chromium, type Locator, type Page, type Frame, type Browser, type BrowserContext");
s=s.replace("import type { SuiviCH } from '../src/modules/dice/systemes/cthulhuHack';", "import type { useJournalStore } from '../src/modules/journal/useJournalStore';\nimport { PORT_FICHES_PAR_DEFAUT } from '../electron/portsDeGmOs';");
s=s.replaceAll('Cthulhu Hack','COC').replaceAll('CthulhuHack','Coc').replaceAll('cthulhu-hack','coc').replace('GMOS_PILOTE_CTHULHU_HACK','GMOS_PILOTE_COC').replace('Cthulhu-Hack-1.1.0','COC-2.2.0-d20').replace("PERSO = 'clip-edith'","PERSO = 'clip-amelia'");
s=s.replace('useDiceStore: typeof useDiceStore;', 'useDiceStore: typeof useDiceStore; useJournalStore: typeof useJournalStore;');
fs.writeFileSync('e2e/clipCoc.spec.ts',s+fs.readFileSync('tmp/clip-coc-corps.txt','utf8'));
fs.mkdirSync('output/clips/coc/pilote',{recursive:true});fs.copyFileSync('Export Dirvers/corriges/coc/COC-2.2.0-d20.gmos-driver','output/clips/coc/pilote/COC-2.2.0-d20.gmos-driver');
