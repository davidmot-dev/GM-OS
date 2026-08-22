import { useEffect, useRef } from 'react';
import { useSessionStore } from '../../../store/useSessionStore';
import { useSessionOSStore, type LayoutConfig } from '../useSessionOSStore';
import { useTacticalAIStore } from '../../tactical-ai/useTacticalAIStore';
import { gmToast } from '../../../stores/useToastStore';
import { momentDeJeu } from '../../ai/budgetsDeTemps';
import { vueConvientAu, vueDeRepli } from '../affiniteDesVues';

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
    /*
      **On restaure au changement de campagne ET au changement de moment —
      axe N.**

      La clé portait le seul identifiant de campagne : ouvrir une séance ne
      restaurait donc rien, et la disposition de l'atelier restait à l'écran
      toute la partie. *« On retrouve son atelier tel qu'on l'a laissé le samedi
      matin, et sa table telle qu'on l'a laissée le samedi soir »* — il fallait
      que le second terme déclenche quelque chose.
    */
    const lastRestoredCampaignId = useRef<string | null>(null);
    const activeCampaign = campaigns.find(c => c.id === activeCampaignId);

    const sessions = useSessionOSStore(e => e.sessions);
    const moment = momentDeJeu(sessions);
    const currentView = useSessionOSStore(e => e.currentView);
    const setCurrentView = useSessionOSStore(e => e.setCurrentView);

    /*
      **Faute de disposition de table, on part de celle de l'atelier.** Un régime
      qui démarre nu n'est pas un second régime, c'est une perte : le meneur
      ouvrirait sa séance sur un pupitre vide.
    */
    const configDuMoment = moment === 'partie'
        ? (activeCampaign?.layoutConfigPartie ?? activeCampaign?.layoutConfig)
        : activeCampaign?.layoutConfig;

    // 1. Restauration au changement de campagne ou de moment
    useEffect(() => {
        const clef = `${activeCampaignId}|${moment}`;
        if (!activeCampaignId || !configDuMoment || lastRestoredCampaignId.current === clef) return;

        isRestoring.current = true;
        lastRestoredCampaignId.current = clef;
        const config = configDuMoment;

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
    }, [activeCampaignId, moment, configDuMoment, setActiveModule, setTheme, setThemeColor, toggleAIPanel, setTacticalPanelOpen]); // eslint-disable-line react-hooks/exhaustive-deps

    /*
      **Un écran d'atelier n'a rien à faire devant soi quand la table attend —
      axe N, premier temps.**

      C'est la seule chose que le classement des vues sert VRAIMENT : *« ce qui
      change entre les deux régimes, ce sont les valeurs par défaut — en
      préparation on veut choisir, en séance on veut que ce soit déjà choisi. »*
      Ouvrir une séance depuis la Forge laissait la Forge à l'écran.

      **On rend la main au cockpit, on ne téléporte pas ailleurs.** Il convient
      aux deux moments et porte le bouton de séance : le meneur reprend d'où il
      décide, pas d'où on a décidé pour lui. Et rien ne se déclenche dans l'autre
      sens — quitter une séance ne chasse personne d'un écran de table, qui reste
      parfaitement lisible en préparation.
    */
    useEffect(() => {
        if (moment !== 'partie' || vueConvientAu(moment, currentView)) return;
        setCurrentView(vueDeRepli());
    }, [moment, currentView, setCurrentView]);

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

        /*
          **On compare à la disposition DU MOMENT, pas à celle de l'atelier.**
          Sinon, en partie, chaque réglage se mesurait à un casier qui n'est plus
          celui où l'on écrit : le premier changement partait toujours, et un
          retour à l'état de l'atelier ne partait jamais. *Lire ailleurs que là
          où l'on écrit est indétectable par construction* — c'est le défaut que
          `corpusSysteme` documente depuis le 10/08.
        */
        const savedConfig = configDuMoment;
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
        configDuMoment,
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
