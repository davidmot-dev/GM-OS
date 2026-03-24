# 🗺️ Guide Utilisateur : Map OS

Le module **Map OS** est votre table de jeu virtuelle. Il permet de gérer les cartes tactiques, le brouillard de guerre, les pions de combat et les interactions spatiales, le tout synchronisé en temps réel vers vos joueurs.

![Aperçu du module Map OS](file:///C:/Users/david/OneDrive/Jeux%20de%20R%C3%B4les/GM-OS-v5/documentation/User%20Guides/map_mockup.png)

## 📋 Présentation du Module

Map OS combine la puissance d'un logiciel de cartographie et d'un gestionnaire de combat :

1. **Régie Cartographique** : Importez des plans de donjons, des cartes de villes ou des paysages.
2. **Brouillard de Guerre (Fog of War)** : Révélez la carte progressivement selon l'exploration des joueurs. Le masquage est désormais **physique** : tout ce qui est situé sous le calque de brouillard (pions, magie, carte) est occulté automatiquement.
3. **Pions Tactiques (Tokens)** : Placez et déplacez les combattants directement sur la grille.
4. **Grille Tactique** : Affichez une grille personnalisable pour les mesures de distance.
5. **Projection Synchronisée** : Diffusez la vue "Joueur" sans vos outils de maître de jeu.

## 🛠️ Outils de Brouillard de Guerre (Fog of War)

Le brouillard de guerre masque les zones non explorées. Vous disposez de plusieurs modes et outils :

- **Modes** :
    - **Révéler (Reveal)** : Le pinceau ou les formes retirent le brouillard.
    - **Masquer (Hide)** : Le pinceau ou les formes rajoutent du brouillard (pour corriger une erreur).
- **Outils de Dessin** :
    - **Pinceau (Paintbrush)** : Pour un tracé libre et organique.
    - **Zone (Square/Circle)** : Pour révéler des pièces entières ou des rayons de lumière circulaires instantanément.
- **Commandes Globales** :
    - **Tout révéler (Eye)** : Retire instantanément tout le brouillard de la carte.
    - **Tout masquer (EyeOff)** : Recouvre la carte entière de noir.

> [!IMPORTANT]
> **Persistance Intelligente** : Le brouillard est sauvegardé **par carte**. Si vous changez de lieu, le brouillard de votre précédente map est conservé. Toute nouvelle carte est chargée avec un **brouillard noir complet** par sécurité.

## 🎞️ Gestion des Couches (Layers)

Un nouveau panneau de contrôle vous permet de masquer/afficher dynamiquement les éléments de jeu sans les supprimer :
- **Brouillard** : Pratique pour voir toute la map sans révéler aux joueurs.
- **Grille** : Activez ou désactivez le quadrillage.
- **Pions** : Cachez tous les combattants instantanément.
- **Magie & Danger** : Masquez les effets visuels d'AoE et de pièges.
- **Météo** : Désactivez les particules (pluie, neige) si besoin.

## 🌦️ Effets Atmosphériques (Météo)

Apportez une couche d'immersion supplémentaire avec le moteur de particules intégré :
- **Types d'effets** :
    - **Pluie (Rain)** : Idéal pour les scènes d'extérieur sombres ou orageuses.
    - **Neige (Snow)** : Pour les ambiances polaires ou hivernales.
    - **Brouillard (Smoke/Fog)** : Pour les cimetières, les marais ou les incendies.
- **Contrôle d'Intensité** : Ajustez le curseur pour passer d'une bruine légère à une tempête battante.
- **Synchronisation** : Comme pour le reste, l'effet s'affiche sur votre écran de contrôle et simultanément sur celui des joueurs.

## 📏 Grille Tactique

Activez la grille pour faciliter les déplacements et les combats :
- **Taille de Grille** : Ajustez le nombre de pixels par case pour correspondre parfaitement à votre image.
- **Apparence** : Modifiez la couleur (blanc/noir) et l'opacité pour que la grille soit visible sans masquer les détails artistiques de la carte.

## ♟️ Gestion des Pions (Tokens)

Map OS est étroitement lié au **Combat OS** :
- **Ajout rapide** : Tous les combattants actifs dans votre combat actuel apparaissent dans la liste latérale. Un clic sur l'icône **+** les place sur la carte.
- **Mouvement** : Utilisez l'outil **Pions** pour sélectionner et faire glisser les combattants.
- **Synchronisation** : Si vous déplacez un pion sur votre écran, il se déplace instantanément sur l'écran des joueurs.

## 📡 Interaction et Projection

### Pings (Signaux visuels)
L'outil **Ping** permet de désigner un point précis sur la carte. Un cercle coloré éphémère apparaîtra sur l'écran des joueurs pour attirer leur attention ("Ici, vous voyez une trappe secrète").

### Projection vers les Joueurs
- Cliquez sur **Projeter** pour choisir la destination (Player Hub ou Écran secondaire).
- La vue projetée est **"Clean"** : elle ne contient ni les menus, ni les zones masquées par le brouillard de guerre du MJ, ni les outils de dessin.
- Utilisez **Recadrer** pour recentrer votre vue et celle des joueurs sur le centre de la carte.

## ☢️ Zones de Danger (Éditeur Obsidian Nexus)

L'éditeur de zones a été entièrement refondu pour offrir une expérience **Obsidian Nexus** premium, modulaire et hautement performante :

1. **Architecture en Colonnes** : Gérez la sélection, les paramètres visuels et la logique tactique dans des colonnes distinctes sans défilement inutile.
2. **Auras Dynamiques** : Liez une zone à un pion (PJ ou PNJ). Elle suivra ses mouvements en temps réel (sorts, lumière, effets de peur).
3. **Terrains Complexes** : Configurez des zones de ralentissement avec multiplicateur de coût de mouvement auto-calculé.
4. **Automation Audio/Lumineuse** : Déclenchez des scènes Philips Hue ou des ambiances sonores spécifiques dès qu'une zone est activée.

---

## 💾 Map Presets (Configuration de Scène)

Ne perdez plus de temps à configurer vos rencontres en cours de jeu. Les **Map Presets** vous permettent de capturer l'état complet d'une carte :

- **Sauvegarde de Scène** : Capture le brouillard, la position de tous les pions et toutes les zones de danger actives.
- **Rappel Instantané** : Préparez plusieurs variantes d'une même carte (ex: "Journée", "Embuscade de Nuit") et basculez entre elles en un clic.
- **Modularité** : Les presets sont sauvegardés par campagne pour une organisation parfaite.

---

## ✨ Vision de l'Oracle (Narration IA)

La **Vision de l'Oracle** est un assistant narratif puissant qui utilise l'Intelligence Artificielle pour donner vie à votre plateau tactique :

- **Analyse en Temps Réel** : L'Oracle examine l'emplacement des pions, le type d'ennemis, leur état de santé (PV), leurs allégeances (Factions) et les conditions environnementales (Météo, Zones de danger).
- **Génération d'Ambiance** : Produit instantanément un texte descriptif immersif que vous pouvez lire à vos joueurs pour introduire un combat ou une scène d'exploration.
- **Conseils Tactiques** : L'Oracle suggère des comportements intelligents pour vos PNJ basés sur leur situation actuelle (repli si blessé, harcèlement si en supériorité).
- **Intégration au Journal** : D'un clic, vous pouvez archiver la narration générée dans votre **Journal de Session** pour garder une trace indélébile de l'histoire.

---

## 💡 Astuces pour l'Immersion

> [!TIP]
> **Cartes Animées** : Map OS supporte les fichiers vidéo (MP4/WebM). Vous pouvez importer une forêt avec des feuilles qui bougent ou une mer déchaînée depuis le Media Hub pour un rendu spectaculaire.

> [!IMPORTANT]
> **Persistance et Reprise** : Votre exploration est sauvegardée dans le registre de session. Même après un redémarrage, chaque carte retrouve son état exact de brouillard.

---

## ⚙️ Raccourcis et Commandes

- **Molette Souris** : Zoom avant / arrière.
- **Clic Droit / Milieu** : Panoramique (déplacer la carte).
- **ESC** : Annuler l'outil actuel ou fermer les fenêtres d'import.
- **Target Blackout** : (Via Image OS) Couper la projection si les joueurs ne doivent plus voir la carte.
