/**
 * GM-OS v6 — Deck-OS Domain Types
 *
 * Regroupe les interfaces liées aux paquets de cartes (Deck-OS).
 *
 * @module types/deck
 */

export type CardFormat = 'poker' | 'tarot';
export type CardOrientation = 'portrait' | 'landscape';

export interface DeckManifest {
    id: string;
    name: string;
    systemId: string;       // Liaison au GameDriver (ex: "torg")
    folderPath: string;     // Chemin : "assets/decks/[system_id]/[deck_id]"
    cardCount: number;      // Nombre total de cartes (N)
    format: CardFormat;
    orientation: CardOrientation;
    useDiscard: boolean;    // Si vrai, les cartes tirées vont en défausse
    extension?: string;     // Optionnel : extension de fichier (ex: ".jpg", default: ".png")
    filenamePattern?: string; // Optionnel : pattern (ex: "card_{n}" ou "{n}")
    startAtZero?: boolean;  // Si vrai, l'index commence à 0 (default: false = 1)
    padding?: number;       // Optionnel : nombre de chiffres (ex: 2 pour "01")
    cardMetadata?: Record<number, { name?: string; description?: string }>; // Optionnel : métadonnées par index
}

export interface DeckSessionState {
    deckId: string;
    remainingIndices: number[];     // Indices [1..N] des cartes dans la pioche
    discardedIndices: number[];     // Indices des cartes en défausse
    currentCardIndex: number | null; // Carte actuellement face visible
}
