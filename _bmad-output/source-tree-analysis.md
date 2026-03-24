# 📂 Source Tree Analysis: GM-OS v5

Cette analyse détaille la structure organisationnelle du projet GM-OS v5, en mettant en avant les points d'entrée et les dossiers critiques.

## 🏗️ high-level Structure

```text
GM-OS-v5/
├── electron/           # Main process Electron (Logique système & Bridge)
├── public/             # Assets statiques (Index.html, favicons)
├── src/                # Code source de l'application (Renderer)
│   ├── modules/        # Modules fonctionnels (Cœur de l'application)
│   ├── stores/         # Gestion d'état global (Zustand)
│   ├── components/     # UI components génériques et réutilisables
│   ├── types/          # Interfaces et types TypeScript partagés
│   ├── data/           # Données statiques et templates de base
│   ├── hooks/          # Custom hooks React transverses
│   ├── utils/          # Fonctions utilitaires
│   └── main.tsx        # Point d'entrée de l'interface UI
├── docs/               # Documentation technique et guides
├── _bmad/              # Configuration et workflows des agents IA
└── _bmad-output/       # Outputs et rapports générés par BMAD
```

## 🧩 Critical Directories

### `/src/modules/`

Le dossier le plus important. Chaque sous-dossier représente une fonctionnalité majeure :

- `ambient/`, `music/`, `sound/`, `voice/` : Le moteur audio complet.
- `map/`, `image/` : Moteur visuel et cartographique.
- `npc/`, `combat/`, `dice/` : Logique de jeu et outils MJ.
- `session/`, `forge/` : Gestion des campagnes et création de contenu.

### `/src/stores/`
Centralise l'état de l'application. Chaque module possède généralement un store Zustand dédié (ex: `useMapStore.ts`, `useAudioStore.ts`).

### `/electron/`
Contient le "Preload" et le "Main process". C'est ici qu'est défini le `appBridge`, interface vitale pour l'accès au système de fichiers et au matériel (Audio, MIDI) hors du bac à sable du navigateur.

## 🚀 Entry Points

1. **System Entry** : `electron/main.ts` (Initialise la fenêtre et les services natifs).
2. **UI Entry** : `src/main.tsx` (Monte l'application React).
3. **Store Entry** : `src/stores/` (Point de synchronisation entre tous les composants).
