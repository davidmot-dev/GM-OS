# 📚 GM-OS v5 - Centre de Documentation

Ce répertoire est la source unique de vérité pour toute la documentation technique, architecturale et utilisateur du projet.

---

## 🏛️ Architecture & Fondations
*   **[Architecture Overview](./Architecture/)** : Vue d'ensemble du pont Bridge/Electron et isolation des modules.
*   **[AppBridge Standard](./Planning/AppBridge_Architecture_Standard.md)** : Protocoles de communication inter-processus.
*   **[Standards de Code v6](./Planning/V6_Code_Standards.md)** : Règles de typage, React et Tailwind.
*   **[Lessons Learned](./Lessons_Learned.md)** : Rétrospective technique et solutions aux défis majeurs.

## 🛠️ Documentation Technique (Modules)
*   **[Rule Engine & Sharing](./Technical%20Docs/Rule_Engine_Technical_Doc.md)** : Forge de règles et partage aux joueurs.
*   **[Light-OS](./Technical%20Docs/Light-OS_Technical_Doc.md)** : Ambiance lumineuse (Philips Hue).
*   **[Social Nexus](./Technical%20Docs/Social_Nexus_Technical_Doc.md)** : Graphe relationnel D3.js.
*   **[Map-OS](./Technical%20Docs/Map_OS_Technical_Doc.md)** : Cartographie, calques et brouillard de guerre.
*   **[Tablet Hub](./Technical%20Docs/Tablet_Hub_Technical_Doc.md)** : Synchronisation second écran.
*   **[Compilation & Déploiement (Windows)](./Technical%20Docs/Compilation_Deployment_Guide.md)** : Build et packaging .exe.
*   **[Installation Guide (Linux)](./Technical%20Docs/Linux_Installation_Guide.md)** : Configuration spécifique pour Linux (AppImage, CORS).
*   *Voir aussi : [Index Technique Complet](./Technical%20Docs/)*

## 📖 Guides Utilisateur
*   **[Rule Sharing Guide](./User%20Guides/Rule_Sharing_Guide.md)** : Manuel de partage des règles.
*   **[AI Oracle Guide](./User%20Guides/AI_Oracle_User_Guide.md)** : Utilisation de l'IA pour la narration.
*   **[Session OS Guide](./User%20Guides/Session_OS_User_Guide.md)** : Gestion des campagnes et chronologies.
*   *Voir aussi : [Index des Guides Utilisateur](./User%20Guides/)*

## 🚀 Planification & Migration v7
*   **[Migration Tauri (v7)](./Migration/)** : Plans, blueprints et statut de la transition vers Tauri.
*   **[Sync Cross-Window Simplifiée](./Migration/Simplified_CrossWindow_Sync_Guide.md)** : Guide de migration pour la synchronisation temps réel.
*   **[Dernier Jalon : Stabilisation Boot & Map (24/04/2026)](./Walkthroughs/2026-04-24-tauri-boot-and-map-stabilization.md)**
*   **[Sanity Check Backlog](./Planning/Sanity_Check_Backlog.md)** : État de santé des modules.
*   **[Roadmap & Améliorations](./Planning/amélioration.md)**
*   *Voir aussi : [Archives de Planification](./Planning/)*

## 📝 Historique des Walkthroughs
*   **[Stabilisation Boot & Map (2026-04-24)](./Walkthroughs/2026-04-24-tauri-boot-and-map-stabilization.md)**
*   **[Stabilisation Projection & IPC (2026-04-23)](./Walkthroughs/2026-04-23-tauri-ipc-and-projection-stabilization.md)**
*   **[Stabilisation UI & Obsidian (2026-04-22)](./Walkthroughs/2026-04-22-ui-obsidian-stabilization.md)**
*   **[Partage de Règles (2026-04-22)](./Walkthroughs/2026-04-22-rule-sharing-implementation.md)**
*   *Voir aussi : [Tous les Walkthroughs](./Walkthroughs/)*

---
> [!IMPORTANT]
> Toute nouvelle fonctionnalité ou refonte doit être documentée dans ce répertoire selon les standards définis dans [V6_Code_Standards.md](./Planning/V6_Code_Standards.md).
