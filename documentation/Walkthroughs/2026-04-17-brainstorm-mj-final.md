# Walkthrough - Brainstorm MJ (Forge de Règles)

Ce walkthrough documente la finalisation du module **Brainstorm MJ**, permettant d'extraire et de formaliser des règles de JDR directement depuis des carnets NotebookLM.

## 🚀 Fonctionnalités Implémentées

### 1. Store de Gestion de Flux (`useBrainstormStore.ts`)
Un store Zustand centralise l'état de la forge :
- **États** : `idle` -> `discovery` -> `listing` -> `forging` -> `completed`.
- **Gestion des erreurs** : Capture et affichage des ruptures de liaison MCP.
- **Cycle de vie** : Réinitialisation propre et navigation entre la liste et la fiche finale.

### 2. Service de Forge (`ForgeService.ts`)
Extension du service existant pour inclure :
- `discoverCandidates` : Interroge NotebookLM pour lister 5-8 points d'intérêt (règles, scénarios).
- `forgeCard` : Génère une fiche Markdown structurée à partir d'un candidat.
- **Robustesse** : Gestion automatique de l'expiration des sessions NotebookLM (silent refresh).

### 3. Interface Premium (`BrainstormOverlay.tsx`)
Une interface immersive suivant les standards GM-OS v5 :
- **Design** : Glassmorphism, flous d'arrière-plan, animations d'entrée/sortie.
- **Expérience Utilisateur** : Feedback visuel durant l'analyse, prévisualisation Markdown de la fiche forgée.
- **Réactivité** : Adapté aux thèmes sombres et aux hautes résolutions.

### 4. Intégration & Persistance
- **Déclencheur** : Bouton "Brainstorm MJ" ajouté dans le navigateur de Notebooks.
- **Persistance RAG** : Utilisation du nouveau bridge `window.appBridge.ai.writeDoc` pour enregistrer les fichiers dans `docs/systems/`.
- **Réindexation** : Le moteur RAG détecte et indexe immédiatement la nouvelle règle.

## 🛠️ Vérification Technique

- [x] **Store Zustand** : Les transitions d'états sont fluides.
- [x] **MCP Bridge** : Les appels `notebook_query` fonctionnent avec extraction JSON propre.
- [x] **Sécurité** : `ai:write-doc` vérifie que le chemin est confiné au répertoire `docs/`.
- [x] **UI** : L'overlay est bien monté globalement dans `App.tsx` et accessible via le dashboard.

## 📸 Aperçu du Flux
1. L'utilisateur ouvre le navigateur de Notebooks.
2. Sélectionne un carnet et clique sur **"Brainstorm MJ"**.
3. L'overlay analyse le carnet et propose une liste de candidats.
4. L'utilisateur choisit un candidat (ex: "Règle de Fatigue").
5. La fiche est forgée, affichée, et sauvegardée automatiquement dans le système de jeu actif.
