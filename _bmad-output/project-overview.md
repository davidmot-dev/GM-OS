# 🌌 Project Overview: GM-OS v5

GM-OS v5 est une plateforme de gestion de sessions de Jeu de Rôle (JdR) de nouvelle génération, conçue pour offrir aux Maîtres de Jeu (MJ) une immersion totale et un contrôle sans précédent sur l'ambiance, le combat et la narration.

## 🚀 Core Objectives

- **Immersion Totale** : Synchronisation entre l'audio, les visuels et la narration.
- **Contrôle Simplifié** : Interface modulaire permettant de gérer des systèmes complexes avec aisance.
- **Portabilité "Bridge"** : Architecture prête pour l'exécution native (Electron/Tauri) ou web.
- **Intelligence Tactique** : Intégration de l'IA pour assister le MJ dans les décisions de règles et la narration.

## 🛠️ Technology Stack

- **Frontend** : React 19, TypeScript 5.9
- **Build Tool** : Vite 7
- **Styling** : Tailwind CSS 4
- **State Management** : Zustand 5 (avec persistance)
- **Runtime** : Electron 40
- **Testing** : Vitest 4

## 🧩 Architectural Overview
Le projet repose sur une architecture **Bridge** qui sépare strictement l'UI de l'infrastructure système via `window.appBridge`. La logique métier est organisée en **Modules** indépendants (Audio, Map, NPC, Combat, etc.) communiquant via des stores globaux (Zustand).

## 📊 Project Scope

- **19 Modules Fonctionnels** : De la gestion audio 3D au suivi d'initiative en combat.
- **Système de Drivers** : Support multi-systèmes (Cthulhu, D&D, etc.) via des modèles de feuilles et des moteurs de règles.
- **Player Hub** : Interface interactive permettant aux joueurs de voir les cartes, les visuels et de participer aux pings tactiques.
