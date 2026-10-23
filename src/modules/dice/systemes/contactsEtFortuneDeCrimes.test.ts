import { describe, it, expect } from 'vitest';
import { loyauteActuelle, mouvementDeFortune, pertePsychotique, testDeLoyaute } from './contactsEtFortuneDeCrimes';

/** **Contacts et fortune de Crimes** — C7, livre p. 428-431. */
describe('les contacts', () => {
    it('un appel retire un point pour le scénario, la base reste', () => {
        expect(loyauteActuelle({ base: 3, appels: 1 })).toBe(2);
        expect(loyauteActuelle({ base: 1, appels: 3 })).toBe(0);
    });
    it('au-delà de la loyauté : Social GARDE X, X le niveau du contact (p. 429)', () => {
        expect(testDeLoyaute({ base: 3 })).toBe('Social GARDE 3');
    });
    it('perdre un contact d’au moins 3 coûte un point de psychose (p. 430)', () => {
        expect(pertePsychotique({ base: 3 })).toBe(true);
        expect(pertePsychotique({ base: 2 })).toBe(false);
    });
});

describe('la fortune', () => {
    it('un achat retire un point, une rétribution en ajoute un', () => {
        expect(mouvementDeFortune(2, 4, -1)).toMatchObject({ niveau: 2, jauge: 3 });
        expect(mouvementDeFortune(2, 4, 1)).toMatchObject({ niveau: 2, jauge: 5 });
    });
    it('la jauge au seuil fait monter le niveau ; à zéro, descendre ; elle repart à la moitié', () => {
        expect(mouvementDeFortune(2, 9, 1)).toMatchObject({ niveau: 3, jauge: 5, change: 'monte' });
        expect(mouvementDeFortune(2, 1, -1)).toMatchObject({ niveau: 1, jauge: 5, change: 'descend' });
        expect(mouvementDeFortune(2, 5, 1, 6)).toMatchObject({ niveau: 3, jauge: 3 });
    });
    it('ni au-dessus de 4, ni sous 1', () => {
        expect(mouvementDeFortune(4, 9, 1)).toMatchObject({ niveau: 4, jauge: 10 });
        expect(mouvementDeFortune(1, 1, -1)).toMatchObject({ niveau: 1, jauge: 0 });
        expect(mouvementDeFortune(1, 1, -1).change).toBeUndefined();
    });
});
