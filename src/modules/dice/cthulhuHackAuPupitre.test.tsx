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
    /**
     * **Le pilote de David, tel qu’il est** (sauvegarde du 2026-09-30) : il
     * décrit un d20 sous la Sauvegarde sans nommer de moteur. Le pupitre en
     * faisait une réserve de dés au seuil 8.
     */
    it('est le mode où s’ouvre le pupitre avec le pilote de Cthulhu Hack', () => {
        useSessionOSStore.setState({
            activeCampaignId: 'c-1',
            campaigns: [{ id: 'c-1', name: 'Le Secret de Milo', system: 'ch-test' }],
            customGameDrivers: [{
                id: 'ch-test', name: 'Cthulhu Hack',
                dice: { defaultDice: '1d20', logic: 'count-success', engine: 'standard' },
                jet: { sens: 'sous-ou-egal', seuil: [{ id: 'sauvegarde', label: 'Sauvegarde', sectionId: 'sauvegardes' }], reserve: { base: 1, max: 1, faces: 20 }, critique: 1, complication: 20 },
            }],
        } as never);
        render(<DiceBoard />);
        expect((screen.getByLabelText('dice.inputs.mode') as HTMLSelectElement).value).toBe('sauvegarde');
    });

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

/**
 * **Étape 4 : le dé de chaque ressource, sur la fiche** (2026-09-30). Le
 * pilote de David ne déclare pas `desDUsure` : ses ressources se reconnaissent
 * à ce qu'il les suit en combat et que leur champ porte un dé.
 */
describe('le dé de ressource d’un personnage', () => {
    const ouvrirMilo = (fiche: Record<string, unknown>) => {
        useSessionOSStore.setState({
            activeCampaignId: 'c-1',
            campaigns: [{ id: 'c-1', name: 'Le Secret de Milo', system: 'ch-test' }],
            customGameDrivers: [{
                id: 'ch-test', name: 'Cthulhu Hack',
                dice: { defaultDice: '1d20', logic: 'count-success', engine: 'standard' },
                jet: { sens: 'sous-ou-egal', reserve: { base: 1, max: 1, faces: 20 } },
                combat: { statsToTrack: [
                    { fieldId: 'mentalHealth', label: 'Santé Mentale', isMainHP: false, isResource: true },
                    { fieldId: 'torche', label: 'Torche', isMainHP: false, isResource: true },
                ] },
            }],
            players: [{ id: 'j1', realName: 'Joueuse', avatarUrl: '', isOnline: false, characters: [
                { id: 'p1', name: 'Milo', campaignId: 'c-1', templateId: 't', portraitUrl: '', sheetData: fiche },
            ] }],
        } as never);
        render(<DiceBoard />);
        choisirLeMode('usure');
        fireEvent.change(screen.getByLabelText('dice.agencement.personnage'), { target: { value: 'p1' } });
    };
    const ficheDeMilo = () => (useSessionOSStore.getState() as never as { players: { characters: { sheetData: Record<string, unknown> }[] }[] })
        .players[0].characters[0].sheetData;

    it('lit le dé sur la fiche, le lance, et y réécrit ce qu’il devient', () => {
        ouvrirMilo({ torche: 'd8', mentalHealth: 'd4' });
        fireEvent.click(reglages().getByText('Torche'));

        tirer(2);
        lancer();

        expect(dernierJet().usure).toEqual({ avant: 8, apres: 6 });
        expect(ficheDeMilo().torche).toBe('d6');
    });

    it('écrit l’épuisement, et ne relance plus une ressource épuisée', () => {
        ouvrirMilo({ torche: 'd8', mentalHealth: 'd4' });
        fireEvent.click(reglages().getByText('Santé Mentale'));

        tirer(1);
        lancer();

        expect(ficheDeMilo().mentalHealth).toBe('Épuisée');
        expect(screen.getByText('dice.actions.roll').closest('button')!.hasAttribute('disabled')).toBe(true);
    });
});
