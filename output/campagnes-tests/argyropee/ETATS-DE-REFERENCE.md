# États de référence — Argyropée

Date fixe : 2026-11-09T12:00:00.000Z. Tous les profils d’essai sont dans la même campagne. Cette annexe **n’est pas un import**.

## Restaurer seulement un essai

1. Arrêter les interactions sur le personnage ciblé ; fermer le panneau de jet pour abandonner sa préparation locale.
2. Ouvrir uniquement sa fiche GM-OS et rétablir les champs ci-dessous. Les champs santé négative peuvent être saisis dans le champ numérique de la fiche HTML (tracks.health), puis contrôlés côté GM-OS.
3. Pour SANTE, remettre l’actuel à4, le maximum à8 et la protection à2/3. Le modèle HP générique borne à0 les dégâts ; l’écart est documenté, ne pas prétendre restaurer l’inconscience de règle par un coup générique.
4. Rouvrir le panneau, vérifier valeurs et options (métier, aidants, modificateur, Action complexe, opposition et Faveur). Restaurer les champs de sorts ou domaines si le cas les a modifiés.
5. Recharger et comparer avec une note témoin laissée dans une scène de fiction et avec la réserve de Marin, relevées avant l’essai. Elles doivent rester inchangées.

**Nexus Remplacer réimporte toute la campagne, pas un atelier.** Ne pas le faire pour recommencer un cas. Ni Réveil, ni Fin du combat, ni Guigne réglée ne sont des restaurations complètes d’atelier.

## État de base de tous les profils

Endurance morale3, Endurance physique3, maximum8, santé8, Panache12, bonus permanent0, prières0, magie0, silenciada false, repère Guigne0, offrande0, bonus_initiative0, pécule0 et marque vermeille0 ; autres valeurs de base dans PERSONNAGES.md. Chaque variante suivante remplace seulement les champs cités.

### [RECETTE] JET

ID : recette-argyropee-maree-20261109-pj-jet.

- serrurerie : 3
- furtivite : 4
- escalade : 1
- commerce : 3
- combat_rapproche : 7
- metier1_nom : "Malandrin"
- metier1_bonus : 2
- metier1_rang : "Compagnon"
- metier2_nom : "Démonstrateur de recette"
- metier2_bonus : 5
- metier2_rang : "Virtuose"
- panache : 12
- sciences_religieuses : 0

### [RECETTE] ZERO

ID : recette-argyropee-maree-20261109-pj-zero.

- panache : 0
- serrurerie : 3
- metier1_nom : "Malandrin"
- metier1_bonus : 2
- sort1 : "[RECETTE] Vibration d’un verre vide"
- humeur1_domaine : "Eau"
- humeur2_domaine : "Verre"

### [RECETTE] JOUR

ID : recette-argyropee-maree-20261109-pj-jour.

- panache : 3
- panache_bonus : 2
- points_de_sante : 0
- sciences_religieuses : 2
- faveur_divine : 1
- magie_du_combat : 4
- guigne_depense : 6
- guigne_offerte : 3

### [RECETTE] BAS

ID : recette-argyropee-maree-20261109-pj-bas.

- panache : 2
- points_de_sante : 4
- sciences_religieuses : 2
- faveur_divine : 2

### [RECETTE] INCONSCIENT

ID : recette-argyropee-maree-20261109-pj-inconscient.

- panache : 3
- points_de_sante : -1
- sciences_religieuses : 1

### [RECETTE] MAGIE

ID : recette-argyropee-maree-20261109-pj-magie.

- panache : 10
- sens_magique : 3
- magie_du_combat : 6
- silenciada : false
- guigne_depense : 0
- sort1 : "[RECETTE] Vibration d’un verre vide"
- humeur1_domaine : "Eau"
- humeur2_domaine : "Verre"

### [RECETTE] DOUBLE

ID : recette-argyropee-maree-20261109-pj-double.

- panache : 3
- sens_magique : 3
- magie_du_combat : 0
- sort1 : "[RECETTE] Vibration d’un verre vide"
- humeur1_domaine : "Verre"
- humeur2_domaine : "Verre"

### [RECETTE] SANTE

ID : recette-argyropee-maree-20261109-pj-sante.

- endurance_morale : 3
- endurance_physique : 3
- points_de_sante : 4
- panache : 8
- protection1_nom : "Protection synthétique de recette"
- protection1_valeur : "2/3"
- protection1_malus : "0"
- chatiment_vermeil : 0

## Geste collectif de la Guigne

Guigne réglée agit sur tous les PJ de cette campagne. Relever les couples guigne_depense/guigne_offerte de chacun avant ce cas, puis restaurer manuellement exactement ces champs, héros compris. La recette locale de FIC-03 n’utilise pas ce geste collectif. Aucun état privé d’une campagne existante n’est concerné.
