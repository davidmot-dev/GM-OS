import { describe, it, expect } from 'vitest';
import { ageDe, budgetDeCreation, coutDeLaCompetence, coutDuPotentiel, temperamentDe, verifierLaCreation } from './creationDeCrimes';

/** **Création et progression de Crimes** — C8, livre p. 324-334 et 404-405. */
describe('le tempérament', () => {
    it('les trois choix de Jung donnent le tempérament et ses totaux (p. 328, 334)', () => {
        expect(temperamentDe('Oui', 'Oui', 'Primaire')).toEqual({ nom: 'Colérique', angoisse: 2, psychose: 1, seuilNevrose: 6 });
        expect(temperamentDe('Non', 'Oui', 'Secondaire')).toEqual({ nom: 'Flegmatique', angoisse: 1, psychose: 2, seuilNevrose: 7 });
        expect(temperamentDe('Non', 'Non', 'Secondaire')?.nom).toBe('Apathique');
        expect(temperamentDe('Oui', '', 'Primaire')).toBeUndefined();
    });
});

describe('la création', () => {
    const potentiels = (a: number, b: number, c: number) => [
        { label: 'Physique', valeur: a }, { label: 'Mental', valeur: b }, { label: 'Social', valeur: c },
    ];
    it('le budget : 45 points ; un enfant 24 avant 12 ans, 35 ensuite', () => {
        expect(budgetDeCreation()).toBe(45);
        expect(budgetDeCreation(10)).toBe(24);
        expect(budgetDeCreation(14)).toBe(35);
        expect(ageDe('Femme, 34 ans')).toBe(34);
        expect(ageDe('Homme')).toBeUndefined();
    });
    it('un adulte : 3, 4, 5 ; deux maîtres et une novice = 39 points ; une spécialisation hors maîtrise signalée', () => {
        const c = verifierLaCreation({
            potentiels: potentiels(5, 3, 4),
            competences: [
                { label: 'Combat', niveau: 3, specialisations: 2 },
                { label: 'Intrigues', niveau: 3, specialisations: 0 },
                { label: 'Sport', niveau: 1, specialisations: 1 },
            ],
        });
        expect(c[0].ok).toBe(true);
        expect(c[1]).toEqual({ ok: true, ligne: expect.stringMatching(/^Compétences : 39 \/ 45/) });
        expect(c[2]).toEqual({ ok: false, ligne: expect.stringMatching(/sans être maître : Sport/) });
        expect(c[3].ligne).toMatch(/3, dont 2 offertes par la maîtrise ; 1 à acheter/);
    });
    it('un enfant de 10 ans : 12 points entre potentiels et Innocence ; pas de maître', () => {
        const c = verifierLaCreation({
            potentiels: potentiels(2, 3, 3), seuilInnocence: 4, age: 10,
            competences: [{ label: 'Cirque', niveau: 3, specialisations: 0 }],
        });
        expect(c[0]).toMatchObject({ ok: true });
        expect(c[1].ligne).toMatch(/18 \/ 24/);
        expect(c[2]).toMatchObject({ ok: false });
    });
});

describe('la progression', () => {
    it('un potentiel coûte son nouveau niveau, une compétence 3 par degré visé (p. 405)', () => {
        expect(coutDuPotentiel(5)).toBe(5);
        expect([1, 2, 3].map(coutDeLaCompetence)).toEqual([3, 6, 9]);
    });
});
