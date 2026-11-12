import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

/**
 * **Delta Green au pupitre de l'Officier Traitant** — 12/11/2026, David : « Corrige le jet sur les
 * critiques ». Le pupitre s'ouvre en mode « seuil » (le mode « standard » ne montrait aucune
 * chance), et le d100 se lit sur l'échelle du livre : 01 et doubles réussis critiques, 00 et
 * doubles ratés échecs critiques (p. 44).
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
vi.mock('../journal/consignerLeJet', () => ({ consignerLeJet: () => {} }));

const { default: DiceBoard } = await import('./DiceBoard');
const { useSessionOSStore } = await import('../session/useSessionOSStore');
const { useDiceStore } = await import('../../stores/useDiceStore');

// Le sélecteur ≥ / ≤ et le champ du seuil portent le même libellé : on vise le nombre.
const seuil = () => screen.getAllByLabelText('dice.inputs.threshold_rule').find(e => e.tagName === 'INPUT') as HTMLInputElement;
const lancer = () => fireEvent.click(screen.getByText('dice.actions.roll'));
const dernierJet = () => useDiceStore.getState().history[0];
// Le d100 se tire en deux d10 : dizaines puis unités, chacun sur Math.random.
const tirer = (dizaines: number, unites: number) => {
    const suite = [dizaines / 10 + 0.05, unites / 10 + 0.05];
    vi.spyOn(Math, 'random').mockImplementation(() => suite.shift() ?? 0.5);
};

beforeEach(() => {
    useDiceStore.getState().clearHistory();
    useSessionOSStore.setState({
        activeCampaignId: 'c-1',
        campaigns: [{ id: 'c-1', name: 'Opération Mégère', system: 'dg-test' }],
        customGameDrivers: [{
            id: 'dg-test', name: 'Delta Green',
            dice: { defaultDice: '1d100', logic: 'd100-low', engine: 'standard' },
            jet: { sens: 'sous-ou-egal', reserve: { base: 1, max: 1, faces: 100 },
                seuil: [{ id: 'competence', label: 'Compétence', sectionId: 'competences' }],
                deltaGreen: { caracteristiques: ['FOR'] } },
            combat: { statsToTrack: [] },
        }],
        players: [],
    } as never);
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('le d100 de Delta Green au pupitre (p. 44)', () => {
    it('le pilote ouvre le mode « seuil », sous 50 %', () => {
        render(<DiceBoard />);
        expect((screen.getByLabelText('dice.inputs.mode') as HTMLSelectElement).value).toBe('threshold');
        expect(seuil().value).toBe('50');
    });

    it('33 sous 50 % : réussite critique ; 55 : échec critique ; 01 : réussite critique', () => {
        render(<DiceBoard />);
        tirer(3, 3);
        lancer();
        expect(dernierJet().totalDisplay).toBe('Réussite critique — 33 contre 50 %');
        tirer(5, 5);
        lancer();
        expect(dernierJet().totalDisplay).toBe('Échec critique — 55 contre 50 %');
        tirer(0, 1);
        lancer();
        expect(dernierJet().totalDisplay).toBe('Réussite critique — 01 contre 50 %');
    });

    it('les chances saisies au-delà de 99 sont ramenées à 99 (p. 43)', () => {
        render(<DiceBoard />);
        fireEvent.change(seuil(), { target: { value: '120' } });
        tirer(4, 7);
        lancer();
        expect(dernierJet().totalDisplay).toBe('Réussite — 47 contre 99 %');
    });
});
