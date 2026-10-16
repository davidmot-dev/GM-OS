import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

vi.mock('../../../journal/consignerLeJet', () => ({ consignerLeJet: () => {} }));

import PanneauDeJet from './PanneauDeJet';
import { DiceEngine } from '../../../dice/DiceEngine';
import type { DescripteurDeJet } from '../../../dice/DescripteurDeJet';
import type { SheetTemplate } from '../../../../data/defaultSheetTemplates';

/**
 * **La Fortune au panneau de jet** — Cthulhu Hack, 2026-10-16 : sous une
 * Sauvegarde ratée, placer un jeton pour relancer, deux pour réussir, jamais plus
 * de deux sur la fiche.
 */
const JET: DescripteurDeJet = {
    sens: 'sous-ou-egal',
    seuil: [{ id: 'sauvegarde', label: 'Sauvegarde', sectionId: 'sauvegardes' }],
    reserve: { base: 1, max: 1, faces: 20 },
    fortune: { champ: 'fortune', max: 2, relance: 1, reussite: 2 },
};
const DICE = { defaultDice: '1d20', logic: 'count-success' as const, engine: 'standard' as const };
const FICHE = {
    id: 'tpl-ch', name: 'Investigateur', emoji: '🐙',
    sections: [{ id: 'sauvegardes', label: 'Sauvegardes', fields: [{ id: 'sagesse', label: 'Sagesse', type: 'number' }] }],
} as unknown as SheetTemplate;

let lancer: ReturnType<typeof vi.spyOn>;
beforeEach(() => { lancer = vi.spyOn(DiceEngine, 'rollFromConfig'); });
afterEach(() => { cleanup(); lancer.mockRestore(); });

const resultat = (reussi: boolean) => ({
    total: reussi ? 5 : 17, rolls: [{ val: reussi ? 5 : 17, sides: 20 }], modifier: 0,
    successes: reussi ? 1 : 0, fails: 0, tagSuccess: reussi, totalDisplay: reussi ? '5' : '17',
});
const monter = (valeurs: Record<string, unknown>, ecrire = vi.fn()) => {
    render(<PanneauDeJet descripteur={JET} dice={DICE} template={FICHE} valeurs={valeurs} ecrireSurLaFiche={ecrire} />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'sagesse' } });
    return ecrire;
};
const lancerLeJet = () => fireEvent.click(screen.getByText('Lancer', { exact: true }));
const bouton = (nom: RegExp) => screen.getByRole('button', { name: nom }) as HTMLButtonElement;

describe('la Fortune', () => {
    it('rien sous un jet réussi', () => {
        lancer.mockReturnValue(resultat(true));
        monter({ sagesse: 12, fortune: 0 });
        lancerLeJet();
        expect(screen.queryByText(/Relancer \(\+1/)).toBeNull();
    });

    it('réussir : deux jetons placés, le jet devient une réussite', () => {
        lancer.mockReturnValue(resultat(false));
        const ecrire = monter({ sagesse: 12, fortune: 0 });
        lancerLeJet();
        fireEvent.click(bouton(/Réussir \(\+2/));
        expect(ecrire).toHaveBeenCalledWith({ fortune: 2 });
        expect(screen.getByText(/réussi \(Fortune\)/)).toBeTruthy();
        expect(screen.queryByText(/Relancer \(\+1/)).toBeNull();
    });

    it('relancer : un jeton, puis la relance ; à deux jetons, plus rien ne s’offre', () => {
        lancer.mockReturnValue(resultat(false));
        const ecrire = monter({ sagesse: 12, fortune: 0 });
        lancerLeJet();
        expect(bouton(/Réussir \(\+2/).disabled).toBe(false);
        fireEvent.click(bouton(/Relancer \(\+1/));
        expect(ecrire).toHaveBeenCalledWith({ fortune: 1 });
        expect(lancer).toHaveBeenCalledTimes(2);
        // Encore raté, avec un jeton : relancer reste possible, réussir non.
        expect(bouton(/Relancer \(\+1/).disabled).toBe(false);
        expect(bouton(/Réussir \(\+2/).disabled).toBe(true);
        fireEvent.click(bouton(/Relancer \(\+1/));
        expect(ecrire).toHaveBeenLastCalledWith({ fortune: 2 });
        expect(bouton(/Relancer \(\+1/).disabled).toBe(true);
    });
});
