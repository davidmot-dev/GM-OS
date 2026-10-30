import {defineConfig} from 'vitest/config';
export default defineConfig({test:{environment:'jsdom',globals:true,setupFiles:['./src/test/setup.ts'],include:['outils/campagnes-de-recette/runequest.test.ts','src/modules/dice/systemes/runequest.test.ts']}});
