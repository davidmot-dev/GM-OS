# Walkthrough - GM-OS v7 Migration (Phase 4)

## Objectif : Gestion Multi-Fenêtres & Projection Tauri

Cette phase a permis de migrer la logique d'ouverture des fenêtres secondaires (Player Hub, Tablet Hub) et de projection multi-écrans vers l'environnement natif Tauri v2.

## Changements Majeurs

### 1. Module `window` dans `AppBridge`
- Création d'une interface agnostique pour la gestion des fenêtres.
- Utilisation de `WebviewWindow` de `@tauri-apps/api` sous Tauri.
- Support du positionnement (x, y) et des dimensions personnalisées.

### 2. Détection d'Écrans & Positionnement
- Migration de `image.getDisplays` vers l'API `availableMonitors` de Tauri.
- Récupération des coordonnées physiques des écrans pour ouvrir les projecteurs sur le bon moniteur.

### 3. Routage & IPC
- Utilisation des query parameters (`?window=hub`, `?window=projector`) pour le rendu conditionnel dans `App.tsx`.
- Mise en place d'un système d'événements agnostique `on` / `emit` permettant la synchronisation en temps réel entre la fenêtre MJ et les fenêtres de projection.

## Vérification Technique

### Tests de Routage
- [x] L'URL `/?window=hub` affiche correctement le Player Hub.
- [x] L'URL `/?window=tablet` affiche correctement le Tablet Hub.
- [x] L'URL `/?window=projector` affiche correctement la vue de projection.

### Bridge IPC (Tauri)
- [x] Les événements `image:update-display` sont correctement émis lors d'une projection.
- [x] Les Hubs reçoivent les synchronisations via le pont local.

## Prochaines Étapes
La Phase 5 se concentrera sur la **Stabilisation & Tests Cross-Platform**, incluant la synchronisation audio et les derniers ajustements de performance.

---
*Date : 23 Avril 2026*
*Statut : PHASE 4 COMPLÉTÉE*
