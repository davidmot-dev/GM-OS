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
        return Array.from({ length: 40 }).map(() => 20 + Math.random() * 60);
    }, []);

    return (
        <div className="bg-slate-900/60 rounded-3xl border border-white/5 p-6 flex flex-col gap-6 relative overflow-hidden group transition-all hover:bg-slate-900/80">
            {/* Background Side Indicator */}
            <div className="absolute -right-6 -bottom-8 text-[12rem] font-black text-white/[0.03] italic select-none pointer-events-none group-hover:text-primary/[0.05] transition-colors">
                {side}
            </div>

            <div className="flex justify-between items-start relative z-10">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className={`size-1.5 rounded-full ${isPlaying ? 'bg-primary animate-pulse shadow-[0_0_8px_#7c3bed]' : 'bg-slate-700'}`} />
                        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Deck {side}</h3>
                    </div>
                    <p className="text-lg font-bold text-white truncate max-w-[240px] tracking-tight">
                        {deckState.activeTrackLabel || "No Track Loaded"}
                    </p>
                </div>
                <div className={`p-2.5 rounded-xl border transition-all ${isPlaying ? 'bg-primary/20 border-primary/30 text-primary shadow-[0_0_15px_rgba(124,59,237,0.2)]' : 'bg-slate-800/50 border-white/5 text-slate-500'}`}>
                    <Activity size={18} />
                </div>
            </div>

            {/* Waveform Visualization area */}
            <div className="h-24 bg-slate-950/80 rounded-2xl border border-white/5 relative overflow-hidden flex items-center justify-center group-hover:border-primary/20 transition-colors">
                {/* Simulated waveforms */}
                <div className="absolute inset-x-0 bottom-0 top-0 flex items-center justify-center gap-[2px] opacity-20 pointer-events-none">
                    {waveformHeights.map((h, i) => (
                        <div
                            key={i}
                            className={`w-[3px] rounded-full bg-primary transition-all duration-300 ${isPlaying ? 'animate-pulse' : ''}`}
                            style={{
                                height: isPlaying ? `${h}%` : '15%',
                                transitionDelay: `${i * 20}ms`
                            }}
                        />
                    ))}
                </div>

                {/* Progress Bar Overlay */}
                <div className="absolute inset-0 flex items-center pointer-events-none">
                    <div className="h-full bg-primary/10 border-r border-primary transition-all duration-100 ease-linear shadow-[0_0_15px_rgba(124,59,237,0.3)]" style={{ width: `${progress}%` }} />
                </div>

                <div className="relative z-10 flex flex-col items-center">
                    <span className="text-[11px] font-mono text-white tracking-[0.3em] uppercase opacity-40">Streaming Active</span>
                </div>
            </div>

            <div className="flex items-center justify-between text-xs font-mono text-slate-500 bg-slate-950/40 py-1.5 px-3 rounded-lg border border-white/5">
                <span className={isPlaying ? 'text-primary' : ''}>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
            </div>

            <div className="flex items-center gap-3 mt-auto relative z-10">
                <button
                    onClick={() => isPlaying ? engineDeck.pause() : playDeck(side)}
                    className={`flex-1 h-14 rounded-2xl flex items-center justify-center transition-all ${isPlaying
                        ? 'bg-primary/20 text-primary border border-primary/30 shadow-[inset_0_0_15px_rgba(124,59,237,0.1)]'
                        : 'bg-primary text-white shadow-[0_8px_20px_rgba(124,59,237,0.4)] hover:scale-[1.02] active:scale-[0.98]'
                        }`}
                >
                    {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="translate-x-0.5" />}
                </button>
                <button
                    onClick={() => stopDeck(side)}
                    className="w-14 h-14 rounded-2xl bg-slate-800/80 border border-white/5 text-slate-400 flex items-center justify-center hover:bg-red-500/20 hover:text-red-500 hover:border-red-500/30 transition-all active:scale-[0.95]"
                >
                    <Square size={20} fill="currentColor" />
                </button>
                <button
                    onClick={() => toggleLoop(side)}
                    className={`w-14 h-14 rounded-2xl border transition-all flex items-center justify-center ${deckState.isLooping
                        ? 'bg-primary/10 border-primary/40 text-primary shadow-[0_0_15px_rgba(124,59,237,0.1)]'
                        : 'bg-slate-800/80 border-white/5 text-slate-500 hover:text-slate-300'
                        }`}
                >
                    <Repeat size={20} />
                </button>
            </div>
        </div>
    );
};

export default Deck;
