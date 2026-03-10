import React from 'react';
import { useSessionOSStore } from '../useSessionOSStore';
import { useSessionStore } from '../../../store/useSessionStore';
import { useModalStore } from '../../../stores/useModalStore';
import { BookOpen, LayoutDashboard, Swords, Users, Users2, Map as MapIcon, Archive, PlusCircle, Library, FileText, ExternalLink, File, StickyNote, Play } from 'lucide-react';
import SessionChecklist from './SessionChecklist';

const CampaignCockpit: React.FC = () => {
    const { campaigns, activeCampaignId, sessions, setCurrentView, currentView, updateSession } = useSessionOSStore();
    const { setActiveModule } = useSessionStore();
    const { showCustom, showConfirm } = useModalStore();

    const activeCampaign = campaigns.find(c => c.id === activeCampaignId);

    // Find active session for progress (mock logic for now)
    const activeSession = activeCampaign ? sessions.find(s => s.id === activeCampaign.activeSessionId && s.status === 'active') : null;
    const sessionCount = sessions.filter(s => s.campaignId === activeCampaignId).length;

    return (
        <aside className="col-span-3 bg-app-surface/90 backdrop-blur-md border-r border-app-border p-5 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
            {/* Campaign Card */}
            <div
                onClick={() => setCurrentView('campaign-details')}
                className="bg-app-bg/40 rounded-lg p-4 border-l-4 border-accent shadow-glow-accent cursor-pointer hover:bg-app-bg/60 transition-all group"
            >
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <h3 className="text-white font-bold text-lg group-hover:text-accent transition-colors">{activeCampaign?.name || 'No Active Campaign'}</h3>
                        <p className="text-app-text/40 text-xs uppercase tracking-widest font-semibold font-display">Active Campaign</p>
                    </div>
                    <BookOpen className="text-accent group-hover:scale-110 transition-transform" size={24} />
                </div>
                <div className="mt-4 flex flex-col gap-2">
                    <div className="flex justify-between text-xs text-app-text/40">
                        <span>Session Progress</span>
                        <span>Stage {activeSession?.number || 0}/{sessionCount || 0}</span>
                    </div>
                    <div className="w-full bg-app-bg h-1.5 rounded-full overflow-hidden">
                        <div
                            className="bg-accent h-full shadow-glow-accent"
                            style={{ width: `${sessionCount ? ((activeSession?.number || 0) / sessionCount) * 100 : 0}%` }}
                        ></div>
                    </div>
                </div>
            </div>

            {/* Navigation Menu */}
            <nav className="flex flex-col gap-1">
                <p className="text-app-text/40 text-xs uppercase tracking-widest mb-2 px-3">Management</p>
                <button
                    onClick={() => setCurrentView('cockpit')}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg group w-full text-left transition-all ${currentView === 'cockpit' ? 'bg-accent/10 text-accent' : 'text-app-text/60 hover:bg-app-bg/50 hover:text-white'}`}
                >
                    <LayoutDashboard className={currentView === 'cockpit' ? 'scale-110' : 'group-hover:scale-110 transition-transform'} size={20} />
                    <span className="text-sm font-medium">Cockpit</span>
                </button>
                <button
                    onClick={() => setActiveModule('combat')}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-app-text/60 hover:bg-app-surface/50 hover:text-white transition-all w-full text-left"
                >
                    <Swords size={20} />
                    <span className="text-sm font-medium">Encounters</span>
                </button>
                <button
                    onClick={() => setCurrentView('npc-gallery')}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg group w-full text-left transition-all ${currentView === 'npc-gallery' ? 'bg-accent/10 text-accent' : 'text-app-text/60 hover:bg-app-bg/50 hover:text-white'}`}
                >
                    <Users size={20} />
                    <span className="text-sm font-medium">Galerie PNJ</span>
                </button>
                <button
                    onClick={() => setCurrentView('world-atlas')}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg group w-full text-left transition-all ${currentView === 'world-atlas' ? 'bg-accent/10 text-accent' : 'text-app-text/60 hover:bg-app-bg/50 hover:text-white'}`}
                >
                    <MapIcon size={20} />
                    <span className="text-sm font-medium">World Atlas</span>
                </button>
                <button
                    onClick={() => setActiveModule('table')}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-app-text/60 hover:bg-app-surface/50 hover:text-white transition-all w-full text-left"
                >
                    <Archive size={20} />
                    <span className="text-sm font-medium">Loot Tables</span>
                </button>
                <button
                    onClick={() => setCurrentView('session-prep')}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg group w-full text-left transition-all ${currentView === 'session-prep' ? 'bg-accent/10 text-accent' : 'text-app-text/60 hover:bg-app-bg/50 hover:text-white'}`}
                >
                    <PlusCircle size={20} className={currentView === 'session-prep' ? 'text-accent' : 'text-app-text/40'} />
                    <span className="text-sm font-medium">Session Preparation</span>
                </button>

                {activeSession ? (
                    <div className="flex flex-col gap-1 mt-1">
                        <button
                            onClick={() => showConfirm(
                                'La session est-elle terminée ?',
                                () => updateSession(activeSession.id, { status: 'done' }),
                                undefined,
                                'OUI, TERMINER',
                                'NON, CONTINUER'
                            )}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg group w-full text-left transition-all bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/20"
                        >
                            <Play size={20} fill="currentColor" className="animate-pulse" />
                            <span className="text-sm font-bold uppercase tracking-tighter">Session Active</span>
                        </button>
                        
                        <button
                            onClick={() => showCustom('session-notes')}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg group w-full text-left transition-all text-app-text/60 hover:bg-accent/10 hover:text-accent"
                        >
                            <StickyNote size={20} className="text-accent/60 group-hover:text-accent transition-colors" />
                            <span className="text-sm font-bold uppercase tracking-tighter">Notes de Session</span>
                        </button>
                    </div>
                ) : (
                    sessions.some(s => s.campaignId === activeCampaignId && s.status === 'planned') && (
                        <button
                            onClick={() => showCustom('session-select')}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg group w-full text-left transition-all text-app-text/60 hover:bg-accent/10 hover:text-accent mt-1"
                        >
                            <Play size={20} className="text-accent/60 group-hover:text-accent transition-colors" />
                            <span className="text-sm font-bold uppercase tracking-tighter">Lancer Session</span>
                        </button>
                    )
                )}

                <div className="pt-4 mt-2 border-t border-app-border/40">
                    <button
                        onClick={() => setCurrentView('library')}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg group w-full text-left transition-all ${currentView === 'library' ? 'bg-accent/10 text-accent' : 'text-app-text/60 hover:bg-app-bg/50 hover:text-white'}`}
                    >
                        <Library size={20} className={currentView === 'library' ? 'text-accent' : 'text-app-text/40'} />
                        <span className="text-sm font-bold uppercase tracking-tighter">Campaign Library</span>
                    </button>
                    <button
                        onClick={() => setCurrentView('players')}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg group w-full text-left transition-all ${currentView === 'players' ? 'bg-accent/10 text-accent' : 'text-app-text/60 hover:bg-app-bg/50 hover:text-white'}`}
                    >
                        <Users2 size={20} className={currentView === 'players' ? 'text-accent' : 'text-app-text/40'} />
                        <span className="text-sm font-bold uppercase tracking-tighter text-left">Joueurs</span>
                    </button>
                    <button
                        onClick={() => setCurrentView('templates')}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg group w-full text-left transition-all ${currentView === 'templates' ? 'bg-accent/10 text-accent' : 'text-app-text/60 hover:bg-app-bg/50 hover:text-white'}`}
                    >
                        <FileText size={20} className={currentView === 'templates' ? 'text-accent' : 'text-app-text/40'} />
                        <span className="text-sm font-bold uppercase tracking-tighter text-left">Fiches de Jeu</span>
                    </button>
                </div>
            </nav>

            {/* Checklist Section */}
            {activeSession && (
                <SessionChecklist />
            )}

            {/* Session Resources Section */}
            {activeSession && (activeSession.externalLink || activeSession.filePath) && (
                <div className="flex flex-col gap-3 py-4 border-t border-app-border/40">
                    <p className="text-app-text/40 text-[10px] font-bold uppercase tracking-[0.2em] px-3 mb-1">Ressources Session</p>
                    <div className="flex flex-col gap-2 px-1">
                        {activeSession.externalLink && (
                            <a 
                                href={activeSession.externalLink} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 px-3 py-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-all group"
                            >
                                <ExternalLink size={16} className="group-hover:scale-110 transition-transform" />
                                <span className="text-xs font-bold truncate">Ouvrir le Lien HTTP</span>
                            </a>
                        )}
                        {activeSession.filePath && (
                            <button 
                                onClick={() => {
                                    if (window.appBridge?.openFile) {
                                        window.appBridge.openFile(activeSession.filePath!);
                                    } else {
                                        console.log('Opening file:', activeSession.filePath);
                                        alert(`File: ${activeSession.filePath}`);
                                    }
                                }}
                                className="flex items-center gap-3 px-3 py-2 rounded-lg bg-blue-500/5 border border-blue-500/10 text-blue-400 hover:bg-blue-500/10 hover:border-blue-500/30 transition-all group"
                            >
                                <File size={16} className="group-hover:scale-110 transition-transform" />
                                <span className="text-xs font-bold truncate">Accéder au Fichier</span>
                            </button>
                        )}
                    </div>
                </div>
            )}

        </aside>
    );
};

export default CampaignCockpit;
