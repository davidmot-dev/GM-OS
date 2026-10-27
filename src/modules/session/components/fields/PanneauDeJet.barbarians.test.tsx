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
 * **Le jet de Barbarians of Lemuria au panneau** (2026-10-27) : le jet du pilote 2.0.0,
 * sur les exemples du livre (pages imprimées). Le pilote forgé réussissait tout.
 */
const JET: DescripteurDeJet = {
    sens: 'superieur-ou-egal',
    seuil: [
        { id: 'attribut', label: 'Attribut', sectionId: 'attributs' },
        { id: 'action', label: 'Carrière ou aptitude de combat', sectionId: 'carrieres', sectionsSupplementaires: ['aptitudes_combat'], facultative: true },
    ],
    reserve: { base: 2, max: 2, faces: 6 },
    barbarians: { heroisme: 'points_heroisme', cible: 9 },
};
const DICE = { defaultDice: '2d6', logic: 'sum', engine: 'standard' } as unknown as DiceConfig;
const FICHE = {
    id: 'tpl-bol', name: 'Barbarians of Lemuria', emoji: '🌴',
    sections: [
        { id: 'attributs', label: 'Attributs', fields: [
            { id: 'vigueur', label: 'Vigueur', type: 'number', defaultValue: 0 },
            { id: 'agilite', label: 'Agilité', type: 'number', defaultValue: 0 },
        ] },
        { id: 'aptitudes_combat', label: 'Aptitudes de combat', fields: [{ id: 'melee', label: 'Mêlée', type: 'number', defaultValue: 0 }] },
        { id: 'carrieres', label: 'Carrières', fields: [
            { id: 'carriere1_nom', label: 'Carrière 1', type: 'text', defaultValue: '' },
            { id: 'carriere1', label: 'Rang de la carrière 1', type: 'number', defaultValue: 0, libelleSur: 'carriere1_nom' },
        ] },
        { id: 'jauges', label: 'Réserves', fields: [{ id: 'points_heroisme', label: "Points d'héroïsme", type: 'number', defaultValue: 5 }] },
    ],
} as unknown as SheetTemplate;
const VALEURS = { vigueur: 3, agilite: 1, melee: 2, carriere1_nom: 'Barbare', carriere1: 2, points_heroisme: 5 };

let de: ReturnType<typeof vi.spyOn>;
const faces = (...f: number[]) => de.mockImplementation(() => f.shift() ?? 1);
beforeEach(() => { de = vi.spyOn(DiceEngine, 'roll'); consigner.mockClear(); });
afterEach(() => { cleanup(); de.mockRestore(); });

const monter = (ecrire = vi.fn()) => {
    const panneau = render(<PanneauDeJet descripteur={JET} dice={DICE} template={FICHE} valeurs={VALEURS} ecrireSurLaFiche={ecrire} />).container;
    const [attribut, action] = screen.getAllByRole('combobox');
    fireEvent.change(attribut, { target: { value: 'vigueur' } });
    return { panneau, action, ecrire };
};
const lancer = () => fireEvent.click(screen.getByText('Lancer', { exact: true }));

describe('le jet de Barbarians of Lemuria au panneau', () => {
    it('Krongar brise la porte : 4 + 6 + Vigueur 3, Ardue −1 = 12, réussi (p. 57)', () => {
        const { panneau } = monter();
        fireEvent.change(screen.getByLabelText('Difficulté'), { target: { value: '-1' } });
        expect(panneau.querySelector('[data-composition-barbarians]')!.textContent).toContain('2d6 + 2');
        faces(4, 6);
        lancer();
        expect(screen.getByText(/Réussite — 10 \+ 2 = 12/)).toBeTruthy();
        const entree = consigner.mock.calls[0][0] as { titre: string; tagSuccess: boolean };
        expect(entree.tagSuccess).toBe(true);
    });

    it('un 2 et un 1 avec Vigueur 3 + Barbare 2 font 8 : échec, et non une réussite d’office', () => {
        monter();
        fireEvent.change(screen.getAllByRole('combobox')[1], { target: { value: 'carriere1' } });
        faces(2, 1);
        lancer();
        expect(screen.getByText(/Échec — 3 \+ 5 = 8/)).toBeTruthy();
        expect((consigner.mock.calls[0][0] as { tagSuccess: boolean }).tagSuccess).toBe(false);
    });

    it('la carrière se choisit sous son nom, et la Défense de la cible se retire (p. 62)', () => {
        const { action } = monter();
        expect(screen.getByRole('option', { name: /Barbare/ })).toBeTruthy();
        fireEvent.change(action, { target: { value: 'melee' } });
        fireEvent.change(screen.getByLabelText('Défense ou Initiative adverse'), { target: { value: '1' } });
        faces(2, 3);
        lancer();
        // 5 + Vigueur 3 + Mêlée 2 − Défense 1 = 9.
        expect(screen.getByText(/Réussite — 5 \+ 4 = 9/)).toBeTruthy();
    });

    it('un dé de bonus : trois dés, les deux meilleurs (p. 62)', () => {
        monter();
        fireEvent.change(screen.getByLabelText('Dés de bonus'), { target: { value: '1' } });
        faces(1, 2, 5);
        lancer();
        expect(screen.getByText(/Réussite — 7 \+ 3 = 10/)).toBeTruthy();
    });

    it('1 point d’héroïsme change une réussite en succès héroïque, et s’écrit sur la fiche (p. 59)', () => {
        const { ecrire } = monter();
        faces(4, 5);
        lancer();
        fireEvent.click(screen.getByText('Succès héroïque (1)'));
        expect(ecrire).toHaveBeenCalledWith({ points_heroisme: 4 });
        expect(screen.getAllByText(/Succès héroïque/).length).toBeGreaterThan(0);
        expect(screen.queryByText('Succès héroïque (1)')).toBeNull();
    });

    it('la Faveur divine relance tous les dés pour 1 point, même un double 1 (p. 58)', () => {
        const { ecrire } = monter();
        faces(1, 1, 6, 6);
        lancer();
        expect(screen.getAllByText(/Échec automatique/).length).toBeGreaterThan(0);
        fireEvent.click(screen.getByText('Faveur divine : relancer (1)'));
        expect(ecrire).toHaveBeenCalledWith({ points_heroisme: 4 });
        expect(screen.getAllByText(/Succès héroïque — double 6/).length).toBeGreaterThan(0);
    });

    it('le jet de réaction dit la place dans l’ordre du combat (p. 60)', () => {
        const { panneau } = monter();
        fireEvent.click(screen.getByLabelText('Jet de réaction'));
        faces(1, 2);
        lancer();
        expect(panneau.querySelector('[data-ordre-de-reaction]')!.textContent).toContain('avant la piétaille');
    });
});
