# 🚀 GM-OS v6 : Roadmap & Stratégie (v6.3.0)

Ce document centralise la vision et les chantiers de GM-OS. Depuis Avril 2026, le projet est entré dans sa phase **v6 (Refonte Architecturale & I18n)**.

> [!IMPORTANT]
> **Source de Vérité Technique** : Pour le détail des chantiers TypeScript et la modularisation des stores, veuillez consulter la nouvelle :
> **[Roadmap v6 Master](../architecture/roadmap-v6.md)**

---

## 🏛️ Jalons v6 Atteints (Avril 2026)

### 🌍 Internationalisation & Localisation
- [x] **Correctif d'Encodage** : Restauration complète des accents français (UTF-8) dans `modules.json`.
- [x] **Standard I18n** : Mise en œuvre du "Nesting Level 2" pour éviter les collisions de clés.
- [x] **HUD Multilingue** : Support complet du français/anglais sur Nexus-OS et Session-OS.

### 📦 Nexus-OS v2 (Système de Paquets)
- [x] **Nexus Stabilization** : Restauration du verrouillage des personnages et gestion des erreurs de collision.
- [x] **Maintenance MJ** : Ajout du bouton "Tout Éjecter" dans les paramètres Remote.
- [x] **Session Resumption** : Gestion de la reconnexion sur le même appareil via `deviceId` persistant et multi-socket tracking.
- [x] **Manifest Validation v2** : Support des bundles polymorphes (Campaigns, Drivers, Atlas).

### 📓 Session-OS Modularisation
- [x] **Extraction des Hooks** : Logique métier migrée vers `useSessionNPCs`, `useSessionClues`, `useSessionNotes`.
- [x] **Player Private Notes** : Système de synchronisation bi-directionnelle tablette/MJ pour les notes de personnages.

### 🎲 Dice-OS v2 (Rendu 3D High-Fi)
- [x] **Intégration DiceBox3D** : Nouveau moteur Three.js haute fidélité avec support des d10 géométriquement précis.
- [x] **Unification Hub** : Déploiement du système anti-doublon et suppression du mode "Théâtre" obsolète.

### 🛠️ Moteur de Forge & Rules
- [x] **Character Sheet Calculation Engine v2** : Finalisation du support des formules complexes (`expr-eval`) et synchronisation réactive.
- [x] **Loot Generator Integration** : Branchement du générateur de butin sur le Rule Engine.

### 🗺️ Map-OS Evolution
- [x] **Persistent Fog v2** : Optimisation des performances du registre de brouillard pour les cartes haute résolution.

---

## 🔥 Chantiers en Cours (v6.3 Focus)

### 🛠️ Moteur de Forge & Rules
(Dernières améliorations intégrées)

### 🗺️ Map-OS Evolution
- [ ] **Dynamic Token Auras** : Système d'auras visuelles pour la portée des sorts et les zones de danger.
- [x] **Agnostic Bridge Class** : Découplage total des moteurs Electron et Tauri via une couche de traduction dynamique.
- [x] **Multimedia Native Support** : Support complet du protocole `asset://` pour le streaming fluide des médias haute résolution.
- [x] **IPC Stabilization** : Normalisation du transport d'arguments multiples et synchronisation robuste du Player Hub.
- [x] **Projection Lifecycle** : Gestion intelligente de l'ouverture/fermeture des fenêtres de projection (Blackout natif).

---

## 📅 Historique Récent
- **v7.0.1** (26 Avril 2026) : Patch "Maintenance & Identité". Correction du verrouillage PJ et implémentation du protocole d'éjection globale.
- **v7.0.0-beta** (23 Avril 2026) : Stabilisation complète de la projection et des communications IPC. Le Player Hub est 100% fonctionnel sous Tauri.
- **v7.0.0-alpha** (23 Avril 2026) : Migration majeure vers Tauri. Pont agnostique et multimédia natif opérationnels.
- **v6.3.2** (16 Avril 2026) : Unification Hub et nettoyage du mode Théâtre. Correction des fuites WebSocket.
- **v6.3.1** (14 Avril 2026) : Migration Player Hub vers useHubSync et ajout des effets visuels Premium (Scanlines, Grain).
- **v6.3.0** (11 Avril 2026) : Augmentation de version mineure, synchronisation globale de la documentation et correction de l'encodage des locales.
- **v6.2.6** (11 Avril 2026) : Correction critique de l'encodage des locales et consolidation de la documentation technique.
- **v6.2.0** (Début Avril 2026) : Lancement de la modularisation de Session-OS.
- **v6.0.0** (Mars 2026) : Migration initiale vers l'architecture Bridge/Tauri ready.

---

> [!TIP]
> **Priorité actuelle** : Finalisation de la parité V7 (Tauri) et robustesse des connexions Nexus.

> [!IMPORTANT]
> Version Actuelle : **7.0.1** (Avril 2026)
