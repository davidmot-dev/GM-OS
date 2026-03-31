import React from 'react';
import { useSessionOSStore } from '../useSessionOSStore';
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
import { useDeckPlayer } from '../hooks/useDeckPlayer';

const DeckPlayer: React.FC = () => {
    const { setCurrentView, decks } = useSessionOSStore();
    const {
        activeDeck,
        activeState,
        activeDeckId,
        isFlipped,
        drawCount,
        cardBackUrl,
        currentCardUrl,
        aspectRatio,
        isProjecting,
        setActiveDeckId,
        handleFlip,
        handleDraw,
        handleDiscard,
        handleShuffle,
        toggleProjection
    } = useDeckPlayer();

    if (!activeDeck || !activeState) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-white/20 gap-4">
                <Layers size={48} strokeWidth={1} />
                <p className="text-sm font-black uppercase tracking-widest">Aucun paquet configuré</p>
                <button 
                    type="button"
                    onClick={() => setCurrentView('deck-library')} 
                    className="px-6 py-2 bg-gm-gold/10 text-gm-gold border border-gm-gold/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gm-gold/20 transition-all focus:outline-none focus:ring-2 focus:ring-gm-gold/40"
                >
                    Aller à la Bibliothèque
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full w-full bg-[#0a0a0c] overflow-hidden p-8 gap-8">
            {/* Header / Selector */}
            <header className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button 
                        type="button"
                        onClick={() => setCurrentView('deck-library')}
                        title="Retour à la Bibliothèque"
                        className="p-2 rounded-lg bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all focus:outline-none"
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
                        type="button"
                        onClick={() => setCurrentView('deck-library')}
                        className="mr-4 px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all bg-white/5 text-white/40 border border-white/5 hover:bg-white/10 hover:text-white flex items-center gap-2 focus:outline-none"
                    >
                        <Layers size={14} /> Bibliothèque
                    </button>

                    {decks.map(d => (
                        <button
                            key={d.id}
                            type="button"
                            onClick={() => setActiveDeckId(d.id)}
                            className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border focus:outline-none ${
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
                        type="button"
                        onClick={toggleProjection}
                        title={isProjecting ? "Arrêter la projection Hub" : "Projeter sur Player Hub"}
                        className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border focus:outline-none ${
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
                    <button 
                        type="button"
                        className={`relative group transition-all focus:outline-none ${activeState.remainingIndices.length > 0 ? 'cursor-pointer hover:scale-105 active:scale-95' : 'opacity-30 cursor-not-allowed'}`} 
                        onClick={() => activeState.remainingIndices.length > 0 && handleDraw()}
                        title="Piocher une carte"
                        disabled={activeState.remainingIndices.length === 0}
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
                    </button>
                    <span className="text-[10px] font-black uppercase tracking-tighter text-white/20">Pioche</span>
                </div>

                {/* Center: The Active Card (Zone de Jeu) */}
                <div className="flex flex-col items-center gap-12">
                    {currentCardUrl ? (
                        <button 
                            type="button"
                            key={`card-${drawCount}`}
                            className={`card-perspective animate-glide-card cursor-pointer focus:outline-none`}
                            style={{ width: activeDeck.orientation === 'landscape' ? '480px' : '400px', aspectRatio }}
                            onClick={() => handleFlip()}
                            title="Retourner la carte"
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
                        </button>
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
                            type="button"
                            onClick={handleDraw}
                            disabled={activeState.remainingIndices.length === 0}
                            className="flex flex-col items-center gap-1.5 p-4 rounded-2xl hover:bg-white/5 text-white/40 hover:text-gm-gold transition-all disabled:opacity-20 focus:outline-none"
                        >
                            <RefreshCw size={24} />
                            <span className="text-[9px] font-black uppercase tracking-widest">Piocher</span>
                        </button>
                        <div className="w-px h-12 self-center bg-white/5" />
                        <button 
                            type="button"
                            onClick={handleDiscard}
                            disabled={activeState.currentCardIndex === null}
                            className="flex flex-col items-center gap-1.5 p-4 rounded-2xl hover:bg-white/5 text-white/40 hover:text-red-400 transition-all disabled:opacity-20 focus:outline-none"
                        >
                            <Trash2 size={24} />
                            <span className="text-[9px] font-black uppercase tracking-widest">Défausser</span>
                        </button>
                        <div className="w-px h-12 self-center bg-white/5" />
                        <button 
                            type="button"
                            onClick={handleShuffle}
                            className="flex flex-col items-center gap-1.5 p-4 rounded-2xl hover:bg-white/5 text-white/40 hover:text-gm-purple transition-all focus:outline-none"
                        >
                            <RotateCcw size={24} />
                            <span className="text-[9px] font-black uppercase tracking-widest">Remélanger</span>
                        </button>
                    </div>
                </div>

                {/* Right Side: The Discard (Défausse) */}
                <div className="absolute right-10 flex flex-col items-center gap-4">
                     <div 
                        className={`rounded-xl border border-dashed transition-all flex items-center justify-center ${
                            activeState.discardedIndices.length > 0 
                            ? 'bg-red-500/5 border-red-500/20' 
                            : 'bg-white/5 border-white/5'
                        }`}
                        style={{ width: activeDeck.orientation === 'landscape' ? '187px' : '156px', aspectRatio }}
                    >
                        {activeState.discardedIndices.length > 0 && (
                            <div className="text-red-500/40 font-black text-xl">
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
