import React, { useState } from 'react';
import { Users, Sparkles } from 'lucide-react';
import CampaignCockpit from './components/CampaignCockpit';
import SessionWorkspace from './components/SessionWorkspace';
import ModuleSnapshots from './components/ModuleSnapshots';
import SessionSnapshotModal from './components/SessionSnapshotModal';
import CampaignDetails from './components/CampaignDetails';
import CampaignLibrary from './components/CampaignLibrary';
import PlayerManagement from './components/PlayerManagement';
import WorldAtlas from './components/WorldAtlas';
import NpcManagement from './components/NpcManagement';
import SessionPrep from './components/SessionPrep';
import SessionFocusEditor from './components/SessionFocusEditor';
import OraclePanel from './components/OraclePanel';
import TimelineWikiDashboard from './components/TimelineWikiDashboard';
import ForgeDashboard from '../forge/components/ForgeDashboard';
import TemplateDashboard from './components/TemplateDashboard';
import SheetTemplateEditor from './components/SheetTemplateEditor';
import RuleEngineEditor from './components/RuleEngineEditor';
import { useSessionOSStore } from './useSessionOSStore';
import { DEFAULT_SHEET_TEMPLATES } from '../../data/defaultSheetTemplates';

const SessionDashboard: React.FC = () => {
    const { currentView, activeCampaignId, campaigns, setCurrentView, selectedEntityId, customSheetTemplates } = useSessionOSStore();
    const [isOracleOpen, setIsOracleOpen] = useState(false);
    const [isSnapshotModalOpen, setIsSnapshotModalOpen] = useState(false);

    const activeCampaign = campaigns.find(c => c.id === activeCampaignId);
    
    // Find system default NotebookLM
    const allTemplates = [...DEFAULT_SHEET_TEMPLATES, ...customSheetTemplates];
    const activeTemplate = allTemplates.find(t => t.id === activeCampaign?.system);
    const templateNotebookUrl = activeTemplate?.defaultNotebookUrl;

    return (
        <div className="flex-1 h-[calc(100vh-64px)] overflow-hidden flex flex-col bg-app-bg text-app-text font-display">
            {/* Top Navigation Bar - Contextual Header for Session OS */}
            <header className="flex items-center justify-between h-16 border-b border-app-border bg-app-surface/90 backdrop-blur-md px-6 z-50">
                <div className="flex items-center gap-8">
                    <div className="flex items-center gap-3 text-gm-gold">
                        <Users size={28} />
                        <h1 className="text-app-text text-lg font-bold tracking-tight">
                            Session OS <span className="text-gm-gold font-light opacity-80">
                                {currentView === 'cockpit' ? 'Master Cockpit' : currentView === 'timeline-wiki' ? 'Chroniques' : currentView === 'forge' ? 'System Forge' : currentView === 'templates' ? 'Bibliothèque des Fiches' : currentView.replace('-', ' ')}
                            </span>
                        </h1>
                    </div>
                </div>

                <div className="flex gap-3">
                    {currentView !== 'cockpit' && (
                        <button
                            onClick={() => setCurrentView('cockpit')}
                            className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-bold bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10 hover:text-white transition-all shadow-lg"
                        >
                            <Sparkles size={18} className="rotate-[-45deg]" />
                            Retour Cockpit
                        </button>
                    )}
                    <button
                        onClick={() => setIsOracleOpen(!isOracleOpen)}
                        className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-bold transition-all border ${isOracleOpen ? 'bg-accent text-white border-accent shadow-glow-accent' : 'bg-app-surface text-accent border-app-border hover:bg-app-surface/80 hover:border-app-border/60'}`}
                        title="Consult the AI Oracle"
                    >
                        <Sparkles size={18} className={isOracleOpen ? 'animate-pulse' : ''} />
                        Oracle
                    </button>
                    <button
                        onClick={() => setIsSnapshotModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all"
                        title="Capturer l'état actuel"
                    >
                        <Sparkles size={18} />
                        Snapshot
                    </button>

                </div>
            </header>

            {/* Main Content Grid */}
            <main className="grid grid-cols-1 md:grid-cols-12 flex-1 overflow-hidden">
                {currentView === 'library' ? (
                    <div className="col-span-12 overflow-hidden flex flex-col">
                        <CampaignLibrary />
                    </div>
                ) : currentView === 'world-atlas' ? (
                    <div className="col-span-12 overflow-hidden flex h-full">
                        <WorldAtlas />
                    </div>
                ) : currentView === 'npc-gallery' ? (
                    <div className="col-span-12 overflow-hidden flex h-full">
                        {!selectedEntityId && <CampaignCockpit />}
                        <NpcManagement />
                    </div>
                ) : currentView === 'players' ? (
                    <div className="col-span-12 overflow-hidden flex h-full">
                        <PlayerManagement />
                    </div>
                ) : currentView === 'session-prep' || currentView === 'session-focus' ? (
                    <div className="col-span-12 overflow-hidden flex h-full">
                        {currentView === 'session-prep' ? <SessionPrep /> : <SessionFocusEditor />}
                    </div>
                ) : currentView === 'forge' ? (
                    <div className="col-span-12 overflow-hidden flex h-full p-8 scrollbar-hide">
                        <ForgeDashboard />
                    </div>
                ) : currentView === 'templates' ? (
                    <div className="col-span-12 overflow-hidden flex h-full">
                        <TemplateDashboard />
                    </div>
                ) : currentView === 'template-editor' ? (
                    <div className="col-span-12 overflow-hidden flex h-full">
                        <SheetTemplateEditor />
                    </div>
                ) : currentView === 'driver-editor' ? (
                    <div className="col-span-12 overflow-hidden flex h-full">
                        <RuleEngineEditor />
                    </div>
                ) : (
                    <>
                        <CampaignCockpit />
                        <div className="col-span-9 overflow-hidden flex flex-col">
                            {currentView === 'cockpit' ? (
                                <div className="flex-1 grid grid-cols-9 overflow-hidden">
                                    <div className="col-span-6 overflow-hidden flex flex-col">
                                        <SessionWorkspace />
                                    </div>
                                    <div className="col-span-3 overflow-hidden flex flex-col">
                                        <ModuleSnapshots />
                                    </div>
                                </div>
                            ) : currentView === 'campaign-details' ? (
                                <CampaignDetails />
                            ) : currentView === 'timeline-wiki' ? (
                                <TimelineWikiDashboard />
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center p-20 bg-app-bg/20">
                                    <div className="w-16 h-16 rounded-full bg-app-surface flex items-center justify-center mb-4 opacity-50">
                                        <Sparkles className="animate-spin-slow text-app-text/40" />
                                    </div>
                                    <h2 className="text-xl font-bold text-app-text/60">View "{currentView}" under construction</h2>
                                    <p className="text-app-text/40 text-sm mb-6 font-medium">This section will be available in the next system update.</p>
                                    <button
                                        onClick={() => setCurrentView('cockpit')}
                                        className="px-6 py-2 bg-app-surface hover:bg-app-surface/80 text-app-text/80 rounded-lg text-sm font-bold transition-all border border-app-border"
                                    >
                                        RETURN TO COCKPIT
                                    </button>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </main>

            <OraclePanel 
                isOpen={isOracleOpen} 
                onClose={() => setIsOracleOpen(false)} 
                campaignNotebookUrl={activeCampaign?.notebookUrl}
                templateNotebookUrl={templateNotebookUrl}
            />

            {isSnapshotModalOpen && (
                <SessionSnapshotModal onClose={() => setIsSnapshotModalOpen(false)} />
            )}
        </div>
    );
};

export default SessionDashboard;
