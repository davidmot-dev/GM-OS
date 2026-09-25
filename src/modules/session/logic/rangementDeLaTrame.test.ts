import { describe, it, expect } from 'vitest';
import { rangerEnColonnes, PAS_HORIZONTAL, HAUTEUR_MAXIMALE_DE_COUCHE } from './rangementDeLaTrame';
import type { GrapheDeTrame, NoeudDeTrame, LienDeTrame } from './grapheDeLaTrame';

/**
 * **Un bloc par acte, et le temps de gauche à droite.**
 *
 * Demandé par David le 2026-09-25 : le graphe d'« Anges de Feu » était une
 * pelote. La première version empilait les scènes d'un acte en colonne ;
 * *« trop serrées, il faut aussi travailler sur la dimension horizontale »*.
 */

const noeud = (type: NoeudDeTrame['type'], refId: string): NoeudDeTrame =>
    ({ id: `${type}:${refId}`, refId, type, nom: refId });
const lien = (source: string, target: string, nature: LienDeTrame['nature']): LienDeTrame =>
    ({ source, target, nature });

/** Acte 1 : une suite linéaire s1 → s2 → s3. Acte 2 : un éventail — h mène à e1, e2, e3. */
const GRAPHE: GrapheDeTrame = {
    noeuds: [
        noeud('acte', 'a1'), noeud('scene', 's1'), noeud('scene', 's2'), noeud('scene', 's3'),
        noeud('acte', 'a2'), noeud('scene', 'h'), noeud('scene', 'e1'), noeud('scene', 'e2'), noeud('scene', 'e3'),
        noeud('pnj', 'holden'), noeud('lieu', 'qg'), noeud('indice', 'perdu'),
    ],
    liens: [
        lien('acte:a1', 'scene:s1', 'appartenance'),
        lien('acte:a1', 'scene:s2', 'appartenance'),
        lien('acte:a1', 'scene:s3', 'appartenance'),
        lien('scene:s1', 'scene:s2', 'suite'),
        lien('scene:s2', 'scene:s3', 'suite'),
        lien('acte:a2', 'scene:h', 'appartenance'),
        lien('acte:a2', 'scene:e1', 'appartenance'),
        lien('acte:a2', 'scene:e2', 'appartenance'),
        lien('acte:a2', 'scene:e3', 'appartenance'),
        lien('scene:h', 'scene:e1', 'enchainement'),
        lien('scene:h', 'scene:e2', 'enchainement'),
        lien('scene:h', 'scene:e3', 'enchainement'),
        /* Un retour en arrière, et un saut d'acte : ils ne doivent rien décaler. */
        lien('scene:e3', 'scene:h', 'enchainement'),
        lien('scene:s3', 'scene:h', 'enchainement'),
        lien('scene:s1', 'pnj:holden', 'pnj'),
        lien('scene:h', 'pnj:holden', 'pnj'),
        lien('scene:s2', 'lieu:qg', 'lieu'),
    ],
};

describe('rangerEnColonnes', () => {
    const { epingles } = rangerEnColonnes(GRAPHE);
    const p = (id: string) => epingles[id];

    /** **Le test qui garde la remarque de David.** */
    it('une suite linéaire se lit de gauche à droite', () => {
        expect(p('scene:s2').x - p('scene:s1').x).toBe(PAS_HORIZONTAL);
        expect(p('scene:s3').x - p('scene:s2').x).toBe(PAS_HORIZONTAL);
        expect(p('scene:s1').y).toBe(p('scene:s3').y);
    });

    it('un éventail s’empile dans la couche suivante', () => {
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

    it('les actes se suivent de gauche à droite, sans se chevaucher', () => {
        const finActe1 = Math.max(p('scene:s1').x, p('scene:s2').x, p('scene:s3').x);
        expect(p('scene:h').x).toBeGreaterThan(finActe1 + PAS_HORIZONTAL);
        expect(p('acte:a1').x).toBeLessThan(p('acte:a2').x);
    });

    it('l’acte est au-dessus du milieu de son bloc', () => {
        expect(p('acte:a1').x).toBe(p('scene:s2').x);
        expect(p('acte:a1').y).toBeLessThan(p('scene:s1').y);
    });

    it('une couche trop haute se replie en une colonne de plus', () => {
        const scenes = Array.from({ length: HAUTEUR_MAXIMALE_DE_COUCHE + 2 }, (_, i) => noeud('scene', `x${i}`));
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
        const xs = new Set(scenes.map(s => e[s.id].x));
        expect(xs.size).toBe(2);
    });

    /** Laissées à la simulation, elles dérivaient en arcs — la capture le montrait. */
    it('épingle aussi les annexes, près de la première scène qui les convoque', () => {
        expect(p('pnj:holden').x).toBeGreaterThan(p('scene:s1').x);
        expect(p('pnj:holden').x - p('scene:s1').x).toBeLessThan(PAS_HORIZONTAL / 2);
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
