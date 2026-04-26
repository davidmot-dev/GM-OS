# 🌦️ Walkthrough : Gemini CLI & Effets Météo

Ce document détaille l'implémentation de l'assistant Gemini CLI et du nouveau moteur de météo dynamique pour Map OS.

## 1. Moteur de Météo Dynamique (Map OS)

### Objectif
Ajouter une couche d'immersion visuelle synchronisée sur les cartes tactiques (Pluie, Neige, Brouillard).

### Réalisations
- **`WeatherLayer.tsx`** : Création d'un composant utilisant l'API Canvas pour le rendu de particules.
    - Performance optimisée via `requestAnimationFrame`.
    - Support de 3 types d'effets : `rain`, `snow`, `smoke`.
- **`useMapStore.ts`** : Extension du store Zustand pour gérer l'état de la météo (`weatherType`, `weatherIntensity`) et sa projection.
- **`MapControls.tsx`** : Ajout d'une interface d'administration pour le GM permettant de changer le climat en un clic.

### Rendu Visuel
- **Pluie** : Traits fins et rapides avec effet de transparence.
- **Neige** : Flocons ronds et lents avec mouvement sinusoïdal.
- **Brouillard** : Particules larges et diffuses simulant une brume mouvante.

---

## 2. Intégration Gemini CLI

### Objectif
Permettre au MJ ou au développeur d'interagir avec le code et la documentation via un terminal IA.

### Réalisations
- **Installation** : `@google/gemini-cli` configuré dans le projet.
- **Bridge Script** (`scripts/gemini-bridge.js`) : Script utilitaire pour injecter automatiquement le contexte du projet (documentation, modules sources) dans les requêtes Gemini.
- **Scripts NPM** :
    - `npm run gemini` : Requêtes générales.
    - `npm run gemini:doc` : Pose des questions spécifiquement sur la documentation du projet.

---

## 3. Validation & Tests

### Vérifications effectuées
- [x] Rendu fluide du Canvas sur Map OS (60 FPS).
- [x] Synchronisation en temps réel sur le Player Hub via projection.
- [x] Persistance des réglages météo dans la session.
- [x] Correction des erreurs de typage TypeScript générées par l'IA.

---
*Dernière mise à jour : 17 Mars 2026*
