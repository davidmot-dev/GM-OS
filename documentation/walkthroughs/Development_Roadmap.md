# 🚀 GM-OS v5 : Roadmap de Développement

Ce document centralise les visions, les chantiers en cours et les victoires techniques de la refonte v5.

## ✅ Jalons Atteints (Mars 2026)

### 🧩 Système & Connectivité

- **GM Remote Control** : Pilotage déporté multi-appareils (Dés, Sons, Combat).
- **Tablet Hub 1.0** : Dashboard second-écran web-base (Horloge, Tensions) via WebSocket.
- **Unified AppBridge** : Architecture découplée permettant l'abstraction du moteur (Electron/Tauri).
- **Media Cleanup Engine** : Nettoyage automatique des médias orphelins dans IndexedDB.
- **Sync Différentielle WebSocket** : Optimisation du poids des messages (Envoi des deltas uniquement).
- **Local Asset Middleware** : Service d'images via HTTP pour les tablettes (Fin du Base64 massif).
- **AppBridge v2 (Zéro-Any)** : Audit et typage strict des interfaces pour la migration Tauri v2.
- **Multi-Instance Sync (v5.1 Party Mode)** : Identification robuste par `deviceId`, gestion du lobby et résilience réseau.
- **Protocole gmos://** : Sécurisation des accès aux ressources locales sur Windows.

### 🧠 IA & Narration

- **NPC AI Enrichment (Ollama)** : Enrichissement textuel contextuel et suggestion de prompts d'images basés sur l'univers et la campagne.
- **AI-Driven Voice Profiling** : Analyse psychologique des PNJ par l'IA pour générer des réglages Voice-OS.
- **NPC Live Generator** : Génération d'images/avatars IA intégrée aux fiches PNJ.

### 🔊 Immersion Sonore & Robustesse

- **Ducking Narratif v2** : Réduction automatique intelligente du volume Musique/Ambiance avec contrôle complet des timings (Attack, Release) et du seuil.
- **Correctif Robustesse Audio** : Protection contre les valeurs `non-finite` et synchronisation sécurisée du store (Bugfix 1.0.1).
- **Sécurisation React/AI** : Couche d'assainissement des données IA pour prévenir les crashs d'affichage sur les titres et noms.
- **Dice OS manual input** : Possibilité de saisir manuellement les seuils de réussite.

---

## 🛠️ Chantiers Prioritaires (V5.4)

### 1. 🎭 Immersion Visuelle
- **Génération Narrative** : Intégration de l'IA pour générer des descriptions d'ambiance basées sur les tokens présents sur la carte.

### 2. 🗺️ Cartographie & Perception
- **Zones de Danger Actives** : Déclencheur Hue/Audio automatique si un pion entre dans une zone d'effet (Feu, Poison).

### 4. 🎨 IA Visuelle (Expérimental)
- **Génération d'Image Local (Ollama Flux)** : Fonctionnalité déjà présente dans le code. À tester avec des modèles plus légers pour les machines de jeu standard.

---

## 💾 Archives (Idées Abandonnées / Reportées)

- **Ligne de Vue (LoS)** : Détection dynamique d'obstacles pour la visibilité des pions.
- **Gestion de l'Élévation** : Calcul des bonus de hauteur (Axe Z).

---

> [!TIP]
> Priorité actuelle : **Immersion vocale (Lip-Sync/Ducking)** et **Interactivité de la carte (Zones)**.
