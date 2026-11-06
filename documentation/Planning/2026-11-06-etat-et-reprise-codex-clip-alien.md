# Clip Alien et joueur sur tablette — état et reprise Codex, 06/11/2026

David demande un clip Playwright des mécanismes particuliers d’Alien, avec les modules
du jeu et les gestes d’un joueur sur tablette.

## Produit livré

[MP4 livré de 3 min 08](../../output/clips/alien-mecanismes-modules-et-tablette.mp4), H.264, 1440×900. Scénario `e2e/clipAlien.spec.ts`, pilote 1.9.0 copié sans modification depuis
`Export Dirvers/Alien_driver_gmos_1793655035463.gmos-driver` vers
`output/clips/alien/pilote/ALIEN-1.9.0.gmos-driver`. Cette copie sert au tournage ; aucun
réimport nécessaire. Le pilote d’origine est un fichier étranger à conserver.

Neuf chapitres : forçage/Point de Récit, Panique, Air, préparation spatiale, M314 et accès,
test tactile et question privée MU/TH/UR, réponse MJ, lecture et ordre spatial du joueur,
révélation et réception du test côté MJ. Dix-huit scènes filmées.

## Reprise

Ouvrir le MP4. Build, lint, répétition et tournage normal réussis ; dix-huit scènes et vingt-huit
images du film relues, y compris les quatre raccords. 15 touchstart relevés ; test,
question/réponse, échos et ordre spatial échangés par les vrais clients. Manuel, synthèse
et registre §228 liés. Les 36 tests du manuel sont consignés au rapport de contrôle.
Pour refaire : npm run build puis npx playwright test e2e/clipAlien.spec.ts --reporter=list.
GMOS_CLIP_RAPIDE=1 pour répéter ; GMOS_SORTIE_CLIP et GMOS_PILOTE_ALIEN changent sortie/archive.

## Ne pas repayer

- Aucun fichier `src/` ou `electron/` modifié pour le film. Profil, sauvegardes et joueurs
  jetables ; services locaux déjà autorisés par David. Aucun paquet installé.
- Le Hub est le vrai client HTTP/WebSocket sans `appBridge`, dans Edge avec `hasTouch`
  et `isMobile`, écran 768×1024. `tap()` crée les événements tactiles ; les saisies et
  sélections passent par les contrôles HTML. Aucun clavier tactile natif ni tablette
  physique revendiqué. Le pointeur graphique est un repère de présentation.
- Le cadre de tournage est servi depuis l’origine locale du Hub ; iframe à 75 %,
  `overflow:clip`. `about:blank` provoquait un écran noir, `overflow:hidden` décalait le cadre
  lors du défilement vers un contrôle.
- Le hasard préparé du test joueur appartient à l’iframe du Hub. Les jets du moteur
  natif de modules ne suivent pas ce hasard : le test de batterie M314 reste aléatoire.
- Les files de dés du panneau ne sont consommées que par les appels à `.roll()` : un
  appel aléatoire hors jet décalait le premier tirage. Les assertions vérifient les
  résultats obtenus ; recontrôler ce filtre si le moteur ou sa compilation change.
- Le Point de Récit nécessite le mode Cinéma ; préparer le suivi complet (objectifs,
  bilans et listes d’usages compris). Ouvrir la carte Stress et Panique avant de la
  montrer, puis Blessures et soins pour la Survie. Dans le Hub, fermer la fiche avec
  Retour avant de toucher la navigation vers les modules.
- Le plan, les pions, le Montero et son poste sont préparés avant le générique ; les
  Marines et le combat spatial sont préparés par commandes natives de mise en place.
  Le Conestoga, les accès, le scan, les tests, la question, la réponse, l’ordre joueur
  et la révélation sont réellement actionnés dans leurs écrans.
- Le clip arrête le combat spatial après révélation : il ne démontre pas sa résolution
  complète, ses dégâts ou avaries. Ni recette exhaustive du pilote, ni essai physique.
- Deux séquences tactiles remplacent leurs intervalles du tournage MJ ; les bruts et
  `montage.json` permettent de refaire le montage avec `outils/clips/monter_clip_alien.mjs`.
- Le WebM du Hub maintient sa dernière image pendant la fermeture : ne pas déduire
  son origine de « durée vidéo moins durée de tournage ». Le remontage vérifié utilise
  l’origine zéro et retire les sept secondes de fermeture avant le chapitre9. Les
  quatre raccords et la lecture de la réponse MU/TH/UR ont été réexaminés après correction.
- Préserver les précédents clips et les changements étrangers (Forge, équipement,
  bestiaire, chemins des livres, pilote RuneQuest, fichiers du corpus COC).

Aucun commit ou push demandé pour ce clip.

**67 fichiers de livraison modifiés ou nouveaux, non commités**, listés dans
[le manifeste](../../output/clips/alien/fichiers-de-livraison.json). Les 36 tests du manuel passent ;
diff --check propre. Aucun reste pour le clip ; les autres recettes demeurent distinctes.
