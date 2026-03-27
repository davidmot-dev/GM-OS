import React from 'react';
import { useSessionOSStore } from '../useSessionOSStore';
import { useSessionStore } from '../../../store/useSessionStore';
import { useModalStore } from '../../../stores/useModalStore';
import { BookOpen, LayoutDashboard, Swords, Users, Users2, Map as MapIcon, Archive, PlusCircle, Library, FileText, ExternalLink, File, StickyNote, Play, RefreshCw, Eye, Hammer, Zap } from 'lucide-react';
import SessionChecklist from './SessionChecklist';

const CampaignCockpit: React.FC = () => {
    const { campaigns, activeCampaignId, sessions, setCurrentView, currentView, updateSession, applySystemSnapshot } = useSessionOSStore();
    const { setActiveModule } = useSessionStore();
    const { showCustom, showConfirm } = useModalStore();

    const activeCampaign = campaigns.find(c => c.id === activeCampaignId);

    // Find active session for progress (mock logic for now)
    const activeSession = activeCampaign ? sessions.find(s => s.id === activeCampaign.activeSessionId && s.status === 'active') : null;
    const sessionCount = sessions.filter(s => s.campaignId === activeCampaignId).length;

    return (
        <aside className="col-span-3 premium-glass border-r-0 p-5 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
            <div className="absolute inset-y-0 right-0 w-[1px] bg-gradient-to-b from-transparent via-white/5 to-transparent pointer-events-none" />
            {/* Campaign Card */}
            <div
                onClick={() => setCurrentView('campaign-details')}
                className="bg-white/5 rounded-xl p-4 border-l-4 border-gm-gold shadow-[0_0_20px_rgba(212,175,55,0.1)] cursor-pointer hover:bg-white/10 hover:shadow-[0_0_25px_rgba(212,175,55,0.2)] transition-all group relative overflow-hidden"
            >
                <div className="absolute inset-0 bg-gradient-to-br from-gm-gold/5 to-transparent pointer-events-none" />
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <h3 className="text-app-text font-bold text-lg group-hover:text-accent transition-colors">{activeCampaign?.name || 'Aucune Campagne Active'}</h3>
                        <p className="text-app-text/60 text-xs uppercase tracking-widest font-semibold font-display">Campagne Active</p>
                    </div>
                    <BookOpen className="text-accent group-hover:scale-110 transition-transform" size={24} />
                </div>
                <div className="mt-4 flex flex-col gap-2">
                    <div className="flex justify-between text-xs text-app-text/40">
                        <span>Progression de la Session</span>
                        <span>Étape {activeSession?.number || 0}/{sessionCount || 0}</span>
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
                <p className="text-app-text/40 text-xs uppercase tracking-widest mb-2 px-3">Gestion</p>
                <button
                    onClick={() => setCurrentView('cockpit')}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg group w-full text-left transition-all nav-item-glow ${currentView === 'cockpit' ? 'bg-accent/10 text-accent border border-accent/20' : 'text-app-text/60 hover:bg-white/5 hover:text-app-text'}`}
                >
                    <LayoutDashboard className={currentView === 'cockpit' ? 'scale-110 shadow-glow-accent' : 'group-hover:scale-110 transition-transform'} size={20} />
                    <span className="text-sm font-bold tracking-tight">Cockpit</span>
                </button>
                <button
                    onClick={() => setActiveModule('combat')}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-app-text/80 hover:bg-app-surface hover:text-app-text transition-all w-full text-left"
                >
                    <Swords size={20} />
                    <span className="text-sm font-medium">Rencontres</span>
                </button>
                <button
                    onClick={() => setCurrentView('storyboard')}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg group w-full text-left transition-all nav-item-glow ${currentView === 'storyboard' ? 'bg-accent/10 text-accent border border-accent/20' : 'text-app-text/60 hover:bg-white/5 hover:text-app-text'}`}
                >
                    <Zap className={currentView === 'storyboard' ? 'text-accent scale-110 shadow-glow-accent' : 'group-hover:scale-110 transition-transform'} size={20} />
                    <span className="text-sm font-bold tracking-tight">Master Storyboard</span>
                </button>
                <button
                    onClick={() => setCurrentView('npc-gallery')}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg group w-full text-left transition-all ${currentView === 'npc-gallery' ? 'bg-accent/10 text-accent' : 'text-app-text/80 hover:bg-app-bg hover:text-app-text'}`}
                >
                    <Users size={20} />
                    <span className="text-sm font-medium">Galerie PNJ</span>
                </button>
                <button
                    onClick={() => setCurrentView('social-graph')}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg group w-full text-left transition-all ${currentView === 'social-graph' ? 'bg-accent/10 text-accent' : 'text-app-text/80 hover:bg-app-bg hover:text-app-text'}`}
                >
                    <Users size={20} className={currentView === 'social-graph' ? 'text-accent' : 'text-app-text/60'} />
                    <span className="text-sm font-medium">Graphe Social</span>
                </button>
                <button
                    onClick={() => setCurrentView('world-atlas')}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg group w-full text-left transition-all ${currentView === 'world-atlas' ? 'bg-accent/10 text-accent' : 'text-app-text/80 hover:bg-app-bg hover:text-app-text'}`}
                >
                    <MapIcon size={20} />
                    <span className="text-sm font-medium">Atlas du Monde</span>
                </button>
                <button
                    onClick={() => setActiveModule('table')}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-app-text/80 hover:bg-app-surface hover:text-app-text transition-all w-full text-left"
                >
                    <Archive size={20} />
                    <span className="text-sm font-medium">Tables de Butin</span>
                </button>
                <button
                    onClick={() => setCurrentView('session-prep')}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg group w-full text-left transition-all ${currentView === 'session-prep' ? 'bg-accent/10 text-accent' : 'text-app-text/80 hover:bg-app-bg hover:text-app-text'}`}
                >
                    <PlusCircle size={20} className={currentView === 'session-prep' ? 'text-accent' : 'text-app-text/60'} />
                    <span className="text-sm font-medium">Préparation de Session</span>
                </button>
                <button
                    onClick={() => setCurrentView('forge')}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg group w-full text-left transition-all ${currentView === 'forge' ? 'bg-accent/10 text-accent' : 'text-app-text/80 hover:bg-app-bg hover:text-app-text'}`}
                >
                    <Hammer size={20} className={currentView === 'forge' ? 'text-accent' : 'text-app-text/60'} />
                    <span className="text-sm font-medium">System Forge</span>
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

                        {activeSession.moduleSnapshot && (
                            <div className="flex flex-col gap-1 mt-1">
                                <button
                                    onClick={() => showConfirm(
                                        'Voulez-vous restaurer l\'état complet de GM-OS à partir de ce snapshot ?',
                                        () => applySystemSnapshot(activeSession.moduleSnapshot!),
                                        undefined,
                                        'OUI, RESTAURER',
                                        'ANNULER'
                                    )}
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg group w-full text-left transition-all text-emerald-400 hover:bg-emerald-500/10 border border-emerald-500/10"
                                    title="Appliquer la configuration sauvegardée"
                                >
                                    <RefreshCw size={20} className="group-hover:rotate-180 transition-transform duration-500" />
                                    <span className="text-sm font-bold uppercase tracking-tighter flex-1">Restaurer État</span>
                                </button>
                                <button
                                    onClick={() => showCustom('snapshot-viewer', { snapshot: activeSession.moduleSnapshot, sessionName: `Session #${activeSession.number}` })}
                                    className="flex items-center gap-3 px-3 py-1.5 rounded-lg group w-full text-left transition-all text-emerald-400/60 hover:text-emerald-400 hover:bg-emerald-500/5 text-[10px]"
                                >
                                    <Eye size={14} />
                                    <span className="font-bold uppercase tracking-widest">Voir le contenu</span>
                                </button>
                            </div>
                        )}
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
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg group w-full text-left transition-all ${currentView === 'library' ? 'bg-accent/10 text-accent' : 'text-app-text/80 hover:bg-app-bg hover:text-app-text'}`}
                    >
                        <Library size={20} className={currentView === 'library' ? 'text-accent' : 'text-app-text/60'} />
                        <span className="text-sm font-bold uppercase tracking-tighter">Bibliothèque</span>
                    </button>
                    <button
                        onClick={() => setCurrentView('players')}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg group w-full text-left transition-all ${currentView === 'players' ? 'bg-accent/10 text-accent' : 'text-app-text/80 hover:bg-app-bg hover:text-app-text'}`}
                    >
                        <Users2 size={20} className={currentView === 'players' ? 'text-accent' : 'text-app-text/60'} />
                        <span className="text-sm font-bold uppercase tracking-tighter text-left">Joueurs</span>
                    </button>
                    <button
                        onClick={() => setCurrentView('templates')}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg group w-full text-left transition-all ${currentView === 'templates' ? 'bg-accent/10 text-accent' : 'text-app-text/80 hover:bg-app-bg hover:text-app-text'}`}
                    >
                        <FileText size={20} className={currentView === 'templates' ? 'text-accent' : 'text-app-text/60'} />
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
                                className="flex items-center gap-3 px-3 py-2 rounded-lg bg-cyan-500/5 border border-cyan-500/10 text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-500/30 transition-all group"
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
