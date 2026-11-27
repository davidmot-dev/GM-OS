import {defineConfig} from 'vitest/config';
export default defineConfig({test:{environment:'jsdom',globals:true,setupFiles:['./src/test/setup.ts','./outils/campagnes-de-recette/traveller.setup.ts'],include:[
 'outils/campagnes-de-recette/traveller.test.ts',
 'src/modules/dice/systemes/traveller.test.ts',
 'src/modules/combat/logic/physiqueDeTraveller.test.ts',
 'src/modules/remote/logic/caviardageDesJoueurs.test.ts',
]}});
