import type { ForceGraphMethods } from 'react-force-graph-2d';
import { forceCollide, type ForceLink, type ForceManyBody } from 'd3';
import type { GraphLink, GraphNode } from './socialNexusUtils';
import { distanceDeRelation } from './relationsSociales';

export type GrapheSocial = ForceGraphMethods<GraphNode, GraphLink>;

/**
 * 08/10/2026, David : regrouper les any sans perdre en qualité. La version
 * installée expose d3Force et d3ReheatSimulation, pas d3Simulation. Les forces
 * nommées reprennent leurs vrais types D3 ; la reprise passe par l'API publique.
 */
export function reglerLesForcesDuGraphe(
    graphe: Pick<GrapheSocial, 'd3Force' | 'd3ReheatSimulation'>,
    reglages: { charge: number; distance: number; collision: number },
): void {
    const charge = graphe.d3Force('charge') as ForceManyBody<GraphNode> | undefined;
    charge?.strength(reglages.charge).distanceMax(1000);
    const liens = graphe.d3Force('link') as ForceLink<GraphNode, GraphLink> | undefined;
    liens?.distance(lien => distanceDeRelation(lien.type, reglages.distance));
    graphe.d3Force('collide', forceCollide<GraphNode>(reglages.collision));
    graphe.d3ReheatSimulation();
}

/** L'objet vivant garde x/y ; seuls les points fixes sont libérés. */
export function libererLesNoeudsDuGraphe(noeuds: GraphNode[], id?: string): void {
    for (const noeud of noeuds) {
        if (!id || noeud.id === id) {
            // D3 libère aussi une coordonnée undefined ; les types publics
            // de react-force-graph-2d acceptent cette forme, contrairement à null.
            noeud.fx = undefined;
            noeud.fy = undefined;
        }
    }
}
