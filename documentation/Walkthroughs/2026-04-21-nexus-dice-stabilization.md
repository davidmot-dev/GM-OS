# Walkthrough : Stabilisation Nexus & Dice-OS (2026-04-21)

Ce document détaille les corrections apportées à la synchronisation P2P et à la réactivité du graphe social.

## 🌟 Objectifs
*   Rétablir la projection fiable des dés sur les Hubs de jeu.
*   Assurer la réactivité en temps réel des réglages physiques du Nexus Social.
*   Résoudre les problèmes d'affichage d'avatars liés aux caractères spéciaux dans les chemins.

## 🛠️ Corrections

### 1. Synchronisation P2P (`useNexusSynchronizer.ts`)
*   **Correction du Broadcast** : Ajout explicite du rôle `hub` dans les cibles de synchronisation rapide.
*   **Trigger de Projection** : Synchronisation forcée du champ `projectionTrigger` pour garantir que chaque nouveau lancer de dé déclenche l'animation sur tous les écrans distants.

### 2. Physique du Graphe (`SocialGraph.tsx`)
*   **Alpha Control** : Implémentation d'un contrôle dynamique de l'alpha de la simulation D3. Tant que le panneau de réglages est ouvert, la simulation est maintenue active (`alphaTarget(0.3)`) pour refléter immédiatement les ajustements des sliders (gravité, force des liens, etc.).

### 3. Résolution d'Avatars (`useAvatarResolver.ts`)
*   **Path Decoding** : Utilisation de `decodeURI` pour traiter les chemins de fichiers locaux (`file:///`). Cela corrige les avatars qui ne s'affichaient pas à cause d'espaces ou de caractères accentués encodés dans l'URL.

## ✅ Tests & Validation
*   [x] Projection de dés vérifiée entre Master et Tablet Hub.
*   [x] Test de fluidité du graphe social lors de la modification des paramètres physiques.
*   [x] Validation de l'affichage des portraits contenant des espaces.
