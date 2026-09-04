# 🗺️ Walkthrough : Stabilisation de la Projection Map-OS (v7 Tauri)

**Date :** 23 Avril 2026
**Objectif :** Assurer une synchronisation temps réel et une projection robuste de la carte tactique sur les moniteurs et le Player Hub dans l'environnement Tauri.

## 🛠️ Changements Majeurs

### 1. Architecture IPC & Optimisation (MapService)
- **Nouveau Composant :** `src/modules/map/logic/MapService.ts`.
- **Rôle :** Centralise l'émission des événements `map:sync-hub` et `map:sync-projector`.
- **Performance (ANTI-OOM) :** 
    - **Throttle :** Limitation de la synchro à 10 FPS (100ms) pour éviter de saturer l'IPC lors des déplacements de tokens.
    - **Payload Intelligent :** Séparation des données "légères" (tokens, pings) et "lourdes" (fogDataUrl). Le brouillard n'est envoyé que lors des changements structurels (`forceHeavy`).
    - **Isolation :** Seule la fenêtre MJ peut émettre, empêchant les boucles infinies entre fenêtres.

### 2. Rendu Projecteur & Nettoyage
- **Composant :** `src/modules/image/components/ProjectorView.tsx`.
- **Nettoyage :** Suppression des listeners de `storage` obsolètes qui causaient des boucles de réhydratation infinies.
- **Robustesse :** Le Hub effectue désormais des mises à jour partielles du store pour ne jamais écraser le brouillard par des valeurs `undefined`.

### 3. Synchronisation Player Hub
- **Fichier :** `src/modules/session/hooks/useHubSync.ts`.
- **Mise à jour :** Ajout d'écouteurs IPC pour alimenter le `useMapStore` local de la tablette/hub dès que le MJ manipule la carte (tokens, brouillard, météo).

### 4. Gestion des Fenêtres (Bridge)
- **Fichier :** `src/bridge/AppBridge.ts`.
- **Nouveauté :** Implémentation de `closeAllDisplays` pour fermer proprement toutes les fenêtres de projection lors de l'arrêt global ou du changement de mode.
- **Correction :** Le bridge ignore désormais les demandes de projection "blackout" si aucune fenêtre n'est déjà ouverte.

## 🧪 Tests & Validation
- [x] **Projection Moniteur :** La carte s'affiche correctement sur un écran secondaire.
- [x] **Arrêt de Projection :** La fenêtre se ferme ou passe en standby (selon le bouton cliqué) sans ouvrir de fenêtre noire.
- [x] **Synchro Hub :** Les tokens déplacés par le MJ sont mis à jour instantanément sur la tablette joueur.
- [x] **Blackout :** Cliquer sur "Stop" ne génère plus de fenêtre fantôme.

## 📌 Statut Technique
- **Type Safety :** Validé via `tsc --noEmit` (Zéro erreur).
- **Agnosticisme :** Compatible Electron & Tauri.

---
*Ce document fait partie du journal de migration GM-OS v7.*
