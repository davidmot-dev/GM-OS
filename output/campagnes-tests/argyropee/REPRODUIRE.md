# Reproduire Argyropée

Dans ce dépôt, avec les dépendances existantes :

```powershell
node outils/campagnes-de-recette/argyropee.mjs
npx.cmd vitest run --config outils/campagnes-de-recette/vitest-argyropee.config.mts --maxWorkers=4 --reporter=json --outputFile=output/campagnes-tests/argyropee/verification-archives.json
node outils/campagnes-de-recette/argyropee-verifier-plugin.mjs
node outils/campagnes-de-recette/argyropee-visuels.mjs
# Relire les captures avant de confirmer leur examen
node outils/campagnes-de-recette/argyropee-visuels.mjs --lecture-confirmee
node outils/campagnes-de-recette/emballer-argyropee.mjs
```

Aucun service ni installation nécessaires à ces contrôles. Toute régénération invalide les preuves précédentes. Import Electron et Hub réseau restent NON EXÉCUTÉS ; avant une future recette applicative, obtenir l’autorisation locale des services puis utiliser exclusivement profils, corpus, sauvegardes et ports jetables. Ne jamais utiliser les dossiers privés de David.
