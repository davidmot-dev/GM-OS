import { useAIStore } from '../../stores/useAIStore';
import { useSessionOSStore } from '../session/useSessionOSStore';
import { ragService } from './RAGService';
import type { AIResponse } from './types';

// Note: In a real implementation, these would be imported from separate files 
// in the /providers directory.

export class AIService {
  private static instance: AIService;

  private constructor() {}

  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  public async generateText(prompt: string, customContext?: string, gemId: string = 'sage'): Promise<AIResponse> {
    const { activeProvider, configs } = useAIStore.getState();
    const config = configs[activeProvider];

    if (!config.apiKey) {
      throw new Error(`API Key manquante pour le fournisseur ${activeProvider}`);
    }

    // Capture context from RAG
    const ragContext = await ragService.getRelevantContext();
    const fullContext = customContext ? `${customContext}\n\n${ragContext}` : ragContext;

    console.log(`[AI Service] Injected context size: ${fullContext.length} chars`);

    // 2. Resolve Dynamic Persona from GemStore
    const gemStore = (await import('../../stores/useGemStore')).useGemStore.getState();
    const gem = gemStore.gems.find(g => g.id === gemId) || gemStore.gems[0];
    
    // 3. Identify System for Flavored Persona
    const activeCampaign = useSessionOSStore.getState().campaigns.find(c => c.id === useSessionOSStore.getState().activeCampaignId);
    const systemId = activeCampaign?.system?.toLowerCase() || 'generic';

    // 4. Determine Instructions (File Override > Store Override > Base)
    let personaInstructions = gem.systemOverrides?.[systemId] || gem.baseInstructions;
    
    // Pro Feature: Check for gems.json in system folder
    try {
      const systemGemsRaw = await window.appBridge?.ai?.readDoc?.(`systems/${systemId}/gems.json`);
      if (systemGemsRaw) {
        const systemGems = JSON.parse(systemGemsRaw);
        if (systemGems[gemId]) {
          console.log(`[AI Service] 🚀 File override found for ${gemId} in ${systemId}`);
          personaInstructions = systemGems[gemId];
        }
      }
    } catch {
      // Ignore if file doesn't exist
    }

    // Check Sheet Template Override (Highest Priority)
    const { DEFAULT_SHEET_TEMPLATES } = await import('../../data/defaultSheetTemplates');
    const allTemplates = [...DEFAULT_SHEET_TEMPLATES, ...useSessionOSStore.getState().customSheetTemplates];
    const sheetTemplate = allTemplates.find(t => t.id === systemId);
    
    if (sheetTemplate?.aiPersonas?.[gemId]) {
       console.log(`[AI Service] 📝 Sheet Template override found for ${gemId} in ${sheetTemplate.name}`);
       personaInstructions = sheetTemplate.aiPersonas[gemId];
    }

    // Build the final optimized system prompt
    const systemPrompt = `${personaInstructions}

Tu es un assistant de Maître de Jeu expert pour GM-OS. Ton alias actuel est "${gem.name}".
RÈGLES IMPORTANTES :
1. Analyse le contexte RAG fourni (règles et lore locaux).
2. Réponds impérativement en français, de manière concise et immersive.
3. Si la question porte sur un point de règle, cite le document source si possible.

CONTEXTE LOCAL RÉCUPÉRÉ :
${fullContext}`;

    if (activeProvider === 'gemini') {
      const apiKey = config.apiKey?.trim().replace(/[\r\n]/g, '');
      const model = config.modelId || 'gemini-1.5-flash';
      
      const tryVersion = async (version: string) => {
        const url = `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${apiKey}`;
        console.log(`[AI Service] Proxying via Main: ${version}/models/${model}`);
        
        if (!window.appBridge?.ai?.proxyRequest) {
           throw new Error("Bridge AI non disponible (proxyRequest).");
        }

        return window.appBridge.ai.proxyRequest(url, 'POST', { 'Content-Type': 'application/json' }, {
          contents: [{ parts: [{ text: `${systemPrompt}\n\nUtilisateur: ${prompt}` }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 1024 }
        });
      };

      try {
        const initialVersion = model.startsWith('gemini-2') ? 'v1beta' : 'v1';
        let bridgeResponse = await tryVersion(initialVersion);
        
        if (bridgeResponse.status === 404 && initialVersion === 'v1') {
          console.warn("[AI Service] v1 404, attempting v1beta...");
          bridgeResponse = await tryVersion('v1beta');
        }

        if (!bridgeResponse.ok) {
          const errorData = bridgeResponse.data || {};
          console.error("[AI Service] Gemini Error Detail:", errorData);
          
          if (bridgeResponse.status === 429) {
            if (model !== 'gemini-2.0-flash-lite') {
               console.warn("[AI Service] Quota limit, attempting fallback...");
               const fallbackUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`;
               
               if (!window.appBridge?.ai?.proxyRequest) {
                  throw new Error("Bridge AI non disponible.");
               }

               const fallbackRes = await window.appBridge.ai.proxyRequest(fallbackUrl, 'POST', { 'Content-Type': 'application/json' }, {
                 contents: [{ parts: [{ text: `${systemPrompt}\n\nUtilisateur: ${prompt}` }] }],
                 generationConfig: { temperature: 0.7, maxOutputTokens: 1024 }
               });
               if (fallbackRes.ok) {
                 const data = fallbackRes.data;
                 return { text: data.candidates?.[0]?.content?.parts?.[0]?.text || "Réponse fallback.", metadata: { provider: 'gemini', model: 'gemini-2.0-flash-lite' } };
               }
            }
            throw new Error("Quota insuffisant chez Google.");
          }
          
          throw new Error(`Erreur API Gemini (${bridgeResponse.status}): ${errorData.error?.message || bridgeResponse.statusText}`);
        }

        const data = bridgeResponse.data;
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "Pas de réponse.";
        
        return { text, metadata: { provider: 'gemini', model } };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Erreur inconnue.";
        console.error("Gemini API Error:", error);
        throw new Error(errorMessage);
      }
    }

    // fallback for other providers
    return {
      text: `[Simulation ${activeProvider}] Réponse basée sur le contexte RAG récupéré (${ragContext.length} chars).`,
      metadata: { provider: activeProvider, model: config.modelId }
    };
  }

  /**
   * Auto-generates a GM-OS SheetTemplate based on rulebooks
   */
  public async generateStructuredTemplate(systemQuery: string): Promise<Partial<import('../../data/defaultSheetTemplates').SheetTemplate>> {
    const { configs, activeProvider } = useAIStore.getState();
    const config = configs[activeProvider];

    if (!config || !config.apiKey) {
      throw new Error("Clé API non configurée pour ce fournisseur.");
    }

    const { ragService } = await import('./RAGService');
    const fullContext = await ragService.getContextForSpecificSystem(systemQuery);
    
    console.log(`[AI Service] Injected context for Generator: ${fullContext.length} chars`);

    const systemPrompt = `Tu es un expert en game design de jeux de rôle. Ton but est de générer une fiche de personnage complète pour le jeu : "${systemQuery}".
Tu dois analyser le contexte RAG fourni (s'il y en a) pour identifier les Caractéristiques, Compétences et Ressources Vitales.
Si le contexte est insuffisant, base-toi sur tes connaissances expertes de ce jeu.

Tu dois retourner UNIQUEMENT un objet JSON (sans bloc markdown) qui correspond à ce format strict :
{
  "name": "Nom du jeu",
  "emoji": "🎲",
  "sections": [
    {
      "id": "caracteristiques",
      "label": "Caractéristiques",
      "fields": [
        { "id": "for", "label": "Force", "type": "gauge", "defaultValue": 50 }
      ]
    }
  ]
}
Notes sur les types de champs:
- 'gauge' : Jauges de scores (0-100 ou similaire, default 50)
- 'number' : Chiffres bruts (HP, Level, default 0 ou au choix)
- 'text' : Nom, Classe, Race (default "")
- 'textarea' : Pour les descriptions longues ou historiques (default "")
- 'checkbox' : boolean (default false)
- 'select' : Liste de choix. Tu DOIS inclure une propriété "options": ["Choix1", "Choix2"]
- 'rating' : Échelle de points (Ex: 1 à 5). Tu DOIS inclure une propriété "max": 5 (ou autre nombre).

CONTEXTE RÉCUPÉRÉ :
${fullContext}`;

    if (activeProvider === 'gemini') {
      const apiKey = config.apiKey?.trim().replace(/[\r\n]/g, '');
      const model = config.modelId || 'gemini-2.5-flash';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      
      if (!window.appBridge?.ai?.proxyRequest) {
        throw new Error("Bridge AI non disponible.");
      }

      const bridgeRes = await window.appBridge.ai.proxyRequest(url, 'POST', { 'Content-Type': 'application/json' }, {
        contents: [{ parts: [{ text: systemPrompt }] }],
        generationConfig: { 
          temperature: 0.2, 
          responseMimeType: "application/json"
        }
      });

      if (!bridgeRes.ok) {
        throw new Error(`Erreur API Gemini lors de la génération: ${bridgeRes.statusText}`);
      }

      const text = bridgeRes.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!text) throw new Error("Le modèle n'a rien retourné.");
      
      try {
        return JSON.parse(text);
      } catch {
        throw new Error("Le format JSON retourné par l'IA est invalide.");
      }
    }
    
    throw new Error("La génération magique n'est supportée qu'avec Gemini pour le moment en raison des contraintes JSON.");
  }

  /**
   * Diagnostic tool to see which models are actually available for the current key.
   */
  public async listModels(): Promise<unknown> {
    const { configs } = useAIStore.getState();
    const apiKey = configs.gemini.apiKey?.trim().replace(/[\r\n]/g, '');

    if (!apiKey) return "No API Key";

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`);
      const data = await response.json();
      if (data.models) {
        const names = data.models.map((m: { name: string }) => m.name.replace('models/', ''));
        console.log("[AI Service] Modèles valides pour votre clé :", names);
      }
      return data;
    } catch (err) {
      console.error("[AI Service] ListModels Error:", err);
      return { error: err };
    }
  }
}

export const aiService = AIService.getInstance();
