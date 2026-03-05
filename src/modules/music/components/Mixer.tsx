import React, { useState } from 'react';
import { Activity, FastForward } from 'lucide-react';
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
        <div className="w-full max-w-4xl bg-slate-900/40 rounded-3xl border border-white/5 p-6 backdrop-blur-sm shadow-2xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
                {/* Master Volume */}
                <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Master Gain</span>
                        <span className="text-[10px] font-mono text-primary font-bold">{Math.round(masterVolume * 100)}%</span>
                    </div>
                    <div className="relative h-3 bg-slate-950 rounded-full border border-white/5 group">
                        <div
                            className="absolute inset-y-0 left-0 bg-primary shadow-[0_0_15px_rgba(124,59,237,0.5)] transition-all duration-75 rounded-full"
                            style={{ width: `${masterVolume * 100}%` }}
                        />
                        {/* Visible Handle */}
                        <div
                            className="absolute top-1/2 -translate-y-1/2 size-4 bg-white rounded-full shadow-lg border-2 border-primary z-10 pointer-events-none transition-all duration-75"
                            style={{ left: `calc(${masterVolume * 100}% - 8px)` }}
                        />
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
                <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-center px-4">
                        <button
                            onClick={async () => await triggerAutoFade('A')}
                            className={`px-3 py-1 rounded-full text-[9px] font-bold border transition-all ${isFading === 'A' ? 'bg-primary border-primary text-white animate-pulse' : 'bg-slate-800 border-white/5 text-slate-500 hover:text-white'}`}
                        >
                            FADE TO A
                        </button>
                        <div className="size-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary/60">
                            <Activity size={16} />
                        </div>
                        <button
                            onClick={async () => await triggerAutoFade('B')}
                            className={`px-3 py-1 rounded-full text-[9px] font-bold border transition-all ${isFading === 'B' ? 'bg-primary border-primary text-white animate-pulse' : 'bg-slate-800 border-white/5 text-slate-500 hover:text-white'}`}
                        >
                            FADE TO B
                        </button>
                    </div>


                    <div className="relative h-12 flex items-center group">
                        {/* Track */}
                        <div className="absolute inset-x-0 h-4 bg-slate-950 rounded-xl border border-white/5 p-1">
                            <div className="w-full h-full border border-primary/10 rounded-lg bg-primary/5" />
                        </div>

                        {/* Interactive Handle */}
                        <div
                            className="absolute size-8 bg-white rounded-xl shadow-[0_8px_20px_rgba(0,0,0,0.5)] border-y border-slate-200 z-10 pointer-events-none transition-all duration-75 flex items-center justify-center"
                            style={{ left: `calc(${crossfader * 100}% - 1rem)` }}
                        >
                            <div className="w-0.5 h-4 bg-slate-300 rounded-full" />
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
                    </div>
                </div>


                {/* Automation Speed */}
                <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <FastForward size={14} className="text-slate-500" />
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Fade Duration</span>
                        </div>
                        <span className="text-[10px] font-mono text-primary font-bold">{(autoFadeDuration / 1000).toFixed(1)}s</span>
                    </div>
                    <div className="relative h-3 bg-slate-950 rounded-full border border-white/5 group">
                        <div
                            className="absolute inset-y-0 left-0 bg-slate-700 transition-all rounded-full"
                            style={{ width: `${((autoFadeDuration - 500) / 19500) * 100}%` }}
                        />
                        {/* Visible Handle */}
                        <div
                            className="absolute top-1/2 -translate-y-1/2 size-4 bg-white rounded-full shadow-lg border-2 border-slate-600 z-10 pointer-events-none transition-all duration-75"
                            style={{ left: `calc(${((autoFadeDuration - 500) / 19500) * 100}% - 8px)` }}
                        />
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

