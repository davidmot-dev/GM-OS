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

### 2. Modèle de Données (Store `useSessionOSStore.ts`)
```typescript
type CardFormat = 'poker' | 'tarot';

interface DeckManifest {
    id: string;             // Identifiant unique (ex: "drama-torg")
    name: string;           // Nom affiché (ex: "Drama Deck")
    systemId: string;       // Liaison au GameDriver (ex: "torg")
    folderPath: string;     // Chemin : "torg/drama-deck"
    cardCount: number;      // Nombre total de cartes (N)
    format: CardFormat;     // Ratio d'aspect (Poker=2.5/3.5, Tarot=2.75/4.75)
    useDiscard: boolean;    // Si vrai, les cartes tirées vont en défausse
}

interface DeckSessionState {
    deckId: string;
    remainingIndices: number[]; // Tableau des cartes restantes [1..N]
    discardedIndices: number[]; // Tableau des cartes en défausse
    currentCardIndex: number | null; // Carte actuellement face visible
}
```

---

## 🚀 Fonctionnalités du Module

### 1. Gestion des Decks (GM Editor)
- Interface pour déclarer un nouveau deck en pointant vers un dossier de `/public/assets/decks/`.
- Configuration du format (Poker/Tarot) et du mode de tirage (avec ou sans défausse).
- Liaison à un ou plusieurs Drivers.

### 2. Dashboard de Tirage (In-Session)
- **Pile de Pioche** : Affichage visuel du dos de la carte (`back.png`).
- **Piocher** : Tirage aléatoire d'un index parmi les restants.
- **Défausser** : Action manuelle pour écarter une carte sans en tirer une nouvelle.
- **Reset (Mélanger)** : Réinitialisation complète du deck (remet toutes les cartes de la défausse dans la pioche).
- **Formatage** : Utilisation de CSS `aspect-ratio` et `object-fit: cover` pour garantir une interface stable et sans déformation.

### 3. Interconnexions
- **Projection Hub** : Bouton pour envoyer l'URL de l'image de la carte actuelle vers le **Player Hub** (via `ImageOS`).
- **Journalisation Auto** : Chaque action de tirage génère automatiquement un événement de type `ORACLE` dans **Journal-OS** pour archive.

---

## 📂 Emplacements des fichiers de référence
- **Spécification locale** : `c:\Projet_David\GM-OS-v5\docs\blueprints\deck_os_specification.md`
- **Plan d'implémentation** : [implementation_plan.md](file:///C:/Users/david/.gemini/antigravity/brain/8d040931-77d8-4d94-b446-53f3b6430e9c/implementation_plan.md)

---
*Date de sauvegarde : 26 Mars 2026*
*Statut : Spécification validée, Prêt pour développement*
