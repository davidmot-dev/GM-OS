import { ipcMain } from 'electron';
import path from 'node:path';
import fs from 'fs-extra';
import { createRequire } from 'node:module';
import { RAGIGNORE_FILENAME, isIgnored, parseRagIgnore, type IgnoreScope } from './ragIgnore';
import {
    MAX_CONTEXT_TOKENS,
    selectContext,
    type IndexedFile as SelectableFile,
    type RagRequest,
    type RagSelection,
} from './ragSelection';

const require = createRequire(import.meta.url);
let pdf: any;
try {
    pdf = require('pdf-parse');
} catch (e) {
    console.error('[RAG Engine] Failed to load pdf-parse:', e);
}

interface IndexedFile extends SelectableFile {
    mtime: number;
    type: 'markdown' | 'pdf' | 'text' | 'jsonl';
}

/** Extensions retenues à l'indexation. Les `.jsonl` sont déjà découpés et annotés. */
const EXTENSIONS_INDEXEES = ['.md', '.txt', '.pdf', '.jsonl'];

/**
 * Lit `sujet:` et le premier titre d'un document markdown.
 *
 * Le frontmatter `sujet:` distingue une fiche du corpus d'un extrait brut :
 * c'est lui qui décide du rang à la sélection. On ne lit que la tête du
 * fichier — au-delà, ce n'est plus du frontmatter.
 */
function lireEntete(content: string): { sujet?: string; titre?: string } {
    const tete = content.slice(0, 2000);
    const resultat: { sujet?: string; titre?: string } = {};

    const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---/.exec(tete);
    if (frontmatter) {
        const sujet = /^sujet\s*:\s*(.+)$/m.exec(frontmatter[1]);
        if (sujet) resultat.sujet = sujet[1].trim().replace(/^["']|["']$/g, '');
    }

    const titre = /^#\s+(.+)$/m.exec(tete);
    if (titre) resultat.titre = titre[1].trim();

    return resultat;
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
            const vus = new Set<string>();

            for (const filePath of files) {
                const stats = await fs.stat(filePath);
                const mtime = stats.mtimeMs;
                const relativePath = path.relative(this.docsPath, filePath).replace(/\\/g, '/');
                vus.add(relativePath);

                const existing = this.index.get(relativePath);
                if (!existing || existing.mtime !== mtime) {
                    const content = await this.readFileContent(filePath);
                    if (content) {
                        const ext = path.extname(filePath).toLowerCase();
                        this.index.set(relativePath, {
                            mtime,
                            content,
                            path: relativePath,
                            type: ext === '.pdf' ? 'pdf'
                                : ext === '.md' ? 'markdown'
                                : ext === '.jsonl' ? 'jsonl'
                                : 'text',
                            ...(ext === '.md' ? lireEntete(content) : {}),
                        });
                        updatedCount++;
                    }
                }
            }

            // Purger les entrées disparues — un fichier supprimé, déplacé, ou
            // nouvellement couvert par un `.ragignore` doit sortir de l'index,
            // sinon l'exclusion ne prend effet qu'au prochain démarrage.
            let retirees = 0;
            for (const key of [...this.index.keys()]) {
                if (!vus.has(key)) {
                    this.index.delete(key);
                    retirees++;
                }
            }

            if (updatedCount > 0 || retirees > 0) {
                console.log(
                    `[RAG Engine] Index mis à jour : ${updatedCount} rechargé(s), ${retirees} retiré(s). Total : ${this.index.size}`,
                );
            }
        } catch (error) {
            console.error('[RAG Engine] Indexing error:', error);
        } finally {
            this.isIndexing = false;
        }
    }

    /**
     * Choisit le contexte à envoyer au modèle pour la question en cours.
     *
     * La décision elle-même vit dans `ragSelection.ts` ; ici on fournit
     * l'index et on journalise le résultat.
     */
    public async selectRelevantContext(req: RagRequest): Promise<RagSelection> {
        if (this.index.size === 0) await this.updateIndex();

        const selection = selectContext(this.index.values(), req);
        this.journaliser(req, selection);
        return selection;
    }

    public async getRelevantContext(req: RagRequest): Promise<string> {
        return (await this.selectRelevantContext(req)).context;
    }

    /**
     * Trace ce qui est retenu **et ce qui est écarté**.
     *
     * Sans cela, un document absent du prompt est indiscernable d'un document
     * absent du disque — c'est ce silence qui a laissé vivre des mois un filtre
     * qui laissait passer les 83 fichiers sans jamais atteindre une seule fiche.
     */
    private journaliser(req: RagRequest, s: RagSelection) {
        const plafond = req.maxTokens ?? MAX_CONTEXT_TOKENS;
        const horsPerimetre = s.ecartes.filter(e => e.raison === 'hors-perimetre').length;
        const budget = s.ecartes.filter(e => e.raison === 'budget').length;

        console.log(
            `[RAG] ${req.systemId} / ${req.campaignName}${req.query ? ` — « ${req.query.slice(0, 60)} »` : ' — sans question'} : `
            + `${s.retenus.length} retenu(s), ~${s.totalTokens} tok / ${plafond}`,
        );
        for (const r of s.retenus) {
            console.log(`[RAG]   ✓ ${r.provenance.padEnd(9)} ${String(r.score).padStart(3)}  ${r.path}  (~${r.tokens} tok${r.tronque ? ', tronqué' : ''})`);
        }
        if (budget > 0) console.log(`[RAG]   … ${budget} candidat(s) écarté(s) faute de budget`);
        if (horsPerimetre > 0) console.log(`[RAG]   · ${horsPerimetre} document(s) hors périmètre`);
        for (const a of s.avertissements) console.warn(`[RAG]   ⚠ ${a}`);
    }

    /**
     * Parcourt `docs/` en respectant les `.ragignore` rencontrés en chemin.
     *
     * Seul l'index de l'Oracle passe par ici : `ai:list-docs`, `ai:read-doc` et
     * `ai:extract-pdf` lisent le disque directement, donc les Forges et le
     * lecteur de documents continuent de voir les livres bruts.
     */
    private async getAllFiles(dir: string, scopes: IgnoreScope[] = []): Promise<string[]> {
        const results: string[] = [];
        const list = await fs.readdir(dir, { withFileTypes: true });

        const ignoreFile = list.find(e => e.isFile() && e.name === RAGIGNORE_FILENAME);
        let portees = scopes;
        if (ignoreFile) {
            const base = path.relative(this.docsPath, dir).replace(/\\/g, '/');
            const contenu = await fs.readFile(path.join(dir, RAGIGNORE_FILENAME), 'utf-8');
            portees = [...scopes, { base, rules: parseRagIgnore(contenu) }];
        }

        for (const entry of list) {
            const filePath = path.join(dir, entry.name);
            const relPath = path.relative(this.docsPath, filePath).replace(/\\/g, '/');

            if (entry.isDirectory()) {
                if (isIgnored(relPath, portees, true)) continue;
                results.push(...await this.getAllFiles(filePath, portees));
            } else {
                const ext = path.extname(entry.name).toLowerCase();
                if (!EXTENSIONS_INDEXEES.includes(ext)) continue;
                if (isIgnored(relPath, portees, false)) continue;
                results.push(filePath);
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

    ipcMain.handle('ai:search-context', async (
        _event,
        systemId: string,
        campaignName: string,
        options?: Omit<RagRequest, 'systemId' | 'campaignName'>,
    ) => {
        return await engine.getRelevantContext({ systemId, campaignName, ...(options ?? {}) });
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
