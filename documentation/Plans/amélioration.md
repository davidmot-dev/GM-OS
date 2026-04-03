# 🚀 GM-OS v5 : Roadmap & Stratégie (v5.6.5-BETA)

Ce document centralise la vision, les victoires techniques et les chantiers futurs de GM-OS v5. Il sert de "Source de Vérité" pour l'évolution du système.

---

## 🏛️ Piliers Fonctionnels & Jalons Atteints

### 🧠 Intelligence Artificielle & Contextualisation
*L'IA au service de la narration et de la cohérence de l'univers.*

* [x] **Social Nexus v2** : Graphe interactif avec résolution asynchrone d'avatars (`useAvatarResolver`) et filtrage par faction.
* [x] **NPC Live Generator** : Génération d'avatars PNJ via Imagen-3 et enrichissement biographique via Ollama.
* [x] **AI Persona Forge** : Création séquentielle de 7 gèmes (assistants) avec isolation RAG (Système vs Campagne).
* [x] **Vision de l'Oracle** : Narration dynamique basée sur l'état spatial et tactique des jetons.
* [x] **Rule Engine Editor** : Refonte premium style Obsidian avec navigation directe et intégration IA.

### ⚔️ Hub Tactique & Moteur de Jeu
*Outils de combat, de cartographie et de résolution d'actions.*

* [x] **Map Layering & Weather** : Système de calques pour effets météo (Pluie, Neige) et Spell FX.
* [x] **Map Layer Effects v2** : Brouillard de guerre persistant par carte, gestion visuelle granulaire et initialisation sécurisée par défaut (noir complet). [v5.1.2]
* [x] **Map Presets & Danger Zones** : Sauvegarde/Rappel de scènes complexes (auras, terrains difficiles).
* [x] **Dice-OS & Combat Tracking** : Saisie manuelle des seuils, masquage de furtivité, synchronisation des PV max et de la projection automatique vers le Player Hub.
* [x] **Projection Sélective** : Masquage intelligent de l'interface MJ sur les terminaux joueurs (Blackout sélectif).
* [x] **Universal Search (Spotlight)** : Recherche globale ultra-rapide (`CMD+K`) sur tous les modules.

### 🔊 Audio Engine & Immersion
*Atmosphere sonore et réactivité vocale.*

* [x] **Master Soundscape Controller** : Curseur master global et bouton **Focus Chat** (tamisage auto musique/ambiance).
* [x] **Global Panic Button (Stop All)** : Arrêt d'urgence synchronisé de tous les médias (Audio, Vidéo, Lumière). [v5.3.0]
* [x] **Voice-OS Advanced** : Profilage psychologique IA pour réglages vocaux et synchronisation avec les portraits.
* [x] **Audio-Map Sync** : Lecture synchrone des pistes liées aux tokens et cartes animées.
* [x] **Ducking Narratif v2** : Contrôles Attack/Range/Release complets pour la musique par rapport à la voix.

### ⚙️ Performance & Connectivité
*Infrastructure, synchronisation et fluidité multi-écrans.*

* [x] **Tablet Hub 1.0 & Remote Control** : Pilotage second-écran via WebSocket ultra-basse latence.
* [x] **Differential Sync (Deltas)** : Optimisation des messages pour un gain net de bande passante (> 90%).
* [x] **Layout Manager v1 & Workspace Sync** : Sauvegarde et adaptation auto du layout selon le nombre d'écrans.
* [x] **Shell Decoupling** : Résolution des dépendances circulaires via l'accès dynamique `window` pour les moteurs globaux. [v5.3.0]
* [x] **Media Cleanup Engine** : Nettoyage pro-actif des médias orphelins dans IndexedDB avec système de **Persistance (Asset Lock)**. [v5.1.2]
* [x] **Campaign Deletion Cascade** : Suppression automatique et récursive de toutes les données liées (PNJ, Sessions, Atlas, Wiki, Indices) lors du retrait d'une campagne. [v5.2.0]
* [x] **Media Tag Removal** : Nettoyage asynchrone des références de campagne dans le Media Hub via IndexedDB. [v5.2.0]

### 🖼️ Visual Experience (Mise à jour v5.3)
* [x] **Smooth Projection Transitions** : Système de Fade Out / Fade In pour les changements d'images.
* [x] **Single-Click Projection Reliability** : Correction de l'initialisation du moteur de projection (suppression du double-clic).

---

## 🔥 Chantiers en Cours (Priorités)

### 📦 Economie & Butin (v5.7 Focus)
* [ ] **Encounter & Loot Generator** : Génération de butin dynamique basée sur le Rule-Engine et tables `.json`.
* [ ] **Auto-Loot Transfer** : (Réévalué) Transfert direct d'objets vers les inventaires PJ via le Hub.

### 🛠️ UX & Qualité de Vie
* [x] **Auto-Backup & GitHub Sync** : Système de sauvegarde robuste avec isolation par branche (`data-sync`) et tolérance aux pannes. [v5.1.1-STABLE]

---

## 💾 Idées Postponées (Backlog)
* ~~**Ligne de Vue (LoS)**~~ : Trop gourmand en ressources pour le moment.
* ~~**Gestion de l'Élévation 3D**~~ : Trop complexe pour l'usage actuel en 2D top-down.
* ~~**Transcription Automatique**~~ : Abandonné pour des raisons de confidentialité et performance locale.

---

## 📅 Historique des Versions (Changelog Flash)
- **v5.1.1** (Mars 2026) : Stabilisation du Git Backup, isolation de branche orphaned, et correction du crash de sérialisation JSON.
- **v5.3.0** (Avril 2026) : Implémentation du Panic Button, transitions d'images fluides et résolution des dépendances circulaires du Shell.

---

> [!TIP]
> **Priorité actuelle** : **Générateur de Butin** et **Amélioration du Brouillard de Guerre**.

> [!IMPORTANT]
> Version Actuelle : **5.3.0-STABLE** (Avril 2026)
