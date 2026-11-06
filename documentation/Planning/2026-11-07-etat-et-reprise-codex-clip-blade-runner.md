# Clip Blade Runner et joueur tactile — état et reprise Codex, 07/11/2026

David demande un clip Playwright des mécanismes particuliers de Blade Runner, avec les
éventuels modules du jeu et les gestes d’un joueur sur tablette.

## Produit livré

[MP4 livré de 3 min 17](../../output/clips/blade-runner-mecanismes-et-tablette.mp4), H.264, 1440×900. Scénario `e2e/clipBladeRunner.spec.ts`, montage `outils/clips/monter_clip_blade_runner.mjs`.
Pilote 2.0.0 copié sans modification depuis le fichier de recette conservé dans
`scratch/recette-br/BladeRunner_driver_gmos_finir.gmos-driver` vers
`output/clips/blade-runner/pilote/BR-2.0.0.gmos-driver`. L’export cité dans le manuel
n’est plus présent dans Export Dirvers/corriges ; aucune donnée personnelle consultée
pour le retrouver. Aucun réimport nécessaire au tournage.

Huit chapitres : dés échelonnés et soutien ; forçage humain/réplicant ; souvenir clé ;
stress et objet fétiche ; sauvegarde, stabilisations et soins ; initiative/protection ;
joueur tactile et Humanité HTML ; réception MJ. Dix-huit scènes filmées. Aucun module
indépendant dédié au catalogue : outils de la fiche, Combat-OS et Dice-OS.

## Reprise

Ouvrir le MP4. Build, lint, répétition et tournage normal réussis ; dix-huit scènes et vingt-deux
images relues, titres et deux raccords compris. 6 touchstart relevés ; test mental,
forçage, coût et saisie d’Humanité HTML reçus côté MJ. Manuel, synthèse et registre § 230 liés.
Pour refaire : npm run build puis npx playwright test e2e/clipBladeRunner.spec.ts --reporter=list.
GMOS_CLIP_RAPIDE=1 pour répéter ; GMOS_SORTIE_CLIP et GMOS_PILOTE_BR changent sortie/archive.

## Ne pas repayer

- Aucun fichier applicatif modifié ; profils, sauvegardes, personnages et dossier
  fictifs. Services locaux déjà autorisés. Aucun paquet installé, commit ou push demandé.
- La validation générale refuse `_gmos_blade_runner` structuré : les métadonnées de
  blessure sont donc posées après la semence scalaire, avant le générique. Le scénario
  appelle validateSession avant de lancer Electron, pour signaler ce refus clairement.
  Aucun import/rechargement du suivi de blessure revendiqué ; constat au §1bis.
- Après le forçage, la Santé de la fiche passe bien8→7, tandis que `pc.hp` et le compteur
  générique restent à8. La légende finale distingue ce compteur des pistes du jeu ;
  constat d’affichage/raccord conservé séparément, sans correction applicative.
- La plaie mortelle et les cartes3/7 sont préparées avant le générique, annoncées comme
  exercices. Pas de simulation d’une attaque qui aurait causé la blessure, ni de tirage
  aléatoire de ces cartes. Les boutons de sauvegarde, stabilisation et soins lancent
  réellement leurs dés ; les échéances ne sont pas accélérées par le temps réel.
- Le hasard préparé ne consomme sa file que dans `.roll()`. Poser le hasard joueur dans
  l’iframe du vrai Hub, pas dans la présentation extérieure.
- Copier thème, correspondance de fiche et Character_Sheet_Manager dans le corpus du
  profil jetable ; créer la fiche HTML avant le générique puis revenir à Lancer un test.
  L’ouverture du gros moteur peut dépasser quinze secondes : attendre jusqu’à soixante
  secondes le bouton de création, puis vérifier le nom réellement reçu dans l’iframe.
- Le suivi des blessures est une carte de CharacterSheetEditor, en dehors du panneau de
  jet : `blessures-blade-runner`. Le stress subi est dans le panneau. L’objet fétiche et
  le souvenir clé ont deux usages distincts, chacun une fois dans la séance.
- Vrai Hub HTTP/WebSocket sans appBridge, Edge mobile/tactile 768×1024, touchers tap(),
  choix et saisies HTML. Aucun clavier tactile natif ni appareil physique revendiqué.
  L’Humanité à4 est une saisie manuelle d’exercice, pas un bilan de fin de session.
- Présentation servie par l’origine locale du Hub, iframe à75%, overflow:clip.
  Origine vidéo tablette zéro : sa durée totale inclut une dernière image maintenue
  pendant la fermeture. Retirer aussi l’attente de fermeture avant le retour MJ.
- Pas de recette exhaustive : Brisé/effets critiques de stress, mort, premiers secours,
  main secourable, récupération, poursuites, fin de guérison et progression ne sont pas
  rejoués. Le clip ne démontre pas un combat complet.
- Préserver les clips précédents et les changements étrangers (Forge, langues, corpus,
  hooks/skills Claude, équipement, bannières et pilote RuneQuest).

**64 fichiers de livraison modifiés ou nouveaux, non commités**, listés dans
[le manifeste](../../output/clips/blade-runner/fichiers-de-livraison.json). Les 36 tests du manuel passent ;
diff --check propre. Aucun reste pour le clip ; les autres recettes demeurent distinctes.

## Livraison Git demandée le 07/11/2026

David : « commit et pousse ». Le périmètre réunit les treize clips non commités de
Nephilim à Blade Runner : films, scénarios, rapports, copies de pilotes et documentation
associée (643 chemins distincts, d’après leurs manifestes). Les exports originaux,
bannières, traces de recette et changements étrangers restent hors du commit.
Le hook pré-push exécute types, lint, tests avec quatre workers et build ; consulter le
commit et son envoi dans git log/les références de production pour l’état de livraison.
