import React, { useEffect, useState, useMemo } from 'react';
import { Play, Pause, Square, Repeat, Activity } from 'lucide-react';
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

    const waveformHeights = useMemo(() => {
        // Use a static "random-looking" sequence for the visualizer to avoid lint issues
        return [60, 45, 80, 50, 65, 30, 85, 40, 70, 55, 90, 45, 60, 35, 75, 50, 65, 40, 80, 55, 70, 35, 90, 50, 65, 40, 85, 55, 70, 45, 80, 50, 65, 35, 75, 45, 60, 30, 85, 55];
    }, []);

    return (
        <div className="group relative bg-app-bg/40 backdrop-blur-[24px] rounded-[1.5rem] border border-app-border/50 p-4 shadow-xl overflow-hidden transition-all duration-500 hover:shadow-glow-accent/10 hover:border-accent/30 hover:bg-app-bg/50 flex flex-col gap-3">
            {/* Premium Ambient Background Glow */}
            <div className={`absolute -top-32 -right-32 w-80 h-80 rounded-full transition-all duration-1000 ${isPlaying ? 'bg-accent/20 blur-[120px] animate-pulse' : 'bg-transparent blur-0'}`} />
            <div className="absolute top-0 right-0 w-40 h-40 bg-accent/5 blur-3xl pointer-events-none opacity-40" />

            {/* Header: Track Info & Disc */}
            <div className="flex items-center gap-4 relative z-10">
                {/* Compact Disc Visualizer */}
                <div className="relative shrink-0">
                    <div className={`size-12 rounded-full border-2 border-app-bg bg-app-bg shadow-lg flex items-center justify-center relative overflow-hidden transition-all duration-500 ${isPlaying ? 'animate-spin-slow scale-105' : 'group-hover:scale-105'}`}>
                        {/* Center Label */}
                        <div className={`size-6 rounded-full border border-app-bg flex items-center justify-center relative z-10 transition-all duration-500 ${isPlaying ? 'bg-accent shadow-glow-accent' : 'bg-app-surface'}`}>
                            <Activity size={10} className={`transition-all duration-500 ${isPlaying ? 'text-white' : 'text-slate-600'}`} />
                        </div>
                    </div>
                </div>

                <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2">
                        <span className={`px-1.5 py-0.5 rounded-lg text-[7px] font-black uppercase tracking-widest transition-all duration-500 border ${isPlaying ? 'bg-accent/20 border-accent text-white shadow-glow-accent/20' : 'bg-app-surface/60 border-app-border/50 text-slate-500'}`}>
                            DRK {side}
                        </span>
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-white truncate tracking-tight transition-colors group-hover:text-accent/90">
                            {deckState.activeTrackLabel || "Ready"}
                        </h3>
                    </div>
                </div>
            </div>

            {/* Waveform & Progress */}
            <div className="space-y-2 relative z-10">
                <div className="h-4 bg-app-bg/60 rounded-lg border border-app-border/50 relative overflow-hidden flex items-end px-1 pb-0.5 gap-0.5 group-hover:border-accent/10 transition-colors shadow-inner">
                    {waveformHeights.map((h, i) => (
                        <div
                            key={i}
                            className={`flex-1 rounded-t-[1px] transition-all duration-300 ${isPlaying ? 'bg-accent/30 animate-jitter' : 'bg-slate-800'}`}
                            style={{
                                height: isPlaying ? `${h}%` : '20%',
                                transitionDelay: `${i * 5}ms`
                            }}
                        />
                    ))}
                    
                    <div className="absolute inset-0 flex items-center px-0 pointer-events-none">
                        <div className="h-full bg-accent/5 border-r border-accent/40 transition-all duration-100 ease-linear" style={{ width: `${progress}%` }} />
                    </div>
                </div>

                <div className="flex items-center justify-between text-[8px] font-black font-mono tracking-tighter text-slate-600 px-0.5 uppercase">
                    <span className={isPlaying ? 'text-accent' : ''}>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                </div>
            </div>

            {/* Transport Controls */}
            <div className="flex items-center gap-1.5 relative z-10">
                <button
                    onClick={() => isPlaying ? engineDeck.pause() : playDeck(side)}
                    className={`flex-[2] h-8 rounded-lg flex items-center justify-center transition-all group/btn ${isPlaying
                        ? 'bg-app-surface/80 text-accent border border-accent/20'
                        : 'bg-accent text-white shadow-lg active:scale-[0.98]'
                        }`}
                >
                    {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" className="translate-x-0.5" />}
                </button>
                
                <button
                    onClick={() => stopDeck(side)}
                    className="flex-1 h-8 rounded-lg bg-app-surface/50 border border-app-border/50 text-slate-600 flex items-center justify-center hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20 transition-all active:scale-[0.9]"
                    title="Stop"
                >
                    <Square size={10} fill="currentColor" />
                </button>
                <button
                    onClick={() => toggleLoop(side)}
                    className={`flex-1 h-8 rounded-lg border transition-all flex items-center justify-center ${deckState.isLooping
                        ? 'bg-accent/10 border-accent/30 text-accent shadow-glow-accent'
                        : 'bg-app-surface/50 border-app-border/50 text-slate-600 hover:text-slate-300'
                        }`}
                    title="Toggle Loop"
                >
                    <Repeat size={10} />
                </button>
            </div>
        </div>
    );
};

export default Deck;
