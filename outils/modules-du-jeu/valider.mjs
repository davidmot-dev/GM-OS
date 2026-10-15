/** Contrat v1 : contrôle statique des manifestes, sans charger de code de module. */
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { validerLeManifeste } from './contrat.mjs';
export { validerLeManifeste, validerLesReferences } from './contrat.mjs';

async function executer(argumentsRecus) {
  if (!argumentsRecus.length || argumentsRecus.includes('--help')) {
    console.log('Usage : node outils/modules-du-jeu/valider.mjs <manifeste.json> [...]');
    console.log('Contrôle statique seulement ; aucun code de module exécuté.');
    return argumentsRecus.length ? 0 : 2;
  }
  let refus = false;
  const ids = new Set();
  for (const fichier of argumentsRecus) {
    try {
      const manifeste = JSON.parse(await readFile(fichier, 'utf8'));
      const erreurs = validerLeManifeste(manifeste);
      if (typeof manifeste?.id === 'string' && ids.has(manifeste.id)) erreurs.push('module.id : déjà présent dans ce lot.');
      if (typeof manifeste?.id === 'string') ids.add(manifeste.id);
      refus ||= erreurs.length > 0;
      console.log(`${erreurs.length ? 'REFUSÉ' : 'MANIFESTE CONFORME'} — ${fichier}`);
      for (const erreur of erreurs) console.log(`  - ${erreur}`);
    } catch (erreur) {
      refus = true;
      console.error(`REFUSÉ — ${fichier} : ${erreur.message}`);
    }
  }
  return refus ? 1 : 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = await executer(process.argv.slice(2));
}
