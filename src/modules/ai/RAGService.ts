import { useSessionOSStore } from '../session/useSessionOSStore';
import { useObsidianStore } from '../session/useObsidianStore';
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
   * Leverages the dynamic backend RAG Engine.
   */
  public async getRelevantContext(options: { systemOnly?: boolean; systemName?: string } = {}): Promise<string> {
    const osStore = useSessionOSStore.getState();
    const obsidianStore = useObsidianStore.getState();
    
    // 1. Align RAG Path with Obsidian Vault if available
    if (obsidianStore.vaultPath && window.appBridge?.ai?.reindex) {
        // We trigger a background reindex if the path changed handled by RAGEngine.ts logic
        window.appBridge.ai.reindex(obsidianStore.vaultPath).catch(console.error);
    }

    if (options.systemOnly && options.systemName) {
      return this.getContextForSpecificSystem(options.systemName);
    }

    const activeCampaign = osStore.campaigns.find(c => c.id === osStore.activeCampaignId);
    
    const rawSystemId = activeCampaign?.system || 'unknown';
    const allTemplates = [...DEFAULT_SHEET_TEMPLATES, ...osStore.customSheetTemplates];
    const systemId = allTemplates.find(t => t.id === rawSystemId)?.name || rawSystemId;
    const campaignName = activeCampaign?.name || 'unknown';

    if (!window.appBridge?.ai?.searchContext) {
        console.error("[RAG Service] Bridge searchContext not available.");
        return "";
    }

    try {
        console.log(`[RAG Service] Targeted Search -> System: ${systemId}, Campaign: ${campaignName}`);
        const context = await window.appBridge.ai.searchContext(systemId, campaignName);
        return context || "";
    } catch (error) {
        console.error("[RAG Service] Search error:", error);
        return "";
    }
  }

  private async getContextFromExplicitPaths(systemPath?: string, campaignPath?: string): Promise<string> {
    if (!window.appBridge?.ai?.listDocs) return "";
    const docs = await window.appBridge.ai.listDocs() as DocEntry[];
    let totalContext = "";

    const findAndRead = async (targetPath: string) => {
      // Normalize path (split by / or \ and trim)
      const parts = targetPath.trim().split(/[/\\]/).filter(p => p.length > 0).map(p => p.toLowerCase());
      if (parts.length === 0) return "";

      console.log(`[RAG Service] Searching for path segments:`, parts);

      // Recursive finder that follows the path
      const findNestedEntry = (entries: DocEntry[], segments: string[]): DocEntry | null => {
        if (segments.length === 0) return null;
        
        const [current, ...remaining] = segments;
        const match = entries.find(e => e.name.toLowerCase() === current);
        
        if (match) {
          if (remaining.length === 0) return match;
          if (match.children) return findNestedEntry(match.children, remaining);
        }
        return null;
      };

      let foundEntry = findNestedEntry(docs, parts);

      // Fallback: If not found by full path, try searching for the leaf name anywhere in the tree
      // (This helps if the user forgot a parent folder like 'systems/' or 'campaigns/')
      if (!foundEntry && parts.length > 0) {
        const leaf = parts[parts.length - 1];
        console.warn(`[RAG Service] Path not found directly: ${targetPath}. Trying to find leaf: ${leaf}`);
        
        const findByLeaf = (entries: DocEntry[]): DocEntry | null => {
          for (const entry of entries) {
            if (entry.name.toLowerCase() === leaf) return entry;
            if (entry.children) {
              const b = findByLeaf(entry.children);
              if (b) return b;
            }
          }
          return null;
        };
        foundEntry = findByLeaf(docs);
      }

      if (foundEntry) {
        console.log(`[RAG Service] Found entry for RAG: ${foundEntry.name} (${foundEntry.type})`);
        return await this.readFolderRecursive(foundEntry);
      } else {
        console.error(`[RAG Service] Target RAG path not found: ${targetPath}`);
      }
      return "";
    };

    if (systemPath) {
      const systemContext = await findAndRead(systemPath);
      if (systemContext) totalContext += `### SYSTÈME: ${systemPath}\n${systemContext}\n\n`;
    }

    if (campaignPath) {
      const campaignContext = await findAndRead(campaignPath);
      if (campaignContext) totalContext += `### CAMPAGNE: ${campaignPath}\n${campaignContext}\n\n`;
    }

    return totalContext;
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
