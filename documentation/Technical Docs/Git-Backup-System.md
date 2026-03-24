# 📂 Système de Sauvegarde Git (GitBackupService)

## 📌 Présentation
Le `GitBackupService` est un service du Main Process d'Electron responsable de la persistance externe des données de jeu (PNJ, Sessions, Campagnes, Audio) sur une branche GitHub dédiée et isolée.

## 🏗️ Architecture
Le système repose sur une isolation stricte entre le code source (`master`) et les données (`data-sync`).

### Composants Clés :
1. **`GitBackupService.ts` (Main)** : Gère les opérations Git (stash, checkout, commit, push).
2. **`useBackupSync.ts` (Renderer)** : Hook React déclenchant la collecte des données et l'appel IPC.
3. **IPC Channel `backup:save-data`** : Pont de communication sécurisé.

## ⚙️ Concept d'Isolation (Orphan Branch)
Pour éviter de polluer les sauvegardes avec le code source de l'application, le service utilise une branche "orpheline" :
- **Création** : `git checkout --orphan data-sync` (historique vide).
- **Maintenance** : À chaque switch, l'index est vidé via `git rm -r --cached .`.
- **Contenu** : Seul le répertoire `backups/` est suivi et poussé.

## 🛡️ Robustesse & Sécurité
- **JSON Hardening** : Les données sont sérialisées via `JSON.stringify(data, null, 2)` avec des guards pour éviter les erreurs `.replace` de bibliothèques tierces sur des valeurs `undefined`.
- **Espace de Travail** : Le service utilise `git stash` avant toute opération pour protéger les modifications en cours du MJ, et restaure l'état immédiatement après le push.
- **Logs** : En cas d'échec, les erreurs sont capturées dans `crash.log`.

## 🛠️ Dépannage
Si la branche `data-sync` contient des fichiers du code source :
1. Fermez l'application.
2. Exécutez :
   ```powershell
   git checkout data-sync
   git rm -r --cached .
   git add backups/
   git commit -m "Clean isolation"
   git push origin data-sync --force
   git checkout master
   ```
