// Utilisation du net.fetch d'Electron pour éviter les bugs réseau de Node.js sur Windows
import { net, ipcMain } from 'electron';

export interface OllamaChatResponse {
    model: string;
    created_at: string;
    message: {
        role: string;
        content: string;
    };
    done: boolean;
}

export class OllamaService {
    private baseUrl = 'http://127.0.0.1:11434';

    /**
     * Vérifie si le serveur Ollama est accessible
     */
    async checkStatus(): Promise<boolean> {
        try {
            const response = await net.fetch(`${this.baseUrl}/api/tags`);
            return response.ok;
        } catch (error) {
            console.error('[Ollama] Erreur de vérification du statut:', error);
            return false;
        }
    }

    /**
     * Envoie une requête de chat au modèle local (Bloquant)
     */
    async chat(model: string, messages: { role: string; content: string }[]): Promise<string> {
        try {
            const response = await net.fetch(`${this.baseUrl}/api/chat`, {
                method: 'POST',
                body: JSON.stringify({
                    model: model,
                    messages: messages,
                    stream: false, 
                }),
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
                throw new Error(`Ollama error: ${response.statusText}`);
            }

            const data = await response.json() as OllamaChatResponse;
            return data.message.content;
        } catch (error: unknown) {
            const err = error as Error & { code?: string; cause?: unknown };
            console.error('[Ollama] Erreur de chat complète:', {
                message: err.message,
                code: err.code,
                cause: err.cause
            });
            if (err.code === 'ECONNREFUSED' || err.message?.includes('fetch failed')) {
                throw new Error(`Ollama est inaccessible sur ${this.baseUrl} (Erreur: ${err.message}). Si Ollama tourne dans le navigateur mais pas ici, vérifiez le Pare-feu Windows pour l'application.`);
            }
            throw error;
        }
    }

    /**
     * Envoie une requête de chat au modèle local avec streaming (Réactifs)
     */
    async chatStream(model: string, messages: { role: string; content: string }[], onToken: (token: string) => void): Promise<void> {
        try {
            const response = await net.fetch(`${this.baseUrl}/api/chat`, {
                method: 'POST',
                body: JSON.stringify({
                    model: model,
                    messages: messages,
                    stream: true,
                }),
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
                throw new Error(`Ollama stream error: ${response.statusText}`);
            }

            const reader = response.body?.getReader();
            if (!reader) throw new Error("Réponse vide d'Ollama (Stream body introuvable).");

            const decoder = new TextDecoder();
            let leftover = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                leftover += decoder.decode(value, { stream: true });
                const lines = leftover.split('\n');
                leftover = lines.pop() || '';

                for (const line of lines) {
                    if (!line.trim()) continue;
                    try {
                        const json = JSON.parse(line);
                        if (json.message?.content) {
                            onToken(json.message.content);
                        }
                    } catch (e) {
                         // On ignore les lignes corrompues
                    }
                }
            }
        } catch (error) {
            console.error('[Ollama] Stream error:', error);
            throw error;
        }
    }

    /**
     * Liste les modèles installés localement
     */
    async listModels(): Promise<string[]> {
        try {
            const response = await net.fetch(`${this.baseUrl}/api/tags`);
            if (!response.ok) return [];
            
            const data = await response.json() as { models?: { name: string }[] };
            return data.models?.map((m) => m.name) || [];
        } catch (error) {
            console.error('[Ollama] Erreur de listing des modèles:', error);
            return [];
        }
    }

    /**
     * Télécharge un modèle depuis la bibliothèque Ollama
     */
    async pullModel(name: string): Promise<boolean> {
        try {
            console.log(`[Ollama] Pulling model: ${name}`);
            const response = await net.fetch(`${this.baseUrl}/api/pull`, {
                method: 'POST',
                body: JSON.stringify({ name, stream: false }),
                headers: { 'Content-Type': 'application/json' }
            });
            return response.ok;
        } catch (error) {
            console.error(`[Ollama] Erreur lors du pull de ${name}:`, error);
            return false;
        }
    }

    /**
     * Génère une image via l'API Ollama (modèles expérimentaux type Flux)
     * Retourne généralement du texte en Base64 ou formaté en Markdown
     */
    async generateImage(model: string, prompt: string): Promise<string> {
        try {
            console.log(`[Ollama] Generating image with: ${model}`);
            const response = await net.fetch(`${this.baseUrl}/api/generate`, {
                method: 'POST',
                body: JSON.stringify({
                    model: model,
                    prompt: prompt,
                    stream: false,
                }),
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
                throw new Error(`Ollama image generator error: ${response.statusText}`);
            }

            const data = await response.json() as { response: string };
            return data.response;
        } catch (error) {
            console.error('[Ollama] Erreur de génération d\'image:', error);
            throw error;
        }
    }

    /**
     * Enregistre les gestionnaires IPC pour Ollama
     */
    static registerHandlers() {
        const service = new OllamaService();

        ipcMain.handle('ai:ollama-status', async () => {
            return await service.checkStatus();
        });

        ipcMain.handle('ai:ollama-chat', async (_event, model: string, messages: { role: string; content: string }[]) => {
            return await service.chat(model, messages);
        });

        ipcMain.handle('ai:ollama-generate-image', async (_event, model: string, prompt: string) => {
            return await service.generateImage(model, prompt);
        });

        ipcMain.handle('ai:ollama-chat-stream', async (event, model: string, messages: { role: string; content: string }[]) => {
            try {
                await service.chatStream(model, messages, (token) => {
                    if (!event.sender.isDestroyed()) {
                        event.sender.send('ai:ollama-stream-token', token);
                    }
                });
                return { success: true };
            } catch (error) {
                console.error('[Ollama Bridge] Streaming error:', error);
                throw error;
            }
        });

        ipcMain.handle('ai:ollama-list-models', async () => {
            return await service.listModels();
        });

        ipcMain.handle('ai:ollama-pull', async (_event, model: string) => {
            return await service.pullModel(model);
        });
    }
}
