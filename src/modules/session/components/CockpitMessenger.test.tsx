import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '../../../i18n';

/**
 * Le Centre de liaison du meneur — David, 11/11/2026 : « je ne vois pas tous
 * les joueurs ». Le menu maison s'ouvrait dans un cadre qui coupe ce qui dépasse
 * et ne défilait pas ; il est devenu un `<select>` natif, qui liste tous les
 * personnages de la campagne.
 */

vi.mock('../logic/idbStorage', () => ({
    idbStateStorage: { getItem: async () => null, setItem: async () => {}, removeItem: async () => {} },
    onPersistedStateChanged: () => () => {},
}));
vi.mock('../../voice/useVoiceStore', () => ({ useVoiceStore: { subscribe: () => () => {}, getState: () => ({}) } }));

const { CockpitMessenger } = await import('./CockpitMessenger');
const { useSessionOSStore } = await import('../useSessionOSStore');

const noms = Array.from({ length: 12 }, (_, i) => `[RECETTE] PJ ${String(i + 1).padStart(2, '0')}`);

beforeEach(() => {
    useSessionOSStore.setState({
        activeCampaignId: 'camp', messages: [], sessions: [], connectedCharacters: {},
        players: [
            { id: 'j1', realName: 'A', isOnline: true, characters: noms.slice(0, 6).map((name, i) => ({ id: `pj-${i}`, name, campaignId: 'camp' })) },
            { id: 'j2', realName: 'B', isOnline: false, characters: noms.slice(6).map((name, i) => ({ id: `pj-${i + 6}`, name, campaignId: 'camp' })) },
        ],
    } as never);
});

describe('le Centre de liaison du meneur', () => {
    it('propose tous les personnages de la campagne, les absents signalés', () => {
        render(<CockpitMessenger />);
        const choix = screen.getByRole('combobox') as HTMLSelectElement;
        const options = Array.from(choix.options).map(o => o.textContent);
        expect(options).toHaveLength(13);
        expect(options[0]).toBe('Tous (Canal Global)');
        expect(options).toContain('[RECETTE] PJ 01');
        expect(options).toContain('[RECETTE] PJ 12 · hors ligne');
    });

    it('à la Table, seulement les personnages tenus par une tablette (David, 11/11)', () => {
        useSessionOSStore.setState({
            sessions: [{ id: 's1', campaignId: 'camp', status: 'active', number: 1 }],
            connectedCharacters: { 'pj-0': 'tablette-a', 'pj-7': 'tablette-b' },
        } as never);
        render(<CockpitMessenger />);
        const options = Array.from((screen.getByRole('combobox') as HTMLSelectElement).options).map(o => o.textContent);
        expect(options).toEqual(['Tous (Canal Global)', '[RECETTE] PJ 01', '[RECETTE] PJ 08']);
    });

    it('à la Table, le personnage choisi qui se déconnecte reste proposé, marqué', () => {
        useSessionOSStore.setState({
            sessions: [{ id: 's1', campaignId: 'camp', status: 'active', number: 1 }],
            connectedCharacters: { 'pj-0': 'tablette-a' },
        } as never);
        render(<CockpitMessenger />);
        fireEvent.change(screen.getByRole('combobox'), { target: { value: 'pj-0' } });
        act(() => useSessionOSStore.setState({ connectedCharacters: {} } as never));
        const options = Array.from((screen.getByRole('combobox') as HTMLSelectElement).options).map(o => o.textContent);
        expect(options).toEqual(['Tous (Canal Global)', '[RECETTE] PJ 01 · déconnecté']);
    });

    it('choisir un absent lui adresse le message', () => {
        render(<CockpitMessenger />);
        fireEvent.change(screen.getByRole('combobox'), { target: { value: 'pj-11' } });
        expect((screen.getByRole('textbox') as HTMLTextAreaElement | HTMLInputElement).placeholder).toContain('[RECETTE] PJ 12');
    });
});
