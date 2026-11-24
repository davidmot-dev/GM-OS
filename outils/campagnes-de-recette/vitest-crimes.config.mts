import {defineConfig} from 'vitest/config';
export default defineConfig({test:{environment:'jsdom',globals:true,setupFiles:['./src/test/setup.ts'],include:[
 'outils/campagnes-de-recette/crimes.test.ts',
 'src/modules/dice/systemes/potentielGarde.test.ts',
 'src/modules/dice/systemes/armesDeCrimes.test.ts',
 'src/modules/dice/systemes/psychologieDeCrimes.test.ts',
 'src/modules/dice/systemes/contactsEtFortuneDeCrimes.test.ts',
 'src/modules/dice/systemes/creationDeCrimes.test.ts',
 'src/modules/session/logic/pointsDEnquete.test.ts',
 'src/modules/session/components/fields/PanneauDeJet.garde.test.tsx',
 'src/modules/session/components/DossierDEnquete.test.tsx',
 'src/modules/remote/logic/caviardageDesJoueurs.test.ts',
]}});
