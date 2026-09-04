# Walkthrough : Presets Map-OS

Cette fonctionnalité permet au MJ de sauvegarder des "instantanés" tactiques d'une carte pour les réutiliser plus tard.

## 🚀 Fonctionnalités Implémentées

1.  **Sauvegarde Complète** : Capture le fond (image/vidéo), les pions, les zones de danger, la météo et la grille.
2.  **Chargement Instantané** : Restaure une scène complexe en un clic, avec synchronisation automatique vers les joueurs si une projection est active.
3.  **Galerie Intégrée** : Interface fluide dans la barre latérale `Map-OS`.
4.  **Persistance** : Les presets sont sauvegardés localement et survivent au rechargement de l'application.

## 🛠️ Démonstration du Workflow

### 1. Préparation de la Scène
- Chargez une carte de forêt.
- Placez des archers gobelins dans les arbres (Pions).
- Dessinez une zone de "Feu de Camp" (Zone de Danger).
- Activez une légère pluie (Météo).

### 2. Sauvegarde du Preset
- Dans la barre latérale, cliquez sur **"Sauver l'état"**.
- Nommez-le "Embuscade Foret".
- Le preset apparaît dans la **"Galerie des Configurations Sauvées"**.

### 3. Rappel en Jeu
- Même si vous changez de carte ou videz le plateau, cliquer sur **"Charger"** sur le preset "Embuscade Foret" rétablira instantanément tous les éléments.

---

## ✅ Vérification Technique

### État du Store
- [x] L'interface `MapPreset` est correctement typée dans `types.ts`.
- [x] Les actions `save`, `load` et `delete` sont implémentées dans `useMapStore.ts`.
- [x] La persistance `zustand` inclut la clé `mapPresets`.

### Interface Utilisateur
- [x] Le composant `MapPresetGallery` gère les entrées utilisateur et les confirmations.
- [x] Intégration harmonieuse dans `MapControls.tsx`.
- [x] Correction des erreurs de lint et accessibilité.
