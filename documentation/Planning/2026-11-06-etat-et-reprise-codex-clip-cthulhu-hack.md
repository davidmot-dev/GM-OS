# Clip Cthulhu Hack — reprise Codex — 06/11/2026

David : « peux-tu faire un clips avec Playright les mécanismes particulier de Cthulhu Hack en intégrant également les modules du jeu si nécessaire ».

## Produit livré

[MP4 livré de 3 min 36](../../output/clips/cthulhu-hack-mecanismes-et-outils.mp4), H.264, 1440 × 900. Scénario `e2e/clipCthulhuHack.spec.ts`, personnages Edith Marsh et Nora Vale fictifs,
valeurs d’exercice, dés préparés et profil jetable. Pilote **1.1.0**, copié sans modification
depuis `output/campagnes-tests/cthulhu-hack/Cthulhu-Hack-1.1.0.gmos-driver` dans
`output/clips/cthulhu-hack/pilote/`. Aucun pilote nouveau ou réimport nécessaire.

Huit chapitres : Sauvegarde et Avantage/Désavantage ; Fortune joueur/MJ ; enquête et Matériel ;
déclin mental et Choc ; effets et Moments ; Hors Jeu standard, pertes et récupération ;
variante Pulp ; les trois tables de Table-OS. Seize scènes filmées.
Pas de module indépendant Cthulhu Hack au catalogue actuel : outils intégrés de la fiche,
de Dice-OS, Combat-OS et Table-OS. Les conséquences narratives restent jouées par le MJ.

## Reprendre

Ouvrir le MP4. Build, lint, répétition et tournage normal réussis ; seize scènes et dix-huit images
du film relues. Manuel, synthèse et registre §226 liés ; rapports et repères dans output/clips/cthulhu-hack/.
Pour refaire : npm run build puis npx playwright test e2e/clipCthulhuHack.spec.ts --reporter=list.
GMOS_CLIP_RAPIDE=1 pour répéter ; GMOS_SORTIE_CLIP et GMOS_PILOTE_CTHULHU_HACK changent sortie/archive.
Services locaux jetables déjà autorisés ; aucun code applicatif modifié ou commit/push demandé.

## Ne pas repayer

- Le sélecteur « Tirage » porte un titre, son span ne donne pas de nom accessible :
  le cibler par son titre explicite « Deux dés : l’Avantage garde le plus BAS… ».
- Le catalogue des modules importe des manifestes JSON sans attribut ; il se lit dans les
  sources, son import direct depuis le lanceur Playwright Node échoue avant les tests.
- Une relance de Fortune passe par les réglages présents du panneau : conserver le tirage
  du test jusqu’à la fin des relances. Aucun changement applicatif glissé dans le film.
- Dans le menu, Table-OS s’appelle « Tables Aléatoires ». Cibler ses listes visibles :
  l’atelier fermé conserve aussi des listes dans le DOM.
- Le panneau de jet écrit son résultat au journal, pas à l’historique de Dice-OS ; vérifier
  son verdict visible. Pour un dé isolé fixé, réserver plusieurs valeurs identiques :
  les animations peuvent consommer du hasard avant le clic. Toujours restaurer Math.random.
- Montrer les PA dans « Armures — protection déclarée », avant et après Fortune : le pupitre
  affiche le dé de Matériel, pas la protection.
- Fenêtre et viewport à 1440 × 900, resize/maximisation bloqués ; marge pour les légendes.
- Ne pas relancer `tmp/creer-clip-cthulhu-hack.mjs` après les ajustements du scénario.
- Préserver les clips précédents et les changements étrangers de la Forge/équipement.
  Registre et synthèse sont partagés ; relire la dernière numérotation avant livraison.

**49 fichiers de livraison modifiés ou nouveaux, non commités**, listés dans
[le manifeste](../../output/clips/cthulhu-hack/fichiers-de-livraison.json). Les 36 tests du manuel passent ;
diff --check propre. Aucun reste pour le clip ; les autres recettes demeurent distinctes.
