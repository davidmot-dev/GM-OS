import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';

vi.mock('../../../journal/consignerLeJet', () => ({ consignerLeJet: () => {} }));

import PanneauDeJet from './PanneauDeJet';
import type { DescripteurDeJet } from '../../../dice/DescripteurDeJet';
import type { SheetTemplate } from '../../../../data/defaultSheetTemplates';

/**
 * **Le jet de Nephilim, au panneau** — 2026-10-17. Le joueur choisit un Vécu
 * (passé ou contemporain) par son NOM, puis, s'il le veut, le Ka de son
 * approche ; la cible vaut (Vécu + Ka) × 10.
 */
const JET: DescripteurDeJet = {
    sens: 'sous-ou-egal',
    cible: {
        mecanique: 'nephilim',
        caracteristique: { id: 'vecu', label: 'Vécu', sectionId: 'vecus' },
        ajustement: [{ id: 'approche', label: 'Approche', sectionId: 'pentacle', facultative: true }],
    },
    reserve: { base: 1, max: 1, faces: 100 },
};
const DICE = { defaultDice: '1d100', logic: 'd100-low' as const, engine: 'standard' as const };
const FICHE = {
    id: 'tpl-nephilim', name: 'Nephilim', emoji: '✨',
    sections: [
        { id: 'vecus', label: 'Vécus', fields: [
            { id: 'simulacrum.experience', label: 'Vécu du simulacre', type: 'text', defaultValue: '' },
            { id: 'simulacrum.experience.degree', label: 'Degré de vécu du simulacre', type: 'number', defaultValue: 0, libelleSur: 'simulacrum.experience' },
            { id: 'pastlives.0.name', label: 'Vécu passé 1', type: 'text', defaultValue: '' },
            { id: 'pastlives.0.degree', label: 'Degré du vécu passé 1', type: 'number', defaultValue: 0, libelleSur: 'pastlives.0.name' },
            { id: 'pastlives.1.name', label: 'Vécu passé 2', type: 'text', defaultValue: '' },
            { id: 'pastlives.1.degree', label: 'Degré du vécu passé 2', type: 'number', defaultValue: 0, libelleSur: 'pastlives.1.name' },
        ] },
        { id: 'pentacle', label: 'Pentacle', fields: [
            { id: 'ka.fire', label: 'Ka-Feu', type: 'number', defaultValue: 0 },
            { id: 'ka.water', label: 'Ka-Eau', type: 'number', defaultValue: 0 },
        ] },
    ],
} as unknown as SheetTemplate;
const VALEURS = {
    'simulacrum.experience': 'Infirmière', 'simulacrum.experience.degree': 5,
    'pastlives.0.name': 'Templier', 'pastlives.0.degree': 4,
    // Le Vécu 2 n'est pas écrit : il n'a rien à proposer.
    'pastlives.1.name': '', 'pastlives.1.degree': 0,
    'ka.fire': 5, 'ka.water': 3,
};

afterEach(cleanup);

describe('le jet de Nephilim au panneau', () => {
    it('le menu des Vécus porte leurs noms, sans les champs de nom ni les lignes vides', () => {
        render(<PanneauDeJet descripteur={JET} dice={DICE} template={FICHE} valeurs={VALEURS} />);
        const [vecu] = screen.getAllByRole('combobox');
        const options = within(vecu).getAllByRole('option').map(o => o.textContent);
        expect(options).toEqual(['— choisir —', 'Infirmière (5)', 'Templier (4)']);
    });

    it('Templier 4 avec l’approche du Feu 5 : 90 %, et le d100 dit sa marge', () => {
        const lancer = vi.spyOn(Math, 'random');
        lancer.mockReturnValueOnce(0.35).mockReturnValueOnce(0.75);
        render(<PanneauDeJet descripteur={JET} dice={DICE} template={FICHE} valeurs={VALEURS} />);
        const [vecu, approche] = screen.getAllByRole('combobox');
        fireEvent.change(vecu, { target: { value: 'pastlives.0.degree' } });
        fireEvent.change(approche, { target: { value: 'ka.fire' } });
        expect(screen.getAllByText(/\(4 \+ 5\) × 10 = 90 %/).length).toBeGreaterThan(0);
        fireEvent.click(screen.getByText('Lancer', { exact: true }));
        expect(screen.getAllByText(/37 vs 90 — marge 3/).length).toBeGreaterThan(0);
        lancer.mockRestore();
    });
});
