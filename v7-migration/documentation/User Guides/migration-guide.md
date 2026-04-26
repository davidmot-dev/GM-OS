# Guide de Migration GM-OS v5

Ce projet constitue la refonte majeure de GM-OS vers une architecture moderne, robuste et performante.

## 📐 Architecture & Système

### Le "Bridge" (appBridge)

Pour garantir la portabilité entre **Electron** et **Tauri**, toute interaction avec le système (fichiers, audio, MIDI) est isolée dans un "pont".

- **Interdit :** Import direct de `electron` ou `fs` dans le dossier `src/renderer`.
- **Autorisé :** Utilisation exclusive de `window.appBridge.maFonction()`.

### TypeScript Strict

Le projet utilise TypeScript en mode strict.

- Aucun type `any`.
- Interfaces obligatoires pour toutes les entités métier (Tracks, NPCs, Scenarios).

## 📸 Nouveau Système : Session Snapshots

La v5 introduit les **Snapshots de Session**, permettant de capturer l'état complet de l'OS à un instant T.

- **Persistance :** Capturé dans `useSessionOSStore`.
- **Portée :** Inclut Musique, Ambiance, Sons, Lumières, Images et **Combat OS**.
- **Restauration :** Chaque store de module doit implémenter une action `applySnapshot(data)`.

## ⚔️ Combat OS & Narration

Le module de combat est désormais lié à la narration globale.

- **Export Chronologie :** Les résumés de combat sont automatiquement insérés dans la session active.
- **Synchronisation Hub :** L'état du combat (initiative) est projeté en temps réel vers le Player Hub.

## 🎨 Design & UI

### Écosystème

- **Vite.js** : Pour un développement ultra-rapide.
- **Tailwind CSS** : Pour un styling cohérente et performant.
- **Stitch / Figma** : Les composants React sont générés prioritairement via Stitch.

### Thème

Les couleurs et espacements utilisent des variables CSS (`--bg-primary`, etc.) définies dans `index.css` pour une harmonisation globale.

## 🧪 Tests Automatisés

- **Vitest** : Moteur de test principal.
- **Classes de Test** : La logique métier doit être encapsulée dans des classes testables (Managers, Services).
- **Mocks** : Les API système (`appBridge`) et matérielles (Web Audio) doivent être simulées dans les tests unitaires.

---
*Dernière mise à jour : 10/03/2026*
