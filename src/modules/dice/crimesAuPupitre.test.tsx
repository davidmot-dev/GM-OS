import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

/**
 * **Crimes au pupitre de Dice-OS** — C1, reste (2026-10-23). Le pupitre lançait
 * une réserve qui comptait toutes les réussites : le jet gardé y a son mode.
 */

vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (cle: string) => cle, i18n: { language: 'fr' } }),
    initReactI18next: { type: '3rdParty', init: () => {} },
}));
vi.mock('../session/logic/idbStorage', () => ({
    idbStateStorage: { getItem: async () => null, setItem: async () => {}, removeItem: async () => {} },
    onPersistedStateChanged: () => () => {},
}));
vi.mock('../voice/useVoiceStore', () => ({
    useVoiceStore: { subscribe: () => () => {}, getState: () => ({}) },
}));

const { default: DiceBoard } = await import('./DiceBoard');
const { DiceEngine } = await import('./DiceEngine');
const { useSessionOSStore } = await import('../session/useSessionOSStore');
const { useDiceStore } = await import('../../stores/useDiceStore');

const tirer = (...faces: number[]) => {
    const suite = [...faces];
    vi.spyOn(DiceEngine, 'roll').mockImplementation(() => suite.shift()!);
};
const lancer = () => fireEvent.click(screen.getByText('dice.actions.roll'));
const dernierJet = () => useDiceStore.getState().history[0];

beforeEach(() => {
    useDiceStore.getState().clearHistory();
    useSessionOSStore.setState({
        activeCampaignId: 'c-1',
        campaigns: [{ id: 'c-1', name: 'L’affaire du Bombyx', system: 'crimes-test' }],
        customGameDrivers: [{
            id: 'crimes-test', name: 'Crimes',
            dice: { defaultDice: 'D10', logic: 'count-success', engine: 'pool' },
            jet: { reserve: { base: 0, max: 10, faces: 10 }, sens: 'superieur-ou-egal',
                garde: { competence: { id: 'competence', label: 'Compétence', sectionId: 'competences' }, seuil: 9, competent: 1, specialise: 2 } },
        }],
    } as never);
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('le jet gardé au pupitre', () => {
    it('le pilote de Crimes choisit le mode, seuil 8 d’office', () => {
        render(<DiceBoard />);
        expect((screen.getByLabelText('dice.inputs.mode') as HTMLSelectElement).value).toBe('garde');
        expect((screen.getByLabelText('Seuil') as HTMLInputElement).value).toBe('8');
    });

    it('l’exemple du livre : Potentiel 5 GARDE 2, [1, 3, 4, 6, 8] → réussite mitigée, pas deux réussites comptées', () => {
        render(<DiceBoard />);
        fireEvent.change(screen.getByLabelText('Potentiel'), { target: { value: '5' } });
        fireEvent.change(screen.getByLabelText('Gardés'), { target: { value: '2' } });
        tirer(1, 3, 4, 6, 8);
        lancer();
        expect(dernierJet().title).toBe('Crimes — Potentiel 5 GARDE 2 (seuil 8)');
        expect(dernierJet().totalDisplay).toBe('Réussite mitigée — gardés 1, 8 (seuil 8)');
        expect(dernierJet().successes).toBe(1);
    });
});
