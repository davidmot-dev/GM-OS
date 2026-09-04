# Plan d'Implémentation : Dice-OS v5

Migration du module de lancer de dés vers l'architecture GM-OS v5 (React, TypeScript, Zustand, Tailwind).

## Objectifs

- Refondre la logique de calcul dans un `DiceEngine` TypeScript robuste et découplé.
- Créer une interface utilisateur moderne et performante avec Tailwind CSS.
- Intégrer la gestion d'état avec Zustand.
- Maintenir la compatibilité avec toutes les fonctionnalités v3 (Quick Rolls, Batching, Modes spéciaux).

## Changements Proposés

### Coeur du Module (Logic)

#### [MODIFY] [DiceEngine.ts](../../src/modules/dice/DiceEngine.ts)

- Implémenter les interfaces `IRollResult`, `IDiceRoll`, `IQuickRoll`.
- Porter la logique de calcul (Std, Pool, YZE, Rolemaster, etc.) dans des fonctions pures et testables.
- Ajouter le support pour les dés multi-digit (d66, etc.).

#### [NEW] [useDiceStore.ts](../../src/stores/useDiceStore.ts)

- Créer un store Zustand pour l'historique et les Quick Rolls.
- Gérer la persistance via `appBridge` (Bridge vers le système de fichiers).

### Interface Utilisateur (Renderer)

#### [NEW] `file:///c:/Users/david/OneDrive/Jeux de Rôles/GM-OS-v5/src/components/modules/dice/DiceModule.tsx` *(ce fichier n'existe plus)*

- Composant principal du module.
- Grille de boutons dynamique selon le mode.
- Panneau de configuration avec Tailwind (Glassmorphism).

#### [NEW] `file:///c:/Users/david/OneDrive/Jeux de Rôles/GM-OS-v5/src/components/modules/dice/RollCard.tsx` *(ce fichier n'existe plus)*

- Composant pour l'affichage d'un résultat individuel.
- Gestion des animations d'entrée.

---

## Plan de Vérification

### Tests Automatisés

- **Vitest** : Créer `DiceEngine.test.ts` pour valider chaque moteur de calcul :
  - Test de la somme simple.
  - Test du système de Pool (comptage de succès et échecs).
  - Test de Rolemaster (exploding dice).
  - Test de YZE (Banes et succès).
  - Test du parseur de formules.

### Vérification Manuelle

- Tester le changement de mode dans l'UI et vérifier que les champs de saisie s'adaptent.
- Lancer une série de 10 jets (Batch) et vérifier le regroupement visuel.
- Ajouter et supprimer un Quick Roll.
- Vérifier la persistance après un rechargement de l'application.
