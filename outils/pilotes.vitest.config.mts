import { defineConfig } from 'vitest/config';
// Les essais des exports de référence (`Export Dirvers/*.gmos-driver`), tous jeux confondus :
//   npx vitest run --config outils/pilotes.vitest.config.mts --maxWorkers=4
// ⚠️ À lancer depuis `C:\` (PowerShell) : depuis `c:/` en minuscule, vitest échoue partout sur « reading 'config' ».
export default defineConfig({ test: { environment: 'node', include: ['outils/*/pilote.test.ts'] } });
