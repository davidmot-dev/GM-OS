import { describe, it, expect } from 'vitest';
import {
    appliquerLeGeste, deuxDesGardes, gesteOffert, lancerBarbarians, modificateursDeBarbarians,
    nombreDeDesDeBarbarians, resoudreBarbarians, soldeDesDes, CHOIX_DE_BARBARIANS,
} from './barbarians';

/** Les exemples du livre (pages imprimées). */
describe('le jet d’action de Barbarians of Lemuria', () => {
    it('Krongar brise la porte : 10 + Vigueur 3 − 1 (Ardue) = 12, réussi (p. 57)', () => {
        const jet = resoudreBarbarians([4, 6], 0, modificateursDeBarbarians(3, { ...CHOIX_DE_BARBARIANS, difficulte: -1 }));
        expect(jet.barbarians).toMatchObject({ naturel: 10, resultat: 12, bilan: 'reussite' });
        expect(jet.tagSuccess).toBe(true);
        expect(jet.degre).toBe('reussite-normale');
    });

    it('le saut de la fosse : 6 + Agilité 1 + Barbare 2 = 9, tout juste (p. 57)', () => {
        expect(resoudreBarbarians([2, 4], 0, 3).barbarians.bilan).toBe('reussite');
        expect(resoudreBarbarians([2, 3], 0, 3).barbarians.bilan).toBe('echec');
    });

    it('le dé de bonus garde les deux meilleurs : 1, 2, 5 → 7, et la Défense se retire (p. 62)', () => {
        const jet = resoudreBarbarians([1, 2, 5], 1, modificateursDeBarbarians(1 + 2, { ...CHOIX_DE_BARBARIANS, opposition: 1 }));
        expect(jet.barbarians).toMatchObject({ gardes: [1, 2], naturel: 7, resultat: 9, bilan: 'reussite' });
        expect(jet.rolls.map(d => d.isDropped)).toEqual([true, false, false]);
    });

    it('le dé de malus garde les deux pires ; bonus et malus s’annulent un à un (p. 8, 17)', () => {
        expect(deuxDesGardes([6, 2, 5], -1)).toEqual([1, 2]);
        expect(deuxDesGardes([1, 6, 2, 5], -2)).toEqual([0, 2]);
        expect(soldeDesDes(1, 1)).toBe(0);
        expect(nombreDeDesDeBarbarians(2, 0)).toBe(4);
        expect(nombreDeDesDeBarbarians(1, 3)).toBe(4);
    });

    it('un double 6 réussit toujours et vaut un succès héroïque ; un double 1 échoue toujours (p. 56-57)', () => {
        expect(resoudreBarbarians([6, 6], 0, -2).barbarians.bilan).toBe('succes-heroique');
        expect(resoudreBarbarians([1, 1], 0, 12).barbarians.bilan).toBe('echec-automatique');
        expect(resoudreBarbarians([1, 1], 0, 12).tagSuccess).toBe(false);
    });

    it('une action qui ne réussit que sur un double 6 : réussite, sans succès héroïque (p. 56)', () => {
        const jet = resoudreBarbarians([6, 6], 0, -3 - 1);
        expect(jet.barbarians).toMatchObject({ seulementSurDoubleSix: true, bilan: 'reussite' });
        expect(gesteOffert(jet.barbarians, 'heroique')).toBe(false);
    });

    it('1 point d’héroïsme : une réussite devient héroïque, un double 6 héroïque devient légendaire (p. 59)', () => {
        const simple = resoudreBarbarians([5, 5], 0, 0);
        expect(gesteOffert(simple.barbarians, 'legendaire')).toBe(false);
        const heroique = appliquerLeGeste(simple, 'heroique');
        expect(heroique.barbarians.bilan).toBe('succes-heroique');
        // On ne monte pas une réussite achetée jusqu'au légendaire.
        expect(gesteOffert(heroique.barbarians, 'legendaire')).toBe(false);
        const double = resoudreBarbarians([6, 6], 0, 0);
        expect(appliquerLeGeste(double, 'legendaire').degre).toBe('reussite-particuliere');
    });

    it('le double 1 se change en échec critique, au choix du joueur (p. 57)', () => {
        const jet = appliquerLeGeste(resoudreBarbarians([1, 1], 0, 2), 'critique');
        expect(jet.barbarians.bilan).toBe('echec-critique');
        expect(jet.degre).toBe('echec-total');
        expect(appliquerLeGeste(resoudreBarbarians([2, 1], 0, 2), 'critique').barbarians.bilan).toBe('echec');
    });

    it('le jet de réaction de Krongar : 11 + Initiative 1 − Initiative adverse 1 = 11 (p. 61)', () => {
        const jet = resoudreBarbarians([5, 6], 0, modificateursDeBarbarians(0 + 1, { ...CHOIX_DE_BARBARIANS, opposition: 1, reaction: true }));
        expect(jet.barbarians.resultat).toBe(11);
    });

    it('lance autant de dés que le solde le demande', () => {
        const des = [3, 4, 2, 6];
        let i = 0;
        const jet = lancerBarbarians(-2, 0, () => des[i++]);
        expect(jet.barbarians.des).toEqual(des);
        expect(jet.barbarians.naturel).toBe(5);
    });
});
