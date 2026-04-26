import React from 'react';
import { useSessionOSStore } from '../useSessionOSStore';
import { StickyNote, Maximize2 } from 'lucide-react';

const SessionNotesModal: React.FC = () => {
    const { sessions, activeCampaignId, updateSessionNotes, campaigns } = useSessionOSStore();

    const campaign = campaigns.find(c => c.id === activeCampaignId);
    const session = sessions.find(s => s.id === campaign?.activeSessionId && s.status === 'active');

    if (!session) return null;

    return (
        <div className="flex flex-col h-full gap-6 relative overflow-hidden p-8 bg-app-bg">
            {/* Body Context Info */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-accent/60">
                    <Maximize2 size={14} />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Espace de Saisie Rapide</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-app-surface rounded-full border border-app-border">
                    <StickyNote size={12} className="text-accent" />
                    <p className="text-[10px] text-app-text/60 font-bold uppercase tracking-widest">
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
                className="flex-1 bg-app-surface/30 border border-app-border rounded-2xl px-8 py-6 text-lg leading-relaxed text-app-text resize-none font-medium placeholder:text-app-text/10 custom-scrollbar focus:border-accent/30 focus:ring-0 transition-all shadow-inner"
            />

            {/* Simple Help Info */}
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-app-text/20">
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/40 opacity-50"></div>
                    Sauvegarde Automatique
                </div>
                <span className="italic opacity-60">
                    Ferme cette fenêtre pour enregistrer
                </span>
            </div>
        </div>
    );
};

export default SessionNotesModal;
