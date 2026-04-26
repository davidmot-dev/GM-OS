# 🏗️ Plan de Migration GM-OS v7 (Tauri) & Décommissionnement Electron

Ce document suit les étapes nécessaires pour passer de l'architecture Electron à Tauri, tout en garantissant la stabilité de la version 6.5.

## 📋 État des Lieux (v6.5)
- **Framework** : Electron 34.0.0
- **Bridge** : `window.appBridge` injecté via `preload.ts`
- **Dépendances Node** : Utilisation intensive de `fs-extra`, `adm-zip`, `archiver` dans le Main Process.
- **Points de friction** : Les modules Node.js utilisés dans Electron doivent être réimplémentés en Rust pour Tauri.

---

## 🛠️ Phase 1 : Pont Agnostique (Bridge Abstraction)
**Objectif** : Rendre le frontend React indépendant du moteur (Electron ou Tauri).

- [x] **Création de l'Interface Unifiée** : Définir un service `AppBridgeService.ts` qui encapsule tous les appels à `window.appBridge`.
- [x] **Détection d'Environnement** : Implémenter une logique de détection automatique.
- [/] **Migration progressive des appels** : Remplacer chaque appel direct à `window.appBridge` par un appel au service unifié. (Logger et SessionService terminés).

---

## 🦀 Phase 2 : Réimplémentation Rust (Tauri Core)
**Objectif** : Porter la logique métier lourde du `Main Process` Electron vers Rust.

- [ ] **Gestion des Fichiers** : Réimplémenter les fonctions de sauvegarde/chargement de sessions en Rust.
- [ ] **Nexus-OS v3** : Porter la logique de compression/décompression ZIP (actuellement `adm-zip`) vers des crates Rust performantes.
- [ ] **MCP Bridge** : Migrer la gestion des processus Python du MCP vers Tauri (via `Command` sidecar).

---

## 🚀 Phase 3 : Validation Parallèle
**Objectif** : Faire tourner la v7 dans le dossier `v7-migration/` tout en utilisant la v6.5 pour les parties réelles.

- [ ] **Synchronisation des données** : S'assurer que les dossiers `sessions/` et `databases/` sont partagés ou compatibles entre les deux versions.
- [ ] **Benchmarks** : Valider le gain de RAM et de CPU sur la v7.

---

## 🛑 Phase 4 : Décommissionnement d'Electron
**Objectif** : Retirer définitivement Electron une fois la v7 mature.

### Étapes de décommissionnement :
1. **Validation Finale** : Test de 100% des fonctionnalités (Dés 3D, Map, Audio, IA) sous Tauri.
2. **Nettoyage du Code** :
    - Supprimer le dossier `electron/` à la racine.
    - Supprimer `preload.ts`.
    - Retirer les dépendances `electron`, `vite-plugin-electron` de `package.json`.
3. **Optimisation** : Supprimer l'adaptateur de pont (Phase 1) pour ne garder que l'implémentation Tauri native.

---

## 🛡️ Règles de Sécurité
- **Interdiction de supprimer** la v6 tant que la v7 n'a pas survécu à au moins 3 sessions de jeu réelles.
- **Compatibilité descendante** : Les fichiers `.gmos` et les sessions JSON doivent rester compatibles à 100%.

---
*Document créé le 23 Avril 2026*
