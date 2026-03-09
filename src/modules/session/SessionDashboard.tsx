import React, { useState } from 'react';
import { gmAlert } from '../../stores/useModalStore';
import { Users, Settings, Bell, Sparkles } from 'lucide-react';
import CampaignCockpit from './components/CampaignCockpit';
import SessionWorkspace from './components/SessionWorkspace';
import ModuleSnapshots from './components/ModuleSnapshots';
import CampaignDetails from './components/CampaignDetails';
import CampaignLibrary from './components/CampaignLibrary';
import PlayerManagement from './components/PlayerManagement';
import WorldAtlas from './components/WorldAtlas';
import NpcManagement from './components/NpcManagement';
import TemplateManager from './components/TemplateManager';
import SessionPrep from './components/SessionPrep';
import SessionFocusEditor from './components/SessionFocusEditor';
import OraclePanel from './components/OraclePanel';
import { useSessionOSStore } from './useSessionOSStore';
import { DEFAULT_SHEET_TEMPLATES } from '../../data/defaultSheetTemplates';

const SessionDashboard: React.FC = () => {
    const { currentView, activeCampaignId, campaigns, setCurrentView, selectedEntityId, customSheetTemplates } = useSessionOSStore();
    const [isOracleOpen, setIsOracleOpen] = useState(false);

    const activeCampaign = campaigns.find(c => c.id === activeCampaignId);
    
    // Find system default NotebookLM
    const allTemplates = [...DEFAULT_SHEET_TEMPLATES, ...customSheetTemplates];
    const activeTemplate = allTemplates.find(t => t.id === activeCampaign?.system);
    const templateNotebookUrl = activeTemplate?.defaultNotebookUrl;

    return (
        <div className="flex-1 h-[calc(100vh-64px)] overflow-hidden flex flex-col bg-slate-950 text-slate-100 font-display">
            {/* Top Navigation Bar - Contextual Header for Session OS */}
            <header className="flex items-center justify-between h-16 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-6 z-50">
                <div className="flex items-center gap-8">
                    <div className="flex items-center gap-3 text-gm-gold">
                        <Users size={28} />
                        <h1 className="text-slate-100 text-lg font-bold tracking-tight">
                            Session OS <span className="text-gm-gold font-light">
                                {currentView === 'cockpit' ? 'Master Cockpit' : currentView.replace('-', ' ')}
                            </span>
                        </h1>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={() => setIsOracleOpen(!isOracleOpen)}
                        className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-bold transition-all border ${isOracleOpen ? 'bg-gm-gold text-slate-900 border-gm-gold shadow-[0_0_15px_rgba(234,179,8,0.4)]' : 'bg-slate-800 text-gm-gold border-slate-700 hover:bg-slate-700'}`}
                        title="Consult the AI Oracle"
                    >
                        <Sparkles size={18} className={isOracleOpen ? 'animate-pulse' : ''} />
                        Oracle
                    </button>
                    <button
                        onClick={() => gmAlert('Le module de configuration globale sera bientôt disponible.')}
                        className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-all"
                    >
                        <Settings size={18} />
                    </button>
                    <button className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-all relative">
                        <Bell size={18} />
                        <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-slate-900"></span>
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
                ) : currentView === 'templates' ? (
                    <div className="col-span-12 overflow-hidden flex h-full">
                        <CampaignCockpit />
                        <div className="flex-1 overflow-hidden">
                            <TemplateManager />
                        </div>
                    </div>
                ) : currentView === 'session-prep' || currentView === 'session-focus' ? (
                    <div className="col-span-12 overflow-hidden flex h-full">
                        {currentView === 'session-prep' ? <SessionPrep /> : <SessionFocusEditor />}
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
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center p-20 bg-slate-900/20">
                                    <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4 opacity-50">
                                        <Settings className="animate-spin-slow text-slate-500" />
                                    </div>
                                    <h2 className="text-xl font-bold text-slate-400">View "{currentView}" under construction</h2>
                                    <p className="text-slate-600 text-sm mb-6">This section will be available in the next system update.</p>
                                    <button
                                        onClick={() => setCurrentView('cockpit')}
                                        className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-bold transition-all border border-slate-700"
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
        </div>
    );
};

export default SessionDashboard;
