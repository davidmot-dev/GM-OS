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

/**
 * **TRV-A1 — la préparation Traveller arrive avec la demande** (27/11/2026, spécification
 * `2026-11-27-traveller-jets-demandes-et-degats.md`, C3). Même forme de jet que le pilote 2.0.0.
 */
describe('TRV-A1 — la préparation demandée par le meneur, sur Traveller', () => {
    const DICE_2D6 = { defaultDice: '2d6', logic: 'sum', engine: 'standard' } as unknown as DiceConfig;
    const FICHE_TRAVELLER = {
        id: 'tpl-t', name: 'Voyageur', emoji: '🚀',
        sections: [
            { id: 'caracteristiques', label: 'Caractéristiques', fields: [{ id: 'dexterite', label: 'Dextérité', type: 'number', defaultValue: 7 }] },
            { id: 'competences', label: 'Compétences', fields: [{ id: 'furtivite', label: 'Furtivité', type: 'text', defaultValue: '' }] },
        ],
    } as unknown as SheetTemplate;
    const JET_TRAVELLER = {
        sens: 'superieur-ou-egal',
        seuil: [
            { id: 'caracteristique', label: 'Caractéristique', sectionId: 'caracteristiques' },
            { id: 'competence', label: 'Compétence', sectionId: 'competences', facultative: true },
        ],
        reserve: { base: 2, max: 3, faces: 6 },
        traveller: { caracteristiques: ['dexterite'], competences: [{ niveau: 'furtivite', domaine: 'Furtivité' }], cible: 8 },
    } as unknown as DescripteurDeJet;
    const preparation = { difficulte: 10, pouceOuSort: -1 as const, duree: 1 as const, tachesSupplementaires: 0, chaine: 0, autre: 0 };

    it('s’ouvre sur la difficulté, le Coup du sort et la durée du meneur — et le jet en tient compte', () => {
        render(<PanneauDeJet descripteur={JET_TRAVELLER} dice={DICE_2D6} template={FICHE_TRAVELLER}
            valeurs={{ dexterite: 10, furtivite: '0' }}
            compositionInitiale={{ champs: { caracteristique: 'dexterite', competence: 'furtivite' }, traveller: preparation }} />);
        expect(valeurDe(screen.getByLabelText('Difficulté', { exact: true }))).toBe('10');
        expect(valeurDe(screen.getByLabelText('Coup de pouce ou Coup du sort', { exact: true }))).toBe('-1');
        expect(valeurDe(screen.getByLabelText('Durée', { exact: true }))).toBe('1');
        // DEX 10 (MD +1) et Furtivité 0, plus lentement (+2) : +3. Coup du sort : 6, 6, 1 → 6 + 1 = 7, +3 = 10, contre 10+.
        let n = 0; de.mockImplementation(() => [6, 6, 1][n++ % 3]);
        fireEvent.click(screen.getByText('Lancer', { exact: true }));
        expect(document.body.textContent).toMatch(/Effet \+0/);
    });

    it('le joueur peut encore changer la difficulté préparée', () => {
        render(<PanneauDeJet descripteur={JET_TRAVELLER} dice={DICE_2D6} template={FICHE_TRAVELLER}
            valeurs={{ dexterite: 10, furtivite: '0' }}
            compositionInitiale={{ champs: { caracteristique: 'dexterite' }, traveller: preparation }} />);
        fireEvent.change(screen.getByLabelText('Difficulté', { exact: true }), { target: { value: '6' } });
        expect(valeurDe(screen.getByLabelText('Difficulté', { exact: true }))).toBe('6');
    });

    it('sans demande, la tablette part de Moyenne (8+)', () => {
        render(<PanneauDeJet descripteur={JET_TRAVELLER} dice={DICE_2D6} template={FICHE_TRAVELLER} valeurs={{ dexterite: 10 }} />);
        expect(valeurDe(screen.getByLabelText('Difficulté', { exact: true }))).toBe('8');
    });
});
