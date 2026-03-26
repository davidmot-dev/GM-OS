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

## 4. Typage Strict (TypeScript)

- **Règle :** Aucun `any`.
- **Interfaces :** Chaque entité (Pad, Deck, NPC) doit avoir une interface stricte.
- **Persistence :** Ne pas stocker d'objets complexes (AudioBuffer, HTMLMediaElement) dans l'état global, seulement des IDs, chemins ou métadonnées.

## 5. Tests Automatisés & Robustesse

- **Framework :** Utiliser **Vitest** pour tous les tests unitaires et d'intégration.
- **Classes de Test :** Encapsuler la logique métier dans des classes ou services testables indépendamment de l'UI.
- **Mocking :** Simuler systématiquement les accès matériels (AudioContext, MIDI) et les appels au `appBridge` dans les tests.
- **Couverture :** Chaque nouvelle fonctionnalité logique (ex: calcul de dégâts, gestion de playlist) doit être accompagnée d'un fichier `.test.ts`.

## 6. Gestion d'État

- **Règle :** Utiliser Zustand ou le Context API pour les données globales partagées (ex: Settings, Session).
- **Synchronisation :** L'UI doit être une fonction pure de l'état global.
