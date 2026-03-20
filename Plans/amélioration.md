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

### 🎭 IA & Narration
* [x] **NPC Live Generator** : Génération d'images/avatars directement intégrée via Z-Image/Gemini.
* [x] **AI Oracle (NotebookLM)** : Intégration RAG native, support MCP et reconnexion automatique.

### ⚔️ Combat & Tactique
* [x] **Cortex Tactique (Actions)** : Suggestions intelligentes basées sur la position et l'état.
* [x] **Calculateur Gold Ghost** : Bouton de dégâts à haute visibilité et mapping automatique de statuts.

---

## 🔥 Priorité 1 : Infrastructure & Performance

### 🏗️ Architecture "Next-Gen" & IA
* [ ] **Architecture AI Hybride (Ollama)** : Connecter un serveur local Ollama pour les tâches à haute fréquence (Morphing vocal PNJ, calculs de dés narratifs, suggestions d'ambiance) afin de réduire la dépendance aux APIs Cloud et garantir un mode **Offline** total.
* [ ] **Tauri v2 Readiness** : Audit et typage strict de `window.appBridge` pour une migration "Zéro-Impact" (Backend Rust optionnel).
* [ ] **Local Asset Middleware** : Remplacer le Base64 systématique par un mini-serveur d'images local pour soulager la bande passante WebSocket vers les tablettes.
* [ ] **Multi-Hub Viewports** : Permettre des vues différentes par tablette (ex: Tablette Joueur vs Tablette Ambiance MJ).

### ⚙️ Optimisation Système
* [ ] **IndexedDB Scoping** : Nettoyage automatique des médias orphelins (PNJ supprimés) pour limiter l'empreinte disque.
* [ ] **Sync Différentielle** : N'envoyer via WebSocket que les propriétés modifiées plutôt que le store complet (Optimization Payload).

---

## 🟡 Priorité 2 : Gameplay & Environnement

### 🗺️ Map-OS : Vision & Tactique
* [ ] **Zones de Danger Actives** : Déclencheur Hue/Audio automatique si un pion entre dans une zone d'effet (Feu, Poison).

### 🗣️ NPC & Voice-OS (Advanced)
* [ ] **AI-Driven Voice Profiling** : Utiliser Gemini pour analyser la psychologie/race du PNJ et générer des réglages de voix uniques (Pitch, Formant, Reverb) au-delà des mots-clés simples.
* [ ] **Portrait Lip-Sync (Lite)** : Faire bouger la bouche ou pulser l'aura du portrait du PNJ sur le **Player Hub** et **Tablet Hub** en temps réel selon l'intensité vocale du MJ.
* [x] **Ducking Narratif (Auto-Ducking)** : Réduction automatique du volume de Music-OS/Ambient-OS lors des prises de parole du MJ pour une clarté optimale.
* [ ] **VFX Voice-Trigger** : Déclenchement d'effets visuels (Map-OS / Hubs) basés sur l'intensité vocale ou les pics de fréquence (ex: "Cri de Guerre" = Flashes sur le Hub).
* [ ] **Dialogue Tree Engine** : Arbres de dialogue générés dynamiquement par IA selon le contexte de la session.
* [ ] **Ambient Proximity** : Volume de l'ambiance sonore variant selon la position du curseur MJ ou des pions PJ.

---

## ⚪ Futuriste & R&D

* [ ] **Dynamic Theme Engine** : Alternance automatique (Jour/Nuit) ou thèmes basés sur la tension de l'Horloge narrative.

---

## 📦 Packaging & Distribution (Nouveau)
* [ ] **Support Windows Installer** : Configurer `electron-builder` pour générer des fichiers `.exe` ou `.msi`.
* [ ] **Nettoyage TypeScript** : Résoudre toutes les erreurs de type dans `main.ts` (notamment les `any` et modules manquants) pour garantir une compilation stable via `npm run build`.
* [ ] **Code Signing** : Préparer les certificats pour éviter les alertes "SmartScreen" lors du lancement de l'application compilée.

---

## 💾 Archives (Idées Abandonnées / Reportées)

* ~~**Butin Automatique** : Transfert direct d'objets du Table-OS vers les fiches PJ.~~
* ~~**Gestion de l'Élévation** : Calcul auto des bonus de tir plongeant.~~
* ~~**Ligne de Vue (LoS)** : Détection dynamique d'obstacles sur la map.~~
* ~~**Retour Haptique** : Vibrations sur les contrôleurs/smartphones.~~
* ~~**Transcription Automatique** : Écoute passive pour archiver les faits marquants.~~ (Raison : Confidentialité et limitations API temps réel).
* ~~**Éclairage Dynamique Réactif** : Brouillard de guerre pilotant les Hue individuellement.~~ (Raison : Complexité réseau excessive).

---

---

> [!NOTE]  
> Ce document doit rester cohérent avec [Plans/amélioration.md](file:///c:/Projet_David/GM-OS-v5/Plans/amélioration.md) et la roadmap utilisateur.
