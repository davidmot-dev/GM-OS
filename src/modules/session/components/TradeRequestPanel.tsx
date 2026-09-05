import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSessionOSStore } from '../useSessionOSStore';
import { Check, X, ArrowRight, Package, Clock } from 'lucide-react';

const TradeRequestPanel: React.FC = () => {
    const { transferRequests, approveItemTransfer, rejectItemTransfer } = useSessionOSStore();
    
    const pendingRequests = transferRequests.filter(r => r.status === 'pending');

    if (pendingRequests.length === 0) return null;

    return (
        <div className="flex flex-col gap-3 mt-4 border-t border-app-border/40 pt-4 px-3">
            <div className="flex items-center justify-between mb-1">
                <p className="text-app-text/40 text-ui-10 font-bold uppercase tracking-[0.2em]">Échanges en attente</p>
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-accent/20 text-accent text-ui-9 font-bold animate-pulse">
                    <Clock size={10} />
                    {pendingRequests.length}
                </div>
            </div>

            <div className="flex flex-col gap-2">
                <AnimatePresence mode="popLayout">
                    {pendingRequests.map((request) => (
                        <motion.div
                            key={request.id}
                            initial={{ opacity: 0, x: -20, scale: 0.95 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                            className="glass-bento p-3 relative group overflow-hidden border border-white/5 hover:border-accent/30 transition-colors"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent pointer-events-none" />
                            
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center text-accent shadow-glow-accent/20">
                                        <Package size={16} />
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-bold text-app-text truncate max-w-[120px]">
                                            {request.item.name}
                                        </h4>
                                        <p className="text-ui-9 text-app-text/40 uppercase tracking-tighter">
                                            {request.item.type} • Qté: {request.item.quantity}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 mb-3 bg-black/20 p-1.5 rounded-lg border border-white/5">
                                <span className="text-ui-10 font-bold text-accent truncate flex-1 text-center bg-accent/10 py-0.5 rounded">
                                    {request.fromCharacterName}
                                </span>
                                <ArrowRight size={12} className="text-app-text/40 shrink-0" />
                                <span className="text-ui-10 font-bold text-emerald-400 truncate flex-1 text-center bg-emerald-400/10 py-0.5 rounded">
                                    {request.toCharacterName}
                                </span>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => approveItemTransfer(request.id)}
                                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/40 transition-all font-bold text-ui-10 uppercase tracking-wider"
                                >
                                    <Check size={14} />
                                    Approuver
                                </button>
                                <button
                                    onClick={() => rejectItemTransfer(request.id)}
                                    className="flex items-center justify-center w-8 rounded-md bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/30 transition-all"
                                    title="Rejeter"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default TradeRequestPanel;
