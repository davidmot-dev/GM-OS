import { useAIStore } from '../../stores/useAIStore';
import { useSessionOSStore } from '../session/useSessionOSStore';
import { useJournalStore } from '../journal/useJournalStore';
import { useMediaStore } from '../../stores/useMediaStore';
import { ragService } from './RAGService';
import type { AIResponse } from './types';
import type { JournalEvent } from '../journal/types';
import i18n from '../../i18n';

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

/**
 * Service central pour les interactions avec l'IA.
 * Gère plusieurs fournisseurs (Gemini, Anthropic, Ollama) et types de contenu (Texte, Image).
 */
export class AIService {
  private static instance: AIService;

  private constructor() {}

  /**
   * Récupère l'instance unique du AIService (Singleton).
   */
  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  /**
   * Génère une réponse textuelle en utilisant le fournisseur actif.
   * Intègre automatiquement le contexte RAG et les instructions du Persona (Gem).
   * @param prompt Question ou consigne de l'utilisateur.
   * @param customContext Contexte additionnel optionnel.
   * @param gemId Identifiant du Gem (Persona AI) à utiliser.
   * @param ragOptions Options de filtrage pour le moteur RAG.
   * @returns Objet AIResponse contenant le texte et les métadonnées de génération.
   */
  public async generateText(
    prompt: string, 
    customContext?: string, 
    gemId: string = 'sage',
    ragOptions: { systemOnly?: boolean; systemName?: string } = {},
    lite?: boolean
  ): Promise<AIResponse> {
    const { activeProvider, configs } = useAIStore.getState();
    const config = configs[activeProvider];

    if (activeProvider !== 'ollama' && !config.apiKey) {
      throw new Error(`API Key manquante pour le fournisseur ${activeProvider}`);
    }

    const systemPrompt = await this.prepareSystemPrompt(prompt, customContext, gemId, ragOptions, lite);

    if (activeProvider === 'ollama') {
      const model = config.modelId || 'phi3';
      try {
        if (!window.appBridge?.ai?.ollamaChat) throw new Error("Bridge Ollama non disponible.");
        
        const text = await window.appBridge.ai.ollamaChat(model, [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ]);
        
        return { text, metadata: { provider: 'ollama', model } };
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        if (message.includes('Ollama est inaccessible')) {
          throw error; // Transmettre l'erreur déjà formatée par le backend
        }
        throw new Error(`Erreur Connexion Ollama: ${message}`);
      }
    }

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

    if (activeProvider === 'anthropic') {
      const apiKey = config.apiKey?.trim();
      if (!apiKey) throw new Error("Clé API Anthropic non configurée.");
      const model = config.modelId || 'claude-3-5-sonnet-latest';
      const url = `https://api.anthropic.com/v1/messages`;
      
      if (!window.appBridge?.ai?.proxyRequest) throw new Error("Bridge AI non disponible.");

      try {
        const bridgeResponse = await window.appBridge.ai.proxyRequest(url, 'POST', {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        }, {
          model,
          max_tokens: 4096,
          messages: [
            { role: 'user', content: `${systemPrompt}\n\nUtilisateur: ${prompt}` }
          ]
        });

        if (!bridgeResponse.ok) {
          const errorData = (bridgeResponse.data as { error?: { message?: string } }) || {};
          throw new Error(`Erreur API Anthropic (${bridgeResponse.status}): ${errorData.error?.message || bridgeResponse.statusText}`);
        }

        const data = bridgeResponse.data as { content: { type: string; text: string }[] };
        const textElement = data.content?.find(c => c.type === 'text');
        const text = textElement?.text || "Pas de réponse.";
        return { text, metadata: { provider: 'anthropic', model } };
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(message || "Erreur Anthropic inconnue.");
      }
    }

    return {
      text: `[Simulation ${activeProvider}] Réponse basée sur le contexte RAG récupéré (${ragContext.length} chars).`,
      metadata: { provider: activeProvider, model: config.modelId }
    };
  }

  /**
   * Génère un résumé narratif d'une session à partir des événements du journal.
   * @param events Liste des événements chronologiques de la session.
   * @returns Le résumé narratif généré (Markdown).
   */
  public async summarizeSession(events: JournalEvent[]): Promise<string> {
    const { activeProvider, configs } = useAIStore.getState();
    const config = configs[activeProvider];

    if (!config.apiKey && activeProvider !== 'ollama') {
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

    const summaryPrompt = i18n.language === 'fr' 
      ? `En tant que Chroniqueur Expert, transforme ces logs de session de jeu de rôle en un résumé narratif captivant.
    Les événements sont chronologiques. Crée un récit fluide, avec des titres de sections, des moments forts et des développements d'intrigue.
    
    ${activeJournal?.finalNote ? `IMPORTANT - NOTE FINALE DU MJ :\n"${activeJournal.finalNote}"\nPrends bien en compte ces notes pour conclure le résumé.` : ''}
 

    LOGS DE LA SESSION :
    ${eventLog}
    
    RÉSUMÉ FINAL :`
      : `As an Expert Chronicler, transform these role-playing session logs into a compelling narrative summary.
    Events are chronological. Create a fluid narrative with section titles, highlights, and plot developments.
    
    ${activeJournal?.finalNote ? `IMPORTANT - GM FINAL NOTE:\n"${activeJournal.finalNote}"\nTake these notes into account to conclude the summary.` : ''}
 

    SESSION LOGS:
    ${eventLog}
    
    FINAL SUMMARY:`;

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

  /**
   * Génère une image à partir d'un prompt textuel.
   * Tente d'abord Ollama Local (Flux), puis Z-Image (HuggingFace), et enfin Gemini en fallback.
   * @param prompt Description visuelle détaillée.
   * @param aspectRatio Ratio d'aspect (ex: "1:1", "16:9"). Supporté par Z-Image.
   * @returns URL de l'image (Locale via bridge, Data URI ou Placeholder Dicebear).
   */
  public async generateImage(prompt: string, aspectRatio?: string): Promise<string> {
    const { activeProvider, configs } = useAIStore.getState();
    const config = configs[activeProvider];

    try {
      // 0. TENTATIVE OLLAMA LOCAL FLUX (Si actif)
      if (activeProvider === 'ollama') {
        try {
          let model = config.modelId || 'flux';
          // Force flux if a text model is used for image generation
          const isTextModel = model.includes('phi') || model.includes('gemma') || model.includes('mistral') || model.includes('llama');
          if (isTextModel) {
             console.log(`[AI Service] Modèle texte détecté (${model}), redirection vers Flux pour l'image...`);
             model = 'x/flux2-klein:latest'; // Default standard flux identified in user tags
          }

          console.log(`[AI Service] Envoi de la requête Ollama Image (Modèle: ${model})...`);
          if (!window.appBridge?.ai?.ollamaGenerateImage) throw new Error("Bridge Ollama Generate Image non disponible.");
          
          const base64Response = await window.appBridge.ai.ollamaGenerateImage(model, prompt);
          
          if (base64Response) {
             let base64Data = base64Response;
             // Si Ollama encapsule le base64 dans du markdown (ex: ![image](data:image/png;base64,iVBOR...))
             const markdownMatch = base64Response.match(/data:image\/[^;]+;base64,([a-zA-Z0-9+/=]+)/);
             if (markdownMatch) {
                 base64Data = markdownMatch[1];
             }
             
             // Decodage base64 robuste
             const binaryString = atob(base64Data);
             const uint8Array = new Uint8Array(binaryString.length);
             for (let i = 0; i < binaryString.length; i++) {
                 uint8Array[i] = binaryString.charCodeAt(i);
             }

             if (uint8Array.byteLength > 1000) {
                 const fileName = `ollama_flux_${Date.now()}.png`;
                 if (window.appBridge?.npc?.saveAvatar) {
                     const bufferCopy = (uint8Array.buffer as ArrayBuffer).slice(0);
                     const localUrl = await window.appBridge.npc.saveAvatar(bufferCopy, fileName);
                     
                     try {
                         const { useMediaStore } = await import('../../stores/useMediaStore');
                         const addMedia = useMediaStore.getState().addMedia;
                         const blob = new Blob([uint8Array], { type: 'image/png' });
                         const file = new File([blob], fileName, { type: 'image/png' });
                         await addMedia(file, ['AI Generated', 'Local Flux']);
                     } catch (err) {
                         console.warn("[AI Service] Media hub registration failed for Ollama:", err);
                     }
                     if (localUrl) return localUrl;
                 }
                 return `data:image/png;base64,${base64Data}`;
             }
          }
        } catch (ollamaErr) {
             console.error("[AI Service] Ollama image generation failed, checking fallbacks...", ollamaErr);
        }
      }

      // 1. TENTATIVE Z-IMAGE (HuggingFace Space via Gradio)
      try {
        console.log(`[AI Service] Tentative de génération via Z-Image (HuggingFace Space)...`);
        const { Client } = await import('@gradio/client');
        
        // Utilisation du token fourni par l'environnement
        const env = (import.meta as unknown as { env: Record<string, string> }).env;
        const hfToken = env?.VITE_HF_TOKEN || ''; 
        
        const client = await Client.connect('https://mrfakename-z-image-turbo.hf.space', { hf_token: hfToken } as any);
        
        // Paramètres Z-Image : prompt, height, width, num_inference_steps, seed, randomize_seed
        const isLandscape = aspectRatio === '16:9';
        const result = await client.predict('/generate_image', { 
            prompt: prompt,
            height: isLandscape ? 768 : 1024,
            width: isLandscape ? 1344 : 1024,
            num_inference_steps: 4, // Rapide
            seed: 42,
            randomize_seed: true
        });

        const resultData = result.data as { url: string }[];
        const imageUrl = resultData[0]?.url;

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
                const activeCampaignId = useSessionOSStore.getState().activeCampaignId;
                const blob = new Blob([uint8Array], { type: mimeType });
                const file = new File([blob], fileName, { type: mimeType });
                await addMedia(file, ['AI Generated', 'NPC Portrait'], activeCampaignId ? [activeCampaignId] : []);
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
        console.log(`[AI Service] Z-Image n'a pas retourné d'URL fluide. Passage à Gemini...`);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.warn(`[AI Service] Z-Image (HF Space) indisponible ou en échec (${message}). Passage à Gemini...`);
      }

      // 2. FALLBACK GEMINI 2.5 FLASH IMAGE
      const geminiConfig = configs['gemini'] as { apiKey?: string };
      const apiKey = geminiConfig?.apiKey;
      
      if (!apiKey) {
        throw new Error("Clé API Gemini manquante pour fallback.");
      }

      console.log(`[AI Service] Generating image with Gemini 2.5 Flash...`);
      
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${apiKey}`;
      
      const payload = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { response_modalities: ["IMAGE"] }
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
          const activeCampaignId = useSessionOSStore.getState().activeCampaignId;
          const blob = new Blob([uint8Array], { type: mimeType || 'image/png' });
          const file = new File([blob], fileName, { type: mimeType || 'image/png' });
          await addMedia(file, ['AI Generated', 'NPC Portrait'], activeCampaignId ? [activeCampaignId] : []);
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

  /**
   * Génère un template structuré de fiche de personnage (JSON) à partir d'un système.
   * @param systemQuery Nom ou description du système de jeu.
   * @returns Le template de fiche partiel.
   */
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

  /**
   * Liste les modèles disponibles pour une clé API Gemini.
   * @param apiKey Clé API Google Gemini.
   * @returns Liste des IDs de modèles.
   */
  public async listModels(apiKey: string): Promise<string[]> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    const response = await window.appBridge?.ai?.proxyRequest?.(url, 'GET', {}, {}) as { ok: boolean; data: { models?: { name: string }[] } };
    if (response?.ok) {
      const data = response.data;
      return (data.models || []).map((m) => m.name.replace('models/', ''));
    }
    return [];
  }

  /**
   * Enrichit les attributs d'un PNJ ou lieu de manière narrative.
   * @param fields Champs originaux (clé: valeur).
   * @param category Catégorie (Personnage, Lieu, etc.).
   * @param universe Univers ou Lore parent.
   * @returns Champs enrichis narratifs.
   */
  public async enrichNPCEntity(fields: Record<string, string>, category: string, universe: string): Promise<Record<string, string>> {
     const fieldsPrompt = Object.entries(fields).map(([k, v]) => `${k}: ${v}`).join('\n');
     const prompt = i18n.language === 'fr'
       ? `Voici les attributs d'un(e) [${category}] dans l'univers [${universe}]. 
     TACHE : Améliore ces descriptions pour les rendre immersives, narratives et riches en détails.
     RÈGLES :
     1. Garde EXACTEMENT les mêmes noms de clés (labels).
     2. Réponds UNIQUEMENT avec un objet JSON valide contenant les clés originales et les nouvelles valeurs enrichies en français.
     3. Ne déforme pas l'essence de l'attribut original mais rend-le "vivant".
     
     ATTRIBUTS BRUTS :
     ${fieldsPrompt}`
       : `Here are the attributes of a [${category}] in the [${universe}] universe.
     TASK: Improve these descriptions to make them immersive, narrative, and rich in detail.
     RULES:
     1. Keep EXACTLY the same key names (labels).
     2. Answer ONLY with a valid JSON object containing the original keys and the new enriched values in English.
     3. Do not distort the essence of the original attribute but make it "alive".
     
     RAW ATTRIBUTES:
     ${fieldsPrompt}`;

     try {
       const response = await this.generateText(prompt, "Tu es un assistant de création narrative expert. Réponds exclusivement en JSON pur.");
       // Extraction du JSON au cas où l'IA ajoute du texte avant/après
       const jsonMatch = response.text.match(/\{[\s\S]*\}/);
       if (jsonMatch) {
         return JSON.parse(jsonMatch[0]);
       }
       return fields;
     } catch (err) {
       console.error("[AIService] Enrichment failed:", err);
       return fields;
     }
  }

  /**
   * Suggère un prompt visuel détaillé destiné aux générateurs d'images.
   * @param name Nom de l'entité.
   * @param fields Attributs descriptifs.
   * @param category Catégorie (Personnage, Lieu).
   * @param universe Univers de référence.
   * @returns Prompt en anglais pour IA génératrice d'image.
   */
  public async suggestNPCImagePrompt(name: string, fields: Record<string, string>, category: string, universe: string): Promise<string> {
    const fieldsText = Object.values(fields).join(', ');
    const prompt = `Basé sur ce personnage/lieu nommé "${name}" (${category}) dans l'univers "${universe}" :
    Description : ${fieldsText}
    
    TACHE : Génère un prompt visuel détaillé en ANGLAIS pour un moteur de génération d'images IA (type Flux/Stable Diffusion).
    RÈGLES :
    1. Sois très précis sur le style (digital art, cinematic lighting, etc.).
    2. Décris l'apparence, les vêtements, l'ambiance et l'arrière-plan.
    3. Réponds UNIQUEMENT avec le prompt final en anglais.
    
    PROMPT VISUEL :`;

    try {
      const response = await this.generateText(prompt, "Tu es un expert en prompting d'images pour IA. Réponds uniquement avec le prompt en anglais.");
      return response.text.trim();
    } catch (err) {
      console.error("[AIService] Prompt suggestion failed:", err);
      return "";
    }
  }

  /**
   * Génère une réponse textuelle en streaming (Ollama focus).
   */
  public async generateTextStream(
    prompt: string,
    onToken: (token: string) => void,
    onStatusUpdate?: (status: string) => void,
    gemId: string = 'sage',
    ragOptions: { systemOnly?: boolean; systemName?: string } = {}
  ): Promise<void> {
    const { activeProvider, configs, streamEnabled } = useAIStore.getState();
    const config = configs[activeProvider];

    if (!streamEnabled || activeProvider !== 'ollama') {
       onStatusUpdate?.("Mode bloquant actif...");
       const resp = await this.generateText(prompt, undefined, gemId, ragOptions);
       onToken(resp.text);
       return;
    }

    onStatusUpdate?.("Analyses tactiques & grimoires...");
    const systemPrompt = await this.prepareSystemPrompt(prompt, undefined, gemId, ragOptions);

    onStatusUpdate?.("Réception de la vision...");
    
    if (activeProvider === 'ollama') {
      const model = config.modelId || 'phi3';
      if (!window.appBridge?.ai?.ollamaChatStream) throw new Error("Bridge Ollama Stream non disponible.");
      
      const unsubscribe = window.appBridge.ai.onStreamToken((token) => {
        onToken(token);
      });

      try {
        await window.appBridge.ai.ollamaChatStream(model, [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ]);
      } finally {
        unsubscribe();
      }
    }
  }

  /**
   * Prépare le prompt système complet en fonction du contexte.
   */
  public async prepareSystemPrompt(
    prompt: string,
    customContext?: string,
    gemId: string = 'sage',
    ragOptions: { systemOnly?: boolean; systemName?: string } = {},
    lite?: boolean
  ): Promise<string> {
    const aiStore = useAIStore.getState();
    const isLite = lite !== undefined ? lite : aiStore.liteContext;
    
    // Si mode lite forcé, on limite drastiquement le RAG ou on le shunte
    const ragContext = isLite 
      ? (ragOptions.systemOnly ? await ragService.getRelevantContext({ ...ragOptions, limit: 1 }) : "")
      : await ragService.getRelevantContext(ragOptions);

    const liveContext = this.getLiveSessionContext(isLite);
    
    const fullContext = `--- CONTEXTE VIVANT (SESSION ACTUELLE) ---
${liveContext}

--- CONTEXTE RAG (RÈGLES ET LORE) ---
${customContext ? `${customContext}\n\n${ragContext}` : ragContext}`;

    const gemStore = (await import('../../stores/useGemStore')).useGemStore.getState();
    const gem = gemStore.gems.find(g => g.id === gemId) || gemStore.gems[0];
    
    const activeCampaign = useSessionOSStore.getState().campaigns.find(c => c.id === useSessionOSStore.getState().activeCampaignId);
    const systemId = activeCampaign?.system?.toLowerCase() || 'generic';

    let personaInstructions = i18n.t(gem.systemOverrides?.[systemId] || gem.baseInstructions);

    try {
      const systemGemsRaw = await window.appBridge?.ai?.readDoc?.(`systems/${systemId}/gems.json`);
      if (systemGemsRaw) {
        const systemGems = JSON.parse(systemGemsRaw);
        if (systemGems[gemId]) personaInstructions = systemGems[gemId];
      }
    } catch { /* ignore */ }

    const { DEFAULT_SHEET_TEMPLATES } = await import('../../data/defaultSheetTemplates');
    const allTemplates = [...DEFAULT_SHEET_TEMPLATES, ...useSessionOSStore.getState().customSheetTemplates];
    const sheetTemplate = allTemplates.find(t => t.id === systemId);
    if (sheetTemplate?.aiPersonas?.[gemId]) {
       personaInstructions = i18n.t(sheetTemplate.aiPersonas[gemId]);
    }

    return `${personaInstructions}

Tu es un assistant de Maître de Jeu expert pour GM-OS. Ton alias actuel est "${i18n.t(gem.name)}".
${i18n.language === 'fr' 
      ? 'Réponds impérativement en français, de manière concise et immersive.' 
      : 'You must answer in English, in a concise and immersive way.'}
${i18n.language === 'fr'
      ? 'Si possible, cite le document source pour les points de règle.'
      : 'If possible, cite the source document for rule points.'}

CONTEXTE RÉCUPÉRÉ (RAG + SESSION) :
${fullContext}

Prompt utilisateur : ${prompt}`;
  }

  /**
   * Génère une réponse structurée (JSON) de manière agnostique.
   * Supporte Gemini (mode JSON natif + Multimodal) et Ollama (via extraction Regex).
   */
  public async generateJSON<T>(
    prompt: string, 
    systemPrompt: string, 
    attachments?: { data: string, mimeType: string }[],
    options: { lite?: boolean } = {}
  ): Promise<T> {
    const { activeProvider, configs } = useAIStore.getState();
    const config = configs[activeProvider];

    console.log(`[AIService] generateJSON call (${activeProvider}) ${attachments?.length ? `with ${attachments.length} attachments` : ''}`);

    // 1. CAS GEMINI (NATIF + VISUEL)
    if (activeProvider === 'gemini') {
      const apiKey = config.apiKey?.trim().replace(/[\r\n]/g, '');
      const model = config.modelId || 'gemini-1.5-flash';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      
      if (!window.appBridge?.ai?.proxyRequest) throw new Error("Bridge AI non disponible.");

      const parts: any[] = [{ text: `${systemPrompt}\n\nREQUÊTE : ${prompt}` }];
      
      if (attachments && attachments.length > 0) {
        attachments.forEach(attachment => {
          parts.push({
            inline_data: {
              mime_type: attachment.mimeType,
              data: attachment.data
            }
          });
        });
      }

      const response = await window.appBridge.ai.proxyRequest(url, 'POST', { 'Content-Type': 'application/json' }, {
        contents: [{ parts }],
        generationConfig: { 
          response_mime_type: "application/json",
          temperature: 0.2
        }
      });

      if (!response.ok) {
        throw new Error(`Erreur API Gemini JSON: ${response.statusText}`);
      }

      const data = response.data as GeminiResponse;
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error("Réponse JSON vide de Gemini.");
      
      return JSON.parse(text) as T;
    }

    // 2. CAS OLLAMA / ANTHROPIC / AUTRES (EXTRACTION)
    const enhancedSystemPrompt = `${systemPrompt}
    
    IMPORTANT : Tu dois répondre UNIQUEMENT avec un bloc JSON valide. 
    Ne fournis aucune explication, aucun commentaire ni aucun bloc de code Markdown autour du JSON.
    Ta réponse doit commencer par { ou [ et se terminer par } ou ].`;

    const response = await this.generateText(prompt, enhancedSystemPrompt, 'sage', {}, options.lite);
    
    try {
      return this.extractStructuredJSON<T>(response.text);
    } catch (err) {
      console.error("[AIService] Extraction JSON échouée. Tentative de parsing brut...", err);
      try {
        return JSON.parse(response.text) as T;
      } catch {
        throw new Error("Impossible de parser la réponse en JSON.");
      }
    }
  }

  /**
   * Extrait un bloc JSON d'une chaîne de texte potentiellement polluée.
   */
  private extractStructuredJSON<T>(input: string): T {
    // Nettoyage des balises markdown si présentes
    const cleaned = input.replace(/```json/g, '').replace(/```/g, '').trim();
    
    // Recherche de la structure JSON la plus large possible
    const jsonMatch = cleaned.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    
    if (!jsonMatch) {
      console.error("[AIService] Échec d'extraction JSON. Réponse brute (début):", input.substring(0, 300));
      throw new Error("Aucun bloc JSON détecté dans la chaîne. Le modèle a peut-être renvoyé du texte conversationnel au lieu de données structurées.");
    }
    
    const jsonStr = jsonMatch[0];
    try {
      return JSON.parse(jsonStr) as T;
    } catch (parseError) {
      console.error("[AIService] Erreur de parsing du JSON extrait:", jsonStr.substring(0, 300));
      throw parseError;
    }
  }

  /**
   * Extrait les données dynamiques des stores pour fournir un contexte "Vivant" à l'IA.
   */
  private getLiveSessionContext(lite: boolean = false): string {
    try {
      const osStore = useSessionOSStore.getState();
      const journalStore = useJournalStore.getState();
      const activeCampaignId = osStore.activeCampaignId;

      if (!activeCampaignId) return "Aucune campagne active.";

      const campaign = osStore.campaigns.find(c => c.id === activeCampaignId);
      
      // 1. Personnages Joueurs (Vitals & Info)
      const party = osStore.players.flatMap(p => p.characters)
        .filter(c => c.campaignId === activeCampaignId)
        .map(c => `- ${c.name} (${c.classRace}): HP ${c.hp}/${c.maxHp}${c.description && !lite ? ` - ${c.description}` : ''}`);

      // 2. PNJs / Entités actives (Limit in lite mode)
      let entitiesBase = osStore.entities.filter(e => e.campaignId === activeCampaignId && e.status === 'alive');
      if (lite) entitiesBase = entitiesBase.slice(0, 5);

      const npcs = entitiesBase.map(e => `- ${e.name} (${e.role})${!lite ? `: ${e.description}` : ''}`);

      // 3. Indices (uniquement révélés) - Skip in lite mode unless explicit
      const clues = lite ? [] : (osStore.clues || [])
        .filter(c => c.campaignId === activeCampaignId && c.isRevealed)
        .map(c => `- ${c.title}: ${c.content}`);

      // 4. Événements récents (Journal/Chronique)
      const lastEvents = (journalStore.journals.find(j => j.id === journalStore.activeJournalId)?.events || [])
        .slice(lite ? -3 : -10) // 10 derniers événements (ou 3 en lite)
        .map(e => `[${new Date(e.timestamp).toLocaleTimeString('fr-FR')}] ${e.title}: ${e.content}`);

      return `## Campagne: ${campaign?.name || "Inconnue"}
${campaign?.synopsis ? `Synopsis: ${campaign.synopsis}\n` : ''}

### Groupe (PJ)
${party.length > 0 ? party.join('\n') : "Aucun personnage joueur actif."}

### PNJs & Alliés
${npcs.length > 0 ? npcs.join('\n') : "Aucun PNJ notable recensé."}

### Indices Révélés
${clues.length > 0 ? clues.join('\n') : "Aucun indice découvert pour le moment."}

### Historique Récent (Chronologie)
${lastEvents.length > 0 ? lastEvents.join('\n') : "Aucun événement récent dans la chronique."}
`;
    } catch (err) {
      console.error("[AIService] Failed to gather live context:", err);
      return "Erreur lors de la récupération du contexte session.";
    }
  }
}

export const aiService = AIService.getInstance();
