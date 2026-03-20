import { useAIStore } from '../../stores/useAIStore';
import { useSessionOSStore } from '../session/useSessionOSStore';
import { useJournalStore } from '../journal/useJournalStore';
import { useMediaStore } from '../../stores/useMediaStore';
import { ragService } from './RAGService';
import type { AIResponse } from './types';
import type { JournalEvent } from '../journal/types';

interface GeminiResponse {
  candidates?: {
    content?: {
      parts?: {
        text?: string;
        inlineData?: {
          data: string;
          mimeType: string;
        };
      }[];
    };
  }[];
}

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

    const ragContext = await ragService.getRelevantContext();
    const fullContext = customContext ? `${customContext}\n\n${ragContext}` : ragContext;

    const gemStore = (await import('../../stores/useGemStore')).useGemStore.getState();
    const gem = gemStore.gems.find(g => g.id === gemId) || gemStore.gems[0];
    
    const activeCampaign = useSessionOSStore.getState().campaigns.find(c => c.id === useSessionOSStore.getState().activeCampaignId);
    const systemId = activeCampaign?.system?.toLowerCase() || 'generic';

    let personaInstructions = gem.systemOverrides?.[systemId] || gem.baseInstructions;
    
    try {
      const systemGemsRaw = await window.appBridge?.ai?.readDoc?.(`systems/${systemId}/gems.json`);
      if (systemGemsRaw) {
        const systemGems = JSON.parse(systemGemsRaw);
        if (systemGems[gemId]) {
          personaInstructions = systemGems[gemId];
        }
      }
    } catch {
      // Ignore
    }

    const { DEFAULT_SHEET_TEMPLATES } = await import('../../data/defaultSheetTemplates');
    const allTemplates = [...DEFAULT_SHEET_TEMPLATES, ...useSessionOSStore.getState().customSheetTemplates];
    const sheetTemplate = allTemplates.find(t => t.id === systemId);
    
    if (sheetTemplate?.aiPersonas?.[gemId]) {
       personaInstructions = sheetTemplate.aiPersonas[gemId];
    }

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
        if (!window.appBridge?.ai?.proxyRequest) throw new Error("Bridge AI non disponible.");

        return window.appBridge.ai.proxyRequest(url, 'POST', { 'Content-Type': 'application/json' }, {
          contents: [{ parts: [{ text: `${systemPrompt}\n\nUtilisateur: ${prompt}` }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 4096 }
        });
      };

      try {
        const initialVersion = model.startsWith('gemini-2') ? 'v1beta' : 'v1';
        let bridgeResponse = await tryVersion(initialVersion);
        
        if (bridgeResponse.status === 404 && initialVersion === 'v1') {
          bridgeResponse = await tryVersion('v1beta');
        }

        if (!bridgeResponse.ok) {
          const errorData = (bridgeResponse.data as { error?: { message?: string } }) || {};
          if (bridgeResponse.status === 429) {
            if (model !== 'gemini-2.0-flash-lite') {
               const fallbackUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`;
               const fallbackRes = await window.appBridge?.ai?.proxyRequest?.(fallbackUrl, 'POST', { 'Content-Type': 'application/json' }, {
                 contents: [{ parts: [{ text: `${systemPrompt}\n\nUtilisateur: ${prompt}` }] }],
                 generationConfig: { temperature: 0.7, maxOutputTokens: 4096 }
               });
               if (fallbackRes?.ok) {
                 const data = fallbackRes.data as GeminiResponse;
                 return { text: data.candidates?.[0]?.content?.parts?.[0]?.text || "Réponse fallback.", metadata: { provider: 'gemini', model: 'gemini-2.0-flash-lite' } };
               }
            }
            throw new Error("Quota insuffisant chez Google.");
          }
          throw new Error(`Erreur API Gemini (${bridgeResponse.status}): ${errorData.error?.message || bridgeResponse.statusText}`);
        }

        const data = bridgeResponse.data as GeminiResponse;
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "Pas de réponse.";
        return { text, metadata: { provider: 'gemini', model } };
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(message || "Erreur inconnue.");
      }
    }

    return {
      text: `[Simulation ${activeProvider}] Réponse basée sur le contexte RAG récupéré (${ragContext.length} chars).`,
      metadata: { provider: activeProvider, model: config.modelId }
    };
  }

  public async summarizeSession(events: JournalEvent[]): Promise<string> {
    const { activeProvider, configs } = useAIStore.getState();
    const config = configs[activeProvider];

    if (!config.apiKey) {
      throw new Error(`API Key manquante pour le fournisseur ${activeProvider}`);
    }

    // Sort events by timestamp
    const sortedEvents = [...events].sort((a, b) => a.timestamp - b.timestamp);

    // Filter and format events for the prompt
    const eventLog = sortedEvents
      .map(e => {
        const time = new Date(e.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        return `[${time}] ${e.title}: ${e.content}`;
      })
      .join('\n');

    const journalStore = useJournalStore.getState();
    const activeJournal = journalStore.journals.find(j => j.id === journalStore.activeJournalId);

    const summaryPrompt = `En tant que Chroniqueur Expert, transforme ces logs de session de jeu de rôle en un résumé narratif captivant.
    Les événements sont chronologiques. Crée un récit fluide, avec des titres de sections, des moments forts et des développements d'intrigue.
    
    ${activeJournal?.finalNote ? `IMPORTANT - NOTE FINALE DU MJ :\n"${activeJournal.finalNote}"\nPrends bien en compte ces notes pour conclure le résumé.` : ''}

    LOGS DE LA SESSION :
    ${eventLog}
    
    RÉSUMÉ FINAL :`;

    try {
      if (activeProvider === 'gemini') {
        const apiKey = config.apiKey?.trim().replace(/[\r\n]/g, '');
        const model = config.modelId || 'gemini-1.5-flash';
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        const bridgeResponse = await window.appBridge?.ai?.proxyRequest?.(url, 'POST', { 'Content-Type': 'application/json' }, {
          contents: [{ parts: [{ text: summaryPrompt }] }],
          generationConfig: { temperature: 0.8, maxOutputTokens: 2048 }
        });

        if (bridgeResponse?.ok) {
          const data = bridgeResponse.data as GeminiResponse;
          return data.candidates?.[0]?.content?.parts?.[0]?.text || "Impossible de générer le résumé.";
        }
        throw new Error("L'appel au bridge pour le résumé a échoué.");
      }
      
      return "Résumé non disponible pour ce fournisseur d'IA.";
    } catch (err) {
      console.error("[AIService] Summarization error:", err);
      throw err;
    }
  }

  public async generateImage(prompt: string): Promise<string> {
    try {
      // 1. TENTATIVE Z-IMAGE (HuggingFace Space via Gradio)
      try {
        console.log(`[AI Service] Tentative de génération via Z-Image (HuggingFace Space)...`);
        const { Client } = await import('@gradio/client');
        
        // Utilisation du token fourni par l'environnement
        const hfToken = import.meta.env.VITE_HF_TOKEN || ''; 
        
        const client = await Client.connect('https://mrfakename-z-image-turbo.hf.space', { hf_token: hfToken } as any);
        
        // Paramètres Z-Image : prompt, height, width, num_inference_steps, seed, randomize_seed
        const result = await client.predict('/generate_image', { 
            prompt: prompt,
            height: 1024,
            width: 1024,
            num_inference_steps: 4, // Rapide
            seed: 42,
            randomize_seed: true
        });

        const data = result.data as any[];
        const imageUrl = data[0]?.url;

        if (imageUrl) {
          console.log(`[AI Service] Z-Image générée : ${imageUrl}. Téléchargement...`);
          const imgResponse = await fetch(imageUrl);
          if (imgResponse.ok) {
            const arrayBuffer = await imgResponse.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);
            
            if (uint8Array.byteLength > 1000) {
              const mimeType = imgResponse.headers.get('content-type') || 'image/png';
              const extension = mimeType.split('/')[1] || 'png';
              const fileName = `zimage_gen_${Date.now()}.${extension}`;
              
            if (window.appBridge?.npc?.saveAvatar) {
              const bufferCopy = (uint8Array.buffer as ArrayBuffer).slice(0);
              const localUrl = await window.appBridge.npc.saveAvatar(bufferCopy, fileName);
              
              // Register in Media Hub as well
              try {
                const { addMedia } = useMediaStore.getState();
                const blob = new Blob([uint8Array], { type: mimeType });
                const file = new File([blob], fileName, { type: mimeType });
                await addMedia(file, ['AI Generated', 'NPC Portrait']);
                console.log(`[AI Service] Z-Image registered in Media Hub.`);
              } catch (hubErr) {
                console.warn(`[AI Service] Base64 for Media Hub failed (Z-Image):`, hubErr);
              }

              if (localUrl) return localUrl;
            }
              // Fallback Data URI si saveAvatar échoue
              const base64 = btoa(String.fromCharCode(...uint8Array));
              return `data:${mimeType};base64,${base64}`;
            }
          }
        }
        console.warn(`[AI Service] Z-Image n'a pas retourné d'URL fluide. Passage à Gemini...`);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.warn(`[AI Service] Z-Image (HF Space) indisponible ou en échec (${message}). Passage à Gemini...`);
      }

      // 2. FALLBACK GEMINI 2.5 FLASH IMAGE
      const { configs } = useAIStore.getState();
      const apiKey = configs['gemini']?.apiKey;
      
      if (!apiKey) {
        throw new Error("Clé API Gemini manquante pour fallback.");
      }

      console.log(`[AI Service] Generating image with Gemini 2.5 Flash...`);
      
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${apiKey}`;
      
      const payload = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseModalities: ["IMAGE"] }
      };


      console.log(`[AI Service] Proxying Gemini Image request...`);
      const bridgeResponse = await window.appBridge?.ai?.proxyRequest?.(url, 'POST', { 'Content-Type': 'application/json' }, payload);

      if (!bridgeResponse?.ok) {
        const errorMsg = (bridgeResponse?.data as { error?: { message?: string } })?.error?.message || bridgeResponse?.statusText || 'Inconnue';
        throw new Error(`Erreur Proxy Gemini Image: ${errorMsg}`);
      }

      const data = bridgeResponse.data as GeminiResponse;
      const imagePart = data.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);
      
      if (!imagePart || !imagePart.inlineData?.data) {
        throw new Error("Aucune image générée dans la réponse Gemini.");
      }

      const { data: base64Data, mimeType } = imagePart.inlineData;
      console.log(`[AI Service] Image received via proxy: ${mimeType}, size: ${base64Data.length} chars`);

      // Decodage base64 robuste
      const binaryString = atob(base64Data);
      const uint8Array = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        uint8Array[i] = binaryString.charCodeAt(i);
      }
      
      console.log(`[AI Service] Decoded buffer size: ${uint8Array.byteLength} bytes`);

      const extension = mimeType?.split('/')[1] || 'png';
      const fileName = `ai_gen_${Date.now()}.${extension}`;
      
      if (window.appBridge?.npc?.saveAvatar && uint8Array.byteLength > 1000) {
        console.log(`[AI Service] Saving image locally via bridge (${uint8Array.byteLength} bytes)...`);
        // On s'assure de passer une COPIE du buffer pour éviter tout problème de détachement
        const bufferCopy = (uint8Array.buffer as ArrayBuffer).slice(0);
        const localUrl = await window.appBridge.npc.saveAvatar(bufferCopy, fileName);

        // Register in Media Hub as well
        try {
          const { addMedia } = useMediaStore.getState();
          const blob = new Blob([uint8Array], { type: mimeType || 'image/png' });
          const file = new File([blob], fileName, { type: mimeType || 'image/png' });
          await addMedia(file, ['AI Generated', 'NPC Portrait']);
          console.log(`[AI Service] Gemini Image registered in Media Hub.`);
        } catch (hubErr) {
          console.warn(`[AI Service] Base64 for Media Hub failed (Gemini):`, hubErr);
        }

        if (localUrl) {
          console.log(`[AI Service] Image saved at: ${localUrl}`);
          return localUrl;
        }
      }
      
      console.warn("[AI Service] Local save failed or bridge unavailable, using Data URI fallback.");
      return `data:${mimeType};base64,${base64Data}`;
      
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("[AI Service] Gemini Image Proxy Error:", message);
      return `https://api.dicebear.com/9.x/bottts/svg?seed=${Date.now()}`;
    }
  }

  public async generateStructuredTemplate(systemQuery: string): Promise<Partial<import('../../data/defaultSheetTemplates').SheetTemplate>> {
    const { activeProvider, configs } = useAIStore.getState();
    const config = configs[activeProvider];

    const systemPrompt = `Tu es un expert en JdR. Crée un template JSON pour le système : ${systemQuery}`;
    
    if (activeProvider === 'gemini') {
      const apiKey = config.apiKey?.trim();
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
      
      const bridgeResponse = await window.appBridge?.ai?.proxyRequest?.(url, 'POST', { 'Content-Type': 'application/json' }, {
        contents: [{ parts: [{ text: systemPrompt }] }],
        generationConfig: { response_mime_type: "application/json" }
      });

      if (bridgeResponse?.ok) {
        const data = bridgeResponse.data as GeminiResponse;
        return JSON.parse(data.candidates?.[0]?.content?.parts?.[0]?.text || "{}");
      }
    }
    return {};
  }

  public async listModels(apiKey: string): Promise<string[]> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    const response = await window.appBridge?.ai?.proxyRequest?.(url, 'GET', {}, {});
    if (response?.ok) {
      const data = response.data as { models?: { name: string }[] };
      return (data.models || []).map((m) => m.name.replace('models/', ''));
    }
    return [];
  }
}

export const aiService = AIService.getInstance();
