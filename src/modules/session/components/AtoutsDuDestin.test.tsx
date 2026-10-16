import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

/**
 * **Les Atouts qui touchent aux Cartes du Destin** — Torg, 2026-10-16. Piocher
 * plusieurs cartes et en garder une (Aspect effrayant, Occultiste, Ingénieux),
 * chercher une carte dans la pioche ou la défausse (Populaire).
 */

vi.mock('../logic/idbStorage', () => ({
    idbStateStorage: { getItem: async () => null, setItem: async () => {}, removeItem: async () => {} },
    onPersistedStateChanged: () => () => {},
}));

const { default: AtoutsDuDestin } = await import('./AtoutsDuDestin');
const { useSessionOSStore } = await import('../useSessionOSStore');

const DESTIN = {
    id: 'destin', name: 'Destin', systemId: 'torg', folderPath: 'x', cardCount: 6, format: 'poker', orientation: 'portrait', useDiscard: true, role: 'destin',
    cardMetadata: { 1: { name: 'Drame' }, 2: { name: 'Héroïsme' }, 3: { name: 'Adrénaline' }, 6: { name: 'Relation' } },
};
const PERSONNAGES = [{ id: 'mara', name: 'Mara' }, { id: 'teo', name: 'Teo' }];

beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    useSessionOSStore.setState({
        activeCampaignId: 'c', campaigns: [{ id: 'c', name: 'Torg', system: 'torg' }],
        players: [{ id: 'j', realName: 'Léa', avatarUrl: '', isOnline: true, characters: PERSONNAGES.map(p => ({ ...p, campaignId: 'c' })) }],
        decks: [DESTIN],
        deckStates: { destin: { deckId: 'destin', remainingIndices: [1, 2, 3, 4], discardedIndices: [6], currentCardIndex: null, enMain: [] } },
    } as never);
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

const etat = () => useSessionOSStore.getState().deckStates.destin;

describe('les Atouts sur le Paquet du Destin', () => {
    it('piocher deux cartes, en garder une pour Teo : l’autre est défaussée', () => {
        render(<AtoutsDuDestin deck={DESTIN as never} personnages={PERSONNAGES} />);
        fireEvent.change(screen.getByLabelText('Pour quel personnage'), { target: { value: 'teo' } });
        fireEvent.click(screen.getByRole('button', { name: /Piocher, en garder une/ }));
        // Regarder ne sort rien du paquet.
        expect(etat().remainingIndices).toEqual([1, 2, 3, 4]);
        fireEvent.click(screen.getByRole('button', { name: 'Garder « Héroïsme »' }));
        expect(etat().enMain).toEqual([{ index: 2, porteur: 'teo', face: 'revelee' }]);
        expect(etat().discardedIndices).toEqual([6, 1]);
        expect(screen.queryByRole('button', { name: /Garder « Drame »/ })).toBeNull();
    });

    it('Populaire : la carte Relation se cherche dans la défausse', () => {
        render(<AtoutsDuDestin deck={DESTIN as never} personnages={PERSONNAGES} />);
        fireEvent.click(screen.getByRole('button', { name: /Chercher une carte/ }));
        // Sans nom au manifeste, la carte se reconnaît à son image.
        expect(screen.getByRole('button', { name: 'Prendre « Carte #4 »' })).toBeTruthy();
        fireEvent.click(screen.getByRole('button', { name: 'Prendre « Relation »' }));
        expect(etat().enMain).toEqual([{ index: 6, porteur: 'mara', face: 'revelee' }]);
        expect(etat().discardedIndices).toEqual([]);
        expect(screen.queryByRole('button', { name: /Prendre «/ })).toBeNull();
    });

    it('sans personnage dans la campagne, rien ne s’affiche', () => {
        const { container } = render(<AtoutsDuDestin deck={DESTIN as never} personnages={[]} />);
        expect(container.innerHTML).toBe('');
    });
});
