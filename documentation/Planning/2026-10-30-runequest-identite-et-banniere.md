# RuneQuest — identité visuelle et bannière, 30/10/2026

Demande de David : « fais la bannière et l'identité visuelle de Runequest », avec GM-OS Studio, après le thème et la fiche de personnage.

## Fichiers livrés

- [Bannière](../../docs/systems/runequest/RuneQuest%20Band.jpg) : **JPG opaque, 2400 × 600 px, 333 034 octets**, qualité 93, rapport 4:1. Illustration originale générée avec l'outil natif `image_gen`, sans fournisseur configuré, sans modification du pilote.
- [Identité à copier](../../output/identites/runequest/identite-visuelle.md) : exactement deux lignes anglaises, **STYLE : 48 mots ; AVOID : 13 mots**, validées par `outils/rpg-visual-identity-builder/valider-identite.mjs`. Le bloc décrit le rendu des images, sans y imposer le décor de la bannière.
- [Invites anglaises exactes](../../output/bannieres/runequest/invite-generation.md), première génération retenue ; deuxième essai conservé uniquement pour la provenance.
- [Mesures](../../output/bannieres/runequest/verification-finale.json), [aperçu 1188 × 54](../../output/bannieres/runequest/apercu-1188-final.png), [aperçu 700 × 54](../../output/bannieres/runequest/apercu-700-final.png).

## Direction retenue

Les illustrations fournies (PNG suffixes 5, 13 et 21) ont un trait d'encre fin, des aplats mats nuancés, une texture imprimée, des terres chaudes, des verts jade et des bleus assourdis. L'identité retient ce vocabulaire dessiné et l'époque de bronze ; la bannière prend une palette plus sombre et resserrée pour la lecture de l'en-tête, accordée au vert-de-gris et au cinabre du thème sans modifier celui-ci.

Scène propre à la bannière : vallée fluviale crépusculaire, habitat de terre cuite, sanctuaire de pierre en terrasses, collines et nuages stylisés. Aucun lieu canonique précis n'est revendiqué. Pas de logo, texte, cadre, visage ou personnage au premier plan.

## Taille et accord de David

Les deux générations demandées en grande taille sont sorties en **2172 × 724 px**. Le premier dessin a été retenu et recadré sans étirement à **2172 × 543**, fenêtre `(0, 24, 2172, 543)` : le sanctuaire reste reconnaissable dans le ruban central de 54 px. Cette adaptation du centre a été vérifiée sur quatre essais de cadrage.

David a explicitement autorisé l'agrandissement le 30/10/2026 : **« Oui, exporter à 2 400 × 600 »**, après explication du facteur **+10,5 %** et de l'absence de détail ajouté. L'export final part du PNG original conservé dans `output/bannieres/runequest/source.png`, et non du JPG déjà compressé.

Recette : `node outils/runequest/preparer-banniere.mjs` pour le natif ; `node outils/runequest/preparer-banniere.mjs --2400` pour l'export agrandi autorisé. Le script refuse d'écraser un fichier existant. La version native reste disponible dans `output/bannieres/runequest/RuneQuest Band-native.jpg` (2172 × 543, 322 140 octets).

## Contrôles et activation

JPG final décodé et mesuré, sous la limite de 500 000 octets. Panorama relu, simulations de l'en-tête contrôlées à 1188 et 700 px de large, hauteur 54 : silhouette du sanctuaire au centre, bords calmes, titre et commandes lisibles sous un voile de démonstration. Ces aperçus ne sont pas des captures de GM-OS et ne garantissent pas le contraste du thème réel.

Dans GM-OS : **éditeur du pilote → Bannière de l'en-tête → choisir `RuneQuest Band.jpg`**. Copier séparément les deux lignes STYLE / AVOID dans les champs d'identité visuelle du jeu. Aucun pilote, campagne, thème, fiche, fichier `src/` ou `electron/` ni donnée personnelle modifié par cet atelier ; aucun commit.
