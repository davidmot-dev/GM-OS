/**
 * Types liés aux chroniques, wiki et indices.
 */

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
}
