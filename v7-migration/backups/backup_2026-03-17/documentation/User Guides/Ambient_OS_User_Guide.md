# 🌦️ Guide Utilisateur : Ambient OS

Le module **Ambient OS** est l'outil ultime pour créer des paysages sonores immersifs et évolutifs. Contrairement aux musiques (Music OS) ou aux effets ponctuels (Sound OS), Ambient OS permet de superposer jusqu'à 8 boucles sonores indépendantes (pluie, vent, rumeur de foule, drones) pour créer une ambiance sur mesure.

![Aperçu du module Ambient OS](file:///C:/Users/david/OneDrive/Jeux%20de%20R%C3%B4les/GM-OS-v5/documentation/User%20Guides/ambient_mockup.png)

## 📋 Présentation du Module

L'interface est conçue comme un pupitre de mixage vertical :

1. **Les 8 Pistes (Tracks)** : Chaque piste est une couche sonore distincte avec sa propre gestion de volume et de lecture.
2. **Univers & Thèmes** : Un système de bibliothèque pour charger des ensembles de sons pré-configurés.
3. **Les Scènes** : Des snapshots qui enregistrent l'état (Play/Stop) et le volume de chaque piste pour des changements de contexte rapides.

## 🚀 Fonctionnement des Pistes

### Gestion des Couches
- **Lecture / Pause** : Chaque bouton de piste lance une boucle infinie. Les fondus d'entrée et de sortie (1.5s) assurent une transition naturelle.
- **Mixage** : Utilisez les curseurs verticaux pour doser chaque élément. 
  *Exemple : Augmentez le vent et baissez le chant des oiseaux pour simuler l'arrivée d'une tempête.*
- **Visualisation** : Chaque piste dispose d'un micro-analyseur de spectre pour confirmer visuellement quel son produit du bruit.

### Sommation Mono (Legacy Summing)
GM-OS v5 intègre une technologie héritée de la v3 qui force la sommation mono des pistes d'ambiance. Cela garantit une parfaite clarté du son, peu importe la position des joueurs autour de la table, et évite les problèmes de phase dans les environnements acoustiques difficiles.

## 🛡️ Univers & Thèmes (Presets)

Pour gagner du temps en session, Ambient OS utilise une hiérarchie par Univers :

1. **Univers** : Catégorie globale (ex: *Fantastique*, *Cyberpunk*, *Horreur*).
2. **Thèmes** : Configuration spécifique de sons (ex: dans l'univers Fantastique, le thème "Forêt Enchantée" chargera des oiseaux, un ruisseau et du feuillage).

> [!TIP]
> **Key Learning** : Vous pouvez assigner des touches de votre clavier aux pistes pour les activer/désactiver à la volée.

## 🎭 Les Scènes d'Ambiance

Les scènes permettent de modifier radicalement le paysage sonore avec un seul bouton.

- **Snapshot Dynamique** : Une scène enregistre quels sons jouent et à quel volume.
- **Exemples par défaut** :
  - **Calme Plat** : Volume bas sur les pistes de fond.
  - **Tension** : Augmentation des basses et des drones inquiétants.
  - **Action / Danger** : Volume maximum sur tous les éléments pour une immersion totale.

## 💡 Liens Lumineux (Philips Hue)

Tout comme les autres modules audio de GM-OS, les pistes d'Ambient OS peuvent piloter vos lumières :

1. **Lien par Piste** : Associez une scène lumineuse à une piste (ex: la piste "Orage" liée à une scène de flashs bleutés).
2. **Priorité Intelligente** : Si plusieurs pistes liées jouent en même temps, l'OS donne la priorité à la dernière piste activée.
3. **Retour au Calme** : Lorsque vous arrêtez une piste, l'OS rétablit automatiquement l'ambiance lumineuse de la piste précédente encore active, ou revient à votre éclairage manuel.

---

## ⚙️ Configuration Technique

- **Moteur Audio** : Utilise la Web Audio API avec un compresseur de dynamique en sortie master pour éviter toute saturation, même avec 8 pistes à plein volume.
- **Formats** : Compatible avec vos fichiers locaux ainsi qu'avec les ressources du **Media Hub**.

---

> [!IMPORTANT]
> Le bouton **Stop All** déclenche un fondu de sortie global sur 2 secondes, évitant ainsi le silence brutal qui pourrait briser l'immersion de vos joueurs.
