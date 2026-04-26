# Documentation Technique : Deck-OS

Ce guide détaille les APIs, les structures de données et les services centraux du module **Deck-OS** de GM-OS v5.

## 📋 Types & Interfaces (`src/modules/session/store/types.ts`)

### `DeckManifest`
| Champ | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | ID unique du deck (ex: `drama-torg`). |
| `name` | `string` | Libellé affiché dans l'interface MJ. |
| `folderPath` | `string` | Chemin relatif vers `/public/assets/decks/`. |
| `cardCount` | `number` | Nombre total de cartes indexées. |
| `format` | `'poker' | 'tarot'` | Ration d'aspect (2:3 pour Poker, etc.). |
| `filenamePattern` | `string` | Pattern de nommage (ex: `card_{n}`). |

## 🧠 Gestion d'État (`deckSlice.ts`)

Le store `deckSlice` expose les actions suivantes :

- **`drawCard(deckId)`** : Calcule un index aléatoire parmi les `remainingIndices`, le déplace dans `discardedIndices`, et met à jour `currentCardIndex`.
- **`discardCard(deckId)`** : Envoie la carte actuelle en défausse sans en tirer une nouvelle.
- **`shuffleDeck(deckId)`** : Réinitialise la pioche en fusionnant `remainingIndices` et `discardedIndices`.

## 🔄 Flux de Projection

La projection utilise le service global `projectEntity()` de l'objet `useImageStore`.

### Middleware "Oracle"
Le système identifie les cartes comme des entités `Oracle`. Lors de la projection, un `entityId` unique est généré à chaque mise à jour pour forcer le rafraîchissement des Hubs via IPC :

```typescript
// Exemple de forçage de synchronisation
const uniqueProjectionId = `deck-pos-${Date.now()}`;
projectEntity({
  ...cardEntity,
  id: uniqueProjectionId,
  type: 'Oracle'
});
```

## 🧩 Composants Clés

### `DeckPlayer` (`DeckPlayer.tsx`)
Interface de contrôle du MJ. Il écoute l'état du store via `useDeckPlayer` et permet de piocher, mélanger et projeter les cartes. Il gère l'animation de translation/transformation des cartes.

### `DeckLibrary` (`DeckLibrary.tsx`)
Permet au MJ de configurer les decks disponibles, d'ajuster les chemins de fichiers et de lier les decks aux drivers de jeu via `useDeckLibrary`.

## 🛠️ Services & Hooks

### `useDeckLibrary()`
Custom Hook gérant la bibliothèque de paquets (CRUD).
- **Actions** : `addDeck`, `updateDeck`, `deleteDeck`.
- **État** : Gère l'état local du formulaire d'édition et le filtrage par système (`generic` + système de la campagne active).

### `useDeckPlayer()`
Custom Hook pilotant l'interface de jeu pour un deck spécifique.
- **Actions** : `handleDraw`, `handleDiscard`, `handleShuffle`, `handleFlip`.
- **Projection Hub** : Synchronise automatiquement l'état de la carte (recto/verso) avec le `projectEntity` de l'UI globale.

### `DeckInterpreter` (`logic/DeckInterpreter.ts`)
Service utilitaire centralisant la logique de nommage des fichiers.
- **Conventions par défaut** : Extension `.png`, pattern de nommage `card_{n}`.
- **Méthodes** : `getCardImageUrl`, `getBackImageUrl`, `calculateAspectRatio`.

---
*Dernière mise à jour : 31 Mars 2026 - GM-OS v5 Stability Patch (Modular Hooks).*
