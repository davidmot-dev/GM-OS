import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, fireEvent, within } from '@testing-library/react';
import '../../i18n';

/**
 * **Le rappel d'une jauge, 5 s dans la carte volante** — lot 2
 * (`2026-11-11-rappel-de-jet-du.md`, T5 ; C2). Chez le meneur, dans la colonne
 * des alertes de message ; seulement quand un rappel **s'allume** après
 * l'ouverture.
 */

vi.mock('../session/logic/idbStorage', () => ({
    idbStateStorage: { getItem: async () => null, setItem: async () => {}, removeItem: async () => {} },
    onPersistedStateChanged: () => () => {},
}));
vi.mock('../voice/useVoiceStore', () => ({ useVoiceStore: { subscribe: () => () => {}, getState: () => ({}) } }));
vi.mock('../journal/useJournalStore', () => ({
    useJournalStore: { getState: () => ({ isRecording: false, addEvent: vi.fn() }) },
}));

const { MessageAlertOverlay } = await import('../session/components/MessageAlertOverlay');
const { useClockStore } = await import('../../store/useClockStore');
const { useSessionOSStore } = await import('../session/useSessionOSStore');

const AIR = { id: 'air', name: 'Air respirable', totalSegments: 3, filledSegments: 1, sens: 'epuisement' as const,
    rappel: { texte: "Jet d'Endurance, tout le monde" } };
const carte = () => screen.queryByRole('status', { name: 'Rappel : Air respirable' });
const vider = () => act(() => useClockStore.getState().updateTensionSegments('air', -1));

beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    useSessionOSStore.setState({ messages: [] } as never);
    useClockStore.setState({ tensions: [{ ...AIR, rappel: { ...AIR.rappel } }] });
});
afterEach(() => vi.useRealTimers());

describe('la carte volante du rappel', () => {
    it('paraît quand le rappel s’allume, et s’efface seule après 5 secondes', () => {
        render(<MessageAlertOverlay />);
        expect(carte()).toBeNull();
        vider();
        expect(carte()!.textContent).toContain("Jet d'Endurance, tout le monde");
        expect(carte()!.textContent).toContain('à vide');
        act(() => { vi.advanceTimersByTime(4900); });
        expect(carte()).not.toBeNull();
        act(() => { vi.advanceTimersByTime(200); });
        expect(carte()).toBeNull();
    });

    it('rien pour un rappel qui attendait déjà à l’ouverture', () => {
        useClockStore.setState({ tensions: [{ ...AIR, filledSegments: 0, rappel: { ...AIR.rappel } }] });
        render(<MessageAlertOverlay />);
        expect(carte()).toBeNull();
    });

    it('« Fait » sur la carte volante : le rappel est traité et la carte se ferme', () => {
        render(<MessageAlertOverlay />);
        vider();
        fireEvent.click(within(carte()!).getByRole('button', { name: 'Fait' }));
        expect(carte()).toBeNull();
        expect(useClockStore.getState().tensions[0].rappel?.traite).toBe(true);
    });

    it('traité puis revenu au passage suivant, il s’allume à nouveau', () => {
        render(<MessageAlertOverlay />);
        vider();
        act(() => { vi.advanceTimersByTime(5100); });
        act(() => useClockStore.getState().traiterLeRappel('air'));
        act(() => useClockStore.getState().updateTensionSegments('air', 1));
        expect(carte()).toBeNull();
        vider();
        expect(carte()).not.toBeNull();
    });
});
