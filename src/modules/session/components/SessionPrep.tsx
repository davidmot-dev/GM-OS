import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSessionOSStore } from '../useSessionOSStore';
import { 
    ChevronLeft, 
    Plus, 
    BookOpen,
    AlertCircle,
    Trash2
} from 'lucide-react';
import { gmConfirm } from '../../../stores/useModalStore';

const SessionPrep: React.FC = () => {
    const { t } = useTranslation();
    const { 
        sessions, 
        activeCampaignId, 
        setSelectedSession, 
        addSession, 
        deleteSession,
        setCurrentView,
        campaigns
    } = useSessionOSStore();

    const activeCampaign = campaigns.find(c => c.id === activeCampaignId);
    const campaignSessions = sessions.filter(s => s.campaignId === activeCampaignId);

    const handleCreateSession = () => {
        const nextNum = campaignSessions.length > 0 
            ? Math.max(...campaignSessions.map(s => s.number)) + 1 
            : 1;
        
        const newId = addSession({
            campaignId: activeCampaignId!,
            number: nextNum,
            date: new Date().toISOString().split('T')[0],
            status: 'planned',
            publicSummary: '',
            gmSecrets: '',
            checklist: [],
            sessionEntityIds: []
        });
        setSelectedSession(newId);
        setCurrentView('session-focus');
    };

    if (!activeCampaignId) return (
        <div className="flex-1 flex flex-col items-center justify-center p-10 bg-app-bg">
            <AlertCircle size={48} className="text-slate-700 mb-4" />
            <p className="text-slate-400 font-bold uppercase tracking-widest">{t('modules:session.prep.no_active_campaign')}</p>
            <button 
                onClick={() => setCurrentView('library')}
                className="mt-6 px-6 py-2 bg-accent text-white rounded-lg font-bold"
            >
                {t('modules:session.prep.select_campaign')}
            </button>
        </div>
    );

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-app-bg">
            {/* Header */}
            <header className="flex items-center justify-between px-8 py-6 border-b border-app-border bg-app-surface/50 backdrop-blur-md">
                <div className="flex items-center gap-6">
                    <button 
                        onClick={() => setCurrentView('cockpit')}
                        className="p-3 bg-app-surface/50 hover:bg-app-surface/80 rounded-xl text-app-text/40 hover:text-app-text transition-all border border-app-border active:scale-95"
                        title={t('modules:session.prep.back_to_cockpit')}
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-ui-10 text-accent font-bold uppercase tracking-widest bg-accent/10 px-2 py-0.5 rounded border border-accent/20">
                                {activeCampaign?.name || t('modules:session.prep.no_active_campaign')}
                            </span>
                            <h2 className="text-2xl font-black text-app-text tracking-tight">{t('modules:session.prep.list_title')}</h2>
                        </div>
                        <p className="text-ui-10 text-app-text/40 uppercase tracking-[0.2em] font-bold mt-1">{t('modules:session.prep.list_subtitle')}</p>
                    </div>
                </div>

                <button 
                    onClick={handleCreateSession}
                    className="flex items-center gap-3 px-6 py-3 bg-accent hover:brightness-110 text-white rounded-xl font-bold text-sm shadow-glow-accent transition-all active:scale-95"
                >
                    <Plus size={20} />
                    {t('modules:session.prep.create_session')}
                </button>
            </header>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-10">
                <div className="max-w-6xl mx-auto flex flex-col gap-8">
                    {campaignSessions.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center py-20 opacity-30">
                            <BookOpen size={64} className="mb-6" />
                            <p className="text-lg font-bold uppercase tracking-widest text-center whitespace-pre-line">{t('modules:session.prep.no_sessions')}</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {campaignSessions.sort((a, b) => b.number - a.number).map(s => (
                                /*
                                  **La carte n'est pas un `<button>`, et ne peut pas l'être :**
                                  elle en contient un — la corbeille. Un bouton dans un bouton est
                                  interdit par le HTML, et le navigateur défait l'imbrication à sa
                                  façon : la corbeille sortait de la carte dans l'arbre réel, ce qui
                                  rendait son `stopPropagation` incertain.

                                  Une zone cliquable avec son rôle et son clavier donne le même
                                  comportement sans l'imbrication. `role`, `tabIndex` et `onKeyDown`
                                  vont ensemble : les retirer laisserait une carte que seule la
                                  souris peut ouvrir.
                                */
                                <div
                                    key={s.id}
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => {
                                        setSelectedSession(s.id);
                                        setCurrentView('session-focus');
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key !== 'Enter' && e.key !== ' ') return;
                                        if (e.target !== e.currentTarget) return; // la corbeille gère ses propres touches
                                        e.preventDefault(); // sinon l'espace fait défiler la page
                                        setSelectedSession(s.id);
                                        setCurrentView('session-focus');
                                    }}
                                    className="flex flex-col text-left p-8 bg-app-surface/40 border border-app-border/20 rounded-[2rem] hover:border-accent/40 hover:bg-app-surface/60 transition-all group relative overflow-hidden active:scale-[0.98] shadow-2xl cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="px-3 py-1 bg-accent/10 text-accent text-ui-10 font-black rounded-lg uppercase tracking-widest border border-accent/20">
                                            {t('modules:session.prep.session_card_number', { number: s.number })}
                                        </div>
                                        <div className={`w-3 h-3 rounded-full ${
                                            s.status === 'active' ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 
                                            s.status === 'planned' ? 'bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 
                                            'bg-slate-600'
                                        }`}></div>

                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                gmConfirm(
                                                    t('modules:session.prep.delete_confirm', { number: s.number }),
                                                    () => deleteSession(s.id),
                                                    () => {},
                                                    t('modules:session.prep.delete_btn'),
                                                    t('modules:session.prep.cancel_btn')
                                                );
                                            }}
                                            className="ml-2 p-2 text-app-text/20 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                                            title={t('modules:session.prep.delete_tooltip')}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                    
                                    <h4 className="text-2xl font-black text-app-text mb-2 truncate">{new Date(s.date).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}</h4>
                                    <p className="text-xs text-app-text/40 uppercase tracking-widest font-bold mb-6">{t(`modules:session.prep.status.${s.status}`)}</p>
                                    
                                    <div className="mt-auto flex items-center gap-3 text-ui-10 font-black text-accent/60 group-hover:text-accent transition-colors uppercase tracking-[0.2em] border-t border-app-border pt-6">
                                        <BookOpen size={14} />
                                        {t('modules:session.prep.prepare_btn')}
                                    </div>

                                    {/* Decorative subtle background elements */}
                                    <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-accent/5 blur-[60px] rounded-full group-hover:bg-accent/10 transition-all"></div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SessionPrep;
