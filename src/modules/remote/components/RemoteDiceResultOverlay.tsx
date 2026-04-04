import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Dices, Trophy } from 'lucide-react';
import { type RollRecord } from '../hooks/useRemoteSync';

interface RemoteDiceResultOverlayProps {
    result: RollRecord | null;
    onClose: () => void;
}

const RemoteDiceResultOverlay: React.FC<RemoteDiceResultOverlayProps> = ({ result, onClose }) => {
    return (
        <AnimatePresence>
            {result && (
                <motion.div
                    initial={{ y: -100, opacity: 0, scale: 0.95 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    exit={{ y: -50, opacity: 0, scale: 0.9 }}
                    transition={{ type: "spring", damping: 20, stiffness: 300 }}
                    className="fixed top-4 left-4 right-4 z-[200] pointer-events-none"
                    style={{ maxWidth: '600px', margin: '0 auto' }}
                >
                    <div 
                        onClick={(e) => {
                            e.stopPropagation();
                            onClose();
                        }}
                        className="pointer-events-auto premium-glass rounded-3xl border border-white/10 shadow-2xl overflow-hidden active:scale-95 transition-transform cursor-pointer group relative"
                    >
                        {/* Auto-dismiss progress indicator */}
                        <motion.div 
                            initial={{ width: '100%' }}
                            animate={{ width: '0%' }}
                            transition={{ duration: 15, ease: "linear" }}
                            className="absolute bottom-0 left-0 h-1 bg-accent/40"
                        />

                        <div className="p-4 flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-glow-sm ${
                                (result.successes && result.successes > 0) || result.tagSuccess
                                    ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/20' 
                                    : 'bg-accent/20 text-accent border border-accent/20'
                            }`}>
                                {((result.successes && result.successes > 0) || result.tagSuccess) ? <Trophy size={24} /> : <Dices size={24} />}
                            </div>

                            <div className="flex-1 min-w-0">
                                <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest block mb-0.5">
                                    {result.title || 'Jet de dés'}
                                </span>
                                <div className="flex items-baseline gap-2">
                                    <h2 className="text-2xl font-black text-white truncate leading-none">
                                        {result.totalDisplay || result.total}
                                    </h2>
                                    {result.successes !== undefined && (
                                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                                            <span className="text-[10px] font-black text-emerald-500 uppercase">
                                                {result.successes} Succès
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-col items-end gap-1">
                                <div className="p-2 rounded-full bg-white/5 text-slate-500 group-hover:text-white transition-colors">
                                    <X size={16} />
                                </div>
                                <span className="text-[8px] font-black text-slate-600 uppercase tracking-tighter">Fermer</span>
                            </div>
                        </div>

                        {/* Individual rolls detail */}
                        {result.rolls && result.rolls.length > 0 && (
                            <div className="px-4 pb-4 flex flex-wrap gap-2 max-h-32 overflow-y-auto custom-scrollbar border-t border-white/5 pt-3 mt-1">
                                {result.rolls.map((roll, idx) => (
                                    <div 
                                        key={idx}
                                        className={`px-2.5 py-1 rounded-xl text-xs font-black border transition-all ${
                                            roll.isCritMax 
                                                ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-500 shadow-glow-emerald/10' 
                                                : roll.isCritMin 
                                                    ? 'bg-rose-500/10 border-rose-500/50 text-rose-500 shadow-glow-rose/10'
                                                    : roll.isExploded
                                                        ? 'bg-amber-500/10 border-amber-500/50 text-amber-500'
                                                        : 'bg-white/5 border-white/10 text-slate-300'
                                        }`}
                                    >
                                        {roll.displayStr || roll.val}
                                    </div>
                                ))}
                                {result.modifier !== 0 && (
                                    <div className="px-2.5 py-1 rounded-xl text-xs font-black bg-accent/10 border border-accent/20 text-accent">
                                        Mod: {result.modifier > 0 ? '+' : ''}{result.modifier}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default RemoteDiceResultOverlay;
