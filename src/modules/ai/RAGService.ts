/** RAG Service — Document Management */
import { useSessionOSStore } from '../session/useSessionOSStore';
import { useObsidianStore } from '../session/useObsidianStore';
import { DEFAULT_SHEET_TEMPLATES } from '../../data/defaultSheetTemplates';

export type DocEntry = {
  name: string;
  path: string;
  type: 'file' | 'directory';
  extension?: string;
  children?: DocEntry[];
};

export class RAGService {
  private static instance: RAGService;
  private cache: Map<string, string> = new Map();

  private constructor() {}

  public static getInstance(): RAGService {
    if (!RAGService.instance) {
      RAGService.instance = new RAGService();
    }
    return RAGService.instance;
  }

  /**
   * Scans the docs directory and returns relevant content based on active session.
   * Leverages the dynamic backend RAG Engine.
   *
   * `query` est la question posée. Sans elle, le moteur ne peut trier que par
   * système, et le choix des fiches à l'intérieur d'un corpus reste arbitraire.
   */
  /**
   * Les fiches retenues au dernier appel, et leur état de relecture.
   *
   * **Pourquoi un état plutôt qu'un retour.** `getRelevantContext` rend une
   * chaîne, et deux appelants la consomment comme telle depuis des mois ; en
   * faire un objet obligerait à les toucher pour un besoin qui n'est pas le
   * leur. Le meneur, lui, veut savoir d'où vient LA réponse qu'il lit — donc
   * celles du dernier appel, relevées juste après.
   *
   * *À ne pas lire ailleurs qu'immédiatement après un appel* : deux questions
   * concurrentes se marcheraient dessus, et c'est pourquoi seul le chemin qui
   * les a demandées s'en sert.
   */
  public dernieresSources: { path: string; relu?: boolean; aRegenerer?: boolean }[] = [];

  public async getRelevantContext(options: { systemOnly?: boolean; systemName?: string; limit?: number; query?: string } = {}): Promise<string> {
    const osStore = useSessionOSStore.getState();
    const obsidianStore = useObsidianStore.getState();

    // 1. Align RAG Path with Obsidian Vault if available
    if (obsidianStore.vaultPath && window.appBridge?.ai?.reindex) {
        // We trigger a background reindex if the path changed handled by RAGEngine.ts logic
        window.appBridge.ai.reindex(obsidianStore.vaultPath).catch(console.error);
    }

    if (options.systemOnly && options.systemName) {
      return this.getContextForSpecificSystem(options.systemName, options.limit);
    }

    const activeCampaign = osStore.campaigns.find(c => c.id === osStore.activeCampaignId);

    // L'identifiant nomme le dossier (`docs/systems/alien`), le nom affiché non.
    // On envoie les deux : le moteur essaie l'identifiant d'abord.
    const systemId = activeCampaign?.system || 'unknown';
    const allTemplates = [...DEFAULT_SHEET_TEMPLATES, ...osStore.customSheetTemplates];
    const systemName = allTemplates.find(t => t.id === systemId)?.name;
    const campaignName = activeCampaign?.name || 'unknown';

    if (!window.appBridge?.ai?.searchContext) {
        console.error("[RAG Service] Bridge searchContext not available.");
        return "";
    }

    try {
        const context = await window.appBridge.ai.searchContext(systemId, campaignName, {
            query: options.query,
            systemName,
            // « Chemin des Règles » et « Chemin des Notes » de la fiche de campagne.
            // Ils étaient saisissables et enregistrés depuis toujours, mais leur
            // unique lecteur était resté en commentaire : rien ne les lisait.
            systemPath: activeCampaign?.systemPath,
            campaignPath: activeCampaign?.campaignPath,
        });

        /*
          **Les fiches qui ont répondu sont retenues ici**, pour que l'écran
          puisse les nommer — et dire lesquelles n'ont jamais été relues. Elles
          voyagent à part du texte parce qu'elles ne s'adressent pas au même
          lecteur : le texte va au modèle, la liste va au meneur.
        */
        this.dernieresSources = context?.sources ?? [];
        return context?.context || "";
    } catch (error) {
        console.error("[RAG Service] Search error:", error);
        return "";
    }
  }

  // `getContextFromExplicitPaths` vivait ici, en commentaire : c'était l'unique
  // lecteur de `campaign.systemPath` / `campaign.campaignPath`. Les deux champs
  // sont saisissables dans la fiche de campagne (« Chemin des Règles », « Chemin
  // des Notes ») et enregistrés, mais désactivés côté lecture — un cas de plus
  // du cadre qui déclare et du moteur qui ignore. Ils sont désormais transmis
  // au moteur par `getRelevantContext`, qui les traite comme périmètre prioritaire.

  private async readFolderRecursive(entry: DocEntry): Promise<string> {
    let content = '';
    const MAX_DOC_SIZE = 8000; // Limit context per file to avoid 429
    
    if (entry.type === 'file') {
      const ext = entry.extension?.toLowerCase();
      
      if (ext === '.md' || ext === '.txt') {
        const text = await window.appBridge?.ai?.readDoc?.(entry.path);
        if (text) {
          const truncated = text.length > MAX_DOC_SIZE ? text.substring(0, MAX_DOC_SIZE) + "..." : text;
          return `[Fichier Markdown: ${entry.name}]\n${truncated}\n`;
        }
      } 
      else if (ext === '.pdf') {
        // Use the new extract-pdf bridge
        const text = await window.appBridge?.ai?.extractPdf?.(entry.path);
        if (text) {
          const truncated = text.length > MAX_DOC_SIZE ? text.substring(0, MAX_DOC_SIZE) + "..." : text;
          return `[Fichier PDF: ${entry.name}]\n${truncated}\n`;
        }
      }
    }

    if (entry.children) {
      for (const child of entry.children) {
        content += await this.readFolderRecursive(child);
      }
    }

    return content;
  }

  /**
   * Used specifically for the AI Generator to fetch a system's rules
   */
  public async getContextForSpecificSystem(systemName: string, limit?: number): Promise<string> {
    console.log(`[RAG Service] Fetching raw context for system generation: ${systemName} (limit: ${limit || 'none'})`);
    if (!window.appBridge?.ai?.listDocs) return "";
    const docs = await window.appBridge.ai.listDocs() as DocEntry[];
    const contents: string[] = [];
    const target = systemName.toLowerCase();

    const searchRecursive = async (items: DocEntry[], isInsideTargetRoot = false) => {
      for (const item of items) {
        if (limit && contents.length >= limit) break; // Respect the limit
        
        const itemName = item.name.toLowerCase();
        // Match if directory name contains target or target contains directory name (e.g. "D&D" vs "dnd-5e" might be tricky, but "cyberpunk" vs "cyberpunk-red" works)
        const matchesName = itemName.includes(target) || target.includes(itemName);
        
        if (item.type === 'directory') {
           if (itemName === 'systems' || matchesName || isInsideTargetRoot) {
              await searchRecursive(item.children || [], matchesName || isInsideTargetRoot);
           }
        } else {
           const ext = item.extension?.toLowerCase();
           if ((ext === '.md' || ext === '.txt' || ext === '.pdf') && isInsideTargetRoot) {
              const text = await this.readFolderRecursive(item);
              if (text) contents.push(text);
           }
        }
      }
    };
    
    await searchRecursive(docs, false);
    return contents.join('\n\n');
  }

  public clearCache() {
    this.cache.clear();
  }
}

export const ragService = RAGService.getInstance();
