import { describe, it, expect } from 'vitest';
import ELK from 'elkjs/lib/elk.bundled.js';
import { organiserLaTrame } from './organiserLaTrame';
import { DIMENSIONS_DES_CARTES } from './geometrieDesCartesDeTrame';
import type { GrapheDeTrame, NoeudDeTrame } from './grapheDeLaTrame';

const n = (id: string, type: NoeudDeTrame['type']): NoeudDeTrame => ({ id, type, nom: id, refId: id });
function temoin(): GrapheDeTrame {
    const scenes = Array.from({ length: 12 }, (_, i) => n(`s${i}`, 'scene'));
    return { noeuds: [n('a', 'acte'), n('b', 'acte'), ...scenes, n('local', 'pnj'), n('commun', 'lieu'), n('seul', 'indice')], liens: [
        ...scenes.map((s, i) => ({ source: i < 10 ? 'a' : 'b', target: s.id, nature: 'appartenance' as const })),
        ...scenes.slice(1, 10).map(s => ({ source: 's0', target: s.id, nature: 'enchainement' as const })),
        { source: 's1', target: 's0', nature: 'enchainement' },
        { source: 's0', target: 'local', nature: 'pnj' }, { source: 's1', target: 'local', nature: 'pnj' },
        { source: 's0', target: 'commun', nature: 'lieu' }, { source: 's10', target: 'commun', nature: 'lieu' },
    ] };
}

describe('formes de rangement de Trame', () => {
    it('les six formes et trois espacements placent chaque carte sans chevauchement et gardent les éléments partagés', async () => {
        const graphe = temoin(), avant = structuredClone(graphe), moteur = new ELK();
        for (const forme of ['automatique', 'arbre', 'etoile', 'ligne', 'colonne', 'grille'] as const)
            for (const espacement of ['compact', 'equilibre', 'aere'] as const) {
                const resultat = await organiserLaTrame(graphe, undefined, { forme, espacement, proportions: 1.7 }, moteur);
                expect(resultat.forme).toBe(forme);
                expect(Object.keys(resultat.positions).sort()).toEqual(graphe.noeuds.map(n => n.id).sort());
                expect(resultat.groupes).toHaveLength(2);
                expect(resultat.groupes.find(g => g.id === 'groupe:a')?.membres).toContain('local');
                expect(resultat.groupes.every(g => !g.membres.includes('commun'))).toBe(true);
                for (const a of graphe.noeuds) for (const b of graphe.noeuds) if (a.id < b.id) {
                    const p = resultat.positions[a.id], q = resultat.positions[b.id], ta = DIMENSIONS_DES_CARTES[a.type], tb = DIMENSIONS_DES_CARTES[b.type];
                    expect(Number.isFinite(p.x) && Number.isFinite(p.y)).toBe(true);
                    expect(Math.abs(p.x - q.x) >= (ta.largeur + tb.largeur) / 2 || Math.abs(p.y - q.y) >= (ta.hauteur + tb.hauteur) / 2,
                        `${forme} / ${espacement} / ${a.id} / ${b.id}`).toBe(true);
                }
            }
        expect(graphe).toEqual(avant);
    }, 20_000);

    it('étoile centre le carrefour ; lignes gardent l’ordre ; grille utilise plusieurs rangées', async () => {
        const graphe = temoin();
        const calcul = (forme: 'etoile' | 'ligne' | 'colonne' | 'grille') => organiserLaTrame(graphe, undefined, { forme, espacement: 'equilibre', proportions: 1.6 });
        const etoile = (await calcul('etoile')).positions, rayon = Math.hypot(etoile.s1.x - etoile.s0.x, etoile.s1.y - etoile.s0.y);
        for (let i = 2; i < 10; i++) expect(Math.hypot(etoile[`s${i}`].x - etoile.s0.x, etoile[`s${i}`].y - etoile.s0.y)).toBeCloseTo(rayon, 5);
        const ligne = (await calcul('ligne')).positions, colonne = (await calcul('colonne')).positions;
        for (let i = 1; i < 10; i++) {
            expect(ligne[`s${i}`].y).toBe(ligne.s0.y); expect(ligne[`s${i}`].x).toBeGreaterThan(ligne[`s${i - 1}`].x);
            expect(colonne[`s${i}`].x).toBe(colonne.s0.x); expect(colonne[`s${i}`].y).toBeGreaterThan(colonne[`s${i - 1}`].y);
        }
        const grille = (await calcul('grille')).positions;
        expect(new Set(Array.from({ length: 10 }, (_, i) => grille[`s${i}`].y)).size).toBeGreaterThan(1);
        expect(new Set(Array.from({ length: 10 }, (_, i) => grille[`s${i}`].x)).size).toBeGreaterThan(1);
    });

    it('une étoile sans carrefour centre l’acte et les cartes sans acte restent placées ; annuler ne livre rien', async () => {
        const graphe: GrapheDeTrame = { noeuds: [n('a', 'acte'), n('s1', 'scene'), n('s2', 'scene'), n('isolee', 'scene'), n('p', 'pnj'), n('vide', 'acte')],
            liens: [{ source: 'a', target: 's1', nature: 'appartenance' }, { source: 'a', target: 's2', nature: 'appartenance' },
                { source: 'isolee', target: 'p', nature: 'pnj' }] };
        const resultat = await organiserLaTrame(graphe, undefined, { forme: 'etoile', espacement: 'aere', proportions: NaN });
        expect(Object.keys(resultat.positions)).toHaveLength(graphe.noeuds.length);
        const { a, s1, s2 } = resultat.positions;
        expect((s1.x + s2.x) / 2).toBeCloseTo(a.x); expect((s1.y + s2.y) / 2).toBeCloseTo(a.y);
        const controle = new AbortController(); controle.abort();
        await expect(organiserLaTrame(graphe, undefined, { forme: 'grille', espacement: 'compact', proportions: 1, signal: controle.signal }))
            .rejects.toMatchObject({ name: 'AbortError' });
    });
});
