import { describe, expect, it } from 'vitest';
import {
    bilanDeLEffet, cibleDeTraveller, composerLeJetDeTraveller, encaisserTraveller, etatPhysique, mdDeCaracteristique,
    mdPourLaTacheSuivante, modificateursDeTraveller, penaliteDeManque, pouceOuSort, resoudreTraveller, soignerTraveller,
    type RegleDeTraveller,
} from './traveller';

// Les exemples du livre de règles français v2.2 (pages imprimées ; PDF = imprimée + 1).
const REGLE: RegleDeTraveller = {
    caracteristiques: ['dexterite', 'intellect'],
    competences: [
        { niveau: 'furtivite', domaine: 'Furtivité' },
        { niveau: 'ingenieur_1', domaine: 'Ingénieur', specialite: 'ingenieur_1_specialite' },
        { niveau: 'ingenieur_2', domaine: 'Ingénieur', specialite: 'ingenieur_2_specialite' },
        { niveau: 'profession_1', domaine: 'Profession', specialite: 'profession_1_specialite' },
        { niveau: 'profession_2', domaine: 'Profession', specialite: 'profession_2_specialite' },
        { niveau: 'pilote_1', domaine: 'Pilote', specialite: 'pilote_1_specialite' },
    ],
    polyvalent: 'polyvalent',
};

describe('Traveller — la table des MD de caractéristique (p. 9)', () => {
    it.each([[0, -3], [1, -2], [2, -2], [3, -1], [5, -1], [6, 0], [8, 0], [9, 1], [11, 1], [12, 2], [14, 2], [15, 3], [17, 3]])(
        'niveau %i → MD %i', (niveau, md) => expect(mdDeCaracteristique(niveau)).toBe(md));
});

describe('Traveller — composer le test depuis la fiche (p. 58-59, 69)', () => {
    it('Kathya, Erik et Morn se faufilent dans un couloir : 2D+1, 2D+2, 2D−1 (p. 59)', () => {
        const kathya = composerLeJetDeTraveller(REGLE, { dexterite: 10, furtivite: 0 }, { caracteristique: 'dexterite', competence: 'furtivite' });
        const erik = composerLeJetDeTraveller(REGLE, { dexterite: 6, furtivite: 2 }, { caracteristique: 'dexterite', competence: 'furtivite' });
        const morn = composerLeJetDeTraveller(REGLE, { dexterite: 12, furtivite: '' }, { caracteristique: 'dexterite', competence: 'furtivite' });
        expect([kathya.md, erik.md, morn.md]).toEqual([1, 2, -1]);
        expect(kathya.competence).toMatchObject({ niveau: 0, formee: true, md: 0 });
        expect(morn.competence).toMatchObject({ niveau: null, formee: false, md: -3 });
        expect(morn.remarques[0]).toContain('MD−3');
    });

    it('Polyvalent 2 réduit la pénalité à MD−1, Polyvalent 3 l’annule, 4 n’apporte rien de plus (p. 69)', () => {
        expect([0, 1, 2, 3, 4].map(penaliteDeManque)).toEqual([-3, -2, -1, 0, 0]);
        const pilote = composerLeJetDeTraveller(REGLE, { pilote_1: '', polyvalent: 2 }, { competence: 'pilote_1' });
        expect(pilote.md).toBe(-1);
        expect(pilote.remarques[0]).toContain('Polyvalent 2');
    });

    it('Ingénieur (Propulseur-S) 1 : les autres tests d’Ingénieur se font à MD+0, sans pénalité (p. 58)', () => {
        const fiche = { ingenieur_1: 1, ingenieur_1_specialite: 'Propulseur-S', ingenieur_2: '' };
        expect(composerLeJetDeTraveller(REGLE, fiche, { competence: 'ingenieur_1' }).competence).toMatchObject({ md: 1, label: 'Ingénieur (Propulseur-S)' });
        const autre = composerLeJetDeTraveller(REGLE, fiche, { competence: 'ingenieur_2' });
        expect(autre.competence).toMatchObject({ md: 0, formee: true, parUneAutreSpecialite: true });
    });

    it('Profession : une spécialité n’ouvre pas les autres au niveau 0 (p. 69)', () => {
        const r = composerLeJetDeTraveller(REGLE, { profession_1: 2, profession_2: '' }, { competence: 'profession_2' });
        expect(r.competence).toMatchObject({ md: -3, formee: false });
    });

    it('un test de caractéristique seul ajoute son MD ; une caractéristique vide se dit', () => {
        expect(composerLeJetDeTraveller(REGLE, { intellect: 4 }, { caracteristique: 'intellect' }).md).toBe(-1);
        const vide = composerLeJetDeTraveller(REGLE, { intellect: '' }, { caracteristique: 'intellect' }, { intellect: 'Intellect (INT)' });
        expect(vide.avertissements).toEqual(['Intellect (INT) : aucun niveau sur la fiche.']);
    });
});

describe('Traveller — lancer et lire l’Effet (p. 60-63)', () => {
    it('4 et 3, MD+3, tâche Moyenne : 10, Effet 2, succès moyen (p. 61)', () => {
        const r = resoudreTraveller([4, 3], 0, 3, 8);
        expect(r.traveller).toMatchObject({ naturel: 7, resultat: 10, effet: 2, bilan: 'succes-moyen' });
        expect(r.tagSuccess).toBe(true);
        expect(r.degre).toBe('reussite-significative');
        expect(r.totalDisplay).toContain('Effet +2');
    });

    it.each([[6, 'succes-exceptionnel'], [5, 'succes-moyen'], [1, 'succes-moyen'], [0, 'succes-marginal'], [-1, 'echec-marginal'], [-2, 'echec-moyen'], [-5, 'echec-moyen'], [-6, 'echec-exceptionnel']] as const)(
        'Effet %i → %s', (effet, bilan) => expect(bilanDeLEffet(effet)).toBe(bilan));

    it('le succès marginal réussit, l’échec marginal échoue', () => {
        expect(resoudreTraveller([4, 4], 0, 0, 8).tagSuccess).toBe(true);
        expect(resoudreTraveller([4, 3], 0, 0, 8).tagSuccess).toBe(false);
    });

    it('Coup de pouce : trois dés, les deux meilleurs ; Coup du sort : les deux pires (p. 61)', () => {
        expect(resoudreTraveller([1, 5, 6], 1, 0, 8).traveller.naturel).toBe(11);
        const sort = resoudreTraveller([1, 5, 6], -1, 0, 8);
        expect(sort.traveller.naturel).toBe(6);
        expect(sort.rolls.map(d => d.isDropped)).toEqual([false, false, true]);
    });

    it('un Coup de pouce et un Coup du sort s’annulent ; plusieurs ne comptent qu’une fois (p. 61)', () => {
        expect([pouceOuSort(1, 1), pouceOuSort(2, 0), pouceOuSort(0, 3)]).toEqual([0, 1, -1]);
    });

    it('les Difficultés, les tâches multiples et la durée (p. 60, 62)', () => {
        // Une tâche Facile devient Routine ; Très Difficile devient Extraordinaire.
        expect(cibleDeTraveller({ difficulte: 4, tachesSupplementaires: 1 })).toBe(6);
        expect(cibleDeTraveller({ difficulte: 12, tachesSupplementaires: 1 })).toBe(14);
        // Kathya répare le propulseur plus vite : MD−2 ; plus lentement : MD+2.
        expect(modificateursDeTraveller(1, { duree: -1, chaine: 0, autre: 0 })).toBe(-1);
        expect(modificateursDeTraveller(1, { duree: 1, chaine: 2, autre: -2 })).toBe(3);
    });

    it.each([[-7, -3], [-6, -3], [-5, -2], [-2, -2], [-1, -1], [0, 1], [1, 2], [5, 2], [6, 3]])(
        'chaîne de tâches : Effet %i → MD %i au test suivant (p. 63)', (effet, md) => expect(mdPourLaTacheSuivante(effet)).toBe(md));
});

describe('Traveller — les dégâts et les soins (p. 74, 79-80)', () => {
    it('l’END d’abord, puis la FOR ou la DEX au choix, puis la dernière', () => {
        const r = encaisserTraveller({ endurance: 7, force: 6, dexterite: 8 }, 10, 'force');
        expect(r).toMatchObject({ endurance: 0, force: 3, dexterite: 8, etat: 'debout' });
        expect(r.pertes).toEqual([{ champ: 'endurance', points: 7 }, { champ: 'force', points: 3 }]);
        expect(encaisserTraveller({ endurance: 7, force: 6, dexterite: 8 }, 10, 'dexterite')).toMatchObject({ force: 6, dexterite: 5 });
    });

    it('FOR ou DEX à 0 : inconscient, le reste frappe la dernière ; les trois à 0 : tué', () => {
        expect(encaisserTraveller({ endurance: 2, force: 3, dexterite: 8 }, 7, 'force')).toMatchObject({ endurance: 0, force: 0, dexterite: 6, etat: 'inconscient' });
        expect(encaisserTraveller({ endurance: 2, force: 3, dexterite: 8 }, 30, 'force')).toMatchObject({ dexterite: 0, etat: 'mort' });
        expect(etatPhysique({ endurance: 5, force: 0, dexterite: 4 })).toBe('inconscient');
    });

    it('un soin se répartit équitablement entre les caractéristiques blessées (p. 79)', () => {
        // Morn a perdu 10 END, 5 DEX et 3 FOR (p. 79).
        const max = { endurance: 10, force: 7, dexterite: 9 };
        const r = soignerTraveller({ endurance: 0, force: 4, dexterite: 4 }, max, 7);
        expect(r).toMatchObject({ endurance: 3, force: 6, dexterite: 6, rendus: 7 });
        expect(soignerTraveller({ endurance: 9, force: 7, dexterite: 9 }, max, 5)).toMatchObject({ endurance: 10, rendus: 1 });
    });
});
