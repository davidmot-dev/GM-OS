import React, { useState } from 'react';
import SessionHeader from './components/SessionHeader';
import SessionViewRegistry from './components/SessionViewRegistry';
import OraclePanel from './components/OraclePanel';
import SessionSnapshotModal from './components/SessionSnapshotModal';
import { useSessionOSStore } from './useSessionOSStore';
import { DEFAULT_SHEET_TEMPLATES } from '../../data/defaultSheetTemplates';

/**
 * SessionDashboard - Point d'entrée principal de l'OS de Session.
 * Architecture modulaire (Phase 8) utilisant le Registry Pattern pour les vues.
 */
const SessionDashboard: React.FC = () => {
    const { 
        activeCampaignId, 
        campaigns, 
        customSheetTemplates 
    } = useSessionOSStore();

    const [isOracleOpen, setIsOracleOpen] = useState(false);
    const [isSnapshotModalOpen, setIsSnapshotModalOpen] = useState(false);
    const [forgeMode, setForgeMode] = useState<'system' | 'chronicle'>('system');

    // Résolution contextuelle de la campagne active
    const activeCampaign = campaigns.find(c => c.id === activeCampaignId);
    
    // Résolution des URLs de NotebookLM pour l'Oracle
    const allTemplates = [...DEFAULT_SHEET_TEMPLATES, ...customSheetTemplates];
    const activeTemplate = allTemplates.find(t => t.id === activeCampaign?.system);
    const templateNotebookUrl = activeTemplate?.defaultNotebookUrl;

    return (
        <div className="flex-1 h-[calc(100vh-64px)] overflow-hidden flex flex-col bg-app-bg text-app-text font-display">
            {/* Header modulaire (Navigation & Utilitaires) */}
            <SessionHeader 
                isOracleOpen={isOracleOpen}
                setIsOracleOpen={setIsOracleOpen}
                setIsSnapshotModalOpen={setIsSnapshotModalOpen}
                forgeMode={forgeMode}
                setForgeMode={setForgeMode}
            />

            {/* Registre de Vues (Contenu principal dynamique) */}
            <SessionViewRegistry forgeMode={forgeMode} />

            {/* Overlays & Panneaux persistants */}
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
