import { describe, it, expect } from 'vitest';
import { partagerEquitablement, estUneMonnaie } from './partageDuButin';

describe('partager une monnaie du butin', () => {
    it('donne une part entière à chacun, et garde le reste', () => {
        expect(partagerEquitablement(450, 4)).toEqual({ part: 112, reste: 2 });
    });

    it('ne laisse rien quand la division tombe juste', () => {
        expect(partagerEquitablement(300, 3)).toEqual({ part: 100, reste: 0 });
    });

    it('refuse un partage où chacun recevrait zéro', () => {
        expect(partagerEquitablement(3, 4)).toBeNull();
    });

    it('refuse un partage sans personne', () => {
        expect(partagerEquitablement(450, 0)).toBeNull();
    });

    it('ne coupe pas une quantité en morceaux', () => {
        expect(partagerEquitablement(10.7, 3)).toEqual({ part: 3, reste: 1 });
    });
});

describe('ce qui se partage', () => {
    it('la monnaie, et elle seule', () => {
        expect(estUneMonnaie('currency')).toBe(true);
        expect(estUneMonnaie('weapon')).toBe(false);
        expect(estUneMonnaie(undefined)).toBe(false);
    });
});
