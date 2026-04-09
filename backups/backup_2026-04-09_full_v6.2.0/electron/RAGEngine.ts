import { ipcMain } from 'electron';
import path from 'node:path';
import fs from 'fs-extra';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');

interface IndexedFile {
    mtime: number;
    content: string;
    path: string;
}

export class RAGEngine {
    private static instance: RAGEngine;
    private index: Map<string, IndexedFile> = new Map();
    private docsPath: string;
    private isIndexing: boolean = false;

    private constructor() {
        this.docsPath = path.join(process.env.APP_ROOT || '', 'docs');
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
                        this.index.set(relativePath, {
                            mtime,
                            content,
                            path: relativePath
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
     */
    public async getRelevantContext(systemId: string, campaignName: string): Promise<string> {
        // Ensure index is at least partially ready
        if (this.index.size === 0) await this.updateIndex();

        const sys = systemId.toLowerCase();
        const camp = campaignName.toLowerCase();
        const results: string[] = [];

        for (const [relPath, file] of this.index.entries()) {
            const lowerPath = relPath.toLowerCase();
            
            // Logic:
            // 1. If inside systems/[sys], it's highly relevant
            // 2. If inside campaigns/[camp], it's highly relevant
            // 3. If file name matches sys or camp, it's relevant
            
            const isSystemFile = lowerPath.includes(`systems/${sys}`) || lowerPath.includes(`systems\\${sys}`);
            const isCampaignFile = lowerPath.includes(`campaigns/${camp}`) || lowerPath.includes(`campaigns\\${camp}`);
            const isMatchedByName = lowerPath.includes(sys) || lowerPath.includes(camp);

            if (isSystemFile || isCampaignFile || isMatchedByName) {
                const header = `[Source: ${relPath}]\n`;
                results.push(header + file.content);
            }
        }

        return results.join('\n\n---\n\n');
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

    ipcMain.handle('ai:reindex', async () => {
        await engine.updateIndex();
        return true;
    });

    // Start background indexing periodically
    setInterval(() => engine.updateIndex(), 1000 * 60 * 5); // Every 5 minutes
    // Initial scan
    setTimeout(() => engine.updateIndex(), 5000);
}
