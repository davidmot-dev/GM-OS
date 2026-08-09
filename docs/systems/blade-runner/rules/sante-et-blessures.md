---
sujet: Santé et blessures
systeme: blade-runner
couverture: complète
origine_supposee: SOCLE   # avis NotebookLM, non fiable (cf. plan corpus 4.6)
sources: BRN-01_LivreDeRegles.pdf p. 29, p. 55, p. 70-74, p. 193
pages_fiables: false
genere_par: notebooklm
relu: false
---

# Santé et blessures

## Règle

La Santé mesure la résistance physique du Blade Runner face à l'épuisement, aux traumatismes et aux attaques de la ville 1, 2. Elle est calculée à partir des attributs physiques du personnage, avec un bonus inhérent pour les Réplicants 1, 3. Les dégâts normaux réduisent cette réserve de Santé, simulant la fatigue, les éraflures et les commotions 2.  
Dès que la Santé d'un personnage tombe à 0, il devient **Brisé par les dégâts** 4. Il s'effondre et ne peut plus accomplir d'actions significatives ou de jets de compétence, bien que sa Santé ne puisse pas descendre en dessous de 0 4. Les dégâts ordinaires ne sont pas mortels en soi ; le véritable danger de mort provient des **Blessures Critiques** 2. Celles-ci surviennent lors d'une réussite critique de l'attaquant en combat (obtention d'au moins deux réussites) ou lorsqu'un personnage déjà Brisé subit de nouveaux dégâts 4, 5.  
Une blessure critique mortelle impose un temps limite (exprimé en Rounds ou en Quarts) avant que le personnage ne doive réussir un jet de sauvegarde contre la mort, sous peine de décéder définitivement 6, 7. La stabilisation de ces blessures critiques nécessite des soins médicaux d'urgence 7.

## Valeurs

* **Calcul de la Santé de base (Humains)** : (Grandeur de dé de Vigueur + Grandeur de dé d'Agilité) / 4, arrondi à l'entier supérieur 1. Les attributs vont de D (D6) à A (D12) 8, 9.  
* **Calcul de la Santé (Réplicants)** : Formule humaine de base + 2 points 3.  
* **Spécialité "Dur à cuire"** : Augmente la Santé maximale de 1 point par niveau (achetable jusqu'à 3 fois) 10.  
* **Seuil de l'état Brisé** : Exactement **0** point de Santé 4.  
* **Restauration de la Santé** :  
* *Premiers secours* (jet d'*Assistance médicale*) : Guérit immédiatement autant de points de Santé que de réussites obtenues 11.  
* *Récupération naturelle* : Récupération automatique de 1 point de Santé au bout d'un Quart (environ 6 heures) si le personnage est seul et Brisé 12.  
* *Pause* (Repos d'un Quart complet) : Récupère 1 point de Santé pour un humain, 2 points pour un Réplicant 12.  
* *Soin médical supplémentaire* (Quart de Pause + traitement médical ou borne MedicAid) : +1 point de Santé guéri en plus de la pause 2.  
* **Mécaniques des blessures critiques** :  
* *Seuil de blessure critique* : Obtention d'au moins **2 réussites** sur un jet d'attaque en combat rapproché ou à distance 13, 14.  
* *Critique aggravé* : Pour chaque réussite obtenue au-delà du seuil de touche critique, l'attaquant lance **1 dé de critique supplémentaire** du même type et choisit le résultat sur la table 5.  
* *Protection (Armure)* : Valeur de A à D 15. Lancez deux dés du type correspondant ; chaque réussite réduit les dégâts de 1. Si les dégâts tombent à 0, la blessure critique est annulée 15.  
* **Échelles de gravité des Blessures Critiques** :  
* *Percutantes (12 niveaux)* : De 1 (Dents cassées, non mortel, 1 semaine de guérison, désavantage aux jets de *Manipulation*) à 12 (Crâne broyé, mort instantanée) 16-18.  
* *Perforantes (12 niveaux)* : De 1 (Oreille arrachée, non mortel, 1 semaine de guérison, désavantage aux jets d'*Observation*) à 12 (Crâne brisé, mort instantanée) 18-20.  
* **Limites de temps des critiques mortels** :  
* *Round* : 5 à 10 secondes 6, 21.  
* *Quart* : Environ 6 heures 6, 22.  
* **Valeur de Chinyen pour les implants** : Coût de **6 à 10 points** pour soigner chirurgicalement un handicap permanent au marché noir 23-25.

## À la table

Concrètement, la gestion de la santé et des blessures se déroule selon ces étapes :

* **Encaisser des dégâts** : Le joueur coche ses points de Santé sur sa fiche 26. Si un humain obtient un "1" en forçant un jet de Vigueur ou d'Agilité, il s'inflige lui-même 1 point de dégât par  26.  
* **Tomber Brisé** : Dès que sa Santé atteint 0, le joueur pose sa figurine ou son jeton au sol. Il ne peut plus rien faire d'autre que ramper ou grogner 4.  
* **Subir une blessure critique** : L'attaquant adverse lance le dé de critique de son arme (ou utilise le dé de sa propre Vigueur pour une attaque de corps à corps percutante à mains nues) 5, 27. Il lit le résultat sur la table correspondante 5.  
* **Faire une sauvegarde contre la mort** : Si le critique est mortel, une fois la limite de temps écoulée (au prochain tour du personnage pour une limite d'un Round, ou au prochain Quart pour une limite d'un Quart), le joueur effectue un jet d'*Endurance* 6, 7.  
* *Échec* : Le Blade Runner meurt sur le coup 7.  
* *Réussite* : Il survit mais devra relancer à l'échéance suivante si sa blessure n'est pas stabilisée 7.  
* **Stabilisation par un allié** : Un allié doit utiliser une action en combat (ou consacrer son Quart en dehors) pour effectuer un jet d'*Assistance médicale* sur le blessé 28. Chaque réussite permet d'augmenter la limite de temps d'un cran (de Round à Quart, puis de Quart à stabilisée) 28. Une fois la blessure stabilisée, le danger de mort est écarté 28.

## Cas limites

* **Forçage pour les Réplicants** : Contrairement aux humains, les Réplicants qui forcent un jet physique ne subissent jamais de dégâts physiques en cas d'obtention de "1", mais reçoivent du stress à la place 26.  
* **S'auto-stabiliser** : Un personnage blessé à mort mais non Brisé peut tenter de stabiliser lui-même sa blessure critique mortelle en appliquant un *Désavantage* à son jet d'*Assistance médicale* 7.  
* **Double Assistance Médicale requise** : Si un personnage est à la fois Brisé (0 Santé) et victime d'une blessure critique mortelle, les alliés doivent réussir deux jets d'*Assistance médicale* distincts : l'un pour restaurer des points de Santé (Premiers secours) et l'autre pour stabiliser la blessure (Sauvegarde de vie) 29.  
* **Dangers du feu et de la noyade** : Ces éléments n'utilisent pas les tables de blessures critiques 30, 31. Si un personnage est Brisé par le feu ou la noyade, il doit simplement réussir un jet de sauvegarde contre la mort à chaque Round de son tour sous peine de mourir 30, 31.  
* **Traitement des PNJ** : Le Blade Meneur n'effectue pas de jets de dés pour les PNJ, sauf si leurs actions affectent directement un PJ 32. De plus, le MJ peut décider qu'un PNJ mineur meurt sur-le-champ lorsqu'il est Brisé par les dégâts 33.

## Non couvert

Rien. Les sources décrivent de manière exhaustive l'ensemble des règles de Santé, de dégâts physiques, de blessures critiques (percutantes et perforantes), de stabilisation, de mort et de récupération.  
