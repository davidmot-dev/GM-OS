import React from 'react';
import { useTranslation } from 'react-i18next';
import { Music, Pause, Play, Volume2, EyeOff, HeartCrack, CheckCircle, Skull, Zap, Layers } from 'lucide-react';
import { useSessionOSStore } from '../useSessionOSStore';
import { useCombatStore } from '../../combat/useCombatStore';
import { useMusicStore } from '../../music/useMusicStore';
import { CockpitMessenger } from './CockpitMessenger';

const ModuleSnapshots: React.FC = () => {
    const { t } = useTranslation(['modules']);
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
        <aside className="h-full col-span-3 bg-app-surface/80 border-l border-app-border p-4 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
            {/* Module Snapshot Section */}
            <div className="flex flex-col gap-4">
                <h4 className="text-xs uppercase tracking-widest text-app-text/40 mb-2 font-bold px-1">{t('modules:session.snapshots.title')}</h4>

                {/* Track 1: Active Encounter */}
                <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between text-[10px] text-app-text/40 font-bold uppercase tracking-wider px-1">
                        <span>{t('modules:session.snapshots.combat_order')}</span>
                        <span className="text-accent">{t('modules:session.snapshots.round_hash', { number: round })}</span>
                    </div>
                    
                    {combatants.length > 0 ? (
                        <div className="bg-app-bg/40 rounded-xl border border-app-border/40 p-3 space-y-3">
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
                                            ? 'bg-accent/20 text-accent border-accent/50 shadow-glow-accent' 
                                            : 'bg-app-surface text-app-text/40 border-app-border/30'
                                        }`}>
                                            {c.init}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-[10px] font-bold truncate ${isCurrentTurn ? 'text-white' : 'text-app-text/40'}`}>
                                                {c.name}
                                            </p>
                                            <div className="w-full bg-app-bg h-1 rounded-full mt-1 overflow-hidden">
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
                                <p className="text-[10px] text-app-text/20 text-center italic mt-1">{t('modules:session.snapshots.others_count', { count: combatants.length - 5 })}</p>
                            )}
                        </div>
                    ) : (
                        <div className="bg-app-bg/20 rounded-xl border border-dashed border-app-border/40 p-4 text-center">
                            <p className="text-[10px] text-app-text/20 italic">{t('session.snapshots.no_active_encounter')}</p>
                        </div>
                    )}
                </div>

                {/* Track 2: Audio Environment */}
                <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between text-[10px] text-app-text/40 font-bold uppercase tracking-wider px-1">
                        <span>{t('session.snapshots.audio_environment')}</span>
                    </div>
                    <div className="bg-app-bg/40 rounded-xl border border-app-border/40 p-3">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg bg-app-bg flex items-center justify-center border transition-colors ${isAudioPlaying ? 'text-accent border-accent/30' : 'text-app-text/20 border-app-border/20'}`}>
                                <Music size={20} className={isAudioPlaying ? 'animate-pulse' : ''} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs text-app-text font-bold truncate">
                                    {activeTrackLabel || t('session.snapshots.audio_silence')}
                                </p>
                                <p className="text-[10px] text-app-text/40 truncate italic">
                                    {isAudioPlaying ? t('session.snapshots.audio_deck_label', { deck: activeDeck }) : t('session.snapshots.audio_waiting')}
                                </p>
                            </div>
                            <button 
                                onClick={() => isAudioPlaying ? stopAll() : (deckA.activePadId ? playDeck('A') : null)}
                                className={`p-1 transition-colors ${isAudioPlaying ? 'text-app-text/40 hover:text-white' : 'text-accent/40 hover:text-accent'}`}
                                disabled={!isAudioPlaying && !deckA.activePadId && !deckB.activePadId}
                            >
                                {isAudioPlaying ? <Pause size={20} /> : <Play size={20} />}
                            </button>
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                            <Volume2 size={16} className="text-app-text/40" />
                            <div className="flex-1 bg-app-bg h-1 rounded-full relative group">
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
                                    className="bg-accent h-full rounded-full transition-all duration-150"
                                    style={{ width: `${masterVolume * 100}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Track 3: Conditions */}
                <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between text-[10px] text-app-text/40 font-bold uppercase tracking-wider px-1">
                        <span>{t('session.snapshots.active_conditions')}</span>
                    </div>
                    {allActiveStatuses.length > 0 ? (
                        <div className="grid grid-cols-2 gap-2">
                            {allActiveStatuses.slice(0, 4).map((s, idx) => (
                                <div key={idx} className="bg-app-bg/40 rounded-lg p-2 border border-app-border/40 flex items-center gap-2 overflow-hidden">
                                    <div className="flex-shrink-0">{getStatusIcon(s.name)}</div>
                                    <span className="text-[10px] text-app-text/80 truncate" title={`${s.name} (${s.combatantName})`}>
                                        {s.name} <span className="text-app-text/20">({s.combatantName})</span>
                                    </span>
                                </div>
                            ))}
                            {allActiveStatuses.length > 4 && (
                                <div className="col-span-2 text-[10px] text-slate-600 text-center italic">
                                    {t('modules:session.snapshots.others_count', { count: allActiveStatuses.length - 4 })}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="bg-slate-800/20 rounded-xl border border-dashed border-slate-700/50 p-4 text-center">
                            <p className="text-[10px] text-slate-600 italic">{t('session.snapshots.no_condition')}</p>
                        </div>
                    )}
                </div>
                {/* Track 4: Deck-OS */}
                <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between text-[10px] text-app-text/40 font-bold uppercase tracking-wider px-1 border-t border-white/5 pt-4 mt-2">
                        <span>{t('session.snapshots.cards_destiny')}</span>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => useSessionOSStore.getState().setCurrentView('deck-library')}
                                className="text-accent hover:underline lowercase tracking-tight"
                            >
                                {t('session.snapshots.manage')}
                            </button>
                        </div>
                    </div>
                    <button 
                        onClick={() => useSessionOSStore.getState().setCurrentView('deck-player')}
                        className="group flex items-center justify-between bg-white/5 hover:bg-gm-gold/10 rounded-xl border border-app-border/40 hover:border-gm-gold/30 p-3 transition-all"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-black/40 flex items-center justify-center border border-app-border/20 group-hover:border-gm-gold/40 text-app-text/20 group-hover:text-gm-gold transition-colors">
                                <Layers size={18} />
                            </div>
                            <div className="flex flex-col items-start">
                                <span className="text-xs text-app-text font-bold uppercase tracking-wider group-hover:text-gm-gold transition-colors">Deck-OS</span>
                                <span className="text-[9px] text-app-text/40 uppercase tracking-widest font-black">{t('session.snapshots.start_engine')}</span>
                            </div>
                        </div>
                    </button>
                    <CockpitMessenger />
                </div>
            </div>

            {/* Quick Roll Tray */}
            <div className="mt-auto bg-app-bg p-4 rounded-xl border border-app-border/40 shadow-lg">
                <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] text-app-text/40 font-bold uppercase tracking-widest">{t('session.snapshots.quick_roll')}</span>
                    <button
                        onClick={() => clearDiceRolls()}
                        className="text-accent text-[10px] font-bold hover:underline"
                    >
                        {t('session.snapshots.history')}
                    </button>
                </div>
                <div className="flex justify-between gap-1">
                    {[4, 6, 8, 10, 12, 20, 100].map((sides) => (
                        <button
                            key={sides}
                            onClick={() => rollDice(sides)}
                            className={`w-10 h-10 rounded-lg border flex flex-col items-center justify-center transition-all ${sides === 20
                                    ? 'bg-accent/20 border-accent/50 shadow-glow-accent hover:bg-accent/30'
                                    : 'bg-app-surface hover:bg-app-surface/80 border-app-border/30'
                                }`}
                        >
                            <span className={`text-[10px] font-mono ${sides === 20 ? 'text-accent' : 'text-app-text/40'}`}>
                                d{sides === 100 ? '%' : sides}
                            </span>
                            <span className={`text-xs font-bold ${sides === 20 ? 'text-white' : 'text-app-text/80'}`}>
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
