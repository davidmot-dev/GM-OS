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

## 🎨 Design & UI

### Écosystème

- **Vite.js** : Pour un développement ultra-rapide.
- **Tailwind CSS** : Pour un styling cohérente et performant.
- **Stitch / Figma** : Les composants React sont générés prioritairement via Stitch.

### Thème

Les couleurs et espacements utilisent des variables CSS (`--bg-primary`, etc.) définies dans `index.css` pour une harmonisation globale.

## 🧪 Tests Automatisés

Le projet v5 impose une culture de la **robustesse**.

- **Vitest** : Moteur de test principal.
- **Classes de Test** : La logique métier doit être encapsulée dans des classes testables (Managers, Services).
- **Mocks** : Les API système (`appBridge`) et matérielles (Web Audio) doivent être simulées dans les tests unitaires.

## 🛣️ Chemin de Migration

1. **Extraction :** Lire le code v3, extraire la logique pure sans DOM.
2. **Implémentation :** Créer le service/classe TypeScript + Tests unitaires.
3. **UI :** Créer le composant React avec Tailwind (via Stitch).
4. **Binding :** Relier le composant au service via un Hook.

---
*Dernière mise à jour : 01/03/2026*
