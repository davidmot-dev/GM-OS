# 🚶‍♂️ Walkthrough : Nettoyage Root & Initialisation v7 (Tauri)

## 🎯 Objectifs
1.  **Nettoyage Chirurgical** : Purger le répertoire racine des fichiers temporaires et logs obsolètes.
2.  **Sécurisation v6.5** : Création d'une sauvegarde stable et d'une branche dédiée.
3.  **Isolation v7** : Mise en place d'un environnement de migration (`v7-migration/`) pour Tauri sans impacter la version Electron.

---

## 🧹 1. Nettoyage du Répertoire Root
Nous avons supprimé les fichiers suivants pour assainir l'espace de travail :
- **Logs & Debug** : `crash.log`, `err.txt`, `out.txt`, `mcp_debug_v2.log`, `test_diag.log`.
- **Rapports** : `eslint.json`, `zimage_api.json`.
- **Scripts de test** : Déplacés de la racine vers `scripts/tests/`.
- **Documentation brute** : Déplacée vers `documentation/Planning/`.

---

## 🛡️ 2. Sécurisation & Branchement
- **Backup** : `backups/GM-OS_v6_STABLE_BACKUP_2026-04-22.zip` contient l'état complet avant migration.
- **Git** : Nouvelle branche `GM-OS_v7_P2P` (renommée en cours de route pour la migration Tauri).

---

## 🦀 3. Initialisation de la Migration Tauri
L'environnement de développement pour la v7 a été isolé dans le dossier `v7-migration/` :
- **Tauri Core** : Initialisation du dossier `src-tauri` avec configuration Rust.
- **Agnostic Bridge** : Implémentation du service `AppBridge.ts` permettant au frontend de fonctionner sur les deux moteurs.
- **Migration des utilitaires** : `Logger.ts` et `mediaResolver.ts` utilisent désormais le nouveau pont.

---

## ✅ Validation
- [x] Répertoire racine propre.
- [x] Version v6.5 Electron toujours 100% fonctionnelle.
- [x] Structure v7 prête pour le portage des commandes Rust.

---
*Date : 23 Avril 2026*
