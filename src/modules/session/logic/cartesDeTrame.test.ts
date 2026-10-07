import { describe, it, expect } from 'vitest';
import { adapterLeGrapheDeTrame, positionDeLaCarte } from './adapterLeGrapheDeTrame';
import { rangerLaTrame } from './rangementDeLaTrame';
import { DIMENSIONS_DES_CARTES, contientLeCentre } from './geometrieDesCartesDeTrame';
import type { GrapheDeTrame, NoeudDeTrame } from './grapheDeLaTrame';

const noeud = (type: NoeudDeTrame['type'], refId: string): NoeudDeTrame => ({ id: `${type}:${refId}`, type, refId, nom: refId });
function fixture(n: number, etoile = false): GrapheDeTrame {
    const scenes = Array.from({ length: n }, (_, i) => noeud('scene', `s${i}`));
    const acte = noeud('acte', 'a');
    const g: GrapheDeTrame = { noeuds: [acte, ...scenes], liens: scenes.map(s => ({ source: acte.id, target: s.id, nature: 'appartenance' })) };
    for (let i = 1; i < n; i++) g.liens.push({ source: scenes[etoile ? 0 : i - 1].id, target: scenes[i].id, nature: 'enchainement' });
    for (const [i, s] of scenes.entries()) for (let k = 0; k < i % 7; k++) {
        const p = noeud(k % 2 ? 'pnj' : 'indice', `${i}-${k}`);
        g.noeuds.push(p); g.liens.push({ source: s.id, target: p.id, nature: p.type });
    }
    const partage = noeud('lieu', 'partage');
    g.noeuds.push(partage, noeud('pj', 'orphelin'), noeud('acte', 'vide'));
    for (const s of scenes) g.liens.push({ source: s.id, target: partage.id, nature: 'lieu' });
    return g;
}
function verifierLesRectangles(g: GrapheDeTrame) {
    const resultat = rangerLaTrame(g, { cartes: true, proportions: 1.8 });
    expect(Object.keys(resultat.epingles).sort()).toEqual(g.noeuds.map(n => n.id).sort());
    for (let i = 0; i < g.noeuds.length; i++) for (let j = i + 1; j < g.noeuds.length; j++) {
        const a = g.noeuds[i], b = g.noeuds[j], pa = resultat.epingles[a.id], pb = resultat.epingles[b.id];
        const ta = DIMENSIONS_DES_CARTES[a.type], tb = DIMENSIONS_DES_CARTES[b.type];
        const separes = Math.abs(pa.x - pb.x) >= (ta.largeur + tb.largeur) / 2
            || Math.abs(pa.y - pb.y) >= (ta.hauteur + tb.hauteur) / 2;
        expect(separes, `${a.id} chevauche ${b.id}`).toBe(true);
        expect(Number.isFinite(pa.x) && Number.isFinite(pa.y)).toBe(true);
    }
    expect(rangerLaTrame(g, { cartes: true, proportions: 1.8 })).toEqual(resultat);
}

describe('cartes de Trame — géométrie', () => {
    it('les chaînes, annexes partagées et orphelins ne se chevauchent pas', () => {
        for (const n of [0, 1, 3, 10, 35]) verifierLesRectangles(fixture(n));
    });
    it('les étoiles réservent aussi les grappes volumineuses', () => {
        for (const n of [4, 8, 20]) verifierLesRectangles(fixture(n, true));
    });
    it('les cycles et les actes ouverts gardent une position finie par carte', () => {
        const g = fixture(12, true);
        g.liens.push({ source: 'scene:s11', target: 'scene:s0', nature: 'enchainement' });
        verifierLesRectangles(g);
        g.liens = g.liens.filter(l => l.nature !== 'enchainement');
        verifierLesRectangles(g);
    });
    it('la cible du dépôt est le rectangle entier, sans dépendre du zoom', () => {
        expect(contientLeCentre({ x: 129, y: 39 }, { x: 0, y: 0 }, 'acte')).toBe(true);
        expect(contientLeCentre({ x: 0, y: 41 }, { x: 0, y: 0 }, 'acte')).toBe(false);
    });
});
describe('cartes de Trame — adaptation et positions', () => {
    it('donne priorité aux épingles puis à l’instantané figé', () => {
        const contexte = { epingles: { a: { x: 1, y: 2 } }, instantane: { a: { x: 3, y: 4 } }, vivantes: { a: { x: 5, y: 6 } }, rangement: { a: { x: 7, y: 8 } }, fige: true };
        expect(positionDeLaCarte('a', contexte)).toEqual({ x: 1, y: 2 });
        expect(positionDeLaCarte('a', { ...contexte, epingles: undefined })).toEqual({ x: 3, y: 4 });
        expect(positionDeLaCarte('a', { ...contexte, epingles: undefined, fige: false })).toEqual({ x: 5, y: 6 });
        expect(positionDeLaCarte('a', { rangement: contexte.rangement })).toEqual({ x: 7, y: 8 });
    });
    it('ignore les coordonnées invalides et ne rend pas la référence stockée', () => {
        const p = { x: 2, y: 9 };
        const applique = positionDeLaCarte('a', { epingles: { a: { x: NaN, y: 0 } }, rangement: { a: p } });
        applique.x = 99;
        expect(p.x).toBe(2);
    });
    it('garde des identifiants de lien stables et les coordonnées centrales', () => {
        const g = fixture(3), copie = structuredClone(g);
        const options = { positionDe: () => ({ x: 5, y: 7 }), choisi: 'scene:s0', liaison: false, surlignes: new Set<string>(), fige: false };
        const a = adapterLeGrapheDeTrame(g, {}, options);
        g.liens[0].libelle = 'nouvelle condition';
        const b = adapterLeGrapheDeTrame({ ...g, liens: [...g.liens].reverse() }, {}, options);
        expect(a.liens.map(l => l.id).sort()).toEqual(b.liens.map(l => l.id).sort());
        expect(a.noeuds.find(n => n.id === 'scene:s0')?.position).toEqual({ x: 5, y: 7 });
        expect(a.noeuds.find(n => n.id === 'scene:s0')?.selected).toBe(true);
        delete g.liens[0].libelle;
        expect(g).toEqual(copie);
    });
    it('écarte une cible absente et ne fabrique aucun nœud métier', () => {
        const g = fixture(1); g.liens.push({ source: 'scene:s0', target: 'scene:absente', nature: 'enchainement' });
        const a = adapterLeGrapheDeTrame(g, {}, { positionDe: () => ({ x: 0, y: 0 }), choisi: null, liaison: true, surlignes: new Set(), fige: false });
        expect(a.noeuds).toHaveLength(g.noeuds.length);
        expect(a.liens.some(l => l.target === 'scene:absente')).toBe(false);
    });
});
