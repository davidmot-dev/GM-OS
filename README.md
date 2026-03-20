# 🌌 GM-OS v5 : The Ultimate Game Master Toolkit

GM-OS v5 est une plateforme de gestion de sessions de Jeu de Rôle (JdR) de nouvelle génération, conçue pour offrir aux Maîtres de Jeu (MJ) une immersion totale et un contrôle sans précédent sur l'ambiance, le combat et la narration.

## 🚀 Fonctionnalités Clés

- **MASTER STORYBOARD** : Table de montage cinématographique horizontale. Synchronisez Musique, Lumières, Cartes et Visuels en une seule séquence déclenchable d'un clic.
- **GM REMOTE CONTROL** : Pilotage déporté sur tablette/smartphone via QR Code. Gérez les dés, les sons, le combat et vos notes de session sans quitter vos joueurs des yeux.
- **TABLET HUB** : Tableau de bord secondaire pour tablettes. Déportez l'Horloge, les Chronos et les Jauges de Tension en temps réel via WebSocket.
- **SESSION OS** : Centre névralgique de vos campagnes. Gérez vos sessions, joueurs et snapshots d'état système.
- **AUDIO ENGINE** :
  - **Music OS** : Gestion de playlists multi-sources avec fondus enchaînés.
  - **Ambient OS** : Mixage en temps réel de 8 pistes d'ambiance avec positionnement spatial.
  - **Sound OS** : Pads de bruitages instantanés et atmosphères sonores.
  - **Voice OS** : Modulateur de voix en temps réel pour l'incarnation de PNJ.
- **VISUAL OS** :
  - **Image OS** : Projection d'illustrations et cartes vers le **Player Hub**.
  - **Map OS** : Gestion de cartes interactives avec brouillard de guerre et tokens.
- **ADVENTURE TOOLS** :
  - **CORTEX TACTIQUE (AI)** : Analyse intelligente des portées, suggestions de modificateurs de dés, et synchronisation automatique des lumières (Hue) et sons en fonction du danger.
  - **Combat OS** : Suivi d'initiative avancé, gestion des PV et export automatique des résumés vers la chronologie.
  - **Dice OS** : Moteur de lancer de dés 3D ultra-rapide.
  - **NPC OS** : Galerie de PNJ synchronisée avec le visuel et l'audio.

## 🛠️ Stack Technique

- **Frontend** : [React 18](https://reactjs.org/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool** : [Vite](https://vitejs.dev/)
- **Styling** : [Tailwind CSS](https://tailwindcss.com/)
- **State** : [Zustand](https://github.com/pmndrs/zustand) (Persistence via LocalStorage)
- **Icons** : [Lucide React](https://lucide.dev/)
- **Bridge** : API Unifiée pour **Electron** et **Tauri**.

## 📦 Installation & Démarrage

```bash
# Installer les dépendances
npm install

# Lancer en mode développement
npm run dev
```

## 🏗️ Architecture "Bridge"

Le projet sépare strictement l'interface utilisateur de la logique système via un objet global `window.appBridge`. Cela permet de faire tourner GM-OS aussi bien dans un navigateur que dans un conteneur natif (Electron/Tauri) sans modification du code UI.

## 📚 Documentation

Plus d'informations techniques et guides d'utilisation sont disponibles dans le dossier `docs/` :

- **[Architecture (Brain vs Body)](file:///c:/Users/david/OneDrive/Jeux%20de%20R%C3%B4les/GM-OS-v5/docs/architecture/rule-engine-ai.md)** : Fonctionnement du Moteur de Règles et de l'IA.
- **[Guide de Migration](file:///c:/Users/david/OneDrive/Jeux%20de%20R%C3%B4les/GM-OS-v5/docs/guides/migration-guide.md)** : Instructions pour la transition vers la v5.
- **[Historique du Projet](file:///c:/Users/david/OneDrive/Jeux%20de%20R%C3%B4les/GM-OS-v5/docs/history/)** : Comptes-rendus des phases de développement (Forge, etc.).
- **[Dev & Debug](file:///C:/Projet_David/GM-OS-v5/docs/dev/)** : Notes techniques pour le débogage.

### 🤖 Gemini CLI Integration
Le projet intègre désormais **Gemini CLI** pour des opérations assistées par IA directement en terminal.

**Installation & Login :**
1. Installez les dépendances : `npm install`
2. Connectez-vous : `npx @google/gemini-cli login`

**Usage :**
- `npm run gemini -- "ta question"` : Pose une question générale.
- `npm run gemini:doc -- "Explique le système Oracle"` : Pose une question avec le contexte complet de la documentation locale.

---
*Développé pour l'immersion. Conçu pour le contrôle.*
