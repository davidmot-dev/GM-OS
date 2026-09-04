# 🗄️ Archive — la refonte v5, telle qu'elle était pensée en mars 2026

> **Archivé le 2026-09-04, au terme de la revue des guides.** Ce document vivait dans
> `User Guides/` sous le nom *migration-guide*, et ce n'était pas sa place : il ne s'adresse pas à
> un meneur mais à qui écrit le code. Aucun de ses paragraphes ne décrit un geste de table.
>
> **Il est conservé pour ce qu'il montre d'une intention**, pas comme une description du présent.
> Trois de ses affirmations ont vieilli :
>
> - la **portabilité Electron / Tauri** qu'il pose en principe fondateur — GM-OS tourne sous
>   Electron, et Tauri n'a jamais dépassé deux libellés et un contournement commenté ;
> - le **« aucun type `any` »** — il en reste des centaines, que le linteur signale sans bloquer ;
> - **Stitch / Figma** comme source des composants React, qui n'est plus la pratique.
>
> Ce qui fait autorité aujourd'hui : [les standards de code
> v6](../V6_Code_Standards.md) et [le standard AppBridge](../AppBridge_Architecture_Standard.md).

---

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
