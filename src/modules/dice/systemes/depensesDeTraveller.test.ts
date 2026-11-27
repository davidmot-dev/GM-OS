import { describe, it, expect } from 'vitest';
import {
    depenseDePsi, ecrireLesMunitions, lireLesMunitions, munitionsConsommees, neutralisation, psiRecuperee, testDeReveil, tirer, uneHeureDeRepos,
} from './depensesDeTraveller';
import { POUVOIRS_PSIONIQUES, porteeAllongee, pouvoirsDuTalent, talentDeLaCompetence } from './pouvoirsPsioniques';

/** TRV-A6 (27/11/2026) — les dépenses et les durées, sur les règles du livre v2.2. */
describe('les munitions (C1, C2 ; p. 74-76)', () => {
    it('un tir simple, une rafale, un auto complet', () => {
        expect(munitionsConsommees('simple', 4)).toBe(1);
        expect(munitionsConsommees('rafale', 4)).toBe(4);
        expect(munitionsConsommees('auto', 4)).toBe(12);
        expect(munitionsConsommees('rafale', 0)).toBe(1); // sans Auto, pas de rafale
    });

    it('« 26/30 », un nombre seul, un champ vide (décision de David : « 26/30 »)', () => {
        expect(lireLesMunitions('26/30')).toEqual({ restants: 26, capacite: 30 });
        expect(lireLesMunitions('30')).toEqual({ restants: 30, capacite: 30 });
        expect(lireLesMunitions('', 6)).toEqual({ restants: 6, capacite: 6 });
        expect(lireLesMunitions('')).toBeNull();
        expect(lireLesMunitions('—', 6)).toBeNull(); // un texte qu'on ne lit pas ne s'écrase pas
        expect(lireLesMunitions('40/30')).toEqual({ restants: 30, capacite: 30 });
    });

    it('une rafale de 4 sur un chargeur de 30, puis un chargeur trop court', () => {
        const apres = tirer({ restants: 30, capacite: 30 }, 4);
        expect(ecrireLesMunitions(apres)).toBe('26/30');
        expect(tirer({ restants: 2, capacite: 30 }, 4)).toEqual({ restants: 0, capacite: 30, manque: 2 });
    });
});

describe('les pouvoirs psioniques (C3, C4 ; p. 224-229)', () => {
    it('la table du livre : cinq talents, vingt-sept lignes, les coûts écrits', () => {
        expect(POUVOIRS_PSIONIQUES).toHaveLength(27);
        expect(pouvoirsDuTalent('Télépathie').map(x => x.nom)).toContain('Suggestion');
        expect(POUVOIRS_PSIONIQUES.find(x => x.nom === 'Assaut')).toMatchObject({ difficulte: 14, portee: 'Courte', cout: 8 });
        expect(POUVOIRS_PSIONIQUES.find(x => x.nom === 'Télékinésie')).toMatchObject({ cout: null, coutDuLivre: '1 par 10 kg' });
        expect(talentDeLaCompetence('telepathie')).toBe('Télépathie');
        expect(talentDeLaCompetence('Pilotage')).toBeNull();
    });

    it('l’exemple du livre : lire les pensées à Longue pour 2, Très longue pour 4, Lointaine pour 8', () => {
        expect(porteeAllongee('Longue', 1)).toEqual({ portee: 'Très longue', facteur: 2 });
        expect(porteeAllongee('Longue', 2)).toEqual({ portee: 'Lointaine', facteur: 4 });
        expect(porteeAllongee(null, 2)).toEqual({ portee: null, facteur: 1 });
    });

    it('réussite : le coût ; échec : un point ; sous zéro : des dégâts ; à 0 : refusé', () => {
        expect(depenseDePsi({ cout: 3, reussie: true, psi: 9 })).toEqual({ depense: 3, psiApres: 6, degats: 0 });
        expect(depenseDePsi({ cout: 3, reussie: false, psi: 9 })).toEqual({ depense: 1, psiApres: 8, degats: 0 });
        expect(depenseDePsi({ cout: 8, reussie: true, psi: 5 })).toEqual({ depense: 8, psiApres: 0, degats: 3 });
        expect(depenseDePsi({ cout: 1, reussie: true, psi: 0 })).toBeNull();
    });

    it('la récupération : rien avant trois heures, puis un point par heure, jusqu’à la PSI sans dépense (C5)', () => {
        expect(psiRecuperee({ psi: 4, maximum: 9, heures: 3 })).toEqual({ psiApres: 4, rendus: 0 });
        expect(psiRecuperee({ psi: 4, maximum: 9, heures: 5 })).toEqual({ psiApres: 6, rendus: 2 });
        expect(psiRecuperee({ psi: 4, maximum: 9, heures: 24 })).toEqual({ psiApres: 9, rendus: 5 });
    });
});

describe('la neutralisation et le réveil (C6, C7, C8 ; p. 76, 80)', () => {
    it('9 dégâts incapacitants sur une END de 6 : neutralisé 3 rounds', () => {
        expect(neutralisation(9, 6)).toEqual({ enduranceApres: 0, neutralise: true, rounds: 3 });
        expect(neutralisation(4, 6)).toEqual({ enduranceApres: 2, neutralise: false, rounds: 0 });
    });

    it('une heure de repos rend les dégâts incapacitants, sans dépasser l’END sans blessure', () => {
        expect(uneHeureDeRepos({ endurance: 0, maximum: 7, incapacitants: 6 })).toEqual({ enduranceApres: 6, rendus: 6 });
        expect(uneHeureDeRepos({ endurance: 3, maximum: 7, incapacitants: 6 })).toEqual({ enduranceApres: 7, rendus: 4 });
    });

    it('le test de réveil : 8+, MD+1 par échec précédent', () => {
        expect(testDeReveil([3, 3], 0, 0)).toEqual({ total: 6, md: 0, reveille: false });
        expect(testDeReveil([3, 3], -1, 3)).toEqual({ total: 8, md: 2, reveille: true });
    });
});
