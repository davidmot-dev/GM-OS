# Clip Degenesis — reprise Codex — 06/11/2026

David : « peux-tu faire un clips avec Playright les mécanismes particulier de Degenesis en intégrant également les modules du jeu si nécessaire ».

## Produit livré

[MP4 livré de 3 min 57](../../output/clips/degenesis-mecanismes-et-outils.mp4), H.264, 1440 × 900. Scénario e2e/clipDegenesis.spec.ts, Falberg, Kum et Usudi fictifs, valeurs d’exercice, profil jetable et dés préparés.
Pilote existant **2.3.0**, copié sans modification depuis Export Dirvers/corriges/Degenesis_driver_gmos_finir.gmos-driver
dans output/clips/degenesis/pilote/. Le pilote 2.0.0 des anciennes campagnes de recette ne suffit pas pour ce parcours.
Aucun module indépendant Degenesis dans src/modules/modulesDuJeu/catalogue.ts : outils intégrés filmés.

Huit chapitres : test d’action et Égo ; maxima ; jets liés ; adversaire et round ; attaque ; santé à deux
pistes ; Sporulation/Germe/EX ; Brûlure et Potentiel. Seize scènes filmées.
La Sporulation11 pour maximum10 est une condition préparée avant le titre, pas une exposition jouée à l’écran.
Les nouveaux tests du Germe après l’Argus restent à résoudre ; sélection pédagogique, pas une recette exhaustive.

## Reprendre

Ouvrir le MP4. Build, lint, répétition et tournage normal réussis ; seize scènes et dix-huit images
du film relues. Rapports et repères dans output/clips/degenesis/ ; manuel/synthèse/registre §225 liés.
Pour refaire : npm run build puis npx playwright test e2e/clipDegenesis.spec.ts --reporter=list.
GMOS_CLIP_RAPIDE=1 pour répéter ; GMOS_SORTIE_CLIP et GMOS_PILOTE_DEGENESIS changent sortie/archive.
Services jetables déjà autorisés ; aucun code applicatif modifié, aucun commit/push demandé.

## Ne pas repayer

- Préparer la fiction et les combattants avant le titre, sans lancer le round : avant l’initiative, le
  panneau propose encore l’Égo du test hors combat ; après, il lit le bonus déjà payé au round.
- L’adversaire autonome a AGI/Mobilité/armures avant le titre ; PHY/Résistance/PSY/Égo se préparent à l’écran.
  Sans Réactivité, son initiative se saisit comme réserve générale, même après la préparation des pistes.
- Le nom de la carte de combattant est un texte, pas un heading ; filtrer sur le texte exact Falberg.
- Le calculateur générique a deux boutons « Déclencher dégâts » : mode et application finale.
  Son application au PJ laisse les pistes à0 malgré PV19 → 5 : constat JSON/capture dans
  output/clips/degenesis/constats/ et registre §1bis, sans correctif applicatif dans le lot.
  Le film utilise Intensité14, typephysique, « Infliger dégâts » sur la carte native.
- Sept dés à6 donnent sept déclencheurs ; quatre dés à4 au second test consomment le report sans nouveau six.
  Le test suivant est distinct pour l’action complexe : quatre succès et quatre déclencheurs, objectif8.
- Fixer fenêtre et viewport à1440×900, bloquer resize/maximisation ; captures à l’échelle CSS.
- Ne pas relancer tmp/creer-clip-degenesis.mjs après les ajustements.
- Préserver les films précédents et les changements étrangers, dont les chemins des livres en cours.
  Registre et synthèse sont partagés : un futur commit doit sélectionner les ajouts du lot.

**51 fichiers de livraison modifiés ou nouveaux, non commités**, listés dans
[le manifeste](../../output/clips/degenesis/fichiers-de-livraison.json). Les 36 tests du manuel passent ;
diff --check propre. Aucun reste pour le clip ; les autres recettes demeurent distinctes.
