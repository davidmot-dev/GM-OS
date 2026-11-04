import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

const consigner = vi.fn();
vi.mock('../../../journal/consignerLeJet', () => ({ consignerLeJet: (...a: unknown[]) => consigner(...a) }));

import PanneauDeJet from './PanneauDeJet';
import { DiceEngine } from '../../../dice/DiceEngine';
import { CLE_DEGENESIS } from '../../../dice/systemes/maximaDeDegenesis';
import type { DescripteurDeJet } from '../../../dice/DescripteurDeJet';
import type { SheetTemplate } from '../../../../data/defaultSheetTemplates';
import type { DiceConfig } from '../../../../types/drivers';

/**
 * **La Brûlure et les Potentiels au panneau de jet** — DEG-A5 (2026-11-04) : la stimulation
 * en cours se propose, cochée, quand le jet correspond ; un Potentiel se choisit (p. 188-190).
 */
const JET: DescripteurDeJet = {
    sens: 'superieur-ou-egal',
    reserve: { base: 0, max: 12, faces: 6, composantes: [
        { id: 'attribut', label: 'Attribut', sectionId: 'attributs' },
        { id: 'competence', label: 'Compétence', sectionId: 'competences' },
    ] },
    difficulte: { min: 0, max: 12, defaut: 2 },
    degenesis: { contamination: {
        sporulations: 'sporulations_jauge', resistance: ['physique', 'resistance'],
        attributs: ['physique', 'agilite', 'charisme', 'intellect', 'psyche', 'instinct'], physique: 'physique',
        mental: [['psyche', 'foi']], social: [], sens: [['instinct', 'perception']],
        potentiels: [{ nom: 'potentiel1_nom', niveau: 'potentiel1' }, { nom: 'potentiel2_nom', niveau: 'potentiel2' }],
    } },
};
const DICE = { defaultDice: '6d6', logic: 'count-success', engine: 'pool', successThreshold: 4 } as unknown as DiceConfig;
const FICHE = {
    id: 'tpl', name: 'Degenesis', emoji: '',
    sections: [
        { id: 'attributs', label: 'Attributs', fields: [
            { id: 'instinct', label: 'Instinct', type: 'number', defaultValue: 1 },
            { id: 'psyche', label: 'Psyché', type: 'number', defaultValue: 1 },
        ] },
        { id: 'competences', label: 'Compétences', fields: [
            { id: 'perception', label: 'Perception', type: 'number', defaultValue: 0 },
            { id: 'foi', label: 'Foi', type: 'number', defaultValue: 0 },
        ] },
    ],
} as unknown as SheetTemplate;
const FALBERG = {
    instinct: 2, perception: 1, psyche: 2, foi: 2, potentiel1_nom: 'Fanatisme', potentiel1: 1, potentiel2_nom: '',
    [CLE_DEGENESIS]: { version: 1, stimulation: { chakra: 'muse', puissance: 4 } },
};

let de: ReturnType<typeof vi.spyOn>;
beforeEach(() => { de = vi.spyOn(DiceEngine, 'roll').mockImplementation(() => 4); consigner.mockClear(); });
afterEach(() => { cleanup(); de.mockRestore(); });

const monter = (attribut: string, competence: string) => {
    const panneau = render(<PanneauDeJet descripteur={JET} dice={DICE} template={FICHE} valeurs={FALBERG} personnageId="falberg" />).container;
    const [a, c] = screen.getAllByRole('combobox');
    fireEvent.change(a, { target: { value: attribut } });
    fireEvent.change(c, { target: { value: competence } });
    return panneau;
};

describe('la stimulation et les Potentiels au jet (DEG-A5)', () => {
    it('Muse, Puissance 4, sur INS + Perception : +4D cochés d’office, retirables', () => {
        const p = monter('instinct', 'perception');
        expect(p.querySelector('[data-bonus-de-stimulation]')!.textContent).toContain('Stimulation — Muse : +4D');
        expect(p.querySelector('[data-composition-degenesis]')!.textContent).toContain('= 7 : 7 dés');
        fireEvent.click(screen.getByText(/Stimulation — Muse/));
        expect(p.querySelector('[data-composition-degenesis]')!.textContent).toContain('= 3 : 3 dés');
    });

    it('la Muse ne touche pas PSY + Foi ; un Potentiel choisi ajoute ses dés et se dit au journal', () => {
        const p = monter('psyche', 'foi');
        expect(p.querySelector('[data-bonus-de-stimulation]')).toBeNull();
        const potentiels = screen.getByLabelText('Potentiel utilisé') as HTMLSelectElement;
        expect([...potentiels.options].map(o => o.textContent)).toEqual(['— aucun Potentiel —', 'Fanatisme (niveau 1)']);
        fireEvent.change(potentiels, { target: { value: 'potentiel1_nom' } });
        fireEvent.change(screen.getByLabelText('Dés du Potentiel'), { target: { value: '1' } });
        expect(p.querySelector('[data-composition-degenesis]')!.textContent).toContain('= 5 : 5 dés');
        fireEvent.click(screen.getByText('Lancer', { exact: true }));
        expect(de).toHaveBeenCalledTimes(5);
        // Ce que le lancer a fait se dit sous le résultat, comme l'action du round (DEG-A1).
        expect(p.textContent).toContain('Potentiel Fanatisme (niveau 1) : +1D');
        expect((screen.getByLabelText('Potentiel utilisé') as HTMLSelectElement).value).toBe('');
    });
});
