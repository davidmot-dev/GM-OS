import { useSessionOSStore } from '../session/useSessionOSStore';
import { DEFAULT_SHEET_TEMPLATES } from '../../data/defaultSheetTemplates';

export interface DocEntry {
  name: string;
  path: string;
  type: 'file' | 'directory';
  extension?: string;
  children?: DocEntry[];
}

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
   */
  public async getRelevantContext(): Promise<string> {
    const osStore = useSessionOSStore.getState();
    const activeCampaign = osStore.campaigns.find(c => c.id === osStore.activeCampaignId);
    
    const rawSystemId = activeCampaign?.system || 'unknown';
    const allTemplates = [...DEFAULT_SHEET_TEMPLATES, ...osStore.customSheetTemplates];
    const systemId = allTemplates.find(t => t.id === rawSystemId)?.name || rawSystemId;
    
    const campaignName = activeCampaign?.name || 'unknown';

    console.log(`[RAG Service] Optimized Search -> System: ${systemId}, Campaign: ${campaignName}`);

    if (!window.appBridge?.ai?.searchContext) {
        console.error("[RAG Service] Bridge searchContext not available.");
        return "";
    }

    try {
        const context = await window.appBridge.ai.searchContext(systemId, campaignName);
        if (!context) {
            console.warn("[RAG Service] No context found via optimized engine.");
            return "";
        }
        return context;
    } catch (error) {
        console.error("[RAG Service] Search error:", error);
        return "";
    }
  }

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
        const text = await window.appBridge?.ai?.extractPDF?.(entry.path);
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
  public async getContextForSpecificSystem(systemName: string): Promise<string> {
    console.log(`[RAG Service] Fetching raw context for system generation: ${systemName}`);
    if (!window.appBridge?.ai?.listDocs) return "";
    const docs = await window.appBridge.ai.listDocs() as DocEntry[];
    const contents: string[] = [];
    const target = systemName.toLowerCase();

    const searchRecursive = async (items: DocEntry[], isInsideTargetRoot = false) => {
      for (const item of items) {
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
