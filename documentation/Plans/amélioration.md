# 🚀 GM-OS v5 : Architecture & Améliorations (Source de Vérité)

Ce document centralise les visions, les victoires techniques et les chantiers futurs de GM-OS v5. Il fusionne les notes de développement et la roadmap utilisateur.

---

## ✅ Jalons Atteints (Février - Mars 2026)

### 🧠 Intelligence Artificielle & Social Nexus (v5.5)
* [x] **Social Nexus (Graphe de Relations)** : Visualisation interactive (Force-Graph) avec portraits résolus, asymétrie directionnelle (flèches), filtrage par faction et navigation directe vers les fiches.
* [x] **NPC AI Enrichment (Ollama)** : Enrichissement textuel contextuel et suggestion de prompts d'images basés sur l'univers.
* [x] **NPC Live Generator** : Génération d'avatars PNJ directe via Gemini (Imagen-3).
* [x] **AI Persona Forge** : Génération séquentielle de 7 gèmes (assistants) avec isolation RAG (Système vs Campagne).
* [x] **Vision de l'Oracle** : Narration dynamique basée sur l'état spatial et tactique.
* [x] **Rule Engine Editor Redesign (v5.6)** : Refonte complète de l'interface avec navigation sidebar, design premium glassmorphisme, gestion d'état Zustand optimisée et intégration IA (Personas).
* [x] **Smart Faction Mapping** : Synchronisation des allégeances entre NPC Gallery et Combat-OS.

### 🔊 Audio Engine & Immersion
* [x] **Ducking Narratif v2** : Réduction auto Musique/Ambiance avec contrôles Attack/Range/Release complets.
* [x] **Voice-OS Advanced** : Profilage psychologique IA pour les réglages vocaux.
* [x] **Audio-Map Support** : Lecture synchrone des pistes audio des tokens et cartes animées.
* [x] **Correctif Robustesse** : Protection contre les valeurs `non-finite` et synchronisation sécurisée du store.

### 📱 Connectivité & Performance
* [x] **Tablet Hub 1.0 & Remote Control** : Dashboard second-écran et pilotage déporté via WebSocket.
* [x] **Sync Différentielle (Deltas)** : Optimisation des messages (> 90% de gain de bande passante).
* [x] **Local Asset Middleware** : Service HTTP personnalisé (`gmos://`) pour le chargement massif de médias locaux.
* [x] **Media Cleanup Engine** : Nettoyage auto des médias orphelins dans IndexedDB.

### ⚔️ Tactique & Système
* [x] **Projection Sélective** : Masquage intelligent de l'interface MJ sur les terminaux joueurs.
* [x] **Dice-OS Manual Input** : Saisie clavier directe des seuils de réussite.
* [x] **Champs Dynamiques (NPC)** : Support des PV/HP max éditables dans la galerie de session.
* [x] **Masquage Furtivité** : Filtrage auto des tokens invisibles sur le Player Hub.
* [x] **Media Hub Tactical Redesign** : Refonte visuelle style Obsidian, nouveau Panneau Tactique HUD et attribution interactive des campagnes.
* [x] **Auto-Campaign Linking** : Liaison automatique des assets générés (IA) et exportés (Whiteboard) à la campagne active.

---

## 🔥 Chantiers en Cours (Roadmap v5.6 & +)

### 🗺️ Interaction Carte & Météo
* [ ] **Map Layering & Weather** : Système de calques pour effets météo (Pluie, Neige) et Spell FX.
* [ ] **Active Danger Zones v2** : Plus de types de zones (Aura, Terrain difficile) avec calcul auto.

### 📦 Economie & Butin
* [ ] **Encounter & Loot Generator** : Génération de butin dynamique basée sur le Rule-Engine et tables `.json`.
* [ ] **Auto-Loot Transfer** : (Réévalué) Transfert direct d'objets vers les inventaires PJ.

### ⚙️ UX & Workflow
* [ ] **Master Soundscape Controller** : Curseur master global et bouton "Focus Chat" global (tamisage total).
* [ ] **Layout Manager** : Sauvegarde des configurations de fenêtres par campagne.
* [ ] **Universal Search (Spotlight)** : Recherche rapide d'entités, musiques ou règles (CMD+K).

---

## 💾 Archives (Idées Reportées / Abandonnées)
* ~~**Ligne de Vue (LoS)**~~ : Trop gourmand en ressources pour le moment (Reporté).
* ~~**Gestion de l'Élévation**~~ : Trop complexe pour l'usage actuel (Reporté).
* ~~**Transcription Automatique**~~ : Abandonné pour des raisons de confidentialité et performance locale.

---

> [!TIP]
> Priorité actuelle : **Finalisation des Calques de Carte (Météo)** et **Générateur de Butin**.
