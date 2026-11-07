import { beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('../logic/idbStorage', () => ({ idbStateStorage: { getItem: async () => null, setItem: async () => {}, removeItem: async () => {} }, onPersistedStateChanged: () => () => {} }));
const { useSessionOSStore } = await import('../useSessionOSStore');
const etat = () => useSessionOSStore.getState();
beforeEach(() => useSessionOSStore.setState({ decks: [{ id: 'd', role: 'destin', name: 'Destin', systemId: 'torg', useDiscard: true }], demandesDeCarte: [],
    getActiveDriver: () => undefined,
    deckStates: { d: { deckId: 'd', remainingIndices: [3], discardedIndices: [], currentCardIndex: null,
        enMain: [{ index: 1, porteur: 'a', face: 'revelee' }, { index: 2, porteur: 'b', face: 'revelee' }] } } } as never));

describe('échanges Torg au magasin, meneur et Hub', () => {
    it('le don générique entre personnages crée un échange et ne transfère rien gratuitement', () => {
        etat().donnerLaCarte('d', 1, 'b');
        const d = etat().demandesDeCarte[0];
        expect(d.echangeTorg).toBe(true);
        etat().accepterLeDonDeCarte(d.id, 'b');
        expect(etat().deckStates.d.enMain?.map(c => c.porteur)).toEqual(['a', 'b']);
        etat().accepterLeDonDeCarte(d.id, 'b', 2);
        expect(etat().deckStates.d.enMain?.map(c => c.porteur)).toEqual(['b', 'a']);
    });
    it('un tiers ne choisit pas la contrepartie du destinataire', () => {
        etat().demanderLeDonDeCarte('d', 1, 'a', 'b');
        etat().accepterLeDonDeCarte(etat().demandesDeCarte[0].id, 'intrus', 2);
        expect(etat().deckStates.d.enMain?.map(c => c.porteur)).toEqual(['a', 'b']);
    });
    it('revalide la Réserve au moment de l’acceptation et refuse une contrepartie disparue', () => {
        etat().demanderLeDonDeCarte('d', 1, 'a', 'b');
        const id = etat().demandesDeCarte[0].id;
        etat().reglerLesRoundsTorg('d', true);
        etat().accepterLeDonDeCarte(id, 'b', 2);
        expect(etat().deckStates.d.enMain?.map(c => c.porteur)).toEqual(['a', 'b']);
        etat().poserEnReserve('d', 1); etat().poserEnReserve('d', 2);
        etat().jouerSaCarte('d', 2, 'b');
        etat().accepterLeDonDeCarte(id, 'b', 2);
        expect(etat().deckStates.d.enMain?.[0].porteur).toBe('a');
    });
    it('Désorientés refuse le jeu depuis les deux portes, mais laisse la carte en Réserve', () => {
        etat().reglerLesRoundsTorg('d', true, true); etat().poserEnReserve('d', 1);
        etat().jouerSaCarte('d', 1, 'a'); etat().jouerLaCarteTenue('d', 1);
        expect(etat().deckStates.d.enMain).toHaveLength(2);
        etat().reglerLesRoundsTorg('d', true, false); etat().jouerSaCarte('d', 1, 'a');
        expect(etat().deckStates.d.enMain).toHaveLength(1);
    });
    it('recontrôle le KO du destinataire après la proposition', () => {
        etat().demanderLeDonDeCarte('d', 1, 'a', 'b'); const id = etat().demandesDeCarte[0].id;
        useSessionOSStore.setState({ getActiveDriver: () => ({ torg: { etats: { ko: 'ko' } } }), players: [{ characters: [{ id: 'b', sheetData: { ko: true } }] }] } as never);
        etat().accepterLeDonDeCarte(id, 'b', 2);
        expect(etat().deckStates.d.enMain?.map(c => c.porteur)).toEqual(['a', 'b']);
    });
    it('la déconnexion interdit Drame/Héros, mais pas l’échange de cartes (p. 179)', () => {
        useSessionOSStore.setState({ getActiveDriver: () => ({ torg: { etats: { deconnecte: 'deco' } } }), players: [{ characters: [{ id: 'a', sheetData: { deco: true } }] }],
            decks: [{ ...etat().decks[0], cardMetadata: { 1: { name: 'Drame' } } }] } as never);
        etat().jouerSaCarte('d', 1, 'a'); expect(etat().deckStates.d.enMain).toHaveLength(2);
        etat().demanderLeDonDeCarte('d', 1, 'a', 'b');
        etat().accepterLeDonDeCarte(etat().demandesDeCarte[0].id, 'b', 2);
        expect(etat().deckStates.d.enMain?.map(c => c.porteur)).toEqual(['b', 'a']);
    });
});
