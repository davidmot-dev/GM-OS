# Clip COC et joueur tactile — reprise Codex — 06/11/2026

David : « peux-tu faire un clips avec Playright les mécanismes particulier de COC en intégrant également les modules du jeu si nécessaire, est-ce que tu peux simuler les gestes d'un joueurs sur une tablette ? ».

## Produit livré

[MP4 livré de 3 min 52](../../output/clips/coc-mecanismes-et-tablette.mp4), H.264, 1440×900. Scénario `e2e/clipCoc.spec.ts`, pilote COC **2.2.0 d20** copié à l’identique depuis
`Export Dirvers/corriges/coc/COC-2.2.0-d20.gmos-driver` dans `output/clips/coc/pilote/`.
Amelia Steele et Victor Marlowe, PNJ et campagne fictifs, dés et valeurs d’exercice préparés.
Aucun code applicatif modifié ; aucun pilote nouveau à réimporter.

Huit chapitres : test ; héros et DEF ; Voie ; événement choquant ; PNJ/Pulp/bande ;
DM et santé ; joueur tactile sur le vrai Hub ; retour MJ et fiche synchronisée.
Seize scènes filmées. Aucun module indépendant dédié à COC dans le catalogue actuel.

La tablette est un vrai client Hub HTTP/WebSocket dans un contexte Edge neuf, tactile et
mobile, sans appBridge Electron. Son écran de 768 × 1024 est présenté dans un cadre de tournage.
Les boutons sont activés avec `Locator.tap`, les listes et champs sont pilotés par Playwright.
Le clip assemble le tournage du MJ et celui de la tablette, puis revient au MJ.
`outils/clips/monter_clip_coc.mjs` conserve les deux tournages bruts et fabrique le MP4/WebM.
Les informations du cadre de réception sont affichées après assertions sur les vrais magasins du MJ.
Aucune tablette physique utilisée ; sélection de mécanismes, pas une recette exhaustive.

## Reprendre

Ouvrir le MP4. Build, lint, répétition et tournage normal réussis ; seize scènes et vingt-deux images
du film relues, y compris ses deux raccords. 8 touchstart relevés dans le vrai Hub,
jet/héros/édition HTML reçus côté MJ. Manuel, synthèse et registre §227 liés.
Pour refaire : npm run build puis npx playwright test e2e/clipCoc.spec.ts --reporter=list.
GMOS_CLIP_RAPIDE=1 pour répéter ; GMOS_SORTIE_CLIP et GMOS_PILOTE_COC changent sortie/archive.
Services locaux jetables déjà autorisés ; aucun code applicatif modifié ou commit/push demandé.

## Ne pas repayer

- Garder fenêtre et viewport du MJ à 1440 × 900, sans redimensionnement ; même format pour
  le cadre de tournage tactile. L’iframe du Hub est réelle, à 768 × 1024 avant mise à l’échelle.
- Le hasard du Hub se règle dans son iframe, pas dans le cadre extérieur. Toujours restaurer
  Math.random ; un dé fixé utilise une réserve suffisante de valeurs identiques.
- Servir le cadre de présentation sur la même origine locale que le Hub, par une route
  Playwright en mémoire ; depuis about:blank, son chargement échoue. Déclarer UTF-8 dans
  le document et la réponse. Le cadre du dispositif utilise overflow:clip : overflow:hidden
  laisse scrollIntoView déplacer la tablette et rend ses onglets inaccessibles aux touchers.
- Le palier Héros à onze échelons propose +5 pour un échelon, pas +2. Les huit touchstart du
  Hub sont comptés dans son document ; les touchers de la fiche HTML imbriquée sont en plus.
- Attendre le titre de Dice-OS avant la capture de réception ; le contrôle des magasins
  réussit avant le rendu du module. Déplacer le curseur avant de photographier le petit champ9.
- Le suivi de santé COC est en dehors du data-panneau-de-jet ; sa carte repliable garde son
  propre contexte. Le summary du héros contient aussi « Temps hors combat » : prendre le premier.
- Le contexte tactile est jetable, bloque les hôtes externes et ne contacte que les deux
  ports attribués à l’instance de test. La fiche HTML redirige son port par défaut vers celui du test.
- Conserver les clips précédents et les changements étrangers, notamment la Forge en cours.
  Registre et synthèse sont partagés : relire la dernière numérotation avant livraison.
- Ne pas relancer `tmp/creer-clip-coc.mjs` après les ajustements du scénario.

**57 fichiers de livraison modifiés ou nouveaux, non commités**, listés dans
[le manifeste](../../output/clips/coc/fichiers-de-livraison.json). Les 36 tests du manuel passent ;
diff --check propre. Aucun reste pour le clip ; les autres recettes demeurent distinctes.
