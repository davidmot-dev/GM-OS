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
 * **Le jet de Degenesis au panneau** (2026-10-30) : le jet du pilote 2.0.0, sur les
 * exemples du livre Katharsys (pages imprimées). Le pilote forgé ne lançait aucun dé.
 */
const JET: DescripteurDeJet = {
    sens: 'superieur-ou-egal',
    reserve: { base: 0, max: 12, faces: 6, composantes: [
        { id: 'attribut', label: 'Attribut', sectionId: 'attributs' },
        { id: 'competence', label: 'Compétence', sectionId: 'competences_ins', sectionsSupplementaires: ['competences_phy'] },
    ] },
    difficulte: { min: 0, max: 12, defaut: 2 },
    degenesis: { traumatismes: 'traumatismes', ego: 'ego_jauge' },
};
const DICE = { defaultDice: '6d6', logic: 'count-success', engine: 'pool', successThreshold: 4 } as unknown as DiceConfig;
const FICHE = {
    id: 'tpl-deg', name: 'Degenesis', emoji: '🍄',
    sections: [
        { id: 'attributs', label: 'Attributs', fields: [
            { id: 'physique', label: 'Physique', type: 'number', defaultValue: 1 },
            { id: 'instinct', label: 'Instinct', type: 'number', defaultValue: 1 },
        ] },
        { id: 'competences_phy', label: 'Compétences — Physique', fields: [{ id: 'corps_a_corps', label: 'Corps à corps', type: 'number', defaultValue: 0 }] },
        { id: 'competences_ins', label: 'Compétences — Instinct', fields: [{ id: 'dressage', label: 'Dressage', type: 'number', defaultValue: 0 }] },
        { id: 'ego_et_sante', label: 'Égo et santé', fields: [
            { id: 'ego_jauge', label: "Points d'Égo", type: 'number', defaultValue: 0 },
            { id: 'traumatismes', label: 'Traumatismes subis', type: 'number', defaultValue: 0 },
        ] },
    ],
} as unknown as SheetTemplate;
const FALBERG = { physique: 4, instinct: 2, corps_a_corps: 3, dressage: 1, ego_jauge: 5, traumatismes: 0 };

let de: ReturnType<typeof vi.spyOn>;
const faces = (...f: number[]) => de.mockImplementation(() => f.shift() ?? 1);
beforeEach(() => { de = vi.spyOn(DiceEngine, 'roll'); consigner.mockClear(); });
afterEach(() => { cleanup(); de.mockRestore(); });

const monter = (valeurs: Record<string, unknown> = FALBERG, ecrire = vi.fn()) => {
    const panneau = render(<PanneauDeJet descripteur={JET} dice={DICE} template={FICHE} valeurs={valeurs} ecrireSurLaFiche={ecrire} />).container;
    const [attribut, competence] = screen.getAllByRole('combobox');
    fireEvent.change(attribut, { target: { value: 'instinct' } });
    fireEvent.change(competence, { target: { value: 'dressage' } });
    return { panneau, ecrire };
};
const lancer = () => fireEvent.click(screen.getByText('Lancer', { exact: true }));

describe('le jet de Degenesis au panneau', () => {
    it('Falberg calme son cheval : INS 2 + Dressage 1, trois dés, 2, 4 et 6 — réussite « bien » (p. 18-19)', () => {
        const { panneau } = monter();
        expect(panneau.querySelector('[data-composition-degenesis]')!.textContent).toContain('= 3 : 3 dés');
        faces(2, 4, 6);
        lancer();
        expect(de).toHaveBeenCalledTimes(3);
        expect(screen.getAllByText(/Réussite bien/).length).toBeGreaterThan(0);
        const entree = consigner.mock.calls[0][0] as { titre: string; tagSuccess: boolean; totalDisplay: string };
        expect(entree.tagSuccess).toBe(true);
        expect(entree.titre).toBe('Instinct + Dressage (VA 3)');
        expect(entree.totalDisplay).toContain('2 succès, 1 déclencheur (difficulté 2)');
    });

    it('la difficulté du livre se choisit en succès requis : « Difficile » en demande quatre (p. 18)', () => {
        monter();
        fireEvent.click(screen.getByText('Difficile (4)'));
        faces(4, 5, 6);
        lancer();
        expect((consigner.mock.calls[0][0] as { tagSuccess: boolean }).tagSuccess).toBe(false);
    });

    it('échec critique : plus de 1 que de succès (p. 19)', () => {
        monter();
        faces(1, 1, 5);
        lancer();
        expect(screen.getAllByText(/Échec critique/).length).toBeGreaterThan(0);
    });

    it('un Traumatisme retire un dé ; la portée longue en retire quatre (p. 105-106)', () => {
        const { panneau } = monter({ ...FALBERG, traumatismes: 1, dressage: 6 });
        fireEvent.click(screen.getByText('Portée longue −4D'));
        expect(panneau.querySelector('[data-composition-degenesis]')!.textContent)
            .toMatch(/Valeur d'action 8 −4D −1D de Traumatisme = 3 : 3 dés/);
    });

    it('l’Égo dépensé ajoute un dé par point et quitte la fiche au lancer (p. 100)', () => {
        const { panneau, ecrire } = monter();
        fireEvent.change(screen.getByLabelText('Égo dépensé'), { target: { value: '2' } });
        expect(panneau.querySelector('[data-composition-degenesis]')!.textContent).toContain('+2D d\'Égo = 5 : 5 dés');
        faces(4, 4, 4, 4, 4);
        lancer();
        expect(de).toHaveBeenCalledTimes(5);
        expect(ecrire).toHaveBeenCalledWith({ ego_jauge: 3 });
    });
});
