import React, { useState } from 'react';
import SessionHeader from './components/SessionHeader';
import SessionViewRegistry from './components/SessionViewRegistry';
import OraclePanel from './components/OraclePanel';
import SessionSnapshotModal from './components/SessionSnapshotModal';
import RemoteNotificationCenter from './components/RemoteNotificationCenter';
import PanneauDesRessources from '../table/PanneauDesRessources';
import { useSessionOSStore } from './useSessionOSStore';
import { useSessionStore } from '../../store/useSessionStore';
import { DEFAULT_SHEET_TEMPLATES } from '../../data/defaultSheetTemplates';
import { DEFAULT_GAME_DRIVERS } from '../../data/defaultGameDrivers';

/**
 * SessionDashboard - Point d'entrée principal de l'OS de Session.
 * Architecture modulaire (Phase 8) utilisant le Registry Pattern pour les vues.
 */
const SessionDashboard: React.FC = () => {
    const {
        activeCampaignId,
        campaigns,
        customSheetTemplates,
        customGameDrivers,
        isHeaderHidden,
        currentView,
        setCurrentView
    } = useSessionOSStore();
    const setActiveModule = useSessionStore(s => s.setActiveModule);

    const [isOracleOpen, setIsOracleOpen] = useState(false);
    const [isSnapshotModalOpen, setIsSnapshotModalOpen] = useState(false);

    /**
     * La Forge a quitté Session OS pour son propre module.
     *
     * `currentView` est persisté : une disposition enregistrée avant ce
     * déplacement désigne encore `'forge'`, et sans ce réaiguillage elle
     * ouvrirait une vue qui n'existe plus. On y envoie donc au module, et on
     * repose la vue de session sur le cockpit — pour qu'un retour ici ne
     * rebondisse pas indéfiniment vers la Forge.
     */
    React.useEffect(() => {
        if (currentView !== 'forge') return;
        setCurrentView('cockpit');
        setActiveModule('forge');
    }, [currentView, setCurrentView, setActiveModule]);

    // Résolution contextuelle réactive (Phase 8 Logic)
    const { activeCampaign, activeDriver, activeTemplate } = React.useMemo(() => {
        const camp = campaigns.find(c => c.id === activeCampaignId);
        const driver = [...DEFAULT_GAME_DRIVERS, ...customGameDrivers].find(d => d.id === camp?.system);
        const template = [...DEFAULT_SHEET_TEMPLATES, ...customSheetTemplates].find(t => t.id === camp?.system);
        
        return { activeCampaign: camp, activeDriver: driver, activeTemplate: template };
    }, [activeCampaignId, campaigns, customGameDrivers, customSheetTemplates]);

    const driverNotebookUrl = activeDriver?.defaultNotebookUrl;
    const templateNotebookUrl = activeTemplate?.defaultNotebookUrl;

    return (
        <div className={`flex-1 ${isHeaderHidden ? 'h-screen' : 'h-[calc(100vh-64px)]'} overflow-hidden flex flex-col bg-app-bg text-app-text font-display transition-all duration-500`}>
            {/* Header modulaire (Navigation & Utilitaires) */}
            {!isHeaderHidden && (
                <SessionHeader
                    isOracleOpen={isOracleOpen}
                    setIsOracleOpen={setIsOracleOpen}
                    setIsSnapshotModalOpen={setIsSnapshotModalOpen}
                />
            )}

            {/*
                Les réserves de la table — l'Impulsion des joueurs, la Menace du
                meneur. Bande permanente parce qu'elles changent à presque
                chaque test : une réserve qu'il faut aller chercher n'est pas
                tenue à jour, et une réserve fausse se lit comme une information.

                Elle n'apparaît que si le pilote en déclare. Un système sans
                monnaie de table garde son écran tel quel.
            */}
            {activeCampaignId && (activeDriver?.ressourcesDeTable?.length ?? 0) > 0 && (
                <PanneauDesRessources
                    campaignId={activeCampaignId}
                    ressources={activeDriver!.ressourcesDeTable!}
                />
            )}

            {/* Registre de Vues (Contenu principal dynamique) */}
            <SessionViewRegistry />

            {/* Overlays & Panneaux persistants */}
            <OraclePanel 
                isOpen={isOracleOpen} 
                onClose={() => setIsOracleOpen(false)} 
                campaignNotebookUrl={activeCampaign?.notebookUrl}
                templateNotebookUrl={templateNotebookUrl}
                driverNotebookUrl={driverNotebookUrl}
            />

            {isSnapshotModalOpen && (
                <SessionSnapshotModal onClose={() => setIsSnapshotModalOpen(false)} />
            )}

            {/* Notifications Distantes (Tablet HUB Sync) */}
            <RemoteNotificationCenter />
        </div>
    );
};

export default SessionDashboard;
