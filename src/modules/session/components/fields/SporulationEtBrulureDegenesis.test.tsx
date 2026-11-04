import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { SporulationEtBrulureDegenesis } from './SporulationEtBrulureDegenesis';
import { CLE_DEGENESIS } from '../../../dice/systemes/maximaDeDegenesis';
import type { RegleDeLaContamination } from '../../../dice/systemes/contaminationDeDegenesis';

/** **La carte « Sporulation et Brûlure »** — DEG-A5 (2026-11-04), p. 177, 186-190. */
const REGLE: RegleDeLaContamination = {
    sporulations: 'sporulations_jauge', ego: 'ego_jauge', egoMax: 'ego_max',
    resistance: ['physique', 'resistance'], attributs: ['physique', 'agilite', 'charisme', 'intellect', 'psyche', 'instinct'],
    physique: 'physique', mental: [['psyche', 'foi'], ['psyche', 'volonte']],
    social: [['charisme', 'negociation']], sens: [['instinct', 'perception']],
};
const JAUGES = [{ fieldId: 'sporulations_jauge', max: '(psyche + foi + volonte) * 2' }];
const FICHE = { psyche: 2, foi: 2, volonte: 0, physique: 3, resistance: 2, ego_jauge: 6, ego_max: 8, sporulations_jauge: 9 };

afterEach(cleanup);
const monter = (valeurs: Record<string, unknown>, faces: number[]) => {
    const appliquer = vi.fn();
    const consigner = vi.fn();
    const carte = render(<SporulationEtBrulureDegenesis regle={REGLE} valeurs={valeurs} jauges={JAUGES} libelleDuChamp={c => c}
        appliquer={appliquer} consigner={consigner} de={() => faces.shift() ?? 1} />).container;
    return { carte, appliquer, consigner };
};

describe('la carte « Sporulation et Brûlure » (DEG-A5)', () => {
    it('9 / 8 : les seuils s’affichent, le test du Germe échoue et donne un point permanent', () => {
        const { carte, appliquer, consigner } = monter(FICHE, [3, 2, 1, 1]);
        expect(carte.querySelector('[data-sporulation-total]')!.textContent).toBe('9 / 8');
        expect(carte.querySelector('[data-seuils-sporulation]')!.textContent).toContain('MolluskStigmates (50 %)');
        expect(carte.querySelector('[data-test-du-germe]')!.textContent).toContain('1 test, difficulté 1 — psyche + foi (4D)');
        fireEvent.click(screen.getByText('Lancer'));
        expect(appliquer).toHaveBeenCalledWith({ [CLE_DEGENESIS]: { version: 1, sporulationPermanente: 1, excesTeste: 1 } });
        expect(consigner).toHaveBeenCalledWith(expect.stringContaining('porteur du Germe'));
    });

    it('une Brûlure intense de Muse, 1D = 5 : Égo 6 → 8 (maximum), Sporulation 9 → 14, stimulation gardée', () => {
        const { appliquer } = monter(FICHE, [5]);
        fireEvent.change(screen.getByLabelText('Chakra de la Brûlure'), { target: { value: 'muse' } });
        fireEvent.click(screen.getByLabelText(/intense/));
        fireEvent.click(screen.getByText('Inhaler'));
        expect(appliquer).toHaveBeenCalledWith(expect.objectContaining({
            ego_jauge: 8, sporulations_jauge: 14, [CLE_DEGENESIS]: { version: 1, stimulation: { chakra: 'muse', puissance: 5 } },
        }));
    });

    it('la stimulation en cours se termine, la Sporulation reste ; l’EX ne passe pas sous les permanentes', () => {
        const fiche = { ...FICHE, [CLE_DEGENESIS]: { version: 1, sporulationPermanente: 7, stimulation: { chakra: 'argus', puissance: 4 } } };
        const { carte, appliquer } = monter(fiche, [6]);
        expect(carte.querySelector('[data-stimulation-en-cours]')!.textContent).toContain('Argus, Puissance 4 — +4 dés à l\'initiative');
        expect(carte.querySelector('[data-seuils-sporulation]')!.textContent).toContain('Léperos');
        fireEvent.click(screen.getByText('Terminer'));
        expect(appliquer).toHaveBeenLastCalledWith({ [CLE_DEGENESIS]: { version: 1, sporulationPermanente: 7 } });
        fireEvent.click(screen.getByText('Prendre l’EX'));
        expect(appliquer).toHaveBeenLastCalledWith(expect.objectContaining({ sporulations_jauge: 7 }));
    });
});
