# Reproduire dans le dépôt GM-OS

Dépendances déjà présentes, aucun paquet à installer. Date fixe 30/10/2026.

1. node outils/campagnes-de-recette/degenesis.mjs
2. npx.cmd vitest run --config outils/campagnes-de-recette/vitest-degenesis.config.mts --maxWorkers=4 --reporter=json --outputFile=output/campagnes-tests/degenesis/verification-archives.json
3. node outils/campagnes-de-recette/degenesis-verifier-plugin.mjs (outil portable du plugin, chemins ajustables par GMOS_PYTHON et GMOS_BUNDLE_TOOL).
4. node outils/campagnes-de-recette/degenesis-visuels.mjs ; regarder les rendus, consigner leur revue.
5. Après autorisation des services locaux : npm.cmd run build puis npx.cmd playwright test e2e/campagneDeRecetteDegenesis.spec.ts --workers=1. ELECTRON_RUN_AS_NODE doit être absent. Instance exclusivement jetable via lancerGmOs.ts.
6. Examiner les captures applicatives puis node outils/campagnes-de-recette/emballer-degenesis.mjs.

Les rapports sont liés aux SHA-256 des archives ; toute régénération exige leur reprise. Les sources de reproduction utilisent les modules métier du dépôt et le relevé joueurs autorisé ; elles ne sont pas un programme autonome. Pas de lecture du profil ou des sauvegardes personnelles.
