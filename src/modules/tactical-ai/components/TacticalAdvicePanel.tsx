import React from 'react';
import { Brain, Sparkles, AlertTriangle, ShieldCheck, MapPin, Loader2 } from 'lucide-react';
import { useTacticalAIStore } from '../useTacticalAIStore';
import { useCombatStore } from '../../combat/useCombatStore';
import { motion, AnimatePresence } from 'framer-motion';

export const TacticalAdvicePanel: React.FC = () => {
    const { activeAdvices, status, requestTacticalAnalysis } = useTacticalAIStore();
    const { combatants, currentTurnIdx } = useCombatStore();

    const activeActor = combatants[currentTurnIdx];
    const isAnalyzing = status === 'analyzing';

    const handleAnalyze = () => {
        if (activeActor) {
            requestTacticalAnalysis(activeActor.id);
        }
    };

    if (!activeActor) return null;

    return (
        <div className="flex flex-col h-full bg-black/20 overflow-hidden">
            {/* Header / Active Actor Context */}
            <div className="p-4 border-b border-white/5 bg-accent/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        {activeActor.avatar ? (
                            <img src={activeActor.avatar} className="w-10 h-10 rounded-full border border-accent/30 object-cover" alt="" />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center text-accent">
                                <Brain size={18} />
                            </div>
                        )}
                        {isAnalyzing && (
                            <div className="absolute -bottom-1 -right-1 bg-slate-950 rounded-full p-1 border border-accent/50 text-accent animate-spin">
                                <Loader2 size={10} />
                            </div>
                        )}
                    </div>
                    <div>
                        <h4 className="text-xs font-bold text-white uppercase tracking-tight line-clamp-1">{activeActor.name}</h4>
                        <p className="text-[10px] text-accent/60 font-mono uppercase">Tour Actuel • {activeActor.hp}/{activeActor.hpMax} PV</p>
                    </div>
                </div>

                <button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-glow-accent
                        ${isAnalyzing 
                            ? 'bg-slate-800 text-white/20 cursor-not-allowed border-white/5' 
                            : 'bg-accent text-slate-950 hover:brightness-110 active:scale-95 border-t border-white/30'}`}
                >
                    {isAnalyzing ? (
                        <>
                            <Loader2 size={14} className="animate-spin" />
                            Analyse...
                        </>
                    ) : (
                        <>
                            <Sparkles size={14} fill="currentColor" />
                            Analyser
                        </>
                    )}
                </button>
            </div>

            {/* Advice List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                <AnimatePresence mode="popLayout">
                    {activeAdvices.length === 0 ? (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="h-full flex flex-col items-center justify-center text-center px-6"
                        >
                            <Brain size={48} className="text-white/5 mb-4" />
                            <h5 className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Cortex Ready</h5>
                            <p className="text-[10px] text-white/20 leading-relaxed mt-2 uppercase">
                                Cliquez sur Analyser pour recevoir des conseils stratégiques basés sur la situation spatiale.
                            </p>
                        </motion.div>
                    ) : (
                        activeAdvices.map((advice, idx) => (
                            <motion.div
                                key={advice.id || idx}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className={`p-4 rounded-2xl border flex items-start gap-4 shadow-xl transition-all
                                    ${advice.priority === 3 
                                        ? 'bg-red-500/10 border-red-500/30' 
                                        : advice.priority === 2 
                                            ? 'bg-accent/10 border-accent/20' 
                                            : 'bg-white/5 border-white/10'}`}
                            >
                                <div className={`shrink-0 p-2 rounded-lg 
                                    ${advice.priority === 3 ? 'text-red-400 bg-red-400/10' : 'text-accent bg-accent/10'}`}>
                                    {advice.type === 'macro-rout' ? <AlertTriangle size={18} /> : 
                                     advice.type === 'position' ? <MapPin size={18} /> :
                                     <ShieldCheck size={18} />}
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[9px] font-black uppercase tracking-widest
                                            ${advice.priority === 3 ? 'text-red-400' : 'text-accent'}`}>
                                            {advice.type === 'macro-rout' ? 'Alerte Critique' : 
                                             advice.priority === 3 ? 'Urgence' : 
                                             advice.priority === 2 ? 'Opportunité' : 'Conseil'}
                                        </span>
                                    </div>
                                    <p className="text-[12px] text-white/90 leading-relaxed font-medium">
                                        {advice.message}
                                    </p>
                                </div>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>

            {/* Status Footer */}
            <div className="px-4 py-2 border-t border-white/5 bg-black/30 flex items-center justify-between">
                <span className="text-[9px] font-mono text-white/20 uppercase tracking-tighter">
                   Logic: Narrative Strategic Engine v1
                </span>
                <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${isAnalyzing ? 'bg-accent animate-pulse' : 'bg-emerald-500'}`} />
                    <span className="text-[9px] font-bold text-white/40 uppercase">{status}</span>
                </div>
            </div>
        </div>
    );
};
