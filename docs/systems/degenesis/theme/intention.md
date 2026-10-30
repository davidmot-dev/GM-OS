# Degenesis — intention du thème

Un papier de cendre clair, une encre presque noire et un rouge oxyde portent la sobriété éditoriale de Katharsys.
Le cadre noir mat reprend les cartouches du livre ; angles droits, filets interrompus et faibles ombres évoquent des archives et des matériaux usés.
Trois ornements et quinze icônes originaux mêlent cassures géométriques, repères techniques et traces de spores, sans reproduire un emblème de Culte.

## Limites signalées

- **PARTIELLEMENT RÉALISABLE — typographie.** Barlow Semi Condensed et Crimson Pro approchent respectivement les titres sans empattement et le texte éditorial des pages fournies ; aucune identification des polices originales n’est revendiquée. Replis Arial et Georgia hors ligne, Courier New pour les chiffres. Le logotype Degenesis ne devient pas une police d’interface.
- **PARTIELLEMENT RÉALISABLE — matière.** Deux SVG discrets et répétables suggèrent cendre, fibres et éraflures. Ils ne reproduisent pas la salissure photographique, les bords déchirés ni les grandes taches des pages ; le grain reste léger pour préserver la lecture.
- **PARTIELLEMENT RÉALISABLE — palette.** Le rouge du signe de couverture et les terres des illustrations deviennent un oxyde assombri lisible sur papier. Les couleurs d’état mousse, prune, ocre et ardoise constituent une adaptation fonctionnelle, distincte de la sélection.
- **PARTIELLEMENT RÉALISABLE — ornements.** Les cassures, le fragment hexagonal et les traces de spores sont des dessins originaux. Le contrat colore les ornements avec l’accent et les place à trois endroits fixes ; il ne permet pas de reproduire les bandeaux d’encre à n’importe quelle hauteur.
- **NON EXPRIMABLE — composition du livre.** Colonnes, illustrations à fond perdu, silhouettes découpées, vastes marges blanches et bordures arrachées ne se commandent pas par les jetons. Le thème ne modifie ni la disposition des modules ni la fiche de personnage.
- **NON EXPRIMABLE — iconographie des Cultes.** Les noms d’icônes autorisés désignent des outils GM-OS ; ils ne fournissent pas un emplacement par Culte. Aucune icône de Culte inventée n’est annoncée comme fonctionnelle.

## Références et contrôle

Créé le 30/10/2026 avec l’atelier thème de GM-OS Studio depuis les sept PNG `Degenesis - KATHARSYS_1`, `_7`, `_10`, `_11`, `_20`, `_23`, `_35` du dossier fourni. Les pages de règles fixent le papier et les filets ; les illustrations fixent le noir, les terres, le métal et la matière organique.

L’activation et l’observation dans GM-OS restent à faire. L’aperçu livré est une démonstration du thème, avec les polices système de repli ; il ne constitue pas une capture de l’application.

### Vérifications du 30/10/2026

- `npm.cmd run theme:valider -- degenesis` : **ACCEPTÉ, zéro erreur, zéro avertissement**. Rapports dans `apercu/validation.md` et `apercu/validation.json` ; tous les contrastes mesurés atteignent aussi les valeurs recommandées du contrat.
- Texte sur fond : **11,74:1** ; sur panneau : **13,20:1** ; au pire point du fond texturé : **10,45:1**. Texte secondaire sous texture : **4,62:1** ; accent sous texture : **5,10:1** ; texte sur accent : **7,05:1**. Cadre : **14,45:1** pour le texte, **7,98:1** pour l’élément actif.
- `npx.cmd vitest run electron/themesDesJeux.test.ts electron/validationDesThemes.test.ts --maxWorkers=4` : **103 essais réussis** ; nouvelle validation réussie après fixation des dimensions intrinsèques des matières.
- `apercu/theme-degenesis.png` : **1 440 × 1 050 px**, examiné visuellement ; trois ornements, quinze icônes montrées à 24 et 16 px. Rendu hors ligne en Arial / Georgia / Courier New. Reproductible par `node docs/systems/degenesis/theme/apercu/construire-apercu.mjs` depuis la racine du dépôt.
- Aucun code applicatif modifié, aucun lancement de GM-OS ni de serveur, aucune modification des sources de référence ou des données personnelles. Fichiers non commités.
