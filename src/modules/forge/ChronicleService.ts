import type { Campaign, Entity, AtlasMap, WikiEntry, EntityRelation } from '../session/useSessionOSStore';
import type { GameDriver } from '../../types/drivers';
import type { ForgeContextItem } from './ForgeService';

export interface ChronicleForgeResult {
  campaign: Partial<Campaign>;
  entities: (Partial<Entity> & { relations?: { targetName: string; type: EntityRelation['type']; description: string }[] })[];
  locations: Partial<AtlasMap>[];
  lore: Partial<WikiEntry>[];
}

export class ChronicleForgeService {
  private static instance: ChronicleForgeService;

  public static getInstance(): ChronicleForgeService {
    if (!ChronicleForgeService.instance) {
      ChronicleForgeService.instance = new ChronicleForgeService();
    }
    return ChronicleForgeService.instance;
  }

  /**
   * Generates a complete narrative construct (Campaign, NPCs, Locations, Lore) using Gemini.
   */
  public async forgeChronicle(items: ForgeContextItem[], systemDriver: GameDriver, userInstructions?: string, targetName?: string): Promise<ChronicleForgeResult> {
    const prompt = this.getChroniclePrompt(systemDriver, userInstructions, targetName);
    
    // Aggregate items into Gemini parts
    const parts: Array<{ text?: string, inline_data?: { mime_type: string, data: string } }> = [{ text: prompt }];
    
    items.forEach(item => {
      if (item.type === 'text') {
        parts.push({ text: `DOCUMENT NARRATIF [${item.name}] :\n\n${item.content}` });
      } else {
        parts.push({
          inline_data: {
            mime_type: item.mimeType || 'application/pdf',
            data: item.content
          }
        });
      }
    });

    const body = {
      contents: [{ parts }],
      generationConfig: {
        response_mime_type: "application/json"
      }
    };

    const response = await this.callChronicleAIRaw(body);
    return response as ChronicleForgeResult;
  }

  private getChroniclePrompt(driver: GameDriver, userInstructions?: string, targetName?: string): string {
    const systemContext = `
      SYSTÈME DE JEU ACTIF : ${driver.name}
      LOGIQUE DE DÉS : ${driver.dice.logic} (${driver.dice.defaultDice})
      STATS À SUIVRE : ${driver.combat.statsToTrack.map(s => s.label).join(', ')}
    `;

    return `
      Tu es l'archiviste légendaire de la Forge GM-OS, agissant en mode **📖 CHRONICLE ARCHITECT**.
      Ton objectif est d'extraire et de structurer une campagne de jeu de rôle complète à partir des documents fournis.

      ${targetName ? `MODE ENRICHISSEMENT : L'utilisateur souhaite enrichir la campagne existante nommée "${targetName}". Ajoute de nouvelles intrigues, NPCs ou lieux qui s'intègrent naturellement à cet univers existant.` : 'MODE CRÉATION : Génère une nouvelle campagne complète.'}

      ${systemContext}

      ${userInstructions ? `CONSIGNES NARRATIVES PRIORITAIRES : "${userInstructions}"` : ''}

      Tu dois produire un JSON structuré contenant les objets suivants :
      1. "campaign" : Résumé global, synopsis et ambiance.
      2. "entities" : NPCs et Monstres clés. Utilise l'échelle de puissance du système ${driver.name}.
         - Remplis "hp", "ac", "speed", "initiative" en fonction du Driver.
         - Ajoute des "roleplayingNotes" (comment les jouer) et "gmSecretInfo".
         - **FACTION** : Si l'entité appartient à une organisation, une guilde ou une alliance, spécifie-le ("faction").
         - **RELATIONS** : Identifie les liens entre les personnages. Ajoute un champ "relations" : tableau de { "targetName": "Nom", "type": "ally | neutral | hostile | family | romantic | mentor | rival | other", "description": "Lien précis" }.
      3. "locations" : Lieux majeurs pour l'Atlas.
         - "name", "narrativeDescription" (pour les joueurs), "gmNotes" (secrets du lieu).
      4. "lore" : Entrées wiki pour enrichir l'univers.
         - Catégories possibles : 'npc', 'location', 'organization', 'lore', 'item', 'clue', 'rumor'.
         - Les rumeurs et les indices doivent être particulièrement bien détaillés.

      FORMAT DE SORTIE JSON ATTENDU :
      {
        "campaign": {
          "name": "Titre",
          "description": "Pitch court",
          "synopsis": "Résumé détaillé de l'intrigue"
        },
        "entities": [
          {
            "name": "Nom",
            "type": "npc | monster",
            "role": "ally | neutral | hostile | boss",
            "hp": 10,
            "ac": 10,
            "description": "Race / Classe",
            "faction": "Garde Royale | Clan du Loup | etc.",
            "roleplayingNotes": "...",
            "gmSecretInfo": "...",
            "relations": [
              { "targetName": "Nom de l'autre personnage", "type": "family", "description": "Frère de..." }
            ]
          }
        ],
        "locations": [
          {
            "name": "Nom du lieu",
            "type": "battlemap | world-map | region | city | dungeon",
            "narrativeDescription": "...",
            "gmNotes": "..."
          }
        ],
        "lore": [
          {
            "title": "Nom de l'entrée",
            "content": "Description Markdown",
            "category": "clue | rumor | lore | ...",
            "tags": ["tag1", "tag2"]
          }
        ]
      }
    `;
  }

  private async callChronicleAIRaw(body: { contents: Array<{ parts: Array<{ text?: string, inline_data?: { mime_type: string, data: string } }> }>, generationConfig?: { response_mime_type: string } }): Promise<unknown> {
    if (!window.appBridge?.ai?.proxyRequest) {
      throw new Error("AI Bridge not available");
    }

    const { configs } = (await import('../../stores/useAIStore')).useAIStore.getState();
    const config = configs.gemini;
    const modelId = config.modelId || 'gemini-1.5-pro';
    const apiKey = config.apiKey?.trim().replace(/[\r\n]/g, '');

    if (!apiKey) {
      throw new Error("Clé API Gemini manquante. Veuillez la configurer dans les paramètres IA.");
    }
    
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`;
    const headers = { 'Content-Type': 'application/json' };

    try {
      const payloadSize = JSON.stringify(body).length;
      console.log(`[Chronicle Service] Sending AI request (${(payloadSize / 1024 / 1024).toFixed(2)} MB)...`);
      
      const response = await window.appBridge.ai.proxyRequest(url, 'POST', headers, body);
      
      if (!response.ok) {
        throw new Error(`AI Chronicle Error: ${response.statusText}`);
      }

      const data = response.data as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
      const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!textResponse) {
        throw new Error("Empty response from AI Chronicle");
      }

      return JSON.parse(textResponse);
    } catch (error) {
      console.error("[Chronicle Service] AI Call failed:", error);
      throw error;
    }
  }
}

export const chronicleForgeService = ChronicleForgeService.getInstance();
