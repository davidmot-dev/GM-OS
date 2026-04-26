# 🚶 Walkthrough : Migration Tauri — Phases 2 & 3 (Bridge & Multimédia)

## 🎯 Objectifs
Finaliser la couche d'abstraction système et migrer l'intégralité des fonctions multimédia vers l'architecture v7 (Tauri), tout en conservant la compatibilité Electron pour la v6.5.

## 🛠️ Changements Majeurs

### 1. Pont Agnostique (Agnostic Bridge)
- **Fichier** : `src/bridge/AppBridge.ts`
- **Action** : Création d'une classe statique `AppBridge` qui détecte l'environnement (`isTauri` vs `isElectron`).
- **Bénéfice** : Le code UI ne dépend plus de `window.appBridge`. Il utilise `AppBridge.ipc.send()` ou `AppBridge.utils.formatFileUrl()`.

### 2. Migration IPC Unifiée
- **Action** : Remplacement systématique de tous les appels `window.appBridge.send` et `window.appBridge.on`.
- **Composants impactés** : `LobbyMonitor`, `MusicDeck`, `SoundEngine`, etc.
- **Bénéfice** : Suppression des erreurs `TypeError` lors du lancement sous Tauri.

### 3. Résolution Média Tauri (`asset://`)
- **Fichiers** : `useMediaUrl.ts`, `mediaResolver.ts`
- **Action** : Intégration de `convertFileSrc` (Tauri v2) pour transformer les chemins Windows (ex: `C:\Music\track.mp3`) en URLs valides pour le Webview.
- **Bénéfice** : Les images, musiques et vidéos se chargent nativement sans passer par des data URIs lents.

### 4. Sécurité & Permissions
- **Fichier** : `src-tauri/capabilities/default.json`
- **Action** : Ajout des permissions `core:protocol:asset`, `fs:allow-read`, et `shell:allow-open`.
- **Bénéfice** : L'application a le droit d'accéder aux fichiers de campagne de l'utilisateur.

## 🧪 Tests de Validation
- [x] **Music-OS** : Lecture de piste MP3 locale (Protocole asset).
- [x] **Sound-OS** : Déclenchement de SFX via IPC.
- [x] **Map-OS** : Chargement de map image/vidéo haute résolution.
- [x] **Hardware** : Énumération des écrans de projection.

## 📈 Prochaines Étapes
- **Phase 4** : Gestion multi-fenêtres (Dice Projection) sous Tauri.
- **Phase 5** : Nettoyage final des dépendances Electron.

---
*Date : 23 Avril 2026*
*Auteur : Antigravity (Assistant IA)*
