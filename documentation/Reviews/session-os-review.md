# 🔍 Revue de Code : Module Session-OS (v6)

Ce document centralise les observations techniques et les recommandations pour le module `session`.

## 🏗️ Architecture & Standards

### 🌉 Bridge Standard (Tauri/Electron)
- **Statut** : ✅ CONFORME.
- **Observation** : Aucun import de `fs`, `electron` ou `path` détecté dans les composants. Les accès aux fichiers passent bien par les stores ou services dédiés.

### 🎨 Styling (Tailwind & CSS)
- **Statut** : ⚠️ ATTENTION.
- **Observations** : 
    - Présence de nombreux styles inline (`style={{ ... }}`) pour des calculs de pourcentages ou de couleurs dynamiques.
    - **Recommandation** : Utiliser des variables CSS injectées via un seul attribut `style` à la racine du composant, ou passer par des classes utilitaires dynamiques si possible.
    - Utilisation intensive de `bg-app-bg/40`. Vérifier si des tokens de transparence ne devraient pas être standardisés dans `index.css`.

## 🧠 Gestion d'État (Zustand)

### 📦 Root Store Assembler (`store/index.ts`)
- **Problème** : Le fichier fait 700+ lignes, dont 150 lignes de **Mock Data** (`INITIAL_DATA`).
- **Recommandation** : Extraire `INITIAL_DATA` dans `src/modules/session/store/initialData.ts`.
- **Observation** : Les "Cross-domain Overrides" (ex: `deleteCampaign`) sont bien centralisés ici, ce qui est une excellente pratique pour l'intégrité inter-modules.

## 🧩 Composants & Logique

### 📄 `NpcDetail.tsx` (Composant Critique)
- **Problème** : **Monolithe de 493 lignes.**
- **Détails** : 
    - Contient 7 sous-composants de formulaire (`FieldGauge`, `FieldNumber`, etc.).
    - Mélange de logique UI, d'appels à l'IA (`generateEntityPortrait`) et d'interactions avec d'autres stores (`addToken`, `addCombatant`).
- **Recommandations** :
    1. **Extraction des Champs** : Déplacer les `FieldXXX` dans `src/modules/session/components/fields/` pour réutilisation dans `CharacterSheetEditor.tsx`.
    2. **Hook de Logique** : Créer `src/modules/session/hooks/useNpcActions.ts` pour encapsuler les interactions transverses (Placement sur carte, Ajout au combat, Projection).

### 🛠️ `TemplateManager.tsx` & `SheetTemplateEditor.tsx`
- **Observation** : Logique de gestion de templates très riche.
- **Recommandation** : S'assurer que le rendu des champs utilise les mêmes composants atomiques que `NpcDetail`.

## 🧪 Tests & Robustesse
- **Statut** : ⚠️ INSUFFISANT.
- **Observation** : Peu de fichiers `.test.ts` visibles pour la logique complexe (hors `ObsidianExportService`).
- **Recommandation** : Ajouter des tests unitaires pour le `templateResolver.ts` et les slices de store (notamment `entitySlice` et les cascades de suppression).

---

## 🚀 Actions Prioritaires (Backlog v6.0)

1. [ ] **Nettoyage du Store** : Extraire `INITIAL_DATA`.
2. [ ] **Modularisation UI** : Extraire les composants `fields` de `NpcDetail`.
3. [ ] **Encapsulation Logique** : Créer le hook `useNpcActions`.
4. [ ] **Couverture de Tests** : Créer `src/modules/session/store/__tests__/cascadeDeletion.test.ts`.
