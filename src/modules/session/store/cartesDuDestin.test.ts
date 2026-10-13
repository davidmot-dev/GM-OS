import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useSessionOSStore } from './index';
import type { DeckManifest, DeckSessionState } from '../../../types/deck.types';

/**
 * **Les Cartes du Destin, côté magasin** — Torg, 2026-10-14. Ce que ces essais
 * gardent avant tout : depuis une tablette, **on ne pose que SA carte en
 * Réserve, on ne joue que SON Moment critique** — le `characterId` vient du
 * client. Le meneur, lui (`parQui` absent), arbitre.
 */

const DESTIN: DeckManifest = {
    id: 'destin', name: 'Paquet du Destin', systemId: 'torg', folderPath: 'decks/torg/destin',
    cardCount: 20, format: 'poker', orientation: 'portrait', useDiscard: true, role: 'destin',
};
const etat = (): DeckSessionState => ({
    deckId: 'destin', remainingIndices: [1, 2, 3, 4, 5, 6, 10, 11], discardedIndices: [], currentCardIndex: null,
    enMain: [{ index: 7, porteur: 'mara', face: 'revelee' }, { index: 8, porteur: 'teo', face: 'revelee' }],
});
const mains = () => useSessionOSStore.getState().deckStates.destin.enMain ?? [];
const carte = (index: number) => mains().find(c => c.index === index);

beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    useSessionOSStore.setState({
        decks: [DESTIN],
        deckStates: { destin: etat() },
        activeCampaignId: 'c',
        campaigns: [{ id: 'c', name: 'Torg', system: 'torg' }],
        customGameDrivers: [{ id: 'torg', name: 'Torg', templateId: 't', cartesDuDestin: { taille: 3 } }],
        players: [{ id: 'j', realName: 'Léa', avatarUrl: '', isOnline: true, characters: [
            { id: 'mara', name: 'Mara', campaignId: 'c' }, { id: 'teo', name: 'Teo', campaignId: 'c' }, { id: 'ailleurs', name: 'Autre', campaignId: 'x' },
        ] }],
    } as never);
});

describe('depuis une tablette', () => {
    it('on pose SA carte en Réserve', () => {
        useSessionOSStore.getState().poserEnReserve('destin', 7, 'mara');
        expect(carte(7)?.enReserve).toBe(true);
    });

    it('jamais celle du voisin — en silence', () => {
        useSessionOSStore.getState().poserEnReserve('destin', 8, 'mara');
        expect(carte(8)?.enReserve).toBeFalsy();
    });

    it('on ne joue que SON Moment critique', () => {
        useSessionOSStore.getState().jouerLeMomentCritique('destin', 'teo', 'mara');
        expect(carte(8)?.enReserve).toBeFalsy();
        useSessionOSStore.getState().jouerLeMomentCritique('destin', 'mara', 'mara');
        expect(carte(7)?.enReserve).toBe(true);
        expect(useSessionOSStore.getState().deckStates.destin.momentsCritiques).toEqual(['mara']);
    });
});

describe('les gestes du meneur', () => {
    it('le meneur arbitre : il pose la carte de n’importe qui', () => {
        useSessionOSStore.getState().poserEnReserve('destin', 8);
        expect(carte(8)?.enReserve).toBe(true);
    });

    it('fin de scène : les personnages de LA campagne, à la taille du jeu', () => {
        useSessionOSStore.getState().completerLesMainsDuDestin('destin');
        const compte = (p: string) => mains().filter(c => c.porteur === p).length;
        expect(compte('mara')).toBe(3);
        expect(compte('teo')).toBe(3);
        expect(compte('ailleurs'), 'un personnage d’une autre campagne ne pioche pas').toBe(0);
    });

    it('fin d’Acte : nouvelles mains, Moments critiques rendus', () => {
        useSessionOSStore.getState().jouerLeMomentCritique('destin', 'mara');
        useSessionOSStore.getState().nouvellesMainsDuDestin('destin');
        const d = useSessionOSStore.getState().deckStates.destin;
        expect(d.discardedIndices.sort()).toEqual([7, 8]);
        expect(d.momentsCritiques).toEqual([]);
        expect(mains().filter(c => c.porteur === 'mara')).toHaveLength(3);
    });

    it('l’Action approuvée met une carte dans la main du héros', () => {
        useSessionOSStore.getState().piocherUneCarteDuDestin('destin', 'teo');
        expect(carte(1)).toMatchObject({ porteur: 'teo', face: 'revelee' });
    });
});
