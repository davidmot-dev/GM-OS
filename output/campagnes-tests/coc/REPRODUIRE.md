# Reproduire dans le dépôt GM-OS

Dépendances déjà installées ; aucun paquet supplémentaire.

```text
node outils/campagnes-de-recette/coc.mjs
npx vitest run --config outils/campagnes-de-recette/vitest-coc.config.mts --maxWorkers=4 --reporter=json --outputFile=output/campagnes-tests/coc/verification-archives.json
node outils/campagnes-de-recette/coc-verifier-plugin.mjs
node outils/campagnes-de-recette/coc-visuels.mjs
npm run build
npx playwright test e2e/campagneDeRecetteCoc.spec.ts --reporter=list
node outils/campagnes-de-recette/emballer-coc.mjs
```

Le build et les essais applicatifs ne se lancent qu’après autorisation locale : services, profils, corpus et sauvegardes jetables exclusivement. Lire les scripts et les SHA avant tout rejeu ; une régénération invalide les rapports. Aucun dossier personnel requis. Après les rendus, examiner les captures et consigner leurs empreintes ; ne pas précocher une revue non faite.
