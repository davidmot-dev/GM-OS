# 🧹 Finalisation du Nettoyage des Médias & Audit Technique (2026-03-21)

Ce document archive la phase de développement du service de nettoyage des médias et la refonte technique associée.

## 1. Service de Nettoyage (`MediaCleanupService.ts`)

Un nouveau service singleton a été créé pour gérer le cycle de vie des médias stockés dans IndexedDB.

- **Logique :** Le service scanne tous les stores (PNJ, Sessions, Combat, Images, Sons) pour collecter les IDs utilisés (`m-xxx`). Il compare ensuite cette liste avec le contenu de l'IndexedDB `gmos-media-db` et supprime tout ce qui n'est plus référencé.
- **Performance :** Une latence de 5 secondes est respectée au démarrage pour éviter de ralentir l'initialisation de l'application.

## 2. Intégration UI (`GlobalSettingsModal.tsx`)

Un bouton de nettoyage manuel a été ajouté dans l'onglet **Système** des paramètres globaux.

- Affiche le nombre de fichiers supprimés et l'espace libéré (octets).
- Gestion des états de chargement et retours utilisateur via `gmToast`.

## 3. Automatisation (`App.tsx`)

Le nettoyage se lance désormais automatiquement 5 secondes après le chargement de l'application.

## 4. Réduction de la Dette Technique

### Styles CSS (Tailwind Priority)

- Dans `TabletHub.tsx`, les styles inline complexes pour l'animation vocale et les barres de vie ont été déplacés vers `index.css` via des variables CSS (`--voice-scale`, `--hp-progress`).

### Typage TypeScript (Audit Zéro Any)

- Refactoring des casts `any` dans `MediaCleanupService.ts` et `StoryboardDashboard.tsx`.
- Utilisation de l'interface `AppBridge` globale.

---

*Archivé le 2026-03-21 dans docs/history/*
