# RuneQuest — Les Bornes du gué

<!-- verification-du-lot -->
Import et parcours Hub vérifiés en instance jetable ; les cas humains restent à essayer.
<!-- fin-verification-du-lot -->


Importer d’abord **01-Les-Bornes-du-gue.gmos**, par Bibliothèque → Importer un bundle Nexus → Importer telle quelle. Les deux autres fichiers sont des laboratoires hors fiction. Pour les remettre à zéro, réimporter uniquement le fichier voulu avec **Remplacer** ; ne pas remplacer l’aventure.

Pilote RuneQuest 2.1.0, ID custom-1793114851695, gabarit tpl-1793114851695 fournis comme dépendances ; l’import conserve un pilote déjà présent du même ID selon la version cible. Si une version 2.0.0 est déjà installée, importer **d’abord RuneQuest-2.1.0.gmos-driver avec Remplacer dans les pilotes** ; vérifier 2.1.0 et les coups localisés avant les campagnes. Une dépendance Nexus du même ID peut être conservée. Si 01 est déjà joué, préserver son export et importer seulement les laboratoires souhaités ; ne pas remplacer une aventure jouée pour mettre à jour le pilote.

- Thomas D. (p-1) : Arven des Trois-Pierres.
- Marie C. (p-2) : Déléa du Clos-Vert.
- Lucas R. (p-3) : Koros du Sceau-Fendu.

**21 nouveaux PJ : 3 dans 01, 9 dans 02 et 9 dans 03.** Joueurs réutilisés par leur ID ; anciens PJ, avatars et profils non copiés.

L’aventure est originale : une communauté fictive en Sartar, 12 PNJ, 8 lieux, 12 indices, 16 scènes / 4 actes, 3 rencontres facultatives, 4 séances prévues, 9 pages Wiki, butin et réserve, 4 moments Storyboard, sons et tuiles lumineuses sans appareil. Trois issues : preuve publique, accord ou réparation commune.

Les SVG sont des plans et cartouches documentaires ; les WAV de quatre secondes sont des signaux synthétiques. Aucun portrait illustré ni voix n’est prétendu livré. Les laboratoires réutilisent les supports de l’aventure comme décor de test, avec leurs propres IDs et PJ ; leurs scènes portent LAB.

02 : C01 aptitude 3, C02 aptitude 56, C03 aptitude 120, C04 opposition 140, C05 PV 2, C06 PV 0, C07 bras droit 0/3 (3 dégâts), C08 tête −4/4 (8 dégâts), C09 armure de jambe 5.

03 : M01 PM 0, M02 PM 1, M03 PR du culte 1 à 0, M04 POU 15, M05 Air 90, M06 Loyauté 85, M07 sorcellerie 55, M08 deux cultes aux réserves distinctes, M09 INT libre 0. Les profils sont choisis pour la recette, pas créés avec un budget novice.

**Aucun module RuneQuest spécifique compatible dans le catalogue actuel.** Panneau de jet et outils transversaux utilisés. Les coups localisés sont natifs dans Combat-OS : armure, dégâts de zone et total, plafond du membre et soins. Les maxima restent séparés des dégâts reçus. Coûts magiques, contrôle de l’INT libre, Runes opposées, progression et effets temporisés des blessures restent manuels. Les exercices runiques et de sorcellerie portant RECETTE sont abstraits, sans effet officiel ou sort de culte inventé.

La fiche HTML runequest-fr doit être intégrée dans le moteur de fiches cible ; le thème runequest doit être installé dans le corpus pour son habillage. Leur présence dans ce dépôt ne prouve pas celle sur une autre installation. La campagne n’embarque pas le moteur entier ni ne modifie le pilote pour imposer la bannière.

Suivre CAHIER-DE-RECETTE.md et remplir resultats.csv. Les 78 cas restent NON TESTÉS. Date fixe du lot : 2026-11-01T12:00:00.000Z. Contrôles et limites dans RAPPORT-DE-VERIFICATION.md et ANOMALIES-CONNUES.md.
