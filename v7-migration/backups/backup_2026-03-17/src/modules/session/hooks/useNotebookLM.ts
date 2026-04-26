import { useState, useCallback, useMemo } from 'react';
import { useGemStore } from '../../../stores/useGemStore';
import { useSessionOSStore } from '../useSessionOSStore';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

export const useNotebookLM = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isQuerying, setIsQuerying] = useState(false);
    
    // Get active GEM and campaign info
    const { activeGemId, gems } = useGemStore();
    const { activeCampaignId, campaigns, getActiveDriver } = useSessionOSStore();

    const activeGem = useMemo(() => gems.find(g => g.id === activeGemId), [gems, activeGemId]);
    const activeCampaign = useMemo(() => campaigns.find(c => c.id === activeCampaignId), [campaigns, activeCampaignId]);
    const activeDriver = getActiveDriver();

    const extractNotebookId = useCallback((url: string): string | null => {
        if (!url) return null;
        // Search for UUID pattern: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
        const match = url.match(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/i);
        return match ? match[0] : null;
    }, []);

    const queryNotebook = useCallback(async (notebookId: string, query: string) => {
        if (!notebookId || !query.trim() || isQuerying) return;

        setIsQuerying(true);
        setMessages(prev => [...prev, { role: 'user', content: query }]);

        try {
            // Build the persona-aware prompt
            let personaPrompt = "";
            if (activeGem) {
                const systemId = activeCampaign?.system;
                
                // Priority 1: User-defined override in the current Driver (Rule Engine)
                const driverOverride = activeDriver?.aiPersonas?.[activeGem.id];
                
                // Priority 2: Built-in system override for this Gem
                const systemOverride = systemId ? activeGem.systemOverrides?.[systemId] : null;
                
                // Priority 3: Base Gem instructions
                personaPrompt = driverOverride || systemOverride || activeGem.baseInstructions;
            }

            const fullPrompt = `
[CONSIGNES DU PERSONA]
${personaPrompt}

---
[QUESTION UTILISATEUR]
${query}

---
(Réponds toujours en français)
`.trim();

            if (!window.appBridge?.mcp?.callTool) {
                throw new Error("Bridge MCP non disponible");
            }

            const response = await window.appBridge.mcp.callTool('notebooklm-mcp-server', 'notebook_query', {
                notebook_id: notebookId,
                query: fullPrompt
            });

            if (response && response.content) {
                setMessages(prev => [...prev, { role: 'assistant', content: response.content as string }]);
            } else {
                setMessages(prev => [...prev, { role: 'assistant', content: "Désolé, je n'ai pas pu obtenir de réponse de l'Oracle." }]);
            }
        } catch (error) {
            console.error("useNotebookLM: Query failed", error);
            setMessages(prev => [...prev, { role: 'assistant', content: "Erreur de connexion avec l'Oracle." }]);
        } finally {
            setIsQuerying(false);
        }
    }, [isQuerying, activeGem, activeCampaign, activeDriver?.aiPersonas]);

    const clearChat = useCallback(() => {
        setMessages([]);
    }, []);
    
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
