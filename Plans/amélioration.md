# 🚀 GM-OS v5 : Architecture & Améliorations

Ce document est la boussole technique du projet, listant les innovations, les succès et les défis futurs.

---

## ✅ Jalons Atteints (V5.4 & Précédents)

### 🔊 Immersion Sonore & Voice

* [x] **Ducking Narratif (Auto-Ducking)** : Réduction automatique intelligente du volume Musique/Ambiance lors de la prise de parole (Voice-OS) avec contrôles de timings (Attack/Release).
* [x] **Voice-Level Sync** : Visualiseur sonore dynamique répercuté sur le Tablet Hub pour l'immersion des joueurs.
* [x] **AI-Driven Voice Profiling** : Analyse psychologique du PNJ via IA pour générer des réglages de voix uniques.

### 🧠 Intelligence Artificielle & Génération
* [x] **NPC AI Enrichment (Ollama)** : Enrichissement textuel contextuel et suggestion de prompts d'images basés sur l'univers et la campagne.
* [x] **AI-Driven Voice Profiling** : Analyse psychologique du PNJ via IA pour générer des réglages de voix uniques.
* [x] **NPC Live Generator** : Génération d'avatars PNJ directement intégrée via Z-Image/Gemini.
* [x] **AI Persona Auto-Fill** : Génération séquentielle ultra-robuste de 7 assistants IA (GEMS) avec support optimisé pour Ollama.
* [x] **Contextual RAG Isolation** : Filtrage intelligent des sources d'information (Système vs Campagne) pour une précision accrue des réponses de l'IA.

### 🔊 Immersion Sonore & Robustesse
* [x] **Ducking Narratif v2** : Réduction automatique avec contrôles UI complets (Attack, Range, Release).
* [x] **Correctif Robustesse Audio** : Protection contre les valeurs `non-finite` et synchronisation sécurisée du store (Bugfix 1.0.1).
* [x] **Sécurisation React/AI** : Couche d'assainissement des données IA pour prévenir les crashs d'affichage sur les titres et noms.

### 📱 Connectivité & Remote
* [x] **Tablet Hub 1.0** : Interface second-écran pour tablettes via **WebSocket (Port 3001)**.
* [x] **GM Remote Control** : Pilotage déporté multi-appareils (Dés, Sons, Combat).
* [x] **Dynamic QR-Code Settings** : Double section dans les paramètres (Remote vs Tablet) avec détection d'IP automatique.
* [x] **Local Asset Middleware** : Service d'images via HTTP pour les tablettes (optimisation bande passante vs Base64).

### ⚙️ Architecture & Système
* [x] **Sync Différentielle (Deltas)** : Envoi exclusif des propriétés modifiées via WebSocket (réduction du trafic > 90%).
* [x] **IndexedDB Scoping** : Nettoyage automatique des médias orphelins pour limiter l'empreinte disque.
* [x] **Tauri v2 Readiness** : Audit et typage strict d'AppBridge pour une migration "Zéro-Impact" (Electron -> Tauri).
* [x] **Clock-OS Hub Sync** : Synchronisation temps-réel de l'horloge et des thèmes sur tous les écrans.
* [x] **Slideshow / Diaporama** : Moteur de projection d'images séquentiel fonctionnel.

---

## 🔥 Chantiers en Cours (Roadmap)

### 🗺️ Map-OS : Vision & Tactique
* [ ] **Zones de Danger Actives** : Déclencheur Hue/Audio automatique si un pion entre dans une zone d'effet (Feu, Poison, etc.).

### 🖼️ Image-OS & Vision
* [ ] **Génération d'Images Local (Ollama Flux)** : Support expérimental du modèle `flux` via Ollama pour une génération 100% offline.

---

## 存档 Archives (Idées Reportées)

* ~~**Butin Automatique**~~ : Transfert direct d'objets du Table-OS vers les fiches PJ.
* ~~**Gestion de l'Élévation**~~ : Calcul auto des bonus de tir plongeant.
* ~~**Ligne de Vue (LoS)**~~ : Détection dynamique d'obstacles sur la map.
* ~~**Transcription Automatique**~~ : Écoute passive pour archiver les faits marquants (Abandonné pour Confidentialité).

---

> [!NOTE]
> Ce document est synchronisé avec le [README.md](file:///c:/Projet_David/GM-OS-v5/README.md) et la Roadmap utilisateur.
