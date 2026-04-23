# 🌌 GM-OS v6.3.0 : The Ultimate Game Master Toolkit

GM-OS v6.3.0 est une plateforme de gestion de sessions de Jeu de Rôle (JdR) de nouvelle génération, conçue pour offrir aux Maîtres de Jeu (MJ) une immersion totale et un contrôle sans précédent sur l'ambiance, le combat et la narration via une architecture modulaire et performante.

## 🚀 Fonctionnalités Clés (v6 Evolution)

- **🌍 I18n READY** : Support complet du Français et de l'Anglais. Le système utilise désormais un standard de nesting strict et une résilience d'encodage UTF8 pour garantir une interface sans glitch.
- **MASTER STORYBOARD** : Table de montage cinématographique horizontale. Synchronisez Musique, Lumières, Cartes et Visuels en une seule séquence déclenchable d'un clic.
- **GM REMOTE CONTROL** : Pilotage déporté sur tablette/smartphone via QR Code. Gérez les dés, les sons, le combat et vos notes de session sans quitter vos joueurs des yeux.
- **SESSIO-OS MODULAR** : Refonte v6 des services de session. Les notes de joueurs sont désormais synchronisées en temps réel entre le MJ et les tablettes.
- **AUDIO ENGINE v6** :
  - **Music OS** : Gestion de playlists multi-sources avec fondus enchaînés.
  - **Ambient OS** : Mixage en temps réel de 8 pistes d'ambiance avec positionnement spatial.
  - **Voice OS** : Modulateur de voix avec **Auto-Ducking** matériel et profilage vocal intelligent.
- **VISUAL OS** :
  - **Image OS** : Projection d'illustrations et cartes vers le **Player Hub** via protocole local sécurisé `gmos://`.
  - **Map OS** : Gestion de cartes avec brouillard de guerre **persistant par asset**, tokens et **Vision de l'Oracle (IA)**.
- **ADVENTURE TOOLS** :
  - **CORTEX TACTIQUE (AI) v3** : Analyse comportementale parallèle (Narration + JSON) pour des conseils immédiats.
  - **Combat OS & Calculator** : Suivi d'initiative et calculateur de dégâts intelligent localisé.
- **SYSTEM OS** :
  - **Nexus-OS v2** : Système de portabilité totale (`.gmos`). Gestion intelligente des URL distantes et scan récursif d'assets.
  - **Hybrid AI Bridge** : Support natif d'**Ollama** pour une IA 100% locale et privée.

## 🛠️ Stack Technique v6

- **Frontend** : [React 18](https://reactjs.org/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool** : [Vite](https://vitejs.dev/)
- **Styling** : [Tailwind CSS](https://tailwindcss.com/)
- **State** : [Zustand](https://github.com/pmndrs/zustand) (Persistence via LocalStorage/IndexedDB)
- **Bridge** : API Unifiée pour **Electron** et **Tauri** (Protocole `window.appBridge`).

## 📦 Installation & Démarrage

```bash
# Installer les dépendances
npm install

# Lancer en mode développement
npm run dev
```

## 🏗️ Architecture "Bridge"

Le projet sépare strictement l'interface utilisateur de la logique système via un objet global `window.appBridge`. Cela permet de faire tourner GM-OS aussi bien dans un navigateur que dans un conteneur natif (Electron/Tauri) sans modification du code UI.

## 📚 Documentation Centralisée

Toute la documentation a été synchronisée pour la v6.2.6. Consultez l'index pour explorer les guides :

👉 **[Index de la Documentation](./docs/README.md)**

- **[Roadmap Master v6](./doc./architecture/roadmap-v6.md)** : Suivi technique de la refonte.
- **[Lessons Learned (Master)](./docs/dev/Lessons_Learned_Archive.md)** : Base de connaissances technique (v5 & v6).
- **[Guide de Migration](./instructions.md)** : Règles d'or du standard de code GM-OS.

---

*GM-OS v6 : Développé pour l'immersion. Conçu pour le contrôle.*
