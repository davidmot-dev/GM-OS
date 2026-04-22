# 🔍 Clues-OS : Système de Gestion des Indices

## 📌 Présentation
`Clues-OS` est un sous-module de `Session-OS` permettant aux MJ de créer, gérer et révéler des indices narratifs durant une session. Le système assure la traçabilité des découvertes et leur intégration automatique dans le journal de bord.

## 🏗️ Architecture du Store (`CluesSlice`)

Le store est intégré au `SessionOSStore` et gère un tableau d'objets `Clue`.

### Schéma de données (`Clue`) :
```typescript
interface Clue {
    id: string;
    campaignId: string;
    title: string;
    content: string;
    locationId?: string; // Liaison avec Atlas-OS
    ownerId?: string;    // Liaison avec NPC-OS
    isRevealed: boolean;
    revealedAt?: number; // Timestamp technique
    campaignMoment?: string; // Timestamp narratif (ex: "An 402, Automne")
}
```

## 🚀 Fonctionnalités Clés

### 1. Révélation Narrative
Lorsqu'un indice passe de `isRevealed: false` à `true` :
- Un timestamp `revealedAt` est généré.
- Un événement est automatiquement injecté dans le **Journal-OS** via un pont inter-store.

### 2. Intégration Journal-OS
Le `CluesManager` surveille les changements d'état. Toute révélation déclenche :
```typescript
useJournalStore.getState().addEvent({
    type: 'NOTE',
    title: `Indice Révélé : ${clue.title}`,
    content: clue.content,
});
```

### 3. Cockpit Widget (`SessionClueDeck`)
Un widget compact dans le Master Cockpit permet :
- De visualiser les indices liés à la localisation actuelle.
- De révéler/masquer rapidement un indice d'un clic.
- De projeter l'indice sur le Player Hub (via le système de projection global).

## 🎨 Interface Utilisateur
- **CluesManager** : Vue complète de style "Obsidian" pour l'édition et le tri des indices.
- **SessionClueDeck** : Deck de cartes interactives (Glassmorphism) pour un accès rapide en jeu.

## 🛠️ Maintenance & Debug
- Les indices sont persistés dans le `localStorage` via Zustand Persist (clé `gmos-v5-session-os-storage`).
- En cas de désynchronisation avec le journal, un bouton de "Re-sync" manuel peut être envisagé dans les versions futures.
