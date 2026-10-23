import { describe, it, expect } from 'vitest';
import { agirEnAdulte, agirEnEnfant, nevroseDuJet, resoudreLeTestPsychotique, seuilPsychotique } from './psychologieDeCrimes';
import { resoudreLaGarde } from './potentielGarde';

/** **La psychologie de Crimes** — C4, livre p. 409-416. */
describe('la Névrose d’un jet', () => {
    it('échec +1 ; réussites non gardées +1 ; succès important −1 (p. 409)', () => {
        expect(nevroseDuJet(resoudreLaGarde([3, 5, 8], 1, 9).garde)).toBe(1);
        expect(nevroseDuJet(resoudreLaGarde([9, 9, 3], 1, 8).garde)).toBe(1);
        expect(nevroseDuJet(resoudreLaGarde([9, 9, 9], 3, 8).garde)).toBe(-1);
        expect(nevroseDuJet(resoudreLaGarde([9, 3], 1, 8).garde)).toBe(0);
    });
});

describe('le test psychotique (p. 410)', () => {
    it('le seuil vaut psychose + angoisse, entre 2 et 10', () => {
        expect(seuilPsychotique(3, 2)).toBe(5);
        expect(seuilPsychotique(9, 4)).toBe(10);
        expect(seuilPsychotique(0, 0)).toBe(2);
    });
    it('une seule réussite garde le calme ; sinon, la folie et un point de psychose', () => {
        expect(resoudreLeTestPsychotique([6, 2, 3], 1, 3, 2)).toMatchObject({ seuil: 5, calme: true });
        expect(resoudreLeTestPsychotique([4, 2, 3], 1, 3, 2).calme).toBe(false);
        // Des 1 qui l'emportent : échec critique, pas de calme.
        expect(resoudreLeTestPsychotique([1, 1, 9], 2, 3, 2).calme).toBe(false);
    });
});

describe('l’Innocence (p. 415)', () => {
    it('André, score et seuil 7, agit en adulte : 6 et 6, et un Potentiel gagne un point', () => {
        expect(agirEnAdulte(7, 7)).toMatchObject({ score: 6, seuil: 6 });
        expect(agirEnAdulte(5, 7)).toMatchObject({ score: 5, seuil: 6 });
    });
    it('André, score et seuil 6, agit en enfant : seuil 7, score 6, et un Potentiel perd un point', () => {
        expect(agirEnEnfant(6, 6)).toMatchObject({ score: 6, seuil: 7, potentiel: expect.stringMatching(/perd un point/) });
        expect(agirEnEnfant(4, 6).potentiel).toBeUndefined();
    });
});
