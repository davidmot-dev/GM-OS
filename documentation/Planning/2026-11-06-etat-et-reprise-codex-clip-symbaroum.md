# Clip Symbaroum — reprise Codex — 06/11/2026

David : « peux-tu faire un clips avec Playright les mécanismes particulier de Symbaroum en intégrant également les modules du jeu si nécessaire ».

## Produit livré

[MP4 livré de 2 min 44](../../output/clips/symbaroum-mecanismes-et-outils.mp4), H.264, 1440 × 900. Scénario e2e/clipSymbaroum.spec.ts, Éléna des Brumes fictive, profil jetable, dés préparés.
Pilote 2.0.0 existant retrouvé dans scratch/recette-pilotes/ et copié sans modification dans
output/clips/symbaroum/pilote/ : l’ancien chemin Export Dirvers/corriges/ du manuel est absent.
Ce film n’améliore pas le pilote et ne nécessite pas de réimport.

Huit chapitres : opposition ; Avantage et dégâts ; Défense, agonie et soins ; Corruption et
Stigmates ; fin de scène ; dérivées et progression ; bourse et voyage ; option des attaques parfaites.
Le catalogue src/modules/modulesDuJeu/catalogue.ts ne contient aucun module Symbaroum : outils
intégrés à la fiche filmés. Aucun code dans src/ ou electron/ modifié pour ce lot.

## Reprendre

Ouvrir le MP4. Build, lint, répétition et tournage normal réussis ; treize scènes et dix-huit
images du film relues. Rapports, provenance et repères dans output/clips/symbaroum/ ; manuel,
synthèse et registre §222 mis à jour. Pour refaire : npm run build puis
npx playwright test e2e/clipSymbaroum.spec.ts --reporter=list.
GMOS_CLIP_RAPIDE=1 sert aux répétitions ; GMOS_SORTIE_CLIP et GMOS_PILOTE_SYMBAROUM changent
sortie et archive. Services locaux déjà autorisés ; aucun commit/push demandé.

## Ne pas repayer

- Le modificateur du seuil est un input range : remplir directement sa valeur, sans effacer
  avec une chaîne vide. Garder les saisies numériques entières dans les composants contrôlés.
- Fixer viewport Playwright et fenêtre Electron à 1440×900 ; empêcher resize/maximisation
  pour que le film garde son cadrage. Captures à l’échelle CSS.
- Pilote existant : custom-1792493594094, version 2.0.0 ; ne pas réinventer une configuration.
- Le d20 est préparé avec (face − 0,5) / 20 ; les dés de protection et dégâts ont leurs faces propres.
- Préserver les films précédents et les chantiers étrangers : bestiaire, chemins des livres,
  exports, autres guides et corpus. Registre et synthèse sont partagés : sélectionner les ajouts
  de ce lot lors d’un futur commit, pas tous les changements de ces fichiers.
- Première prise : la fiche passe bien d’Endurance 10 à 6, puis 0 et 3 après les soins,
  mais la jauge générique du cockpit affiche encore 10/10. Preuve conservée dans
  output/clips/symbaroum/constats/cockpit-jauge.jpg ; à examiner séparément, sans correctif
  applicatif dans ce lot. La prise finale reste sur la fiche pour Corruption et fin de scène.
- Ne pas relancer tmp/creer-clip-symbaroum.mjs : le générateur initial écraserait les ajustements.
- Au retour de Défense vers Attaque, changer **d’abord l’attribut en Précision**, puis choisir
  Attaque : PanneauDeJet impose la nature Défense tant que cet attribut secondaire est sélectionné.
  L’échec de setChecked semblait d’abord asynchrone ; attendre le rendu ne résout pas ce cas.
  Les prises interrompues au dernier choix avaient déjà vérifié les compteurs et le voyage.

**47 fichiers de livraison modifiés ou nouveaux, non commités**, listés dans
[le manifeste](../../output/clips/symbaroum/fichiers-de-livraison.json). Les 36 tests du manuel passent ;
diff --check propre. Aucun reste pour le clip ; les autres recettes demeurent distinctes.
