# 🔱 Blueprint : Refonte Architecturale de Session-OS

Ce document détaille la stratégie de modernisation du module `Session-OS`, visant à décomposer le store monolithique et à simplifier le dashboard.

## 🎙️ Équipe de Conception (BMAD)

- **Winston (Architecte)** : Expert en Slicing Pattern & Zustand.
- **Sally (UX/Structure)** : Experte en Registry Pattern & Routing UI.
- **Carson (Performance)** : Expert en Sélecteurs Atomiques & Shallow Equality.

---

## 🛡️ Protocole de Fiabilité (Approche Chirurgicale)

Pour garantir une stabilité totale de GM-OS v5 durant cette refonte, l'équipe applique un protocole d'intervention chirurgicale :

1. **Extraction Incrémentale (Zéro "Big Bang")** : On ne traite qu'une seule "tranche" (Slice) à la fois. Le reste du store monolithique continue de fonctionner normalement durant l'extraction d'un domaine précis.
2. **Points de Restauration Systématiques** : Avant chaque intervention sur un nouveau Slice, un point de sauvegarde Git (`git commit`) est créé. En cas de comportement inattendu, le retour à l'état stable est immédiat.
3. **Isolation Logique (Modèle Interpréteur)** : Extraction systématique de la logique métier dans des fichiers pur-JS (style `HealthInterpreter.ts`).
4. **Validation de Continuité** : Entre chaque Slice extrait, nous vérifions que les composants critiques consomment toujours les données sans erreur.

---

## 🏗️ Phase 1 : Slicing du Store (`useSessionOSStore.ts`)

L'objectif est de diviser le fichier actuel de 90 Ko en **7 Slices thématiques** regroupés dans `src/modules/session/store/`.

### Découpage proposé :

1. **`campaignSlice.ts`** : Gestion de l'identité et du layout des campagnes.
2. **`sessionSlice.ts`** : Gestion des sessions, checklists et snapshots système.
3. **`entitySlice.ts`** : PJ, PNJ, Monstres et système de santé modulaire.
4. **`atlasSlice.ts`** : Cartographie, points d'intérêt et liens géographiques.
5. **`chronicleSlice.ts`** : Wiki, Timeline et futur système d'indices (Clues).
6. **`forgeSlice.ts`** : Moteur de règles, templates de fiches et drivers IA.
7. **`uiSlice.ts`** : Navigation (vues), historique des dés et états UI temporaires.

---

## 🏛️ Phase 2 : Refonte du Dashboard (`SessionDashboard.tsx`)

L'objectif est de supprimer la complexité des ternaires imbriqués pour un système modulaire.

### Stratégie Sally :

- **Registry Pattern** : Création d'un fichier `SessionViewRegistry.ts` qui mappe chaque vue à son composant.
- **Découplage** : Extraction du Header dans `SessionHeader.tsx`.
- **Sélecteurs Fins** : Le Dashboard n'écoutera plus que `currentView` pour éviter les re-rendus globaux.

---

## 🎨 Phase 3 : Expérience Utilisateur & Design System (Sally)

L'objectif est d'élever GM-OS v5 vers un standard "Premium" en améliorant la fluidité et l'immersion.

### 1. Architecture du Mouvement

- **Transitions de Vues** : Utilisation systématique de transitions CSS (opacity/transform) lors du basculement entre les modules Atlas, NPC Gallery et Cockpit.
- **Feedback Immédiat** : Micro-animations lors des changements d'état (ex: baisse de PV, activation de l'Oracle IA).

### 2. HUD Fixe & Cockpit Persistant

- **Ancrage Visuel** : Le Header et les utilitaires de dés restent fixes. Seul le "Cœur" (main content) est dynamique.
- **Oracle IA** : Intégration fluide de l'Oracle dans une fenêtre "Glass" qui ne masque pas les informations vitales.

### 3. Esthétique Premium (Design Tokens)

- **Glassmorphism** : Usage généralisé du `backdrop-blur-md` et de `bg-opacity-XX` pour donner une sensation de profondeur et de technologie de pointe.
- **Hiérarchie Typographique** : Utilisation stricte des variables CSS pour les titres, labels et descriptions afin de garantir une lisibilité optimale en session nocturne (Dark Mode).

---

## 🛡️ Analyse des Risques & Mitigation (Carson)

| Risque | Description | Mitigation (Carson) |
| :--- | :--- | :--- |
| **Instabilité Référentielle** | Les sélecteurs retournant des objets créent des cycles de rendu. | Usage systématique de `shallow` (Zustand). |
| **Rupture des Effets** | Les `useEffect` perdent leurs dépendances lors du découpage. | Audit préalable des dépendances des composants critiques. |
| **Perte de Données** | Corruption du `localStorage` lors de la migration. | Conservation de la clé `gmos-v5-session-os-storage` et du format JSON. |

---

## 📋 Prochaines Étapes

- [ ] Création du dossier structurel `src/modules/session/store/`.
- [ ] Extraction des types vers `store/types.ts`.
- [ ] Implémentation itérative des slices (un par un).
- [ ] Assemblage final dans `useSessionOSStore.ts`.
- [ ] Refonte du Dashboard vers le nouveau registre.

Modèle de sélecteur recommandé (Winston) :

```typescript
const { view, campaignId } = useSessionOSStore(
  state => ({ view: state.currentView, campaignId: state.activeCampaignId }),
  shallow
);
```

*Blueprint finalisé le 26 Mars 2026 - GM-OS v5 Architectural Audit.*
