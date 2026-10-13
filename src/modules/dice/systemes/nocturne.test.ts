import { describe, it, expect } from 'vitest';
import { malusDePeril, resoudreLeDestin, type JaugeDePeril } from './nocturne';

/**
 * Le système Nocturne — `docs/systems/noc/rules/` et le carnet NotebookLM
 * « NOC » (2026-10-13) : le niveau du Talent, plus un par dé de destin à 8 et
 * plus, contre la difficulté ; chaque 1 est une goutte de Fiel.
 */
const JAUGES: JaugeDePeril[] = [
    { champ: 'blessures', label: 'Blessures', seuils: [
        { aPartirDe: 5, label: 'Choqué', domaines: -1 }, { aPartirDe: 8, label: 'Blessure lourde', talents: -1 }] },
    { champ: 'trauma', label: 'Trauma', seuils: [
        { aPartirDe: 5, label: 'Choqué', domaines: -1 }, { aPartirDe: 8, label: 'Traumatisé', talents: -1 }] },
];

describe('les malus de péril', () => {
    it('rien sous les seuils', () => {
        expect(malusDePeril(JAUGES, { blessures: 4, trauma: 0 })).toEqual({ domaines: 0, talents: 0, etats: [] });
    });

    it('à 8, le seuil de 5 tient toujours : −1 Domaine et −1 Talent', () => {
        expect(malusDePeril(JAUGES, { blessures: 8 })).toEqual({
            domaines: 1, talents: 1, etats: ['Choqué (Blessures)', 'Blessure lourde (Blessures)'],
        });
    });

    it('d’une jauge à l’autre, les malus se cumulent — deux fois Choqué font −2', () => {
        expect(malusDePeril(JAUGES, { blessures: 5, trauma: '6' }).domaines).toBe(2);
    });
});

describe('provoquer le destin', () => {
    it('chaque 8, 9 ou 10 élève le niveau d’un point', () => {
        const j = resoudreLeDestin(2, 4, [8, 10, 3, 9]);
        expect([j.reussites, j.niveauFinal, j.marge, j.degre]).toEqual([3, 5, 1, 'reussite-normale']);
    });

    it('sans dé, le Talent seul contre la difficulté', () => {
        const j = resoudreLeDestin(3, 3, []);
        expect([j.niveauFinal, j.marge, j.degre]).toEqual([3, 0, 'reussite-normale']);
        expect(j.texte).toContain('sans provoquer le destin');
    });

    it('chaque 1 verse une goutte de Fiel, sauf ceux qu’une Singularité annule', () => {
        const j = resoudreLeDestin(1, 3, [1, 1, 1, 8], 2);
        expect([j.uns, j.annules, j.fiel]).toEqual([3, 2, 1]);
        expect(j.texte).toContain('1 goutte de Fiel, 2 annulées par la Singularité');
    });

    it('un seul degré d’échec : échec partiel possible, à la Loi', () => {
        expect(resoudreLeDestin(2, 3, [4]).texte).toMatch(/^Échec d’un degré — échec partiel possible/);
        expect(resoudreLeDestin(0, 3, [4]).texte).toMatch(/^Échec de 3 degrés/);
    });

    it('la Singularité engagée au-delà des 1 ne compte pour rien', () => {
        expect(resoudreLeDestin(1, 1, [8], 3).annules).toBe(0);
    });
});
