import { describe, it, expect } from 'vitest';
import { consequenceImmediate, decrireLaDose, exposer, perteCumulee, prochainSeuil } from './radiationsDeTraveller';

/** TRV-A5, T4 (27/11/2026) — C8 et C9 : la table des Conséquences des radiations, p. 78. */
describe('les radiations de Traveller (p. 78)', () => {
    it('conséquences immédiates, palier par palier', () => {
        expect(consequenceImmediate(50)).toBeNull();
        expect(consequenceImmediate(51)).toMatchObject({ des: 1 });
        expect(consequenceImmediate(150)?.texte).toContain('nausée');
        expect(consequenceImmediate(151)).toEqual({ des: 2, texte: '2D de dégâts' });
        expect(consequenceImmediate(500)).toMatchObject({ des: 4 });
        expect(consequenceImmediate(800)).toMatchObject({ des: 6 });
        expect(consequenceImmediate(2000)).toMatchObject({ des: 8 });
    });

    it('END permanente perdue selon le cumul, et le prochain seuil', () => {
        expect([150, 151, 300, 301, 501, 801].map(perteCumulee)).toEqual([0, 1, 1, 2, 3, 4]);
        expect(prochainSeuil(95)).toEqual({ seuil: 151, perte: 1 });
        expect(prochainSeuil(400)).toEqual({ seuil: 501, perte: 3 });
        expect(prochainSeuil(900)).toBeNull();
    });

    it('l’exemple du livre : 75 rads, puis une éruption de 20 → 95, rien de cumulé', () => {
        expect(exposer(75, 20)).toEqual({ total: 95, immediate: null, endPermanente: 0 });
        expect(decrireLaDose(95)).toBe('95 rads — cumul : aucune conséquence ; à 151 rads, −1 END permanent (p. 78)');
    });

    it('une arme à rayonnement (2D × 20 = 160) : 2D de dégâts, et le seuil de 151 franchi depuis 95', () => {
        expect(exposer(95, 160)).toEqual({ total: 255, immediate: { des: 2, texte: '2D de dégâts' }, endPermanente: 1 });
        // Un seuil déjà payé ne se repaie pas ; deux seuils d'un coup coûtent deux points.
        expect(exposer(255, 50).endPermanente).toBe(1); // 305 : le seuil de 301.
        expect(exposer(255, 40).endPermanente).toBe(0); // 295 : rien de neuf.
        expect(exposer(100, 450).endPermanente).toBe(3); // 550 : trois seuils d'un coup.
    });
});
