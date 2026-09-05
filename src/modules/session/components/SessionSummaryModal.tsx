import React, { useState } from 'react';
import { useSessionOSStore } from '../useSessionOSStore';
import { useModalStore } from '../../../stores/useModalStore';
import { Save, Sparkles, Calendar } from 'lucide-react';

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
        <div className="flex flex-col h-full bg-app-bg p-8">
            {/* Context Header replaced by Body Info */}
            <div className="mb-6 flex items-center justify-between border-b border-app-border/10 pb-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-accent border border-accent/20">
                        <Calendar size={24} />
                    </div>
                    <div>
                        <div className="text-ui-10 font-black uppercase tracking-widest text-accent mb-1">Session Date</div>
                        <div className="text-sm font-mono text-app-text/60">
                            {new Date(session.date).toLocaleDateString(undefined, { dateStyle: 'long' })}
                        </div>
                    </div>
                </div>
                
                <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-ui-10 font-bold uppercase tracking-widest flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                    Journal de Campagne
                </div>
            </div>

            {/* Editor Area */}
            <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                <div className="flex items-center justify-between">
                    <label className="text-ui-10 font-black uppercase tracking-[0.2em] text-app-text/40">Résumé Public & Lore</label>
                    <div className="flex items-center gap-2 text-ui-10 text-accent/60 font-medium">
                        <Sparkles size={12} />
                        Ce contenu sera utilisé par l'Oracle
                    </div>
                </div>
                <textarea
                    autoFocus
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    placeholder="Rédigez le compte-rendu détaillé de cette session... Les PJ, les lieux, les combats, les révélations..."
                    className="flex-1 bg-app-surface/50 border border-app-border rounded-2xl px-8 py-8 text-lg leading-relaxed text-app-text/80 resize-none font-medium placeholder:text-app-text/10 custom-scrollbar focus:border-accent/30 focus:ring-0 transition-all shadow-inner"
                />
            </div>

            {/* Actions Footer */}
            <div className="mt-8 flex items-center justify-end">
                <button
                    onClick={handleSave}
                    className="flex items-center gap-3 px-10 py-3 bg-accent text-white rounded-xl font-black text-sm shadow-glow-accent transition-all active:scale-95 group"
                >
                    <Save size={20} className="group-hover:scale-110 transition-transform" />
                    ENREGISTRER LE RÉSUMÉ
                </button>
            </div>
        </div>
    );
};

export default SessionSummaryModal;
