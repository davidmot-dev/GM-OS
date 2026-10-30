# Reproduire

Depuis la racine du dépôt :

1. node outils/campagnes-de-recette/runequest.mjs
2. npx.cmd vitest run --config outils/campagnes-de-recette/vitest-runequest.config.mts --maxWorkers=4 --reporter=json --outputFile=output/campagnes-tests/runequest/verification-archives.json
3. node outils/campagnes-de-recette/runequest-visuels.mjs ; examiner les captures.
4. Si autorisé : npm.cmd run build, puis npx.cmd playwright test e2e/campagneDeRecetteRuneQuest.spec.ts --reporter=list (instance jetable).
5. node outils/campagnes-de-recette/emballer-runequest.mjs

Une régénération invalide les anciens rapports dépendants ; l’emballage contrôle les empreintes.
