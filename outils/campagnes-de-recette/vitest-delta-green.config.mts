import {defineConfig} from 'vitest/config';
export default defineConfig({test:{environment:'jsdom',globals:true,setupFiles:['./src/test/setup.ts'],include:[
 'outils/campagnes-de-recette/delta-green.test.ts',
 'src/modules/dice/systemes/deltaGreen.test.ts',
 'src/modules/dice/deltaGreenAuPupitre.test.tsx',
 'src/modules/remote/logic/caviardageDesJoueurs.test.ts',
]}});
