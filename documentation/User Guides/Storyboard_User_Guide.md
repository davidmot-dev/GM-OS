# 🎬 Guide Utilisateur : Master Storyboard

Le module **Master Storyboard** est le chef d'orchestre de votre partie. Il vous permet de synchroniser instantanément l'ambiance sonore, l'éclairage et les visuels pour créer des moments cinématographiques inoubliables.

![Aperçu du Master Storyboard](file:///C:/Users/david/OneDrive/Jeux%20de%20R%C3%B4les/GM-OS-v5/documentation/User%20Guides/storyboard_mockup.png)

## 📋 Présentation du Module

Le Storyboard est conçu pour gérer des "Moments". Un moment est une configuration prédéfinie qui impacte plusieurs modules simultanément :

1. Musique : Lance une piste spécifique de vos playlists.
2. Lumières : Applique une scène Hue (ex: Alerte Rouge, Nuit Calme).
3. Cartes (Atlas) : Charge une carte spécifique pour les joueurs.
4. Images : Affiche une illustration ou un portrait de PNJ.
5. Effets Sonores : Joue un son d'ambiance ponctuel.
6. Ambiances (Ambient-OS) : Rappelle un mixage complet de pistes de fond.

## 🚀 Comment l'utiliser ?

### 1. Accéder au module
Cliquez sur l'icône 🎬 (**Storyboard**) dans la section **Modules** de la barre latérale.

### 2. Créer un Moment
- Cliquez sur le bouton **+ NOUVEAU MOMENT** en haut à droite.
- Donnez un nom à votre moment (ex: *"Rencontre avec l'Inquisiteur"*).
- Utilisez les sélecteurs déroulants pour choisir les éléments à déclencher.
- **Astuce :** Le bouton **[Capturer Active]** à côté de chaque champ permet de copier instantatiquement ce qui est actuellement actif dans l'OS (votre musique actuelle, votre scène de lumière, etc.).

### 3. Déclencher un Moment
Sur la grille principale, cliquez simplement sur le bouton **PLAY** (triangle) au centre d'une carte.
- Tous les modules liés s'ajusteront en une fraction de seconde.
- L'icône du module s'illumine sur la carte pour indiquer ce qui est inclus dans le moment.

### 4. Modifier ou Supprimer
1. **Audio** : `useMusicStore.getState().playPad(musicPadId)`
2. **Lumières** : `useLightStore.getState().activateScene(lightSceneId)`
3. **Cartographie** : `useMapStore.getState().setCurrentMapUrl(mapUrl)`
4. **Visualisation** : `useImageStore.getState().setActiveMedia(imageMediaId)`
5. **Ambiance** : `useAmbientStore.getState().loadScene(ambientSceneId)`

## 📸 Fonction "Capture Active"
c Ambient-OS
Vous pouvez désormais préparer des "Scènes d'Ambiances" complètes dans le module Ambient-OS (mixage de 8 pistes) et les lier à un moment du Storyboard. 
- Allez dans **Ambient-OS**, réglez vos volumes, et enregistrez la scène (icône disquette).
- Elle apparaîtra automatiquement dans la liste déroulante "Ambiance" du Storyboard.

---

## 🎨 Intégration avec Ambient-OS
Vous pouvez désormais préparer des "Scènes d'Ambiances" complètes dans le module Ambient-OS (mixage de 8 pistes) et les lier à un moment du Storyboard. 
- Allez dans **Ambient-OS**, réglez vos volumes, et enregistrez la scène (icône disquette).
- Elle apparaîtra automatiquement dans la liste déroulante "Ambiance" du Storyboard.

---

## 💡 Exemples d'utilisation

### Scénario A : L'Embuscade
Préparez un moment nommé "Embuscade" qui :
- Lance une musique de combat tendue.
- Passe les lumières en orange pulsé.
- Affiche la carte du sentier forestier.
- Joue un cri de guerre en effet sonore.

### Scénario B : La Révélation
Préparez un moment nommé "Secret Révélé" qui :
- Coupe la musique de fond.
- Affiche l'illustration d'une ancienne relique.
- Passe les lumières au blanc froid intense.
- Lance une ambiance sonore "Vibrations Mystiques".

---

> [!TIP]
> Utilisez la fonction **Capture** pendant que vous improvisez en jeu pour "figer" une belle configuration et pouvoir la rejouer plus tard sans effort de préparation !
