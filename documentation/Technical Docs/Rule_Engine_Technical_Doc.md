# ⚙️ Moteur de Règles & Partage - Documentation Technique

## 📖 Introduction
Le module de règles de GM-OS v5 permet de centraliser, éditer et partager des documents markdown (règles, lore, scénarios) entre le MJ et les joueurs. Il repose sur un couplage entre le système de fichiers local et le bridge de communication en temps réel.

## 🏗️ Architecture du Partage

Le partage de règles suit un flux unidirectionnel du MJ vers les Players/Hubs :

1.  **Action MJ** : Dans `RuleWorkshopViewer.tsx`, le MJ clique sur "Partager aux Joueurs".
2.  **Payload Action** : Une action de type `session:display-rule` est émise via le bridge.
    ```json
    {
      "type": "session:display-rule",
      "payload": {
        "title": "La Malédiction de l'Ombre",
        "content": "# Lore...",
        "category": "rule"
      }
    }
    ```
3.  **Transmission** : 
    - Le bridge Electron diffuse l'événement en local via IPC (`remote:broadcast-ui-action`).
    - Le serveur Nexus (WebSocket) relaie l'action à tous les clients connectés (tablettes).
4.  **Réception Hub** : Le hook `useHubSync.ts` intercepte l'événement et met à jour l'état `sharedRule`.
5.  **Rendu** : Le composant `HubRuleViewer.tsx` affiche automatiquement le contenu dans une fenêtre modale premium dès que `sharedRule` n'est plus nul.

## 💾 Persistance & Bridge FS
Les règles sont stockées sous forme de fichiers `.md` dans le répertoire RAG du système de jeu actif.
- **Lecture** : `window.appBridge.ai.listDocs()` et `readDoc(path)`.
- **Écriture** : `window.appBridge.ai.writeDoc(path, content)`.

## 📦 Export Obsidian
Le service `ObsidianExportService` permet de copier les règles vers un coffre externe. Il utilise la configuration stockée dans le store de session pour localiser le dossier cible et formate le contenu pour une compatibilité maximale avec Obsidian (frontmatter YAML).

## 🛡️ Zéro-Any & Types
Toutes les fiches de règles utilisent l'interface `RuleCard` pour garantir un typage strict durant la manipulation dans l'UI.
