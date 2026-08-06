import { ipcMain } from 'electron';
import path from 'node:path';
import fs from 'fs-extra';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
let pdf: any;
try {
    pdf = require('pdf-parse');
} catch (e) {
    console.error('[RAG Engine] Failed to load pdf-parse:', e);
}

interface IndexedFile {
    mtime: number;
    content: string;
    path: string;
    type: 'markdown' | 'pdf' | 'text';
}

export class RAGEngine {
    private static instance: RAGEngine;
    private index: Map<string, IndexedFile> = new Map();
    private docsPath: string;
    private isIndexing: boolean = false;

    private constructor() {
        this.docsPath = path.join(process.env.APP_ROOT || '', 'docs');
    }

    public setDocsPath(newPath: string) {
        if (newPath && newPath !== this.docsPath) {
            console.log(`[RAG Engine] Updating docs path to: ${newPath}`);
            this.docsPath = newPath;
            this.index.clear();
            this.updateIndex();
        }
    }

    public static getInstance(): RAGEngine {
        if (!RAGEngine.instance) {
            RAGEngine.instance = new RAGEngine();
        }
        return RAGEngine.instance;
    }

    /**
     * Scan the docs folder and update the index
     */
    public async updateIndex() {
        if (this.isIndexing) return;
        this.isIndexing = true;
        console.log('[RAG Engine] Starting background indexing...');
        
        try {
            if (!await fs.pathExists(this.docsPath)) {
                await fs.ensureDir(this.docsPath);
                this.isIndexing = false;
                return;
            }

            const files = await this.getAllFiles(this.docsPath);
            let updatedCount = 0;

            for (const filePath of files) {
                const stats = await fs.stat(filePath);
                const mtime = stats.mtimeMs;
                const relativePath = path.relative(this.docsPath, filePath);

                const existing = this.index.get(relativePath);
                if (!existing || existing.mtime !== mtime) {
                    const content = await this.readFileContent(filePath);
                    if (content) {
                        const ext = path.extname(filePath).toLowerCase();
                        this.index.set(relativePath, {
                            mtime,
                            content,
                            path: relativePath,
                            type: ext === '.pdf' ? 'pdf' : ext === '.md' ? 'markdown' : 'text'
                        });
                        updatedCount++;
                    }
                }
            }

            if (updatedCount > 0) {
                console.log(`[RAG Engine] Index updated: ${updatedCount} files reloaded. Total: ${this.index.size}`);
            }
        } catch (error) {
            console.error('[RAG Engine] Indexing error:', error);
        } finally {
            this.isIndexing = false;
        }
    }

    /**
     * Search relevant content for a given system and campaign
     * Optimized for targeted indexing
     */
    public async getRelevantContext(systemId: string, campaignName: string): Promise<string> {
        if (this.index.size === 0) await this.updateIndex();

        const sys = systemId.toLowerCase();
        const camp = campaignName.toLowerCase();
        const results: string[] = [];

        // Targeted search: prioritizing files that match system or campaign names
        // or are located in folders with those names.
        for (const [relPath, file] of this.index.entries()) {
            const lowerPath = relPath.toLowerCase();
            const segments = lowerPath.split(/[/\\]/);
            
            const isSystemRelevant = segments.some(s => s.includes(sys)) || lowerPath.includes('systems');
            const isCampaignRelevant = segments.some(s => s.includes(camp)) || lowerPath.includes('campaigns');

            if (isSystemRelevant || isCampaignRelevant) {
                // High precision match: if the folder/file explicitly matches the ID
                const score = (lowerPath.includes(sys) ? 2 : 0) + (lowerPath.includes(camp) ? 2 : 0);
                
                if (score > 0 || (isSystemRelevant && lowerPath.includes('systems')) || (isCampaignRelevant && lowerPath.includes('campaigns'))) {
                   const header = `[Source: ${relPath}]\n`;
                   results.push(header + file.content);
                }
            }
        }

        return results.slice(0, 15).join('\n\n---\n\n'); // Limit to top 15 matches for token safety
    }

    private async getAllFiles(dir: string): Promise<string[]> {
        const results: string[] = [];
        const list = await fs.readdir(dir);
        
        for (const file of list) {
            const filePath = path.join(dir, file);
            const stat = await fs.stat(filePath);
            
            if (stat && stat.isDirectory()) {
                results.push(...await this.getAllFiles(filePath));
            } else {
                const ext = path.extname(file).toLowerCase();
                if (['.md', '.txt', '.pdf'].includes(ext)) {
                    results.push(filePath);
                }
            }
        }
        return results;
    }

    private async readFileContent(filePath: string): Promise<string | null> {
        const ext = path.extname(filePath).toLowerCase();
        const MAX_SIZE = 50000; // Skip massive files for now or chunk them

        try {
            if (ext === '.md' || ext === '.txt') {
                const text = await fs.readFile(filePath, 'utf-8');
                return text.length > MAX_SIZE ? text.substring(0, MAX_SIZE) + '... [Tronqué]' : text;
            } else if (ext === '.pdf') {
                const dataBuffer = await fs.readFile(filePath);
                if (typeof pdf === 'function') {
                    const data = await pdf(dataBuffer);
                    return data.text || '';
                }
            }
        } catch (err) {
            console.error(`[RAG Engine] Error reading ${filePath}:`, err);
        }
        return null;
    }
}

// Register IPC handlers
export function registerRagHandlers() {
    const engine = RAGEngine.getInstance();

    ipcMain.handle('ai:search-context', async (_event, systemId: string, campaignName: string) => {
        return await engine.getRelevantContext(systemId, campaignName);
    });

    ipcMain.handle('ai:reindex', async (_event, customPath?: string) => {
        if (customPath) engine.setDocsPath(customPath);
        await engine.updateIndex();
        return true;
    });

    ipcMain.handle('ai:list-docs', async () => {
        const root = RAGEngine.getInstance()['docsPath'];
        console.log(`[RAG Engine] Listing docs in root: ${root}`);
        if (!await fs.pathExists(root)) {
            console.warn(`[RAG Engine] Root path does not exist: ${root}`);
            return [];
        }
        
        async function getFiles(dir: string): Promise<any[]> {
            const items = await fs.readdir(dir, { withFileTypes: true });
            const result = await Promise.all(items.map(async item => {
                const fullPath = path.join(dir, item.name);
                const relativePath = path.relative(root, fullPath);
                
                if (item.name.startsWith('.')) return null;

                if (item.isDirectory()) {
                    return {
                        name: item.name,
                        path: relativePath.replace(/\\/g, '/'),
                        type: 'directory',
                        children: await getFiles(fullPath)
                    };
                }
                
                return {
                    name: item.name,
                    path: relativePath.replace(/\\/g, '/'),
                    type: 'file',
                    extension: path.extname(item.name).toLowerCase()
                };
            }));
            return result.filter(r => r !== null);
        }

        return getFiles(root);
    });

    ipcMain.handle('ai:read-doc', async (_event, relativePath: string) => {
        const root = RAGEngine.getInstance()['docsPath'];
        const fullPath = path.join(root, relativePath);
        if (!await fs.pathExists(fullPath) || !fullPath.startsWith(root)) return null;
        return fs.readFile(fullPath, 'utf-8');
    });

    ipcMain.handle('ai:extract-pdf', async (_event, relativePath: string) => {
        const root = RAGEngine.getInstance()['docsPath'];
        const fullPath = path.join(root, relativePath);
        if (!await fs.pathExists(fullPath) || !fullPath.startsWith(root)) return "Fichier introuvable.";

        try {
            const dataBuffer = await fs.readFile(fullPath);
            if (pdf) {
                const data = await pdf(dataBuffer);
                return data.text || '';
            }
            return "PDF Parser non disponible.";
        } catch (error) {
            console.error("[RAGEngine] PDF Extraction Error:", error);
            return "Erreur lors de l'extraction.";
        }
    });

    ipcMain.handle('ai:write-doc', async (_event, relativePath: string, content: string) => {
        const root = RAGEngine.getInstance()['docsPath'];
        const fullPath = path.join(root, relativePath);
        console.log(`[RAG Engine] Writing doc: ${relativePath} -> ${fullPath}`);

        // Security check: ensure the path is inside the docs folder
        if (!fullPath.startsWith(root)) {
            console.error(`[RAG Engine] Security Violation: Attempted to write outside docs: ${fullPath}`);
            return false;
        }

        try {
            await fs.ensureDir(path.dirname(fullPath));
            await fs.writeFile(fullPath, content, 'utf-8');
            // Trigger reindex after write
            RAGEngine.getInstance().updateIndex();
            return true;
        } catch (error) {
            console.error('[RAG Engine] Error writing doc:', error);
            return false;
        }
    });

    // Start background indexing periodically
    setInterval(() => engine.updateIndex(), 1000 * 60 * 15); // Every 15 minutes (less frequent to save IO)
    // Initial scan
    setTimeout(() => engine.updateIndex(), 5000);
}
