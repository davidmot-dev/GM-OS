import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

/**
 * **Le Paquet d'Action dans Combat-OS** — Torg, 2026-10-13. Retourner une
 * carte ouvre le round sur le camp qu'elle désigne ; une carte inconnue se
 * décrit une fois ; Inspiration et Fatigués s'appliquent au Choc en un clic.
 */

vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (cle: string) => cle, i18n: { language: 'fr' } }),
    initReactI18next: { type: '3rdParty', init: () => {} },
}));
vi.mock('../../session/logic/idbStorage', () => ({
    idbStateStorage: { getItem: async () => null, setItem: async () => {}, removeItem: async () => {} },
    onPersistedStateChanged: () => () => {},
}));
vi.mock('../../voice/useVoiceStore', () => ({
    useVoiceStore: { subscribe: () => () => {}, getState: () => ({}) },
}));

const { default: PanneauDuPaquetDAction } = await import('./PanneauDuPaquetDAction');
const { useSessionOSStore } = await import('../../session/useSessionOSStore');
const { useCombatStore } = await import('../useCombatStore');
const { useOrdreDuTourStore } = await import('../useOrdreDuTourStore');

const TORG = {
    id: 'torg', name: 'Torg Eternity', templateId: 'tpl',
    dice: { defaultDice: '1d20', logic: 'sum', engine: 'standard' },
    combat: {
        statsToTrack: [{ fieldId: 'choc', label: 'Choc', isMainHP: false, isResource: true, max: 'esprit' }],
        initiativeFormula: 'dexterite',
        initiative: { mode: 'paquet' },
        dommages: { mecanique: 'torg', resistance: 'resistance', choc: 'choc' },
    },
};

const PAQUET = {
    id: 'pa', name: 'Paquet d’Action', systemId: 'torg', folderPath: 'decks/torg/action', cardCount: 66,
    format: 'poker', orientation: 'portrait', useDiscard: true, role: 'action',
    cardMetadata: { 1: { action: { standard: { premier: 'H', heros: ['inspiration'] }, dramatique: { premier: 'V', heros: ['fatigues'] }, approuvees: ['provocation'] } } },
};

function table(options: { paquet?: boolean; pioche?: number[]; chocDeMara?: number } = {}) {
    const { paquet = true, pioche = [1], chocDeMara = 5 } = options;
    useSessionOSStore.setState({
        activeCampaignId: 'c', customGameDrivers: [TORG],
        campaigns: [{ id: 'c', name: 'Torg', system: 'torg' }],
        players: [{ id: 'j', realName: 'Léa', avatarUrl: '', isOnline: false, characters: [
            { id: 'mara', name: 'Mara', campaignId: 'c', templateId: 'tpl', sheetData: { esprit: 8, choc: chocDeMara } },
        ] }],
        entities: [{ id: 'gospog', name: 'Gospog', type: 'npc', sheetData: { esprit: 6, choc: 1 } }],
        decks: paquet ? [PAQUET] : [],
        deckStates: paquet ? { pa: { deckId: 'pa', remainingIndices: pioche, discardedIndices: [], currentCardIndex: null } } : {},
        isProjecting: false,
    } as never);
    useCombatStore.setState({
        round: 1,
        combatants: [
            { id: 'cb-mara', name: 'Mara', init: 0, isPlayer: true, faction: 'player', sourcePlayerId: 'mara', statuses: [] },
            { id: 'cb-gospog', name: 'Gospog', init: 0, isPlayer: false, faction: 'enemy', sourceEntityId: 'gospog', statuses: [] },
        ],
    } as never);
}

const chocDe = () => (useSessionOSStore.getState() as never as { players: { characters: { sheetData: Record<string, unknown> }[] }[] })
    .players[0].characters[0].sheetData.choc;

beforeEach(() => useOrdreDuTourStore.setState({ tour: null, carte: null, carteEnAttente: false, dejaApplique: [], scene: 'standard' }));
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('retourner une carte décrite', () => {
    it('ouvre le round sur le camp qu’elle désigne, et nomme l’Action approuvée', () => {
        table();
        render(<PanneauDuPaquetDAction />);
        fireEvent.click(screen.getByRole('button', { name: 'Retourner la première carte d’Action' }));

        expect(screen.getByText(/Héros d’abord/, { selector: '[data-qui-commence]' })).toBeTruthy();
        expect(screen.getByText('Provocation')).toBeTruthy();
        expect(screen.getByRole('button', { name: 'Mara' })).toBeTruthy();
        expect(screen.queryByRole('button', { name: 'Gospog' }), 'les Vilains attendent leur tour').toBeNull();
    });

    it('la scène dramatique lit la ligne sombre', () => {
        table();
        render(<PanneauDuPaquetDAction />);
        fireEvent.click(screen.getByRole('button', { name: 'Dramatique' }));
        fireEvent.click(screen.getByRole('button', { name: 'Retourner la première carte d’Action' }));
        expect(screen.getByText(/Vilains d’abord/, { selector: '[data-qui-commence]' })).toBeTruthy();
        expect(screen.getByRole('button', { name: 'Gospog' })).toBeTruthy();
    });

    it('Inspiration : −2 Choc aux Héros, en un clic, une fois', () => {
        table();
        render(<PanneauDuPaquetDAction />);
        fireEvent.click(screen.getByRole('button', { name: 'Retourner la première carte d’Action' }));
        fireEvent.click(screen.getByRole('button', { name: '−2 Choc aux Héros' }));
        expect(chocDe()).toBe(3);
        expect((screen.getByRole('button', { name: 'Appliqué' }) as HTMLButtonElement).disabled).toBe(true);
    });

    it('le camp joue tous ses tours, puis l’autre ; le round fini, on retourne la suivante', () => {
        table({ pioche: [1, 1] });
        render(<PanneauDuPaquetDAction />);
        fireEvent.click(screen.getByRole('button', { name: 'Retourner la première carte d’Action' }));
        fireEvent.click(screen.getByRole('button', { name: 'Mara' }));
        fireEvent.click(screen.getByRole('button', { name: 'Gospog' }));
        expect(screen.getByRole('button', { name: 'Retourner la carte suivante' })).toBeTruthy();
    });
});

describe('une carte que personne n’a décrite', () => {
    it('se décrit une fois, et le round s’ouvre sur ce qu’elle dit', () => {
        table({ pioche: [2] });
        render(<PanneauDuPaquetDAction />);
        fireEvent.click(screen.getByRole('button', { name: 'Retourner la première carte d’Action' }));

        const standard = screen.getByText('Scène standard').closest('[data-ligne-de-conflit]') as HTMLElement;
        fireEvent.click(Array.from(standard.querySelectorAll('button')).find(b => b.textContent === 'V — Vilains')!);
        fireEvent.click(screen.getByRole('button', { name: 'Enregistrer la carte' }));

        expect(screen.getByText(/Vilains d’abord/, { selector: '[data-qui-commence]' })).toBeTruthy();
        expect(screen.getByRole('button', { name: 'Gospog' })).toBeTruthy();
        const deck = useSessionOSStore.getState().decks.find(d => d.id === 'pa')!;
        expect(deck.cardMetadata?.[2]?.action?.standard.premier, 'la carte reste décrite').toBe('V');
    });
});

describe('sans Paquet d’Action', () => {
    it('le dit, et laisse le meneur désigner le camp', () => {
        table({ paquet: false });
        render(<PanneauDuPaquetDAction />);
        expect(screen.getByText(/Aucun paquet de ce jeu/)).toBeTruthy();
        fireEvent.click(screen.getByRole('button', { name: /Vilains d’abord/ }));
        expect(screen.getByRole('button', { name: 'Gospog' })).toBeTruthy();
    });
});
