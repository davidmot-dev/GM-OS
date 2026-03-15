# 🏗️ Technical Architecture: GM-OS v5

Ce document détaille l'architecture logicielle de GM-OS v5, ses patterns de conception et ses flux de données.

## 1. Architecture "Bridge" (Multi-Runtime)

Le principe fondamental de GM-OS v5 est l'indépendance vis-à-vis du runtime.

- **Renderer (UI)** : Code React pur, utilisant uniquement TypeScript et CSS (Tailwind). Aucun import Node.js.
- **Bridge (API)** : Exposé via `window.appBridge`, il offre des méthodes asynchrones pour :
  - Lire/Écrire des fichiers.
  - Sauvegarder des configurations.
  - Accéder aux entrées/sorties audio et MIDI.
  - Gérer les processus externes.

## 2. Gestion d'État (Zustand)

L'application utilise **Zustand** pour un état global performant et découplé.

- **Stores Modulaires** : Chaque fonctionnalité a son propre store (ex: `useNPCStore`, `useSessionStore`).
- **Persistance** : Certains stores sont synchronisés avec le `LocalStorage` ou via le `appBridge` pour conserver l'état entre les sessions.
- **Flux de Données** : L'UI consomme les stores et déclenche des actions. Les composants sont des fonctions pures de l'état.

## 3. Pattern de Modules

Chaque module dans `src/modules` suit généralement cette structure :

- `components/` : Éléments d'interface spécifiques au module.
- `services/` : Logique métier pure, indépendante de React (testable via Vitest).
- `api/` : (Optionnel) Wrappers autour du `appBridge`.
- `ModuleDashboard.tsx` : Vue MJ principale.
- `ProjectorView.tsx` : (Optionnel) Vue dédiée à la projection vers les joueurs.

## 4. Intégration IA (Tactical AI)

GM-OS intègre une intelligence tactique capable d'analyser l'état du jeu :

- **Oracle & Sage** : Agents IA capables de répondre aux questions de règles en se basant sur les documents PDF ingérés (via RAG).
- **Cerveau Tactique** : Analyse les positions sur la carte (Map OS) et les stats de combat pour suggérer des bonus/malus lors des lancers de dés (Dice OS).

## 5. Stratégie de Test

- **Vitest** : Utilisé pour les tests unitaires des services et des stores.
- **Mocking Strategy** : Le `appBridge` est systématiquement mocké pour permettre l'exécution des tests hors d'un environnement Electron.
- **Classes de Test** : Les algorithmes complexes (ex: calcul de portée, pathfinding) sont encapsulés dans des classes testables isolément.
