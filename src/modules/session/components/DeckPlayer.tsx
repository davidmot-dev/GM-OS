/**
 * DeckPlayer — Interface de jeu Deck-OS
 * 
 * Permet de piocher des cartes avec un effet de glissement physique.
 * Gère l'orientation (Portrait/Paysage) et le format (Poker/Tarot).
 * 
 * @module session/components/DeckPlayer
 */

import React, { useState, useCallback } from 'react';
import { useSessionOSStore } from '../useSessionOSStore';
import { DeckInterpreter } from '../logic/DeckInterpreter';
import { useImageStore } from '../../image/useImageStore';
import { 
    Layers, 
    RefreshCw, 
    RotateCcw, 
    Trash2, 
    ChevronLeft,
    Infinity as InfinityIcon,
    Eye,
    EyeOff
} from 'lucide-react';

const DeckPlayer: React.FC = () => {
    const { 
        decks, 
        deckStates, 
        drawCard, 
        discardCard, 
        shuffleDeck,
        setCurrentView,
        isProjecting,
        toggleProjection 
    } = useSessionOSStore();

    const [activeDeckId, setActiveDeckId] = useState<string | null>(null);
    const [isFlipped, setIsFlipped] = useState(false);
    const [drawCount, setDrawCount] = useState(0); // For triggering animation key

    // Derive the effective deck ID (default to first deck)
    const effectiveDeckId = activeDeckId ?? (decks.length > 0 ? decks[0].id : null);

    const activeDeck = decks.find(d => d.id === effectiveDeckId);
    const activeState = effectiveDeckId ? deckStates[effectiveDeckId] : null;

    // Pre-compute URLs (null-safe, before hooks boundary)
    const cardBackUrl = activeDeck ? DeckInterpreter.getBackImageUrl(activeDeck.folderPath, activeDeck) : '';
    const currentCardUrl = (activeDeck && activeState && activeState.currentCardIndex !== null)
        ? DeckInterpreter.getCardImageUrl(activeDeck.folderPath, activeState.currentCardIndex, activeDeck)
        : null;

    // ✅ Hook declared BEFORE any early return (Rules of Hooks)
    const handleFlip = useCallback(() => {
        const nextFlipped = !isFlipped;
        setIsFlipped(nextFlipped);

        if (!isProjecting || !activeDeck || !activeState || activeState.currentCardIndex === null) return;

        const idx = activeState.currentCardIndex;
        const cardName = DeckInterpreter.getCardMetadata(activeDeck, idx)?.name || `Carte #${idx}`;
        const avatarUrl = nextFlipped
            ? `/${cardBackUrl}`    // Card back → project back image (hidden)
            : `/${currentCardUrl}`; // Card front → project card face

        useImageStore.getState().projectEntity({
            id: `card-${activeDeck.id}-${idx}-${Date.now()}`,
            name: nextFlipped ? '▪▪▪ Carte Cachée ▪▪▪' : cardName,
            subtitle: nextFlipped ? 'Retournée' : `Oracle : ${activeDeck.name}`,
            avatar: avatarUrl,
            type: 'Oracle',
            lore: nextFlipped ? '' : (DeckInterpreter.getCardMetadata(activeDeck, idx)?.description || '')
        });
    }, [isFlipped, isProjecting, activeDeck, activeState, cardBackUrl, currentCardUrl]);

    if (!activeDeck || !activeState) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-white/20 gap-4">
                <Layers size={48} strokeWidth={1} />
                <p className="text-sm font-black uppercase tracking-widest">Aucun paquet configuré</p>
                <button 
                    onClick={() => setCurrentView('deck-library')} 
                    className="px-6 py-2 bg-gm-gold/10 text-gm-gold border border-gm-gold/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gm-gold/20 transition-all"
                >
                    Aller à la Bibliothèque
                </button>
            </div>
        );
    }

    const aspectRatio = DeckInterpreter.calculateAspectRatio(activeDeck.format, activeDeck.orientation);

    const handleDraw = () => {
        setIsFlipped(false);
        drawCard(activeDeck.id);
        setDrawCount(prev => prev + 1);
    };

    const handleDiscard = () => {
        setIsFlipped(false);
        discardCard(activeDeck.id);
    };

    return (
        <div className="flex flex-col h-full w-full bg-[#0a0a0c] overflow-hidden p-8 gap-8">
            {/* Header / Selector */}
            <header className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => setCurrentView('deck-library')}
                        title="Retour à la Bibliothèque"
                        className="p-2 rounded-lg bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div className="h-8 w-px bg-white/10" />
                    <div>
                        <h1 className="text-xs font-black uppercase tracking-[0.2em] text-white/80 flex items-center gap-2">
                             Deck <span className="text-gm-gold">//</span> {activeDeck.name}
                        </h1>
                        <p className="text-[9px] text-white/20 font-bold uppercase tracking-widest mt-0.5">
                            {activeDeck.format} — {activeDeck.orientation} — {activeDeck.systemId}
                        </p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button 
                        onClick={() => setCurrentView('deck-library')}
                        className="mr-4 px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all bg-white/5 text-white/40 border border-white/5 hover:bg-white/10 hover:text-white flex items-center gap-2"
                    >
                        <Layers size={14} /> Bibliothèque
                    </button>

                    {decks.map(d => (
                        <button
                            key={d.id}
                            onClick={() => { setActiveDeckId(d.id); setIsFlipped(false); }}
                            className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border ${
                                activeDeckId === d.id 
                                ? 'bg-gm-gold text-black border-gm-gold shadow-glow-gold/20' 
                                : 'bg-white/5 text-white/40 border-white/5 hover:bg-white/10'
                            }`}
                        >
                            {d.name}
                        </button>
                    ))}

                    <div className="h-8 w-px bg-white/10 mx-2" />

                    <button 
                        onClick={toggleProjection}
                        title={isProjecting ? "Arrêter la projection Hub" : "Projeter sur Player Hub"}
                        className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border ${
                            isProjecting 
                            ? 'bg-gm-blue/20 text-gm-blue border-gm-blue/40 shadow-glow-blue/20' 
                            : 'bg-white/5 text-white/20 border-white/5 hover:bg-white/10 hover:text-white/60'
                        }`}
                    >
                        {isProjecting ? <Eye size={14} className="animate-pulse" /> : <EyeOff size={14} />}
                        {isProjecting ? 'Projection Active' : 'Seer\'s Eye'}
                    </button>
                </div>
            </header>

            {/* Main Interaction Area */}
            <div className="flex-1 flex items-center justify-center relative">
                {/* Left Side: The Pile (Pioche) */}
                <div className="absolute left-10 flex flex-col items-center gap-4">
                    <div 
                        className={`relative group transition-all ${activeState.remainingIndices.length > 0 ? 'cursor-pointer hover:scale-105 active:scale-95' : 'opacity-30 cursor-not-allowed'}`} 
                        onClick={() => activeState.remainingIndices.length > 0 && handleDraw()}
                    >
                        {/* Stacked effect */}
                        {activeState.remainingIndices.length > 2 && <div className="absolute inset-0 translate-x-1 translate-y-1 bg-black/40 border border-white/5 rounded-xl -z-10" />}
                        {activeState.remainingIndices.length > 5 && <div className="absolute inset-0 translate-x-2 translate-y-2 bg-black/40 border border-white/5 rounded-xl -z-20" />}
                        
                        <div 
                            className="bg-[#121215] border border-white/10 rounded-xl overflow-hidden shadow-2xl transition-all group-hover:border-gm-gold/40"
                            style={{ width: activeDeck.orientation === 'landscape' ? '264px' : '220px', aspectRatio }}
                        >
                            <img src={`/${cardBackUrl}`} alt="Dos de carte" className="w-full h-full object-cover opacity-60 group-hover:opacity-100" />
                            <div className="absolute inset-x-0 bottom-4 flex flex-col items-center gap-2">
                                <span className="px-3 py-1 bg-black/80 rounded-full text-[10px] font-black text-gm-gold border border-gm-gold/30">
                                    {activeState.remainingIndices.length}
                                </span>
                                <div 
                                    className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border ${
                                        activeDeck.useDiscard 
                                        ? 'bg-red-500/10 text-red-400 border-red-500/20' 
                                        : 'bg-gm-blue/10 text-gm-blue border-gm-blue/20'
                                    }`}
                                    title={activeDeck.useDiscard ? "Mode Défausse : Les cartes sont retirées du paquet" : "Mode Oracle : Les cartes sont remélangées à chaque pioche"}
                                >
                                    {activeDeck.useDiscard ? <Trash2 size={10} /> : <InfinityIcon size={10} />}
                                    {activeDeck.useDiscard ? 'Standard' : 'Oracle'}
                                </div>
                            </div>
                        </div>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-tighter text-white/20">Pioche</span>
                </div>

                {/* Center: The Active Card (Zone de Jeu) */}
                <div className="flex flex-col items-center gap-12">
                    {currentCardUrl ? (
                        <div 
                            key={`card-${drawCount}`}
                            className={`card-perspective animate-glide-card cursor-pointer`}
                            style={{ width: activeDeck.orientation === 'landscape' ? '480px' : '400px', aspectRatio }}
                            onClick={() => handleFlip()}
                        >
                            <div className={`card-inner h-full w-full relative ${isFlipped ? 'card-flipped' : ''}`}>
                                {/* Front (or rather the actual card content) */}
                                <div className="card-face absolute inset-0 rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl bg-[#0f0f12]">
                                    <img src={`/${currentCardUrl}`} alt="Carte" className="w-full h-full object-cover" />
                                </div>
                                {/* Back (The hidden side before flip) */}
                                <div className="card-face card-back absolute inset-0 rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl bg-[#0f0f12]">
                                    <img src={`/${cardBackUrl}`} alt="Dos de carte" className="w-full h-full object-cover grayscale opacity-40" />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div 
                            className="rounded-[2rem] border-2 border-dashed border-white/5 flex flex-col items-center justify-center text-white/5 gap-4"
                            style={{ width: activeDeck.orientation === 'landscape' ? '480px' : '400px', aspectRatio }}
                        >
                            <Layers size={64} strokeWidth={1} />
                            <span className="text-xs font-bold uppercase tracking-[0.2em]">Cliquer sur la pioche</span>
                        </div>
                    )}

                    {/* Bottom Controls */}
                    <div className="flex gap-4 p-4 rounded-3xl bg-black/40 backdrop-blur-xl border border-white/5 shadow-2xl">
                        <button 
                            onClick={handleDraw}
                            disabled={activeState.remainingIndices.length === 0}
                            className="flex flex-col items-center gap-1.5 p-4 rounded-2xl hover:bg-white/5 text-white/40 hover:text-gm-gold transition-all disabled:opacity-20"
                        >
                            <RefreshCw size={24} />
                            <span className="text-[9px] font-black uppercase tracking-widest">Piocher</span>
                        </button>
                        <div className="w-px h-12 self-center bg-white/5" />
                        <button 
                            onClick={handleDiscard}
                            disabled={!activeState.currentCardIndex}
                            className="flex flex-col items-center gap-1.5 p-4 rounded-2xl hover:bg-white/5 text-white/40 hover:text-red-400 transition-all disabled:opacity-20"
                        >
                            <Trash2 size={24} />
                            <span className="text-[9px] font-black uppercase tracking-widest">Défausser</span>
                        </button>
                        <div className="w-px h-12 self-center bg-white/5" />
                        <button 
                            onClick={() => shuffleDeck(activeDeck.id)}
                            className="flex flex-col items-center gap-1.5 p-4 rounded-2xl hover:bg-white/5 text-white/40 hover:text-gm-purple transition-all"
                        >
                            <RotateCcw size={24} />
                            <span className="text-[9px] font-black uppercase tracking-widest">Remélanger</span>
                        </button>
                    </div>
                </div>

                {/* Right Side: The Discard (Défausse) */}
                <div className="absolute right-10 flex flex-col items-center gap-4">
                     <div 
                        className={`rounded-xl border border-dashed transition-all ${
                            activeState.discardedIndices.length > 0 
                            ? 'bg-red-500/5 border-red-500/20' 
                            : 'bg-white/5 border-white/5'
                        }`}
                        style={{ width: activeDeck.orientation === 'landscape' ? '187px' : '156px', aspectRatio }}
                    >
                        {activeState.discardedIndices.length > 0 && (
                            <div className="h-full w-full flex items-center justify-center text-red-500/40 font-black text-xl">
                                {activeState.discardedIndices.length}
                            </div>
                        )}
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-tighter text-white/20">Défausse</span>
                </div>
            </div>
        </div>
    );
};

export default DeckPlayer;
