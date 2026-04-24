# 🚀 Plan de Migration de Haut Niveau : GM-OS v6.5 ➡️ v7 (Tauri)

Ce plan définit les phases critiques pour transformer GM-OS en une application native haute performance.

## Phase 1 : Fondations & Abstraction (TERMINÉ)
*Transition douce sans rupture de service.*
- [x] Initialisation de l'environnement Tauri (`src-tauri`).
- [x] Création du pont `AppBridge` agnostique.
- [x] Migration de 100% des services utilitaires (`Logger`, `MediaResolver`, `SessionService`).
- [x] **Validation** : L'application compile et se lance sous Electron/Tauri via le pont.

## Phase 2 : Le Cœur Rust (Backend) (TERMINÉ - BRIDGE)
*Remplacement de la logique Node.js par Rust.*
- [x] **IO & Filesystem** : Implémentation des commandes Rust pour la lecture/écriture de fichiers (Session, DB, Vault).
- [x] **Security** : Portage du gestionnaire de secrets (API Keys) vers les coffres-forts natifs de l'OS via Tauri.
- [x] **Displays & Windows** : Détection multi-moniteurs et gestion native des fenêtres WebviewWindow.
- [x] **Validation** : Lancement réussi de l'interface GM et des Hubs sous Tauri avec accès aux fichiers.

## Phase 3 : Modules Spécialisés & Performance (STABILISÉ)
*Optimisation et portage des fonctions lourdes.*
- [ ] **Nexus-OS v3** : Moteur de packaging en Rust (vitesse de compression accrue).
- [x] **Visuals & Assets** : Streaming image/vidéo via protocole natif `asset://`.
- [x] **IPC Spreading** : Stabilisation des communications multi-arguments pour les Hubs et Projecteurs.
- [x] **MCP Connector** : Bridge Python piloté par Rust (Logic Bridge ready).
- [x] **Validation** : Projection fluide et synchronisation Player Hub 100% fonctionnelle sous Tauri.

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
*Dernière mise à jour : 23 Avril 2026 (Phase 3 Stabilisée)*
