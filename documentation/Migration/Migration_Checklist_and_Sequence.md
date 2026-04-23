# 📋 Checklist de Migration & Séquence Idéale (v7 Tauri)

Ce document définit l'ordre de priorité et la complexité de chaque étape de la migration pour garantir un passage à Tauri sans friction.

## 📊 Légende
- **Difficulté** : 🟢 (Facile) à 🔴 (Complexe / Rust intensif)
- **Importance** : ⭐ (Optionnel) à ⭐⭐⭐⭐⭐ (Critique / Bloquant)

---

## 🛤️ Séquence Idéale de Migration

### 1. Fondations & Abstraction (Le Pont)
*L'objectif est de rendre 100% du frontend indépendant d'Electron.*

| Tâche | Difficulté | Importance | Statut |
| :--- | :---: | :---: | :---: |
| Abstraction Logger & Media | 🟢 | ⭐⭐⭐⭐⭐ | ✅ |
| Abstraction Session (Save/Load) | 🟢 | ⭐⭐⭐⭐⭐ | ✅ |
| Abstraction Security (Keys) | 🟢 | ⭐⭐⭐⭐⭐ | ✅ |
| Abstraction MCP Bridge (NotebookLM) | 🟡 | ⭐⭐⭐⭐ | ✅ |
| Abstraction Obsidian & Filesystem | 🟡 | ⭐⭐⭐ | ✅ |
| Abstraction App Lifecycle (Quit/Displays) | 🟢 | ⭐⭐⭐ | ✅ |

### 2. Le Moteur Rust (Premier Lancement v7)
*Rendre l'application fonctionnelle sous Tauri avec les premières commandes Rust.*

| Tâche | Priorité | Difficulté | Statut |
| :--- | :---: | :---: | :---: |
| Configuration Plugins Tauri (FS, Dialog, Shell) | 🔴 | ⭐ | ✅ |
| Implémentation Rust : Session (Save/Load) | 🔴 | ⭐⭐⭐ | ✅ |
| Implémentation Rust : App (Quit/Restart) | 🟢 | ⭐ | ✅ |
| Implémentation Rust : Keychain (Security) | 🔴 | ⭐⭐⭐ | ✅ |
| Implémentation Rust : Multi-moniteurs (Displays) | 🟡 | ⭐⭐ | ✅ |
| Implémentation Rust : Pont Processus (MCP Bridge) | 🟠 | ⭐⭐⭐⭐ | ✅ |
| Connexion AppBridge -> Tauri Invoke | 🔴 | ⭐⭐ | ✅ |
| Système de Log Rust (tauri-plugin-log) | 🟡 | ⭐ | ✅ |

### 3. Modules "Standing" (Performance & Immersion)
*Optimiser les fonctions qui consomment le plus de ressources.*

| Tâche | Difficulté | Importance | Statut |
| :--- | :---: | :---: | :---: |
| Nexus-OS v3 (Compression Rust) | 🔴 | ⭐⭐⭐⭐ | 🌑 |
| Dice-OS Projection (Multiple Windows) | 🔴 | ⭐⭐⭐⭐⭐ | 🌑 |
| Audio/Voice Level Sync (IPC rapide) | 🟠 | ⭐⭐⭐ | 🌑 |
| Image/Video Streaming (tauri:// protocol) | 🟠 | ⭐⭐⭐⭐ | ✅ |

### 4. IA & Connectivité Avancée
*Dernière phase avant le décommissionnement.*

| Tâche | Difficulté | Importance | Statut |
| :--- | :---: | :---: | :---: |
| MCP Bridge (Python Sidecar) | 🔴 | ⭐⭐⭐ | 🌑 |
| Synchronisation P2P (Libp2p / Rust) | 🔴 | ⭐⭐⭐⭐ | 🌑 |
| Auto-découverte des Hubs sur LAN | 🔴 | ⭐⭐⭐ | 🌑 |

---

## 🎯 Priorités Immédiates (Top 3)

1.  **Abstraction MCP Bridge** : Indispensable pour garder la synergie avec NotebookLM. (Difficulté: 🟡)
2.  **Commandes Rust Filesystem** : Sans cela, la v7 ne peut rien sauvegarder. (Difficulté: 🟡)
3.  **Dice-OS Projection** : Le plus gros défi technique, car Tauri gère les fenêtres différemment d'Electron. (Difficulté: 🔴)

---
*Dernière mise à jour : 23 Avril 2026*
