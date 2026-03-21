# 🚀 GM-OS v5 : Architecture & Améliorations

Ce document est la boussole technique du projet, listant les innovations, les succès et les défis futurs.

---

## ✅ Jalons Complétés (Récents)

### 📲 Connectivité & Remote

* [x] **GM Remote Control** : Pilotage déporté multi-appareils (Dés, Sons, Combat).
* [x] **Tablet Hub 1.0** : Interface second-écran pour tablettes via **WebSocket (Port 3001)**.
* [x] **Dynamic QR-Code Settings** : Double section dans les paramètres (Remote vs Tablet) avec détection d'IP automatique.
* [x] **Voice-Level Sync** : Visualiseur sonore dynamique répercuté sur le Tablet Hub pour l'immersion.
* [x] **Clock-OS Hub Sync** : Synchronisation temps-réel de l'horloge, des thèmes et de la projection MJ/Hub.
* [x] **Local Asset Middleware** : Service d'images via HTTP pour les tablettes (optimisation bande passante).
* [x] **Tauri v2 Readiness** : Audit et typage strict de `window.appBridge` pour une migration "Zéro-Impact".

### 🎭 IA & Narration

* [x] **NPC Live Generator** : Génération d'images/avatars directement intégrée via Z-Image/Gemini.
* [x] **AI Oracle (NotebookLM)** : Intégration RAG native, support MCP et reconnexion automatique.

### ⚔️ Combat & Tactique

* [x] **Cortex Tactique (Actions)** : Suggestions intelligentes basées sur la position et l'état.
* [x] **Calculateur Gold Ghost** : Bouton de dégâts à haute visibilité et mapping automatique de statuts.

---

## 🔥 Priorité 1 : Infrastructure & Performance

### 🏗️ Architecture "Next-Gen" (Audit Complété)

### ⚙️ Optimisation Système

* [x] **IndexedDB Scoping** : Nettoyage automatique des médias orphelins (PNJ supprimés) pour limiter l'empreinte disque.
* [x] **Sync Différentielle** : N'envoyer via WebSocket que les propriétés modifiées plutôt que le store complet.

---

## 🟡 Priorité 2 : Gameplay & Environnement

### 🗺️ Map-OS : Vision & Tactique

* [ ] **Zones de Danger Actives** : Déclencheur Hue/Audio automatique si un pion entre dans une zone d'effet (Feu, Poison).

### 🗣️ NPC & Voice-OS (Advanced)

* [ ] **AI-Driven Voice Profiling** : Utiliser Gemini pour analyser la psychologie/race du PNJ et générer des réglages de voix uniques.
* [ ] **Portrait Lip-Sync (Lite)** : Faire bouger la bouche du portrait du PNJ en temps réel selon l'intensité vocale du MJ.
* [x] **Ducking Narratif (Auto-Ducking)** : Réduction automatique du volume de Music-OS/Ambient-OS lors des prises de parole.

---

## 存档 Archives (Idées Abandonnées / Reportées)

* ~~**Butin Automatique**~~ : Transfert direct d'objets du Table-OS vers les fiches PJ.
* ~~**Gestion de l'Élévation**~~ : Calcul auto des bonus de tir plongeant.
* ~~**Ligne de Vue (LoS)**~~ : Détection dynamique d'obstacles sur la map.
* ~~**Transcription Automatique**~~ : Écoute passive pour archiver les faits marquants. (Raison : Confidentialité).

---

> [!NOTE]
> Ce document doit rester cohérent avec [README.md](file:///c:/Projet_David/GM-OS-v5/README.md) et la roadmap utilisateur.
