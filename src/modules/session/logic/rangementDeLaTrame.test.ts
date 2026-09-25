import { describe, it, expect } from 'vitest';
import { rangerEnColonnes, LARGEUR_DE_COLONNE } from './rangementDeLaTrame';
import type { GrapheDeTrame, NoeudDeTrame, LienDeTrame } from './grapheDeLaTrame';

/**
 * **Une colonne par acte, ses scènes dessous, dans l'ordre.**
 *
 * Demandé par David le 2026-09-25 : le graphe d'« Anges de Feu » était une
 * pelote, et impossible à ranger contre la simulation.
 */

const noeud = (type: NoeudDeTrame['type'], refId: string): NoeudDeTrame =>
    ({ id: `${type}:${refId}`, refId, type, nom: refId });
const lien = (source: string, target: string, nature: LienDeTrame['nature']): LienDeTrame =>
    ({ source, target, nature });

/** Deux actes : trois scènes puis une ; un PNJ partagé, un lieu, un indice orphelin. */
const GRAPHE: GrapheDeTrame = {
    noeuds: [
        noeud('acte', 'a1'), noeud('scene', 's1'), noeud('scene', 's2'), noeud('scene', 's3'),
        noeud('acte', 'a2'), noeud('scene', 's4'),
        noeud('pnj', 'holden'), noeud('lieu', 'qg'), noeud('indice', 'perdu'),
    ],
    liens: [
        lien('acte:a1', 'scene:s1', 'appartenance'),
        lien('acte:a1', 'scene:s2', 'appartenance'),
        lien('acte:a1', 'scene:s3', 'appartenance'),
        lien('acte:a2', 'scene:s4', 'appartenance'),
        lien('scene:s1', 'scene:s2', 'suite'),
        lien('scene:s3', 'scene:s4', 'enchainement'),
        lien('scene:s1', 'pnj:holden', 'pnj'),
        lien('scene:s4', 'pnj:holden', 'pnj'),
        lien('scene:s2', 'lieu:qg', 'lieu'),
    ],
};

describe('rangerEnColonnes', () => {
    const { epingles, semis } = rangerEnColonnes(GRAPHE);

    it('pose les actes de gauche à droite, dans leur ordre', () => {
        expect(epingles['acte:a2'].x - epingles['acte:a1'].x).toBe(LARGEUR_DE_COLONNE);
        expect(epingles['acte:a1'].y).toBe(epingles['acte:a2'].y);
    });

    it('empile les scènes sous leur acte, dans leur ordre', () => {
        const [a, s1, s2, s3] = ['acte:a1', 'scene:s1', 'scene:s2', 'scene:s3'].map(id => epingles[id]);
        expect(s1.y).toBeGreaterThan(a.y);
        expect(s2.y).toBeGreaterThan(s1.y);
        expect(s3.y).toBeGreaterThan(s2.y);
        /* Même colonne, au zigzag près. */
        for (const s of [s1, s2, s3]) expect(Math.abs(s.x - a.x)).toBeLessThan(LARGEUR_DE_COLONNE / 4);
    });

    /** Un enchaînement qui saute une scène ne doit pas passer à travers elle. */
    it('décale une scène sur deux', () => {
        expect(epingles['scene:s1'].x).not.toBe(epingles['scene:s2'].x);
    });

    it('n’épingle que les actes et les scènes — les annexes sont semées', () => {
        expect(Object.keys(epingles).sort()).toEqual(
            ['acte:a1', 'acte:a2', 'scene:s1', 'scene:s2', 'scene:s3', 'scene:s4']);
        expect(Object.keys(semis).sort()).toEqual(['indice:perdu', 'lieu:qg', 'pnj:holden']);
    });

    it('sème une annexe près des scènes qui la convoquent — entre deux actes pour un PNJ partagé', () => {
        const holden = semis['pnj:holden'];
        expect(holden.x).toBeGreaterThan(epingles['acte:a1'].x);
        expect(holden.x).toBeLessThan(epingles['acte:a2'].x + LARGEUR_DE_COLONNE);
    });

    /** *Un orphelin qu'on voit à l'écart est un constat qu'on lit sans le chercher.* */
    it('met l’orpheline sous toute la trame', () => {
        const plusBasse = Math.max(...Object.values(epingles).map(p => p.y));
        expect(semis['indice:perdu'].y).toBeGreaterThan(plusBasse);
    });

    it('rend un rangement vide pour une trame vide', () => {
        expect(rangerEnColonnes({ noeuds: [], liens: [] })).toEqual({ epingles: {}, semis: {} });
    });
});
