import {defineConfig} from 'vitest/config';
export default defineConfig({test:{environment:'jsdom',globals:true,setupFiles:['./src/test/setup.ts'],include:[
 'outils/campagnes-de-recette/vampire.test.ts',
 'src/modules/dice/systemes/vampire.test.ts',
 'src/modules/session/components/fields/PanneauDeJet.vampire.test.tsx',
 'src/modules/forge/rules/controlesDuPilote.vampire.test.ts',
 'src/modules/remote/logic/caviardageDesJoueurs.test.ts',
]}});
