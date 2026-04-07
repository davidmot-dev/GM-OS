import { AIService } from '../ai/AIService';
import { useAIStore } from '../../stores/useAIStore';
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
    const aiService = AIService.getInstance();
    const { activeProvider } = useAIStore.getState();

    // 1. PRÉPARATION DU CONTENU
    let consolidatedText = "";
    const attachments: { data: string, mimeType: string }[] = [];

    items.forEach(item => {
      if (item.type === 'text') {
        consolidatedText += `\n\nDOCUMENT NARRATIF [${item.name}] :\n\n${item.content}`;
      } else {
        attachments.push({
          data: item.content,
          mimeType: item.mimeType || 'application/pdf'
        });
      }
    });

    // 2. VÉRIFICATION DE CAPACITÉ VISUELLE
    if (attachments.length > 0 && activeProvider !== 'gemini') {
      throw new Error("Gemma 4 ne supporte pas l'analyse visuelle de multiples documents. Veuillez utiliser NotebookLM pour extraire le texte au préalable.");
    }

    const fullPrompt = `${consolidatedText}\n\nINSTRUCTIONS FINALES : ${prompt}`;
    return aiService.generateJSON<ChronicleForgeResult>(fullPrompt, "Tu es un expert en narration JdR pour GM-OS.", attachments);
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

}

export const chronicleForgeService = ChronicleForgeService.getInstance();
