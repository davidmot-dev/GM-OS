import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

const consigner = vi.fn();
vi.mock('../../../journal/consignerLeJet', () => ({ consignerLeJet: (...a: unknown[]) => consigner(...a) }));

import PanneauDeJet from './PanneauDeJet';
import { DiceEngine } from '../../../dice/DiceEngine';
import type { DescripteurDeJet } from '../../../dice/DescripteurDeJet';
import type { SheetTemplate } from '../../../../data/defaultSheetTemplates';
import type { DiceConfig } from '../../../../types/drivers';

/**
 * **Le jet de Vampire au panneau** (2026-11-17) : le jet du pilote 2.0.0, sur les règles du
 * livre de base français (pages imprimées). Le pilote forgé ne lançait aucun dé.
 */
const JET: DescripteurDeJet = {
    sens: 'superieur-ou-egal',
    reserve: { base: 0, max: 30, sansPlafond: true, faces: 10, composantes: [
        { id: 'attribut', label: 'Attribut ou jauge', sectionId: 'attributs', sectionsSupplementaires: ['jauges'], motif: '^(?!soif$)' },
        { id: 'competence', label: 'Compétence ou discipline', sectionId: 'competences', sectionsSupplementaires: ['attributs', 'disciplines'], facultative: true },
    ] },
    difficulte: { min: 1, max: 10, defaut: 3 },
    vampire: { soif: 'soif', volonte: 'volonte', jauges: ['volonte'] },
};
const DICE = { defaultDice: '1d10', logic: 'count-success', engine: 'pool', successThreshold: 6 } as unknown as DiceConfig;
const FICHE = {
    id: 'tpl-vampire', name: 'Vampire', emoji: '🧛',
    sections: [
        { id: 'attributs', label: 'Attributs', fields: [
            { id: 'dexterite', label: 'Dextérité', type: 'number', defaultValue: 1 },
            { id: 'resolution', label: 'Résolution', type: 'number', defaultValue: 1 },
        ] },
        { id: 'competences', label: 'Compétences', fields: [
            { id: 'melee', label: 'Mêlée', type: 'number', defaultValue: 0, libelleSur: 'melee_specialites', libelleEnPrecision: true },
            { id: 'melee_specialites', label: 'Mêlée : spécialités', type: 'text', defaultValue: '' },
        ] },
        { id: 'disciplines', label: 'Disciplines', fields: [
            { id: 'discipline_1', label: 'Discipline 1', type: 'number', defaultValue: 0, libelleSur: 'discipline_1_nom' },
            { id: 'discipline_1_nom', label: 'Discipline 1 : nom', type: 'text', defaultValue: '' },
        ] },
        { id: 'jauges', label: 'Jauges', fields: [
            { id: 'soif', label: 'Soif', type: 'number', defaultValue: 1 },
            { id: 'volonte', label: 'Volonté', type: 'number', defaultValue: 0 },
        ] },
    ],
} as unknown as SheetTemplate;
const NADIA = { dexterite: 3, resolution: 2, melee: 2, melee_specialites: 'Couteaux', discipline_1: 2, discipline_1_nom: 'Célérité', soif: 2, volonte: 5 };

let de: ReturnType<typeof vi.spyOn>;
const faces = (...f: number[]) => de.mockImplementation(() => f.shift() ?? 1);
beforeEach(() => { de = vi.spyOn(DiceEngine, 'roll'); consigner.mockClear(); });
afterEach(() => { cleanup(); de.mockRestore(); });

const monter = (valeurs: Record<string, unknown> = NADIA, ecrire = vi.fn(), competence = 'melee') => {
    const panneau = render(<PanneauDeJet descripteur={JET} dice={DICE} template={FICHE} valeurs={valeurs} ecrireSurLaFiche={ecrire} />).container;
    const [attribut, seconde] = screen.getAllByRole('combobox');
    fireEvent.change(attribut, { target: { value: 'dexterite' } });
    fireEvent.change(seconde, { target: { value: competence } });
    return { panneau, ecrire };
};
const lancer = () => fireEvent.click(screen.getByText('Lancer', { exact: true }));
const composition = (panneau: HTMLElement) => panneau.querySelector('[data-composition-vampire]')!.textContent;

describe('le jet de Vampire au panneau', () => {
    it('Dextérité 3 + Mêlée 2, Soif 2 : cinq dés dont deux de Soif (p. 118, 205)', () => {
        const { panneau } = monter();
        expect(composition(panneau)).toContain('= 5 dés, dont 2 de Soif (Soif 2)');
        expect(screen.getByRole('option', { name: 'Mêlée — Couteaux (2)' })).toBeTruthy();
        expect(screen.getByRole('option', { name: 'Célérité (2)' })).toBeTruthy();
        expect(screen.getByText('Dés de Soif')).toBeTruthy();
    });

    it('une paire de 10 avec un 10 de Soif : triomphe brutal (p. 120, 207)', () => {
        monter();
        faces(10, 10, 7, 1, 10);
        lancer();
        expect(de).toHaveBeenCalledTimes(5);
        expect(screen.getAllByText(/Triomphe brutal/).length).toBeGreaterThan(0);
        const entree = consigner.mock.calls[0][0] as { titre: string; tagSuccess: boolean; totalDisplay: string };
        expect(entree.titre).toBe('Dextérité + Mêlée — Couteaux (5 dés, dont 2 de Soif)');
        expect(entree.tagSuccess).toBe(true);
        expect(entree.totalDisplay).toContain('6 réussites, 1 paire de 10, marge 3 (difficulté 3)');
        expect(screen.getAllByText('Soif · 10').length).toBe(1);
    });

    it('un échec avec un 1 de Soif est bestial ; la Compulsion se tire au tableau (p. 207-208)', () => {
        const { panneau } = monter();
        faces(2, 3, 4, 1, 5);
        lancer();
        expect(screen.getAllByText(/Échec bestial/).length).toBeGreaterThan(0);
        faces(6);
        fireEvent.click(screen.getByText('Tirer la Compulsion'));
        expect(panneau.querySelector('[data-compulsion]')!.textContent).toContain('Destruction');
    });

    it('la Volonté relance les échecs ordinaires et se décompte de la fiche (p. 122)', () => {
        const { panneau, ecrire } = monter();
        fireEvent.click(screen.getByText('Délicate (4)'));
        faces(2, 3, 8, 6, 7);
        lancer();
        expect(screen.getByText(/Victoire à la Pyrrhus possible/)).toBeTruthy();
        faces(9, 9);
        fireEvent.click(screen.getByText(/Relancer 2 dés/));
        expect(ecrire).toHaveBeenCalledWith({ volonte: 4 });
        expect(screen.getAllByText(/Victoire/).length).toBeGreaterThan(0);
        expect(panneau.querySelector('[data-suites-vampire]')!.textContent).toContain('Relancé par la Volonté (2 dés)');
        const relance = consigner.mock.calls[1][0] as { titre: string; tagSuccess: boolean };
        expect(relance.titre).toContain('relance par la Volonté (5 → 4)');
        expect(relance.tagSuccess).toBe(true);
    });

    it('la spécialité ajoute un dé et se rappelle (p. 118)', () => {
        const { panneau } = monter();
        fireEvent.click(screen.getByLabelText(/Spécialité \(\+1 dé\)/));
        expect(composition(panneau)).toContain('+1 de spécialité = 6 dés');
        expect(panneau.querySelector('[data-preparation-vampire]')!.textContent).toContain('— Couteaux');
    });

    it('un jet de jauge ne prend aucun dé de Soif, et la Volonté ne le relance pas (p. 122, 205)', () => {
        const { panneau } = monter();
        fireEvent.click(screen.getByLabelText(/Jet de jauge/));
        expect(composition(panneau)).toContain('= 5 dés, sans dé de Soif');
        faces(1, 2, 3, 4, 5);
        lancer();
        expect(screen.getAllByText(/Pas de Volonté sur un jet de jauge/).length).toBeGreaterThan(0);
    });

    it('la Volonté retenue au menu est un jet de jauge : aucun dé de Soif (p. 119, 205)', () => {
        render(<PanneauDeJet descripteur={JET} dice={DICE} template={FICHE} valeurs={NADIA} ecrireSurLaFiche={vi.fn()} />);
        fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'volonte' } });
        expect(document.querySelector('[data-composition-vampire]')!.textContent).toContain('Groupement 5 = 5 dés, sans dé de Soif');
        expect(screen.queryByRole('option', { name: /^Soif/ })).toBeNull();
    });

    it('une discipline se lance par son nom (p. 118, 244)', () => {
        monter(NADIA, vi.fn(), 'discipline_1');
        faces(6, 6, 6, 6, 6);
        lancer();
        expect((consigner.mock.calls[0][0] as { titre: string }).titre).toBe('Dextérité + Célérité (5 dés, dont 2 de Soif)');
    });

    it('le test d’Exaltation raté monte la Soif d’un point (p. 211)', () => {
        const { panneau, ecrire } = monter();
        faces(4);
        fireEvent.click(screen.getByText('Test d’Exaltation'));
        expect(ecrire).toHaveBeenCalledWith({ soif: 3 });
        expect(panneau.querySelector('[data-dernier-test]')!.textContent).toContain('Soif 2 → 3');
        // La Soif écrite se voit aussitôt : trois dés de Soif au prochain jet.
        expect(composition(panneau)).toContain('dont 3 de Soif (Soif 3)');
    });
});

/**
 * **Les dégâts case par case au panneau** (2026-11-17, pilote 2.1.0, p. 126-127, 216-218) : la
 * relance coche un « / » de Volonté, l'Affaiblissement retire deux dés, la régénération efface
 * des « / » de Santé contre un test d'Exaltation.
 */
const JET_DEGATS: DescripteurDeJet = {
    ...JET,
    vampire: {
        ...JET.vampire!,
        degats: { sante: 'sante_degats', volonte: 'volonte_degats', jaugeDeSante: 'sante' },
        puissance: 'puissance_du_sang', recuperationDeVolonte: ['resolution', 'sang_froid'],
        groupes: { physique: ['dexterite', 'melee'], social: ['sang_froid'], mental: ['resolution'] },
    },
};
const FICHE_DEGATS = { ...FICHE, sections: [...FICHE.sections, { id: 'degats', label: 'Dégâts', fields: [
    { id: 'sante', label: 'Santé', type: 'number', defaultValue: 0 },
    { id: 'sante_degats', label: 'Dégâts de Santé', type: 'text', defaultValue: '' },
    { id: 'volonte_degats', label: 'Dégâts de Volonté', type: 'text', defaultValue: '' },
    { id: 'sang_froid', label: 'Sang-froid', type: 'number', defaultValue: 1 },
    { id: 'puissance_du_sang', label: 'Puissance du sang', type: 'number', defaultValue: 0 },
] }] } as unknown as SheetTemplate;

const monterAvecDegats = (valeurs: Record<string, unknown>, ecrire = vi.fn()) => {
    const panneau = render(<PanneauDeJet descripteur={JET_DEGATS} dice={DICE} template={FICHE_DEGATS} valeurs={valeurs} ecrireSurLaFiche={ecrire} />).container;
    const [attribut, seconde] = screen.getAllByRole('combobox');
    fireEvent.change(attribut, { target: { value: 'dexterite' } });
    fireEvent.change(seconde, { target: { value: 'melee' } });
    return { panneau, ecrire };
};

describe('les dégâts de Vampire au panneau', () => {
    it('Santé pleine de « / » : Affaibli, deux dés de moins au groupement physique (p. 126)', () => {
        const { panneau } = monterAvecDegats({ ...NADIA, soif: 0, sante: 5, sante_degats: '/////' });
        expect(composition(panneau)).toContain('−2 d’Affaiblissement = 3 dés');
        const caseAffaibli = panneau.querySelector('[data-affaibli-vampire]') as HTMLInputElement;
        expect(caseAffaibli.checked).toBe(true);
        expect(panneau.querySelector('[data-piste="sante"]')!.textContent).toContain('/////');
        expect(panneau.querySelector('[data-piste="sante"]')!.textContent).toContain('Affaibli');
        // Le conteur juge ce groupement épargné.
        fireEvent.click(caseAffaibli);
        expect(composition(panneau)).toContain('= 5 dés');
    });

    it('la relance par la Volonté coche un « / » de Volonté, sans la diviser (p. 122, 126)', () => {
        const { ecrire } = monterAvecDegats({ ...NADIA, sante: 5, volonte: 5, volonte_degats: '' });
        fireEvent.click(screen.getByText('Délicate (4)'));
        faces(2, 3, 8, 6, 7);
        lancer();
        faces(9, 9);
        fireEvent.click(screen.getByText(/Relancer 2 dés/));
        expect(ecrire).toHaveBeenCalledWith({ volonte_degats: '/', volonte: 5 });
        const relance = consigner.mock.calls[1][0] as { titre: string };
        expect(relance.titre).toContain('Volonté : 1 dégât superficiel');
    });

    it('Volonté pleine de « / » : la relance en change un en « X » (p. 126-127)', () => {
        const { ecrire } = monterAvecDegats({ ...NADIA, sante: 5, volonte: 3, volonte_degats: '///' });
        faces(2, 3, 8, 6, 7);
        lancer();
        faces(9, 9);
        fireEvent.click(screen.getByText(/Relancer 2 dés/));
        expect(ecrire).toHaveBeenCalledWith({ volonte_degats: 'X//', volonte: 2 });
    });

    it('régénérer : un test d’Exaltation efface des « / » selon la Puissance du sang (p. 216, 218)', () => {
        const { ecrire } = monterAvecDegats({ ...NADIA, soif: 2, sante: 5, sante_degats: 'X///', puissance_du_sang: 2 });
        faces(4);
        fireEvent.click(screen.getByText(/Régénérer \(2 « \/ »\)/));
        expect(ecrire).toHaveBeenCalledWith({ sante_degats: 'X/', soif: 3 });
    });

    it('début de partie : la Volonté perd Résolution ou Sang-froid « / », le plus élevé (p. 127)', () => {
        const { ecrire } = monterAvecDegats({ ...NADIA, resolution: 2, sang_froid: 3, sante: 5, volonte: 5, volonte_degats: 'X////' });
        fireEvent.click(screen.getByText(/Début de partie : Volonté \(3 « \/ »\)/));
        expect(ecrire).toHaveBeenCalledWith({ volonte_degats: 'X/' });
    });
});
