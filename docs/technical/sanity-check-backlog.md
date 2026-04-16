# Sanity Check Backlog : GM-OS v6 Stabilization

Ce document permet de suivre l'audit et la remise aux normes v6 de chaque module du projet.

## 🛠️ Critères d'Audit (Standard GM-OS v6)

Chaque module doit être validé selon les critères suivants :

1. **[TYPE] Typage Strict** : Utilisation d'interfaces explicites, aucun `any`.
2. **[BRDG] Bridge Isolation** : Utilisation exclusive de `window.appBridge` pour les entrées/sorties natives.
3. **[DECP] Découplage Logic** : Séparation de la logique métier dans des fichiers `.ts` ou hooks.
4. **[TEST] Test Coverage** : Présence de tests unitaires Vitest pour la logique métier.
5. **[SECU] Sécurité** : Pas de stockage de secrets en clair (localStorage).
6. **[SURG] Approche Chirurgicale** : Modification minimale du code existant pour éviter les régressions ; préserver la logique métier validée.

---

## 🏗️ Suivi des Modules

### 1. Infrastructure Core

| Module | Priorité | Statut | Points d'Attention |
| :--- | :---: | :--- | :--- |
| **System** (`src/modules/system`) | P0 | ✅ Corrigé | Bootstrapping & Initialisation centralisée. |
| Session | `src/modules/session` | P0 | ✅ Corrigé | Refonte du store (SessionManager, SnapshotService). |
| **Remote** (`src/modules/remote`) | P1 | ✅ Corrigé | Refonte Nexus P1 : Modularisation `SyncServer` & Rôles. |
| **Security** (Electron / Store) | **P0** | ✅ Corrigé | Migration API Keys vers `safeStorage`. |
| **Shared** (`src/types/shared.ts`)| P1 | ✅ Corrigé | Types éclatés en 6 fichiers granulaires + re-exports compat. |

### 2. AI & Intelligence (Le "Cortex")

| Module | Priorité | Statut | Points d'Attention |
| :--- | :---: | :--- | :--- |
| **AI (Oracle)** (`src/modules/ai`) | P1 | ✅ Corrigé | MCP Bridge & Context handling. |
| **Tactical-AI** | P1 | ✅ Corrigé | Précision des conseils de combat & Nexus Link. |
| **RAG Engine** (Electron) | P2 | ✅ Corrigé | Indexation Obsidian & Performance RAG. |
| **Ollama Service** (Electron) | P2 | ✅ Corrigé | Support URL dynamique & Diagnostic. |

### 3. Gameplay & Tactical

| Module | Priorité | Statut | Points d'Attention |
| :--- | :---: | :--- | :--- |
| **Map-OS** (`src/modules/map`) | **P0** | ✅ Corrigé | **ID-based mapping** & performance Fog. |
| **Combat-OS** | P1 | ✅ Corrigé | Refonte Dropdowns (Stitch), Découplage Logique & Tests. |
| **Dice-OS** | P2 | ✅ Corrigé | Moteur 3D (Three.js), Logique D100 & Esthétique Crystal. |
| **NPC-OS** | P1 | ✅ **Corrigé** | Synchronisation Gallery OK. |
| **Journal** (Wiki/Timeline) | P2 | ✅ Corrigé | Cohérence des dates du monde. |
| **Whiteboard** | P2 | ✅ Corrigé | Latence de dessin synchronisé. |
| **Tables** | P3 | ✅ Corrigé | Gestion des rencontres aléatoires. |

### 4. Immersion Multimedia

| Module | Priorité | Statut | Points d'Attention |
| :--- | :---: | :--- | :--- |
| **Music-OS** | P2 | ✅ Corrigé | Speaker management logic. |
| **Ambient-OS** | P2 | ✅ Corrigé | Layering & Presets. |
| **Sound-OS** | P2 | ✅ Corrigé | SFX collision & trigger. |
| **Voice-OS** | P2 | ✅ Corrigé | v6.3.2 : AudioWorklet stabilization & Clipping protection. |
| **Image-OS** | P2 | ✅ Corrigé | v6.3.2 : IPC-First Protocol & Fix React Keys (Performance). |
| **Light-OS** | P2 | ✅ Corrigé | v6.3.3 : Fix Persistence/Keychain & Auto-Connect logic. |

### 5. Services & Tools

| Module | Priorité | Statut | Points d'Attention |
| :--- | :---: | :--- | :--- |
| **Nexus Bridge** | P1 | ✅ Corrigé | Centralisation via `SyncServer` & `handleSync`. |
| **Forms/Forge** | P3 | ✅ Corrigé | v6.3.2 : Découplage callMcpTool & Tests unitaires. |
| **Clock-OS** | P3 | ✅ Corrigé | Projection unifiée & Déduplication intelligente. |
| **Favorite** | P3 | ✅ Corrigé | Persistence & Sync Hub Multi-Entités (v6.3.2). |
| **Debug** | P3 | ✅ Corrigé | v6.3.2 : Interception console & Persistance localStorage validée. |

### 6. Hubs & Clients (Expérience Joueur)

| Module | Priorité | Statut | Points d'Attention |
| :--- | :---: | :--- | :--- |
| **Player Hub** | P1 | ✅ Corrigé | Unification v6.3.2 : Dénucléarisation mode Théâtre & Déduplication. |
| **Tablet Hub** | P1 | ✅ Corrigé | Sync unifiée PNJ/Images & Signal Vocal (HubFooters). |

---

## 🏃 Flux de Travail

1. **Analyse** : Ouvrir le module, vérifier les 5 critères de base.
2. **Plan de Correction** : Si des défauts sont trouvés.
3. **Correction** : Application des changements.
4. **Validation** : Mise à jour du statut dans ce fichier.
