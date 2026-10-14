import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useSessionOSStore } from './index';
import type { DeckManifest, DeckSessionState } from '../../../types/deck.types';

/**
 * **Les Cartes de Cosm, côté magasin** — Torg, 2026-10-14. Le cosm courant vient
 * de la campagne (ou de la scène) ; chaque personnage de la campagne reçoit une
 * carte du paquet de ce cosm ; une carte jouée compte pour l'Acte.
 */
const paquet = (id: string, cosm: string): DeckManifest => ({
    id, name: id, systemId: 'torg', folderPath: `decks/torg/${id}`, cardCount: 10, format: 'poker',
    orientation: 'portrait', useDiscard: true, role: 'cosm', cosm,
});
const etat = (deckId: string): DeckSessionState => ({
    deckId, remainingIndices: [1, 2, 3, 4, 5], discardedIndices: [], currentCardIndex: null, enMain: [],
});
const tenues = (deckId: string, porteur: string) =>
    (useSessionOSStore.getState().deckStates[deckId].enMain ?? []).filter(c => c.porteur === porteur);

beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    useSessionOSStore.setState({
        decks: [paquet('nil', 'empire-du-nil'), paquet('aysle', 'aysle')],
        deckStates: { nil: etat('nil'), aysle: etat('aysle') },
        activeCampaignId: 'c', scenes: [],
        campaigns: [{ id: 'c', name: 'Torg', system: 'torg', cosmsParDefaut: ['empire-du-nil'] }],
        customGameDrivers: [{ id: 'torg', name: 'Torg', templateId: 't', cosms: [
            { id: 'empire-du-nil', nom: 'Empire du Nil', lois: [] }, { id: 'aysle', nom: 'Aysle', lois: [] },
        ] }],
        players: [{ id: 'j', realName: 'Léa', avatarUrl: '', isOnline: true, characters: [
            { id: 'mara', name: 'Mara', campaignId: 'c' }, { id: 'teo', name: 'Teo', campaignId: 'c' }, { id: 'ailleurs', name: 'Autre', campaignId: 'x' },
        ] }],
    } as never);
});

describe('les Cartes de Cosm', () => {
    it('au début de l’Acte, chaque personnage de la campagne reçoit une carte du cosm courant', () => {
        useSessionOSStore.getState().cartesDeCosmDuDebutDActe();
        expect(tenues('nil', 'mara')).toHaveLength(1);
        expect(tenues('nil', 'teo')).toHaveLength(1);
        expect(tenues('nil', 'ailleurs')).toHaveLength(0);
        expect(tenues('aysle', 'mara')).toHaveLength(0);
    });

    it('jouée, elle compte pour l’Acte : en changeant de cosm, on n’en reçoit pas d’autre', () => {
        const s = useSessionOSStore.getState();
        s.cartesDeCosmDuDebutDActe();
        s.jouerLaCarteTenue('nil', tenues('nil', 'mara')[0].index);
        expect(useSessionOSStore.getState().deckStates.nil.cosmJoues).toEqual(['mara']);

        useSessionOSStore.setState({ campaigns: [{ id: 'c', name: 'Torg', system: 'torg', cosmsParDefaut: ['aysle'] }] } as never);
        useSessionOSStore.getState().cartesDeCosmAuChangement();
        expect(tenues('aysle', 'mara')).toHaveLength(0);
        expect(tenues('aysle', 'teo')).toHaveLength(1);
        expect(tenues('nil', 'teo')).toHaveLength(0);
    });

    it('la scène en cours l’emporte sur la campagne', () => {
        useSessionOSStore.setState({ scenes: [{
            id: 's', campaignId: 'c', acteId: 'a', ordre: 0, titre: 'S', resume: '', origine: 'preparee',
            entiteIds: [], indiceIds: [], creeeLe: 0, cosms: ['aysle'], passages: [{ debut: '2026-10-14T10:00:00Z' }],
        }] } as never);
        useSessionOSStore.getState().cartesDeCosmDuDebutDActe();
        expect(tenues('aysle', 'mara')).toHaveLength(1);
        expect(tenues('nil', 'mara')).toHaveLength(0);
    });
});
