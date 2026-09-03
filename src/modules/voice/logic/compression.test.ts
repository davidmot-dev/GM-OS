import { describe, it, expect } from 'vitest';
import { reglageDuCompresseur, REGLAGE_D_ORIGINE } from './compression';

describe('reglageDuCompresseur', () => {
    it('à 100, reproduit EXACTEMENT le réglage d’avant le 2026-09-03', () => {
        /*
          La promesse faite à David : rien n'est perdu, le réglage d'origine
          reste atteignable — et comparable d'un coup de curseur.
        */
        expect(reglageDuCompresseur(100)).toEqual(REGLAGE_D_ORIGINE);
    });

    it('à 0, ne compresse rien du tout', () => {
        /* Taux 1 : le nœud est traversé, le seuil devient sans objet. */
        expect(reglageDuCompresseur(0).taux).toBe(1);
    });

    it('durcit tout dans le même sens quand on monte le curseur', () => {
        const positions = [0, 20, 40, 60, 80, 100];
        const reglages = positions.map(reglageDuCompresseur);
        for (let i = 1; i < reglages.length; i++) {
            expect(reglages[i].taux).toBeGreaterThan(reglages[i - 1].taux);
            expect(reglages[i].seuil).toBeLessThan(reglages[i - 1].seuil);
            expect(reglages[i].genou).toBeLessThan(reglages[i - 1].genou);
            expect(reglages[i].attaque).toBeLessThan(reglages[i - 1].attaque);
            expect(reglages[i].relachement).toBeLessThan(reglages[i - 1].relachement);
        }
    });

    it('borne les positions hors course', () => {
        expect(reglageDuCompresseur(-50)).toEqual(reglageDuCompresseur(0));
        expect(reglageDuCompresseur(500)).toEqual(reglageDuCompresseur(100));
    });

    it('rend des valeurs que Web Audio accepte', () => {
        /*
          `DynamicsCompressorNode` refuse un taux sous 1, un genou négatif, une
          attaque négative — et pose une exception à l'affectation. Un curseur
          ne doit pas pouvoir casser la chaîne.
        */
        for (let c = 0; c <= 100; c += 5) {
            const r = reglageDuCompresseur(c);
            expect(r.taux).toBeGreaterThanOrEqual(1);
            expect(r.taux).toBeLessThanOrEqual(20);
            expect(r.seuil).toBeLessThanOrEqual(0);
            expect(r.seuil).toBeGreaterThanOrEqual(-100);
            expect(r.genou).toBeGreaterThanOrEqual(0);
            expect(r.genou).toBeLessThanOrEqual(40);
            expect(r.attaque).toBeGreaterThanOrEqual(0);
            expect(r.attaque).toBeLessThanOrEqual(1);
            expect(r.relachement).toBeGreaterThanOrEqual(0);
            expect(r.relachement).toBeLessThanOrEqual(1);
        }
    });
});
