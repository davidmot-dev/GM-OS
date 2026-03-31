# Blueprint : Système de Gestion de Paquets de Cartes (Deck-OS)

Ce document archive la spécification complète et le plan d'implémentation pour le module **Deck-OS** de GM-OS v5, conçu pour une gestion fluide et immersive des cartes de jeu (Drama Decks, Criticals, Loot, etc.).

## 📋 Résumé du Concept

Un moteur de tirage de cartes basé sur le système de fichiers, permettant au MJ de gérer plusieurs paquets de cartes physiques (images) sans surcharger la base de données média de l'application.

---

## 🏗️ Architecture Technique

### 1. Stockage & Convention (Filesystem)
Les cartes sont stockées directement dans le dossier `/public` pour un accès direct via URL :

```text
/public/assets/decks/
  └── [system_id]/          # Identifiant du Driver (ex: torg, dnd5e)
      └── [deck_id]/        # Identifiant du Deck (ex: drama-deck, loot)
          ├── back.png      # Image du dos de la carte
          ├── card_1.png    # Première carte (nomenclaturée par index)
          ├── card_2.png    # ...
          └── card_N.png    # N-ième carte
```

### 2. Modèle de Données (Store `deckSlice.ts`)

```typescript
type CardFormat = 'poker' | 'tarot';

interface DeckManifest {
    id: string;             // Identifiant unique (ex: "drama-torg")
    name: string;           // Nom affiché (ex: "Drama Deck")
    systemId: string;       // Liaison au GameDriver (ex: "torg")
    folderPath: string;     // Chemin relatif (ex: `assets/decks/torg/drama`)
    cardCount: number;      // Nombre total de cartes (N)
    format: 'poker' | 'tarot';
    orientation: 'portrait' | 'landscape';
    extension: string;      // (ex: `.jpg`, default: `.png`)
    filenamePattern: string; // (ex: `{n}`, default: `card_{n}`)
    startAtZero: boolean;   // (default: `false`)
    useDiscard: boolean;    // Si vrai, les cartes tirées vont en défausse
}
```

---

## 🚀 Fonctionnalités du Module

### 1. Gestion des Decks (useDeckLibrary)
- Interface pour déclarer un nouveau deck en pointant vers un dossier de `/public/assets/decks/`.
- Configuration du format (Poker/Tarot) et du mode de tirage (avec ou sans défausse).
- Liaison à un ou plusieurs Drivers.

### 2. Dashboard de Tirage (useDeckPlayer)
- **Pile de Pioche** : Affichage visuel du dos de la carte (`back.png`).
- **Piocher** : Tirage aléatoire d'un index parmi les restants.
- **Défausser** : Action manuelle pour écarter une carte sans en tirer une nouvelle.
- **Retourner (Flip)** : Permet de prévisualiser le verso ou de cacher la carte.
- **Reset (Mélanger)** : Réinitialisation complète du deck.

### 3. Interconnexions
- **Projection Hub (Seer's Eye)** : Intégration d'un bouton de projection en temps réel.
- **Mode Oracle (Clean View)** : Affichage sur les Hubs sans métadonnées pour l'immersion.
- **Accessibilité (A11y)** : Support complet de la navigation au clavier et des lecteurs d'écran.

---

## 📂 Emplacements des fichiers de référence
- **Composant Principal** : `src/modules/session/components/DeckPlayer.tsx`
- **Logic Hooks** : `src/modules/session/hooks/useDeckPlayer.ts`
- **Store Zustand** : `src/modules/session/store/deckSlice.ts`

---
*Dernière mise à jour : 31 Mars 2026*
*Statut : [COMPLETED] - Modélisation par Hooks & Accessibilité Validée.*
