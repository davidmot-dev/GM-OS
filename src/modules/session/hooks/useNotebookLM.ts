import { useState, useCallback } from 'react';

export interface NotebookLMMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
}

export const useNotebookLM = () => {
    const [messages, setMessages] = useState<NotebookLMMessage[]>([]);
    const [isQuerying, setIsQuerying] = useState(false);

    /**
     * Extracts UUID from a NotebookLM URL
     * Format: https://notebooklm.google.com/notebook/uuid-here
     */
    const extractNotebookId = (url: string): string | null => {
        if (!url) return null;
        const match = url.match(/\/notebook\/([a-f0-9-]+)/i);
        return match ? match[1] : null;
    };

    const queryNotebook = useCallback(async (notebookId: string, query: string) => {
        setIsQuerying(true);
        const userMsg: NotebookLMMessage = { role: 'user', content: query, timestamp: Date.now() };
        setMessages(prev => [...prev, userMsg]);

        try {
            if (!window.appBridge?.mcp?.callTool) {
                throw new Error("MCP Bridge not available");
            }

            const finalQuery = `${query}\n\n(Réponds toujours en français)`;
            
            const response = await window.appBridge.mcp.callTool('notebooklm-mcp-server', 'notebook_query', {
                notebook_id: notebookId,
                query: finalQuery
            });

            const assistantMsg: NotebookLMMessage = { 
                role: 'assistant', 
                content: response?.content || "L'Oracle est resté silencieux (réponse vide).",
                timestamp: Date.now() 
            };
            setMessages(prev => [...prev, assistantMsg]);
            return assistantMsg;
        } catch (error) {
            console.error("[NotebookLM] Query failed:", error);
            
            let message = "Le serveur a rencontré un problème.";
            if (error instanceof Error) {
                message = error.message;
            } else if (typeof error === 'string') {
                message = error;
            } else if (error && typeof error === 'object') {
                message = (error as { message?: string }).message || JSON.stringify(error);
            }

            const errorMsg: NotebookLMMessage = { 
                role: 'assistant', 
                content: `🚨 **Erreur Oracle** : ${message}\n\nVeuillez vérifier que le serveur MCP est bien authentifié (run \`notebooklm-mcp-auth\`).`, 
                timestamp: Date.now() 
            };
            setMessages(prev => [...prev, errorMsg]);
            throw error;
        } finally {
            setIsQuerying(false);
        }
    }, []);

    const clearChat = () => setMessages([]);
    
    const reauthenticate = async () => {
        if (window.appBridge?.mcp?.reauthenticate) {
            return await window.appBridge.mcp.reauthenticate();
        }
        throw new Error("MCP Re-authentication not available");
    };

    return {
        messages,
        isQuerying,
        queryNotebook,
        extractNotebookId,
        clearChat,
        reauthenticate
    };
};
