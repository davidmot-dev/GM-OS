import React, { useState } from 'react';
import { Activity } from 'lucide-react';
import { useMusicStore } from '../useMusicStore';

const Mixer: React.FC = () => {
    const { crossfader, setCrossfader, setCrossfaderVisualOnly, masterVolume, setMasterVolume, stopDeck, autoFadeDuration, setAutoFadeDuration, autoFadeTarget, clearAutoFadeTarget, triggerAutoFade } = useMusicStore();


    const [isFading, setIsFading] = useState<null | 'A' | 'B'>(null);
    const animationRef = React.useRef<number | null>(null);

    const handleAutoFade = (target: 'A' | 'B') => {
        if (isFading) return;
        const startValue = crossfader;

        const targetValue = target === 'A' ? 0 : 1;
        const sourceDeck = target === 'A' ? 'B' : 'A';
        setIsFading(target);
        const duration = Math.max(100, autoFadeDuration);
        const startTime = performance.now();

        const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const newValue = startValue + (targetValue - startValue) * progress;
            setCrossfaderVisualOnly(newValue);

            if (progress < 1) {
                animationRef.current = requestAnimationFrame(animate);
            } else {
                stopDeck(sourceDeck);
                setIsFading(null);
                animationRef.current = null;
            }
        };
        animationRef.current = requestAnimationFrame(animate);
    };

    React.useEffect(() => {
        return () => { if (animationRef.current) cancelAnimationFrame(animationRef.current); };
    }, []);

    React.useEffect(() => {
        if (autoFadeTarget) {
            handleAutoFade(autoFadeTarget);
            clearAutoFadeTarget();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autoFadeTarget]);

    return (
        <div className="w-full bg-app-bg/30 backdrop-blur-[32px] rounded-[1.5rem] border border-app-border/50 p-3 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.6)] relative overflow-hidden group/mixer transition-all duration-700 hover:border-accent/20 hover:bg-app-bg/40">
            {/* Inner Glass Glow */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.04] to-transparent pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 size-40 bg-accent/10 blur-[60px] pointer-events-none opacity-40" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center relative z-10">
                {/* Master Volume */}
                <div className="space-y-1">
                    <div className="flex items-center justify-between px-1">
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Master</span>
                            <span className="text-[7px] font-black text-accent uppercase tracking-widest opacity-60">Engine</span>
                        </div>
                        <div className="flex items-baseline gap-0.5">
                            <span className="text-xl font-black font-mono text-white/95 drop-shadow-md">{Math.round(masterVolume * 100)}</span>
                            <span className="text-[10px] font-black text-slate-600">%</span>
                        </div>
                    </div>
                    <div className="relative h-1.5 bg-app-bg rounded-full border border-app-border/50 shadow-inner group/range">
                        <div
                            className="absolute inset-y-0 left-0 bg-accent shadow-glow-accent transition-all duration-150 rounded-full"
                            style={{ width: `${masterVolume * 100}%` }}
                        />
                        <div
                            className="absolute top-1/2 -translate-y-1/2 size-4 bg-white rounded-lg shadow-lg border-2 border-accent z-10 pointer-events-none transition-all duration-150"
                            style={{ left: `calc(${masterVolume * 100}% - 8px)` }}
                        >
                            <div className="absolute inset-0 rounded-md animate-ping bg-accent/30" />
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={masterVolume}
                            onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                        />
                    </div>
                </div>

                {/* Crossfader Center */}
                <div className="space-y-2 flex flex-col items-center">
                    <div className="flex justify-between items-center w-full max-w-[200px] gap-3">
                        <button
                            onClick={async () => await triggerAutoFade('A')}
                            className={`flex-1 py-1.5 rounded-xl text-[8px] font-black border transition-all uppercase tracking-tighter active:scale-[0.98] ${isFading === 'A' ? 'bg-accent border-accent text-white shadow-glow-accent' : 'bg-app-surface/40 border-app-border/50 text-slate-500 hover:text-white hover:border-accent/30'}`}
                        >
                            A
                        </button>
                        <div className="size-8 rounded-xl bg-app-bg border border-app-border/50 flex items-center justify-center relative overflow-hidden">
                            <Activity size={14} className={`relative z-10 transition-all duration-500 ${isFading ? 'animate-pulse text-accent' : 'text-slate-700'}`} />
                        </div>
                        <button
                            onClick={async () => await triggerAutoFade('B')}
                            className={`flex-1 py-1.5 rounded-xl text-[8px] font-black border transition-all uppercase tracking-tighter active:scale-[0.98] ${isFading === 'B' ? 'bg-accent border-accent text-white shadow-glow-accent' : 'bg-app-surface/40 border-app-border/50 text-slate-500 hover:text-white hover:border-accent/30'}`}
                        >
                            B
                        </button>
                    </div>

                    <div className="relative w-full h-10 flex items-center group/fader px-4">
                        {/* Fader Track UI */}
                        <div className="absolute inset-x-8 h-3 bg-black/60 rounded-full border border-app-border/50 p-0.5 shadow-inner overflow-hidden">
                            <div className="w-full h-full border border-accent/5 rounded-full bg-gradient-to-r from-accent/10 via-transparent to-accent/10" />
                        </div>

                        {/* Premium Fader Handle */}
                        <div
                            className="absolute h-6 w-10 bg-slate-100 rounded-lg shadow-xl border-y border-white z-10 pointer-events-none transition-all duration-150 flex items-center justify-center after:content-[''] after:w-[1px] after:h-3 after:bg-slate-300 after:rounded-full"
                            style={{ left: `calc(${10 + (crossfader * 80)}% - 1.25rem)` }}
                        >
                            <div className="absolute inset-x-0 -top-0.5 h-[1px] bg-accent/20 blur-[1px]" />
                        </div>

                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={crossfader}
                            onChange={(e) => setCrossfader(parseFloat(e.target.value))}
                            className="absolute inset-x-0 w-full h-full opacity-0 cursor-pointer z-20"
                        />
                        
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 text-[8px] font-black text-slate-700 opacity-40 uppercase">A</div>
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 text-[8px] font-black text-slate-700 opacity-40 uppercase">B</div>
                    </div>
                </div>

                {/* Automation Engine */}
                <div className="space-y-1">
                    <div className="flex items-center justify-between px-1">
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Logic</span>
                            <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest opacity-60">Fade</span>
                        </div>
                        <div className="flex items-baseline gap-0.5">
                            <span className="text-xl font-black font-mono text-white/95 drop-shadow-md">{(autoFadeDuration / 1000).toFixed(1)}</span>
                            <span className="text-[10px] font-black text-slate-600">s</span>
                        </div>
                    </div>
                    <div className="relative h-1.5 bg-app-bg rounded-full border border-app-border/50 shadow-inner group/range-speed">
                        <div
                            className="absolute inset-y-0 left-0 bg-slate-700 transition-all rounded-full opacity-40"
                            style={{ width: `${((autoFadeDuration - 500) / 19500) * 100}%` }}
                        />
                        <div
                            className="absolute top-1/2 -translate-y-1/2 size-4 bg-app-surface rounded-lg shadow-lg border-2 border-app-border z-10 pointer-events-none transition-all duration-150 flex items-center justify-center p-0.5"
                            style={{ left: `calc(${((autoFadeDuration - 500) / 19500) * 100}% - 8px)` }}
                        >
                            <div className="w-[1px] h-2 bg-slate-500 rounded-full" />
                        </div>
                        <input
                            type="range"
                            min="500"
                            max="20000"
                            step="250"
                            value={autoFadeDuration}
                            onChange={(e) => setAutoFadeDuration(parseInt(e.target.value))}
                            className="absolute inset-x-0 w-full h-full opacity-0 cursor-pointer z-20"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Mixer;

