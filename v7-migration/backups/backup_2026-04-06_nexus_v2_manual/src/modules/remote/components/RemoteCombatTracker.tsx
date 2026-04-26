import React from 'react';
import { ChevronRight, Shield } from 'lucide-react';
import { type RemoteCombatant } from '../types/remote.types';

interface RemoteCombatTrackerProps {
    combat: {
        combatants: RemoteCombatant[];
        currentTurnIdx: number;
        round: number;
    };
    isAventureMode: boolean;
    onNextTurn: () => void;
    onUpdateHp: (id: string, delta: number) => void;
}

const RemoteCombatTracker: React.FC<RemoteCombatTrackerProps> = ({ 
    combat, 
    isAventureMode, 
    onNextTurn, 
    onUpdateHp 
}) => {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between p-6 premium-glass rounded-[2.5rem]">
                <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Round Actuel</span>
                    <span className="text-3xl font-black text-white">{combat?.round ?? 1}</span>
                </div>
                <button 
                    onClick={onNextTurn}
                    className="px-8 py-4 bg-accent text-app-bg rounded-2xl flex items-center gap-2 font-black uppercase text-xs active:scale-95 transition-all"
                >
                    Suivant <ChevronRight size={18} />
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-20">
                {combat?.combatants?.map((c, i) => {
                    const isActive = i === combat.currentTurnIdx;
                    return (
                        <div key={c.id} className={`p-4 rounded-3xl border transition-all ${isActive ? 'bg-accent/10 border-accent scale-[1.02] shadow-glow-accent/10' : 'bg-white/5 border-white/5'}`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs transition-colors duration-500 ${isActive ? 'bg-accent text-app-bg shadow-glow-accent' : 'bg-white/10'}`}>{c.init}</div>
                                    <div className="flex flex-col">
                                        <span className={`font-bold text-sm transition-colors ${isActive ? 'text-accent' : 'text-slate-200'}`}>{c.name}</span>
                                        <span className="text-[8px] uppercase text-slate-500">{c.isPlayer ? 'Joueur' : 'Ennemi'}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {(!isAventureMode || c.isPlayer) && (
                                        <>
                                            <button 
                                                onClick={() => onUpdateHp(c.id, -1)} 
                                                className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-500 flex items-center justify-center active:scale-90"
                                            >
                                                -
                                            </button>
                                            <div className="flex flex-col items-center min-w-[30px]">
                                                <span className="text-xs font-black">{c.hp}</span>
                                                <span className="text-[8px] text-slate-500">PV</span>
                                            </div>
                                            <button 
                                                onClick={() => onUpdateHp(c.id, 1)} 
                                                className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center active:scale-90"
                                            >
                                                +
                                            </button>
                                        </>
                                    )}
                                    {isAventureMode && !c.isPlayer && (
                                        <div className="text-[10px] font-black uppercase text-slate-600 tracking-widest italic pr-2">Caché</div>
                                    )}
                                </div>
                            </div>

                            {c.healthSystem && (
                                <div className="mt-3 pt-3 border-t border-white/5 flex flex-wrap gap-2 items-center">
                                    {c.healthSystem.type === 'wounds' && (
                                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                                            c.healthSystem.data.currentLevel === 'SAIN' ? 'border-emerald-500/30 text-emerald-400' :
                                            c.healthSystem.data.currentLevel === 'FATAL' ? 'bg-rose-600 text-white animate-pulse' :
                                            'border-amber-500 text-amber-400'
                                        }`}>
                                            {c.healthSystem.data.currentLevel}
                                        </span>
                                    )}
                                    {c.healthSystem.type === 'clock' && (
                                        <div className="flex items-center gap-1.5 bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
                                            <div className="w-2 h-2 rounded-full bg-blue-500 shadow-glow-blue" />
                                            <span className="text-[10px] font-bold text-blue-400">
                                                {c.healthSystem.data.segments} / {c.healthSystem.data.maxSegments}
                                            </span>
                                        </div>
                                    )}
                                    {c.healthSystem.type === 'boxes' && (
                                        <div className="flex gap-1">
                                            {c.healthSystem.data.boxes.map((b, bi) => (
                                                <div 
                                                    key={bi} 
                                                    className={`w-2 h-2 rounded-sm border ${b.filled ? 'bg-orange-500 border-orange-400 shadow-glow-amber/20' : 'border-white/20'}`} 
                                                />
                                            ))}
                                        </div>
                                    )}
                                    {c.healthSystem.type === 'anatomy' && (
                                        <div className="flex items-center gap-1 text-[10px] text-rose-400 font-bold uppercase">
                                            <Shield size={10} /> 
                                            {Object.values(c.healthSystem.data.parts).filter(p => (p as any).status !== 'healthy').length} Blessures
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default RemoteCombatTracker;
