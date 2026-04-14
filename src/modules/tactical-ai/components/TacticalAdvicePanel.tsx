import React from 'react';
import { Brain, Sparkles, AlertTriangle, ShieldCheck, MapPin, Loader2 } from 'lucide-react';
import { useTacticalAIStore } from '../useTacticalAIStore';
import { useCombatStore } from '../../combat/useCombatStore';
import { useOracleContext } from '../../ai/hooks/useOracleContext';
import { motion, AnimatePresence } from 'framer-motion';

export const TacticalAdvicePanel: React.FC = () => {
    const { activeAdvices, status, strategicNarration, requestTacticalAnalysis } = useTacticalAIStore();
    const { combatants, currentTurnIdx } = useCombatStore();
    const { snapshot } = useOracleContext();

    const activeActor = combatants[currentTurnIdx];
    const isAnalyzing = status !== 'idle' && status !== 'error';

    const handleAnalyze = () => {
        if (activeActor) {
            requestTacticalAnalysis(activeActor.id, snapshot);
        }
    };

    if (!activeActor) return null;

    return (
        <div className="flex flex-col h-full bg-slate-950/20 backdrop-blur-md overflow-hidden border-l border-white/5 shadow-2xl">
            {/* Header / Active Actor Context */}
            <div className="p-4 border-b border-white/10 bg-gradient-to-r from-accent/10 to-transparent flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="relative group">
                        {activeActor.avatar ? (
                            <img src={activeActor.avatar} className="w-10 h-10 rounded-full border border-accent/40 shadow-glow-accent/20 object-cover" alt="" />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center text-accent shadow-inner">
                                <Brain size={18} />
                            </div>
                        )}
                        {isAnalyzing && (
                            <div className="absolute -bottom-1 -right-1 bg-slate-950 rounded-full p-1 border border-accent/50 text-accent animate-spin shadow-lg">
                                <Loader2 size={10} />
                            </div>
                        )}
                    </div>
                    <div>
                        <h4 className="text-[11px] font-black text-white uppercase tracking-wider line-clamp-1 drop-shadow-md">{activeActor.name}</h4>
                        <p className="text-[9px] text-accent/80 font-mono uppercase tracking-tighter">Tour Actuel • {activeActor.hp}/{activeActor.hpMax} PV</p>
                    </div>
                </div>

                <button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all
                        ${isAnalyzing 
                            ? 'bg-slate-800 text-white/20 cursor-not-allowed border border-white/5' 
                            : 'bg-accent text-slate-950 hover:brightness-110 active:scale-95 border-t border-white/40 shadow-glow-accent'}`}
                >
                    {isAnalyzing ? (
                        <>
                            <Loader2 size={14} className="animate-spin" />
                            {status === 'analyzing' ? 'Analyse...' : 'Transmission...'}
                        </>
                    ) : (
                        <>
                            <Sparkles size={14} />
                            Analyser
                        </>
                    )}
                </button>
            </div>

            {/* Advice List + Narration */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-black/10">
                <AnimatePresence mode="popLayout">
                    {strategicNarration && (
                        <motion.div
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-5 bg-slate-950/80 border border-accent/30 rounded-3xl mb-4 shadow-2xl relative overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-1 h-full bg-accent/50" />
                            <div className="flex items-center gap-2 mb-3">
                                <Sparkles size={14} className="text-accent animate-pulse" />
                                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-accent">Analyse Stratégique</span>
                            </div>
                            <p className="text-[13px] text-white/90 leading-relaxed font-medium" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
                                {strategicNarration}
                            </p>
                        </motion.div>
                    )}

                    {activeAdvices.length === 0 && !strategicNarration ? (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="h-full flex flex-col items-center justify-center text-center px-8 opacity-40 group"
                        >
                            <div className="relative mb-6">
                                <Brain size={64} className="text-white/10 group-hover:text-accent/20 transition-colors duration-700" />
                                <div className="absolute inset-0 bg-accent/5 blur-3xl rounded-full" />
                            </div>
                            <h5 className="text-[14px] font-black text-white/40 tracking-[0.3em]" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
                                CORTEX READY
                            </h5>
                            <p className="text-[11px] text-white/30 leading-relaxed mt-4 font-medium" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
                                Cliquez sur Analyser pour recevoir des conseils stratégiques basés sur la situation spatiale et narrative.
                            </p>
                        </motion.div>
                    ) : (
                        activeAdvices.map((advice, idx) => (
                            <motion.div
                                key={advice.id || idx}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.1, type: "spring", stiffness: 100 }}
                                className={`p-4 rounded-3xl border flex items-start gap-4 shadow-2xl transition-all hover:scale-[1.02]
                                    ${advice.priority >= 4 
                                        ? 'bg-red-500/15 border-red-500/30' 
                                        : advice.priority === 3 
                                            ? 'bg-accent/15 border-accent/25' 
                                            : 'bg-white/5 border-white/10 backdrop-blur-sm'}`}
                            >
                                <div className={`shrink-0 p-2.5 rounded-2xl shadow-inner
                                    ${advice.priority >= 4 ? 'text-red-400 bg-red-400/20' : 'text-accent bg-accent/20'}`}>
                                    {advice.type === 'macro-rout' || advice.type === 'macro-flank' ? <AlertTriangle size={20} /> : 
                                     advice.type === 'position' ? <MapPin size={20} /> :
                                     advice.type === 'magic' || advice.type === 'spell' ? <Sparkles size={20} /> :
                                     <ShieldCheck size={20} />}
                                </div>
                                <div className="space-y-1.5 pt-0.5">
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[10px] font-black uppercase tracking-[0.2em]
                                            ${advice.priority >= 4 ? 'text-red-400' : 'text-accent'}`}>
                                            {advice.type === 'macro-rout' ? 'Alerte Critique' : 
                                             advice.priority >= 4 ? 'Urgence' : 
                                             advice.priority === 3 ? 'Opportunité' : 'Conseil'}
                                        </span>
                                    </div>
                                    <p className="text-[12.5px] text-white/90 leading-snug font-semibold tracking-tight" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
                                        {advice.message}
                                    </p>
                                </div>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>

            {/* Status Footer */}
            <div className="px-5 py-3 border-t border-white/10 bg-slate-950/40 flex items-center justify-between backdrop-blur-xl">
                <span className="text-[9px] font-mono text-white/30 uppercase tracking-[0.1em]">
                   Cortex Neural v6.2 • Active Liaison
                </span>
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full shadow-glow-accent ${isAnalyzing ? 'bg-accent animate-pulse' : 'bg-emerald-500/80 shadow-glow-emerald'}`} />
                    <span className="text-[9px] font-black text-white/50 uppercase tracking-widest">{status}</span>
                </div>
            </div>
        </div>
    );
};
