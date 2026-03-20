# 🚀 GM-OS v5 : Roadmap de Développement

Ce document centralise les visions, les chantiers en cours et les victoires techniques de la refonte v5.

## ✅ Jalons Atteints (Mars 2026)

### 🧩 Système & Connectivité
- **GM Remote Control** : Pilotage déporté multi-appareils (Dés, Sons, Combat).
- **Tablet Hub 1.0** : Dashboard second-écran web-base (Horloge, Tensions) via WebSocket.
- **Unified AppBridge** : Architecture découplée permettant l'abstraction du moteur (Electron/Tauri).

### 🧠 IA & Narration
- **AI Oracle MCP** : Intégration NotebookLM avec RAG local/distant et interface de reconnexion.
- **NPC Live Generator** : Génération d'images/avatars IA intégrée aux fiches PNJ.

### ⚔️ Combat & Tactique
- **Cerveau Tactique 1.0** : Analyse de portée (Year Zero), feedback Hue et audio dynamique.

---

## 🛠️ Chantiers Prioritaires (Backlog)

### 1. 🌐 Infrastructure & Performance
- **Architecture AI Hybride (Ollama)** : Connecter un serveur local Ollama pour les tâches à haute fréquence (Voice profiling, aide aux règles) afin de réduire les coûts API et permettre un mode **Offline**.
- **Standardisation AppBridge v2** : Finaliser l'audit des types pour une migration "Zéro-Effort" vers Tauri v2.
- **Local Asset Middleware** : Remplacer le Base64 systématique par un mini-serveur d'images local pour soulager la bande passante WebSocket vers les tablettes.
- **Multi-Instance Sync** : Permettre à plusieurs tablettes de se connecter simultanément avec des vues filtrées.

### 2. 🗺️ Cartographie & Perception
- **Zones de Danger Actives** : Déclencheur Hue/Audio automatique si un pion entre dans une zone d'effet (Feu, Poison).

### 3. 🤖 Intelligence Artificielle (NPC AI)
- **AI-Driven Voice Profiling** : Utiliser Gemini pour analyser la psychologie/race du PNJ et générer des réglages de voix uniques (Pitch, Formant, Reverb) au-delà des mots-clés simples.
- **Portrait Lip-Sync (Lite)** : Faire bouger la bouche ou pulser l'aura du portrait du PNJ sur le **Player Hub** et **Tablet Hub** en temps réel selon l'intensité vocale du MJ.
- **Analyse de Combat en Temps Réel** : Suggestions tactiques basées sur l'état du groupe ("Repli", "Flanquement").
- **Génération Narratif** : Intégration de l'IA pour générer des descriptions d'ambiance basées sur les tokens présents sur la carte.

### 4. 🎭 Immersion Sensorielle
- **Ducking Narratif (Auto-Ducking)** : Réduction automatique du volume de Music-OS/Ambient-OS lors des prises de parole du MJ pour une clarté optimale.
- **VFX Voice-Trigger** : Déclenchement d'effets visuels (Map-OS / Hubs) basés sur l'intensité vocale ou les pics de fréquence (ex: "Cri de Guerre" = Flashes sur le Hub).
- **Ambient Proximity** : Volume de l'ambiance sonore variant selon la position du curseur MJ ou des pions PJ.
- **Visualizer Audio 2.0** : Intégration plus poussée du rythme sonore dans les effets de bordure du Tablet Hub.

---

## 💾 Archives (Idées Abandonnées / Reportées)

- **Ligne de Vue (LoS)** : Détection dynamique d'obstacles pour la visibilité des pions.
- **Gestion de l'Élévation** : Calcul des bonus de hauteur (Axe Z).
- **Butin Automatique** : Transfert direct d'objets du Table-OS vers les fiches PJ.
- **Retour Haptique** : Vibrations sur les contrôleurs lors des impacts.

---

> [!TIP]
> Priorité actuelle : **Fiabilisation de la synchronisation Hub** et **Préparation à la migration légère (Tauri)**.
