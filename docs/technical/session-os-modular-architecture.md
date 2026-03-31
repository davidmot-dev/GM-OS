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

- **Broadcast Sélectif (Campagne & Visibilité)** : Le MJ n'envoie que les données nécessaires à la session active (`activeCampaignId`). De plus, pour les entités (PNJ, Monstres, Alliés), un second filtre `isVisibleByPlayers === true` garantit que seuls les éléments révélés sont transmis au Tablet Hub.
- **Forge Sync** : Depuis la v5.11, le payload inclut les `customSheetTemplates` et `customGameDrivers`. Cela garantit que la tablette peut effectuer des calculs de règles et un rendu d'UI identique au MJ sans accès direct à la base de données locale.
- **Trombinoscope Interface** : Le Tablet Hub consomme le flux filtré d'entités pour générer une galerie de reconnaissance en temps réel, synchronisée avec les actions de visibilité du MJ.

### Template Resolution Logic

La résolution de la fiche de personnage (`logic/templateResolver.ts`) suit une hiérarchie stricte pour garantir la cohérence visuelle :

1. **Template Spécifique** : Si `character.templateId` est défini et valide.
2. **Template Système** : Recherche un template correspondant au `gameSystem` de la campagne.
3. **Template Générique** : Fallback sur le template par défaut de Session-OS.

## 6. Gouvernance des Données & Isolation (Scope-by-Active)

### Principe d'Herméticité

Pour éviter toute fuite de données entre projets ("Data Leakage"), Session-OS impose un filtrage strict à la source de l'UI.

- **activeCampaignId** : Chaque requête d'affichage (indices, PNJs, cartes) doit inclure une clause `campaignId === activeCampaignId`.
- **Composants Critiques** : `SessionClueDeck.tsx` (Deck MJ) et `OraclePanel.tsx` (Contexte IA) sont les gardiens de cette isolation.

## 7. Résolution Médias & Proxy Distant

### Protocole de Résolution Temps-Réel

La gestion des IDs `m-xxx` (Blob IDs stockés en local) nécessite une couche d'abstraction pour les clients distants.

- **Broadcast Resolution** : Avant l'envoi du signal `sync`, le MJ résout tous les médias en URLs absolues pointant vers son serveur local (`http://[IP]:3001/temp/[ID]`).
- **Hub Failsafe** : Le hook `useMediaUrl` sur les tablettes redirige automatiquement vers l'IP du MJ si un identifiant non résolu est détecté dans le store synchronisé.

## 8. Standards d'Accessibilité (A11y) & Qualité

### Protocoles UI
Tous les composants de `Session-OS` doivent respecter les standards d'accessibilité WCAG (Niveau AA) :
- **ID & Labeling** : Utilisation stricte de `htmlFor` sur les labels et `id` uniques sur les inputs.
- **Rôle Sémantique** : Conversion des `div` cliquables en `button type="button"` pour assurer la navigabilité au clavier.
- **Feedback d'État** : Utilisation de `aria-checked` (chaîne "true"/"false") pour les éléments personnalisés.

### Modularité par Hooks
La logique métier complexe ne doit jamais résider dans le composant UI. Elle doit être extraite dans un custom hook spécialisé (ex: `useDeckPlayer`) et validée via des tests unitaires **Vitest**.

---
*Dernière mise à jour : 31 Mars 2026 - GM-OS v5 Stability Patch (Modular Hooks & A11y Standard).*
