import { describe, it, expect } from 'vitest';
import {
    actionsDuRound, confrontation, encaisserDegenesis, lancerDegenesis, qualiteDesDeclencheurs,
    reserveDeDegenesis, resoudreDegenesis, soignerDegenesis,
} from './degenesis';

/** Le jet de Degenesis contre les exemples du livre Katharsys (pages imprimées). */

describe('la réserve', () => {
    it('Falberg, INS 2 + Dressage 1 : trois dés (p. 18)', () => {
        expect(reserveDeDegenesis(3, {})).toMatchObject({ valeur: 3, des: 3, automatiques: 0 });
    });

    it('le Garganti, 5 + 6 et +2D avec ses mammouths : 12 dés et un succès d’office (p. 19)', () => {
        expect(reserveDeDegenesis(11, { modificateur: 2 })).toMatchObject({ valeur: 13, des: 12, automatiques: 1 });
    });

    it('Kum et sa côte cassée : un Traumatisme retire un dé (p. 101, 105)', () => {
        expect(reserveDeDegenesis(4, {}, 1)).toMatchObject({ valeur: 3, des: 3, traumatismes: 1 });
    });

    it('Vedran à longue portée : 8D − 4D = 4 dés ; l’Égo ajoute un dé par point (p. 100, 106)', () => {
        expect(reserveDeDegenesis(8, { modificateur: -4 }).des).toBe(4);
        expect(reserveDeDegenesis(8, { ego: 3 }).des).toBe(11);
    });

    it('une réserve négative ne lance rien', () => {
        expect(reserveDeDegenesis(2, { modificateur: -8 })).toMatchObject({ valeur: -6, des: 0, automatiques: 0 });
    });
});

describe('le résultat', () => {
    it('Falberg obtient 2, 4 et 6 : deux succès, une réussite « bien » contre 2 (p. 18-19)', () => {
        const jet = resoudreDegenesis([2, 4, 6], 0, 2);
        expect(jet.degenesis).toMatchObject({ succes: 2, declencheurs: 1, bilan: 'reussite', libelle: 'Réussite bien' });
        expect(jet.tagSuccess).toBe(true);
        expect(jet.totalDisplay).toBe('Réussite bien — 2 succès, 1 déclencheur (difficulté 2)');
    });

    it('le Garganti : six succès lancés et un d’office, quatre déclencheurs — brillant (p. 19)', () => {
        const jet = resoudreDegenesis([6, 6, 6, 6, 4, 5, 1, 2, 3, 3, 2, 1], 1, 2);
        expect(jet.degenesis).toMatchObject({ succes: 7, declencheurs: 4, qualite: 'brillant' });
        expect(jet.degre).toBe('reussite-particuliere');
    });

    it('les déclencheurs ne comptent que sur une réussite (p. 19)', () => {
        const jet = resoudreDegenesis([6, 2, 3], 0, 4);
        expect(jet.degenesis).toMatchObject({ succes: 1, declencheurs: 0, six: 1, bilan: 'echec' });
    });

    it('échec critique : un échec, et plus de 1 que de succès (p. 19)', () => {
        expect(resoudreDegenesis([1, 1, 3], 0, 2).degenesis.bilan).toBe('echec-critique');
        expect(resoudreDegenesis([1, 4, 2], 0, 2).degenesis.bilan).toBe('echec');
        // Une réussite n'est jamais critique, même couverte de 1.
        expect(resoudreDegenesis([1, 1, 1, 4], 0, 1).degenesis.bilan).toBe('reussite');
    });

    it('lance autant de d6 que la réserve en a', () => {
        let n = 0;
        const jet = lancerDegenesis({ des: 5, automatiques: 0 }, 2, () => (n++ % 6) + 1);
        expect(jet.degenesis.des).toEqual([1, 2, 3, 4, 5]);
        expect(jet.degenesis.succes).toBe(2);
    });

    it('les déclencheurs se lisent sur l’échelle du livre, légendaire au-delà de six (p. 19)', () => {
        expect(qualiteDesDeclencheurs(0)).toBeUndefined();
        expect(qualiteDesDeclencheurs(2)).toBe('remarquable');
        expect(qualiteDesDeclencheurs(9)).toBe('légendaire');
    });
});

describe('la confrontation et l’initiative', () => {
    it('Falberg contre l’Apocalyptique : trois succès chacun, le déclencheur départage (p. 20)', () => {
        expect(confrontation({ succes: 3, six: 1 }, { succes: 3, six: 0 })).toBe('a');
        expect(confrontation({ succes: 2, six: 2 }, { succes: 3, six: 0 })).toBe('b');
        expect(confrontation({ succes: 3, six: 1 }, { succes: 3, six: 1 })).toBe('egalite');
    });

    it('Vedran, cinq succès et deux déclencheurs : deux actions ce round (p. 101)', () => {
        expect(actionsDuRound(0)).toBe(1);
        expect(actionsDuRound(2)).toBe(2);
        expect(actionsDuRound(5)).toBe(3);
    });
});

describe('la santé', () => {
    it('l’Usudi, PHY+Résistance 4 : 10 dégâts remplissent ses 8 Blessures et font 2 Traumatismes (p. 107)', () => {
        const s = encaisserDegenesis(10, { blessures: 0, traumatismes: 0 }, { blessures: 8, traumatismes: 6 });
        expect(s).toMatchObject({ blessures: 8, traumatismes: 2, retenus: 10, perdus: 0, mort: false });
    });

    it('Falberg, 8 dégâts moins 3 d’armure : cinq Blessures superficielles (p. 108)', () => {
        expect(encaisserDegenesis(5, { blessures: 0, traumatismes: 0 }, { blessures: 10, traumatismes: 7 }))
            .toMatchObject({ blessures: 5, traumatismes: 0, retenus: 5 });
    });

    it('les Traumatismes au maximum : le personnage ne peut plus être sauvé (p. 107)', () => {
        const s = encaisserDegenesis(9, { blessures: 7, traumatismes: 3 }, { blessures: 8, traumatismes: 6 });
        expect(s).toMatchObject({ blessures: 8, traumatismes: 6, retenus: 4, perdus: 5, mort: true });
    });

    it('le soin efface les Blessures superficielles, pas les Traumatismes', () => {
        expect(soignerDegenesis(5, 3)).toEqual({ blessures: 0, rendus: 3 });
    });
});
