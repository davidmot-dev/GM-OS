# 🗺️ Guide Utilisateur : Map OS

Le module **Map OS** est votre table de jeu virtuelle. Il permet de gérer les cartes tactiques, le brouillard de guerre, les pions de combat et les interactions spatiales, le tout synchronisé en temps réel vers vos joueurs.

![Aperçu du module Map OS](file:///C:/Users/david/OneDrive/Jeux%20de%20R%C3%B4les/GM-OS-v5/documentation/User%20Guides/map_mockup.png)

## 📋 Présentation du Module

Map OS combine la puissance d'un logiciel de cartographie et d'un gestionnaire de combat :

1. **Régie Cartographique** : Importez des plans de donjons, des cartes de villes ou des paysages.
2. **Brouillard de Guerre (Fog of War)** : Révélez la carte progressivement selon l'exploration des joueurs.
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

---

## 💡 Astuces pour l'Immersion

> [!TIP]
> **Cartes Animées** : Map OS supporte les fichiers vidéo (MP4/WebM). Vous pouvez importer une forêt avec des feuilles qui bougent ou une mer déchaînée depuis le Media Hub pour un rendu spectaculaire.

> [!IMPORTANT]
> **Persistance et Reprise** : Le brouillard de guerre que vous avez dessiné est sauvegardé dans votre session. Si vous changez de module ou fermez l'application, l'exploration des joueurs est conservée.

---

## ⚙️ Raccourcis et Commandes

- **Molette Souris** : Zoom avant / arrière.
- **Clic Droit / Milieu** : Panoramique (déplacer la carte).
- **ESC** : Annuler l'outil actuel ou fermer les fenêtres d'import.
- **Target Blackout** : (Via Image OS) Couper la projection si les joueurs ne doivent plus voir la carte.
