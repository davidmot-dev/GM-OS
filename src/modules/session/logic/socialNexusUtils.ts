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
    /** La nature canonique — elle décide couleur et distance. */
    type: string;
    /** Le nom propre de la relation, s'il y en a un. */
    libelle?: string;
    description: string;
}

export interface SocialGraphData {
    nodes: GraphNode[];
    links: GraphLink[];
}

/** Une position retenue, quelle qu'en soit l'origine. */
export type PositionRetenue = { x: number; y: number };

/**
 * **Où le graphe reprend, et ce qui n'y bouge pas.**
 *
 * *Défaut signalé par David le 2026-09-03 : « dès que je libère les positions,
 * tout se remélange et je n'arrive pas à repositionner les choses facilement ».*
 *
 * Les deux moitiés du défaut tiennent dans la distinction `x/y` contre
 * `fx/fy` :
 *
 * - **`x/y` est un point de départ.** Un nœud construit sans coordonnées est
 *   posé par d3 sur une spirale, d'où qu'il vînt : c'est *ça*, le remélange au
 *   déverrouillage. On sème donc les dernières positions connues, et la
 *   simulation ne fait plus que se détendre à partir de ce qu'on voyait.
 * - **`fx/fy` est une décision.** Seul un nœud posé à la main en reçoit — les
 *   forces ne peuvent plus le reprendre, même quand le meneur joue avec les
 *   réglages de physique.
 *
 * **Une épingle passe devant l'instantané de verrouillage**, toujours : le
 * premier est une décision, le second une capture en bloc.
 */
export interface DispositionDuNexus {
    /**
     * Où ce nœud se trouvait la dernière fois qu'on l'a vu.
     *
     * **Une question posée, pas une table livrée** : les positions vivantes de
     * l'écran changent à chaque tic de la simulation, et les figer dans un
     * objet à chaque rendu ferait payer un calcul à chaque image — ou pire,
     * lire une référence pendant le rendu, ce que React interdit à juste titre.
     */
    positionDe?: (id: string) => PositionRetenue | undefined;
    /** Les nœuds posés à la main. Ils ne bougent plus. */
    epingles?: Record<string, PositionRetenue>;
    /** Tout est figé : l'instantané devient une contrainte. */
    verrouille?: boolean;
}

/**
 * Ce que chaque nœud reçoit comme coordonnées, et pourquoi.
 *
 * Rendu à part pour être éprouvé seul : c'est deux lignes de conséquence pour
 * un défaut qui se voit à chaque ouverture du Nexus.
 */
export function placerLeNoeud(id: string, disposition?: DispositionDuNexus): Partial<GraphNode> {
    const epingle = disposition?.epingles?.[id];
    const capture = disposition?.positionDe?.(id);

    // Une décision du meneur passe devant tout le reste.
    if (epingle) return { x: epingle.x, y: epingle.y, fx: epingle.x, fy: epingle.y };

    if (disposition?.verrouille) {
        return capture ? { x: capture.x, y: capture.y, fx: capture.x, fy: capture.y } : {};
    }

    // Libre : on sème, on ne fige pas. C'est ce qui supprime le remélange.
    return capture ? { x: capture.x, y: capture.y } : {};
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
    disposition?: DispositionDuNexus,
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
            ...placerLeNoeud(pc.id, disposition),
        })),
        ...campaignEntities.map(npc => ({
            id: npc.id,
            name: npc.name,
            avatar: npc.avatar,
            type: 'npc' as const,
            faction: npc.faction,
            ...placerLeNoeud(npc.id, disposition),
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
                    libelle: rel.libelle,
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
