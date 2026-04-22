# 📑 Documentation Technique : Module Indices (Clues) - v5.2

## 📝 Vue d'Ensemble
Le module **Indices** est un système transverse de gestion de preuves et de secrets. Il permet une interconnexion fluide entre les entités du monde (PNJ, Lieux) et le journal narratif de la session.

---

## 🏗️ Architecture des Données

### Interface `Clue`
Définie dans `src/modules/session/store/types.ts` :
```typescript
export interface Clue {
  id: string;
  campaignId: string;
  title: string;
  content: string; // Description de l'indice
  mediaUrl?: string; // Image associée
  locationId?: string; // ID du lieu (Atlas)
  ownerId?: string; // ID du PNJ (NPC Gallery)
  isRevealed: boolean; // État de visibilité pour les joueurs
  revealedAt?: number; // Timestamp de la première révélation
  campaignMoment?: string; // Contexte narratif (ex: "Acte I, Scène 3")
}
```

### Store Zanzibar (`chronicleSlice.ts`)
Le store gère le CRUD des indices via les actions :
- `addClue`: Ajout d'un nouveau fragment.
- `updateClue`: Mise à jour (incluant le déclenchement de la révélation).
- `deleteClue`: Suppression définitive.

---

## 🔄 Flux d'Intégration

### 1. Journal-OS (Logging Narratif)
Lorsqu'un indice passe de `isRevealed: false` à `isRevealed: true` dans `handleSave` de `CluesManager.tsx` :
1. Capture du `revealedAt` (Date.now()).
2. Injection d'un événement `NOTE` dans le `useJournalStore`.
3. Formatage automatique : `🔎 Indice Révélé : [Titre]`.

### 2. TabletHub (Player View)
La TabletHub filtre les indices par `isRevealed: true` pour assurer qu'aucun secret n'est fuité accidentellement. L'affichage inclut le `campaignMoment` pour aider les joueurs à se situer chronologiquement.

### 3. Session Deck (Cockpit MJ)
Un moteur de rendu léger dans le cockpit permet au MJ de faire défiler les indices comme un deck de cartes. Le bouton de projection utilise `ImageStore.projectEntity` pour envoyer l'indice sur le Player Hub.

---

## 🛠️ Composants Clés
- **CluesManager** : Éditeur centralisé.
- **SessionClueDeck** : Widget cockpit horizontal.
- **NPC/Atlas Details** : Points d'entrée contextuels affichant les indices liés par ID.

---
*Auteur : Antigravity IA*
*Date : 27 Mars 2026*
