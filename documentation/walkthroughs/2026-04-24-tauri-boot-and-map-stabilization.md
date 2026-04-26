# Walkthrough - Stabilisation Boot & Map Module (Tauri v7) - 2026-04-24

Ce walkthrough documente la résolution des crashs au démarrage liés aux dépendances circulaires et l'optimisation du chargement du module Map.

## 🛠️ Changements Effectués

### 1. Résolution de la Dépendance Circulaire (Map Module)
- **Problème** : `useMapStore.ts` importait statiquement `MapService.ts`, qui lui-même importait le store pour lire l'état de la carte. Ce cycle bloquait le résolveur de modules de Vite en mode développement, provoquant des erreurs `ERR_CONNECTION_REFUSED` sur le fichier `MapDashboard.tsx`.
- **Solution** : Passage aux imports dynamiques (`import()`) dans les actions de synchronisation du store.
- **Fichier modifié** : [useMapStore.ts](file:///c:/Projet_David/GM-OS-v5/v7-migration/src/modules/map/useMapStore.ts)

### 2. Validation du Chargement Lazy
- **Vérification** : Confirmation que `MapDashboard.tsx` est correctement servi par Vite après la rupture du cycle.
- **Test** : Utilisation du HMR pour valider que les modifications sur le module Map sont propagées instantanément sans crash.

### 3. Parité du Bridge (Tauri v7)
- **Accomplissement** : Tous les modules du `AppBridge` (NPC, Remote, Tables, Git, Web, Obsidian, MCP, Nexus) sont désormais stabilisés avec des stubs Rust fonctionnels.
- **Résultat** : L'application boot jusqu'au dashboard principal sans erreur de type `undefined`.

## 🧪 Tests & Validation

- **Boot Test** : L'application se lance via `npm run tauri dev`.
- **HMR Test** : Modification de l'UI de `MapDashboard` propagée avec succès.
- **Logs Console** : Plus d'erreurs de chargement réseau sur les modules dynamiques.

## 📸 Preuves de Stabilité

> [!NOTE]
> Le module Map est désormais prêt pour les tests fonctionnels approfondis (Tokens, Brouillard de guerre).

---
*Auteur : Antigravity*
