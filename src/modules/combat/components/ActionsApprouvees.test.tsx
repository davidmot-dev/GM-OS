import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

/**
 * **L'Action approuvée sur la carte d'un Héros** — Torg, 2026-10-14. Réussie,
 * une Carte du Destin en main ; une fois par action et par round ; rien sans
 * carte d'Action décrite ni Paquet du Destin.
 */

vi.mock('../../session/logic/idbStorage', () => ({
    idbStateStorage: { getItem: async () => null, setItem: async () => {}, removeItem: async () => {} },
    onPersistedStateChanged: () => () => {},
}));

const { default: ActionsApprouvees } = await import('./ActionsApprouvees');
const { useSessionOSStore } = await import('../../session/useSessionOSStore');
const { useOrdreDuTourStore } = await import('../useOrdreDuTourStore');

const paquet = (id: string, role: 'action' | 'destin', p: object = {}) => ({
    id, name: id, systemId: 'torg', folderPath: 'x', cardCount: 20, format: 'poker', orientation: 'portrait', useDiscard: true, role, ...p,
});
const MARA = { id: 'cb', name: 'Mara', init: 0, isPlayer: true, faction: 'player', sourcePlayerId: 'mara', statuses: [] };

function table(avecDestin = true) {
    useSessionOSStore.setState({
        activeCampaignId: 'c', campaigns: [{ id: 'c', name: 'Torg', system: 'torg' }],
        players: [{ id: 'j', realName: 'Léa', avatarUrl: '', isOnline: true, characters: [{ id: 'mara', name: 'Mara', campaignId: 'c' }] }],
        decks: [
            paquet('action', 'action', { cardMetadata: { 5: { action: { standard: { premier: 'H' }, dramatique: { premier: 'V' }, approuvees: ['attaque', 'provocation'] } } } }),
            ...(avecDestin ? [paquet('destin', 'destin')] : []),
        ],
        deckStates: { destin: { deckId: 'destin', remainingIndices: [1, 2, 3], discardedIndices: [], currentCardIndex: null, enMain: [] } },
    } as never);
    useOrdreDuTourStore.setState({
        tour: { round: 1, campActif: 'joueurs', ontAgi: [], activationsConsecutives: 0, enAttenteDeDecision: false },
        carte: { deckId: 'action', index: 5 }, carteEnAttente: false, scene: 'standard', dejaApplique: [],
    });
}
const mainDeMara = () => (useSessionOSStore.getState().deckStates.destin.enMain ?? []).filter(c => c.porteur === 'mara');

beforeEach(() => vi.spyOn(console, 'log').mockImplementation(() => {}));
afterEach(() => { cleanup(); vi.restoreAllMocks(); useOrdreDuTourStore.setState({ tour: null, carte: null, dejaApplique: [] }); });

describe('l’Action approuvée', () => {
    it('réussie, une Carte du Destin en main — une fois par action et par round', () => {
        table();
        render(<ActionsApprouvees combatant={MARA as never} />);
        fireEvent.click(screen.getByRole('button', { name: /Provocation \+1 carte/ }));
        expect(mainDeMara()).toHaveLength(1);
        expect((screen.getByRole('button', { name: /Provocation ✓/ }) as HTMLButtonElement).disabled).toBe(true);
        fireEvent.click(screen.getByRole('button', { name: /Attaque \+1 carte/ }));
        expect(mainDeMara(), 'deux actions approuvées, deux cartes').toHaveLength(2);
    });

    it('sans Paquet du Destin, rien ne s’affiche', () => {
        table(false);
        const { container } = render(<ActionsApprouvees combatant={MARA as never} />);
        expect(container.innerHTML).toBe('');
    });

    it('un Vilain n’a pas de Cartes du Destin', () => {
        table();
        const { container } = render(<ActionsApprouvees combatant={{ ...MARA, isPlayer: false, sourcePlayerId: undefined } as never} />);
        expect(container.innerHTML).toBe('');
    });
});
