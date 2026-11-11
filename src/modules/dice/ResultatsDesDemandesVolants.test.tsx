import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '../../i18n';

/**
 * **Le résultat d'un jet demandé, 5 s dans une fenêtre volante** (David,
 * 11/11/2026) : chez le meneur, pour les jets demandés seulement, dans la
 * colonne des alertes de message.
 */

vi.mock('../session/logic/idbStorage', () => ({
    idbStateStorage: { getItem: async () => null, setItem: async () => {}, removeItem: async () => {} },
    onPersistedStateChanged: () => () => {},
}));
vi.mock('../voice/useVoiceStore', () => ({ useVoiceStore: { subscribe: () => () => {}, getState: () => ({}) } }));

const { MessageAlertOverlay } = await import('../session/components/MessageAlertOverlay');
const { useSessionOSStore } = await import('../session/useSessionOSStore');
const { messageDeSuite } = await import('./filDesDemandes');

const DEMANDE = { id: 'd1', characterId: 'pj-ana', titre: 'Agilité' };
// Argyropée : le degré commun est « Réussite », le texte du jeu dit « Réussite partielle ».
const RESULTAT = { titre: 'Agilité 3', totalDisplay: 'Réussite partielle — dé 8 + compétence 0 = 8', degre: 'reussite-normale' as const };
const arrive = (resultat = RESULTAT) => act(() => {
    useSessionOSStore.setState(s => ({ messages: [...s.messages, messageDeSuite(DEMANDE, 'lancee', 'Ana', undefined, resultat)] }) as never);
});

beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: false, toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    useSessionOSStore.setState({ messages: [] } as never);
});
afterEach(() => vi.useRealTimers());

describe('la fenêtre volante des jets demandés', () => {
    it('paraît quand le jet demandé revient, et s’efface seule après 5 secondes', () => {
        render(<MessageAlertOverlay />);
        act(() => { vi.advanceTimersByTime(10); });
        arrive();
        const carte = screen.getByRole('status', { name: 'Jet demandé : Ana' });
        expect(carte.textContent).toContain('Agilité 3');
        expect(carte.textContent).toContain('dé 8 + compétence 0 = 8');
        // Le texte nomme déjà son verdict : pas de « Réussite » redit en tête d'une réussite partielle.
        expect(Array.from(carte.querySelectorAll('p')).map(p => p.textContent)).toEqual(['Réussite partielle — dé 8 + compétence 0 = 8']);
        act(() => { vi.advanceTimersByTime(4900); });
        expect(screen.queryByRole('status', { name: 'Jet demandé : Ana' })).not.toBeNull();
        act(() => { vi.advanceTimersByTime(200); });
        expect(screen.queryByRole('status', { name: 'Jet demandé : Ana' })).toBeNull();
    });

    it('se ferme à la main avant', () => {
        render(<MessageAlertOverlay />);
        act(() => { vi.advanceTimersByTime(10); });
        arrive();
        fireEvent.click(screen.getByTitle('Fermer'));
        expect(screen.queryByRole('status', { name: 'Jet demandé : Ana' })).toBeNull();
    });

    it('ne rejoue pas un résultat déjà dans le fil à l’ouverture, ni une annulation', () => {
        useSessionOSStore.setState({ messages: [messageDeSuite(DEMANDE, 'lancee', 'Ana', undefined, RESULTAT)] } as never);
        act(() => { vi.advanceTimersByTime(10); });
        render(<MessageAlertOverlay />);
        expect(screen.queryByRole('status', { name: 'Jet demandé : Ana' })).toBeNull();
        act(() => { vi.advanceTimersByTime(10); });
        act(() => {
            useSessionOSStore.setState(s => ({ messages: [...s.messages, messageDeSuite(DEMANDE, 'annulee', 'Ana')] }) as never);
        });
        expect(screen.queryByRole('status', { name: 'Jet demandé : Ana' })).toBeNull();
    });
});
