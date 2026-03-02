import React, { useEffect, useState } from 'react';
import { Play, Pause, Square, Repeat, Volume2 } from 'lucide-react';
import { useMusicStore } from '../useMusicStore';
import { musicEngine } from '../MusicEngine';

interface DeckProps {
    side: 'A' | 'B';
}

const Deck: React.FC<DeckProps> = ({ side }) => {
    const { deckA, deckB, playDeck, stopDeck, toggleLoop } = useMusicStore();
    const deckState = side === 'A' ? deckA : deckB;
    const engineDeck = side === 'A' ? musicEngine.deckA : musicEngine.deckB;

    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);

    // Synchronisation locale pour la progression (pour éviter de surcharger Zustand)
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(engineDeck.currentTime);
            setDuration(engineDeck.duration);
            setIsPlaying(engineDeck.isPlaying);
        }, 100);
        return () => clearInterval(interval);
    }, [engineDeck]);

    const formatTime = (time: number) => {
        const mins = Math.floor(time / 60);
        const secs = Math.floor(time % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
        <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-4 flex flex-col gap-4 relative overflow-hidden group">
            {/* Background Side Indicator */}
            <div className="absolute -right-4 -top-8 text-9xl font-black text-slate-800/10 italic select-none pointer-events-none">
                {side}
            </div>

            <div className="flex justify-between items-start z-10">
                <div>
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-gm-violet mb-1">Deck {side}</h3>
                    <p className="text-sm font-bold text-slate-200 truncate max-w-[180px]">
                        {deckState.activeTrackLabel || "Pas de piste chargée"}
                    </p>
                </div>
                <div className={`p-1.5 rounded-lg ${isPlaying ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-800 text-slate-500'}`}>
                    <Volume2 size={14} />
                </div>
            </div>

            {/* Waveform/Progress Placeholder */}
            <div className="h-16 bg-slate-950/50 rounded-xl border border-slate-800/50 relative overflow-hidden flex items-end">
                <div
                    className="absolute inset-0 bg-gm-violet/10 transition-all duration-100"
                    style={{ width: `${progress}%` }}
                />
                <div className="w-full h-full flex items-center justify-center">
                    {/* Ici on pourrait mettre une vraie Waveform plus tard */}
                    <span className="text-[10px] font-mono text-slate-600 uppercase tracking-tighter">Waveform Visualizer</span>
                </div>
            </div>

            <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
            </div>

            <div className="flex items-center gap-2 mt-auto">
                <button
                    onClick={() => isPlaying ? engineDeck.pause() : playDeck(side)}
                    className={`flex-1 h-10 rounded-xl flex items-center justify-center transition-all ${isPlaying
                        ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30'
                        : 'bg-gm-violet text-white shadow-[0_0_15px_rgba(139,92,246,0.4)]'
                        }`}
                >
                    {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
                </button>
                <button
                    onClick={() => stopDeck(side)}
                    className="w-10 h-10 rounded-xl bg-slate-800 text-slate-400 flex items-center justify-center hover:bg-red-500/20 hover:text-red-500 transition-all"
                >
                    <Square size={16} fill="currentColor" />
                </button>
                <button
                    onClick={() => toggleLoop(side)}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${deckState.isLooping
                        ? 'bg-gm-violet/20 text-violet-400 border border-violet-500/30 shadow-[0_0_10px_rgba(139,92,246,0.2)]'
                        : 'bg-slate-800 text-slate-500 hover:text-slate-300'
                        }`}
                    title={deckState.isLooping ? "Désactiver la boucle" : "Activer la boucle"}
                >
                    <Repeat size={16} />
                </button>
            </div>
        </div>
    );
};

export default Deck;
