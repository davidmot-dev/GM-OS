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
const { DiceEngine } = await import('../../dice/DiceEngine');
const { ouvrirChoixAtoutTorg, poserParAtoutTorg } = await import('../logic/gestesDesAtoutsTorg');
const PILOTE = { id: 'torg', cartesDuDestin: { taille: 4 }, jet: { torg: { possibilites: 'poss', blessures: 'blessures' } },
    torg: { raison: 'raison', sciencesHumaines: 'sciences', atouts: { occultiste: 'occ', ingenieux: 'ing', populaire: 'pop', chefNaturel: 'chef' } } };

const DESTIN = {
    id: 'destin', name: 'Destin', systemId: 'torg', folderPath: 'x', cardCount: 6, format: 'poker', orientation: 'portrait', useDiscard: true, role: 'destin',
    cardMetadata: { 1: { name: 'Drame' }, 2: { name: 'Héroïsme' }, 3: { name: 'Adrénaline' }, 6: { name: 'Relation' } },
};
const PERSONNAGES = [{ id: 'mara', name: 'Mara' }, { id: 'teo', name: 'Teo' }];

beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    useSessionOSStore.setState({
        activeCampaignId: 'c', campaigns: [{ id: 'c', name: 'Torg', system: 'torg' }],
        getActiveDriver: () => PILOTE,
        players: [{ id: 'j', realName: 'Léa', avatarUrl: '', isOnline: true, characters: PERSONNAGES.map(p => ({ ...p, campaignId: 'c', sheetData: { raison: 10, sciences: 2, poss: 3, occ: true, ing: true, pop: true, chef: true } })) }],
        decks: [DESTIN],
        deckStates: { destin: { deckId: 'destin', remainingIndices: [1, 2, 3, 4], discardedIndices: [6], currentCardIndex: null, enMain: [] } },
    } as never);
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

const etat = () => useSessionOSStore.getState().deckStates.destin;

describe('les Atouts sur le Paquet du Destin', () => {
    it('piocher deux cartes, en garder une pour Teo : l’autre est défaussée', () => {
        vi.spyOn(DiceEngine, 'roll').mockReturnValue(16);
        render(<AtoutsDuDestin deck={DESTIN as never} personnages={PERSONNAGES} />);
        fireEvent.change(screen.getByLabelText('Pour quel personnage'), { target: { value: 'teo' } });
        fireEvent.click(screen.getByLabelText(/Début d’un combat/));
        fireEvent.click(screen.getByRole('button', { name: /Occultiste · Sciences humaines/ }));
        // Regarder ne sort rien du paquet.
        expect(etat().remainingIndices).toEqual([1, 2, 3, 4]);
        fireEvent.click(screen.getByRole('button', { name: 'Garder « Héroïsme »' }));
        expect(etat().enMain).toEqual([{ index: 2, porteur: 'teo', face: 'revelee' }]);
        expect(etat().discardedIndices).toEqual([6, 1]);
        expect(screen.queryByRole('button', { name: /Garder « Drame »/ })).toBeNull();
    });

    it('Populaire : la carte Relation se cherche dans la défausse', () => {
        render(<AtoutsDuDestin deck={DESTIN as never} personnages={PERSONNAGES} />);
        fireEvent.change(screen.getByLabelText('Atout de Torg'), { target: { value: 'populaire' } });
        fireEvent.click(screen.getByRole('button', { name: /Chercher une carte/ }));
        // Sans nom au manifeste, la carte se reconnaît à son image.
        expect(screen.queryByRole('button', { name: 'Prendre « Carte #4 »' })).toBeNull();
        fireEvent.click(screen.getByRole('button', { name: 'Prendre « Relation »' }));
        expect(etat().enMain).toEqual([{ index: 6, porteur: 'mara', face: 'revelee' }]);
        expect(etat().discardedIndices).toEqual([]);
        expect(etat().torgUsagesActe).toEqual(['mara:populaire']);
        expect(screen.queryByRole('button', { name: /Prendre «/ })).toBeNull();
    });

    it('sans personnage dans la campagne, rien ne s’affiche', () => {
        const { container } = render(<AtoutsDuDestin deck={DESTIN as never} personnages={[]} />);
        expect(container.innerHTML).toBe('');
    });

    it('Ingénieux : paie une seule fois, tire pour soi avant le choix destiné à un allié', () => {
        vi.spyOn(DiceEngine, 'roll').mockReturnValue(16);
        expect(ouvrirChoixAtoutTorg('destin', 'mara', 'ingenieux', 'teo')).toBe(true);
        expect(etat().enMain).toContainEqual({ index: 1, porteur: 'mara', face: 'revelee' });
        expect(etat().torgChoix?.mara).toEqual({ atout: 'ingenieux', indices: [2], beneficiaire: 'teo' });
        expect(ouvrirChoixAtoutTorg('destin', 'mara', 'ingenieux', 'teo')).toBe(false);
        expect(useSessionOSStore.getState().players[0].characters[0].sheetData?.poss).toBe(2);
    });

    it('Chef naturel : deux cartes en Réserve pour un autre, une Possibilité, jamais un don libre', () => {
        useSessionOSStore.getState().appliquerAuPaquet('destin', e => ({ ...e, enMain: [7, 8].map(index => ({ index, porteur: 'mara', face: 'revelee' })) }));
        poserParAtoutTorg('destin', 'mara', 'chefNaturel', [7, 8], 'teo');
        expect(etat().enMain?.every(c => c.porteur === 'teo' && c.enReserve)).toBe(true);
        expect(useSessionOSStore.getState().players[0].characters[0].sheetData?.poss).toBe(2);
        poserParAtoutTorg('destin', 'mara', 'chefNaturel', [7, 8], 'teo');
        expect(useSessionOSStore.getState().players[0].characters[0].sheetData?.poss).toBe(2);
    });

    it('un nom d’Atout dans le texte libre ne vaut pas une capacité cochée', () => {
        useSessionOSStore.getState().updateCharacter('j', 'mara', { sheetData: { atouts: 'Ingénieux', raison: 10, poss: 3 } });
        expect(ouvrirChoixAtoutTorg('destin', 'mara', 'ingenieux', 'teo')).toBe(false);
        expect(etat().remainingIndices).toEqual([1, 2, 3, 4]);
    });
});
