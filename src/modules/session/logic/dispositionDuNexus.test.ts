import { describe, it, expect } from 'vitest';
import { placerLeNoeud, prepareSocialGraphData } from './socialNexusUtils';
import type { Entity, PlayerCharacter } from '../useSessionOSStore';

/**
 * **Où le Social Nexus reprend, et ce qui n'y bouge pas.**
 *
 * *Défaut signalé par David le 2026-09-03 : « dès que je libère les positions,
 * tout se remélange et je n'arrive pas à repositionner les choses facilement à
 * cause des réglages du nexus ».*
 *
 * Les deux moitiés tiennent dans une distinction que le code ne faisait pas :
 *
 * - **`x/y` est un point de départ**, `fx/fy` une contrainte. Un nœud rendu à
 *   d3 sans coordonnées est reposé sur une spirale : *ce n'est pas la
 *   simulation qui remélangeait, c'est qu'on lui rendait des inconnus.*
 * - **Une épingle est une décision, l'instantané une capture.** Elle passe donc
 *   devant, verrouillé ou non — sinon déverrouiller épinglerait tout le graphe,
 *   c'est-à-dire remettrait le verrou qu'on vient de lever.
 */

describe('placer un nœud du Nexus', () => {
    it('ne pose rien quand on ne sait rien de lui', () => {
        expect(placerLeNoeud('n1')).toEqual({});
        expect(placerLeNoeud('n1', {})).toEqual({});
    });

    /** **Le remélange, réduit à une ligne** : on sème sans figer. */
    it('sème la dernière position connue, sans la figer', () => {
        const place = placerLeNoeud('n1', { positionDe: () => ({ x: 10, y: 20 }) });

        expect(place).toEqual({ x: 10, y: 20 });
        expect(place.fx).toBeUndefined();
        expect(place.fy).toBeUndefined();
    });

    /** Un nœud posé à la main ne bouge plus, quoi que fassent les forces. */
    it('fige un nœud épinglé', () => {
        expect(placerLeNoeud('n1', { epingles: { n1: { x: 5, y: 6 } } }))
            .toEqual({ x: 5, y: 6, fx: 5, fy: 6 });
    });

    it('fige tout le monde quand le graphe est verrouillé', () => {
        expect(placerLeNoeud('n1', { positionDe: () => ({ x: 1, y: 2 }), verrouille: true }))
            .toEqual({ x: 1, y: 2, fx: 1, fy: 2 });
    });

    /**
     * *Une décision passe devant une capture.* Sans cette priorité, un nœud
     * déplacé après un verrouillage reviendrait à sa place d'avant au premier
     * filtre — et le meneur croirait son geste perdu.
     */
    it('donne raison à l’épingle contre l’instantané', () => {
        const place = placerLeNoeud('n1', {
            positionDe: () => ({ x: 1, y: 1 }),
            epingles: { n1: { x: 9, y: 9 } },
            verrouille: true,
        });

        expect(place).toEqual({ x: 9, y: 9, fx: 9, fy: 9 });
    });

    /** Les autres nœuds ne sont pas concernés par l'épingle d'un voisin. */
    it('ne fige que le nœud épinglé', () => {
        const disposition = { positionDe: () => ({ x: 3, y: 3 }), epingles: { n1: { x: 9, y: 9 } } };

        expect(placerLeNoeud('n2', disposition)).toEqual({ x: 3, y: 3 });
    });
});

const ENTITES = [
    { id: 'npc1', name: 'Rachael', campaignId: 'c1', type: 'npc', relations: [] },
] as unknown as Entity[];

const JOUEURS = [
    { characters: [{ id: 'pc1', name: 'Deckard', campaignId: 'c1', relations: [] }] },
] as unknown as { characters: PlayerCharacter[] }[];

const FILTRES = { type: 'all', faction: 'all', search: '' };

describe('le graphe préparé', () => {
    /** Le cas de David : on libère, et rien ne saute. */
    it('rend des nœuds semés mais libres quand on déverrouille', () => {
        const data = prepareSocialGraphData(ENTITES, JOUEURS, 'c1', FILTRES, {
            positionDe: id => (id === 'npc1' ? { x: 100, y: 200 } : undefined),
            verrouille: false,
        });

        const rachael = data.nodes.find(n => n.id === 'npc1')!;
        expect([rachael.x, rachael.y]).toEqual([100, 200]);
        expect(rachael.fx).toBeUndefined();

        // Un nœud dont on ne sait rien reste sans coordonnées : c'est à d3 de le placer.
        const deckard = data.nodes.find(n => n.id === 'pc1')!;
        expect(deckard.x).toBeUndefined();
    });

    it('transmet les épingles aux deux familles de nœuds', () => {
        const data = prepareSocialGraphData(ENTITES, JOUEURS, 'c1', FILTRES, {
            epingles: { pc1: { x: 7, y: 8 }, npc1: { x: 1, y: 2 } },
        });

        expect(data.nodes.map(n => [n.id, n.fx, n.fy])).toEqual(
            expect.arrayContaining([['pc1', 7, 8], ['npc1', 1, 2]]),
        );
    });

    /** Sans disposition, rien ne change pour qui n'a jamais rien épinglé. */
    it('reste sans coordonnées quand aucune disposition n’est donnée', () => {
        const data = prepareSocialGraphData(ENTITES, JOUEURS, 'c1', FILTRES);

        expect(data.nodes.every(n => n.x === undefined && n.fx === undefined)).toBe(true);
    });
});
