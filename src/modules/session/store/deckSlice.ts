/**
 * Session-OS Store — Deck Slice
 * 
 * Gère les paquets de cartes (Drama Decks, Loot, etc.) :
 * - Manifestes des decks (Metadata)
 * - États de session (Pioche/Défausse)
 * 
 * @module session/store/deckSlice
 */

import type { StateCreator } from 'zustand';
import i18next from 'i18next';
import { DeckInterpreter } from '../logic/DeckInterpreter';
import type { DeckManifest, DeckSessionState } from './types';
import type { DemandeDeCarte, FaceDeCarte } from '../../../types/deck.types';
import { gmToast } from '../../../stores/useToastStore';
import {
    changerLePorteur,
    garderLaCarteRetournee,
    jouerUneCarteTenue,
    piocherEnMain,
    rendreUneCarteAuPaquet,
    reprendreToutesLesMains,
    retournerUneCarte,
    tientLaCarte,
    type MainDiffusee,
} from '../logic/mainsDuPaquet';

export interface DeckSliceState {
    decks: DeckManifest[];
    deckStates: Record<string, DeckSessionState>;
    selectedDeckId: string | null;
    isProjecting: boolean;
    /**
     * **Ce que la tablette reçoit des mains — un miroir, jamais une source.**
     *
     * Rempli par la synchronisation sur les écrans joueurs ; la fenêtre du
     * meneur ne l'écrit ni ne le lit, elle a `deckStates` qui fait foi. Les
     * cartes face cachée n'y portent pas leur index : `mainsPourLaTable` le
     * retire avant l'envoi, parce que la diffusion est un seul message pour
     * toutes les tablettes.
     */
    mainsDesPaquets?: Record<string, MainDiffusee[]>;
    /**
     * **Ce qu'il reste dans chaque pioche — un miroir, comme les mains.**
     *
     * Rempli par la synchronisation sur les écrans joueurs, pour que la tablette
     * puisse annoncer le compte et éteindre la pioche d'un paquet vide. La
     * fenêtre du meneur ne s'en sert pas : elle a `deckStates`, qui fait foi.
     *
     * On n'y trouve **que des nombres** : `remainingIndices` est le paquet dans
     * l'ordre où il sera tiré, et le diffuser livrerait la suite de la partie.
     */
    cartesRestantes?: Record<string, number>;
    /** Les cartes proposées d'un joueur à un autre, en attente de réponse. */
    demandesDeCarte: DemandeDeCarte[];
}

export interface DeckSliceActions {
    addDeck: (deck: Omit<DeckManifest, 'id'>) => void;
    updateDeck: (id: string, updates: Partial<DeckManifest>) => void;
    deleteDeck: (id: string) => void;
    
    // Actions de session
    drawCard: (deckId: string) => void;
    discardCard: (deckId: string) => void;
    shuffleDeck: (deckId: string) => void;
    resetDeck: (deckId: string) => void;
    selectDeck: (id: string | null) => void;
    toggleProjection: () => void;

    /* ── Le quatrième tas : les cartes tenues en main ─────────────────────
       Décidé par David le 2026-08-30. La règle vit dans `logic/mainsDuPaquet`,
       qui est pure et testée ; ces actions ne font que la poser sur le magasin.
       Le paquet détient la vérité, la fiche du personnage l'affiche.          */

    /** La carte retournée passe en main. `porteur` à `null` : le meneur la garde. */
    garderLaCarte: (deckId: string, porteur: string | null, face?: FaceDeCarte) => void;
    /** Donne une carte tenue à quelqu'un d'autre. */
    donnerLaCarte: (deckId: string, index: number, porteur: string | null) => void;
    /** Face visible ↔ face cachée. */
    retournerLaCarte: (deckId: string, index: number) => void;
    /** La carte tenue est jouée : défausse, ou pioche si le paquet n'a pas de défausse. */
    jouerLaCarteTenue: (deckId: string, index: number) => void;
    /** La carte tenue revient dans la pioche sans avoir été jouée. */
    rendreLaCarteAuPaquet: (deckId: string, index: number) => void;
    /** Le seul chemin d'écriture du quatrième tas. Interne. */
    appliquerAuPaquet: (deckId: string, transformer: (etat: DeckSessionState) => DeckSessionState) => void;

    /* ── Les gestes que les joueurs font depuis leur tablette ──────────────
       Chacun vérifie que le demandeur tient bien la carte : le `characterId`
       d'un message vient du client, et sans ce contrôle un message fabriqué
       jouerait la carte du voisin.                                          */

    /**
     * **Un joueur pioche lui-même dans un paquet ouvert.**
     *
     * Demandé par David le 2026-08-30. Le paquet doit porter `ouvertAuxJoueurs`
     * — ce contrôle-là ne peut vivre qu'ici, la politique du process principal
     * ne connaît pas les manifestes. `parQui` à `null` : c'est le meneur, qui
     * pioche dans ce qu'il veut.
     */
    piocherUneCarte: (deckId: string, parQui: string | null) => void;
    /** Un joueur joue sa propre carte : elle part en défausse. */
    jouerSaCarte: (deckId: string, index: number, parQui: string | null) => void;
    /** Un joueur propose sa carte à un autre. Le destinataire tranche. */
    demanderLeDonDeCarte: (deckId: string, index: number, deQui: string | null, versQui: string | null) => void;
    /**
     * `parQui` absent : l'appel vient de l'écran du meneur, qui arbitre.
     * Fourni, il doit correspondre au destinataire — sans quoi un joueur
     * accepterait une proposition faite à un autre.
     */
    accepterLeDonDeCarte: (demandeId: string, parQui?: string | null) => void;
    refuserLeDonDeCarte: (demandeId: string, parQui?: string | null) => void;
}

export type DeckSlice = DeckSliceState & DeckSliceActions;

export const createDeckSlice: StateCreator<DeckSlice, [], [], DeckSlice> = (set, get) => ({
    // Initial State
    decks: [],
    deckStates: {},
    selectedDeckId: null,
    demandesDeCarte: [],
    isProjecting: false,

    // Actions
    addDeck: (deck) => {
        const id = `deck-${Date.now()}`;
        const newDeck: DeckManifest = { ...deck, id };
        
        set((state) => ({
            decks: [...state.decks, newDeck],
            deckStates: {
                ...state.deckStates,
                [id]: {
                    deckId: id,
                    remainingIndices: DeckInterpreter.initializeIndices(newDeck),
                    discardedIndices: [],
                    currentCardIndex: null
                }
            }
        }));
        gmToast(i18next.t('modules:session.toasts.deck_added', { name: newDeck.name }), 'success');
    },

    updateDeck: (id, updates) => {
        set((state) => ({
            decks: state.decks.map(d => d.id === id ? { ...d, ...updates } : d)
        }));
        // Si le nombre de cartes change, on réinitialise l'état
        if (updates.cardCount !== undefined) {
            get().resetDeck(id);
        }
    },

    deleteDeck: (id) => {
        set((state) => {
            const newStates = { ...state.deckStates };
            delete newStates[id];
            return {
                decks: state.decks.filter(d => d.id !== id),
                deckStates: newStates
            };
        });
    },

    drawCard: (deckId) => {
        const state = get().deckStates[deckId];
        const deck = get().decks.find(d => d.id === deckId);
        if (!state || !deck) return;

        let workingRemaining = [...state.remainingIndices];
        const workingDiscard = [...state.discardedIndices];

        // 1. Gérer la carte actuellement affichée (la carte "précédente")
        if (state.currentCardIndex !== null) {
            if (deck.useDiscard) {
                // Elle va dans la défausse
                workingDiscard.push(state.currentCardIndex);
            } else {
                // Elle retourne dans le paquet au hasard
                workingRemaining.push(state.currentCardIndex);
                workingRemaining = DeckInterpreter.shuffle(workingRemaining);
            }
        }

        // 2. Piocher la nouvelle carte
        const { card, newRemaining } = DeckInterpreter.draw(workingRemaining);
        
        if (card === null) {
            gmToast(i18next.t('modules:session.toasts.deck_empty'), "info");
            return;
        }

        set((store) => ({
            deckStates: {
                ...store.deckStates,
                [deckId]: {
                    ...state,
                    remainingIndices: newRemaining,
                    discardedIndices: workingDiscard,
                    currentCardIndex: card
                }
            }
        }));


        gmToast(i18next.t('modules:session.toasts.card_drawn', { name: deck.name }), 'success');

        // [PREMIUM] Projection & Journalisation
        if (get().isProjecting) {
            import('../../image/useImageStore').then(async mod => {
                const cardImageUrl = DeckInterpreter.getCardImage(deck, card);
                const metadata = DeckInterpreter.getCardMetadata(deck, card);
                const cardName = metadata?.name || `Carte #${card + (deck.startAtZero ? 0 : 1)}`;
                
                if (cardImageUrl) {
                    // Projection as Entity for better UI focus (Full card view)
                    await mod.useImageStore.getState().projectEntity({
                        id: `card-${deckId}-${card}-${Date.now()}`,
                        name: cardName,
                        subtitle: `Oracle : ${deck.name}`,
                        avatar: cardImageUrl,
                        type: 'Oracle',
                        lore: metadata?.description || ""
                    });
                }
            });
        }

        import('../../journal/useJournalStore').then(mod => {
            const journal = mod.useJournalStore.getState();
            if (journal.isRecording) {
                const cardName = DeckInterpreter.getCardMetadata(deck, card)?.name || `Carte #${card + (deck.startAtZero ? 0 : 1)}`;
                journal.addEvent({
                    type: 'ORACLE',
                    title: i18next.t('modules:session.events.card_draw_title', { card: cardName }),
                    content: i18next.t('modules:session.events.card_draw_content', { deck: deck.name, card: cardName }),
                    metadata: { 
                        deckId, 
                        cardIndex: card,
                        imageUrl: DeckInterpreter.getCardImage(deck, card)
                    }
                });
            }
        });
    },

    discardCard: (deckId) => {
        const state = get().deckStates[deckId];
        const deck = get().decks.find(d => d.id === deckId);
        if (!state || state.currentCardIndex === null) return;

        set((store) => ({
            deckStates: {
                ...store.deckStates,
                [deckId]: {
                    ...state,
                    discardedIndices: deck?.useDiscard 
                        ? [...state.discardedIndices, state.currentCardIndex as number]
                        : state.discardedIndices,
                    currentCardIndex: null
                }
            }
        }));
    },

    shuffleDeck: (deckId) => {
        const deck = get().decks.find(d => d.id === deckId);
        if (!deck) return;

        /*
          **Un remélange reprend les cartes des joueurs, et doit le dire.**

          Cette action reconstruit l'état de zéro : les mains disparaissent donc
          d'elles-mêmes, ce qui est le bon comportement — tout revient au
          paquet. Mais un joueur qui tenait un atout le verrait s'évaporer sans
          explication, croirait à un bug, et compterait lui-même. *Une
          correction muette est une règle perdue.*
        */
        const { reprises } = reprendreToutesLesMains(get().deckStates[deckId] ?? {
            deckId, remainingIndices: [], discardedIndices: [], currentCardIndex: null,
        });

        set((store) => ({
            deckStates: {
                ...store.deckStates,
                [deckId]: {
                    deckId,
                    remainingIndices: DeckInterpreter.initializeIndices(deck),
                    discardedIndices: [],
                    currentCardIndex: null,
                    enMain: []
                }
            }
        }));

        gmToast(
            reprises > 0
                // La phrase des reprises était écrite en français dans le code :
                // elle serait restée telle quelle en anglais.
                ? i18next.t('modules:session.toasts.deck_shuffled_with_returns', { count: reprises })
                : i18next.t('modules:session.toasts.deck_shuffled'),
            'info',
        );
    },

    resetDeck: (deckId) => {
        const deck = get().decks.find(d => d.id === deckId);
        if (!deck) return;

        set((store) => ({
            deckStates: {
                ...store.deckStates,
                [deckId]: {
                    deckId,
                    remainingIndices: DeckInterpreter.initializeIndices(deck),
                    discardedIndices: [],
                    currentCardIndex: null,
                    enMain: []
                }
            }
        }));
    },

    /* ── Les cartes tenues en main ───────────────────────────────────────── */

    /**
     * Applique une transformation pure de `mainsDuPaquet` à un paquet.
     *
     * Toutes les actions du quatrième tas passent par ici : *une seule façon
     * d'écrire l'état, et la règle reste dans le module pur* — sans quoi la
     * cinquième action oublierait un jour de recopier ce que les quatre autres
     * font, et le paquet perdrait une carte sans le dire.
     */
    appliquerAuPaquet: (deckId: string, transformer: (etat: DeckSessionState) => DeckSessionState) => {
        const etat = get().deckStates[deckId];
        if (!etat) return;

        const suivant = transformer(etat);
        if (suivant === etat) return;

        set((store) => ({ deckStates: { ...store.deckStates, [deckId]: suivant } }));
    },

    garderLaCarte: (deckId, porteur, face = 'scellee') => {
        const etat = get().deckStates[deckId];
        if (!etat || etat.currentCardIndex === null) return;

        get().appliquerAuPaquet(deckId, e => garderLaCarteRetournee(e, porteur, face));
        gmToast(
            porteur === null
                ? 'Carte gardée en main.'
                : 'Carte confiée à un personnage.',
            'success',
        );
    },

    donnerLaCarte: (deckId, index, porteur) =>
        get().appliquerAuPaquet(deckId, e => changerLePorteur(e, index, porteur)),

    retournerLaCarte: (deckId, index) =>
        get().appliquerAuPaquet(deckId, e => retournerUneCarte(e, index)),

    jouerLaCarteTenue: (deckId, index) => {
        const avecDefausse = get().decks.find(d => d.id === deckId)?.useDiscard ?? false;
        get().appliquerAuPaquet(deckId, e => jouerUneCarteTenue(e, index, avecDefausse));
    },

    rendreLaCarteAuPaquet: (deckId, index) =>
        get().appliquerAuPaquet(deckId, e => rendreUneCarteAuPaquet(e, index)),

    /* ── Ce qui arrive des tablettes ─────────────────────────────────────── */

    piocherUneCarte: (deckId, parQui) => {
        const deck = get().decks.find(d => d.id === deckId);
        const etat = get().deckStates[deckId];
        if (!deck || !etat) return;

        /*
          **Le contrôle que cette couche est seule à pouvoir faire.**

          `actionPolicy` a vérifié que l'émetteur est bien le personnage qu'il
          prétend, mais elle ne connaît pas les manifestes et ne peut donc pas
          dire si ce paquet est ouvert. Sans cette ligne, un message fabriqué
          piocherait dans l'oracle du meneur. Le meneur, lui (`null`), pioche
          partout — c'est son paquet.
        */
        if (parQui !== null && !deck.ouvertAuxJoueurs) return;

        const { card } = DeckInterpreter.draw(etat.remainingIndices);
        if (card === null) return;

        /*
          **Face révélée, et ce n'est pas le même défaut que « Garder ».** Une
          carte que le meneur confie arrive scellée, parce qu'il choisit le
          moment où elle paraît. Une carte que le joueur tire lui-même est déjà
          dans sa main : la sceller lui cacherait ce qu'il vient de piocher.
          « Révélée » veut dire *son porteur la voit*, pas *la table la voit*.
        */
        get().appliquerAuPaquet(deckId, e => piocherEnMain(e, card, parQui, 'revelee'));

        /*
          **Le meneur doit savoir qu'une carte est sortie du paquet.** Elle
          apparaît bien dans la rangée « cartes en main », mais un tirage fait à
          l'autre bout de la table, pendant qu'il regarde ailleurs, passerait
          inaperçu. *Une carte qui bouge sans que personne ne le dise est une
          carte qu'on cherchera au remélange.*
        */
        if (parQui !== null) {
            gmToast(`Un joueur a pioché dans « ${deck.name} ».`, 'info');
        }
    },

    jouerSaCarte: (deckId, index, parQui) => {
        const etat = get().deckStates[deckId];
        /*
          **Le contrôle qui compte.** Le `characterId` vient du client : sans
          lui, un message fabriqué jouerait la carte du voisin. On se tait
          plutôt que de renvoyer une erreur — un refus détaillé apprendrait à
          qui tâtonne ce qui existe.
        */
        if (!etat || !tientLaCarte(etat, index, parQui)) return;
        get().jouerLaCarteTenue(deckId, index);
    },

    demanderLeDonDeCarte: (deckId, index, deQui, versQui) => {
        const etat = get().deckStates[deckId];
        if (!etat || !tientLaCarte(etat, index, deQui)) return;

        // Une seule demande en attente par carte : sans quoi deux clics
        // pressés créeraient deux demandes, et accepter la seconde après la
        // première déplacerait une carte qui a déjà changé de main.
        const dejaDemandee = get().demandesDeCarte.some(
            d => d.deckId === deckId && d.index === index && d.statut === 'en-attente');
        if (dejaDemandee) return;

        set((store) => ({
            demandesDeCarte: [...store.demandesDeCarte, {
                id: crypto.randomUUID(),
                deckId, index, deQui, versQui,
                statut: 'en-attente' as const,
                quand: Date.now(),
            }],
        }));
    },

    accepterLeDonDeCarte: (demandeId, parQui) => {
        const demande = get().demandesDeCarte.find(d => d.id === demandeId);
        if (!demande || demande.statut !== 'en-attente') return;

        /*
          **Seul le destinataire répond — ou le meneur.**

          Une demande ne porte que son identifiant : la politique du process
          principal authentifie bien l'émetteur, mais elle ne connaît pas les
          demandes et ne peut donc pas dire à qui celle-ci s'adressait. Sans ce
          contrôle, **n'importe quel joueur accepterait une proposition faite à
          un autre** et récupérerait sa carte.

          `parQui` non fourni : l'appel vient de l'écran du meneur, qui arbitre —
          un joueur parti de table ne doit pas bloquer une carte pendant tout un
          combat.
        */
        if (parQui !== undefined && parQui !== demande.versQui) return;

        const etat = get().deckStates[demande.deckId];
        /*
          La carte a pu bouger entre la demande et la réponse — jouée, rendue,
          reprise par un remélange. On refuse alors plutôt que de la faire
          réapparaître dans la main du destinataire.
        */
        if (!etat || !tientLaCarte(etat, demande.index, demande.deQui)) {
            set((store) => ({
                demandesDeCarte: store.demandesDeCarte.map(
                    d => (d.id === demandeId ? { ...d, statut: 'refusee' as const } : d)),
            }));
            gmToast('La carte proposée n’est plus dans cette main.', 'info');
            return;
        }

        get().appliquerAuPaquet(demande.deckId, e => changerLePorteur(e, demande.index, demande.versQui));
        set((store) => ({
            demandesDeCarte: store.demandesDeCarte.map(
                d => (d.id === demandeId ? { ...d, statut: 'acceptee' as const } : d)),
        }));
    },

    /*
      Refuser est ouvert au destinataire, à l'auteur de la proposition — qui a
      le droit de se raviser — et au meneur. *Rendre une carte à celui qui la
      tenait déjà ne peut rien casser* ; l'accepter, si.
    */
    refuserLeDonDeCarte: (demandeId, parQui) => set((store) => ({
        demandesDeCarte: store.demandesDeCarte.map(d => {
            if (d.id !== demandeId || d.statut !== 'en-attente') return d;
            if (parQui !== undefined && parQui !== d.versQui && parQui !== d.deQui) return d;
            return { ...d, statut: 'refusee' as const };
        }),
    })),

    selectDeck: (id) => {
        set({ selectedDeckId: id });
    },

    toggleProjection: () => {
        const wasProjecting = get().isProjecting;
        set({ isProjecting: !wasProjecting });

        import('../../image/useImageStore').then(async mod => {
            if (wasProjecting) {
                // ❌ Désactivation → vider les Hubs
                mod.useImageStore.getState().projectEntity(null);
                gmToast(i18next.t('modules:session.toasts.projection_off'), "info");
            } else {
                // ✅ Activation → projeter la carte courante si elle existe
                gmToast(i18next.t('modules:session.toasts.projection_on'), "info");

                // Chercher la carte active parmi tous les decks (prioriser activeDeckId si possible)
                const state = get();
                const decks = state.decks;
                const deckStates = state.deckStates;

                for (const deck of decks) {
                    const deckState = deckStates[deck.id];
                    if (deckState && deckState.currentCardIndex !== null) {
                        const card = deckState.currentCardIndex;
                        const cardImageUrl = DeckInterpreter.getCardImage(deck, card);
                        const metadata = DeckInterpreter.getCardMetadata(deck, card);
                        const cardName = metadata?.name || `Carte #${card + (deck.startAtZero ? 0 : 1)}`;

                        if (cardImageUrl) {
                            await mod.useImageStore.getState().projectEntity({
                                id: `card-${deck.id}-${card}-${Date.now()}`,
                                name: cardName,
                                subtitle: `Oracle : ${deck.name}`,
                                avatar: cardImageUrl,
                                type: 'Oracle',
                                lore: metadata?.description || ''
                            });
                        }
                        break; // Projeter seulement le premier deck avec une carte active
                    }
                }
            }
        });
    }
});
