import { describe, it, expect } from 'vitest';
import { bonusDeTorg, lancerLeDeDeTorg, resoudreLeJetDeTorg, direLeJetDeTorg, lancerLaPossibilite, lancerUneChaine, resoudreTorg, direTorg, ceQueLAnnulationAnnule } from './torg';

/**
 * Les valeurs viennent de la Table des Bonus (livre de base, p. 109, transcrite
 * depuis le carnet NotebookLM « Torg ») et de
 * `docs/systems/torg/rules/resolution-des-jets.md`.
 */
describe('la Table des Bonus', () => {
    it.each([
        [2, -8], [3, -6], [4, -6], [5, -4], [6, -4], [7, -2], [8, -2], [9, -1], [10, -1],
        [11, 0], [12, 0], [13, 1], [14, 1], [15, 2], [16, 3], [17, 4], [18, 5], [19, 6], [20, 7],
    ])('un total de %i donne %i', (total, bonus) => {
        expect(bonusDeTorg(total)).toBe(bonus);
    });

    it('au-delà de 20, +1 par tranche de cinq', () => {
        expect([21, 25, 26, 30, 31, 46, 50, 51, 55].map(bonusDeTorg)).toEqual([8, 8, 9, 9, 10, 13, 13, 14, 14]);
    });
});

/** Un dé truqué, qui rend les faces données dans l'ordre. */
const truque = (...faces: number[]) => () => faces.shift()!;

describe('le dé qui explose', () => {
    it('sur 10 et sur 20, on relance et on cumule', () => {
        expect(lancerLeDeDeTorg(truque(10, 20, 4))).toEqual([10, 20, 4]);
    });
    it('sinon, un seul dé', () => {
        expect(lancerLeDeDeTorg(truque(13, 20))).toEqual([13]);
    });
    it('un 1 au premier dé ne se relance pas', () => {
        expect(lancerLeDeDeTorg(truque(1, 20))).toEqual([1]);
    });
});

describe('le total d’action contre le Niveau de Difficulté', () => {
    it('égal au ND : Succès Simple', () => {
        // Niveau 10, dé 11 → bonus 0 → total 10 contre ND 10.
        const j = resoudreLeJetDeTorg(10, 10, [11]);
        expect([j.totalDAction, j.marge, j.nom, j.degre]).toEqual([10, 0, 'Succès Simple', 'reussite-normale']);
    });

    it('cinq à neuf au-dessus : Succès Supérieur ; dix et plus : Spectaculaire', () => {
        expect(resoudreLeJetDeTorg(12, 10, [17]).nom).toBe('Succès Supérieur');      // 12 + 4 = 16, marge 6
        expect(resoudreLeJetDeTorg(12, 10, [10, 13]).nom).toBe('Succès Spectaculaire'); // dé 23 → +8, 20, marge 10
    });

    it('sous le ND : Échec', () => {
        const j = resoudreLeJetDeTorg(10, 12, [9]);
        expect([j.totalDAction, j.nom, j.degre]).toEqual([9, 'Échec', 'echec-normal']);
    });

    it('un 1 au premier dé : Échec critique, quel que soit le niveau', () => {
        const j = resoudreLeJetDeTorg(30, 6, [1]);
        expect([j.echecCritique, j.nom, j.degre]).toEqual([true, 'Échec critique', 'echec-total']);
    });

    it('se dit en une ligne, explosion comprise', () => {
        expect(direLeJetDeTorg(resoudreLeJetDeTorg(12, 10, [10, 13]), 12, 10))
            .toBe("Succès Spectaculaire — dé 10 + 13 = 23 → bonus +8 ; total d'action 20 (niveau 12) contre ND 10, marge +10");
    });
});

describe('les dés d’après coup', () => {
    it('la Possibilité : un 1 à 9 vaut 10, sans relance ; un 10 naturel explose', () => {
        expect(lancerLaPossibilite(truque(3, 20))).toEqual([10]);
        expect(lancerLaPossibilite(truque(10, 4))).toEqual([10, 4]);
    });

    it('sans entraînement, le 20 n’explose pas — le 10, si', () => {
        expect(lancerUneChaine(truque(20, 5), false)).toEqual([20]);
        expect(lancerUneChaine(truque(10, 5), false)).toEqual([10, 5]);
    });

    it('le total du dé réunit le premier, la Possibilité et « Un de plus ! »', () => {
        const j = resoudreTorg(8, 10, { premier: [7], possibilite: [10] });
        expect([j.totalDuDe, j.bonus, j.totalDAction, j.nom]).toEqual([17, 4, 12, 'Succès Simple']);
    });

    it('le malus de Blessures et la plage critique', () => {
        expect(resoudreTorg(10, 10, { premier: [13] }, { malus: 2 }).totalDAction).toBe(9);
        expect(resoudreTorg(30, 6, { premier: [3] }, { plageCritique: 4 }).echecCritique).toBe(true);
        expect(resoudreTorg(30, 6, { premier: [3] }).echecCritique).toBe(false);
    });
});

/** Les Lois du Monde qui touchent le jet (carnet « Torg », livre p. 42 et 55). */
describe('les Lois du Monde au jet', () => {
    it('Loi de l’Action : la meilleure des deux Possibilités compte', () => {
        const des = { premier: [8], possibilite: [10, 3], possibiliteDeLAction: [17] };
        const j = resoudreTorg(10, 10, des);
        expect(j.totalDuDe).toBe(25);
        expect(direTorg(j, des, 10, 10)).toContain("Possibilité 17 (Loi de l'Action : 10 + 3 ou 17)");
    });

    it('Loi de l’Action : une seconde Possibilité plus faible ne retire rien', () => {
        expect(resoudreTorg(10, 10, { premier: [8], possibilite: [15], possibiliteDeLAction: [10, 2] }).totalDuDe).toBe(23);
    });

    it('Loi de la Persévérance : Simple n’annule plus de Blessure, Supérieur une seule', () => {
        expect(ceQueLAnnulationAnnule({ degre: 'reussite-normale' }, { perseverance: true })).toMatch(/aucune Blessure/);
        expect(ceQueLAnnulationAnnule({ degre: 'reussite-significative' }, { perseverance: true })).toMatch(/^annule 1 Blessure/);
        expect(ceQueLAnnulationAnnule({ degre: 'reussite-particuliere' }, { perseverance: true })).toMatch(/toutes les Blessures/);
        expect(ceQueLAnnulationAnnule({ degre: 'reussite-significative' })).toMatch(/^annule 2 Blessures/);
    });
});

describe('la Loi de la Magie au jet', () => {
    it('le Choc volontaire s’ajoute au total d’action, et se dit', () => {
        const des = { premier: [13] };
        const j = resoudreTorg(11, 10, des, { bonus: 3, raisonDuBonus: 'Choc volontaire (Loi de la Magie)' });
        expect(j.totalDAction).toBe(15);
        expect(direTorg(j, des, 11, 10, { bonus: 3, raisonDuBonus: 'Choc volontaire (Loi de la Magie)' }))
            .toContain('niveau 11, +3 Choc volontaire (Loi de la Magie)');
    });
});
