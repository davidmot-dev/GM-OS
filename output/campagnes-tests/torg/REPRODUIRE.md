# Reproduire le lot Torg

Dans le dépôt et avec les dépendances existantes :

```powershell
node outils/campagnes-de-recette/torg.mjs
npx vitest run --config outils/campagnes-de-recette/vitest-torg.config.mts --maxWorkers=4 --reporter=json --outputFile=output/campagnes-tests/torg/verification-archives.json
node outils/campagnes-de-recette/torg-verifier-plugin.mjs
npm run build
npx playwright test e2e/campagneDeRecetteTorg.spec.ts --reporter=list
node outils/campagnes-de-recette/verifier-visuels.mjs torg
node outils/campagnes-de-recette/emballer-torg.mjs
```

Les services locaux ont déjà été autorisés en profils jetables. Aucune commande sur le profil de David. Relire les captures et déclarer cette lecture avant l’emballage ; un rapport sans les mêmes SHA est refusé. Toute régénération invalide les preuves dépendantes. Le ZIP contient un seul .gmos ; les sources reproduction/ se replacent aux chemins outils/campagnes-de-recette/ et e2e/ du dépôt.

<!-- verification-cartes -->
Avant l’emballage, exécuter `node outils/campagnes-de-recette/torg-verifier-cartes.mjs` pour décoder les dix faces. Examiner les cinq nouvelles images, puis relancer avec `--lecture-confirmee` uniquement après cette lecture explicite. Le vérificateur ne distribue aucune carte et ne modifie pas le pilote. Il exige les images de l’application sous public/assets/decks/torg/destin/.
<!-- fin-verification-cartes -->
