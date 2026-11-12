import { describe, it, expect, vi, afterEach } from 'vitest';
import { bornerLesChances, echelleDeDeltaGreen, nommerLeJetDeDeltaGreen } from './deltaGreen';
import { degreDuDe } from '../degresDeReussite';
import { DiceEngine } from '../DiceEngine';
import { preparerLeJet, type DescripteurDeJet } from '../DescripteurDeJet';
import type { SheetSection } from '../../../data/defaultSheetTemplates';

/**
 * **Le jet de Delta Green** — 12/11/2026, *Manuel de l'Agent* p. 18, 29, 43-44.
 * David : « Corrige le jet sur les critiques ». Le pilote forgé portait un critique et une
 * complication de d20 : sur le d100, aucun double ne comptait.
 */
const JET: DescripteurDeJet = {
    seuil: [{ id: 'competence', label: 'Compétence ou caractéristique', sectionId: 'competences', sectionsSupplementaires: ['caracteristiques'] }],
    reserve: { base: 1, max: 1, faces: 100 },
    sens: 'sous-ou-egal',
    modificateurDuSeuil: { min: -40, max: 40, defaut: 0 },
    deltaGreen: { caracteristiques: ['FOR'] },
};
const SECTIONS = [
    { id: 'caracteristiques', label: 'Caractéristiques', fields: [{ id: 'FOR', label: 'Force (FOR)', type: 'number', defaultValue: 10 }] },
    { id: 'competences', label: 'Compétences', fields: [
        { id: 'armes_a_feu', label: 'Armes à feu', type: 'number', defaultValue: 20 },
        { id: 'anthropologie', label: 'Anthropologie', type: 'number', defaultValue: 0 },
    ] },
] as SheetSection[];
const FICHE = { FOR: 15, armes_a_feu: 50, anthropologie: 0 };
const preparer = (champ: string, modificateurDuSeuil = 0) =>
    preparerLeJet(JET, FICHE, { champs: { competence: champ }, difficulte: 1, desSupplementaires: 0, modificateurDuSeuil }, SECTIONS);

describe('l’échelle du livre (p. 44)', () => {
    const echelle = echelleDeDeltaGreen(50);
    it('à 50 % : 01, 11, 22, 33, 44 sont des réussites critiques', () => {
        for (const de of [1, 11, 22, 33, 44]) expect(degreDuDe(de, echelle)).toBe('reussite-particuliere');
    });
    it('à 50 % : 55, 66, 77, 88, 99 et 00 sont des échecs critiques', () => {
        for (const de of [55, 66, 77, 88, 99, 100]) expect(degreDuDe(de, echelle)).toBe('echec-total');
    });
    it('le reste : réussite jusqu’aux chances, échec au-delà', () => {
        expect(degreDuDe(2, echelle)).toBe('reussite-normale');
        expect(degreDuDe(50, echelle)).toBe('reussite-normale');
        expect(degreDuDe(51, echelle)).toBe('echec-normal');
    });
    it('le 01 ne devient critique qu’avec la règle : Nephilim n’en a pas', () => {
        expect(degreDuDe(1, { ...echelle, critiqueSur01: false })).toBe('reussite-normale');
    });
    it('les chances restent entre 1 et 99 % (p. 43)', () => {
        expect(bornerLesChances(120)).toEqual({ chances: 99, ramenees: true });
        expect(bornerLesChances(-10)).toEqual({ chances: 1, ramenees: true });
        expect(bornerLesChances(55)).toEqual({ chances: 55, ramenees: false });
    });
});

describe('le jet préparé', () => {
    it('une compétence : ses chances, et l’échelle du livre', () => {
        const jet = preparer('armes_a_feu');
        expect(jet.seuil).toBe(50);
        expect(jet.reussitesRequises).toBe(1);
        expect(jet.echelle).toMatchObject({ chances: 50, doubles: true, critiqueSur01: true });
        expect(jet.avertissements).toEqual([]);
    });
    it('une caractéristique se teste × 5, avant le bonus ou le malus (p. 18, 43)', () => {
        expect(preparer('FOR').seuil).toBe(75);
        expect(preparer('FOR', -20).seuil).toBe(55);
        const borne = preparer('FOR', 40);
        expect(borne.seuil).toBe(99);
        expect(borne.echelle?.chances).toBe(99);
        expect(borne.remarques.some(r => r.includes('99'))).toBe(true);
    });
    it('une compétence à 0 % ne se tente pas (p. 29)', () => {
        expect(preparer('anthropologie').avertissements.some(a => a.includes('0 %'))).toBe(true);
    });
});

describe('le résultat, avec les mots du livre', () => {
    afterEach(() => vi.restoreAllMocks());
    it('33 à 50 % : « Réussite critique — 33 contre 50 % »', () => {
        // Le d100 se tire en deux d10 (dizaines, unités) : 0,35 et 0,35 donnent 33.
        vi.spyOn(Math, 'random').mockReturnValue(0.35);
        const echelle = echelleDeDeltaGreen(50);
        const r = nommerLeJetDeDeltaGreen(DiceEngine.rollThreshold(100, 1, 0, 50, 'under', echelle), echelle);
        expect(r.degre).toBe('reussite-particuliere');
        expect(r.tagSuccess).toBe(true);
        expect(r.totalDisplay).toBe('Réussite critique — 33 contre 50 %');
    });
    it('00 : « Échec critique — 00 contre 50 % »', () => {
        // Deux zéros : le « 00 », qui vaut 100.
        vi.spyOn(Math, 'random').mockReturnValue(0);
        const echelle = echelleDeDeltaGreen(50);
        const r = nommerLeJetDeDeltaGreen(DiceEngine.rollThreshold(100, 1, 0, 50, 'under', echelle), echelle);
        expect([r.degre, r.tagSuccess, r.totalDisplay]).toEqual(['echec-total', false, 'Échec critique — 00 contre 50 %']);
    });
});
