/**
 * DeckPlayer — Interface de jeu Deck-OS
 * 
 * Permet de piocher des cartes avec un effet de glissement physique.
 * Gère l'orientation (Portrait/Paysage) et le format (Poker/Tarot).
 * 
 * @module session/components/DeckPlayer
 */

import React, { useState, useEffect } from 'react';
import { useSessionOSStore } from '../useSessionOSStore';
import { DeckInterpreter } from '../logic/DeckInterpreter';
import { 
    Layers, 
    RefreshCw, 
    RotateCcw, 
    Trash2, 
    Maximize2, 
    Check,
    ChevronLeft
} from 'lucide-react';
import { ResolvedAsset } from '../../../components/ResolvedAsset';

const DeckPlayer: React.FC = () => {
    const { 
        decks, 
        deckStates, 
        drawCard, 
        discardCard, 
        shuffleDeck,
        setCurrentView 
    } = useSessionOSStore();

    const [activeDeckId, setActiveDeckId] = useState<string | null>(null);
    const [isFlipped, setIsFlipped] = useState(false);
    const [drawCount, setDrawCount] = useState(0); // For triggering animation key

    // Auto-select first deck if none selected
    useEffect(() => {
        if (!activeDeckId && decks.length > 0) {
            setActiveDeckId(decks[0].id);
        }
    }, [decks, activeDeckId]);

    const activeDeck = decks.find(d => d.id === activeDeckId);
    const activeState = activeDeckId ? deckStates[activeDeckId] : null;

    if (!activeDeck || !activeState) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-white/20 gap-4">
                <Layers size={48} strokeWidth={1} />
                <p className="text-sm font-black uppercase tracking-widest">Aucun paquet configuré</p>
                <button 
                    onClick={() => setCurrentView('campaign-form')} 
                    className="px-6 py-2 bg-gm-gold/10 text-gm-gold border border-gm-gold/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gm-gold/20 transition-all"
                >
                    Aller à la Bibliothèque
                </button>
            </div>
        );
    }

    const aspectRatio = DeckInterpreter.calculateAspectRatio(activeDeck.format, activeDeck.orientation);
    const cardBackUrl = DeckInterpreter.getBackImageUrl(activeDeck.folderPath);
    const currentCardUrl = activeState.currentCardIndex 
        ? DeckInterpreter.getCardImageUrl(activeDeck.folderPath, activeState.currentCardIndex)
        : null;

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
                        onClick={() => setCurrentView('campaign-dashboard')}
                        className="p-2 rounded-lg bg-white/5 text-white/40 hover:text-white transition-all"
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
                </div>
            </header>

            {/* Main Interaction Area */}
            <div className="flex-1 flex items-center justify-center relative">
                {/* Left Side: The Pile (Pioche) */}
                <div className="absolute left-10 flex flex-col items-center gap-4">
                    <div className="relative group cursor-pointer" onClick={handleDraw}>
                        {/* Stacked effect */}
                        <div className="absolute inset-0 translate-x-1 translate-y-1 bg-black/40 border border-white/5 rounded-xl -z-10" />
                        <div className="absolute inset-0 translate-x-2 translate-y-2 bg-black/40 border border-white/5 rounded-xl -z-20" />
                        
                        <div 
                            className="bg-[#121215] border border-white/10 rounded-xl overflow-hidden shadow-2xl transition-all group-hover:scale-105 group-hover:border-gm-gold/40 group-active:scale-95"
                            style={{ width: '140px', aspectRatio }}
                        >
                            <ResolvedAsset src={cardBackUrl} className="w-full h-full object-cover opacity-60 group-hover:opacity-100" />
                            <div className="absolute inset-x-0 bottom-4 flex justify-center">
                                <span className="px-3 py-1 bg-black/80 rounded-full text-[10px] font-black text-gm-gold border border-gm-gold/30">
                                    {activeState.remainingIndices.length}
                                </span>
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
                            style={{ width: '300px', aspectRatio }}
                            onClick={() => setIsFlipped(!isFlipped)}
                        >
                            <div className={`card-inner h-full w-full relative ${isFlipped ? 'card-flipped' : ''}`}>
                                {/* Front (or rather the actual card content) */}
                                <div className="card-face absolute inset-0 rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl bg-[#0f0f12]">
                                    <ResolvedAsset src={currentCardUrl} className="w-full h-full object-cover" />
                                </div>
                                {/* Back (The hidden side before flip) */}
                                <div className="card-face card-back absolute inset-0 rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl bg-[#0f0f12]">
                                    <ResolvedAsset src={cardBackUrl} className="w-full h-full object-cover grayscale opacity-40" />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div 
                            className="rounded-[2rem] border-2 border-dashed border-white/5 flex flex-col items-center justify-center text-white/5 gap-4"
                            style={{ width: '300px', aspectRatio }}
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
                        style={{ width: '120px', aspectRatio }}
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
