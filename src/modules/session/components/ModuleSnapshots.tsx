import React from 'react';
import { Music, Pause, Volume2, EyeOff, HeartCrack, CheckCircle } from 'lucide-react';
import { useSessionOSStore } from '../useSessionOSStore';

const ModuleSnapshots: React.FC = () => {
    const { rollDice, diceRolls, clearDiceRolls } = useSessionOSStore();
    const lastRoll = diceRolls[0];

    return (
        <aside className="col-span-3 bg-slate-900/80 border-l border-slate-800 p-4 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
            {/* Module Snapshot Section */}
            <div className="flex flex-col gap-4">
                <h4 className="text-xs uppercase tracking-widest text-slate-500 mb-2 font-bold px-1">Module Snapshot</h4>

                {/* Track 1: Active Encounter */}
                <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase tracking-wider px-1">
                        <span>Combat Order</span>
                        <span className="text-gm-gold">Round 3</span>
                    </div>
                    <div className="bg-slate-800/40 rounded-xl border border-slate-700/50 p-3 space-y-3">
                        <div className="flex items-center gap-3 border-b border-slate-700 pb-2">
                            <div className="w-8 h-8 rounded-lg bg-gm-gold/20 text-gm-gold flex items-center justify-center font-mono font-bold">22</div>
                            <div className="flex-1">
                                <p className="text-xs text-slate-200 font-bold">Drogthar (Warrior)</p>
                                <div className="w-full bg-slate-900 h-1 rounded-full mt-1"><div className="bg-emerald-500 w-full h-full"></div></div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 border-b border-slate-700 pb-2">
                            <div className="w-8 h-8 rounded-lg bg-slate-700/50 text-slate-400 flex items-center justify-center font-mono font-bold">18</div>
                            <div className="flex-1">
                                <p className="text-xs text-slate-200 font-bold">Ghoul Swarm</p>
                                <div className="w-full bg-slate-900 h-1 rounded-full mt-1"><div className="bg-red-500 w-[40%] h-full"></div></div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 border-b border-slate-700 pb-2 opacity-50">
                            <div className="w-8 h-8 rounded-lg bg-slate-700/50 text-slate-400 flex items-center justify-center font-mono font-bold">15</div>
                            <div className="flex-1">
                                <p className="text-xs text-slate-200 font-bold">Lyra (Mage)</p>
                                <div className="w-full bg-slate-900 h-1 rounded-full mt-1"><div className="bg-emerald-500 w-[60%] h-full"></div></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Track 2: Audio Environment */}
                <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase tracking-wider px-1">
                        <span>Audio Environment</span>
                    </div>
                    <div className="bg-slate-800/40 rounded-xl border border-slate-700/50 p-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center text-gm-gold border border-slate-700">
                                <Music size={20} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs text-slate-200 font-bold truncate">Echoes of the Citadel</p>
                                <p className="text-[10px] text-slate-500 truncate italic">Dark Ambient • 12:45</p>
                            </div>
                            <button className="p-1 hover:text-gm-gold transition-colors">
                                <Pause size={20} />
                            </button>
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                            <Volume2 size={16} className="text-slate-500" />
                            <div className="flex-1 bg-slate-900 h-1 rounded-full"><div className="bg-gm-gold w-2/3 h-full rounded-full"></div></div>
                        </div>
                    </div>
                </div>

                {/* Track 3: Conditions */}
                <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase tracking-wider px-1">
                        <span>Active Conditions</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div className="bg-slate-800/40 rounded-lg p-2 border border-slate-700/50 flex items-center gap-2">
                            <EyeOff size={16} className="text-yellow-500" />
                            <span className="text-[10px] text-slate-300">Blinded (Mage)</span>
                        </div>
                        <div className="bg-slate-800/40 rounded-lg p-2 border border-slate-700/50 flex items-center gap-2">
                            <HeartCrack size={16} className="text-red-500" />
                            <span className="text-[10px] text-slate-300">Fear (Rogue)</span>
                        </div>
                        <div className="bg-slate-800/40 rounded-lg p-2 border border-slate-700/50 flex items-center gap-2">
                            <CheckCircle size={16} className="text-blue-500" />
                            <span className="text-[10px] text-slate-300">Inspired (War)</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Roll Tray */}
            <div className="mt-auto bg-slate-900 p-4 rounded-xl border border-slate-800">
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
                                    ? 'bg-gm-gold/20 border-gm-gold/50 shadow-[0_0_15px_-3px_rgba(234,179,8,0.3)]'
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
