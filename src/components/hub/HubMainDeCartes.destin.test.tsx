import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

/**
 * **Les Cartes du Destin sur la tablette** — Torg, 2026-10-14. Le joueur pose
 * SA carte en Réserve et joue SON Moment critique (le geste part au meneur, qui
 * vérifie) ; il voit les Réserves de la table, qui sont publiques — jamais le
 * reste de la main d'un voisin.
 */

vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (cle: string) => cle, i18n: { language: 'fr' } }),
    initReactI18next: { type: '3rdParty', init: () => {} },
}));
vi.mock('../../modules/session/logic/idbStorage', () => ({
    idbStateStorage: { getItem: async () => null, setItem: async () => {}, removeItem: async () => {} },
    onPersistedStateChanged: () => () => {},
}));
vi.mock('../ResolvedImage', () => ({ ResolvedImage: ({ alt }: { alt: string }) => <span>{alt}</span> }));

const { default: HubMainDeCartes } = await import('./HubMainDeCartes');
const { useSessionOSStore } = await import('../../modules/session/useSessionOSStore');

const DESTIN = {
    id: 'destin', name: 'Paquet du Destin', systemId: 'torg', folderPath: 'x', cardCount: 20,
    format: 'poker', orientation: 'portrait', useDiscard: true, role: 'destin',
    cardMetadata: { 7: { name: 'Coup de grâce' }, 8: { name: 'Seconde chance' }, 9: { name: 'Héroïsme' }, 4: { name: 'Drame' } },
};

function table(momentCritiqueJoue = false) {
    useSessionOSStore.setState({
        decks: [DESTIN], activeCampaignId: 'c', campaigns: [{ id: 'c', name: 'Torg', system: 'torg' }],
        players: [{ id: 'j', realName: 'Léa', avatarUrl: '', isOnline: true, characters: [
            { id: 'mara', name: 'Mara', campaignId: 'c' }, { id: 'teo', name: 'Teo', campaignId: 'c' },
        ] }],
        mainsDesPaquets: { destin: [
            { porteur: 'mara', revelees: [7, 8], scellees: 0, enReserve: [8], ...(momentCritiqueJoue ? { momentCritiqueJoue } : {}) },
            { porteur: 'teo', revelees: [9, 4], scellees: 0, enReserve: [9] },
        ] },
        cartesRestantes: { destin: 10 }, demandesDeCarte: [], connectedCharacters: {},
    } as never);
}

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('la main de Destin sur la tablette', () => {
    it('dit la main et la Réserve, et pose SA carte en Réserve', () => {
        table();
        const envoyes: unknown[] = [];
        window.addEventListener('deck:poser-en-reserve', (e => envoyes.push((e as CustomEvent).detail)) as EventListener);
        render(<HubMainDeCartes characterId="mara" />);

        expect(screen.getByText(/main 1\/4, 1 en Réserve/)).toBeTruthy();
        expect(screen.getByText(/En Réserve d’Action — visible de toute la table/)).toBeTruthy();
        fireEvent.click(screen.getByRole('button', { name: 'Poser en Réserve' }));
        expect(envoyes).toEqual([{ deckId: 'destin', index: 7, characterId: 'mara' }]);
    });

    it('les Réserves de la table se voient — pas le reste de la main du voisin', () => {
        table();
        render(<HubMainDeCartes characterId="mara" />);
        const reserves = document.querySelector('[data-reserves-de-la-table]') as HTMLElement;
        expect(reserves.textContent).toContain('Teo');
        expect(reserves.textContent).toContain('Héroïsme');
        expect(document.body.textContent).not.toContain('Drame');
    });

    it('le Moment critique part au meneur, une fois par Acte', () => {
        table();
        const envoyes: unknown[] = [];
        window.addEventListener('deck:moment-critique', (e => envoyes.push((e as CustomEvent).detail)) as EventListener);
        render(<HubMainDeCartes characterId="mara" />);
        fireEvent.click(screen.getByRole('button', { name: 'Moment critique' }));
        expect(envoyes).toEqual([{ deckId: 'destin', characterId: 'mara' }]);
        cleanup();

        table(true);
        render(<HubMainDeCartes characterId="mara" />);
        expect((screen.getByRole('button', { name: 'Moment critique joué cet Acte' }) as HTMLButtonElement).disabled).toBe(true);
    });
});
