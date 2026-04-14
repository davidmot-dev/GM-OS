import { useState, useCallback } from 'react';
import { useOracleContext } from '../../ai/hooks/useOracleContext';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

/**
 * Hook spécialisé pour la communication avec NotebookLM via le pont MCP GM-OS.
 * Intègre automatiquement le contexte vivant de la session (Neural Liaison).
 */
export const useNotebookLM = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isQuerying, setIsQuerying] = useState(false);
    
    // Récupération du contexte vivant et du persona actif via le hook centralisé
    const { snapshot, activeGem, activeCampaign, activeDriver } = useOracleContext();

    const extractNotebookId = useCallback((url: string): string | null => {
        if (!url) return null;
        // Extraction robuste de l'ID depuis l'URL NotebookLM
        const match = url.match(/notebooks\/([a-f0-9-]{36}|[a-zA-Z0-9_-]+)/i) || 
                     url.match(/([a-f0-9-]{36})/i);
        return match ? match[1] : url.trim();
    }, []);

    const queryNotebook = useCallback(async (notebookId: string, query: string) => {
        if (!notebookId || !query.trim() || isQuerying) return;

        setIsQuerying(true);
        // On affiche uniquement la requête utilisateur brute dans l'UI pour la lisibilité
        setMessages(prev => [...prev, { role: 'user', content: query }]);

        try {
            // 1. Détermination des consignes du Persona (Calcul des priorités d'override)
            let personaPrompt = "";
            if (activeGem) {
                const campaignOverride = activeCampaign?.aiPersonas?.[activeGem.id];
                const driverOverride = activeDriver?.aiPersonas?.[activeGem.id];
                const systemOverride = activeCampaign?.system ? activeGem.systemOverrides?.[activeCampaign.system] : null;
                
                // Priorité : Campagne > Système/Driver > Base instructions
                personaPrompt = campaignOverride || driverOverride || systemOverride || activeGem.baseInstructions;
            }

            if (!window.appBridge?.mcp?.callTool) {
                throw new Error("Bridge MCP non disponible");
            }

            // 2. Configuration du Persona (Phase de pré-vol)
            if (personaPrompt) {
                try {
                    await window.appBridge.mcp.callTool('notebooklm-mcp-server', 'chat_configure', {
                        notebook_id: notebookId,
                        goal: 'custom',
                        custom_prompt: `[CONSIGNES DU PERSONA]\n${personaPrompt}`,
                        response_length: 'default'
                    });
                } catch (err) {
                    console.warn("useNotebookLM: Configuration persona échouée, poursuite sans consignes", err);
                }
            }

            // 3. Injection du Contexte Vital (Neural Liaison)
            // On combine l'instantané de session capturé par useOracleContext avec la question
            const enrichedQuery = `[LIAISON NEURALE : ÉTAT DE LA SESSION]\n${snapshot}\n\n[MESSAGE DU MJ]\n${query}\n\n(Réponds toujours en français)`;

            const response = await window.appBridge.mcp.callTool('notebooklm-mcp-server', 'notebook_query', {
                notebook_id: notebookId,
                query: enrichedQuery
            });

            if (response && response.content) {
                setMessages(prev => [...prev, { role: 'assistant', content: response.content as string }]);
            } else {
                setMessages(prev => [...prev, { role: 'assistant', content: "L'Oracle reste silencieux... (Réponse vide)" }]);
            }
        } catch (error: any) {
            console.error("useNotebookLM: Query failed", error);
            setMessages(prev => [...prev, { role: 'assistant', content: `Rupture de liaison : ${error.message || 'Erreur MCP'}` }]);
        } finally {
            setIsQuerying(false);
        }
    }, [isQuerying, activeGem, activeCampaign, activeDriver, snapshot]);

    const clearChat = useCallback(() => setMessages([]), []);
    
    const reauthenticate = useCallback(async () => {
        try {
            if (window.appBridge?.mcp?.reauthenticate) {
                await window.appBridge.mcp.reauthenticate();
            }
        } catch (error) {
            console.error("Re-authentication failed", error);
        }
    }, []);

    return {
        messages,
        isQuerying,
        queryNotebook,
        extractNotebookId,
        clearChat,
        reauthenticate
    };
};
