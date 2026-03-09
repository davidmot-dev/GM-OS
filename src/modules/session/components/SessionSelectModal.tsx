import React from 'react';
import { useSessionOSStore } from '../useSessionOSStore';
import { useModalStore } from '../../../stores/useModalStore';
import { Calendar, Play } from 'lucide-react';

export const SessionSelectModal: React.FC = () => {
    const { sessions, activeCampaignId, launchSession } = useSessionOSStore();
    const { closeModal } = useModalStore();

    const plannedSessions = sessions
        .filter(s => s.campaignId === activeCampaignId && s.status === 'planned')
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const handleSelect = (sessionId: string) => {
        launchSession(sessionId);
        closeModal();
    };

    return (
        <div className="flex flex-col gap-4">
            <p className="text-sm text-slate-400 mb-2">
                Sélectionnez une session planifiée pour commencer la partie.
            </p>
            
            <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
                {plannedSessions.length === 0 ? (
                    <div className="text-center py-8 border border-dashed border-slate-800 rounded-xl">
                        <p className="text-sm text-slate-600 italic">Aucune session planifiée pour cette campagne.</p>
                    </div>
                ) : (
                    plannedSessions.map(session => (
                        <button
                            key={session.id}
                            onClick={() => handleSelect(session.id)}
                            className="flex items-center justify-between p-4 bg-slate-900/60 hover:bg-gm-gold/10 border border-slate-800 hover:border-gm-gold/30 rounded-xl transition-all group group-hover:shadow-glow-gold/10"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-gm-gold transition-colors">
                                    <Calendar size={20} />
                                </div>
                                <div className="text-left">
                                    <h4 className="text-sm font-bold text-slate-100 group-hover:text-gm-gold transition-colors">Session #{session.number}</h4>
                                    <p className="text-xs text-slate-500 italic">
                                        {new Date(session.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-gm-gold opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                <span className="text-[10px] font-bold uppercase tracking-widest">Lancer</span>
                                <Play size={14} fill="currentColor" />
                            </div>
                        </button>
                    ))
                )}
            </div>

            <div className="mt-6 flex justify-between items-center bg-slate-900/40 -mx-6 -mb-6 p-4 border-t border-slate-800">
                <span className="text-[10px] text-slate-600 uppercase tracking-widest font-bold">
                    {plannedSessions.length} session{plannedSessions.length > 1 ? 's' : ''} en attente
                </span>
                <button
                    onClick={closeModal}
                    className="px-4 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-all border border-slate-800"
                >
                    Retour
                </button>
            </div>
        </div>
    );
};
