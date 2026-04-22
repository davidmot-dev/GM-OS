# Standard Technique : Build & Typage v6

Ce document définit les règles de typage et de configuration TypeScript nécessaires pour maintenir la stabilité de GM-OS v6.

## ⚙️ Configuration du Compilateur

Depuis la v6.1.0-dev, le projet utilise une configuration TS plus stricte pour optimiser la sortie ESM :

- **`verbatimModuleSyntax`** : Activé.
  - **Règle** : Les imports utilisés uniquement pour le typage DOIVENT être préfixés par `type`.
  - **Exemple** : `import type { GameDriver } from './types';`
- **`isolatedModules`** : Activé. Garantit que chaque fichier peut être transpilé indépendamment.

## 🏗️ Interfaces de Domaine Fondamentales

### GameDriver
L'interface `GameDriver` est le contrat entre le système de JdR et GM-OS.
Chaque driver doit comporter :
- `dice`: Configuration complète (defaultDice, logic).
- `combat`: Mapping des stats et formule d'initiative.
- `aiInstructions`: Instructions système pour l'Oracle.

### Player & PC
Les objets Joueurs et Personnages ont été renforcés :
- `avatarUrl` (Player) et `portraitUrl` (Character) sont **obligatoires**.
- Lors de la création de mocks pour les tests Vitest, ces propriétés ne doivent jamais être omises pour éviter les erreurs de type-guard dans l'UI.

## 🧪 Testing & Mocks

Le fichier `inventoryTransfer.test.ts` sert de référence pour la création d'entités valides.
**Règle d'or** : Ne pas utiliser de cast `as any` dans les tests si une interface peut être satisfaite par un objet partiel bien documenté.

## 🛠️ Maintenance du Build

Si le serveur de développement (Vite) ne reflète pas vos changements UI :
1. Lancez `npm run build` ou `tsc` manuellement.
2. Recherchez les erreurs dans des fichiers **non-ouverts**. Une erreur de type dans un module distant peut bloquer l'arbre de dépendances de Vite.
