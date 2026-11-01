# Reproduire

Depuis la racine du dépôt :

1. node outils/campagnes-de-recette/runequest.mjs
2. npx.cmd vitest run --config outils/campagnes-de-recette/vitest-runequest.config.mts --maxWorkers=4 --reporter=json --outputFile=output/campagnes-tests/runequest/verification-archives.json
3. node outils/campagnes-de-recette/runequest-visuels.mjs ; examiner les neuf captures, puis node outils/campagnes-de-recette/runequest-verifier-plugin.mjs (GMOS_PYTHON et GMOS_VERIFICATEUR_CAMPAGNES si nécessaire).
4. Si autorisé : npm.cmd run build, puis npx.cmd playwright test e2e/campagneDeRecetteRuneQuest.spec.ts --reporter=list (instance jetable).
5. Examiner les sept captures Electron ; consigner les revues dans verification-medias.json (capturesExaminees) et verification-captures-electron.json (sept captures et SHA du rapport/test/helper).
6. node outils/campagnes-de-recette/emballer-runequest.mjs

Le générateur exige un pilote 2.1.0 de 320 champs : export corrigé s’il existe, sinon RuneQuest-2.1.0.gmos-driver livré, ou chemin GMOS_PILOTE_RUNEQUEST. L’export source des joueurs n’est plus présent : le relevé minimal autorisé est réutilisé sans relire de campagnes. L’ancien lot 2.0.0 et son CSV restent dans historique/2026-10-30-2.0.0, hors du ZIP courant. Une régénération invalide les anciens rapports dépendants ; l’emballage contrôle les empreintes.

Le rejeu de la comparaison 2.0.0 → 2.1.0 nécessite le pilote historique sous historique/2026-10-30-2.0.0 dans le dépôt. Ce dossier est conservé à part et exclu du ZIP courant. Le générateur Python du pilote est copié dans reproduction/ ; aucun export personnel nécessaire pour utiliser le pilote 2.1.0 livré.
