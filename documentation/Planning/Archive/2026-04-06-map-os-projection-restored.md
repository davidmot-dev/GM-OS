# Walkthrough : Restauration de la Projection Map-OS

**Date :** 6 Avril 2026
**Module :** Map-OS / Projector-OS
**Statut :** ✅ Complété

## 🎯 Objectifs

Restaurer le flux de synchronisation entre le Cockpit MJ (Maître) et les terminaux de rendu distants (Player Hub, Moniteurs externes, Tablettes) qui était rompu suite aux récentes refontes architecturales.

## 🛠️ Changements effectués

### 1. Synchronisation du Store de Carte (`useMapStore.ts`)

- **Activation Automatique** : L'action `syncToPlayers` définit désormais explicitement `projectionTarget: 'hub'`, permettant au Hub local de s'activer sans action manuelle.
- **Persistance des Données** : Ajout des zones de danger aux champs persistants pour garantir leur survie lors des cycles de synchronisation.
- **Correction des Types** : Nettoyage des erreurs `any` pour une meilleure robustesse TypeScript.

### 2. Moteur de Diffusion Temps Réel (`App.tsx`)

- **Injection de Payload** : Intégration du segment `map` complet dans les fonctions `handleSync` et `syncFast`.
- **Abonnement Miroir** : Mise en place d'un `subscribe` sur le store de la carte. Tout changement (déplacement de pion, modification du brouillard, ping) est maintenant immédiatement diffusé sur le réseau local et distant.

### 3. Intelligence de Projection (`ProjectorView.tsx`)

- **Détection des Écrans** : Passage d'un contrôle strict (`targetId === 'monitor'`) à une détection par exclusion (`targetId !== 'hub'`). Cela permet de supporter les identifiants techniques uniques des moniteurs Electron/Tauri au lieu de simples noms génériques.

### 4. Harmonisation Visuelle (`PlayerMapCanvas.tsx`)

- **Proportions Atlas** : Passage du mode *Fill (Math.max)* au mode *Fit (Math.min)* pour la mise à l'échelle automatique.
- **Respect du Ratio** : Utilisation de `object-contain` au lieu de `object-cover` pour éviter tout étirement ou recadrage des cartes tactiques.
- **Couches Manquantes** : Réintégration de la `DangerZoneLayer` dans la vue joueur.
- **Optimisation Rendu** : Correction des rendus en cascade (cascading renders) via des déclenchements asynchrones (`setTimeout`).

## ✅ Vérification

- [x] **Player Hub** : S'ouvre et affiche la carte dès que le MJ projette.
- [x] **Moniteur Externe** : Reçoit l'ID de projection et affiche l'Atlas (plus de message "Standby").
- [x] **Pions & Pings** : Synchronisation fluide et réactive via le canal `syncFast`.
- [x] **Brouillard** : Le brouillard de guerre est correctement masqué/découvert en temps réel chez les joueurs.

---
*Document faisant partie des archives techniques de l'évolution GM-OS v6.*
