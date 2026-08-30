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

/**
 * **Un joueur pioche lui-même — demandé par David le 2026-08-30 :** *« voir
 * comment un joueur peut tirer lui-même une carte dans un paquet — peut-être
 * dire les paquets qui sont accessibles ou non aux joueurs ? »*
 *
 * Le droit de piocher tient au **manifeste** du paquet, et ce contrôle ne peut
 * vivre qu'ici : `actionPolicy`, dans le process principal, authentifie
 * l'émetteur mais ne connaît pas les paquets. Sans cette barrière, un message
 * fabriqué tirerait dans l'oracle du meneur.
 */
describe('un joueur pioche lui-même', () => {
    const ouvrirLePaquet = (ouvert: boolean) =>
        useSessionOSStore.setState({ decks: [{ ...PAQUET, ouvertAuxJoueurs: ouvert }] });

    it('prend une carte dans la pioche et la pose dans sa main', () => {
        ouvrirLePaquet(true);
        useSessionOSStore.getState().piocherUneCarte('d-1', 'pc-willem');

        const sienne = mains().filter(c => c.porteur === 'pc-willem');
        expect(sienne).toHaveLength(1);
        // Il vient de la tirer : il doit la voir.
        expect(sienne[0].face).toBe('revelee');
        expect(paquet().remainingIndices).not.toContain(sienne[0].index);
    });

    /** **Le contrôle qui compte.** L'absence du drapeau vaut « fermé ». */
    it('ne pioche pas dans un paquet fermé aux joueurs', () => {
        ouvrirLePaquet(false);
        useSessionOSStore.getState().piocherUneCarte('d-1', 'pc-willem');

        expect(mains()).toHaveLength(1);
        expect(paquet().remainingIndices).toHaveLength(9);
    });

    it('traite un paquet sans drapeau comme fermé', () => {
        useSessionOSStore.setState({ decks: [PAQUET] });
        useSessionOSStore.getState().piocherUneCarte('d-1', 'pc-willem');

        expect(paquet().remainingIndices).toHaveLength(9);
    });

    /** Le meneur pioche dans ce qu'il veut : ce sont ses paquets. */
    it('laisse le meneur piocher dans un paquet fermé', () => {
        ouvrirLePaquet(false);
        useSessionOSStore.getState().piocherUneCarte('d-1', null);

        expect(mains().filter(c => c.porteur === null)).toHaveLength(1);
    });

    it('ne fait rien sur une pioche vide', () => {
        ouvrirLePaquet(true);
        useSessionOSStore.setState({
            deckStates: { 'd-1': { ...etatInitial(), remainingIndices: [] } },
        });
        useSessionOSStore.getState().piocherUneCarte('d-1', 'pc-willem');

        expect(mains()).toHaveLength(1);
    });

    it('ignore un paquet qui n’existe pas', () => {
        ouvrirLePaquet(true);
        useSessionOSStore.getState().piocherUneCarte('d-inconnu', 'pc-willem');

        expect(mains()).toHaveLength(1);
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

    /**
     * **Le trou trouvé le 2026-08-30, en réparant le refus d'autorisation.**
     *
     * Une demande ne porte que son identifiant. La politique du process
     * principal authentifie bien l'émetteur, mais elle ne connaît pas les
     * demandes et ne peut donc pas dire à qui celle-ci s'adressait — **c'est
     * ici, et nulle part ailleurs, qu'on peut l'empêcher.** Sans ce contrôle,
     * n'importe quel joueur accepterait la proposition faite à un autre et
     * récupérerait sa carte.
     */
    it('un tiers ne peut pas accepter une proposition adressée à un autre', () => {
        const id = proposer();
        useSessionOSStore.getState().accepterLeDonDeCarte(id, 'pc-intrus');

        expect(demandes()[0].statut).toBe('en-attente');
        expect(mains()[0].porteur).toBe('pc-rick');
    });

    it('le destinataire, lui, accepte', () => {
        const id = proposer();
        useSessionOSStore.getState().accepterLeDonDeCarte(id, 'pc-willem');

        expect(mains()[0].porteur).toBe('pc-willem');
    });

    /** Sans `parQui`, l'appel vient de l'écran du meneur, qui arbitre. */
    it('le meneur tranche depuis son écran', () => {
        const id = proposer();
        useSessionOSStore.getState().accepterLeDonDeCarte(id);

        expect(mains()[0].porteur).toBe('pc-willem');
    });

    /** *Rendre une carte à celui qui la tenait déjà ne peut rien casser.* */
    it('l’auteur d’une proposition peut se raviser', () => {
        const id = proposer();
        useSessionOSStore.getState().refuserLeDonDeCarte(id, 'pc-rick');

        expect(demandes()[0].statut).toBe('refusee');
        expect(mains()[0].porteur).toBe('pc-rick');
    });

    it('un tiers ne peut pas refuser à la place des intéressés', () => {
        const id = proposer();
        useSessionOSStore.getState().refuserLeDonDeCarte(id, 'pc-intrus');

        expect(demandes()[0].statut).toBe('en-attente');
    });

    it('ignore un identifiant de demande inconnu', () => {
        proposer();
        useSessionOSStore.getState().accepterLeDonDeCarte('inexistant');

        expect(demandes()[0].statut).toBe('en-attente');
        expect(mains()[0].porteur).toBe('pc-rick');
    });
});
