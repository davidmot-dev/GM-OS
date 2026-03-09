import React from 'react';
import { Music, Pause, Play, Volume2, EyeOff, HeartCrack, CheckCircle, Skull, Zap } from 'lucide-react';
import { useSessionOSStore } from '../useSessionOSStore';
import { useCombatStore } from '../../combat/useCombatStore';
import { useMusicStore } from '../../music/useMusicStore';

const ModuleSnapshots: React.FC = () => {
    const { rollDice, diceRolls, clearDiceRolls } = useSessionOSStore();
    const { combatants, currentTurnIdx, round } = useCombatStore();
    const { deckA, deckB, masterVolume, setMasterVolume, stopAll, playDeck } = useMusicStore();
    
    const lastRoll = diceRolls[0];

    // Determine active track (Deck A or B)
    const activeDeck = deckA.isPlaying ? 'A' : deckB.isPlaying ? 'B' : null;
    const activeTrackLabel = activeDeck === 'A' ? deckA.activeTrackLabel : deckB.activeTrackLabel;
    const isAudioPlaying = !!activeDeck;

    // Collect all unique status effects from all combatants
    const allActiveStatuses = combatants.flatMap(c => 
        (c.statuses || []).map(s => ({ ...s, combatantName: c.name }))
    );

    // Icon mapping for statuses
    const getStatusIcon = (name: string) => {
        const n = name.toLowerCase();
        if (n.includes('blind') || n.includes('aveugl')) return <EyeOff size={14} className="text-yellow-500" />;
        if (n.includes('fear') || n.includes('peur') || n.includes('fright')) return <HeartCrack size={14} className="text-red-500" />;
        if (n.includes('inspired') || n.includes('inspir')) return <Zap size={14} className="text-blue-400" />;
        if (n.includes('poison') || n.includes('toxin') || n.includes('bleed') || n.includes('saign')) return <Skull size={14} className="text-emerald-500" />;
        return <CheckCircle size={14} className="text-slate-400" />;
    };

    return (
        <aside className="col-span-3 bg-slate-900/80 border-l border-slate-800 p-4 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
            {/* Module Snapshot Section */}
            <div className="flex flex-col gap-4">
                <h4 className="text-xs uppercase tracking-widest text-slate-500 mb-2 font-bold px-1">Module Snapshot</h4>

                {/* Track 1: Active Encounter */}
                <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase tracking-wider px-1">
                        <span>Combat Order</span>
                        <span className="text-gm-gold">Round {round}</span>
                    </div>
                    
                    {combatants.length > 0 ? (
                        <div className="bg-slate-800/40 rounded-xl border border-slate-700/50 p-3 space-y-3">
                            {combatants.slice(0, 5).map((c, idx) => {
                                const isCurrentTurn = idx === currentTurnIdx;
                                const hpPct = Math.max(0, Math.min(100, (c.hp / c.hpMax) * 100));
                                
                                return (
                                    <div 
                                        key={c.id} 
                                        className={`flex items-center gap-3 transition-opacity ${isCurrentTurn ? 'opacity-100' : 'opacity-50'}`}
                                    >
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-[10px] border transition-all ${
                                            isCurrentTurn 
                                            ? 'bg-gm-gold/20 text-gm-gold border-gm-gold/50 shadow-[0_0_10px_-2px_rgba(234,179,8,0.3)]' 
                                            : 'bg-slate-700/50 text-slate-400 border-slate-600/30'
                                        }`}>
                                            {c.init}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-[10px] font-bold truncate ${isCurrentTurn ? 'text-white' : 'text-slate-400'}`}>
                                                {c.name}
                                            </p>
                                            <div className="w-full bg-slate-950/50 h-1 rounded-full mt-1 overflow-hidden">
                                                <div 
                                                    className={`h-full transition-all duration-500 ${hpPct > 50 ? 'bg-emerald-500' : hpPct > 25 ? 'bg-amber-500' : 'bg-red-500'}`}
                                                    style={{ width: `${hpPct}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            {combatants.length > 5 && (
                                <p className="text-[10px] text-slate-600 text-center italic mt-1">+ {combatants.length - 5} autres...</p>
                            )}
                        </div>
                    ) : (
                        <div className="bg-slate-800/20 rounded-xl border border-dashed border-slate-700/50 p-4 text-center">
                            <p className="text-[10px] text-slate-600 italic">Aucun combat actif</p>
                        </div>
                    )}
                </div>

                {/* Track 2: Audio Environment */}
                <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase tracking-wider px-1">
                        <span>Audio Environment</span>
                    </div>
                    <div className="bg-slate-800/40 rounded-xl border border-slate-700/50 p-3">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center border transition-colors ${isAudioPlaying ? 'text-gm-gold border-gm-gold/30' : 'text-slate-700 border-slate-800'}`}>
                                <Music size={20} className={isAudioPlaying ? 'animate-pulse' : ''} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs text-slate-200 font-bold truncate">
                                    {activeTrackLabel || 'Silence'}
                                </p>
                                <p className="text-[10px] text-slate-500 truncate italic">
                                    {isAudioPlaying ? 'Deck ' + activeDeck : 'En attente'}
                                </p>
                            </div>
                            <button 
                                onClick={() => isAudioPlaying ? stopAll() : (deckA.activePadId ? playDeck('A') : null)}
                                className={`p-1 transition-colors ${isAudioPlaying ? 'text-slate-400 hover:text-white' : 'text-gm-gold/40 hover:text-gm-gold'}`}
                                disabled={!isAudioPlaying && !deckA.activePadId && !deckB.activePadId}
                            >
                                {isAudioPlaying ? <Pause size={20} /> : <Play size={20} />}
                            </button>
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                            <Volume2 size={16} className="text-slate-500" />
                            <div className="flex-1 bg-slate-900 h-1 rounded-full relative group">
                                <input 
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.01"
                                    value={masterVolume}
                                    onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                />
                                <div 
                                    className="bg-gm-gold h-full rounded-full transition-all duration-150"
                                    style={{ width: `${masterVolume * 100}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Track 3: Conditions */}
                <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase tracking-wider px-1">
                        <span>Active Conditions</span>
                    </div>
                    {allActiveStatuses.length > 0 ? (
                        <div className="grid grid-cols-2 gap-2">
                            {allActiveStatuses.slice(0, 4).map((s, idx) => (
                                <div key={idx} className="bg-slate-800/40 rounded-lg p-2 border border-slate-700/50 flex items-center gap-2 overflow-hidden">
                                    <div className="flex-shrink-0">{getStatusIcon(s.name)}</div>
                                    <span className="text-[10px] text-slate-300 truncate" title={`${s.name} (${s.combatantName})`}>
                                        {s.name} <span className="text-slate-600">({s.combatantName})</span>
                                    </span>
                                </div>
                            ))}
                            {allActiveStatuses.length > 4 && (
                                <div className="col-span-2 text-[10px] text-slate-600 text-center italic">
                                    + {allActiveStatuses.length - 4} autres...
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="bg-slate-800/20 rounded-xl border border-dashed border-slate-700/50 p-4 text-center">
                            <p className="text-[10px] text-slate-600 italic">Aucune altération d'état</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Roll Tray */}
            <div className="mt-auto bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-lg">
                <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Quick Roll</span>
                    <button
                        onClick={() => clearDiceRolls()}
                        className="text-gm-gold text-[10px] font-bold hover:underline"
                    >
                        HISTORY
                    </button>
                </div>
                <div className="flex justify-between gap-1">
                    {[4, 6, 8, 20, 100].map((sides) => (
                        <button
                            key={sides}
                            onClick={() => rollDice(sides)}
                            className={`w-10 h-10 rounded-lg border flex flex-col items-center justify-center transition-all ${sides === 20
                                    ? 'bg-gm-gold/20 border-gm-gold/50 shadow-[0_0_15px_-3px_rgba(234,179,8,0.3)] hover:bg-gm-gold/30'
                                    : 'bg-slate-800 hover:bg-slate-700 border-slate-700'
                                }`}
                        >
                            <span className={`text-[10px] font-mono ${sides === 20 ? 'text-gm-gold' : 'text-slate-500'}`}>
                                d{sides === 100 ? '%' : sides}
                            </span>
                            <span className={`text-xs font-bold ${sides === 20 ? 'text-slate-100' : 'text-slate-300'}`}>
                                {lastRoll?.die === sides ? lastRoll.result : '-'}
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        </aside>
    );
};

export default ModuleSnapshots;
