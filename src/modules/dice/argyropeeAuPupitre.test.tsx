import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

/**
 * **Argyropée au pupitre du Conteur** — 09/11/2026, à la demande de David (« l'Exubérance,
 * la Faveur divine, la Guigne, la magie et le dé de compétence des PNJ ») : le test d'un
 * PNJ, son degré de compétence tiré au d6 (p. 185), et la Guigne (p. 177).
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
const consigner = vi.fn();
vi.mock('../journal/consignerLeJet', () => ({ consignerLeJet: (...a: unknown[]) => consigner(...a) }));

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
const fiche = (i: number) => (useSessionOSStore.getState() as never as { players: { characters: { sheetData: Record<string, unknown> }[] }[] })
    .players[0].characters[i].sheetData;

beforeEach(() => {
    useDiceStore.getState().clearHistory();
    consigner.mockClear();
    useSessionOSStore.setState({
        activeCampaignId: 'c-1',
        campaigns: [{ id: 'c-1', name: 'Les Sentiers d’Argent', system: 'argy-test' }],
        customGameDrivers: [{
            id: 'argy-test', name: 'Argyropée',
            dice: { defaultDice: '1d10', logic: 'sum', engine: 'standard' },
            jet: { sens: 'superieur-ou-egal', reserve: { base: 1, max: 1, faces: 10 },
                seuil: [{ id: 'competence', label: 'Compétence', sectionId: 'competences' }],
                argyropee: { panache: 'panache', guigne: { depense: 'guigne_depense', offert: 'guigne_offerte' } } },
            combat: { statsToTrack: [] },
        }],
        players: [{ id: 'j1', realName: 'Joueuse', avatarUrl: '', isOnline: false, characters: [
            { id: 'p1', name: 'Vanille', campaignId: 'c-1', templateId: 't', portraitUrl: '', sheetData: { panache: 9, guigne_depense: 7, guigne_offerte: 0 } },
            { id: 'p2', name: 'Grégoire', campaignId: 'c-1', templateId: 't', portraitUrl: '', sheetData: { panache: 14, guigne_depense: 2, guigne_offerte: 3 } },
        ] }],
    } as never);
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('le test d’un PNJ d’Argyropée au pupitre (p. 185)', () => {
    it('le pilote choisit le mode ; compétence privilégiée : 1d6 + carrière + 1d10 (0 à 9)', () => {
        render(<DiceBoard />);
        expect((screen.getByLabelText('dice.inputs.mode') as HTMLSelectElement).value).toBe('argyropee-pnj');
        fireEvent.change(screen.getByLabelText('Bonus de carrière'), { target: { value: '2' } });
        tirer(4, 7); // d6 = 4, d10 = 7
        lancer();
        expect(dernierJet().title).toBe('Argyropée — PNJ — compétence privilégiée (1d6) · carrière +2');
        expect(dernierJet().totalDisplay).toContain('Réussite — dé 7 + compétence 4 (1d6 = 4) + métier 2 = 13');
    });

    it('non privilégiée : le d6 divisé par deux ; le 10 du d10 vaut 0', () => {
        render(<DiceBoard />);
        fireEvent.click(screen.getByLabelText(/Compétence privilégiée/));
        tirer(5, 10);
        lancer();
        expect(dernierJet().totalDisplay).toContain('Échec — dé 0 + compétence 2 (1d6 = 5, divisé par 2) = 2');
    });
});

describe('le modificateur du Conteur au pupitre (p. 45)', () => {
    it('s’ajoute au test du PNJ', () => {
        render(<DiceBoard />);
        fireEvent.change(screen.getByLabelText('Modificateur du Conteur'), { target: { value: '-3' } });
        tirer(3, 6);
        lancer();
        expect(dernierJet().totalDisplay).toContain('Échec — dé 6 + compétence 3 (1d6 = 3) − 3 = 6');
    });
});

describe('la Guigne au pupitre (p. 177)', () => {
    it('montre le Panache dépensé aux tests, sans alerte, et « Guigne réglée » offre 3 points au prochain réveil', () => {
        const { container } = render(<DiceBoard />);
        const carte = container.querySelector('[data-guigne-argyropee]')!;
        expect(carte.textContent).toContain('Vanille7 · reste 9');
        expect(carte.textContent).toContain('Grégoire2 · reste 14 · +3 au réveil');
        fireEvent.click(screen.getByText(/Guigne réglée/));
        expect(fiche(0)).toMatchObject({ guigne_offerte: 3, guigne_depense: 0, panache: 9 });
        expect(fiche(1)).toMatchObject({ guigne_offerte: 6, guigne_depense: 0 });
        expect((consigner.mock.calls.at(-1)![0] as { titre: string }).titre).toBe('Guigne réglée');
    });
});
