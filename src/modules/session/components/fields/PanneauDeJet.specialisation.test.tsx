import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

vi.mock('../../../journal/consignerLeJet', () => ({ consignerLeJet: () => {} }));

import PanneauDeJet from './PanneauDeJet';
import { DiceEngine } from '../../../dice/DiceEngine';
import type { DescripteurDeJet } from '../../../dice/DescripteurDeJet';
import type { SheetTemplate } from '../../../../data/defaultSheetTemplates';
import type { DiceConfig } from '../../../../types/drivers';

/**
 * **La spécialisation de Star Trek** (2026-10-14) : cochée, chaque dé inférieur
 * ou égal à la Fonction vaut deux réussites, comme le 1 naturel.
 */
const JET: DescripteurDeJet = {
    sens: 'sous-ou-egal',
    seuil: [
        { id: 'attribut', label: 'Attribut', sectionId: 'attributs' },
        { id: 'fonction', label: 'Fonction', sectionId: 'fonctions' },
    ],
    reserve: { base: 2, max: 5, faces: 20 },
    critique: 1,
    complication: 20,
    difficulte: { min: 0, max: 5, defaut: 1 },
    specialisation: { label: 'Spécialisation', composante: 'fonction' },
};
const DICE = { defaultDice: '2d20', logic: 'count-success', engine: '2d20' } as unknown as DiceConfig;
const FICHE = {
    id: 'tpl-st', name: 'Star Trek', emoji: '🖖',
    sections: [
        { id: 'attributs', label: 'Attributs', fields: [{ id: 'audace', label: 'Audace', type: 'number', defaultValue: 0 }] },
        { id: 'fonctions', label: 'Fonctions', fields: [{ id: 'securite', label: 'Sécurité', type: 'number', defaultValue: 0 }] },
    ],
} as unknown as SheetTemplate;

let de: ReturnType<typeof vi.spyOn>;
const faces = (...f: number[]) => de.mockImplementation(() => f.shift() ?? 20);
beforeEach(() => { de = vi.spyOn(DiceEngine, 'roll'); });
afterEach(() => { cleanup(); de.mockRestore(); });

const monter = () => {
    render(<PanneauDeJet descripteur={JET} dice={DICE} template={FICHE} valeurs={{ audace: 9, securite: 4 }} />);
    const [attribut, fonction] = screen.getAllByRole('combobox');
    fireEvent.change(attribut, { target: { value: 'audace' } });
    fireEvent.change(fonction, { target: { value: 'securite' } });
};
const lancer = () => fireEvent.click(screen.getByText('Lancer', { exact: true }));

describe('la spécialisation au panneau de jet', () => {
    it('sans elle, un 3 sous le seuil vaut une réussite', () => {
        monter();
        faces(3, 15);
        lancer();
        expect(screen.getByText(/^1 réussite /)).toBeTruthy();
    });

    it('cochée, un dé inférieur ou égal à la Fonction vaut deux réussites', () => {
        monter();
        fireEvent.click(screen.getByRole('checkbox'));
        expect(screen.getByText(/Spécialisation \(critique ≤ 4\)/)).toBeTruthy();
        faces(3, 15);
        lancer();
        expect(screen.getByText(/^2 réussites/)).toBeTruthy();
    });
});
