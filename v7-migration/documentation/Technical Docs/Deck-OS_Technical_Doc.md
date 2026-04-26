# Documentation Technique : Deck-OS

Ce document fournit les détails techniques du module **Deck-OS** de GM-OS v5.

## 📋 Types & Interfaces (`src/modules/session/types/deck.ts`)

### `DeckManifest`
Structure définissant un paquet de cartes physique.

| Propriété | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | ID unique du deck. |
| `name` | `string` | Nom affiché. |
| `folderPath` | `string` | Chemin relatif vers `/public/assets/decks/`. |
| `cardCount` | `number` | Nombre total de cartes indexées. |
| `format` | `'poker' \| 'tarot'` | Ratio d'aspect. |
| `filenamePattern` | `string` | Pattern de nommage (ex: `card_{n}`). |

## 🧠 Gestion d'État (Zustand)

Le store `deckSlice` gère la pioche et la projection.

### Actions de Commande
- **`drawCard(deckId)`** : Algorithme de sélection aléatoire sans remise (Fisher-Yates simplifié via `remainingIndices`).
- **`shuffleDeck(deckId)`** : Réinitialisation complète de la pioche depuis la défausse.
- **`toggleProjection(deckId)`** : Point de bascule pour l'envoi vers les Hubs distants.

## 🔄 Flux de Projection & IPC

Le module Deck-OS utilise le service `projectEntity()` global. Pour les cartes, le type d'entité est forcé à `Oracle`.

### Forçage du Rafraîchissement (Flip Sync)
Lors d'un retournement de carte, un `projectionId` unique (timestamp) est injecté pour forcer l'IPC à propager la mise à jour, même si l'URL de l'image source est identique.

```typescript
// Exemple de signal de projection
const uniqueId = `oracle-${Date.now()}`;
projectEntity({
  id: uniqueId,
  type: 'Oracle',
  imageUrl: currentCardUrl,
  // ... autres props
});
```

## 🧩 Composants Principaux

### `DeckPlayer (DeckPlayer.tsx)`
Composant UI interactif pour le MJ. Gère les animations de pioche, de flip et les contrôles de projection.

### `RuleEngineEditor (RuleEngineEditor.tsx)`
Interface de configuration des decks (chemins, formats, patterns) pour les administrateurs/MJs.

## 🛠️ Services Internes

- **`useDeck(deckId)`** : Hook d'accès simplifié à l'état complet d'un deck.
- **`DeckInterpreter`** : Service de résolution d'images basé sur les index et les patterns de fichiers.
