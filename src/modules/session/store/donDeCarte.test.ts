import { describe, it, expect, beforeEach } from 'vitest';
import { useSessionOSStore } from './index';
import type { DeckManifest, DeckSessionState } from '../../../types/deck.types';

/**
 * **Ce qu'un joueur fait de ses cartes depuis sa tablette.**
 *
 * *Question de David, le 2026-08-30 : « comment un joueur joue une carte, et
 * comment il en donne une à un autre ? »* Il ne le pouvait pas — tout passait
 * par le meneur.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QUE CES TESTS GARDENT AVANT TOUT
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * **Un joueur n'agit que sur SES cartes.** Le `characterId` d'un message vient
 * du client : sans vérification, un message fabriqué jouerait la carte du
 * voisin, ou la lui prendrait. La réponse ne peut venir que de l'état du
 * paquet — *c'est exactement pourquoi la carte n'est pas devenue un objet
 * d'inventaire : un inventaire aurait dû croire l'expéditeur sur parole.*
 *
 * Le refus est **silencieux** : répondre « cette carte n'est pas à vous »
 * apprendrait à qui tâtonne ce qui existe, et le cas légitime — une carte jouée
 * entre-temps — ne mérite pas une alarme.
 */

const PAQUET: DeckManifest = {
    id: 'd-1',
    name: 'Cartes de Destin',
    systemId: 'generic',
    folderPath: 'decks/destin',
    cardCount: 10,
    format: 'poker',
    orientation: 'portrait',
    useDiscard: true,
};

/** Rick tient la 7 révélée ; Willem ne tient rien. */
const etatInitial = (): DeckSessionState => ({
    deckId: 'd-1',
    remainingIndices: [1, 2, 3, 4, 5, 6, 8, 9, 10],
    discardedIndices: [],
    currentCardIndex: null,
    enMain: [{ index: 7, porteur: 'pc-rick', face: 'revelee' }],
});

const paquet = () => useSessionOSStore.getState().deckStates['d-1'];
const mains = () => paquet().enMain ?? [];
const demandes = () => useSessionOSStore.getState().demandesDeCarte;

beforeEach(() => {
    useSessionOSStore.setState({
        decks: [PAQUET],
        deckStates: { 'd-1': etatInitial() },
        demandesDeCarte: [],
    });
});

describe('un joueur joue sa carte', () => {
    it('l’envoie à la défausse', () => {
        useSessionOSStore.getState().jouerSaCarte('d-1', 7, 'pc-rick');

        expect(mains()).toEqual([]);
        expect(paquet().discardedIndices).toEqual([7]);
    });

    /**
     * **Le contrôle qui compte.** Willem ne tient pas la 7 ; son message ne doit
     * rien produire, et surtout pas défausser la carte de Rick.
     */
    it('ne peut pas jouer la carte d’un autre', () => {
        useSessionOSStore.getState().jouerSaCarte('d-1', 7, 'pc-willem');

        expect(mains()).toHaveLength(1);
        expect(mains()[0].porteur).toBe('pc-rick');
        expect(paquet().discardedIndices).toEqual([]);
    });

    it('ne peut pas jouer une carte qui n’est dans aucune main', () => {
        useSessionOSStore.getState().jouerSaCarte('d-1', 3, 'pc-rick');

        expect(paquet().discardedIndices).toEqual([]);
        expect(paquet().remainingIndices).toContain(3);
    });

    /** Un identifiant de paquet inconnu ne doit rien fabriquer. */
    it('ignore un paquet qui n’existe pas', () => {
        useSessionOSStore.getState().jouerSaCarte('d-inconnu', 7, 'pc-rick');
        expect(mains()).toHaveLength(1);
    });
});

describe('un joueur propose sa carte à un autre', () => {
    it('crée une demande en attente, sans déplacer la carte', () => {
        useSessionOSStore.getState().demanderLeDonDeCarte('d-1', 7, 'pc-rick', 'pc-willem');

        expect(demandes()).toHaveLength(1);
        expect(demandes()[0].statut).toBe('en-attente');
        // La carte n'a pas bougé : c'est une proposition, pas un transfert.
        expect(mains()[0].porteur).toBe('pc-rick');
    });

    it('ne peut pas proposer la carte d’un autre', () => {
        useSessionOSStore.getState().demanderLeDonDeCarte('d-1', 7, 'pc-willem', 'pc-rick');
        expect(demandes()).toEqual([]);
    });

    /**
     * Deux clics pressés créeraient deux demandes, et accepter la seconde après
     * la première déplacerait une carte qui a déjà changé de main.
     */
    it('n’ouvre qu’une demande à la fois sur une même carte', () => {
        const s = useSessionOSStore.getState();
        s.demanderLeDonDeCarte('d-1', 7, 'pc-rick', 'pc-willem');
        s.demanderLeDonDeCarte('d-1', 7, 'pc-rick', 'pc-autre');

        expect(demandes()).toHaveLength(1);
        expect(demandes()[0].versQui).toBe('pc-willem');
    });
});

describe('la réponse du destinataire', () => {
    const proposer = () => {
        useSessionOSStore.getState().demanderLeDonDeCarte('d-1', 7, 'pc-rick', 'pc-willem');
        return demandes()[0].id;
    };

    it('accepter déplace la carte', () => {
        const id = proposer();
        useSessionOSStore.getState().accepterLeDonDeCarte(id);

        expect(mains()).toHaveLength(1);
        expect(mains()[0].porteur).toBe('pc-willem');
        expect(demandes()[0].statut).toBe('acceptee');
    });

    it('refuser laisse la carte où elle est', () => {
        const id = proposer();
        useSessionOSStore.getState().refuserLeDonDeCarte(id);

        expect(mains()[0].porteur).toBe('pc-rick');
        expect(demandes()[0].statut).toBe('refusee');
    });

    /**
     * **La carte a pu bouger entre la demande et la réponse** — jouée, rendue,
     * reprise par un remélange. On refuse alors, plutôt que de la faire
     * réapparaître dans la main du destinataire : *accepter une proposition ne
     * doit jamais recréer une carte.*
     */
    it('refuse une proposition dont la carte a été jouée entre-temps', () => {
        const id = proposer();
        useSessionOSStore.getState().jouerSaCarte('d-1', 7, 'pc-rick');

        useSessionOSStore.getState().accepterLeDonDeCarte(id);

        expect(demandes()[0].statut).toBe('refusee');
        expect(mains()).toEqual([]);
        expect(paquet().discardedIndices).toEqual([7]);
    });

    it('ne répond pas deux fois à la même demande', () => {
        const id = proposer();
        const s = useSessionOSStore.getState();
        s.accepterLeDonDeCarte(id);
        s.refuserLeDonDeCarte(id);

        expect(demandes()[0].statut).toBe('acceptee');
    });

    it('ignore un identifiant de demande inconnu', () => {
        proposer();
        useSessionOSStore.getState().accepterLeDonDeCarte('inexistant');

        expect(demandes()[0].statut).toBe('en-attente');
        expect(mains()[0].porteur).toBe('pc-rick');
    });
});
