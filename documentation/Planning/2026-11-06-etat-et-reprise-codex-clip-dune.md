# Clip Dune et modules — reprise Codex — 06/11/2026

David : « peux-tu faire un clips avec Playright les mécanismes particulier de Dune en intégrant également les modules du jeu ».
Scénario `e2e/clipDune.spec.ts`, sur le modèle de Nephilim/Crimes. Huit chapitres : 2d20/achat/aide,
Impulsion, Détermination/maximes, progression, Maison, cinq arènes et zones/atouts, intrigue,
neutralisation/destruction et nouvelle scène. Profil jetable, personnages et fiction de recette,
dés préparés, légendes sans voix. Pas de modification applicative ou installation.

## Produit

Film livré : **4 min 14, H.264, 1440 × 900**, `output/clips/dune-mecanismes-et-modules.mp4`, tournage WebM et rapports dans
`output/clips/dune/`. Pilote2.0.0 existant `output/campagnes-tests/dune/Dune-2.0.0.gmos-driver`.
Fiche de Maison Vaëlan et maximes de la recette, Lysa et deux autres personnages fictifs.
Un seul module Dune « Conflits et Maison », cinq arènes : ne pas inventer cinq modules.
Le plateau préparé avant le film est une fixture ; les commandes montrées sont les actions natives.

## Reprendre

Ouvrir le MP4. Build et lint réussis, répétition puis tournage normal réussis. Douze scènes
et dix-huit images du film relues, début et fin compris. Assertions de fiches, réserves,
accès des trois personnages et état natif du module. Repères, format et provenance dans
output/clips/dune/. Manuel et synthèse reliés ; contrôles finaux consignés au rapport.
Les essais de cette session ne valident pas import/rechargement ou transport Hub.

Pour refaire : npm run build, puis npx playwright test e2e/clipDune.spec.ts --reporter=list.
GMOS_CLIP_RAPIDE=1 sert à la répétition ; GMOS_SORTIE_CLIP et GMOS_PILOTE_DUNE changent
sortie et archive. Services locaux et essais jetables déjà autorisés ; aucun profil personnel
ni sauvegarde de David utilisés. Aucun commit/push demandé ; Nephilim/Crimes conservés.

## Ne pas repayer

- `DonneesDeFicheSchema` refuse `_gmos_dune` structuré : défaut reproduit dans
  `output/clips/dune/constat-validation.json`, registre §1bis. La semence reste scalaire,
  puis le suivi est placé dans les seules fiches fictives, avant le début du film.
  Aucun essai d’import/rechargement Dune n’est annoncé comme réussi.
- Attendre que la campagne apparaisse après hydratation ; ouvrir Modules du jeu avant
  d’attendre le contexte natif et de préparer le plateau via le pont de commandes.
- Fixer explicitement difficulté2 : l’archive démarre à1. Le libellé de spécialisation
  ajoute son critique après sélection, donc utiliser le préfixe pour la décocher.
- Ouvrir la carte externe carnet-dune avant ses sous-cartes de maximes/progression.
  `open` vaut une chaîne vide lorsqu’il est présent : comparer l’attribut à null.
- Le groupe porte la Maison ; ses rubriques gouvernent celles du module. La Menace de
  séance s’applique seulement après le clic, selon le nombre de joueurs déclarés.
- La bibliothèque HTML du profil jetable est vide : créer la fiche de Maison depuis
  les données fictives avant le titre, puis attendre son vrai champ house.name, pas
  seulement l’iframe ou le bouton. Le moteur embarque déjà le gabarit dune-maison-fr.
- Les cases d’accès aux modules attendent une réponse native asynchrone : cliquer,
  puis attendre toBeChecked et l’état d’accès du pont, plutôt que setChecked immédiat.
- Changements étrangers conservés : export RuneQuest, guides10/12/82/83, .codex/, autres
  exports et traces ; les notes et films Nephilim/Crimes sont nos livraisons précédentes.

**45 fichiers de livraison modifiés ou nouveaux, non commités**, listés dans
[le manifeste](../../output/clips/dune/fichiers-de-livraison.json). Les 36 tests finaux du manuel
passent ; diff --check propre. Aucun reste pour le clip ; défaut de schéma générique distinct au §1bis.
