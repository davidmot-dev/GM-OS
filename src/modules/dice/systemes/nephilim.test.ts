import { describe, it, expect } from 'vitest';
import { cibleDeNephilim } from './nephilim';
import { MECANIQUES_DE_CIBLE } from './index';
import { degreDuDe, margeDuJet } from '../degresDeReussite';

/**
 * **Le jet de Nephilim Légende** — corpus du jeu, « Résolution des jets » :
 * (Vécu + Ka ± circonstances) × 10 sur un d100, les doubles décident, la marge
 * se lit sur les dizaines.
 */
describe('la cible de Nephilim', () => {
    it('Vécu 4 et Ka 5 : 90 %, et non 9', () => {
        const c = cibleDeNephilim(4, 5);
        expect(c.chances).toBe(90);
        expect(c.explication).toBe('(4 + 5) × 10 = 90 %');
    });

    it('sans approche ni circonstance, le Vécu seul', () => {
        expect(cibleDeNephilim(6, 0).explication).toBe('6 × 10 = 60 %');
    });

    it('un malus de circonstances retire des degrés, jamais sous zéro', () => {
        expect(cibleDeNephilim(3, -2).chances).toBe(10);
        expect(cibleDeNephilim(2, -5).chances).toBe(0);
    });

    it('au-delà de dix degrés, le surplus va à la marge', () => {
        const c = cibleDeNephilim(8, 5);
        expect(c.chances).toBe(130);
        expect(c.echelle.bonusDeMarge).toBe(3);
        expect(c.remarques[0]).toContain('+3 à la marge');
    });

    it('est inscrite au registre des mécaniques', () => {
        expect(MECANIQUES_DE_CIBLE.nephilim(4, 5).chances).toBe(90);
    });
});

describe('les doubles et la marge', () => {
    const echelle = cibleDeNephilim(4, 2).echelle; // 60 %

    it('un double réussi est critique, un double raté une maladresse', () => {
        expect(degreDuDe(44, echelle)).toBe('reussite-particuliere');
        expect(degreDuDe(77, echelle)).toBe('echec-total');
    });

    it('le « 00 » échoue toujours, en maladresse — même au-delà de cent', () => {
        expect(degreDuDe(100, echelle)).toBe('echec-total');
        expect(degreDuDe(100, cibleDeNephilim(9, 5).echelle)).toBe('echec-total');
    });

    it('sans double, une réussite ou un échec ordinaires', () => {
        expect(degreDuDe(37, echelle)).toBe('reussite-normale');
        expect(degreDuDe(60, echelle)).toBe('reussite-normale');
        expect(degreDuDe(61, echelle)).toBe('echec-normal');
    });

    it('la marge : le dé des dizaines, plus les degrés au-delà de dix', () => {
        expect(margeDuJet(37, echelle)).toBe(3);
        expect(margeDuJet(5, echelle)).toBe(0);
        expect(margeDuJet(61, echelle)).toBeNull();
        expect(margeDuJet(42, cibleDeNephilim(8, 5).echelle)).toBe(7);
    });

    it('une échelle sans marge n’en dit pas', () => {
        expect(margeDuJet(37, { ...echelle, bonusDeMarge: undefined })).toBeNull();
    });
});

describe('le d100 de Nephilim, lancé par le moteur', () => {
    it('le résultat dit la marge d’une réussite, et seulement d’une réussite', async () => {
        const { DiceEngine } = await import('../DiceEngine');
        const { vi } = await import('vitest');
        const c = cibleDeNephilim(4, 2);
        // Le d100 se tire en deux chiffres : les dizaines, puis les unités.
        const lancer = vi.spyOn(Math, 'random');
        lancer.mockReturnValueOnce(0.35).mockReturnValueOnce(0.75);
        const reussi = DiceEngine.rollThreshold(100, 1, 0, c.chances, 'under', c.echelle);
        expect(reussi.degre).toBe('reussite-normale');
        expect(reussi.totalDisplay).toBe('37 vs 60 — marge 3');
        lancer.mockReturnValueOnce(0.75).mockReturnValueOnce(0.75);
        const rate = DiceEngine.rollThreshold(100, 1, 0, c.chances, 'under', c.echelle);
        expect(rate.degre).toBe('echec-total');
        expect(rate.totalDisplay).toBe('77 vs 60');
        lancer.mockRestore();
    });
});
