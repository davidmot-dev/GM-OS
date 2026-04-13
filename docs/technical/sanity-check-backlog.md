# 📋 GM-OS v6 : Backlog de "Sanity Check" & Stabilisation

Ce document permet de suivre l'audit et la remise aux normes v6 de chaque module du projet.

## 🛠️ Critères d'Audit (Standard GM-OS v6)

Chaque module doit être validé selon les critères suivants :
1.  **[TYPE] Typage Strict** : Utilisation d'interfaces explicites, aucun `any`.
2.  **[BRDG] Bridge Isolation** : Utilisation exclusive de `window.appBridge` pour les entrées/sorties natives.
3.  **[DECP] Découplage Logic** : Séparation de la logique métier dans des fichiers `.ts` ou hooks.
4.  **[TEST] Test Coverage** : Présence de tests unitaires Vitest pour la logique métier.
5.  **[SECU] Sécurité** : Pas de stockage de secrets en clair (localStorage).
6.  **[SURG] Approche Chirurgicale** : Modification minimale du code existant pour éviter les régressions ; préserver la logique métier validée.

---

## 🏗️ Suivi des Modules

### 1. Infrastructure Core
| Module | Priorité | Statut | Points d'Attention |
| :--- | :---: | :--- | :--- |
| **System** (`src/modules/system`) | P0 | 🟡 À Analyser | Bootstrapping & Initialisation. |
| **Session** (`src/modules/session`) | P0 | 🟡 À Analyser | State persistence & snapshots. |
| **Remote** (`src/modules/remote`) | P1 | 🟡 À Analyser | WebSocket / P2P stability. |
| **Security** (Electron / Store) | **P0** | ✅ Corrigé | Migration API Keys vers `safeStorage`. |
| **Shared** (`src/types/shared.ts`)| P1 | 🟡 À Analyser | Cohérence des interfaces globales. |

### 2. AI & Intelligence (Le "Cortex")
| Module | Priorité | Statut | Points d'Attention |
| :--- | :---: | :--- | :--- |
| **AI (Oracle)** (`src/modules/ai`) | P1 | 🟡 À Analyser | MCP Bridge & Context handling. |
| **Tactical-AI** | P1 | 🟡 À Analyser | Précision des conseils de combat. |
| **RAG Engine** (Electron) | P2 | 🟡 À Analyser | Indexation & Performance. |
| **Ollama Service** (Electron) | P2 | 🟡 À Analyser | Connectivité locale. |

### 3. Gameplay & Tactical
| Module | Priorité | Statut | Points d'Attention |
| :--- | :---: | :--- | :--- |
| **Map-OS** (`src/modules/map`) | **P0** | ✅ Corrigé | **ID-based mapping** & performance Fog. |
| **Combat-OS** | P1 | 🟡 À Analyser | Calculs de dégâts & Status Effects. |
| **Dice-OS** | P2 | 🟡 À Analyser | Moteur de simulation 3D vs Logique. |
| **NPC-OS** | P1 | 🟡 À Analyser | Gallery synchronization. |
| **Journal** (Wiki/Timeline) | P2 | 🟡 À Analyser | Cohérence des dates du monde. |
| **Whiteboard** | P2 | 🟡 À Analyser | Latence de dessin synchronisé. |
| **Tables** | P3 | 🟡 À Analyser | Gestion des rencontres aléatoires. |

### 4. Immersion Multimedia
| Module | Priorité | Statut | Points d'Attention |
| :--- | :---: | :--- | :--- |
| **Music-OS** | P2 | 🟡 À Analyser | Speaker management logic. |
| **Ambient-OS** | P2 | 🟡 À Analyser | Layering & Presets. |
| **Sound-OS** | P2 | 🟡 À Analyser | SFX collision & trigger. |
| **Voice-OS** | P2 | 🟡 À Analyser | AudioWorklet stabilization. |
| **Image-OS** | P2 | 🟡 À Analyser | Projection protocol compatibility. |

### 5. Services & Tools
| Module | Priorité | Statut | Points d'Attention |
| :--- | :---: | :--- | :--- |
| **Nexus Bridge** | P1 | 🟡 À Analyser | Import/Export data integrity. |
| **Forms/Forge** | P3 | 🟡 À Analyser | Générateurs de contenu. |
| **Clock-OS** | P3 | 🟡 À Analyser | Time sync between Master/Hub. |
| **Favorite** | P3 | 🟡 À Analyser | Persistence des raccourcis. |
| **Debug** | P3 | 🟡 À Analyser | Dev Tools visibility. |

### 6. Hubs & Clients (Expérience Joueur)
| Module | Priorité | Statut | Points d'Attention |
| :--- | :---: | :--- | :--- |
| **Player Hub** | P1 | 🟡 À Analyser | Fluidité des animations & synchronisation. |
| **Tablet Hub** | P1 | 🟡 À Analyser | Performance sur matériel physique & Low-lag voice. |

---

## 🏃 Flux de Travail
1.  **Analyse** : Ouvrir le module, vérifier les 5 critères de base.
2.  **Plan de Correction** : Si des défauts sont trouvés.
3.  **Correction** : Application des changements.
4.  **Validation** : Mise à jour du statut dans ce fichier.

> [!NOTE]
> **Prochaine Action Immédiate** : Commencer par le module **Security [P0]** (API Keys) car il impacte la confidentialité.
