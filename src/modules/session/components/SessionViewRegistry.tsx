import React from 'react';
import CampaignCockpit from './CampaignCockpit';
import SessionWorkspace from './SessionWorkspace';
import ModuleSnapshots from './ModuleSnapshots';
import CampaignDetails from './CampaignDetails';
import CampaignLibrary from './CampaignLibrary';
import PlayerManagement from './PlayerManagement';
import WorldAtlas from './WorldAtlas';
import NpcManagement from './NpcManagement';
import SessionPrep from './SessionPrep';
import SessionFocusEditor from './SessionFocusEditor';
import TimelineWikiDashboard from './TimelineWikiDashboard';
import ForgeDashboard from '../../forge/components/ForgeDashboard';
import TemplateDashboard from './TemplateDashboard';
import SheetTemplateEditor from './SheetTemplateEditor';
import RuleEngineEditor from './RuleEngineEditor';
import StoryboardDashboard from '../../storyboard/StoryboardDashboard';
import SocialGraph from './SocialGraph';
import CampaignForm from './CampaignForm';
import { useSessionOSStore } from '../useSessionOSStore';
import { Sparkles } from 'lucide-react';

interface SessionViewRegistryProps {
    forgeMode: 'system' | 'chronicle';
}

const SessionViewRegistry: React.FC<SessionViewRegistryProps> = ({ forgeMode }) => {
    const { currentView, setCurrentView } = useSessionOSStore();

    // Determine if the current view should take full width or be split with the cockpit
    const isFullLayout = !['cockpit', 'campaign-details', 'campaign-editor', 'timeline-wiki', 'npc-gallery'].includes(currentView);

    // Rendu du contenu de la vue
    const renderViewContent = () => {
        switch (currentView) {
            case 'library':
                return <CampaignLibrary />;
            case 'world-atlas':
                return <WorldAtlas />;
            case 'players':
                return <PlayerManagement />;
            case 'session-prep':
                return <SessionPrep />;
            case 'session-focus':
                return <SessionFocusEditor />;
            case 'forge':
                return <div className="p-8 h-full overflow-hidden"><ForgeDashboard mode={forgeMode} /></div>;
            case 'social-graph':
                return <SocialGraph />;
            case 'templates':
                return <TemplateDashboard />;
            case 'template-editor':
                return <SheetTemplateEditor />;
            case 'driver-editor':
                return <RuleEngineEditor />;
            case 'storyboard':
                return <StoryboardDashboard />;
            
            // --- VUES AVEC COCKPIT (Split Layout) ---
            case 'cockpit':
                return (
                    <div className="flex-1 grid grid-cols-9 h-full overflow-hidden">
                        <div className="col-span-6 h-full flex flex-col overflow-hidden border-r border-white/5">
                            <SessionWorkspace />
                        </div>
                        <div className="col-span-3 h-full flex flex-col overflow-hidden">
                            <ModuleSnapshots />
                        </div>
                    </div>
                );
            case 'campaign-details':
                return <CampaignDetails />;
            case 'campaign-editor':
                return <CampaignForm onClose={() => setCurrentView('campaign-details')} />;
            case 'timeline-wiki':
                return <TimelineWikiDashboard />;

            case 'npc-gallery':
                // Spécifique : NpcManagement gère son propre layout interne si sélectionné
                return <NpcManagement />;

            default:
                return (
                    <div className="flex-1 flex flex-col items-center justify-center p-20 bg-app-bg/20">
                        <div className="w-16 h-16 rounded-full bg-app-surface flex items-center justify-center mb-4 opacity-50">
                            <Sparkles className="animate-spin-slow text-app-text/40" />
                        </div>
                        <h2 className="text-xl font-bold text-app-text/60 font-display">Vue "{currentView}" en construction</h2>
                        <p className="text-app-text/40 text-sm mb-6 font-medium">Cette section sera disponible prochainement.</p>
                        <button
                            onClick={() => setCurrentView('cockpit')}
                            className="px-6 py-2 bg-app-surface hover:bg-app-surface/80 text-app-text/80 rounded-lg text-sm font-bold transition-all border border-app-border"
                        >
                            RETOUR AU COCKPIT
                        </button>
                    </div>
                );
        }
    };

    return (
        <main className="flex-1 flex overflow-hidden bg-app-bg/40">
            {/* L'utilisation de 'key' ici force React à re-monter le conteneur et déclencher l'animation CSS */}
            <div 
                key={currentView} 
                className={`flex-1 flex overflow-hidden view-transition-fade-up ${isFullLayout ? 'flex-col' : 'flex-row'}`}
            >
                {!isFullLayout && (
                    <aside className="w-[320px] h-full shrink-0 border-r border-white/5 bg-black/10 backdrop-blur-sm z-10 shadow-xl">
                        <CampaignCockpit />
                    </aside>
                )}
                
                <section className="flex-1 h-full overflow-hidden relative">
                    {renderViewContent()}
                </section>
            </div>
        </main>
    );
};

export default SessionViewRegistry;
