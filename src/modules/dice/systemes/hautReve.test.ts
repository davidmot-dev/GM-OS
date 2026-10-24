import { describe, expect, it } from 'vitest';
import { bandesAvecBonusDeCase } from './revesDeDragons';
import {
    QUEUES_DE_DRAGON, SOUFFLES_DE_DRAGON, TETES_DE_DRAGON, coutDuSort, d7DeRencontre, ddr, effetDuD100, jetDeMaitrise,
    limiteDeReserve, rencontreDuD100, testDeRefoulement, voieNommee,
} from './hautReve';

describe('Le Haut-Rêve (Livre du Haut-Rêve 2.3.1, p. 181–210)', () => {
    it('lit la table des rencontres par genre de terre, colonnes relues sur la page', () => {
        expect(rencontreDuD100('desert', 55).id).toBe('changeur'); // l'exemple de Nitouche, p. 193
        expect(rencontreDuD100('pont', 41).id).toBe('fleur'); // plaines et ponts partagent leur colonne
        expect(rencontreDuD100('cite', 41).id).toBe('passeur');
        expect(rencontreDuD100('marais', 5).id).toBe('fleur');
        expect(rencontreDuD100('desolation', 1).id).toBe('mangeur');
        expect(rencontreDuD100('necropole', 100).id).toBe('reve-de-dragon');
    });

    it('le d7 relance les 8, seul le 7 amène une rencontre ; le ddr ajoute les 7', () => {
        expect(d7DeRencontre([8, 8, 7])).toEqual({ valeur: 7, rencontre: true });
        expect(d7DeRencontre([4]).rencontre).toBe(false);
        expect(() => d7DeRencontre([7, 3])).toThrow();
        expect(ddr([7, 5])).toBe(12);
        expect(ddr([0])).toBe(0);
        expect(() => ddr([7])).toThrow();
    });

    it('reproduit les maîtrises de l’exemple général (p. 193–194)', () => {
        expect(jetDeMaitrise(13, 3, 9).chances).toBe(26); // Changeur 9
        expect(jetDeMaitrise(13, 3, 4).chances).toBe(58); // Tourbillon blanc 4
        expect(jetDeMaitrise(10, 3, 7).chances).toBe(30); // le Fleuve
        expect(jetDeMaitrise(9, 3, 2, -1).chances).toBe(45); // Passeur 2, état général −1
    });

    it('le test de refoulement exige un d20 supérieur au compteur', () => {
        expect(testDeRefoulement(3, 4)).toEqual({ souffle: false, points: 3 });
        expect(testDeRefoulement(3, 3)).toEqual({ souffle: true, points: 0 });
    });

    it('le coût d’un sort selon le jet', () => {
        expect(coutDuSort(7, 'reussite-normale')).toBe(7);
        expect(coutDuSort(7, 'reussite-particuliere')).toBe(3);
        expect(coutDuSort(1, 'reussite-particuliere')).toBe(1);
        expect(coutDuSort(7, 'echec-total')).toBe(10);
        expect(coutDuSort(7, 'echec-particulier')).toBe(0);
    });

    it('le bonus de case s’ajoute avant les résultats spéciaux (Tympan d’Hypnos, p. 209)', () => {
        const jet = bandesAvecBonusDeCase(15, -2, 8);
        expect(jet.chances).toBe(68);
        expect(jet.particuliere).toBe(14);
        expect(jet.echecTotal).toBe(98);
    });

    it('tire dans les tables de queues, souffles et têtes', () => {
        expect(effetDuD100(QUEUES_DE_DRAGON, 72).nom).toBe('Désir lancinant');
        expect(effetDuD100(QUEUES_DE_DRAGON, 100).nom).toBe('Idée fixe');
        expect(effetDuD100(SOUFFLES_DE_DRAGON, 89).nom).toBe('Queue de Dragon perpétuelle');
        expect(effetDuD100(TETES_DE_DRAGON, 1).nom).toBe('Augmentation de caractéristique');
        for (const table of [QUEUES_DE_DRAGON, SOUFFLES_DE_DRAGON, TETES_DE_DRAGON]) {
            for (let d = 1; d <= 100; d++) expect(effetDuD100(table, d)).toBeDefined();
        }
    });

    it('la réserve tient autant de sorts que le niveau de la voie', () => {
        expect(limiteDeReserve(3)).toBe(3);
        expect(limiteDeReserve(-2)).toBe(0);
        expect(voieNommee('Hypnos')?.champ).toBe('hypnos');
        expect(voieNommee('oniros')?.champ).toBe('onrios');
        expect(voieNommee('Feu')).toBeNull();
    });
});
