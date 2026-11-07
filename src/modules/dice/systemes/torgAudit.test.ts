import { describe, expect, it } from 'vitest';
import { resoudreTorg, direTorg } from './torg';

describe('Torg : page 109 relue en image', () => {
    it('sur 3 dans une plage 1–4, le niveau peut réussir avec sa conséquence critique', () => {
        const des = { premier: [3] }, options = { plageCritique: 4 };
        const jet = resoudreTorg(20, 10, des, options);
        expect(jet.degre).toBe('reussite-normale');
        expect(jet.echecCritique).toBe(true);
        expect(direTorg(jet, des, 20, 10, options)).toContain('conséquence critique');
    });
    it('une Possibilité rattrape un 2, sans effacer la conséquence critique', () => {
        const jet = resoudreTorg(12, 10, { premier: [2], possibilite: [10] }, { plageCritique: 4 });
        expect(jet.degre).toBe('reussite-normale');
        expect(jet.echecCritique).toBe(true);
    });
    it('un 1 reste un échec automatique malgré le niveau et les dés ajoutés', () => {
        expect(resoudreTorg(30, 10, { premier: [1], possibilite: [30] }).degre).toBe('echec-total');
    });
});
