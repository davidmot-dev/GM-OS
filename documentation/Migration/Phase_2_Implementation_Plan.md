# Phase 2 : Le Moteur Rust (Tauri Backend)

L'objectif de cette phase est de rendre l'application fonctionnelle sous Tauri en implémentant les commandes Rust nécessaires pour remplacer les fonctionnalités d'Electron.

## Objectifs
1. Configurer Tauri avec les plugins indispensables (`dialog`, `fs`, `shell`).
2. Implémenter les commandes de base dans Rust.
3. Connecter le `AppBridge` React aux commandes Rust.
4. Gérer le cycle de vie de l'application (Quit, Version).

## Changements Proposés

### 🦀 Rust Backend (src-tauri)

#### [MODIFY] [Cargo.toml](file:///c:/Projet_David/GM-OS-v5/v7-migration/src-tauri/Cargo.toml)
- Ajouter les plugins : `tauri-plugin-dialog`, `tauri-plugin-fs`, `tauri-plugin-shell`.

#### [MODIFY] [tauri.conf.json](file:///c:/Projet_David/GM-OS-v5/v7-migration/src-tauri/tauri.conf.json)
- Enregistrer les plugins et configurer les permissions.

#### [NEW] [commands.rs](file:///c:/Projet_David/GM-OS-v5/v7-migration/src-tauri/src/commands.rs)
- Implémenter les commandes :
    - `get_app_version()`
    - `quit_app()`
    - `save_session(data: String, path: String)`
    - `load_session(path: String)`

#### [MODIFY] [lib.rs](file:///c:/Projet_David/GM-OS-v5/v7-migration/src-tauri/src/lib.rs)
- Enregistrer le module `commands` et les fonctions `invoke_handler`.

### ⚛️ React Frontend (src/bridge)

#### [MODIFY] [AppBridge.ts](file:///c:/Projet_David/GM-OS-v5/v7-migration/src/bridge/AppBridge.ts)
- Implémenter la logique `if (this.isTauri)` pour chaque module.
- Utiliser `invoke()` pour appeler les commandes Rust.

## Plan de Vérification

### Tests Manuels
1. Lancer l'app avec `npm run tauri dev`.
2. Vérifier que la version s'affiche correctement (via `AppBridge.app.getVersion()`).
3. Tester la sauvegarde et le chargement d'une session.
4. Tester la détection des écrans (si possible via plugin Tauri).

## Questions Ouvertes
- Quels répertoires spécifiques devons-nous autoriser pour le plugin `fs` (scopage de sécurité) ?
- Devons-nous porter immédiatement la logique MCP vers Rust ou la garder en Node.js (via shell command) pour l'instant ?
