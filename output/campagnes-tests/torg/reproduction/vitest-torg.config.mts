import {defineConfig} from 'vitest/config';
export default defineConfig({test:{environment:'jsdom',globals:true,setupFiles:['./src/test/setup.ts'],include:[
    'outils/campagnes-de-recette/torg.test.ts',
    'src/modules/dice/systemes/torg.test.ts',
    'src/modules/dice/systemes/torgAudit.test.ts',
    'src/modules/combat/logic/dommagesDeTorg.test.ts',
    'src/modules/combat/suitesDeTorg.test.ts',
    'src/modules/session/logic/cartesDuDestin.test.ts',
    'src/modules/session/logic/cartesDeCosm.test.ts',
    'src/modules/session/logic/echangesDeTorg.test.ts',
    'src/modules/session/store/echangesTorg.test.ts',
    'src/modules/session/components/fields/PanneauDeJet.torg.test.tsx',
]}});
