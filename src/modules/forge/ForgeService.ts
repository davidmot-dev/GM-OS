import { AIService } from '../ai/AIService';
import { useAIStore } from '../../stores/useAIStore';
import type { GameDriver } from '../../types/drivers';
import type { SheetTemplate } from '../../data/defaultSheetTemplates';
import type { BrainstormCandidate, BrainstormCard } from './rules/types';

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

    // 1. PRÉPARATION DU CONTENU (Capé pour éviter les surcharges)
    let consolidatedText = "";
    const attachments: { data: string, mimeType: string }[] = [];
    const MAX_TEXT_CHARS = 100000;
    const MAX_ATTACHMENTS = 5;

    items.forEach(item => {
      if (item.type === 'text') {
        if (consolidatedText.length < MAX_TEXT_CHARS) {
          consolidatedText += `\n\nCONTENU DU DOCUMENT [${item.name}] :\n\n${item.content}`;
        }
      } else if (attachments.length < MAX_ATTACHMENTS) {
        attachments.push({
          data: item.content,
          mimeType: item.mimeType || 'application/pdf'
        });
      }
    });

    if (consolidatedText.length >= MAX_TEXT_CHARS) {
      console.warn("[ForgeService] Context text truncated to 100k chars.");
      consolidatedText = consolidatedText.substring(0, MAX_TEXT_CHARS) + "\n\n[TEXTE TRONQUÉ POUR SURCHARGE]";
    }

    // 2. VÉRIFICATION DE CAPACITÉ VISUELLE
    if (attachments.length > 0 && activeProvider !== 'gemini') {
      throw new Error("Gemma 4 ne supporte pas l'analyse visuelle de multiples fichiers. Veuillez utiliser NotebookLM pour extraire le texte au préalable.");
    }

    const fullPrompt = `${consolidatedText}\n\nINSTRUCTIONS FINALES : ${prompt}`;
    const systemPrompt = `Tu es l'ingénieur en chef de la Forge GM-OS, agissant en mode **🧠 SYSTEM ENGINEER**. 
    Tu dois générer EXCLUSIVEMENT un objet JSON valide suivant le schéma fourni. 
    Pas de texte avant, pas d'explications après. Si tu ne peux pas générer le système, renvoie un objet vide {}.`;

    console.error(`[ForgeService] Sending request to ${activeProvider} (LITE MODE: ON)...`);
    const result = await aiService.generateJSON<ForgeSystemResult>(fullPrompt, systemPrompt, attachments, { lite: true });
    console.error(`[ForgeService] ${activeProvider} responded!`);
    return result;
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
      console.error(`[ForgeService] Analyzing text with ${activeProvider} (LITE MODE)...`);
      return aiService.generateJSON(fullPrompt, "Tu es un expert en ingénierie de données JdR pour GM-OS. Réponds UNIQUEMENT en JSON pur.", [], { lite: true });
    }

    // 2. CAS DOCUMENT DIRECT (PDF/IMAGE)
    if (fileBase64 && mimeType) {
      // Si on n'est pas sur Gemini, la vision directe n'est pas supportée
      if (activeProvider !== 'gemini') {
        throw new Error("L'analyse visuelle directe n'est supportée que par Gemini. Veuillez utiliser NotebookLM pour extraire le texte.");
      }

      console.error(`[ForgeService] Analyzing visual document with Gemini (LITE MODE)...`);
      return aiService.generateJSON(prompt, "Tu es un expert en analyse de documents JdR. Extrais les données structurées UNIQUEMENT en JSON.", [{
        data: fileBase64,
        mimeType: mimeType
      }], { lite: true });
    }

    throw new Error("Aucun contenu fourni pour l'analyse.");
  }

  /**
   * Scans NotebookLM to discover rule/scenario candidates.
   */
  public async discoverCandidates(notebookId: string, sourceIds?: string[], subject?: string): Promise<BrainstormCandidate[]> {
    const subjectContext = subject ? ` concernant spécifiquement : "${subject}"` : "";
    const prompt = `Analyses les sources de ce notebook et listes 5 à 8 éléments de règles, décisions de MJ ou éléments de scénario intéressants à formaliser${subjectContext}.
    Réponds EXCLUSIVEMENT sous forme d'un tableau JSON d'objets avec les champs : id (slug), title, category ('rule'|'decision'|'memory'|'scenario'), summary, tags (array).`;
    
    const result = await this.callMcpTool<{content: string}>('notebooklm-mcp-server', 'notebook_query', {
      notebook_id: notebookId,
      query: prompt,
      source_ids: sourceIds
    });

    if (!result?.content) throw new Error("Réponse vide de NotebookLM");
    
    try {
      const jsonStr = result.content.match(/\[[\s\S]*\]/)?.[0] || result.content;
      return JSON.parse(jsonStr);
    } catch (e) {
      console.error("Failed to parse candidates JSON", result.content);
      throw new Error("Format JSON invalide reçu de NotebookLM");
    }
  }

  /**
   * Forges a complete card for a specific candidate.
   */
  public async forgeCard(notebookId: string, candidate: BrainstormCandidate, systemId: string, sourceIds?: string[]): Promise<BrainstormCard> {
    const prompt = `Formalises une fiche complète pour l'élément suivant : "${candidate.title}" (Catégorie: ${candidate.category}).
    Le contenu doit être en Markdown riche, structuré, et prêt à être utilisé par un MJ. 
    Inclus des exemples concrets si possible. 
    Si c'est une règle, précise les jets de dés. 
    Réponds EXCLUSIVEMENT avec le contenu Markdown de la fiche.`;
    
    const result = await this.callMcpTool<{content: string}>('notebooklm-mcp-server', 'notebook_query', {
      notebook_id: notebookId,
      query: prompt,
      source_ids: sourceIds // Pass source filters
    });

    if (!result?.content) throw new Error("Réponse vide de NotebookLM");

    return {
      ...candidate,
      content: result.content,
      systemId,
      forgedAt: Date.now()
    };
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

    const isAuthError = (err: any): boolean => {
      if (!err) return false;
      const str = (err?.message || (typeof err === 'string' ? err : JSON.stringify(err))).toLowerCase();
      return str.includes('auth') || str.includes('login') || str.includes('expired') || str.includes('credentials');
    };

    const TIMEOUT_MS = 600000; // 10 minutes

    const callWithTimeout = async (name: string, tool: string, a: any) => {
      return Promise.race([
        mcpBridge.callTool(name, tool, a),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error(`MCP_TIMEOUT: ${name}.${tool} non répondu après 10min.`)), TIMEOUT_MS)
        )
      ]);
    };

    try {
      console.log(`[ForgeService] Calling MCP Tool: ${serverName}.${toolName}`, args);
      const result = await callWithTimeout(serverName, toolName, args);
      
      if (isAuthError(result)) {
        console.warn(`[ForgeService] Auth error detected in result, attempting refresh...`);
        try {
          await callWithTimeout('notebooklm-mcp-server', 'refresh_auth', {});
          await new Promise(resolve => setTimeout(resolve, 2500));
          await callWithTimeout('notebooklm-mcp-server', 'healthcheck', {}).catch(() => {});
        } catch (e) {
          console.warn("[ForgeService] Silent refresh failed", e);
        }
        
        const retryResult = await callWithTimeout(serverName, toolName, args);
        if (isAuthError(retryResult)) {
          throw new Error("MCP_AUTH_EXPIRED: Still expired after refresh.");
        }
        return retryResult as unknown as T;
      }
      
      return result as unknown as T;
    } catch (err: unknown) {
      if (isAuthError(err)) {
        console.warn(`[ForgeService] Auth error detected in catch, attempting refresh...`);
        try {
          await callWithTimeout('notebooklm-mcp-server', 'refresh_auth', {});
          await new Promise(resolve => setTimeout(resolve, 2500));
          await callWithTimeout('notebooklm-mcp-server', 'healthcheck', {}).catch(() => {});
          return await callWithTimeout(serverName, toolName, args) as unknown as T;
        } catch (retryErr) {
          throw new Error("MCP_AUTH_EXPIRED: Recovery failed.");
        }
      }
      throw err;
    }
  }
}

export const forgeService = ForgeService.getInstance();
