/**
 * GM-OS v6 — Chronicle Domain Types
 *
 * Regroupe les interfaces liées à la chronologie du monde de jeu :
 * Atlas, Wiki, Timeline, Indices (Clues).
 *
 * @module types/chronicle
 */

// ─────────────────────────────────────────────
// Atlas
// ─────────────────────────────────────────────

export type AtlasEntityCategory = 'npc' | 'lieu' | 'objet' | 'evenement';

export interface AtlasLinkedEntity {
    id: string;
    name: string;
    category: AtlasEntityCategory;
    favoriteId?: string;
    entityId?: string;
    mapId?: string;
    wikiEntryId?: string;
}

export interface AtlasMap {
    id: string;
    name: string;
    fileUrl: string;
    isVideo: boolean;
    type: 'battlemap' | 'world-map' | 'region' | 'city' | 'dungeon';
    narrativeDescription: string;
    gmNotes: string;
    linkedEntities: AtlasLinkedEntity[];
    campaignId: string;
    isVisited?: boolean;
}

// ─────────────────────────────────────────────
// Chronicle (Timeline + Wiki)
// ─────────────────────────────────────────────

export interface TimelineEvent {
    id: string;
    campaignId: string;
    date: string;
    title: string;
    description: string;
    type: 'quest' | 'combat' | 'lore' | 'major-event' | 'session';
    involvedEntityIds: string[];
    locationId?: string;
    sessionId?: string;
}

export interface WikiEntry {
    id: string;
    campaignId: string;
    title: string;
    content: string;
    category: 'npc' | 'location' | 'organization' | 'lore' | 'item' | 'clue' | 'rumor' | 'other';
    tags: string[];
    imageUrls: string[];
    linkedEntityIds: string[];
    eventDate?: string;
}

// ─────────────────────────────────────────────
// Clues (Indices)
// ─────────────────────────────────────────────

export interface Clue {
    id: string;
    campaignId: string;
    title: string;
    content: string;
    mediaUrl?: string;
    
    // Triple-Liaison (FK)
    locationId?: string;     // Lien vers AtlasMap
    ownerId?: string;        // Lien vers Entity (PNJ)
    eventId?: string;        // Lien vers TimelineEvent
    
    // Traçabilité
    isRevealed: boolean;
    revealedAt?: number;
    campaignMoment?: string; // Acte, Chapitre, etc.

    /*
      **Les points d'enquête** — Crimes, C5 (2026-10-22), livre p. 440 : « Limier (3)
      et Fouineur (4) pour la découvrir ». Un style suffit. Les gains vont à
      l'enquêteur qui obtient l'indice, dans les styles qu'il possède.
    */
    seuilsDEnquete?: { style: string; points: number }[];
    gainsDEnquete?: { style: string; points: number }[];
    /** Les personnages qui le connaissent sans que la table le sache : leur seule tablette le reçoit. */
    connuDe?: string[];
    /** Qui l'a trouvé, et par quel style (son libellé) : l'origine reste quand on le partage. */
    trouvePar?: { personnageId: string; nom: string; style?: string; quand: number };
}
