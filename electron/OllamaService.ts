// Utilisation du fetch natif de Node.js (v18+)

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
    private baseUrl = 'http://localhost:11434';

    /**
     * Vérifie si le serveur Ollama est accessible
     */
    async checkStatus(): Promise<boolean> {
        try {
            const response = await fetch(`${this.baseUrl}/api/tags`);
            return response.ok;
        } catch (error) {
            console.error('[Ollama] Erreur de vérification du statut:', error);
            return false;
        }
    }

    /**
     * Envoie une requête de chat au modèle local
     */
    async chat(model: string, messages: { role: string; content: string }[]): Promise<string> {
        try {
            const response = await fetch(`${this.baseUrl}/api/chat`, {
                method: 'POST',
                body: JSON.stringify({
                    model: model,
                    messages: messages,
                    stream: false, // On désactive le stream pour simplifier l'intégration initiale
                }),
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
                throw new Error(`Ollama error: ${response.statusText}`);
            }

            const data = await response.json() as OllamaChatResponse;
            return data.message.content;
        } catch (error) {
            console.error('[Ollama] Erreur de chat:', error);
            throw error;
        }
    }

    /**
     * Liste les modèles installés localement
     */
    async listModels(): Promise<string[]> {
        try {
            const response = await fetch(`${this.baseUrl}/api/tags`);
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
            const response = await fetch(`${this.baseUrl}/api/pull`, {
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
            const response = await fetch(`${this.baseUrl}/api/generate`, {
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
}
