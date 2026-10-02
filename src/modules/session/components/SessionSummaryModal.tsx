import React, { useState } from 'react';
import { useSessionOSStore } from '../useSessionOSStore';
import { useModalStore } from '../../../stores/useModalStore';
import { Save, Sparkles, Calendar } from 'lucide-react';
import { BoutonPrincipal, BoutonSecondaire } from '../../../components/socle';

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
        <div className="flex flex-col h-full bg-app-bg">
          <div className="flex flex-1 min-h-0 flex-col p-6">
            {/* Context Header replaced by Body Info */}
            <div className="mb-6 flex items-center justify-between border-b border-app-border/10 pb-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-accent border border-accent/20">
                        <Calendar size={24} />
                    </div>
                    <div>
                        <div className="text-ui-10 font-black uppercase tracking-widest text-accent mb-1">Séance n°{session.number}</div>
                        <div className="text-sm font-bold text-app-text">
                            {new Date(/^\d{4}-\d{2}-\d{2}$/.test(session.date) ? `${session.date}T12:00:00` : session.date).toLocaleDateString(undefined, { dateStyle: 'long' })}
                        </div>
                    </div>
                </div>

            </div>

            {/* Editor Area */}
            <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                <div className="flex items-center justify-between">
                    <label className="text-ui-10 font-black uppercase tracking-[0.2em] text-app-muted">Résumé public & lore</label>
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
                    className="flex-1 bg-app-surface border border-app-border rounded-lg px-5 py-4 text-base leading-relaxed text-app-text resize-none placeholder:text-app-subtle custom-scrollbar focus:border-accent focus:ring-0 transition-all"
                />
            </div>

          </div>
            {/* Un seul pied, séparé par un filet : « Annuler », puis
                l'action principale à droite (cadre commun des surcouches). */}
            <div className="flex shrink-0 items-center justify-end gap-2 border-t border-app-border px-5 py-3">
                <BoutonSecondaire onClick={closeModal}>Annuler</BoutonSecondaire>
                <BoutonPrincipal onClick={handleSave} className="flex items-center gap-2">
                    <Save size={15} />Enregistrer le résumé
                </BoutonPrincipal>
            </div>
        </div>
    );
};

export default SessionSummaryModal;
