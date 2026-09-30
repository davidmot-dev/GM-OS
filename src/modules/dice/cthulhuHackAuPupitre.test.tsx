import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, within, cleanup } from '@testing-library/react';

/**
 * **Cthulhu Hack au pupitre de Dice-OS** — demandé par David le 2026-09-30.
 * Le moteur est éprouvé dans `cthulhuHack.test.ts` ; ici, les gestes de
 * l'écran : le dé de ressource qui descend tout seul, la Sauvegarde à
 * l'avantage, et un pilote qui ne détourne pas ces deux jets.
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
const choisirLeMode = (mode: string) =>
    fireEvent.change(screen.getByLabelText('dice.inputs.mode'), { target: { value: mode } });
const lancer = () => fireEvent.click(screen.getByText('dice.actions.roll'));
const dernierJet = () => useDiceStore.getState().history[0];

beforeEach(() => {
    useDiceStore.getState().clearHistory();
    useSessionOSStore.setState({ activeCampaignId: null, campaigns: [], customGameDrivers: [] } as never);
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });
/** Les boutons des dés, dans la colonne des réglages : le dernier jet affiche aussi « d6 ». */
const reglages = () => within(screen.getByRole('complementary', { name: 'Réglages' }));

describe('le dé de ressource', () => {
    it('descend tout seul après un 1 ou un 2', () => {
        render(<DiceBoard />);
        choisirLeMode('usure');
        fireEvent.click(reglages().getByText('d8'));

        tirer(2);
        lancer();

        expect(dernierJet().usure).toEqual({ avant: 8, apres: 6 });
        expect(reglages().getByText('d6').closest('button')!.getAttribute('aria-pressed')).toBe('true');
    });

    it('reste le même dé quand il tient', () => {
        render(<DiceBoard />);
        choisirLeMode('usure');
        fireEvent.click(reglages().getByText('d10'));

        tirer(7);
        lancer();

        expect(dernierJet().usure).toEqual({ avant: 10, apres: 10 });
        expect(reglages().getByText('d10').closest('button')!.getAttribute('aria-pressed')).toBe('true');
    });

    it('n’offre que les dés d’une ressource : pas de d100', () => {
        render(<DiceBoard />);
        choisirLeMode('usure');
        expect(reglages().queryByText('d100')).toBe(null);
        expect(reglages().queryByText('d20')).not.toBe(null);
    });

    /**
     * Le pilote de David déclare une réserve de dés : en mode système, Dice-OS
     * lance ce que dit le pilote. Un dé de ressource n'est jamais ce jet-là.
     */
    it('n’est pas détourné par le pilote actif', () => {
        useSessionOSStore.setState({
            activeCampaignId: 'c-1',
            campaigns: [{ id: 'c-1', name: 'Le Secret de Milo', system: 'ch-test' }],
            customGameDrivers: [{ id: 'ch-test', name: 'Cthulhu Hack', dice: { defaultDice: '1d20', logic: 'count-success', engine: 'pool', successThreshold: 8 } }],
        } as never);
        render(<DiceBoard />);
        choisirLeMode('usure');
        fireEvent.click(reglages().getByText('d12'));

        tirer(1);
        lancer();

        expect(dernierJet().usure).toEqual({ avant: 12, apres: 10 });
    });
});

describe('la Sauvegarde', () => {
    it('se lance sous la caractéristique, à l’avantage', () => {
        render(<DiceBoard />);
        choisirLeMode('sauvegarde');
        fireEvent.change(screen.getByLabelText('dice.agencement.caracteristique'), { target: { value: '12' } });
        fireEvent.click(screen.getByText('dice.agencement.avantage'));

        tirer(15, 4);
        lancer();

        const jet = dernierJet();
        expect(jet.total).toBe(4);
        expect(jet.tagSuccess).toBe(true);
        expect(jet.title).toContain('dice.agencement.avantage');
    });

    it('n’offre pas la rangée des dés : c’est un d20', () => {
        render(<DiceBoard />);
        choisirLeMode('sauvegarde');
        expect(reglages().queryByText('d6')).toBe(null);
    });
});
