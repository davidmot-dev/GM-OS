import { useState, useEffect } from 'react';
import { useSessionOSStore } from '../store/index';
import type { Campaign } from '../store/types';
import { gmToast } from '../../../stores/useToastStore';
import { personaGeneratorService } from '../../ai/PersonaGeneratorService';
import { DEFAULT_SHEET_TEMPLATES } from '../../../data/defaultSheetTemplates';
import { tousLesPilotes } from '../store/tousLesPilotes';
import { useGemStore } from '../../../stores/useGemStore';

export type CampaignSectionId = 'identity' | 'narrative' | 'clues' | 'ambience' | 'world' | 'intelligence' | 'npc';

interface UseCampaignEditorArgs {
    campaign?: Campaign | { campaignId: string };
    isNew?: boolean;
    onClose: () => void;
}

export function useCampaignEditor({ campaign, isNew, onClose }: UseCampaignEditorArgs) {
    const { 
        campaigns, activeCampaignId, atlasMaps, addCampaign, 
        updateCampaign, 
        activeCampaignFormSection: activeSection, 
        setActiveCampaignFormSection: setActiveSection,
        customSheetTemplates, customGameDrivers
    } = useSessionOSStore();
    
    // Identity logic
    const propCampaign = campaign && 'id' in campaign ? campaign as Campaign : 
                        (campaign && 'campaignId' in campaign ? campaigns.find(c => c.id === (campaign as { campaignId: string }).campaignId) : undefined);
    
    const fullCampaign = isNew ? undefined : (propCampaign || campaigns.find(c => c.id === activeCampaignId));

    const [name, setName] = useState(fullCampaign?.name || '');
    const [system, setSystem] = useState(fullCampaign?.system || 'generic');
    const [description, setDescription] = useState(fullCampaign?.description || '');
    const [synopsis, setSynopsis] = useState(fullCampaign?.synopsis || '');
    const [wallpaperUrl, setWallpaperUrl] = useState(fullCampaign?.wallpaperUrl || '');
    const [notebookUrl, setNotebookUrl] = useState(fullCampaign?.notebookUrl || '');
    const [systemPath, setSystemPath] = useState(fullCampaign?.systemPath || '');
    const [campaignPath, setCampaignPath] = useState(fullCampaign?.campaignPath || '');
    /*
      La langue dans laquelle la Forge écrit cette campagne. Vide = la langue de
      l'interface, ce qui reste le cas de toutes les campagnes existantes.
    */
    const [langueDeForge, setLangueDeForge] = useState(fullCampaign?.langueDeForge || '');
    const [obsidianPath, setObsidianPath] = useState(fullCampaign?.obsidianPath || '');
    const [activeLocationIds, setActiveLocationIds] = useState<string[]>(fullCampaign?.activeLocationIds || []);
    const [aiPersonas, setAiPersonas] = useState<Record<string, string>>(fullCampaign?.aiPersonas || {});
    
    const [isMediaBrowserOpen, setIsMediaBrowserOpen] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    
    const allTemplates = [...DEFAULT_SHEET_TEMPLATES, ...customSheetTemplates];
    // Le sélecteur de système montre chaque pilote une fois, et c'est le
    // personnalisé qui gagne — le même ordre d'autorité que `getGameDriver`.
    const allDrivers = tousLesPilotes(customGameDrivers);
    const { gems, syncGemsWithDefaults } = useGemStore();
    
    useEffect(() => {
        syncGemsWithDefaults();
    }, [syncGemsWithDefaults]);

    useEffect(() => {
        if (fullCampaign && !isNew) {
            setName(fullCampaign.name || '');
            setSystem(fullCampaign.system || 'generic');
            setDescription(fullCampaign.description || '');
            setSynopsis(fullCampaign.synopsis || '');
            setWallpaperUrl(fullCampaign.wallpaperUrl || '');
            setNotebookUrl(fullCampaign.notebookUrl || '');
            setSystemPath(fullCampaign.systemPath || '');
            setCampaignPath(fullCampaign.campaignPath || '');
            setObsidianPath(fullCampaign.obsidianPath || '');
            setActiveLocationIds(fullCampaign.activeLocationIds || []);
            setAiPersonas(fullCampaign.aiPersonas || {});
        }
    }, [fullCampaign, isNew]);

    const campaignMaps = atlasMaps.filter(m => m.campaignId === fullCampaign?.id);
    const isEdit = !!fullCampaign;

    const hasUnsavedChanges = isNew || 
        name !== (fullCampaign?.name || '') ||
        system !== (fullCampaign?.system || 'generic') ||
        description !== (fullCampaign?.description || '') ||
        synopsis !== (fullCampaign?.synopsis || '') ||
        wallpaperUrl !== (fullCampaign?.wallpaperUrl || '');

    const handleSubmit = () => {
        const campaignData = {
            name,
            system,
            description,
            synopsis,
            wallpaperUrl,
            notebookUrl,
            systemPath,
            campaignPath,
            obsidianPath,
            // Vide se range comme « non déclaré » : sinon une chaîne vide
            // passerait pour une langue et écraserait le repli sur l'interface.
            langueDeForge: langueDeForge.trim() || undefined,
            activeLocationIds,
            aiPersonas
        } as Partial<Campaign>;

        if (isEdit && fullCampaign) {
            updateCampaign(fullCampaign.id, campaignData);
            gmToast('Paramètres de campagne mis à jour.');
        } else {
            addCampaign(campaignData as Omit<Campaign, 'id'>);
            gmToast('Nouvelle campagne initialisée.');
        }
        onClose();
    };

    const handleAutoGenerate = async () => {
        if (!name) {
            gmToast('Nom de campagne requis pour la génération.', 'error');
            return;
        }
        setIsGenerating(true);
        try {
            const personas = await personaGeneratorService.generateAllPersonas({
                name,
                universe: system,
                style: description || system,
                objective: synopsis
            }, false);
            setAiPersonas(personas);
            gmToast('Résonances Éthériques synchronisées.');
        } catch (error) {
            console.error("Génération error: ", error);
            gmToast('Échec de la synchronisation neurale.', 'error');
        } finally {
            setIsGenerating(false);
        }
    };

    return {
        fullCampaign,
        name, setName,
        system, setSystem,
        description, setDescription,
        synopsis, setSynopsis,
        wallpaperUrl, setWallpaperUrl,
        notebookUrl, setNotebookUrl,
        systemPath, setSystemPath,
        campaignPath, setCampaignPath,
        langueDeForge, setLangueDeForge,
        activeLocationIds, setActiveLocationIds,
        aiPersonas, setAiPersonas,
        obsidianPath, setObsidianPath,
        
        isMediaBrowserOpen, setIsMediaBrowserOpen,
        isGenerating,
        activeSection, setActiveSection,
        
        allTemplates,
        allDrivers,
        gems,
        campaignMaps,
        isEdit,
        hasUnsavedChanges,
        
        handleSubmit,
        handleAutoGenerate
    };
}
