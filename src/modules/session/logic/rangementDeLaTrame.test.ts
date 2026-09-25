import { describe, it, expect } from 'vitest';
import {
    rangerEnColonnes, PAS_HORIZONTAL, HAUTEUR_MAXIMALE_DE_RANG, COLONNES_PAR_LIGNE,
} from './rangementDeLaTrame';
import type { GrapheDeTrame, NoeudDeTrame, LienDeTrame } from './grapheDeLaTrame';

/**
 * **Des blocs d'actes qui occupent les deux dimensions.**
 *
 * Demandé par David le 2026-09-25, en trois essais : une colonne par acte
 * (*« trop serrées »*), puis le temps de gauche à droite (*« il faudrait
 * s'étendre dans les deux dimensions »* — un ruban de 1 600 sur 100), puis ceci.
 */

const noeud = (type: NoeudDeTrame['type'], refId: string): NoeudDeTrame =>
    ({ id: `${type}:${refId}`, refId, type, nom: refId });
const lien = (source: string, target: string, nature: LienDeTrame['nature']): LienDeTrame =>
    ({ source, target, nature });

/** Un acte linéaire de `n` scènes : `pfx0 → pfx1 → …`. */
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

const fusion = (...graphes: GrapheDeTrame[]): GrapheDeTrame => ({
    noeuds: graphes.flatMap(g => g.noeuds),
    liens: graphes.flatMap(g => g.liens),
});

/** Acte 1 : trois scènes en suite. Acte 2 : un éventail — h mène à e1, e2, e3. */
const GRAPHE: GrapheDeTrame = fusion(acteLineaire('a1', 3), {
    noeuds: [
        noeud('acte', 'a2'), noeud('scene', 'h'), noeud('scene', 'e1'), noeud('scene', 'e2'), noeud('scene', 'e3'),
        noeud('pnj', 'holden'), noeud('lieu', 'qg'), noeud('indice', 'perdu'),
    ],
    liens: [
        ...['h', 'e1', 'e2', 'e3'].map(s => lien('acte:a2', `scene:${s}`, 'appartenance')),
        ...['e1', 'e2', 'e3'].map(s => lien('scene:h', `scene:${s}`, 'enchainement')),
        /* Un retour en arrière, et un saut d'acte : ils ne doivent rien décaler. */
        lien('scene:e3', 'scene:h', 'enchainement'),
        lien('scene:a1-2', 'scene:h', 'enchainement'),
        lien('scene:a1-0', 'pnj:holden', 'pnj'),
        lien('scene:h', 'pnj:holden', 'pnj'),
        lien('scene:a1-1', 'lieu:qg', 'lieu'),
    ],
});

describe('rangerEnColonnes', () => {
    const { epingles } = rangerEnColonnes(GRAPHE);
    const p = (id: string) => epingles[id];

    it('une suite courte se lit de gauche à droite', () => {
        expect(p('scene:a1-1').x - p('scene:a1-0').x).toBe(PAS_HORIZONTAL);
        expect(p('scene:a1-2').x - p('scene:a1-1').x).toBe(PAS_HORIZONTAL);
        expect(p('scene:a1-0').y).toBe(p('scene:a1-2').y);
    });

    it('un éventail s’empile dans le rang suivant', () => {
        const [e1, e2, e3] = ['scene:e1', 'scene:e2', 'scene:e3'].map(p);
        expect(e1.x).toBe(e2.x);
        expect(e2.x).toBe(e3.x);
        expect(e1.x - p('scene:h').x).toBe(PAS_HORIZONTAL);
        expect(e2.y).toBeGreaterThan(e1.y);
        expect(e3.y).toBeGreaterThan(e2.y);
    });

    it('un retour en arrière ne décale rien — une boucle n’a pas de profondeur', () => {
        expect(p('scene:h').x).toBeLessThan(p('scene:e1').x);
    });

    it('l’acte est au-dessus du milieu de son bloc', () => {
        expect(p('acte:a1').x).toBe(p('scene:a1-1').x);
        expect(p('acte:a1').y).toBeLessThan(p('scene:a1-0').y);
    });

    it('un rang trop haut se replie en une colonne de plus', () => {
        const scenes = Array.from({ length: HAUTEUR_MAXIMALE_DE_RANG + 2 }, (_, i) => noeud('scene', `x${i}`));
        const { epingles: e } = rangerEnColonnes({
            noeuds: [noeud('acte', 'z'), noeud('scene', 'hub'), ...scenes],
            liens: [
                lien('acte:z', 'scene:hub', 'appartenance'),
                ...scenes.flatMap(s => [
                    lien('acte:z', s.id, 'appartenance'),
                    lien('scene:hub', s.id, 'enchainement'),
                ]),
            ],
        });
        expect(new Set(scenes.map(s => e[s.id].x)).size).toBe(2);
    });

    /** Laissées à la simulation, elles dérivaient en arcs — la capture le montrait. */
    it('épingle les annexes SOUS la première scène qui les convoque', () => {
        expect(Math.abs(p('pnj:holden').x - p('scene:a1-0').x)).toBeLessThan(PAS_HORIZONTAL / 2);
        expect(p('pnj:holden').y).toBeGreaterThan(p('scene:a1-0').y);
        expect(p('lieu:qg')).toBeDefined();
    });

    /** *Un orphelin qu'on voit à l'écart est un constat qu'on lit sans le chercher.* */
    it('met l’orpheline sous toute la trame', () => {
        const scenes = Object.entries(epingles).filter(([id]) => id.startsWith('scene:')).map(([, v]) => v.y);
        expect(p('indice:perdu').y).toBeGreaterThan(Math.max(...scenes));
    });

    it('rend un rangement vide pour une trame vide', () => {
        expect(rangerEnColonnes({ noeuds: [], liens: [] })).toEqual({ epingles: {} });
    });
});

describe('rangerEnColonnes — les deux dimensions', () => {
    /** **Le test qui garde la seconde remarque de David** : plus de ruban. */
    it('une longue suite se replie, en serpentin', () => {
        const { epingles: e } = rangerEnColonnes(acteLineaire('long', 10));
        const xs = new Set(Array.from({ length: 10 }, (_, i) => e[`scene:long-${i}`].x));
        expect(xs.size).toBe(COLONNES_PAR_LIGNE);

        /* La ligne suivante repart d'où la précédente s'arrête : la scène 4
           est sous la scène 3, et non revenue à gauche. */
        const derniere = e[`scene:long-${COLONNES_PAR_LIGNE - 1}`];
        const premiereSuivante = e[`scene:long-${COLONNES_PAR_LIGNE}`];
        expect(premiereSuivante.x).toBe(derniere.x);
        expect(premiereSuivante.y).toBeGreaterThan(derniere.y);
    });

    it('cinq actes occupent un rectangle aux proportions d’un écran, pas un ruban', () => {
        const { epingles: e } = rangerEnColonnes(fusion(
            ...['un', 'deux', 'trois', 'quatre', 'cinq'].map(a => acteLineaire(a, 8)),
        ));
        const xs = Object.values(e).map(v => v.x);
        const ys = Object.values(e).map(v => v.y);
        const rapport = (Math.max(...xs) - Math.min(...xs)) / (Math.max(...ys) - Math.min(...ys));
        expect(rapport).toBeGreaterThan(0.8);
        expect(rapport).toBeLessThan(3.5);
    });

    it('deux blocs ne se chevauchent jamais', () => {
        const actes = ['un', 'deux', 'trois', 'quatre', 'cinq'];
        const { epingles: e } = rangerEnColonnes(fusion(...actes.map((a, i) => acteLineaire(a, 3 + i * 2))));
        const boite = (a: string) => {
            const points = Object.entries(e).filter(([id]) => id === `acte:${a}` || id.startsWith(`scene:${a}-`)).map(([, v]) => v);
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
});
