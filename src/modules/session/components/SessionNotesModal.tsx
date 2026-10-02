import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSessionOSStore } from '../useSessionOSStore';
import { StickyNote, Maximize2 } from 'lucide-react';
import { BoutonSecondaire } from '../../../components/socle';
import { useModalStore } from '../../../stores/useModalStore';

const SessionNotesModal: React.FC = () => {
    const { t } = useTranslation();
    const { sessions, activeCampaignId, updateSessionNotes, campaigns } = useSessionOSStore();
    const closeModal = useModalStore(s => s.closeModal);

    const campaign = campaigns.find(c => c.id === activeCampaignId);
    const session = sessions.find(s => s.id === campaign?.activeSessionId && s.status === 'active');

    if (!session) return null;

    return (
        <div className="flex flex-col h-full relative overflow-hidden bg-app-bg">
          <div className="flex flex-1 min-h-0 flex-col gap-4 p-6">
            {/* Body Context Info */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-accent/60">
                    <Maximize2 size={14} />
                    <span className="text-ui-10 font-black uppercase tracking-[0.2em]">{t('modules:session.notes.quick_input')}</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-app-surface rounded-full border border-app-border">
                    <StickyNote size={12} className="text-accent" />
                    <p className="text-ui-10 text-app-text/60 font-bold uppercase tracking-widest">
                        {t('common:labels.session_number', { number: session.number })} • {campaign?.name}
                    </p>
                </div>
            </div>

            {/* Editor Area */}
            <textarea
                autoFocus
                value={session.sessionNotes || ''}
                onChange={(e) => updateSessionNotes(session.id, e.target.value)}
                placeholder={t('modules:session.notes.placeholder')}
                className="flex-1 bg-app-surface border border-app-border rounded-lg px-5 py-4 text-base leading-relaxed text-app-text resize-none placeholder:text-app-subtle custom-scrollbar focus:border-accent focus:ring-0 transition-all"
            />

          </div>
            {/* Un seul pied : « Fermer » — les notes s'enregistrent d'elles-mêmes. */}
            <div className="flex shrink-0 items-center justify-between gap-3 border-t border-app-border px-5 py-3">
                <span className="flex items-center gap-2 text-ui-10 font-bold uppercase tracking-widest text-app-muted">
                    <span className="h-1.5 w-1.5 rounded-full bg-etat-succes" />
                    {t('modules:session.notes.auto_save')}
                </span>
                <BoutonSecondaire onClick={closeModal}>Fermer</BoutonSecondaire>
            </div>
        </div>
    );
};

export default SessionNotesModal;
