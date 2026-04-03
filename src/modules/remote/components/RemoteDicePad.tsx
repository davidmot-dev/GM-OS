import React, { useState } from 'react';
import { Minus, Plus, RotateCcw } from 'lucide-react';

interface RemoteDicePadProps {
    onRoll: (dice: { sides: number; count: number; modifier: number; mode: string; target: number }) => void;
    onClear: () => void;
}

const RemoteDicePad: React.FC<RemoteDicePadProps> = ({ onRoll, onClear }) => {
    const [diceCount, setDiceCount] = useState(1);
    const [diceModifier, setDiceModifier] = useState(0);
    const [diceMode, setDiceMode] = useState<'standard' | 'advantage' | 'disadvantage' | 'pool' | 'yze'>('standard');
    const [diceTarget, setDiceTarget] = useState(6);

    const diceTypes = [4, 6, 8, 10, 12, 20, 100];

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Controls */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex flex-col gap-2 p-4 premium-glass rounded-3xl">
                    <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Quantité</span>
                    <div className="flex items-center justify-between">
                        <button 
                            onClick={() => setDiceCount(Math.max(1, diceCount - 1))} 
                            title="Diminuer la quantité"
                            aria-label="Diminuer la quantité"
                            className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/5 active:scale-90 transition-all"
                        >
                            <Minus size={16} />
                        </button>
                        <span className="text-xl font-black text-accent">{diceCount}</span>
                        <button 
                            onClick={() => setDiceCount(Math.min(99, diceCount + 1))} 
                            title="Augmenter la quantité"
                            aria-label="Augmenter la quantité"
                            className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/5 active:scale-90 transition-all"
                        >
                            <Plus size={16} />
                        </button>
                    </div>
                </div>

                <div className="flex flex-col gap-2 p-4 premium-glass rounded-3xl">
                    <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Modificateur</span>
                    <div className="flex items-center justify-between">
                        <button 
                            onClick={() => setDiceModifier(diceModifier - 1)} 
                            title="Diminuer le modificateur"
                            aria-label="Diminuer le modificateur"
                            className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/5 active:scale-90 transition-all"
                        >
                            <Minus size={16} />
                        </button>
                        <span className={`text-xl font-black ${diceModifier === 0 ? 'text-slate-500' : 'text-accent'}`}>
                            {diceModifier > 0 ? `+${diceModifier}` : diceModifier}
                        </span>
                        <button 
                            onClick={() => setDiceModifier(diceModifier + 1)} 
                            title="Augmenter le modificateur"
                            aria-label="Augmenter le modificateur"
                            className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/5 active:scale-90 transition-all"
                        >
                            <Plus size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Mode Selector */}
            <div className="p-2 premium-glass rounded-2xl flex gap-1 overflow-x-auto scrollbar-hide">
                {['standard', 'advantage', 'disadvantage', 'pool', 'yze'].map(mode => (
                    <button
                        key={mode}
                        onClick={() => setDiceMode(mode as any)}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase whitespace-nowrap transition-all ${
                            diceMode === mode ? 'bg-accent text-app-bg shadow-glow-accent' : 'text-slate-500 hover:text-slate-300'
                        }`}
                    >
                        {mode}
                    </button>
                ))}
            </div>

            {/* Target Selector for Pool/YZE */}
            {(diceMode === 'pool' || diceMode === 'yze') && (
                <div className="p-6 premium-glass rounded-3xl flex flex-col gap-4 animate-in zoom-in-95 duration-300">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Seuil de Succès</span>
                        <span className="text-xl font-black text-accent">{diceTarget}+</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => setDiceTarget(Math.max(1, diceTarget - 1))} 
                            title="Diminuer le seuil"
                            aria-label="Diminuer le seuil"
                            className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/5 active:scale-90"
                        >
                            <Minus size={16} />
                        </button>
                        <input 
                            type="range" min="1" max="20" value={diceTarget} 
                            onChange={(e) => setDiceTarget(parseInt(e.target.value))}
                            title="Seuil de succès"
                            className="flex-1 h-2 bg-black/40 rounded-lg appearance-none accent-accent" 
                        />
                        <button 
                            onClick={() => setDiceTarget(diceTarget + 1)} 
                            title="Augmenter le seuil"
                            aria-label="Augmenter le seuil"
                            className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/5 active:scale-90"
                        >
                            <Plus size={16} />
                        </button>
                    </div>
                </div>
            )}

            {/* Dice Buttons */}
            <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-3">
                {diceTypes.map(d => (
                    <button
                        key={d}
                        onClick={() => onRoll({ sides: d, count: diceCount, modifier: diceModifier, mode: diceMode, target: diceTarget })}
                        className="aspect-square premium-glass border border-white/5 rounded-2xl flex flex-col items-center justify-center gap-1 active:scale-90 transition-all group"
                    >
                        <span className="text-xs font-black text-accent group-active:text-white">D{d}</span>
                        <div className="w-1.5 h-1.5 rounded-full bg-white/10 group-hover:bg-accent/40 transition-colors" />
                    </button>
                ))}
                <button
                    onClick={onClear}
                    title="Réinitialiser"
                    aria-label="Réinitialiser"
                    className="aspect-square bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-2xl flex items-center justify-center active:scale-90 transition-all font-black"
                >
                    <RotateCcw size={20} />
                </button>
            </div>
        </div>
    );
};

export default RemoteDicePad;
