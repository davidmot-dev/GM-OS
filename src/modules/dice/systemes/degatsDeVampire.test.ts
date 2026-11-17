import { describe, expect, it } from 'vitest';
import {
    capaciteLueSurLaFiche, casesSansAggrave, depenserUnPoint, direLEncaissement, ecrireLesMarques, encaisserVampire, etatDeLaPiste, lireLesMarques,
    recuperationDeVolonte, regenerationParExaltation, soignerVampire,
} from './degatsDeVampire';

const vide = { superficiels: 0, aggraves: 0 };

describe('Vampire — les marques d’une jauge (p. 126)', () => {
    it('lit « X » et « / », ignore le reste, et écrit les « X » d’abord', () => {
        expect(lireLesMarques('/ X x /')).toEqual({ aggraves: 2, superficiels: 2 });
        expect(lireLesMarques(undefined)).toEqual(vide);
        expect(ecrireLesMarques({ aggraves: 2, superficiels: 3 })).toBe('XX///');
        expect(ecrireLesMarques(vide)).toBe('');
    });

    it('dit l’état : indemne, blessé, Affaibli, hors de combat', () => {
        expect(etatDeLaPiste(vide, 5)).toBe('indemne');
        expect(etatDeLaPiste({ superficiels: 2, aggraves: 0 }, 5)).toBe('blesse');
        expect(etatDeLaPiste({ superficiels: 3, aggraves: 2 }, 5)).toBe('affaibli');
        expect(etatDeLaPiste({ superficiels: 0, aggraves: 5 }, 5)).toBe('hors-de-combat');
    });

    it('la Santé restante de GM-OS compte les cases sans « X »', () => {
        expect(casesSansAggrave({ superficiels: 5, aggraves: 0 }, 5)).toBe(5);
        expect(casesSansAggrave({ superficiels: 1, aggraves: 2 }, 5)).toBe(3);
    });
});

describe('Vampire — encaisser (p. 126-127)', () => {
    it('divise les superficiels par deux, arrondi au supérieur', () => {
        const e = encaisserVampire(vide, 7, 5, 'superficiel');
        expect(e.notes).toBe(3);
        expect(e.piste).toEqual({ superficiels: 3, aggraves: 0 });
    });

    it('ne divise pas une dépense volontaire', () => {
        expect(encaisserVampire(vide, 5, 1, 'superficiel', { diviser: false }).piste).toEqual({ superficiels: 1, aggraves: 0 });
    });

    it('l’officier de police : six aggravés sur cinq cases — il meurt sur-le-champ (p. 126-127)', () => {
        const e = encaisserVampire(vide, 5, 6, 'aggrave');
        expect(e.piste).toEqual({ superficiels: 0, aggraves: 5 });
        expect(e.apres).toBe('hors-de-combat');
        expect(e.perdus).toBe(1);
        expect(direLEncaissement('Santé', 6, 'aggrave', e, { vampire: false })).toContain('coma ou mort');
    });

    it('la jauge remplie rend Affaibli ; chaque niveau de plus change un « / » en « X »', () => {
        // Cinq cases, quatre « / » : six superficiels en font trois ; le premier remplit la jauge.
        const e = encaisserVampire({ superficiels: 4, aggraves: 0 }, 5, 6, 'superficiel');
        expect(e.notes).toBe(3);
        expect(e.convertis).toBe(2);
        expect(e.piste).toEqual({ superficiels: 3, aggraves: 2 });
        expect(e.apres).toBe('affaibli');
        expect(direLEncaissement('Santé', 6, 'superficiel', e)).toContain('−2 dés aux groupements physiques');
    });

    it('un aggravé sur une jauge pleine de « / » en convertit un aussi', () => {
        const e = encaisserVampire({ superficiels: 5, aggraves: 0 }, 5, 1, 'aggrave');
        expect(e.piste).toEqual({ superficiels: 4, aggraves: 1 });
    });

    it('un vampire plein de « X » tombe en torpeur', () => {
        const e = encaisserVampire({ superficiels: 1, aggraves: 4 }, 5, 2, 'superficiel');
        expect(e.piste).toEqual({ superficiels: 0, aggraves: 5 });
        expect(direLEncaissement('Santé', 2, 'superficiel', e)).toContain('torpeur');
    });

    it('la Volonté pleine de « X » : il craque dans un conflit social', () => {
        const e = encaisserVampire({ superficiels: 0, aggraves: 3 }, 4, 1, 'aggrave');
        expect(direLEncaissement('Volonté', 1, 'aggrave', e)).toContain('perd la face');
    });
});

describe('Vampire — guérir (p. 127, 216-219)', () => {
    it('efface les marques d’une seule nature', () => {
        expect(soignerVampire({ superficiels: 2, aggraves: 1 }, 3, 'superficiel')).toEqual({ piste: { superficiels: 0, aggraves: 1 }, rendus: 2 });
        expect(soignerVampire({ superficiels: 2, aggraves: 1 }, 1, 'aggrave')).toEqual({ piste: { superficiels: 2, aggraves: 0 }, rendus: 1 });
    });

    it('le tableau de la Puissance du sang (p. 216)', () => {
        expect([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(regenerationParExaltation)).toEqual([1, 1, 2, 2, 3, 3, 3, 3, 4, 4, 5]);
    });

    it('Terence : 3 en Résolution, 4 en Sang-froid — quatre « / » effacés (p. 127)', () => {
        expect(recuperationDeVolonte(3, 4)).toBe(4);
    });
});

describe('Vampire — dépenser la Volonté (p. 122, 126)', () => {
    it('note un « / » non divisé, la Volonté restante ne bouge pas', () => {
        expect(depenserUnPoint('Volonté', '', 5)).toMatchObject({ marques: '/', restante: 5 });
    });
    it('sur une jauge pleine de « / », un « / » devient « X »', () => {
        expect(depenserUnPoint('Volonté', '/////', 5)).toMatchObject({ marques: 'X////', restante: 4 });
    });
    it('plus rien à dépenser quand la jauge est pleine de « X »', () => {
        expect(depenserUnPoint('Volonté', 'XXXXX', 0)).toBeNull();
        expect(capaciteLueSurLaFiche('XX/', 3)).toBe(5);
    });
});
