import React from 'react';
import { useSessionOSStore } from '../useSessionOSStore';
import { 
    ChevronLeft, 
    Plus, 
    BookOpen,
    AlertCircle
} from 'lucide-react';

const SessionPrep: React.FC = () => {
    const { 
        sessions, 
        activeCampaignId, 
        setSelectedSession, 
        addSession, 
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
        <div className="flex-1 flex flex-col items-center justify-center p-10 bg-slate-950">
            <AlertCircle size={48} className="text-slate-700 mb-4" />
            <p className="text-slate-400 font-bold uppercase tracking-widest">No Active Campaign</p>
            <button 
                onClick={() => setCurrentView('library')}
                className="mt-6 px-6 py-2 bg-gm-gold text-slate-900 rounded-lg font-bold"
            >
                SELECT CAMPAIGN
            </button>
        </div>
    );

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-950">
            {/* Header */}
            <header className="flex items-center justify-between px-8 py-6 border-b border-white/5 bg-slate-900/50 backdrop-blur-md">
                <div className="flex items-center gap-6">
                    <button 
                        onClick={() => setCurrentView('cockpit')}
                        className="p-3 bg-slate-800/50 hover:bg-slate-700 rounded-xl text-slate-400 hover:text-slate-100 transition-all border border-white/5 active:scale-95"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-gm-gold font-bold uppercase tracking-widest bg-gm-gold/10 px-2 py-0.5 rounded border border-gm-gold/20">
                                {activeCampaign?.name || 'Campagne'}
                            </span>
                            <h2 className="text-2xl font-black text-slate-100 tracking-tight">Liste des Sessions</h2>
                        </div>
                        <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-bold mt-1">Gérer et préparer vos prochaines aventures</p>
                    </div>
                </div>

                <button 
                    onClick={handleCreateSession}
                    className="flex items-center gap-3 px-6 py-3 bg-gm-gold hover:brightness-110 text-slate-900 rounded-xl font-bold text-sm shadow-lg shadow-gm-gold/10 transition-all active:scale-95"
                >
                    <Plus size={20} />
                    CRÉER UNE SESSION
                </button>
            </header>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-10">
                <div className="max-w-6xl mx-auto flex flex-col gap-8">
                    {campaignSessions.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center py-20 opacity-30">
                            <BookOpen size={64} className="mb-6" />
                            <p className="text-lg font-bold uppercase tracking-widest text-center">Aucune session trouvée.<br/>Commencez par en créer une !</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {campaignSessions.sort((a, b) => b.number - a.number).map(s => (
                                <button
                                    key={s.id}
                                    onClick={() => {
                                        setSelectedSession(s.id);
                                        setCurrentView('session-focus');
                                    }}
                                    className="flex flex-col text-left p-8 bg-slate-900/40 border border-white/5 rounded-[2rem] hover:border-gm-gold/40 hover:bg-slate-900/60 transition-all group relative overflow-hidden active:scale-[0.98] shadow-2xl"
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="px-3 py-1 bg-gm-gold/10 text-gm-gold text-[10px] font-black rounded-lg uppercase tracking-widest border border-gm-gold/20">
                                            Session #{s.number}
                                        </div>
                                        <div className={`w-3 h-3 rounded-full ${
                                            s.status === 'active' ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 
                                            s.status === 'planned' ? 'bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 
                                            'bg-slate-600'
                                        }`}></div>
                                    </div>
                                    
                                    <h4 className="text-2xl font-black text-slate-100 mb-2 truncate">{new Date(s.date).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}</h4>
                                    <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-6">{s.status}</p>
                                    
                                    <div className="mt-auto flex items-center gap-3 text-[10px] font-black text-gm-gold/60 group-hover:text-gm-gold transition-colors uppercase tracking-[0.2em] border-t border-white/5 pt-6">
                                        <BookOpen size={14} />
                                        PRÉPARER LA SESSION
                                    </div>

                                    {/* Decorative subtle background elements */}
                                    <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-gm-gold/5 blur-[60px] rounded-full group-hover:bg-gm-gold/10 transition-all"></div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SessionPrep;
