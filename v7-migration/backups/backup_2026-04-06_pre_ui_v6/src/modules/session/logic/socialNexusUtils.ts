import { type Entity, type PlayerCharacter, type EntityRelation } from '../useSessionOSStore';

export interface GraphNode {
    id: string;
    name: string;
    avatar: string;
    type: 'pc' | 'npc';
    faction?: string;
    x?: number;
    y?: number;
    fx?: number;
    fy?: number;
}

export interface GraphLink {
    source: string | GraphNode;
    target: string | GraphNode;
    type: string;
    description: string;
}

export interface SocialGraphData {
    nodes: GraphNode[];
    links: GraphLink[];
}

/**
 * Filtre et prépare les données pour la visualisation du graphe social.
 */
export const prepareSocialGraphData = (
    entities: Entity[],
    players: { characters: PlayerCharacter[] }[],
    campaignId: string | null,
    filters: {
        type: string;
        faction: string;
        search: string;
    },
    nodePositions?: Record<string, { x: number; y: number }>,
    isLocked?: boolean
): SocialGraphData => {
    if (!campaignId) return { nodes: [], links: [] };

    const campaignEntities = entities.filter(e => e.campaignId === campaignId);
    const campaignPCs = players.flatMap(p => p.characters.filter(c => c.campaignId === campaignId));

    // Combine all potential nodes
    let nodes: GraphNode[] = [
        ...campaignPCs.map(pc => ({
            id: pc.id,
            name: pc.name,
            avatar: pc.portraitUrl,
            type: 'pc' as const,
            faction: pc.faction,
            fx: isLocked ? nodePositions?.[pc.id]?.x : undefined,
            fy: isLocked ? nodePositions?.[pc.id]?.y : undefined
        })),
        ...campaignEntities.map(npc => ({
            id: npc.id,
            name: npc.name,
            avatar: npc.avatar,
            type: 'npc' as const,
            faction: npc.faction,
            fx: isLocked ? nodePositions?.[npc.id]?.x : undefined,
            fy: isLocked ? nodePositions?.[npc.id]?.y : undefined
        }))
    ];

    // Apply Search Filter
    if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        nodes = nodes.filter(n => 
            n.name.toLowerCase().includes(searchLower) || 
            n.faction?.toLowerCase().includes(searchLower)
        );
    }

    // Apply Faction Filter
    if (filters.faction !== 'all') {
        nodes = nodes.filter(n => n.faction === filters.faction);
    }

    const nodeIds = new Set(nodes.map(n => n.id));
    const links: GraphLink[] = [];

    const processRelations = (sourceId: string, relations?: EntityRelation[]) => {
        relations?.forEach(rel => {
            if (!rel) return; // Guard against corrupted data
            // Apply Relation Type Filter
            if (filters.type !== 'all' && rel.type !== filters.type) return;

            // Only include links where both source and target nodes are present in the filtered nodes list
            // OR if we want to show "broken" links (but usually we want a clean graph)
            if (nodeIds.has(sourceId) && nodeIds.has(rel.targetId)) {
                links.push({
                    source: sourceId,
                    target: rel.targetId,
                    type: rel.type,
                    description: rel.description
                });
            }
        });
    };

    campaignEntities.forEach(npc => processRelations(npc.id, npc.relations));
    campaignPCs.forEach(pc => processRelations(pc.id, pc.relations));

    return { nodes, links };
};

/**
 * Extrait toutes les factions uniques d'une campagne.
 */
export const getUniqueFactions = (
    entities: Entity[],
    players: { characters: PlayerCharacter[] }[],
    campaignId: string | null
): string[] => {
    if (!campaignId) return [];
    
    const factions = new Set<string>();
    
    entities.filter(e => e.campaignId === campaignId).forEach(e => {
        if (e.faction) factions.add(e.faction);
    });
    
    players.flatMap(p => p.characters.filter(c => c.campaignId === campaignId)).forEach(c => {
        if (c.faction) factions.add(c.faction);
    });
    
    return Array.from(factions).sort();
};
