import { describe, it, expect } from 'vitest';
import { cretesDepuisLesEchantillons, dureeLisible, debutDuTexte, estDuTexte } from './apercuDesMedias';

describe("l'onde d'un son", () => {
    it('rend une crête par barre, ramenée à la plus haute', () => {
        const ech = new Float32Array([0.1, -0.2, 0.5, -1, 0.25, 0.25]);
        // Des flottants 32 bits : 0,2 y vaut 0,200000003.
        cretesDepuisLesEchantillons(ech, 3).forEach((c, i) => expect(c).toBeCloseTo([0.2, 1, 0.25][i], 5));
    });

    it('un son muet rend des barres nulles, sans diviser par zéro', () => {
        expect(cretesDepuisLesEchantillons(new Float32Array(10), 5)).toEqual([0, 0, 0, 0, 0]);
        expect(cretesDepuisLesEchantillons(new Float32Array(0), 5)).toEqual([]);
    });
});

describe('la durée lisible', () => {
    it('en minutes, puis en heures', () => {
        expect(dureeLisible(42)).toBe('0:42');
        expect(dureeLisible(185)).toBe('3:05');
        expect(dureeLisible(3729)).toBe('1:02:09');
        expect(dureeLisible(Number.NaN)).toBe('');
    });
});

describe("le début d'un document", () => {
    it('garde les lignes, sans la ponctuation du markdown', () => {
        expect(debutDuTexte('## Protocole VK-04\n\n1. La **tortue**\n- un papillon\n', 8))
            .toEqual(['Protocole VK-04', 'La tortue', 'un papillon']);
    });

    it('ne prend que le texte', () => {
        expect(estDuTexte('notes.md')).toBe(true);
        expect(estDuTexte('regles.PDF')).toBe(false);
    });
});
