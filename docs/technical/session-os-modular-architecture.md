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

## 5. Hub Synchronization Engine (Nexus Bridge)

### Deep Sync Protocol
La synchronisation entre le Cockpit MJ et le Tablet Hub utilise un pont WebSocket bidirectionnel.
- **Broadcast Sélectif** : Le MJ n'envoie que les données nécessaires à la session active.
- **Forge Sync** : Depuis la v5.11, le payload inclut les `customSheetTemplates` et `customGameDrivers`. Cela garantit que la tablette peut effectuer des calculs de règles et un rendu d'UI identique au MJ sans accès direct à la base de données locale.

### Template Resolution Logic
La résolution de la fiche de personnage (`logic/templateResolver.ts`) suit une hiérarchie stricte pour garantir la cohérence visuelle :
1. **Template Spécifique** : Si `character.templateId` est défini et valide.
2. **Template Système** : Recherche un template correspondant au `gameSystem` de la campagne.
3. **Template Générique** : Fallback sur le template par défaut de Session-OS.

---
*Dernière mise à jour : 28 Mars 2026 - GM-OS v5 Technical Audit (Deep Sync Engine & Hub Interactive).*
