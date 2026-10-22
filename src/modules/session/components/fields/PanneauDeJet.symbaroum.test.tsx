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
 * **L'opposition explicite de Symbaroum** (2026-10-22, S1 de l'audit, choix de
 * David). Le contre-exemple de l'audit : Précision 12 contre un Attribut
 * adverse de 13, dé 10. Le livre attend `10 / 9`, un échec.
 */
const JET: DescripteurDeJet = {
    sens: 'sous-ou-egal',
    seuil: [{ id: 'attribut', label: 'Attribut', sectionId: 'attributs' }],
    reserve: { base: 1, max: 1, faces: 20 },
    modificateurDuSeuil: { min: -5, max: 5, defaut: 0, opposition: { reference: 10, label: 'Attribut adverse' } },
};
const DICE = { defaultDice: '1d20', logic: 'count-success', engine: 'standard' } as unknown as DiceConfig;
const FICHE = {
    id: 'tpl-symbaroum', name: 'Symbaroum', emoji: '🌲',
    sections: [
        { id: 'attributs', label: 'Attributs', fields: [{ id: 'precision', label: 'Précision', type: 'number', defaultValue: 0 }] },
    ],
} as unknown as SheetTemplate;

let de: ReturnType<typeof vi.spyOn>;
const faces = (...f: number[]) => de.mockImplementation(() => f.shift() ?? 20);
beforeEach(() => { de = vi.spyOn(DiceEngine, 'roll'); consigner.mockClear(); });
afterEach(() => { cleanup(); de.mockRestore(); });

const monter = () => {
    const { container } = render(<PanneauDeJet descripteur={JET} dice={DICE} template={FICHE} valeurs={{ precision: 12 }} />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'precision' } });
    return container;
};
const lancer = () => fireEvent.click(screen.getByText('Lancer', { exact: true }));

describe('l\'opposition explicite au panneau de jet', () => {
    it('la valeur adverse déplace le seuil, et le calcul se lit', () => {
        const panneau = monter();
        expect(screen.getByText('Attribut adverse')).toBeTruthy();
        fireEvent.change(panneau.querySelector('[data-valeur-adverse]')!, { target: { value: '13' } });
        expect(screen.getByText(/= 12 \+ \(10 − 13\)/)).toBeTruthy();
        expect(screen.getByText('9')).toBeTruthy();
    });

    it('le dé 10 échoue contre 9, et le journal dit l\'opposition', () => {
        const panneau = monter();
        fireEvent.change(panneau.querySelector('[data-valeur-adverse]')!, { target: { value: '13' } });
        faces(10);
        lancer();
        expect(screen.getByText(/10 \/ 9/)).toBeTruthy();
        expect(consigner).toHaveBeenCalledTimes(1);
        const entree = consigner.mock.calls[0][0] as { titre: string; tagSuccess?: boolean };
        expect(entree.titre).toBe('Attribut · Attribut adverse 13');
    });

    it('le modificateur s\'ajoute à l\'opposition', () => {
        const panneau = monter();
        fireEvent.change(panneau.querySelector('[data-valeur-adverse]')!, { target: { value: '13' } });
        fireEvent.change(panneau.querySelector('[data-modificateur-du-seuil]')!, { target: { value: '2' } });
        expect(screen.getByText(/= 12 \+ \(10 − 13\) \+ 2/)).toBeTruthy();
        faces(11);
        lancer();
        expect(screen.getByText(/11 \/ 11/)).toBeTruthy();
    });

    it('sans opposition ni modificateur, le seuil est l\'Attribut', () => {
        monter();
        faces(12);
        lancer();
        expect(screen.getByText(/12 \/ 12/)).toBeTruthy();
    });
});
