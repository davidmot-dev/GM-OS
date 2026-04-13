/**
 * Types liés à l'atlas et à la cartographie narrative.
 */

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
