# 📑 Spécification Technique : Architecture Modulaire de Session-OS

Ce document décrit l'architecture standard du module `Session-OS` après la refonte du 27 Mars 2026. Cette structure doit servir de modèle pour tous les autres OS du projet.

## 1. Gestion d'État (Store Zustand)

### Slicing Pattern
Le store est divisé en "tranches" (Slices) isolées par domaine métier. Chaque slice gère son propre état et ses actions.

- **Localisation** : `src/modules/session/store/`
- **Types** : `store/types.ts` centralise toutes les interfaces pour éviter les imports circulaires.
- **Assemblage** : `store/index.ts` utilise la fonction `create()` de Zustand pour combiner les slices.

### Configuration du Store
- **Persistance** : Utilise le middleware `persist` avec la clé `gmos-v5-session-os-storage`.
- **Migration** : Gérée via la propriété `version` (actuelle : 10). Toute modification structurelle de l'état persistant DOIT incrémenter cette version.
- **Actions Cross-Domain** : Les fonctions nécessitant de modifier plusieurs slices (ex: `launchSession`) sont définies dans `store/index.ts`.

## 2. Architecture de l'Interface (UI)

### Registry Pattern
Le rendu des vues est délégué à un registre centralisé.

- **SessionHeader.tsx** : Composant de navigation fixe.
- **SessionViewRegistry.tsx** : Mappe l'état `currentView` vers le composant React correspondant. Gère les deux types de layout :
    1. **Full Layout** : Le composant occupe les 12 colonnes de la grille.
    2. **Split Layout** : Affiche le `CampaignCockpit` (3 cols) et le contenu (9 cols).

## 3. Standards de Code

- **Typage** : Aucun usage de `any`. Utiliser les interfaces de `types.ts`.
- **Logique Métier** : Doit être extraite dans des services ou interpréteurs (`logic/HealthInterpreter.ts`) pour être testable indépendamment de React.
- **Notifications** : Utiliser exclusivement `gmToast(message, type)` pour les feedbacks utilisateur.

## 4. AI Forge & Performance

### Proxy IA (Electron Main)
Les requêtes vers l'API Gemini transitent par un tunnel IPC sécurisé dans le processus principal d'Electron (`main.ts`).
- **Timeout** : Fixé à **300 secondes (5 minutes)** pour permettre l'analyse de documents PDF volumineux.
- **Payload Logging** : Les services (`ChronicleService`, `ForgeService`) loggent systématiquement la taille du payload envoyé en MB pour le monitoring de charge.

### Système d'Indices (Clues)
Le système d'indices est transverse et utilise :
- **Persistence** : Stocké dans le `Campaign` via le `chronicleSlice`.
- **Navigation** : Utilise le `uiSlice` pour la navigation contextuelle ("Cross-Linking") entre les entités et l'éditeur de campagne.

---
*Dernière mise à jour : 27 Mars 2026 - GM-OS v5 Technical Audit.*
