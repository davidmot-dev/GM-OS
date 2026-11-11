import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

vi.mock('../../../journal/consignerLeJet', () => ({ consignerLeJet: () => {} }));

import PanneauDeJet from './PanneauDeJet';
import { DiceEngine } from '../../../dice/DiceEngine';
import type { DescripteurDeJet } from '../../../dice/DescripteurDeJet';
import type { SheetTemplate } from '../../../../data/defaultSheetTemplates';
import type { DiceConfig } from '../../../../types/drivers';

/**
 * **Le panneau s'ouvre sur le jet que le meneur a demandé** — plan
 * `2026-11-11-jets-demandes-et-caches.md`, T2 (C2, C3). Les champs, la difficulté
 * et le modificateur du seuil arrivent préremplis ; le joueur peut encore les
 * changer, et le jet part comme s'il les avait choisis lui-même.
 */
const DICE_D20 = { defaultDice: '1d20', logic: 'count-success', engine: 'standard' } as unknown as DiceConfig;
const FICHE = {
    id: 'tpl', name: 'Essai', emoji: '🎲',
    sections: [
        { id: 'attributs', label: 'Attributs', fields: [
            { id: 'precision', label: 'Précision', type: 'number', defaultValue: 0 },
            { id: 'vigilance', label: 'Vigilance', type: 'number', defaultValue: 0 },
        ] },
        { id: 'competences', label: 'Compétences', fields: [
            { id: 'mobilite', label: 'Mobilité', type: 'number', defaultValue: 0 },
            { id: 'combat', label: 'Combat', type: 'number', defaultValue: 0 },
        ] },
    ],
} as unknown as SheetTemplate;

/** Un seuil déplaçable, à la Symbaroum : d20 ≤ Attribut + modificateur. */
const SOUS_UN_SEUIL: DescripteurDeJet = {
    sens: 'sous-ou-egal',
    seuil: [{ id: 'attribut', label: 'Attribut', sectionId: 'attributs' }],
    reserve: { base: 1, max: 1, faces: 20 },
    modificateurDuSeuil: { min: -5, max: 5, defaut: 0 },
};

/** Une réserve composée sur la fiche, à la Alien, avec réussites exigées. */
const RESERVE: DescripteurDeJet = {
    sens: 'superieur-ou-egal',
    reserve: {
        base: 0, max: 20, faces: 6,
        composantes: [
            { id: 'attribut', label: 'Attribut', sectionId: 'attributs' },
            { id: 'competence', label: 'Compétence', sectionId: 'competences' },
        ],
    },
    difficulte: { min: 1, max: 5, defaut: 1 },
} as unknown as DescripteurDeJet;

let de: ReturnType<typeof vi.spyOn>;
beforeEach(() => { de = vi.spyOn(DiceEngine, 'roll'); });
afterEach(() => { cleanup(); de.mockRestore(); });

const valeurDe = (combobox: HTMLElement) => (combobox as HTMLSelectElement).value;

describe('la composition demandée par le meneur', () => {
    it('préremplit le champ et le modificateur du seuil — et le jet en tient compte', () => {
        render(<PanneauDeJet descripteur={SOUS_UN_SEUIL} dice={DICE_D20} template={FICHE}
            valeurs={{ precision: 12, vigilance: 14 }}
            compositionInitiale={{ champs: { attribut: 'vigilance' }, modificateurDuSeuil: -2 }} />);
        expect(valeurDe(screen.getAllByRole('combobox')[0])).toBe('vigilance');
        de.mockImplementation(() => 13);
        fireEvent.click(screen.getByText('Lancer', { exact: true }));
        // Vigilance 14, modificateur −2 : seuil 12, et le 13 échoue.
        expect(screen.getByText(/13 \/ 12/)).toBeTruthy();
    });

    it('préremplit les composantes de la réserve et la difficulté', () => {
        const { container } = render(<PanneauDeJet descripteur={RESERVE} dice={DICE_D20} template={FICHE}
            valeurs={{ precision: 2, vigilance: 3, mobilite: 1, combat: 4 }}
            compositionInitiale={{ champs: { attribut: 'precision', competence: 'combat' }, difficulte: 3 }} />);
        const [attribut, competence] = screen.getAllByRole('combobox');
        expect(valeurDe(attribut)).toBe('precision');
        expect(valeurDe(competence)).toBe('combat');
        expect(container.textContent).toContain('3');
    });

    it('le joueur peut encore changer ce qui est prérempli', () => {
        render(<PanneauDeJet descripteur={SOUS_UN_SEUIL} dice={DICE_D20} template={FICHE}
            valeurs={{ precision: 12, vigilance: 14 }}
            compositionInitiale={{ champs: { attribut: 'vigilance' } }} />);
        fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'precision' } });
        expect(valeurDe(screen.getAllByRole('combobox')[0])).toBe('precision');
    });

    it('sans demande, rien n’est prérempli — le panneau d’hier', () => {
        render(<PanneauDeJet descripteur={SOUS_UN_SEUIL} dice={DICE_D20} template={FICHE} valeurs={{ precision: 12 }} />);
        expect(valeurDe(screen.getAllByRole('combobox')[0])).toBe('');
    });
});
