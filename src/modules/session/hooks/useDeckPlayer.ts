import { useState, useCallback, useMemo } from 'react';
import { useSessionOSStore } from '../useSessionOSStore';
import { DeckInterpreter } from '../logic/DeckInterpreter';
import { useImageStore } from '../../image/useImageStore';

export const useDeckPlayer = () => {
    const { 
        decks, 
        deckStates, 
        drawCard, 
        discardCard, 
        shuffleDeck,
        isProjecting,
        toggleProjection 
    } = useSessionOSStore();

    const [activeDeckId, setActiveDeckId] = useState<string | null>(null);
    const [isFlipped, setIsFlipped] = useState(false);
    const [drawCount, setDrawCount] = useState(0);

    // Derive the effective deck ID (default to first deck)
    const effectiveDeckId = useMemo(() => 
        activeDeckId ?? (decks.length > 0 ? decks[0].id : null),
        [activeDeckId, decks]
    );

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
        const cardName = DeckInterpreter.getCardMetadata(activeDeck, idx)?.name || `Carte #${idx}`;
        const avatarUrl = nextFlipped
            ? `/${cardBackUrl}`
            : `/${currentCardUrl}`;

        useImageStore.getState().projectEntity({
            id: `card-${activeDeck.id}-${idx}-${Date.now()}`,
            name: nextFlipped ? '▪▪▪ Carte Cachée ▪▪▪' : cardName,
            subtitle: nextFlipped ? 'Retournée' : `Oracle : ${activeDeck.name}`,
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

    return {
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
        setActiveDeckId,
        handleFlip,
        handleDraw,
        handleDiscard,
        handleShuffle,
        toggleProjection
    };
};
