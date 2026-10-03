import React from 'react';
import { useSessionOSStore } from '../useSessionOSStore';
import { useModalStore } from '../../../stores/useModalStore';
import { Calendar, Play } from 'lucide-react';
import { BoutonSecondaire } from '../../../components/socle';

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

    /*
      **La fenêtre porte ses propres marges** (2026-10-03, capture de David).
      Le pied compensait par `-mx-6 -mb-6` la marge d'un cadre qui n'en a plus :
      il débordait de 24 px, d'où deux barres de défilement et « Retour » coupé.
    */
    return (
        <div className="flex flex-col">
            <div className="flex flex-col gap-3 px-5 py-4">
                <p className="text-sm text-app-muted">
                    Sélectionnez une session planifiée pour commencer la partie.
                </p>

                <div className="flex max-h-[400px] flex-col gap-2 overflow-y-auto custom-scrollbar">
                    {plannedSessions.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-app-border py-8 text-center">
                            <p className="text-sm italic text-app-subtle">Aucune session planifiée pour cette campagne.</p>
                        </div>
                    ) : (
                        plannedSessions.map(session => (
                            <button
                                key={session.id}
                                onClick={() => handleSelect(session.id)}
                                className="group flex items-center justify-between rounded-xl border border-app-border bg-app-surface-2 p-4 transition-all hover:border-accent/40 hover:bg-accent/10 hover:shadow-glow-accent/10"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="flex size-10 items-center justify-center rounded-lg bg-app-bg text-app-muted transition-colors group-hover:text-accent">
                                        <Calendar size={20} />
                                    </div>
                                    <div className="text-left">
                                        <h4 className="text-sm font-bold text-app-text transition-colors group-hover:text-accent">Session #{session.number}</h4>
                                        <p className="text-xs italic text-app-subtle">
                                            {new Date(session.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-accent opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                                    <span className="text-ui-10 font-bold uppercase tracking-widest">Lancer</span>
                                    <Play size={14} fill="currentColor" />
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>

            <div className="flex items-center justify-between gap-4 border-t border-app-border px-5 py-3">
                <span className="text-ui-10 font-bold uppercase tracking-widest text-app-muted">
                    {plannedSessions.length} session{plannedSessions.length > 1 ? 's' : ''} en attente
                </span>
                <BoutonSecondaire onClick={closeModal}>Retour</BoutonSecondaire>
            </div>
        </div>
    );
};
