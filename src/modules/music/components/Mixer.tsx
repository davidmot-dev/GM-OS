import React, { useState } from 'react';
import { Activity } from 'lucide-react';
import { useMusicStore } from '../useMusicStore';

const Mixer: React.FC = () => {
    const { crossfader, setCrossfader, setCrossfaderVisualOnly, masterVolume, setMasterVolume, playDeck, stopDeck, autoFadeDuration, setAutoFadeDuration, autoFadeTarget, clearAutoFadeTarget } = useMusicStore();
    const [isFading, setIsFading] = useState<null | 'A' | 'B'>(null);
    const animationRef = React.useRef<number | null>(null);

    const handleAutoFade = (target: 'A' | 'B') => {
        if (isFading) return;

        // On lance le deck cible
        playDeck(target);

        // EN V3 : Le fondu démarre TOUJOURS de la position actuelle
        const startValue = crossfader;
        const targetValue = target === 'A' ? 0 : 1;
        const sourceDeck = target === 'A' ? 'B' : 'A';

        setIsFading(target);

        console.log(`[Mixer] Transition vers ${target} depuis pos actuelle (Durée: ${autoFadeDuration}ms)`);

        const duration = Math.max(100, autoFadeDuration);
        const startTime = performance.now();

        const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Courbe Linéaire pour une vitesse constante et fidèle à l'expression "Durée du fondu"
            const newValue = startValue + (targetValue - startValue) * progress;

            // Uniquement visuel pour ne pas interférer avec le linearRamp audio natif
            setCrossfaderVisualOnly(newValue);

            if (progress < 1) {
                animationRef.current = requestAnimationFrame(animate);
            } else {
                console.log(`[Mixer] Transition vers ${target} terminée. Arrêt du Deck ${sourceDeck}.`);
                stopDeck(sourceDeck);
                setIsFading(null);
                animationRef.current = null;
            }
        };

        animationRef.current = requestAnimationFrame(animate);
    };

    // Nettoyage de l'animation au démontage
    React.useEffect(() => {
        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, []);

    // Déclencheur automatique depuis l'intelligence des Pads
    React.useEffect(() => {
        if (autoFadeTarget) {
            handleAutoFade(autoFadeTarget);
            clearAutoFadeTarget();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autoFadeTarget]);

    return (
        <div className="flex flex-col items-center justify-between py-2 gap-4 h-full w-full">
            {/* Master Volume Section */}
            <div className="flex flex-col items-center gap-1 group">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">Master</span>
                <div className="relative w-12 h-24 bg-slate-950 rounded-lg border border-slate-800 p-1 flex items-end overflow-hidden cursor-ns-resize">
                    {/* Visual Bar */}
                    <div
                        className="w-full bg-gradient-to-t from-gm-violet to-violet-400 rounded-sm shadow-[0_0_15px_rgba(139,92,246,0.4)] transition-all duration-75"
                        style={{ height: `${masterVolume * 100}%` }}
                    />
                    {/* Hidden Input for Interactivity */}
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={masterVolume}
                        onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
                        className="absolute inset-x-0 w-full h-full opacity-0 cursor-ns-resize z-30"
                        style={{ appearance: 'slider-vertical', WebkitAppearance: 'slider-vertical' } as unknown as React.CSSProperties}
                    />
                </div>
            </div>

            {/* Crossfader Section */}
            <div className="flex flex-col items-center gap-3 w-full px-2">
                <div className="flex justify-between w-full items-center mb-1 gap-2">
                    <button
                        onClick={() => handleAutoFade('A')}
                        className={`flex-1 py-1 px-2 text-[10px] font-bold rounded-lg border transition-all active:scale-95 ${isFading === 'A' ? 'bg-gm-violet border-violet-500 text-white animate-pulse' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700'}`}
                        title="Fondu vers Deck A"
                    >
                        CIBLE A
                    </button>

                    <div className="px-2">
                        <Activity size={12} className="text-gm-violet animate-pulse" />
                    </div>

                    <button
                        onClick={() => handleAutoFade('B')}
                        className={`flex-1 py-1 px-2 text-[10px] font-bold rounded-lg border transition-all active:scale-95 ${isFading === 'B' ? 'bg-gm-violet border-violet-500 text-white animate-pulse' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700'}`}
                        title="Fondu vers Deck B"
                    >
                        CIBLE B
                    </button>
                </div>

                <div className="relative w-full h-10 flex items-center px-4">
                    {/* Track */}
                    <div className="absolute inset-x-4 h-1.5 bg-slate-950 rounded-full border border-slate-900 shadow-inner" />

                    {/* Visual Thumb */}
                    <div
                        className="absolute w-12 h-6 bg-slate-100 rounded shadow-2xl border-x-4 border-slate-400 z-10 pointer-events-none transition-all duration-75 flex items-center justify-center"
                        style={{ left: `calc(${crossfader * 100}% - 24px + (1 - ${crossfader}) * 32px)` }}
                    >
                        <div className="w-0.5 h-3 bg-slate-300 rounded-full mx-0.5" />
                        <div className="w-0.5 h-3 bg-slate-300 rounded-full mx-0.5" />
                    </div>

                    {/* Interactive range input */}
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={crossfader}
                        onChange={(e) => setCrossfader(parseFloat(e.target.value))}
                        className="absolute inset-x-0 w-full h-full opacity-0 cursor-pointer z-30"
                    />
                </div>
            </div>

            {/* Speed Control Section */}
            <div className="flex flex-col items-center gap-1 w-full px-4">
                <div className="flex justify-between w-full text-[8px] font-bold text-slate-600 uppercase">
                    <span>Durée du fondu</span>
                    <span className="text-gm-violet">{(autoFadeDuration / 1000).toFixed(1)}s</span>
                </div>
                <input
                    type="range"
                    min="500"
                    max="20000"
                    step="250"
                    value={autoFadeDuration}
                    onChange={(e) => setAutoFadeDuration(parseInt(e.target.value))}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-gm-violet/50 hover:accent-gm-violet transition-all"
                />
            </div>
        </div>
    );
};

export default Mixer;
