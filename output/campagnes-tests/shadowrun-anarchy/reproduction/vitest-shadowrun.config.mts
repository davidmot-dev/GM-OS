import {defineConfig} from 'vitest/config';
export default defineConfig({test:{environment:'jsdom',globals:true,setupFiles:['./src/test/setup.ts'],include:['outils/campagnes-de-recette/shadowrun.test.ts','src/modules/dice/systemes/shadowrun.test.ts','src/modules/combat/logic/moniteurDeShadowrun.test.ts','src/modules/session/components/fields/PanneauDeJet.shadowrun.test.tsx']}});
