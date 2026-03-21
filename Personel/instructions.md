---
trigger: always_on
glob: "**/*.{ts,tsx,js,jsx}"
description: "Règles de migration pour GM-OS v5 (React, TypeScript, Tailwind, Bridge-Agnostic, Testing)"
---

# 🛡️ GM-OS v5 : Guide de Migration & Standard de Code

Ce guide définit les règles obligatoires pour la refonte de GM-OS vers une architecture moderne.

## 1. Architecture "Bridge" (Prêt pour Tauri/Electron)

- **Règle :** Ne jamais importer `electron`, `fs` ou tout module Node.js dans `/src/renderer`.
- **Méthode :** Utiliser exclusivement l'objet global `window.appBridge`.
- **Pourquoi :** Permet de changer de moteur (Electron -> Tauri) en modifiant uniquement le preload/main, sans toucher au code UI.

## 2. Standard Visuel "Stitch & Tailwind"

- **Règle :** Priorité aux designs générés via Stitch.
- **Styling :** Utiliser exclusivement Tailwind CSS.
- **Thème :** Les couleurs et espacements doivent utiliser des variables CSS pour garantir la cohérence (ex: `bg-primary`, `text-accent`).

## 3. Protocole "Anti-Régression"

- **Analyse :** Avant de coder un module, l'agent doit lire le code JS v3 pour extraire la logique métier.
- **Découplage :** La logique (calculs, gestion audio) doit être dans des fichiers `.ts` séparés des composants React.
- **Hooks :** Encapsuler la logique complexe dans des Custom Hooks (ex: `useAudioEngine`, `useMidi`).

## 4. Typage Strict (TypeScript) - Exigence Zéro-Any

- **Règle d'Or :** L'usage de `any` est strictement interdit dans toute l'application.
- **Zéro Tolérance :** Tout nouveau code ou refonte doit utiliser des interfaces TypeScript explicites ou `unknown` (avec narrowing) si le type est réellement dynamique. Interdire `any` même pour les objets globaux (`window`).
- **Interfaces :** Chaque entité (Pad, Deck, NPC, Store) doit posséder une interface stricte et complète.
- **Persistence :** Ne pas stocker d'objets complexes (AudioBuffer, HTMLMediaElement) dans l'état global, seulement des IDs, chemins ou métadonnées.
- **CSS :** Zéro styles inline (`style={{...}}`). Utiliser exclusivement Tailwind ou des classes dans `index.css`.

## 5. Tests Automatisés & Robustesse

- **Framework :** Utiliser **Vitest** pour tous les tests unitaires et d'intégration.
- **Classes de Test :** Encapsuler la logique métier dans des classes ou services testables indépendamment de l'UI.
- **Mocking :** Simuler systématiquement les accès matériels (AudioContext, MIDI) et les appels au `appBridge` dans les tests.
- **Couverture :** Chaque nouvelle fonctionnalité logique (ex: calcul de dégâts, gestion de playlist) doit être accompagnée d'un fichier `.test.ts`.

## 6. Gestion d'État

- **Règle :** Utiliser Zustand ou le Context API pour les données globales partagées (ex: Settings, Session).
- **Synchronisation :** L'UI doit être une fonction pure de l'état global.

## 7. Maintenance Systématique de la Documentation

- **Règle d'Or :** Toute modification du code (nouvelle feature, refonte, correction d'architecture) DOIT s'accompagner d'une mise à jour de la documentation associée (README, User Guides, Architecture Docs).
- **Contenu Obligatoire :**
  - **README.md :** Doit refléter l'état actuel des modules et des fonctionnalités majeures.
  - **Roadmap & Plans (CRITIQUE) :** Mettre à jour systématiquement `Development_Roadmap.md` et `Plans/amélioration.md` après chaque itération. Veiller à la cohérence entre le Backlog (à vider) et les Jalons Atteints (à remplir).
  - **User Guides :** Mettre à jour les procédures pour l'utilisateur final.
  - **Documentation Technique :** Documenter les nouveaux services (`docs/technical/`).
  - **Architecture :** Mettre à jour les diagrammes ou descriptions de flux dans `docs/architecture/`.
  - **Lessons Learned :** Consigner les défis techniques et solutions trouvées dans `docs/lessons-learned.md`.
- **Historique des Walkthroughs :** Sauvegarder systématiquement chaque `walkthrough.md` finalisé dans `docs/history/` avec un nom descriptif (ex: `2026-03-21-media-cleanup-v1.md`).
- **Lieu Unique :** Centraliser toute la documentation dans le dossier `docs/` du projet.

## 8. Consultation de la Documentation Technique

- **Règle Impérative :** Avant de commencer tout nouveau développement ou refonte, l'agent doit impérativement lire l'intégralité de la documentation technique existante liée au module concerné (ex: `documentation/Technical Docs/`).
- **Prise en Compte :** Toutes les remarques, contraintes architecturales et leçons apprises (`Lessons_Learned.md`) documentées doivent être prises en compte et respectées scrupuleusement dans la nouvelle implémentation.
