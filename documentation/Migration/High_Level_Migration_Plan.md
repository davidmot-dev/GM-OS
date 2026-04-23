# 🚀 Plan de Migration de Haut Niveau : GM-OS v6.5 ➡️ v7 (Tauri)

Ce plan définit les phases critiques pour transformer GM-OS en une application native haute performance.

## Phase 1 : Fondations & Abstraction (EN COURS)
*Transition douce sans rupture de service.*
- [x] Initialisation de l'environnement Tauri (`src-tauri`).
- [x] Création du pont `AppBridge` agnostique.
- [ ] Migration de 100% des services utilitaires (`Logger`, `MediaResolver`, `SessionService`).
- [ ] **Validation** : L'application doit compiler et se lancer sous Electron tout en utilisant le nouveau pont.

## Phase 2 : Le Cœur Rust (Backend)
*Remplacement de la logique Node.js par Rust.*
- [ ] **IO & Filesystem** : Implémentation des commandes Rust pour la lecture/écriture de fichiers (Session, DB, Vault).
- [ ] **Security** : Portage du gestionnaire de secrets (API Keys) vers les coffres-forts natifs de l'OS via Tauri.
- [ ] **System Hub** : Implémentation du serveur de synchronisation en Rust (remplaçant le serveur WebSocket Node).
- [ ] **Validation** : Premier lancement réussi de l'interface GM sous Tauri avec accès aux fichiers.

## Phase 3 : Modules Spécialisés & Performance
*Optimisation et portage des fonctions lourdes.*
- [ ] **Nexus-OS v3** : Moteur de packaging en Rust (vitesse de compression accrue).
- [ ] **Audio Native** : Étude du portage du mixage audio vers Rust pour une latence zéro (optionnel, selon perf WebAudio).
- [ ] **MCP Connector** : Bridge Python piloté par Rust.

## Phase 4 : Décentralisation P2P
*L'objectif ultime de la v7.*
- [ ] Implémentation de `libp2p` pour la synchronisation directe MJ <-> Joueurs sans dépendre d'un serveur central ou d'une IP fixe.
- [ ] Auto-découverte des Hubs sur le réseau local.

## Phase 5 : Décommissionnement & Nettoyage
*Retrait définitif de l'ancienne architecture.*
- [ ] Suppression du dossier `electron/`.
- [ ] Nettoyage des `package.json` (retrait des dépendances Node spécifiques à Electron).
- [ ] Finalisation de la documentation utilisateur pour la v7.

---

## 🚦 Critères de Succès pour chaque Jalon
1. **Zéro Régression** : Les données v6.5 doivent être lisibles par la v7.
2. **Gain de Performance** : Réduction mesurable de l'empreinte mémoire.
3. **Stabilité** : Aucun crash lors d'une session de test de 2 heures.

---
*Dernière mise à jour : 23 Avril 2026*
