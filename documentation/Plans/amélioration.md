# 🚀 GM-OS v6 : Roadmap & Stratégie (v6.3.0)

Ce document centralise la vision et les chantiers de GM-OS. Depuis Avril 2026, le projet est entré dans sa phase **v6 (Refonte Architecturale & I18n)**.

> [!IMPORTANT]
> **Source de Vérité Technique** : Pour le détail des chantiers TypeScript et la modularisation des stores, veuillez consulter la nouvelle :
> **[Roadmap v6 Master](../../docs/architecture/roadmap-v6.md)**

---

## 🏛️ Jalons v6 Atteints (Avril 2026)

### 🌍 Internationalisation & Localisation
- [x] **Correctif d'Encodage** : Restauration complète des accents français (UTF-8) dans `modules.json`.
- [x] **Standard I18n** : Mise en œuvre du "Nesting Level 2" pour éviter les collisions de clés.
- [x] **HUD Multilingue** : Support complet du français/anglais sur Nexus-OS et Session-OS.

### 📦 Nexus-OS v2 (Système de Paquets)
- [x] **Nexus Bridge v2** : Découplage de l'UI de maintenance et des services de téléchargement.
- [x] **Sync Assets Distants** : Scan et rapatriement automatique des ressources web vers le stockage local.
- [x] **Manifest Validation v2** : Support des bundles polymorphes (Campaigns, Drivers, Atlas).

### 📓 Session-OS Modularisation
- [x] **Extraction des Hooks** : Logique métier migrée vers `useSessionNPCs`, `useSessionClues`, `useSessionNotes`.
- [x] **Player Private Notes** : Système de synchronisation bi-directionnelle tablette/MJ pour les notes de personnages.

---

## 🔥 Chantiers en Cours (v6.3 Focus)

### 🛠️ Moteur de Forge & Rules
- [ ] **Character Sheet Calculation Engine v2** : Finalisation du support des formules complexes (`expr-eval`) et synchronisation réactive.
- [ ] **Loot Generator Integration** : Branchement du générateur de butin sur le Rule Engine.

### 🗺️ Map-OS Evolution
- [ ] **Persistent Fog v2** : Optimisation des performances du registre de brouillard pour les cartes haute résolution.
- [ ] **Dynamic Token Auras** : Système d'auras visuelles pour la portée des sorts et les zones de danger.

---

## 📅 Historique Récent
- **v6.3.0** (11 Avril 2026) : Augmentation de version mineure, synchronisation globale de la documentation et correction de l'encodage des locales.
- **v6.2.6** (11 Avril 2026) : Correction critique de l'encodage des locales et consolidation de la documentation technique.
- **v6.2.0** (Début Avril 2026) : Lancement de la modularisation de Session-OS.
- **v6.0.0** (Mars 2026) : Migration initiale vers l'architecture Bridge/Tauri ready.

---

> [!TIP]
> **Priorité actuelle** : Stabilisation des nouveaux hooks et déploiement du système de calcul de fiches.

> [!IMPORTANT]
> Version Actuelle : **6.3.0** (Avril 2026)
