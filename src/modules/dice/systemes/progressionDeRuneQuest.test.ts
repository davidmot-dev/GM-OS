import { describe, it, expect } from 'vitest';
import {
    ajustementsDuJet, appliquerLExperience, cocher, dureeDuTrouble, finDeLaSituation, inspirationImpossible, inspirer,
    journeeDeMeditation, lireLEtat, modificateurDExperience, nouvelleSession, perteDInspiration, testDExperience,
    CLE_ETAT_RUNEQUEST, type RegleDeLaProgression,
} from './progressionDeRuneQuest';
import { calculerRuneQuest, CHOIX_DE_RUNEQUEST } from './runequest';

/** RQ-A6, 03/11/2026 : le livre de base, p. 228-229, 236-237 et 415. */
const REGLE: RegleDeLaProgression = {
    runes: ['rune_air', 'rune_terre', 'rune_mouvement', 'rune_stase'],
    opposees: [['rune_mouvement', 'rune_stase']],
    passions: ['passion_honneur', 'passion1'],
    categories: { competences_agilite: 'mod_agilite', competences_armes: 'mod_manipulation' },
};
const HAINE = { champ: 'passion1', libelle: 'Haine (Empire lunar)', genre: 'passion' as const };
const AIR = { champ: 'rune_air', libelle: 'Air', genre: 'rune' as const };
const EPEE = { champ: 'epee_large', libelle: 'Épée large' };
const vide = lireLEtat({});

describe('l’inspiration', () => {
    it('donne +50/+30/+20 % à l’aptitude choisie, pour la situation, et coche l’expérience de la source', () => {
        const { etat, ligne } = inspirer(vide, HAINE, 'reussite-speciale', EPEE);
        expect(etat.inspiration).toMatchObject({ aptitude: 'epee_large', bonus: 30 });
        expect(etat.coches).toEqual(['passion1']);
        expect(ligne).toMatch(/\+30 % à Épée large jusqu’à la fin de la situation/);
        expect(ajustementsDuJet(etat, 'epee_large')).toEqual([{ valeur: 30, libelle: 'inspiration (Haine (Empire lunar))', inspiration: true }]);
        expect(ajustementsDuJet(etat, 'esquive')).toEqual([]);
        expect(inspirer(vide, AIR, 'reussite-critique', EPEE).etat.inspiration!.bonus).toBe(50);
        expect(inspirer(vide, AIR, 'reussite', EPEE).etat.inspiration!.bonus).toBe(20);
    });

    it('n’autorise qu’une tentative par situation, et une Rune qu’une fois par session (p. 229, 236)', () => {
        const { etat } = inspirer(vide, AIR, 'reussite', EPEE);
        expect(inspirationImpossible(etat, 'passion1', 'passion')).toMatch(/Une seule tentative/);
        const apres = finDeLaSituation(etat);
        expect(apres.inspiration).toBeUndefined();
        expect(inspirationImpossible(apres, 'passion1', 'passion')).toBeUndefined();
        expect(inspirationImpossible(apres, 'rune_air', 'rune')).toMatch(/déjà inspiré cette session/);
        expect(inspirationImpossible(nouvelleSession(apres), 'rune_air', 'rune')).toBeUndefined();
    });

    it('Passion ratée : −10 % à tous les tests de la situation (p. 236)', () => {
        const { etat } = inspirer(vide, HAINE, 'echec', EPEE);
        expect(ajustementsDuJet(etat, 'esquive')).toEqual([{ valeur: -10, libelle: 'découragé (Haine (Empire lunar))' }]);
        expect(etat.coches).toEqual([]);
        expect(ajustementsDuJet(finDeLaSituation(etat), 'esquive')).toEqual([]);
    });

    it('Rune ratée : −20 % aux tests de cette Rune, jusqu’à une journée de méditation (p. 229)', () => {
        const { etat } = inspirer(vide, AIR, 'echec', EPEE);
        const apres = finDeLaSituation(etat);
        expect(ajustementsDuJet(apres, 'rune_air')).toEqual([{ valeur: -20, libelle: 'inspiration ratée (Air)' }]);
        expect(ajustementsDuJet(apres, 'epee_large')).toEqual([]);
        expect(ajustementsDuJet(journeeDeMeditation(apres, 'rune_air'), 'rune_air')).toEqual([]);
    });

    it('échec critique : la perte et le trouble se proposent, l’opposée monte d’autant (p. 229, 236)', () => {
        expect(inspirer(vide, AIR, 'echec-critique', EPEE).echecCritique).toBe(true);
        const mouvement = { champ: 'rune_mouvement', libelle: 'Mouvement', genre: 'rune' as const };
        const p = perteDInspiration(REGLE, { rune_mouvement: 75, rune_stase: 25 }, mouvement, 6, 4);
        expect(p.maj).toEqual({ rune_mouvement: 69, rune_stase: 31 });
        expect(p.ligne).toMatch(/Tourment \(1D10 = 4\) : 4D10\+10 rounds/);
        const passion = perteDInspiration(REGLE, { passion1: 5 }, HAINE, 8, 10);
        expect(passion.maj).toEqual({ passion1: 0 });
        expect(passion.ligne).toMatch(/se raye de la feuille.*Désespoir \(1D10 = 10\) : 1D3 jours/);
        expect([1, 3, 4, 7, 8, 9, 10].map(dureeDuTrouble)).toEqual(['1D10 rounds', '1D10 rounds', '4D10+10 rounds', '4D10+10 rounds',
            'jusqu’à l’aube, au crépuscule ou une période semblable', 'jusqu’à l’aube, au crépuscule ou une période semblable', '1D3 jours de temps de jeu']);
    });

    it('ne cumule pas l’inspiration et l’augmentation : la meilleure compte (p. 229)', () => {
        const ajustements = [{ valeur: 30, libelle: 'inspiration (Haine)', inspiration: true }];
        const avec = calculerRuneQuest({ label: 'Épée large', valeur: 65, caracteristique: false }, { ...CHOIX_DE_RUNEQUEST, augmentation: 20, ajustements });
        expect(avec.chancesModifiees).toBe(95);
        expect(avec.explication).toBe('Épée large 65 % + 30 inspiration (Haine) = 95 %');
        expect(avec.remarques[0]).toMatch(/l’inspiration, la meilleure, est seule retenue/);
        const mieux = calculerRuneQuest({ label: 'Épée large', valeur: 65, caracteristique: false }, { ...CHOIX_DE_RUNEQUEST, augmentation: 50, ajustements });
        expect(mieux.chancesModifiees).toBe(115);
        const decourage = calculerRuneQuest({ label: 'Esquive', valeur: 35, caracteristique: false },
            { ...CHOIX_DE_RUNEQUEST, ajustements: [{ valeur: -10, libelle: 'découragé (Haine)' }] });
        expect(decourage.explication).toBe('Esquive 35 % − 10 découragé (Haine) = 25 %');
    });

    it('garde l’état dans la fiche, sous une clé propre à GM-OS', () => {
        const { etat } = inspirer(vide, HAINE, 'reussite', EPEE);
        expect(lireLEtat({ [CLE_ETAT_RUNEQUEST]: etat })).toEqual(etat);
        expect(lireLEtat({ [CLE_ETAT_RUNEQUEST]: { version: 2 } })).toEqual(vide);
    });
});

describe('l’expérience (p. 415)', () => {
    it('ajoute le modificateur de catégorie, mais pas à une Rune ni à une Passion', () => {
        const fiche = { mod_agilite: 5, mod_manipulation: 5 };
        expect(modificateurDExperience(REGLE, fiche, 'esquive', 'competences_agilite')).toEqual({ valeur: 5, champ: 'mod_agilite' });
        expect(modificateurDExperience(REGLE, fiche, 'rune_air', 'runes_elementaires').valeur).toBe(0);
        expect(modificateurDExperience(REGLE, fiche, 'passion1', 'passions_reputation').valeur).toBe(0);
    });

    it('Vostor : Esquive 35 % et Agilité +5 % — réussit au-delà du score, ou à 100 et plus', () => {
        expect(testDExperience('esquive', 35, 5, 31, '1d6', 4)).toMatchObject({ total: 36, reussi: true, gain: 4 });
        expect(testDExperience('esquive', 35, 5, 30, '1d6', 4)).toMatchObject({ total: 35, reussi: false, gain: 0 });
        expect(testDExperience('epee', 110, 0, 100, '3', 6)).toMatchObject({ reussi: true, gain: 3 });
    });

    it('plafonne une Rune d’une paire à 99 % et baisse l’opposée d’autant (p. 415)', () => {
        const t = testDExperience('rune_mouvement', 97, 0, 99, '1d6', 5);
        expect(appliquerLExperience(REGLE, { rune_mouvement: 97, rune_stase: 3 }, t).maj).toEqual({ rune_mouvement: 99, rune_stase: 1 });
        const air = testDExperience('rune_air', 75, 0, 81, '3', 1);
        expect(appliquerLExperience(REGLE, { rune_air: 75 }, air)).toEqual({ maj: { rune_air: 78 }, ligne: '+3 % → 78 %' });
    });

    it('coche une aptitude une seule fois', () => {
        expect(cocher(cocher(vide, 'esquive'), 'esquive').coches).toEqual(['esquive']);
    });
});
