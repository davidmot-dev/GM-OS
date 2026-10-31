# Reproduire dans le dépôt GM-OS

Sans installation supplémentaire, avec les dépendances existantes et le pilote indiqué dans
`provenance.json`. Date fixe : **2026-11-01T12:00:00.000Z**.

```text
node outils/campagnes-de-recette/shadowrun.mjs
npx vitest run --config outils/campagnes-de-recette/vitest-shadowrun.config.mts --maxWorkers=4 --reporter=json --outputFile=output/campagnes-tests/shadowrun-anarchy/verification-archives.json
node outils/campagnes-de-recette/shadowrun-verifier-plugin.mjs
node outils/campagnes-de-recette/shadowrun-visuels.mjs
npm run build
npx playwright test e2e/campagneDeRecetteShadowrun.spec.ts --reporter=list --output=output/campagnes-tests/shadowrun-anarchy/traces-electron
node outils/campagnes-de-recette/emballer-shadowrun.mjs
```

Les essais applicatifs nécessitent l’autorisation de lancer leurs services locaux. Toujours
employer le helper `e2e/lancerGmOs.ts` : profil, corpus, coffre et sauvegardes jetables,
appareils désactivés, ports de test distincts. Jamais les données personnelles.

Le vérificateur du plugin emploie le Python embarqué existant et `gmos_bundle.py` ; variables
facultatives `GMOS_PYTHON` et `GMOS_BUNDLE_TOOL`. La vérification des médias utilise Chrome
hors ligne et Playwright déjà présents. Toute régénération invalide les preuves liées aux SHA.
Examiner les neuf rendus et les captures Electron, puis consigner leur relecture et leurs
empreintes avant emballage. Un rapport absent laisse le lot PRÉPARÉ, sans preuve applicative.

Les sources de reproduction se replacent sous `outils/campagnes-de-recette/` et `e2e/`.
Le corpus, le moteur HTML et les modules métier de cette version du dépôt restent nécessaires.
Le pilote utilisé est livré à la racine ; les états JSON et médias sont également fournis.
