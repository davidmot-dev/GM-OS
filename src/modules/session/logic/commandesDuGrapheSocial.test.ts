import { describe, expect, it, vi } from 'vitest';
import { forceManyBody, forceLink, forceSimulation, type ForceCollide } from 'd3';
import { reglerLesForcesDuGraphe, libererLesNoeudsDuGraphe } from './commandesDuGrapheSocial';
import type { GraphLink, GraphNode } from './socialNexusUtils';

const noeuds = (): GraphNode[] => [
    { id: 'a', name: 'A', type: 'npc', avatar: '', x: 0, y: 9, fx: 0, fy: 9 },
    { id: 'b', name: 'B', type: 'pc', avatar: '', x: 12, y: 24, fx: 12, fy: 24 },
];

describe('les commandes du graphe utilisent l’API publique installée', () => {
    it('règle les vraies forces D3 puis reprend la simulation', () => {
        const charge = forceManyBody<GraphNode>();
        const liens = forceLink<GraphNode, GraphLink>();
        const commandes = { d3Force: vi.fn(), d3ReheatSimulation: vi.fn() };
        commandes.d3Force.mockImplementation((nom: string) => nom === 'charge' ? charge : liens);

        reglerLesForcesDuGraphe(commandes, { charge: -140, distance: 200, collision: 35 });

        expect(charge.strength()(noeuds()[0], 0, noeuds())).toBe(-140);
        expect(charge.distanceMax()).toBe(1000);
        const ami: GraphLink = { source: 'a', target: 'b', type: 'ally', description: '' };
        const ennemi = { ...ami, type: 'hostile' };
        expect(liens.distance()(ami, 0, [ami])).not.toBe(liens.distance()(ennemi, 0, [ennemi]));
        const collision = commandes.d3Force.mock.calls.find(([nom]) => nom === 'collide')?.[1] as ForceCollide<GraphNode>;
        expect(collision.radius()(noeuds()[0], 0, noeuds())).toBe(35);
        expect(commandes.d3ReheatSimulation).toHaveBeenCalledTimes(1);
        expect(commandes.d3Force.mock.invocationCallOrder.at(-1)!).toBeLessThan(commandes.d3ReheatSimulation.mock.invocationCallOrder[0]);
    });

    it('tolère des forces charge/lien absentes et installe la collision', () => {
        const commandes = { d3Force: vi.fn(), d3ReheatSimulation: vi.fn() };
        expect(() => reglerLesForcesDuGraphe(commandes, { charge: -100, distance: 150, collision: 40 })).not.toThrow();
        expect(commandes.d3Force).toHaveBeenCalledWith('collide', expect.any(Function));
        expect(commandes.d3ReheatSimulation).toHaveBeenCalledTimes(1);
    });

    it('ne libère que le nœud choisi, sans déplacer ni remplacer les objets', () => {
        const vivants = noeuds();
        const selectionne = vivants[0];
        const autre = structuredClone(vivants[1]);
        libererLesNoeudsDuGraphe(vivants, 'a');
        expect(vivants[0]).toBe(selectionne);
        expect(selectionne).toMatchObject({ x: 0, y: 9, fx: undefined, fy: undefined });
        expect(vivants[1]).toEqual(autre);
    });

    it('libère tous les nœuds en conservant leurs dernières positions', () => {
        const vivants = noeuds();
        libererLesNoeudsDuGraphe(vivants);
        expect(vivants.map(n => [n.x, n.y, n.fx, n.fy])).toEqual([
            [0, 9, undefined, undefined], [12, 24, undefined, undefined],
        ]);
        // Vérification par une vraie simulation : un nœud libéré peut bouger.
        forceSimulation(vivants).stop().force('charge', forceManyBody<GraphNode>().strength(-100)).tick();
        expect(vivants[0].x).not.toBe(0);
    });

    it('un identifiant inconnu ne modifie aucune épingle', () => {
        const vivants = noeuds();
        const avant = structuredClone(vivants);
        libererLesNoeudsDuGraphe(vivants, 'absent');
        expect(vivants).toEqual(avant);
    });
});
