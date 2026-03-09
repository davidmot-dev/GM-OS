import React from 'react';
import { useSessionOSStore } from '../useSessionOSStore';
import { useModalStore } from '../../../stores/useModalStore';
import { StickyNote, Save, Maximize2 } from 'lucide-react';

const SessionNotesModal: React.FC = () => {
    const { sessions, activeCampaignId, updateSessionNotes, campaigns } = useSessionOSStore();
    const { closeModal } = useModalStore();

    const campaign = campaigns.find(c => c.id === activeCampaignId);
    const session = sessions.find(s => s.id === campaign?.activeSessionId && s.status === 'active');

    if (!session) return null;

    return (
        <div className="flex flex-col h-[70vh] gap-6 relative overflow-hidden">
            {/* Context Info */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-gm-gold/60">
                    <Maximize2 size={14} />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Espace de Saisie Rapide</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-slate-900/80 rounded-full border border-white/5">
                    <StickyNote size={12} className="text-gm-gold" />
                    <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">
                        Session #{session.number} • {campaign?.name}
                    </p>
                </div>
            </div>
            
            {/* Editor Area */}
            <textarea
                autoFocus
                value={session.sessionNotes || ''}
                onChange={(e) => updateSessionNotes(session.id, e.target.value)}
                placeholder="Commencez à prendre des notes ici... Événements majeurs, citations mémorables, actions des PJ..."
                className="flex-1 bg-slate-900/30 border border-white/5 rounded-2xl px-8 py-6 text-lg leading-relaxed text-slate-200 resize-none font-medium placeholder:text-slate-800 custom-scrollbar focus:border-gm-gold/30 focus:ring-0 transition-all shadow-inner"
            />

            {/* Footer with Info & Action */}
            <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <div className="flex flex-col gap-1">
                     <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                        Sauvegarde Automatique
                    </div>
                    <span className="text-[9px] font-mono text-slate-500 italic opacity-60">
                        Ces notes seront transférées dans le résumé de session plus tard
                    </span>
                </div>

                <button
                    onClick={closeModal}
                    className="flex items-center gap-2 px-8 py-2.5 bg-gm-gold text-slate-950 rounded-xl font-bold text-sm shadow-glow-gold/10 hover:shadow-glow-gold/20 transition-all active:scale-95 group"
                >
                    <Save size={18} className="group-hover:scale-110 transition-transform" />
                    TERMINER LA SAISIE
                </button>
            </div>
        </div>
    );
};

export default SessionNotesModal;
