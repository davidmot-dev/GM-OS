import { describe, expect, it } from 'vitest';
import {
    compterLesReussites, compulsionAleatoire, lancerVampire, relanceImpossible, relancerVampire, relancesProposees,
    reserveDeVampire, resoudreLExaltation, resoudreVampire, testerLExaltation,
} from './vampire';

/** Les exemples chiffrés du livre de base français (pages imprimées), 17/11/2026. */
describe('Vampire V5 — le groupement et la Soif (p. 118, 120, 205)', () => {
    it('attribut + compétence, une spécialité ajoute un dé', () => {
        // Benoît : Intelligence 3 + Occultisme 2 = cinq dés (p. 118).
        expect(reserveDeVampire(5, {}, 0)).toMatchObject({ total: 5, ordinaires: 5, desDeSoif: 0 });
        expect(reserveDeVampire(5, { specialite: true }, 0).total).toBe(6);
    });

    it('les dés de Soif REMPLACENT des dés ordinaires : le groupement garde sa taille', () => {
        // Claire : Intelligence 3 + Investigation 3, Soif 2 → six dés, dont deux de Soif (p. 205).
        expect(reserveDeVampire(6, {}, 2)).toMatchObject({ total: 6, ordinaires: 4, desDeSoif: 2 });
    });

    it('un groupement plus petit que la Soif est tout entier de Soif', () => {
        expect(reserveDeVampire(3, {}, 5)).toMatchObject({ total: 3, ordinaires: 0, desDeSoif: 3 });
    });

    it('jamais de Soif sur un jet de jauge, et jamais moins d’un dé', () => {
        expect(reserveDeVampire(4, { sansSoif: true }, 4)).toMatchObject({ desDeSoif: 0, ordinaires: 4 });
        expect(reserveDeVampire(1, { modificateur: -3 }, 0).total).toBe(1);
    });

    it('la Soif se borne de 0 à 5', () => {
        expect(reserveDeVampire(8, {}, 9).desDeSoif).toBe(5);
        expect(reserveDeVampire(8, {}, -2).desDeSoif).toBe(0);
    });
});

describe('Vampire V5 — réussites et critiques (p. 118-121)', () => {
    it('chaque 6 ou plus réussit ; la difficulté compte des réussites', () => {
        // Guillaume : six dés, trois réussites, difficulté 2 → victoire (p. 118).
        const jet = resoudreVampire([6, 8, 9, 2, 3, 5], [], 2);
        expect(jet.vampire).toMatchObject({ reussites: 3, bilan: 'victoire', marge: 1 });
        expect(jet.tagSuccess).toBe(true);
    });

    it('une paire de 10 vaut quatre réussites, trois 10 en valent cinq, quatre en valent huit', () => {
        expect(compterLesReussites([10, 10])).toEqual({ reussites: 4, paires: 1 });
        expect(compterLesReussites([10, 10, 10]).reussites).toBe(5);
        expect(compterLesReussites([10, 10, 10, 10]).reussites).toBe(8);
    });

    it('les exemples de David et de Marine : cinq réussites chacun', () => {
        // David, six dés : 10, 10, une réussite et trois échecs (p. 121).
        expect(resoudreVampire([10, 10, 7, 3, 2, 1], [], 3).vampire).toMatchObject({ reussites: 5, paires: 1, bilan: 'victoire-critique' });
        // Marine, cinq dés : une paire de 10 et une seule autre réussite (p. 121).
        expect(resoudreVampire([10, 10, 8, 2, 3], [], 5).vampire.reussites).toBe(5);
    });

    it('sans réussite, un échec total ; avec, un échec (victoire à la Pyrrhus possible)', () => {
        expect(resoudreVampire([1, 2, 3], [], 1).vampire.bilan).toBe('echec-total');
        expect(resoudreVampire([6, 2, 3], [], 2).vampire.bilan).toBe('echec');
    });

    it('seuls les 10 appariés sont marqués critiques', () => {
        const jet = resoudreVampire([10, 10, 10, 4], [], 2);
        expect(jet.rolls.filter(d => d.isCritMax)).toHaveLength(2);
    });
});

describe('Vampire V5 — triomphe brutal et échec bestial (p. 206-208)', () => {
    it('Julie : une réussite contre 5, un 1 de Soif → échec bestial', () => {
        expect(resoudreVampire([7, 3], [1, 4], 5).vampire.bilan).toBe('echec-bestial');
    });

    it('Marine : la paire ne suffit pas contre six réussites adverses → échec bestial', () => {
        const jet = resoudreVampire([10, 3, 2, 5], [10, 1, 4], 6);
        expect(jet.vampire).toMatchObject({ reussites: 4, paires: 1, bilan: 'echec-bestial' });
    });

    it('David : une victoire critique avec un 10 de Soif est un triomphe brutal', () => {
        const jet = resoudreVampire([10, 7, 3, 2], [10, 4], 5);
        expect(jet.vampire).toMatchObject({ reussites: 5, paires: 1, bilan: 'triomphe-brutal' });
        expect(jet.rolls.filter(d => d.source === 'gear')).toHaveLength(2);
    });

    it('jamais d’échec bestial sur une victoire, quel que soit le nombre de 1', () => {
        expect(resoudreVampire([7, 7, 7], [1, 1], 3).vampire.bilan).toBe('victoire');
    });

    it('un 10 de Soif sans paire n’est pas un triomphe brutal', () => {
        expect(resoudreVampire([7, 7], [10], 2).vampire.bilan).toBe('victoire');
    });
});

describe('Vampire V5 — la Volonté relance (p. 122, 205)', () => {
    it('David relance le 10 ordinaire et deux échecs : quatre réussites, plus de critique', () => {
        const avant = resoudreVampire([10, 7, 3, 2], [10, 4], 5).vampire;
        const relances = [3, 8, 7];
        const apres = relancerVampire(avant, [0, 2, 3], () => relances.shift()!);
        expect(apres.vampire.ordinaires).toEqual([3, 7, 8, 7]);
        expect(apres.vampire.soif).toEqual([10, 4]);
        expect(apres.vampire).toMatchObject({ reussites: 4, paires: 0, bilan: 'echec', relance: true, relances: [0, 2, 3] });
    });

    it('trois dés au plus, jamais les dés de Soif', () => {
        const avant = resoudreVampire([1, 2, 3, 4, 5], [1], 3).vampire;
        const apres = relancerVampire(avant, [0, 1, 2, 3, 4], () => 9);
        expect(apres.vampire.ordinaires).toEqual([9, 9, 9, 4, 5]);
        expect(apres.vampire.soif).toEqual([1]);
    });

    it('propose les échecs ordinaires, trois au plus', () => {
        expect(relancesProposees(resoudreVampire([7, 1, 2, 3, 4], [], 2).vampire)).toEqual([1, 2, 3]);
    });

    it('dit pourquoi elle ne relance pas', () => {
        const jet = resoudreVampire([2], [1], 2).vampire;
        expect(relanceImpossible(jet, false, 3)).toBeUndefined();
        expect(relanceImpossible(jet, true, 3)).toMatch(/jauge/);
        expect(relanceImpossible(jet, false, 0)).toMatch(/Plus de Volonté/);
        expect(relanceImpossible(resoudreVampire([], [2], 1).vampire, false, 3)).toMatch(/Soif/);
        expect(relanceImpossible(relancerVampire(jet, [0], () => 6).vampire, false, 3)).toMatch(/déjà/);
    });
});

describe('Vampire V5 — test d’Exaltation et Compulsions (p. 208, 211)', () => {
    it('Claire obtient 4 : la Soif monte d’un point', () => {
        expect(resoudreLExaltation([4], 2)).toMatchObject({ reussi: false, soifApres: 3 });
    });

    it('deux dés, le meilleur gardé : un 6 suffit', () => {
        expect(resoudreLExaltation([4, 7], 2)).toMatchObject({ reussi: true, soifApres: 2 });
        let n = 0;
        expect(testerLExaltation(1, true, () => (n++ === 0 ? 2 : 9)).des).toEqual([2, 9]);
    });

    it('raté à 5 de Soif : jet contre la frénésie, difficulté 4 ; réussi, rien (p. 220)', () => {
        const t = resoudreLExaltation([3], 5);
        expect(t).toMatchObject({ frenesie: true, soifApres: 5 });
        expect(t.texte).toMatch(/difficulté 4/);
        expect(resoudreLExaltation([8], 5).frenesie).toBe(false);
    });

    it('le tableau des Compulsions aléatoires', () => {
        expect(compulsionAleatoire(1).nom).toBe('Soif');
        expect(compulsionAleatoire(5).nom).toBe('Domination');
        expect(compulsionAleatoire(6).nom).toBe('Destruction');
        expect(compulsionAleatoire(9).nom).toBe('Paranoïa');
        expect(compulsionAleatoire(10).nom).toBe('Compulsion de clan');
    });
});

describe('Vampire V5 — le lancer', () => {
    it('lance les dés ordinaires puis les dés de Soif', () => {
        const des = [6, 6, 1, 10];
        const jet = lancerVampire({ ordinaires: 2, desDeSoif: 2 }, 2, () => des.shift()!);
        expect(jet.vampire.ordinaires).toEqual([6, 6]);
        expect(jet.vampire.soif).toEqual([1, 10]);
        expect(jet.vampire.bilan).toBe('victoire');
    });
});
