import React from 'react';
import { useSessionOSStore } from '../useSessionOSStore';
import { useSessionStore } from '../../../store/useSessionStore';
import { BookOpen, LayoutDashboard, Swords, Users, Users2, Map as MapIcon, Archive, PlusCircle, Library, FileText } from 'lucide-react';

const CampaignCockpit: React.FC = () => {
    const { campaigns, activeCampaignId, sessions, setCurrentView, currentView } = useSessionOSStore();
    const { setActiveModule } = useSessionStore();

    const activeCampaign = campaigns.find(c => c.id === activeCampaignId);

    // Find active session for progress (mock logic for now)
    const activeSession = activeCampaign ? sessions.find(s => s.id === activeCampaign.activeSessionId) : null;
    const sessionCount = sessions.filter(s => s.campaignId === activeCampaignId).length;

    return (
        <aside className="col-span-3 bg-slate-900/90 backdrop-blur-md border-r border-slate-800 p-5 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
            {/* Campaign Card */}
            <div
                onClick={() => setCurrentView('campaign-details')}
                className="bg-slate-800/40 rounded-lg p-4 border-l-4 border-gm-gold shadow-[0_0_15px_-3px_rgba(234,179,8,0.3)] cursor-pointer hover:bg-slate-800/60 transition-all group"
            >
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <h3 className="text-slate-100 font-bold text-lg group-hover:text-gm-gold transition-colors">{activeCampaign?.name || 'No Active Campaign'}</h3>
                        <p className="text-slate-500 text-xs uppercase tracking-widest font-semibold font-display">Active Campaign</p>
                    </div>
                    <BookOpen className="text-gm-gold group-hover:scale-110 transition-transform" size={24} />
                </div>
                <div className="mt-4 flex flex-col gap-2">
                    <div className="flex justify-between text-xs text-slate-400">
                        <span>Session Progress</span>
                        <span>Stage {activeSession?.number || 0}/{sessionCount || 0}</span>
                    </div>
                    <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                        <div
                            className="bg-gm-gold h-full shadow-[0_0_15px_-3px_rgba(234,179,8,0.3)]"
                            style={{ width: `${sessionCount ? ((activeSession?.number || 0) / sessionCount) * 100 : 0}%` }}
                        ></div>
                    </div>
                </div>
            </div>

            {/* Navigation Menu */}
            <nav className="flex flex-col gap-1">
                <p className="text-slate-500 text-xs uppercase tracking-widest mb-2 px-3">Management</p>
                <button
                    onClick={() => setCurrentView('cockpit')}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg group w-full text-left transition-all ${currentView === 'cockpit' ? 'bg-gm-gold/10 text-gm-gold' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-100'}`}
                >
                    <LayoutDashboard className={currentView === 'cockpit' ? 'scale-110' : 'group-hover:scale-110 transition-transform'} size={20} />
                    <span className="text-sm font-medium">Cockpit</span>
                </button>
                <button
                    onClick={() => setCurrentView('players')}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg group w-full text-left transition-all ${currentView === 'players' ? 'bg-gm-gold/10 text-gm-gold' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-100'}`}
                >
                    <Users2 size={20} />
                    <span className="text-sm font-medium">Joueurs</span>
                </button>
                <button
                    onClick={() => setActiveModule('combat')}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:bg-slate-800/50 hover:text-slate-100 transition-all w-full text-left"
                >
                    <Swords size={20} />
                    <span className="text-sm font-medium">Encounters</span>
                </button>
                <button
                    onClick={() => setCurrentView('npc-gallery')}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg group w-full text-left transition-all ${currentView === 'npc-gallery' ? 'bg-gm-gold/10 text-gm-gold' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-100'}`}
                >
                    <Users size={20} />
                    <span className="text-sm font-medium">Galerie PNJ</span>
                </button>
                <button
                    onClick={() => setCurrentView('world-atlas')}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg group w-full text-left transition-all ${currentView === 'world-atlas' ? 'bg-gm-gold/10 text-gm-gold' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-100'}`}
                >
                    <MapIcon size={20} />
                    <span className="text-sm font-medium">World Atlas</span>
                </button>
                <button
                    onClick={() => setActiveModule('table')}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:bg-slate-800/50 hover:text-slate-100 transition-all w-full text-left"
                >
                    <Archive size={20} />
                    <span className="text-sm font-medium">Loot Tables</span>
                </button>
                <button
                    onClick={() => setCurrentView('templates')}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg group w-full text-left transition-all ${currentView === 'templates' ? 'bg-gm-gold/10 text-gm-gold' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-100'}`}
                >
                    <FileText size={20} />
                    <span className="text-sm font-medium">Fiches de Jeu</span>
                </button>

                <div className="pt-4 mt-2 border-t border-slate-800/50">
                    <button
                        onClick={() => setCurrentView('library')}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg group w-full text-left transition-all ${currentView === 'library' ? 'bg-gm-gold/10 text-gm-gold' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-100'}`}
                    >
                        <Library size={20} className={currentView === 'library' ? 'text-gm-gold' : 'text-slate-500'} />
                        <span className="text-sm font-medium font-bold uppercase tracking-tighter">Campaign Library</span>
                    </button>
                </div>
            </nav>

            {/* Checklist Section */}
            {activeSession && (
                <div className="flex flex-col gap-3">
                    <p className="text-slate-500 text-xs uppercase tracking-widest mb-1 px-3">Session Prep</p>
                    <div className="flex flex-col gap-1 px-1">
                        {activeSession.checklist.map(item => (
                            <label key={item.id} className="flex items-center gap-3 p-2 hover:bg-slate-800/30 rounded-lg cursor-pointer group transition-colors">
                                <input
                                    type="checkbox"
                                    checked={item.isCompleted}
                                    onChange={() => useSessionOSStore.getState().toggleChecklistItem(activeSession.id, item.id)}
                                    className="rounded border-slate-700 bg-slate-800 text-gm-gold focus:ring-gm-gold focus:ring-offset-slate-900 h-4 w-4"
                                />
                                <span className={`text-sm group-hover:text-slate-100 ${item.isCompleted ? 'text-slate-500 line-through' : 'text-slate-300'}`}>
                                    {item.text}
                                </span>
                            </label>
                        ))}
                    </div>
                </div>
            )}

            {/* New Encounter Button */}
            <div className="mt-auto">
                <button
                    onClick={() => setActiveModule('combat')}
                    className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-100 py-3 rounded-xl text-sm font-bold transition-all"
                >
                    <PlusCircle className="text-gm-gold" size={20} />
                    New Encounter
                </button>
            </div>
        </aside>
    );
};

export default CampaignCockpit;
