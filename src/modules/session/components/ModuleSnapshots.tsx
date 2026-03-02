import React from 'react';
import { useCombatStore } from '../../combat/useCombatStore';
import { useMusicStore } from '../../music/useMusicStore';
import { ShieldAlert, HeartCrack, ScanEye } from 'lucide-react';

const ModuleSnapshots: React.FC = () => {
    const { combatants, round } = useCombatStore();
    const { deckA, deckB } = useMusicStore();

    // Combat Snapshot logic
    const sortedCombatants = [...combatants].sort((a, b) => b.init - a.init);
    const topCombatants = sortedCombatants.slice(0, 3);

    // Audio Snapshot logic
    const activeDeck = deckA.isPlaying ? deckA : deckB.isPlaying ? deckB : null;
    let playingPad = null;

    // We try to find the playing pad to get its name. 
    // In real app, we might need a more robust way to find playing pad from playlists.
    if (activeDeck?.activePadId) {
        // Mock finding pad
        playingPad = { label: "Combat Soundtrack", url: activeDeck.activePadId };
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4">
                <h4 className="text-xs uppercase tracking-widest text-slate-500 font-bold px-1">Module Snapshot</h4>

                {/* Track 1: Active Encounter (Combat OS) */}
                <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase tracking-wider px-1">
                        <span>Combat Order</span>
                        {round > 0 && <span className="text-gm-gold">Round {round}</span>}
                    </div>

                    <div className="bg-slate-800/40 rounded-xl border border-slate-700/50 p-3 space-y-3">
                        {topCombatants.length > 0 ? topCombatants.map((c, i) => (
                            <div key={c.id} className={`flex items-center gap-3 border-b border-slate-700 pb-2 ${i === 2 ? 'border-none pb-0 opacity-50' : ''}`}>
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-sm ${i === 0 ? 'bg-gm-gold/20 text-gm-gold' : 'bg-slate-700/50 text-slate-400'}`}>
                                    {c.init}
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs text-slate-200 font-bold">{c.name}</p>
                                    <div className="w-full bg-slate-900 h-1 rounded-full mt-1">
                                        <div className={`h-full ${c.isPlayer ? 'bg-emerald-500' : 'bg-red-500'}`} style={{ width: `${(c.hp / c.hpMax) * 100}%` }} />
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div className="text-center py-4 text-xs text-slate-500 italic">No active combatants.</div>
                        )}
                    </div>
                </div>

                {/* Track 2: Audio Environment (Music OS) */}
                <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase tracking-wider px-1">
                        <span>Audio Environment</span>
                    </div>

                    <div className="bg-slate-800/40 rounded-xl border border-slate-700/50 p-3">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center border transition-all ${activeDeck ? 'bg-blue-900/40 border-blue-500/50 text-blue-400' : 'bg-slate-900 border-slate-700 text-slate-600'}`}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs text-slate-200 font-bold truncate">{playingPad ? playingPad.label : "Silence"}</p>
                                <p className="text-[10px] text-slate-500 truncate italic">Music OS</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Track 3: Active Conditions (Session/Combat) */}
                <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase tracking-wider px-1">
                        <span>Active Conditions</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <div className="bg-slate-800/40 rounded-lg p-2 border border-slate-700/50 flex items-center gap-2">
                            <ScanEye className="text-yellow-500" size={12} />
                            <span className="text-[10px] text-slate-300">Blinded (Mage)</span>
                        </div>
                        <div className="bg-slate-800/40 rounded-lg p-2 border border-slate-700/50 flex items-center gap-2">
                            <HeartCrack className="text-red-500" size={12} />
                            <span className="text-[10px] text-slate-300">Fear (Rogue)</span>
                        </div>
                        <div className="bg-slate-800/40 rounded-lg p-2 border border-slate-700/50 flex items-center gap-2">
                            <ShieldAlert className="text-blue-500" size={12} />
                            <span className="text-[10px] text-slate-300">Inspired (War)</span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default ModuleSnapshots;
