import { describe, it, expect } from 'vitest';
import {
    rangerLaTrame, PAS_HORIZONTAL, COLONNES_PAR_LIGNE,
} from './rangementDeLaTrame';
import type { GrapheDeTrame, NoeudDeTrame, LienDeTrame } from './grapheDeLaTrame';

/**
 * **Chaque acte selon sa forme : une chaîne, ou une étoile.**
 *
 * Demandé par David le 2026-09-25, en quatre essais : une colonne par acte
 * (*« trop serrées »*), le temps de gauche à droite (*« s'étendre dans les deux
 * dimensions »*), des blocs en serpentin (*« introduire des notions en
 * étoile ? »*), puis ceci.
 */

const noeud = (type: NoeudDeTrame['type'], refId: string): NoeudDeTrame =>
    ({ id: `${type}:${refId}`, refId, type, nom: refId });
const lien = (source: string, target: string, nature: LienDeTrame['nature']): LienDeTrame =>
    ({ source, target, nature });

/** Un acte linéaire de `n` scènes : `acte-0 → acte-1 → …`. */
function acteLineaire(acte: string, n: number): GrapheDeTrame {
    const scenes = Array.from({ length: n }, (_, i) => noeud('scene', `${acte}-${i}`));
    return {
        noeuds: [noeud('acte', acte), ...scenes],
        liens: [
            ...scenes.map(s => lien(`acte:${acte}`, s.id, 'appartenance')),
            ...scenes.slice(1).map((s, i) => lien(scenes[i].id, s.id, 'suite')),
        ],
    };
}

/** Un acte en étoile : `acte-hub` mène à `n` pistes. */
function acteEnEtoile(acte: string, n: number): GrapheDeTrame {
    const pistes = Array.from({ length: n }, (_, i) => noeud('scene', `${acte}-${i}`));
    const hub = noeud('scene', `${acte}-hub`);
    return {
        noeuds: [noeud('acte', acte), hub, ...pistes],
        liens: [
            ...[hub, ...pistes].map(s => lien(`acte:${acte}`, s.id, 'appartenance')),
            ...pistes.map(s => lien(hub.id, s.id, 'enchainement')),
        ],
    };
}

/** Un acte ouvert : `n` scènes sans rien entre elles — on y entre par plusieurs portes. */
function acteOuvert(acte: string, n: number): GrapheDeTrame {
    const scenes = Array.from({ length: n }, (_, i) => noeud('scene', `${acte}-${i}`));
    return {
        noeuds: [noeud('acte', acte), ...scenes],
        liens: scenes.map(s => lien(`acte:${acte}`, s.id, 'appartenance')),
    };
}

const fusion = (...graphes: GrapheDeTrame[]): GrapheDeTrame => ({
    noeuds: graphes.flatMap(g => g.noeuds),
    liens: graphes.flatMap(g => g.liens),
});

const distance = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y);

describe('rangerLaTrame — une chaîne', () => {
    it('une suite courte se lit de gauche à droite', () => {
        const { epingles: e } = rangerLaTrame(acteLineaire('a', 3));
        expect(e['scene:a-1'].x - e['scene:a-0'].x).toBe(PAS_HORIZONTAL);
        expect(e['scene:a-2'].x - e['scene:a-1'].x).toBe(PAS_HORIZONTAL);
        expect(e['scene:a-0'].y).toBe(e['scene:a-2'].y);
    });

    it('l’acte est au-dessus du milieu de sa chaîne', () => {
        const { epingles: e } = rangerLaTrame(acteLineaire('a', 3));
        expect(e['acte:a'].x).toBe(e['scene:a-1'].x);
        expect(e['acte:a'].y).toBeLessThan(e['scene:a-0'].y - 40);
    });

    it('une longue suite se replie, en serpentin', () => {
        const { epingles: e } = rangerLaTrame(acteLineaire('long', 10));
        const xs = new Set(Array.from({ length: 10 }, (_, i) => e[`scene:long-${i}`].x));
        expect(xs.size).toBe(COLONNES_PAR_LIGNE);
        const derniere = e[`scene:long-${COLONNES_PAR_LIGNE - 1}`];
        const premiereSuivante = e[`scene:long-${COLONNES_PAR_LIGNE}`];
        expect(premiereSuivante.x).toBe(derniere.x);
        expect(premiereSuivante.y).toBeGreaterThan(derniere.y);
    });

    it('un retour en arrière ne fait pas une étoile — une boucle n’a pas de profondeur', () => {
        const g = acteLineaire('a', 3);
        g.liens.push(lien('scene:a-2', 'scene:a-0', 'enchainement'));
        const { epingles: e } = rangerLaTrame(g);
        expect(e['scene:a-0'].y).toBe(e['scene:a-2'].y);
    });
});

describe('rangerLaTrame — une étoile', () => {
    /** **Le test qui garde la troisième remarque de David.** */
    it('la scène carrefour au centre, ses pistes en cercle autour', () => {
        const { epingles: e } = rangerLaTrame(acteEnEtoile('enq', 6));
        const centre = e['scene:enq-hub'];
        const rayons = Array.from({ length: 6 }, (_, i) => distance(e[`scene:enq-${i}`], centre));
        for (const r of rayons) expect(r).toBeCloseTo(rayons[0], 5);
        expect(rayons[0]).toBeGreaterThan(100);
    });

    it('un acte où l’on entre par plusieurs portes tourne autour de l’acte lui-même', () => {
        const { epingles: e } = rangerLaTrame(acteOuvert('inv', 8));
        const centre = e['acte:inv'];
        const rayons = Array.from({ length: 8 }, (_, i) => distance(e[`scene:inv-${i}`], centre));
        for (const r of rayons) expect(r).toBeCloseTo(rayons[0], 5);
    });

    it('les pistes voisines laissent la place à deux titres', () => {
        const { epingles: e } = rangerLaTrame(acteEnEtoile('enq', 12));
        const voisines = distance(e['scene:enq-0'], e['scene:enq-1']);
        expect(voisines).toBeGreaterThan(150);
    });

    it('deux pistes ne font pas une étoile', () => {
        const { epingles: e } = rangerLaTrame(acteEnEtoile('petit', 2));
        expect(e['scene:petit-0'].x).toBe(e['scene:petit-1'].x);
    });

    it('le carrefour garde l’acte au-dessus de l’étoile', () => {
        const { epingles: e } = rangerLaTrame(acteEnEtoile('enq', 5));
        const plusHaute = Math.min(...Array.from({ length: 5 }, (_, i) => e[`scene:enq-${i}`].y));
        expect(e['acte:enq'].y).toBeLessThan(plusHaute);
    });
});

describe('rangerLaTrame — la page', () => {
    const TRAME = fusion(
        acteLineaire('un', 3), acteLineaire('deux', 3), acteOuvert('trois', 9),
        acteLineaire('quatre', 8), acteLineaire('cinq', 6),
    );

    const rapportDe = (e: Record<string, { x: number; y: number }>) => {
        const xs = Object.values(e).map(v => v.x);
        const ys = Object.values(e).map(v => v.y);
        return (Math.max(...xs) - Math.min(...xs)) / (Math.max(...ys) - Math.min(...ys));
    };

    /** Le troisième essai visait 16:9 et rendait une colonne sur un écran large. */
    it('suit les proportions de la fenêtre', () => {
        const large = rapportDe(rangerLaTrame(TRAME, { proportions: 2.5 }).epingles);
        const haute = rapportDe(rangerLaTrame(TRAME, { proportions: 0.8 }).epingles);
        expect(large).toBeGreaterThan(haute);
        expect(large).toBeGreaterThan(1.2);
    });

    it('deux blocs ne se chevauchent jamais', () => {
        const { epingles: e } = rangerLaTrame(TRAME, { proportions: 2.4 });
        const actes = ['un', 'deux', 'trois', 'quatre', 'cinq'];
        const boite = (a: string) => {
            const points = Object.entries(e)
                .filter(([id]) => id === `acte:${a}` || id.startsWith(`scene:${a}-`)).map(([, v]) => v);
            return {
                g: Math.min(...points.map(v => v.x)), d: Math.max(...points.map(v => v.x)),
                h: Math.min(...points.map(v => v.y)), b: Math.max(...points.map(v => v.y)),
            };
        };
        for (const a of actes) for (const b of actes) {
            if (a >= b) continue;
            const A = boite(a); const B = boite(b);
            const separes = A.d < B.g || B.d < A.g || A.b < B.h || B.b < A.h;
            expect(separes, `${a} et ${b}`).toBe(true);
        }
    });

    it('épingle les annexes sous leur scène, et les orphelines sous toute la trame', () => {
        const g = acteLineaire('a', 2);
        g.noeuds.push(noeud('pnj', 'holden'), noeud('indice', 'perdu'));
        g.liens.push(lien('scene:a-0', 'pnj:holden', 'pnj'));
        const { epingles: e } = rangerLaTrame(g);
        expect(Math.abs(e['pnj:holden'].x - e['scene:a-0'].x)).toBeLessThan(PAS_HORIZONTAL / 2);
        expect(e['pnj:holden'].y).toBeGreaterThan(e['scene:a-0'].y);
        expect(e['indice:perdu'].y).toBeGreaterThan(e['pnj:holden'].y);
    });

    it('rend un rangement vide pour une trame vide', () => {
        expect(rangerLaTrame({ noeuds: [], liens: [] })).toEqual({ epingles: {} });
    });
});
