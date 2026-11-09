import {defineConfig} from 'vitest/config';
export default defineConfig({test:{environment:'jsdom',globals:true,setupFiles:['./src/test/setup.ts'],include:[
 'outils/campagnes-de-recette/argyropee.test.ts',
 'outils/campagnes-de-recette/argyropee-ecrans.test.tsx',
 'src/modules/dice/systemes/argyropee.test.ts',
 'src/modules/session/components/fields/PanneauDeJet.argyropee.test.tsx',
 'src/modules/session/components/fields/PanneauDeJet.argyropee-journee.test.tsx',
 'src/modules/dice/argyropeeAuPupitre.test.tsx',
 'src/modules/remote/logic/caviardageDesJoueurs.test.ts',
]}});
