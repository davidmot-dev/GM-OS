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
    async checkStatus(endpoint?: string): Promise<boolean> {
        const url = (endpoint || this.baseUrl).replace(/\/$/, '');
        try {
            const response = await net.fetch(`${url}/api/tags`);
            return response.ok;
        } catch (error) {
            console.error(`[Ollama] Erreur de vérification du statut sur ${url}:`, error);
            return false;
        }
    }

    /**
     * Envoie une requête de chat au modèle local (Bloquant)
     */
    async chat(model: string, messages: { role: string; content: string }[], endpoint?: string): Promise<string> {
        const url = (endpoint || this.baseUrl).replace(/\/$/, '');
        try {
            const response = await net.fetch(`${url}/api/chat`, {
                method: 'POST',
                body: JSON.stringify({
                    model: model,
                    messages: messages,
                    stream: false, 
                }),
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
                const errorText = await response.text().catch(() => response.statusText);
                throw new Error(`Ollama error (${response.status}): ${errorText}`);
            }

            const data = await response.json() as OllamaChatResponse;
            return data.message.content;
        } catch (error: unknown) {
            const err = error as Error & { code?: string; cause?: unknown };
            if (err.code === 'ECONNREFUSED' || err.message?.includes('fetch failed')) {
                throw new Error(`Ollama est inaccessible sur ${url}. Assurez-vous qu'Ollama est lancé et que le port est correct.`);
            }
            throw error;
        }
    }

    /**
     * Envoie une requête de chat au modèle local avec streaming (Réactifs)
     */
    async chatStream(model: string, messages: { role: string; content: string }[], onToken: (token: string) => void, endpoint?: string): Promise<void> {
        const url = (endpoint || this.baseUrl).replace(/\/$/, '');
        try {
            const response = await net.fetch(`${url}/api/chat`, {
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
    async listModels(endpoint?: string): Promise<string[]> {
        const url = (endpoint || this.baseUrl).replace(/\/$/, '');
        try {
            const response = await net.fetch(`${url}/api/tags`);
            if (!response.ok) return [];
            
            const data = await response.json() as { models?: { name: string }[] };
            return data.models?.map((m) => m.name) || [];
        } catch (error) {
            console.error(`[Ollama] Erreur de listing des modèles sur ${url}:`, error);
            return [];
        }
    }

    /**
     * Télécharge un modèle depuis la bibliothèque Ollama
     */
    async pullModel(name: string, endpoint?: string): Promise<boolean> {
        const url = (endpoint || this.baseUrl).replace(/\/$/, '');
        try {
            console.log(`[Ollama] Pulling model: ${name} from ${url}`);
            const response = await net.fetch(`${url}/api/pull`, {
                method: 'POST',
                body: JSON.stringify({ name, stream: false }),
                headers: { 'Content-Type': 'application/json' }
            });
            return response.ok;
        } catch (error) {
            console.error(`[Ollama] Erreur lors du pull de ${name} sur ${url}:`, error);
            return false;
        }
    }

    /**
     * Génère une image via l'API Ollama (modèles expérimentaux type Flux)
     */
    async generateImage(model: string, prompt: string, endpoint?: string): Promise<string> {
        const url = (endpoint || this.baseUrl).replace(/\/$/, '');
        try {
            console.log(`[Ollama] Generating image with: ${model} at ${url}`);
            const response = await net.fetch(`${url}/api/generate`, {
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
            console.error(`[Ollama] Erreur de génération d'image sur ${url}:`, error);
            throw error;
        }
    }

    /**
     * Enregistre les gestionnaires IPC pour Ollama
     */
    static registerHandlers() {
        const service = new OllamaService();

        ipcMain.handle('ai:ollama-status', async (_event, endpoint?: string) => {
            return await service.checkStatus(endpoint);
        });

        ipcMain.handle('ai:ollama-chat', async (_event, model: string, messages: { role: string; content: string }[], endpoint?: string) => {
            return await service.chat(model, messages, endpoint);
        });

        ipcMain.handle('ai:ollama-generate-image', async (_event, model: string, prompt: string, endpoint?: string) => {
            return await service.generateImage(model, prompt, endpoint);
        });

        ipcMain.handle('ai:ollama-chat-stream', async (event, model: string, messages: { role: string; content: string }[], endpoint?: string) => {
            try {
                await service.chatStream(model, messages, (token) => {
                    if (!event.sender.isDestroyed()) {
                        event.sender.send('ai:ollama-stream-token', token);
                    }
                }, endpoint);
                return { success: true };
            } catch (error) {
                console.error('[Ollama Bridge] Streaming error:', error);
                throw error;
            }
        });

        ipcMain.handle('ai:ollama-list-models', async (_event, endpoint?: string) => {
            return await service.listModels(endpoint);
        });

        ipcMain.handle('ai:ollama-pull', async (_event, model: string, endpoint?: string) => {
            return await service.pullModel(model, endpoint);
        });
    }
}
