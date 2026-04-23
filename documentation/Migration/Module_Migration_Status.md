# 📊 État d'Avancement Ultra-Détaillé de la Migration par Module

Ce document assure le suivi granulaire pour **chaque sous-composant** du système.

## 🔑 Légende
- 🌑 **À faire** : Code original utilisant `window.appBridge`.
- 🟡 **Partiel** : Interface agnostique créée, mais backend Rust manquant.
- ✅ **Terminé** : Fonctionne nativement sous Tauri et Electron.

---

## 📚 1. Session OS & Gestion de Campagne
| Sous-Module | Composants Clés | Interface Bridge | Impl. Rust | Statut |
| :--- | :--- | :---: | :---: | :--- |
| **Cockpit Central** | Dashboard, Workspace, Snapshots | ✅ | ❌ | 🟡 Partiel |
| **Gestion Campagne** | Library, Form, Player Management | ✅ | ❌ | 🟡 Partiel |
| **Atlas & Monde** | WorldAtlas, MapDetail, Wiki, Timeline | ❌ | ❌ | 🌑 À faire |
| **Forge of Rules** | RuleEngine, Workshop, SheetTemplates | ❌ | ❌ | 🌑 À faire |
| **Loot & Economy** | LootOS, Trade, RollPanels | ❌ | ❌ | 🌑 À faire |
| **Obsidian** | Export Service, Vault Management | ❌ | ❌ | 🌑 À faire |

## 🤖 2. IA & Oracle (Cortex System)
| Sous-Module | Description | Interface Bridge | Impl. Rust | Statut |
| :--- | :--- | :---: | :---: | :--- |
| **Oracle Chat** | Proxy Gemini / Ollama API | ✅ | ❌ | 🟡 Partiel |
| **MCP Bridge** | Pont vers NotebookLM (Python) | ✅ | ❌ | 🟡 Partiel |
| **AI Forge** | Génération de règles et systèmes | ✅ | ❌ | 🟡 Partiel |
| **Security / Keys** | Gestion sécurisée des clés API | ✅ | ❌ | 🟡 Partiel |

## 🎲 3. Monde & Mécaniques (Détail)
| Sous-Module | Composants Clés | Interface Bridge | Impl. Rust | Statut |
| :--- | :--- | :---: | :---: | :--- |
| **Dice-OS** | Three.js Engine, Physics, Sync | ❌ | ❌ | 🌑 À faire |
| **Map OS v2** | Ambiance System, Fog of War, Layers | ❌ | ❌ | 🌑 À faire |
| **Combat OS** | Initiative, Tracker, Player Sync | ❌ | ❌ | 🌑 À faire |
| **Tactical AI** | Taxonomy, Enemy Behaviors | ❌ | ❌ | 🌑 À faire |
| **Filesystem** | Lecture/Écriture agnostique | ✅ | ❌ | 🟡 Partiel |
| **App Lifecycle** | Quit, Restart, Version | ✅ | ❌ | 🟡 Partiel |

## 🔊 4. Multimédia & Immersion
| Sous-Module | Description | Interface Bridge | Impl. Rust | Statut |
| :--- | :--- | :---: | :---: | :--- |
| **Audio OS** | Music (Decks), Ambient (8 channels), Sound FX | ❌ | ❌ | 🌑 À faire |
| **Voice OS** | Modulateur, Ducking, Level Sync | ❌ | ❌ | 🌑 À faire |
| **Visuals** | Image OS, Video Projections, Whiteboard | ❌ | ❌ | 🌑 À faire |
| **Home Auto** | Light OS (Philips Hue) | ❌ | ❌ | 🌑 À faire |

## 🌐 5. Connectivité & Infrastructure
| Sous-Module | Description | Interface Bridge | Impl. Rust | Statut |
| :--- | :--- | :---: | :---: | :--- |
| **Remote Bridge** | WebSocket Sync (v6) -> P2P (v7) | ❌ | ❌ | 🌑 À faire |
| **Tablet Hub** | Interface dédiée joueurs / projection | ❌ | ❌ | 🌑 À faire |
| **Logger / Debug**| Interception console, Error tracking | ✅ | ❌ | 🟡 Partiel |
| **Media Assets** | Asset Lock, File URL Formatting | ✅ | ❌ | 🟡 Partiel |

---
*Dernière mise à jour : 23 Avril 2026 - GM-OS v7 Migration Tracker*
