import { describe, it, expect } from 'vitest';
import {
    plageValide,
    positionDeDepart,
    delaiAvantLaSortie,
    sortieAtteinte,
    PLAGE_MINIMALE_SEC
} from './plageDeLecture';

/**
 * **Ce qui est gardé ici, c'est le refus.**
 *
 * Une plage acceptée alors qu'elle ne veut rien dire ne se signale pas : elle
 * fait jouer trois secondes d'un morceau de six minutes, en boucle, sans
 * message. C'est le genre de défaut qui ne se voit **qu'en séance**.
 */

describe('plageValide', () => {
    it('accepte un couple ordonné', () => {
        expect(plageValide(10, 60)).toEqual({ entree: 10, sortie: 60 });
    });

    it.each([
        ['les deux points absents', null, null],
        ['une entrée seule', 10, null],
        ['une sortie seule', null, 60],
        ['une entrée indéfinie', undefined, 60]
    ])('refuse %s — une plage à moitié posée n\'est pas une plage', (_cas, a, b) => {
        expect(plageValide(a as number | null, b as number | null)).toBeNull();
    });

    it('refuse une plage à l\'envers', () => {
        expect(plageValide(60, 10)).toBeNull();
    });

    it('refuse une plage plus courte que le minimum — sinon la boucle se rembobine sans fin', () => {
        expect(plageValide(10, 10 + PLAGE_MINIMALE_SEC / 2)).toBeNull();
        expect(plageValide(10, 10 + PLAGE_MINIMALE_SEC)).toEqual({ entree: 10, sortie: 10 + PLAGE_MINIMALE_SEC });
    });

    it('refuse NaN et Infinity — `audioElement.duration` vaut NaN avant les métadonnées', () => {
        expect(plageValide(NaN, 60)).toBeNull();
        expect(plageValide(10, Infinity)).toBeNull();
    });

    it('ramène une entrée négative à zéro', () => {
        expect(plageValide(-5, 60)).toEqual({ entree: 0, sortie: 60 });
    });

    it('valide sans durée connue — les métadonnées ne sont pas encore lues au chargement', () => {
        expect(plageValide(10, 60, undefined)).toEqual({ entree: 10, sortie: 60 });
        expect(plageValide(10, 60, NaN)).toEqual({ entree: 10, sortie: 60 });
        expect(plageValide(10, 60, 0)).toEqual({ entree: 10, sortie: 60 });
    });

    it('borne la sortie à la durée — le cas du morceau remplacé sous un pad qui gardait ses points', () => {
        expect(plageValide(10, 600, 120)).toEqual({ entree: 10, sortie: 120 });
    });

    it('refuse quand l\'entrée tombe après la fin du morceau', () => {
        expect(plageValide(300, 600, 120)).toBeNull();
    });

    it('refuse quand le bornage rend la plage trop courte', () => {
        // Sortie ramenée à 120 : il ne reste que 0,1 s de plage.
        expect(plageValide(119.9, 600, 120)).toBeNull();
    });
});

describe('positionDeDepart', () => {
    const plage = { entree: 10, sortie: 60 };

    it('amène à l\'entrée quand la tête est avant la plage', () => {
        expect(positionDeDepart(0, plage)).toBe(10);
    });

    it('amène à l\'entrée quand la tête est après la plage', () => {
        expect(positionDeDepart(90, plage)).toBe(10);
    });

    it('respecte une position déjà dans la plage — le meneur s\'y est placé exprès', () => {
        expect(positionDeDepart(30, plage)).toBeNull();
        expect(positionDeDepart(10, plage)).toBeNull();
    });

    it('considère la sortie comme hors plage', () => {
        expect(positionDeDepart(60, plage)).toBe(10);
    });

    it('ne fait rien sans plage', () => {
        expect(positionDeDepart(30, null)).toBeNull();
    });
});

describe('delaiAvantLaSortie', () => {
    const plage = { entree: 10, sortie: 60 };

    it('rend le temps restant en millisecondes', () => {
        expect(delaiAvantLaSortie(30, plage)).toBe(30_000);
    });

    it('garde un pas minimal — sans quoi un rendez-vous immédiat se replanifie sans fin', () => {
        expect(delaiAvantLaSortie(60, plage)).toBe(10);
        expect(delaiAvantLaSortie(120, plage)).toBe(10);
    });

    it('ne rend rien sans plage', () => {
        expect(delaiAvantLaSortie(30, null)).toBeNull();
    });
});

describe('sortieAtteinte', () => {
    const plage = { entree: 10, sortie: 60 };

    it('est vraie à l\'instant exact de la sortie', () => {
        expect(sortieAtteinte(60, plage)).toBe(true);
    });

    it('est fausse avant', () => {
        expect(sortieAtteinte(59.9, plage)).toBe(false);
    });

    it('est fausse sans plage — un morceau sans plage va jusqu\'au bout', () => {
        expect(sortieAtteinte(9999, null)).toBe(false);
    });
});
