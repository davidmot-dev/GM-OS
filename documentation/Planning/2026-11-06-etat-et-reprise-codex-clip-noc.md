# Clip NOC et outils intégrés — reprise Codex — 06/11/2026

David : « peux-tu faire un clips avec Playright les mécanismes particulier de NOC en intégrant également les modules du jeu ».

## Produit livré

[MP4 livré de 3 min 18](../../output/clips/noc-mecanismes-et-outils.mp4), H.264, 1440 × 900. Scénario e2e/clipNoc.spec.ts, inspiré de Dune/Nephilim/Crimes ; pilote NOC2.0.0 existant
dans output/campagnes-tests/noc/, fiction de recette des Veilleurs du Palier. Trois Héros
fictifs, dés préparés, profil jetable, légendes sans voix. Ce lot ne modifie ni src/ ni electron/.

Huit chapitres : Talent/Domaine et destin ; réserves du Héros ; apports de Cabale ; effets
du Fiel ; pistes et Séquelles ; Extase/Soupçon au repos ; fiche de Cabale et Faveurs ;
Rouage hostile et distinction séance/scénario. Le catalogue actuel ne contient aucun module
indépendant NOC (`src/modules/modulesDuJeu/catalogue.ts`) : les outils sont ceux du pilote,
de Session-OS, des fiches et de Dice-OS, sans inventer un adaptateur supplémentaire.

## Reprendre

Ouvrir le MP4. Build, lint, répétition et tournage normal réussis. Treize scènes et dix-huit
images du MP4 relues, titres compris ; format contrôlé. Manuel, synthèse et registre liés.
Pour refaire : npm run build puis npx playwright test e2e/clipNoc.spec.ts --reporter=list.
GMOS_CLIP_RAPIDE=1 sert aux répétitions ; GMOS_SORTIE_CLIP et GMOS_PILOTE_NOC changent
sortie et archive. Services locaux jetables déjà autorisés. Aucun commit/push demandé.

## Ne pas repayer

- La première tentative de build a croisé l’écriture d’un test du bestiaire par l’autre agent ;
  aucune correction ici. Sa nouvelle écriture est devenue valide ; le second build complet passe.
- Ne pas utiliser la bibliothèque HTML de David : créer les fiches fictives PJ/Cabale dans
  le profil jetable avant le titre. Attendre les vrais champs du moteur.
- Réserves de table NOC : Fiel et Menace, avec majuscules. Les stocks par scénario de Cabale
  ont des clés groupe:domains.action, groupe:assets.action.armory ; les pistes sont dans le groupe.
- Les 10 donnent un choix ; les points de Singularité ne se dépensent que contre les 1 utiles.
- Après un test sans dé, le panneau revient au plafond du Domaine. Un 10 suspend le résultat
  dans « Dés supplémentaires de destin » jusqu’au choix du joueur : attendre cette région.
- « Nouveau scénario » ouvre une confirmation native : cliquer « Remettre » pour exécuter.
- Les dépenses collectives peuvent consommer du hasard pour l’interface avant les dés ;
  la file de tournage prévoit des valeurs de secours sans 1 ni 10 et rend ensuite Math.random.
- Ne pas relancer tmp/creer-clip-noc.mjs : il écraserait les ajustements du scénario généré.
- Conserver les clips Nephilim/Crimes/Dune, leurs documents et les changements étrangers
  (bestiaire, export RuneQuest, guides10/12/82/83, autres exports, .codex/ et traces).
- Pendant le tournage, l’autre agent a poursuivi le bestiaire : sources, tests, guide50,
  plan détaillé, corpus Alien, §210 et ligne de synthèse du registre. Ces changements sont
  conservés ; un futur commit des clips doit isoler nos sections dans les fichiers partagés.

**45 fichiers de livraison modifiés ou nouveaux, non commités**, listés dans
[le manifeste](../../output/clips/noc/fichiers-de-livraison.json). Les 36 tests finaux du manuel passent ;
diff --check propre. Aucun reste pour le clip ; aucun module indépendant NOC ajouté.
