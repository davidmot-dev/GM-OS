import { describe, it, expect } from 'vitest';
import {
    bilanDeLaGarde, effetsSurLaNevrose, etatDuPhysique, garderLesDes, poserUneAtteinte, potentielActuel,
    quotaDeLaGarde, resoudreLaGarde, seuilDeLaGarde,
} from './potentielGarde';

/**
 * **Potentiel GARDE Compétence** — Crimes, livre p. 385 et 409–411. Chaque cas
 * vient d'un exemple ou d'une phrase du livre.
 */
const CRIMES = { seuil: 9, competent: 1, specialise: 2 };

describe('le seuil et le quota', () => {
    it('9 de base, 8 compétent, 7 spécialisé ; la spécialisation suppose la compétence', () => {
        expect(seuilDeLaGarde(CRIMES, 0, false)).toBe(9);
        expect(seuilDeLaGarde(CRIMES, 2, false)).toBe(8);
        expect(seuilDeLaGarde(CRIMES, 2, true)).toBe(7);
        expect(seuilDeLaGarde(CRIMES, 0, true)).toBe(9);
    });

    it('autant de dés gardés que la compétence, un seul sans elle (Rachel Attar, p. 411)', () => {
        expect(quotaDeLaGarde(0)).toBe(1);
        expect(quotaDeLaGarde(2)).toBe(2);
        expect(quotaDeLaGarde(3)).toBe(3);
    });
});

describe('l\'exemple du livre (p. 385)', () => {
    it('Joseph, Physique 5, Traque 2, seuil 8 : [1, 3, 4, 6, 8] garde [1, 8], réussite mitigée', () => {
        const jet = resoudreLaGarde([1, 3, 4, 6, 8], 2, 8);
        expect(jet.garde.gardes.map(i => [1, 3, 4, 6, 8][i])).toEqual([1, 8]);
        expect(jet.garde.bilan).toBe('reussite-mitigee');
        expect(jet.tagSuccess).toBe(true);
        expect(jet.totalDisplay).toBe('Réussite mitigée — gardés 1, 8 (seuil 8)');
    });

    it('novice en Traque, il garde le 1 seul : échec critique', () => {
        expect(resoudreLaGarde([1, 3, 4, 6, 8], 1, 8).garde.bilan).toBe('echec-critique');
    });

    it('Rachel, sans Sport, Physique 3, seuil 9 : [3, 5, 8], aucune réussite — échec, +1 Névrose (p. 411)', () => {
        const jet = resoudreLaGarde([3, 5, 8], quotaDeLaGarde(0), 9);
        expect(jet.garde.bilan).toBe('echec');
        expect(jet.tagSuccess).toBe(false);
        expect(effetsSurLaNevrose(jet.garde)).toEqual(['Échec : +1 Névrose.']);
    });
});

describe('les quatre bilans (p. 385)', () => {
    it('plus de 1 que de réussites : échec critique ; aucune réussite : échec', () => {
        expect(bilanDeLaGarde([1, 9], 8).bilan).toBe('reussite-mitigee');
        expect(bilanDeLaGarde([1, 1, 9], 8).bilan).toBe('echec-critique');
        expect(bilanDeLaGarde([1], 8).bilan).toBe('echec-critique');
        expect(bilanDeLaGarde([4, 6], 8).bilan).toBe('echec');
        expect(bilanDeLaGarde([9, 10], 8).bilan).toBe('reussite');
    });

    it('trois réussites gardées : un succès important, qui fait baisser la Névrose (p. 409)', () => {
        const jet = resoudreLaGarde([9, 10, 8, 2], 3, 8);
        expect(jet.garde).toMatchObject({ bilan: 'reussite', succesImportant: true });
        expect(jet.degre).toBe('reussite-significative');
        expect(effetsSurLaNevrose(jet.garde)).toEqual(['Succès important : −1 Névrose.']);
    });
});

describe('ce qui se garde', () => {
    it('tous les 1 d\'abord, même au-delà du quota : le bilan est un échec critique', () => {
        const jet = resoudreLaGarde([1, 1, 1, 9], 2, 8);
        expect(jet.garde.gardes).toEqual([0, 1, 2]);
        expect(jet.garde.bilan).toBe('echec-critique');
    });

    it('le joueur peut garder de mauvais dés pour échouer volontairement — jamais écarter un 1', () => {
        expect(garderLesDes([9, 3, 1, 8], 2, [1])).toEqual([2, 1]);
        expect(resoudreLaGarde([9, 3, 8], 1, 8, [1]).garde.bilan).toBe('echec');
    });

    it('des réussites qui n\'ont pas pu être gardées font gagner un point de Névrose (p. 409)', () => {
        const jet = resoudreLaGarde([9, 10, 8], 1, 8);
        expect(jet.garde.reussitesNonGardees).toBe(2);
        expect(effetsSurLaNevrose(jet.garde)).toEqual(['2 réussites non gardées : +1 Névrose.']);
    });

    it('les dés écartés sont marqués, les gardés disent réussite ou 1', () => {
        const jet = resoudreLaGarde([1, 3, 8], 2, 8);
        expect(jet.rolls.map(d => [d.val, !!d.isDropped, !!d.isCritMax, !!d.isCritMin])).toEqual([
            [1, false, false, true], [3, true, false, false], [8, false, true, false],
        ]);
    });
});

/** **Les atteintes** (C2, livre p. 395–396). */
describe('les atteintes des Potentiels', () => {
    const sain = { fatigue: 0, epuisement: 0, blessures: 0 };

    it('l’exemple du livre : deux fatigues sociales, puis une croix d’épuisement qui prend la place d’une coche', () => {
        expect(poserUneAtteinte({ ...sain, fatigue: 2 }, 'epuisement')).toEqual({ fatigue: 1, epuisement: 1, blessures: 0 });
    });

    it('une blessure remplace d’abord une croix, puis un trait ; sinon elle s’ajoute', () => {
        expect(poserUneAtteinte({ fatigue: 1, epuisement: 1, blessures: 0 }, 'blessures')).toEqual({ fatigue: 1, epuisement: 0, blessures: 1 });
        expect(poserUneAtteinte({ ...sain, fatigue: 1 }, 'blessures')).toEqual({ ...sain, blessures: 1 });
        expect(poserUneAtteinte(sain, 'blessures')).toEqual({ ...sain, blessures: 1 });
    });

    it('quatre blessures sur un Physique de 3 : actuel −1 (p. 395), et le livre ne tue personne', () => {
        let m = sain;
        for (let i = 0; i < 4; i++) m = poserUneAtteinte(m, 'blessures');
        expect(potentielActuel(3, m)).toBe(-1);
        expect(etatDuPhysique(-1)).toMatch(/^Hors de combat/);
        expect(etatDuPhysique(-2)).toMatch(/^Blessure grave/);
        expect(etatDuPhysique(1)).toBeNull();
    });
});

/** **Le dépassement** (C3, p. 385 et 407). */
describe('se dépasser', () => {
    it('l’orateur républicain : Social GARDE 2, deux réussites qu’il ne peut garder, ajoutées par sa conviction', () => {
        const avant = resoudreLaGarde([9, 9, 8, 8, 3], 2, 8);
        expect(avant.garde.reussitesNonGardees).toBe(2);
        const apres = resoudreLaGarde([9, 9, 8, 8, 3], 2, 8, undefined, 2);
        expect(apres.garde).toMatchObject({ reussites: 4, depassement: 2, reussitesNonGardees: 0, succesImportant: true });
        expect(apres.totalDisplay).toMatch(/dont 2 par dépassement/);
        // Plus de réussite laissée de côté : la Névrose ne monte pas pour elles.
        expect(effetsSurLaNevrose(apres.garde)).toEqual(['Succès important : −1 Névrose.']);
    });

    it('il peut minorer l’effet d’un 1 : un échec critique devient une réussite mitigée', () => {
        const jet = resoudreLaGarde([1, 9, 4], 1, 8, undefined, 1);
        expect(jet.garde.bilan).toBe('reussite-mitigee');
    });

    it('on ne garde en plus que des réussites qui existent', () => {
        expect(resoudreLaGarde([9, 3, 2], 1, 8, undefined, 3).garde.depassement).toBe(0);
    });
});
