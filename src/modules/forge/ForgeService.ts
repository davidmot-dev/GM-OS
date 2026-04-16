import { AIService } from '../ai/AIService';
import { useAIStore } from '../../stores/useAIStore';
import type { GameDriver } from '../../types/drivers';
import type { SheetTemplate } from '../../data/defaultSheetTemplates';

export interface ForgeContextItem {
  id?: string;
  name: string;
  type: 'text' | 'pdf' | 'image';
  content: string; // text or base64
  mimeType?: string;
  timestamp?: number;
}

export interface ForgeSystemResult {
  driver: Partial<GameDriver>;
  template: Partial<SheetTemplate>;
}

export class ForgeService {
  private static instance: ForgeService;

  public static getInstance(): ForgeService {
    if (!ForgeService.instance) {
      ForgeService.instance = new ForgeService();
    }
    return ForgeService.instance;
  }

  /**
   * Generates a complete, cohesive system (Driver + Template) from multiple sources.
   */
  public async forgeSystem(items: ForgeContextItem[], userInstructions?: string, targetName?: string): Promise<ForgeSystemResult> {
    const prompt = this.getSystemForgePrompt(userInstructions, targetName);
    const aiService = AIService.getInstance();
    const { activeProvider } = useAIStore.getState();

    // 1. PRÉPARATION DU CONTENU
    let consolidatedText = "";
    const attachments: { data: string, mimeType: string }[] = [];

    items.forEach(item => {
      if (item.type === 'text') {
        consolidatedText += `\n\nCONTENU DU DOCUMENT [${item.name}] :\n\n${item.content}`;
      } else {
        attachments.push({
          data: item.content,
          mimeType: item.mimeType || 'application/pdf'
        });
      }
    });

    // 2. VÉRIFICATION DE CAPACITÉ VISUELLE
    if (attachments.length > 0 && activeProvider !== 'gemini') {
      throw new Error("Gemma 4 ne supporte pas l'analyse visuelle de multiples fichiers. Veuillez utiliser NotebookLM pour extraire le texte au préalable.");
    }

    const fullPrompt = `${consolidatedText}\n\nINSTRUCTIONS FINALES : ${prompt}`;
    return aiService.generateJSON<ForgeSystemResult>(fullPrompt, "Tu es l'ingénieur en chef de la Forge GM-OS.", attachments);
  }

  private getSystemForgePrompt(userInstructions?: string, targetName?: string): string {
    return `
      Tu es l'ingénieur en chef de la Forge GM-OS, agissant en mode **🧠 SYSTEM ENGINEER (End-to-End Generation)**.
      Ton objectif est de créer un système de jeu complet et cohérent (Driver + Fiche) à partir des documents fournis.

      ${targetName ? `MODE ENRICHISSEMENT : L'utilisateur souhaite améliorer le système existant nommé "${targetName}". Appuie-toi sur les bases de ce système pour l'étendre ou l'affiner. Ne réinvente rien qui soit déjà défini, enrichis-le.` : 'MODE CRÉATION : Génère un nouveau système complet.'}

      ${userInstructions ? `CONSIGNES UTILISATEUR PRIORITAIRES : "${userInstructions}"` : ''}

      Tu dois produire un JSON unique contenant deux objets : "driver" et "template".
      RÈGLES DE COHÉRENCE CRITIQUES :
      1. Les IDs des stats dans "driver.combat.statsToTrack" DOIVENT correspondre exactement aux IDs des champs dans "template.sections[].fields[]".
      2. La formule d'initiative dans "driver.combat.initiativeFormula" doit utiliser des IDs de champs définis dans le template.
      3. Le "dice.logic" doit être choisi parmi : 'sum', 'highest', 'lowest', 'count-success', 'd100-low', 'd100-high'.
      4. Génère un "ui_config" cohérent avec l'ambiance :
         - Style 'bar' pour du médieval-fantastique classique.
         - Style 'neon' pour du Cyberpunk / SF.
         - Style 'segmented' pour du rétro, horreur ou systèmes à "boxes".
         - Choisis des couleurs (hex ou classes Tailwind "bg-...") adaptées (ex: vert néon pour Cyberpunk, or pour Fantasy, rouge sang pour Horreur).

      FORMAT DE SORTIE ATTENDU :
      {
        "driver": {
          "name": "Nom du Système",
          "description": "...",
          "emoji": "🎲",
          "dice": { "defaultDice": "1d20", "logic": "sum", "engine": "standard" },
          "combat": {
            "statsToTrack": [ { "fieldId": "hp", "label": "PV", "isMainHP": true, "isResource": false } ],
            "initiativeFormula": "dex",
            "defaultHealthType": "hp"
          },
          "ui_config": {
            "gauges": [
              { "fieldId": "hp", "label": "PV", "color": "bg-emerald-500", "style": "bar" }
            ],
            "initiativeStyle": "list",
            "themeColor": "#10b981"
          },
          "aiInstructions": "Directives pour le MJ IA..."
        },
        "template": {
          "name": "Fiche de Personnage",
          "emoji": "📜",
          "sections": [
            {
              "id": "stats",
              "label": "Statistiques",
              "fields": [
                { "id": "hp", "label": "Points de Vie", "type": "number", "defaultValue": 10 },
                { "id": "dex", "label": "Dextérité", "type": "number", "defaultValue": 10 }
              ]
            }
          ]
        }
      }
    `;
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
      5. Ajoute un "ui_config" esthétique :
         - 'neon' (Cyberpunk/SF), 'bar' (Fantasy), 'segmented' (Retro/Grips).
         - Couleurs vibrantes adaptées à l'ambiance.

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
            "initiativeFormula": "dex",
            "defaultHealthType": "hp | clocks | anatomy"
          },
        "ui_config": {
          "gauges": [
            { "fieldId": "hp", "label": "PV", "color": "bg-red-500", "style": "bar" }
          ],
          "initiativeStyle": "list"
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
    const aiService = AIService.getInstance();
    const { activeProvider } = useAIStore.getState();

    // 1. CAS TEXTE PUR (OU TEXTE EXTRAIT PAR NOTEBOOKLM)
    if (rawText) {
      const fullPrompt = `CONTENU DU DOCUMENT À ANALYSER :\n\n${rawText}\n\nREQUÊTE : ${prompt}`;
      return aiService.generateJSON(fullPrompt, "Tu es un expert en ingénierie de données pour GM-OS.");
    }

    // 2. CAS DOCUMENT DIRECT (PDF/IMAGE)
    if (fileBase64 && mimeType) {
      // Si on n'est pas sur Gemini, la vision directe n'est pas supportée
      if (activeProvider !== 'gemini') {
        throw new Error("Gemma 4 ne supporte pas l'analyse visuelle directe. Veuillez utiliser NotebookLM pour extraire le texte du document au préalable.");
      }

      return aiService.generateJSON(prompt, "Tu es un expert en ingénierie de données pour GM-OS.", [{
        data: fileBase64,
        mimeType: mimeType
      }]);
    }

    throw new Error("Aucun contenu fourni pour l'analyse.");
  }

  /**
   * Encapsulates MCP tool calls with retry logic for authentication.
   * Centralizes Bridge usage for the Forge module.
   */
  public async callMcpTool<T = unknown>(serverName: string, toolName: string, args: Record<string, unknown>): Promise<T> {
    const bridge = window.appBridge;
    if (!bridge?.mcp?.callTool) {
      throw new Error("Bridge MCP not available");
    }
    
    const mcpBridge = bridge.mcp;

    const isAuthError = (res: unknown): boolean => {
      const str = typeof res === 'string' ? res : JSON.stringify(res);
      return str.includes("Authentication expired") || str.includes("RPC Error 16") || str.includes("expired");
    };

    try {
      const result = await mcpBridge.callTool(serverName, toolName, args);
      
      if (isAuthError(result)) {
        // Attempt one-time silent refresh
        await mcpBridge.callTool('notebooklm-mcp-server', 'refresh_auth', {});
        const retryResult = await mcpBridge.callTool(serverName, toolName, args);
        if (isAuthError(retryResult)) {
          throw new Error("MCP_AUTH_EXPIRED: Still expired after refresh.");
        }
        return retryResult as unknown as T;
      }
      
      return result as unknown as T;
    } catch (err: unknown) {
      if (isAuthError(err)) {
        await mcpBridge.callTool('notebooklm-mcp-server', 'refresh_auth', {});
        return await mcpBridge.callTool(serverName, toolName, args) as unknown as T;
      }
      throw err;
    }
  }
}

export const forgeService = ForgeService.getInstance();
