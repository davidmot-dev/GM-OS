import React, { useState } from 'react';
import { useSessionOSStore } from '../useSessionOSStore';
import { useModalStore } from '../../../stores/useModalStore';
import { BookOpen, Save, X, Sparkles, Calendar } from 'lucide-react';

const SessionSummaryModal: React.FC = () => {
    const { sessions, updateSessionPublicSummary } = useSessionOSStore();
    const { defaultValue, closeModal } = useModalStore();
    
    const sessionId = (defaultValue as { sessionId: string })?.sessionId;
    const session = sessions.find(s => s.id === sessionId);

    const [summary, setSummary] = useState(session?.publicSummary || '');

    if (!session) return null;

    const handleSave = () => {
        updateSessionPublicSummary(session.id, summary);
        closeModal();
    };

    return (
        <div className="flex flex-col h-[75vh] bg-slate-950">
            {/* Context Header */}
            <div className="px-8 py-6 border-b border-white/5 bg-slate-900/40 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gm-gold/10 flex items-center justify-center text-gm-gold border border-gm-gold/20 shadow-[0_0_15px_rgba(234,179,8,0.1)]">
                        <BookOpen size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-100 uppercase tracking-tighter">Session #{session.number}</h2>
                        <div className="flex items-center gap-2 text-slate-500 font-mono text-xs">
                            <Calendar size={12} />
                            {new Date(session.date).toLocaleDateString(undefined, { dateStyle: 'long' })}
                        </div>
                    </div>
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                        Journal de Campagne
                    </div>
                </div>
            </div>

            {/* Editor Area */}
            <div className="flex-1 p-8 overflow-hidden flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Résumé Public & Lore</label>
                    <div className="flex items-center gap-2 text-[10px] text-gm-gold/60 font-medium">
                        <Sparkles size={12} />
                        Ce contenu sera utilisé par l'Oracle
                    </div>
                </div>
                <textarea
                    autoFocus
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    placeholder="Rédigez le compte-rendu détaillé de cette session... Les PJ, les lieux, les combats, les révélations..."
                    className="flex-1 bg-slate-900/20 border border-white/5 rounded-2xl px-8 py-8 text-lg leading-relaxed text-slate-200 resize-none font-medium placeholder:text-slate-800 custom-scrollbar focus:border-gm-gold/30 focus:ring-0 transition-all shadow-inner"
                />
            </div>

            {/* Actions Footer */}
            <div className="px-8 py-6 border-t border-white/5 bg-slate-900/40 flex items-center justify-between">
                <button
                    onClick={closeModal}
                    className="flex items-center gap-2 px-6 py-3 text-slate-400 hover:text-slate-200 font-bold text-sm transition-colors group"
                >
                    <X size={18} className="group-hover:rotate-90 transition-transform duration-300" />
                    ANNULER
                </button>

                <button
                    onClick={handleSave}
                    className="flex items-center gap-3 px-10 py-3 bg-gm-gold text-slate-950 rounded-xl font-black text-sm shadow-[0_0_20px_rgba(234,179,8,0.2)] hover:shadow-[0_0_30px_rgba(234,179,8,0.4)] transition-all active:scale-95 group"
                >
                    <Save size={20} className="group-hover:scale-110 transition-transform" />
                    ENREGISTRER LE RÉSUMÉ
                </button>
            </div>
        </div>
    );
};

export default SessionSummaryModal;
