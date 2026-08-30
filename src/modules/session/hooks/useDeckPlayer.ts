import { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSessionOSStore } from '../useSessionOSStore';
import { DeckInterpreter } from '../logic/DeckInterpreter';
import { useImageStore } from '../../image/useImageStore';
import { mainDuPorteur, porteursDeCartes } from '../logic/mainsDuPaquet';

export const useDeckPlayer = () => {
    const { t } = useTranslation();
    const { 
        decks, 
        deckStates, 
        drawCard, 
        discardCard, 
        shuffleDeck,
        isProjecting,
        toggleProjection,
        selectedDeckId,
        selectDeck,
        activeCampaignId,
        campaigns,
        players,
        demandesDeCarte,
        accepterLeDonDeCarte,
        refuserLeDonDeCarte,
        garderLaCarte,
        donnerLaCarte,
        retournerLaCarte,
        jouerLaCarteTenue,
        rendreLaCarteAuPaquet
    } = useSessionOSStore();

    const [isFlipped, setIsFlipped] = useState(false);
    const [drawCount, setDrawCount] = useState(0);

    const activeCampaign = useMemo(() => 
        campaigns.find(c => c.id === activeCampaignId),
        [campaigns, activeCampaignId]
    );
    const currentSystemId = activeCampaign?.system || 'generic';

    // Derive the effective deck ID (SMART AUTO-SELECT)
    const effectiveDeckId = useMemo(() => {
        // 1. Priorité au deck explicitement sélectionné par l'utilisateur
        if (selectedDeckId && decks.some(d => d.id === selectedDeckId)) {
            return selectedDeckId;
        }

        // 2. Recherche d'un deck correspondant au système de la campagne
        const systemDeck = decks.find(d => d.systemId === currentSystemId);
        if (systemDeck) return systemDeck.id;

        // 3. Fallback sur un deck générique
        const genericDeck = decks.find(d => d.systemId === 'generic');
        if (genericDeck) return genericDeck.id;

        // 4. Aucune correspondance automatique sécurisée
        return null;
    }, [selectedDeckId, decks, currentSystemId]);

    const activeDeck = useMemo(() => 
        decks.find(d => d.id === effectiveDeckId),
        [decks, effectiveDeckId]
    );

    const activeState = useMemo(() => 
        effectiveDeckId ? deckStates[effectiveDeckId] : null,
        [deckStates, effectiveDeckId]
    );

    // Pre-compute URLs
    const cardBackUrl = useMemo(() => {
        if (!activeDeck) return '';
        return DeckInterpreter.getBackImageUrl(activeDeck.folderPath, activeDeck);
    }, [activeDeck]);

    const currentCardUrl = useMemo(() => {
        if (!activeDeck || !activeState || activeState.currentCardIndex === null) return null;
        return DeckInterpreter.getCardImageUrl(activeDeck.folderPath, activeState.currentCardIndex, activeDeck);
    }, [activeDeck, activeState]);

    const handleFlip = useCallback(() => {
        const nextFlipped = !isFlipped;
        setIsFlipped(nextFlipped);

        if (!isProjecting || !activeDeck || !activeState || activeState.currentCardIndex === null) return;

        const idx = activeState.currentCardIndex;
        const cardName = DeckInterpreter.getCardMetadata(activeDeck, idx)?.name || t('modules:session.deck_module.player.projection.card_name_fallback', { idx });
        const avatarUrl = nextFlipped
            ? `/${cardBackUrl}`
            : `/${currentCardUrl}`;

        useImageStore.getState().projectEntity({
            id: `card-${activeDeck.id}-${idx}-${Date.now()}`,
            name: nextFlipped ? t('modules:session.deck_module.player.projection.hidden_name') : cardName,
            subtitle: nextFlipped ? t('modules:session.deck_module.player.projection.hidden_subtitle') : t('modules:session.deck_module.player.projection.oracle_subtitle', { name: activeDeck.name }),
            avatar: avatarUrl,
            type: 'Oracle',
            lore: nextFlipped ? '' : (DeckInterpreter.getCardMetadata(activeDeck, idx)?.description || '')
        });
    }, [isFlipped, isProjecting, activeDeck, activeState, cardBackUrl, currentCardUrl]);

    const handleDraw = useCallback(() => {
        if (!activeDeck) return;
        setIsFlipped(false);
        drawCard(activeDeck.id);
        setDrawCount(prev => prev + 1);
    }, [activeDeck, drawCard]);

    const handleDiscard = useCallback(() => {
        if (!activeDeck) return;
        setIsFlipped(false);
        discardCard(activeDeck.id);
    }, [activeDeck, discardCard]);

    const handleShuffle = useCallback(() => {
        if (!activeDeck) return;
        shuffleDeck(activeDeck.id);
    }, [activeDeck, shuffleDeck]);

    const aspectRatio = useMemo(() => {
        if (!activeDeck) return 1.4;
        return DeckInterpreter.calculateAspectRatio(activeDeck.format, activeDeck.orientation);
    }, [activeDeck]);

    /* ── Le quatrième tas ────────────────────────────────────────────────── */

    /**
     * Ceux à qui l'on peut confier une carte : le meneur, puis les personnages
     * de la campagne ouverte.
     *
     * Les personnages des **autres** campagnes n'y sont pas — confier un atout
     * de Blade Runner au magicien d'une chronique en sommeil serait un geste
     * qu'on ne remarquerait qu'à la reprise de cette chronique-là.
     */
    const porteursPossibles = useMemo(() => {
        // `players` peut manquer : magasin en cours de réhydratation, ou
        // fenêtre qui n'en a pas reçu. Une liste absente n'est pas une erreur,
        // c'est une table où personne n'est encore assis.
        const personnages = (players ?? []).flatMap(p =>
            (p.characters ?? [])
                .filter(c => String(c.campaignId ?? activeCampaignId) === String(activeCampaignId))
                .map(c => ({ id: c.id, nom: c.name, joueur: p.realName })));
        return [{ id: null as string | null, nom: t('modules:session.deck_module.player.hands.gm'), joueur: '' }, ...personnages];
    }, [players, activeCampaignId, t]);

    const nomDuPorteur = useCallback((porteur: string | null) =>
        porteursPossibles.find(p => p.id === porteur)?.nom
        // Un personnage supprimé pendant qu'il tenait une carte : on le dit
        // plutôt que d'afficher un identifiant nu.
        ?? t('modules:session.deck_module.player.hands.unknown'),
        [porteursPossibles, t]);

    /** Les cartes tenues, groupées par porteur, avec leur image. */
    const mainsOuvertes = useMemo(() => {
        if (!activeDeck || !activeState) return [];

        return porteursDeCartes(activeState).map(porteur => ({
            porteur,
            nom: nomDuPorteur(porteur),
            cartes: mainDuPorteur(activeState, porteur).map(carte => ({
                ...carte,
                url: DeckInterpreter.getCardImageUrl(activeDeck.folderPath, carte.index, activeDeck),
                nomDeLaCarte: DeckInterpreter.getCardMetadata(activeDeck, carte.index)?.name
                    ?? t('modules:session.deck_module.player.projection.card_name_fallback', { idx: carte.index }),
            })),
        }));
    }, [activeDeck, activeState, nomDuPorteur, t]);

    const handleGarder = useCallback((porteur: string | null) => {
        if (!activeDeck) return;
        setIsFlipped(false);
        garderLaCarte(activeDeck.id, porteur);
    }, [activeDeck, garderLaCarte]);

    const handleDonner = useCallback((index: number, porteur: string | null) => {
        if (activeDeck) donnerLaCarte(activeDeck.id, index, porteur);
    }, [activeDeck, donnerLaCarte]);

    const handleRetourner = useCallback((index: number) => {
        if (activeDeck) retournerLaCarte(activeDeck.id, index);
    }, [activeDeck, retournerLaCarte]);

    const handleJouer = useCallback((index: number) => {
        if (activeDeck) jouerLaCarteTenue(activeDeck.id, index);
    }, [activeDeck, jouerLaCarteTenue]);

    const handleRendre = useCallback((index: number) => {
        if (activeDeck) rendreLaCarteAuPaquet(activeDeck.id, index);
    }, [activeDeck, rendreLaCarteAuPaquet]);

    /**
     * **Les propositions en attente, sur l'écran du meneur.**
     *
     * Le destinataire tranche, mais le meneur doit pouvoir trancher aussi :
     * *un joueur parti aux toilettes ne doit pas bloquer une carte pendant tout
     * un combat.* Elles sont donc visibles ici, avec les deux réponses.
     */
    const propositionsEnAttente = useMemo(() => {
        if (!activeDeck) return [];
        return (demandesDeCarte ?? [])
            .filter(d => d.deckId === activeDeck.id && d.statut === 'en-attente')
            .map(d => ({
                ...d,
                deNom: nomDuPorteur(d.deQui),
                versNom: nomDuPorteur(d.versQui),
                nomDeLaCarte: DeckInterpreter.getCardMetadata(activeDeck, d.index)?.name
                    ?? t('modules:session.deck_module.player.projection.card_name_fallback', { idx: d.index }),
            }));
    }, [activeDeck, demandesDeCarte, nomDuPorteur, t]);

    return {
        // Le quatrième tas
        propositionsEnAttente,
        accepterLeDonDeCarte,
        refuserLeDonDeCarte,
        porteursPossibles,
        mainsOuvertes,
        handleGarder,
        handleDonner,
        handleRetourner,
        handleJouer,
        handleRendre,

        // State
        activeDeck,
        activeState,
        activeDeckId: effectiveDeckId,
        isFlipped,
        drawCount,
        cardBackUrl,
        currentCardUrl,
        aspectRatio,
        isProjecting,
        
        // Actions
        setActiveDeckId: selectDeck,
        handleFlip,
        handleDraw,
        handleDiscard,
        handleShuffle,
        toggleProjection
    };
};
