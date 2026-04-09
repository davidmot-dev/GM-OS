import { useEffect, useRef } from 'react';
import { useSessionStore } from '../../../store/useSessionStore';
import { useSessionOSStore, type LayoutConfig } from '../useSessionOSStore';
import { useTacticalAIStore } from '../../tactical-ai/useTacticalAIStore';

/**
 * Hook responsable de la synchronisation du layout (module actif, panels, thèmes)
 * avec la campagne active. Gère la restauration et l'auto-save.
 */
export function useLayoutManager() {
    const {
        activeModule,
        setActiveModule,
        isAIPanelOpen,
        toggleAIPanel,
        theme,
        setTheme,
        themeColor,
        setThemeColor,
        displayCount
    } = useSessionStore();

    const {
        isPanelOpen: isTacticalPanelOpen,
        setIsPanelOpen: setTacticalPanelOpen
    } = useTacticalAIStore();

    const {
        activeCampaignId,
        campaigns,
        updateCampaignLayout
    } = useSessionOSStore();

    const isRestoring = useRef(false);
    const lastRestoredCampaignId = useRef<string | null>(null);
    const activeCampaign = campaigns.find(c => c.id === activeCampaignId);

    // 1. Restauration au changement de campagne
    useEffect(() => {
        // Restauration UNIQUEMENT si l'ID de campagne a changé
        if (!activeCampaignId || !activeCampaign?.layoutConfig || lastRestoredCampaignId.current === activeCampaignId) return;

        isRestoring.current = true;
        lastRestoredCampaignId.current = activeCampaignId;
        const config = activeCampaign.layoutConfig;

        // On applique les réglages mémorisés si nécessaire
        if (config.activeModule !== activeModule) setActiveModule(config.activeModule);
        if (config.theme !== theme) setTheme(config.theme);
        if (config.themeColor !== themeColor) setThemeColor(config.themeColor);
        
        // Panels
        if (config.isAIPanelOpen !== isAIPanelOpen) toggleAIPanel(config.isAIPanelOpen);
        if (config.isTacticalPanelOpen !== isTacticalPanelOpen) setTacticalPanelOpen(config.isTacticalPanelOpen);

        // Délai de précaution avant de réactiver le save
        const timer = setTimeout(() => {
            isRestoring.current = false;
        }, 150);

        return () => clearTimeout(timer);
    }, [activeCampaignId, activeCampaign?.layoutConfig, setActiveModule, setTheme, setThemeColor, toggleAIPanel, setTacticalPanelOpen]); // eslint-disable-line react-hooks/exhaustive-deps

    // 2. Auto-save lors des changements de layout
    useEffect(() => {
        if (isRestoring.current || !activeCampaignId) return;

        const currentLayout: LayoutConfig = {
            activeModule,
            isAIPanelOpen,
            isTacticalPanelOpen,
            theme,
            themeColor
        };

        // On ne sauvegarde que si nécessaire pour éviter les spam de store persist
        const savedConfig = activeCampaign?.layoutConfig;
        const hasChanged = !savedConfig || 
            savedConfig.activeModule !== activeModule ||
            savedConfig.isAIPanelOpen !== isAIPanelOpen ||
            savedConfig.isTacticalPanelOpen !== isTacticalPanelOpen ||
            savedConfig.theme !== theme ||
            savedConfig.themeColor !== themeColor;

        if (hasChanged) {
            updateCampaignLayout(activeCampaignId, currentLayout);
        }
    }, [
        activeModule, 
        isAIPanelOpen, 
        isTacticalPanelOpen, 
        theme, 
        themeColor, 
        activeCampaignId, 
        updateCampaignLayout,
        activeCampaign?.layoutConfig
    ]);

    // 3. Workspace Sync v2: Gestion des conflits sur écran unique
    useEffect(() => {
        // Si on est sur un seul écran, on évite de saturer l'espace
        if (displayCount === 1) {
            if (isAIPanelOpen && isTacticalPanelOpen) {
                // Le panneau Tactical AI est prioritaire pour le jeu actif
                toggleAIPanel(false);
                gmToast("Auto-layout : Panneau IA fermé pour optimiser l'espace écran.", 'info');
            }
        }
    }, [displayCount, isAIPanelOpen, isTacticalPanelOpen, toggleAIPanel]);
}
