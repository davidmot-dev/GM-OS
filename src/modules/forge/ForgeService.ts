import type { GameDriver } from '../../types/drivers';
import type { SheetTemplate } from '../../data/defaultSheetTemplates';

export class ForgeService {
  private static instance: ForgeService;

  public static getInstance(): ForgeService {
    if (!ForgeService.instance) {
      ForgeService.instance = new ForgeService();
    }
    return ForgeService.instance;
  }

  /**
   * Generates a GameDriver from a rulebook Text using Gemini 1.5 Pro.
   */
  public async analyzeRulebookText(text: string, userInstructions?: string): Promise<Partial<GameDriver>> {
    const prompt = this.getRulebookPrompt(userInstructions);
    return (await this.callForgeAI(prompt, undefined, undefined, text)) as Partial<GameDriver>;
  }

  private getRulebookPrompt(userInstructions?: string): string {
    return `
      Tu es l'ingénieur en chef de la Forge GM-OS, agissant en mode **🧠 CERVEAU (Logic & Rules)**.
      Ton seul objectif est d'analyser ce document de règles de jeu de rôle pour en extraire la logique système pure.
      Ignore la mise en page visuelle et concentre-toi sur les mécaniques, les dés et les statistiques de combat.
      Le document peut être du texte brut, du Markdown, ou du JSON/JSONL contenant des données de règles.

      ${userInstructions ? `INSTRUCTIONS SPÉCIFIQUES DE L'UTILISATEUR (À RESPECTER EN PRIORITÉ) :
      "${userInstructions}"
      ` : ''}

      Instructions critiques :
      1. Identifie le nom du système, l'auteur et l'ambiance.
      2. Analyse les mécaniques de dés (ex: 1d20 + bonus vs DC, ou d100 sous compétence).
      3. Détermine quels champs de fiche de personnage sont essentiels pour le combat (HP, MP, Initiative).
      4. Rédige des "aiInstructions" courtes mais précises pour qu'un autre assistant puisse simuler ce MJ.

      Format de sortie JSON obligatoire :
      {
        "name": "Nom du Système",
        "description": "Courte description",
        "emoji": "🎲",
        "dice": {
          "defaultDice": "1d20",
          "logic": "sum | highest | d100-low",
          "critRange": 20
        },
        "combat": {
          "statsToTrack": [
            { "fieldId": "hp", "label": "Points de Vie", "isMainHP": true, "isResource": false }
          ],
          "initiativeFormula": "dex"
        },
        "aiInstructions": "Tu es un MJ expert de [Système]..."
      }
    `;
  }

  /**
   * Generates a GameDriver from a rulebook PDF/Text using Gemini 1.5 Pro.
   */
  public async analyzeRulebook(fileBase64: string, mimeType: string, userInstructions?: string): Promise<Partial<GameDriver>> {
    const prompt = this.getRulebookPrompt(userInstructions);
    return (await this.callForgeAI(prompt, fileBase64, mimeType)) as Partial<GameDriver>;
  }

  private getSheetPrompt(userInstructions?: string): string {
    return `
      Tu es l'ingénieur en chef de la Forge GM-OS, agissant en mode **👕 CORPS (Layout & Fields)**.
      Ton rôle est d'analyser ce document pour générer une structure de template de fiche (UI) GM-OS v5.
      Ignore les règles complexes de calcul de dés et concentre-toi sur l'extraction tous les champs (nom, caractéristiques, compétences, inventaire) à regrouper par sections logiques.
      Si le document est en JSON/JSONL, sers-toi de la structure existante pour nommer précisément les champs.

      ${userInstructions ? `INSTRUCTIONS SPÉCIFIQUES DE L'UTILISATEUR (À RESPECTER EN PRIORITÉ) :
      "${userInstructions}"
      ` : ''}

      Format de sortie JSON obligatoire :
      {
        "name": "Nom du Template",
        "emoji": "📜",
        "sections": [
          {
            "id": "identite",
            "label": "Identité",
            "fields": [
              { "id": "nom", "label": "Nom", "type": "text", "defaultValue": "" },
              { "id": "force", "label": "Force", "type": "number", "defaultValue": 10 }
            ]
          }
        ]
      }
    `;
  }

  /**
   * Generates a Character Sheet Template from an image/PDF.
   */
  public async analyzeCharacterSheet(fileBase64: string, mimeType: string, userInstructions?: string): Promise<Partial<SheetTemplate>> {
    const prompt = this.getSheetPrompt(userInstructions);
    return (await this.callForgeAI(prompt, fileBase64, mimeType)) as Partial<SheetTemplate>;
  }

  public async analyzeCharacterSheetText(text: string, userInstructions?: string): Promise<Partial<SheetTemplate>> {
    const prompt = this.getSheetPrompt(userInstructions);
    return (await this.callForgeAI(prompt, undefined, undefined, text)) as Partial<SheetTemplate>;
  }

  private async callForgeAI(prompt: string, fileBase64?: string, mimeType?: string, rawText?: string): Promise<unknown> {
    if (!window.appBridge?.ai?.proxyRequest) {
      throw new Error("AI Bridge not available");
    }

    // Prepare the parts for Gemini
    const parts: { text?: string; inline_data?: { mime_type: string; data: string } }[] = [{ text: prompt }];

    if (rawText) {
      parts.push({ text: `CONTENU DU DOCUMENT À ANALYSER :\n\n${rawText}` });
    } else if (fileBase64 && mimeType) {
      parts.push({
        inline_data: {
          mime_type: mimeType,
          data: fileBase64
        }
      });
    } else {
      throw new Error("No content provided for analysis.");
    }

    const body = {
      contents: [{ parts }],
      generationConfig: {
        response_mime_type: "application/json"
      }
    };

    // Note: We'll need the API Key from the store, but usually the proxy should handle it 
    // or we pass it if required. Since main.ts expects the full URL, we construct it here
    // based on our knowledge of the proxy handler.
    
    // For now, assuming the proxy handles the API key and base URL selection 
    // or we're using a specific endpoint. 
    // Use the model and API Key from the AI store
    const { configs } = (await import('../../stores/useAIStore')).useAIStore.getState();
    const config = configs.gemini;
    const modelId = config.modelId || 'gemini-1.5-flash';
    const apiKey = config.apiKey?.trim().replace(/[\r\n]/g, '');

    if (!apiKey) {
      throw new Error("Clé API Gemini manquante. Veuillez la configurer dans les paramètres IA.");
    }
    
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`;
    const headers = { 'Content-Type': 'application/json' };

    try {
      const response = await window.appBridge.ai.proxyRequest(url, 'POST', headers, body);
      
      if (!response.ok) {
        throw new Error(`AI Forge Error: ${response.statusText}`);
      }

      const data = response.data as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
      const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!textResponse) {
        throw new Error("Empty response from AI Forge");
      }

      return JSON.parse(textResponse);
    } catch (error) {
      console.error("[Forge Service] AI Call failed:", error);
      throw error;
    }
  }
}

export const forgeService = ForgeService.getInstance();
