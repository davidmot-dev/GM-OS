import { ipcMain } from 'electron';
import path from 'node:path';
import fs from 'fs-extra';
import { createRequire } from 'node:module';
import log from 'electron-log';
import { RAGIGNORE_FILENAME, isIgnored, parseRagIgnore, type IgnoreScope } from './ragIgnore';
import {
    MAX_CONTEXT_TOKENS,
    selectContext,
    type IndexedFile as SelectableFile,
    type RagRequest,
    type RagSelection,
} from './ragSelection';
import { chargerIndex, chercherDansLIndex, verifierLesCitations } from './bookIndex';

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
 * Écrit dans `main.log` via electron-log, avec repli console si le module est
 * indisponible (tests, environnement dégradé) — même motif qu'`auditLog.ts`.
 */
function ecrire(level: 'info' | 'warn', message: string) {
    try {
        log[level]('[RAG]', message);
    } catch {
        console[level](`[RAG] ${message}`);
    }
}

/**
 * Lit `sujet:` et le premier titre d'un document markdown.
 *
 * Le frontmatter `sujet:` distingue une fiche du corpus d'un extrait brut :
 * c'est lui qui décide du rang à la sélection. On ne lit que la tête du
 * fichier — au-delà, ce n'est plus du frontmatter.
 */
function lireEntete(content: string): { sujet?: string; titre?: string; relu?: boolean; aRegenerer?: boolean } {
    const tete = content.slice(0, 2000);
    const resultat: { sujet?: string; titre?: string; relu?: boolean; aRegenerer?: boolean } = {};

    const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---/.exec(tete);
    if (frontmatter) {
        const sujet = /^sujet\s*:\s*(.+)$/m.exec(frontmatter[1]);
        if (sujet) resultat.sujet = sujet[1].trim().replace(/^["']|["']$/g, '');

        /*
          **`relu:` etait ecrit par trois endroits et lu par personne.** On ne
          le retient QUE s'il est declare : un extrait brut, une decharge, une
          note du meneur n'ont pas a se pretendre relus — ni non relus. C'est la
          meme regle que partout ailleurs : *l'absence n'est pas un zero.*
        */
        const relu = /^relu\s*:\s*(true|false)\s*$/m.exec(frontmatter[1]);
        if (relu) resultat.relu = relu[1] === 'true';

        const suspecte = /^a_regenerer\s*:\s*(true|false)\s*$/m.exec(frontmatter[1]);
        if (suspecte) resultat.aRegenerer = suspecte[1] === 'true';
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
     * Le contexte **et les fiches qui l'ont fourni**.
     *
     * **La liste existait et se jetait ici même.** `selectRelevantContext` rend
     * depuis toujours les fiches retenues, leur provenance et leur état de
     * relecture ; `getRelevantContext` n'en gardait que le texte, et le pont ne
     * transportait qu'une chaîne. L'écran ne pouvait donc pas dire d'où venait
     * une réponse — et le plan du 2026-08-07 affirmait pourtant que *« l'Oracle
     * affiche déjà quelle fiche a répondu »*.
     *
     * *Une donnée calculée puis jetée au dernier étage coûte deux fois : on la
     * paie, et on croit ne pas l'avoir.*
     */
    public async getRelevantContextDetaille(req: RagRequest) {
        const { context, retenus } = await this.selectRelevantContext(req);
        return { context, sources: retenus };
    }

    /**
     * Trace ce qui est retenu **et ce qui est écarté**.
     *
     * Sans cela, un document absent du prompt est indiscernable d'un document
     * absent du disque — c'est ce silence qui a laissé vivre des mois un filtre
     * qui laissait passer les 83 fichiers sans jamais atteindre une seule fiche.
     *
     * **Passe par `electron-log`, jamais par `console`** : rien ne collecte la
     * sortie standard du process principal, ni au terminal de développement ni
     * dans `main.log`, qu'electron-log n'alimente qu'à partir des appels `log.*`.
     * Le piège est déjà documenté dans `auditLog.ts` — et je suis tombé dedans
     * en écrivant ce journal la première fois.
     */
    private journaliser(req: RagRequest, s: RagSelection) {
        const plafond = req.maxTokens ?? MAX_CONTEXT_TOKENS;
        const horsPerimetre = s.ecartes.filter(e => e.raison === 'hors-perimetre').length;
        const budget = s.ecartes.filter(e => e.raison === 'budget').length;

        const lignes = [
            `${req.systemId} / ${req.campaignName}`
            + `${req.query ? ` — « ${req.query.slice(0, 60)} »` : ' — sans question'} : `
            + `${s.retenus.length} retenu(s), ~${s.totalTokens} tok / ${plafond}`,
            ...s.retenus.map(r =>
                `  ✓ ${r.provenance.padEnd(9)} ${String(r.score).padStart(3)}  ${r.path}`
                + `  (~${r.tokens} tok${r.tronque ? ', tronqué' : ''})`),
            ...(budget > 0 ? [`  … ${budget} candidat(s) écarté(s) faute de budget`] : []),
            ...(horsPerimetre > 0 ? [`  · ${horsPerimetre} document(s) hors périmètre`] : []),
        ];

        for (const ligne of lignes) ecrire('info', ligne);
        for (const a of s.avertissements) ecrire('warn', `  ⚠ ${a}`);
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
        return await engine.getRelevantContextDetaille({ systemId, campaignName, ...(options ?? {}) });
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

    /**
     * Les dossiers présents sous `docs/systems/`.
     *
     * Sans cet inventaire, `resoudreCorpus` ne peut pas rapprocher un pilote de
     * son dossier par le nom affiché : on ne reconnaît pas un dossier qu'on ne
     * sait pas exister. C'est ce rapprochement qui fait tomber les fiches, les
     * personas et l'index d'un même système au même endroit, alors que la Forge
     * fabrique les identifiants de pilote avec un horodatage.
     */
    /**
     * Les fichiers d'un dossier de `docs/`, sans récursion.
     *
     * Sert à l'atelier pour savoir ce qui est **déjà forgé** : une fiche existe
     * dans `rules/` ou elle n'existe pas, et c'est la seule vérité durable. La
     * coche de la liste des sujets venait d'une mémoire de session, vidée dès
     * qu'on terminait — on avait donc forgé une fiche, elle était bien sur le
     * disque, et l'écran l'affichait comme restant à faire.
     */
    ipcMain.handle('ai:list-dir', async (_event, relativePath: string) => {
        const root = RAGEngine.getInstance()['docsPath'];
        const dossier = path.join(root, relativePath);
        if (!dossier.startsWith(root)) return [];
        if (!await fs.pathExists(dossier)) return [];
        const entrees = await fs.readdir(dossier, { withFileTypes: true });
        return entrees.filter(e => e.isFile()).map(e => e.name);
    });

    ipcMain.handle('ai:list-systems', async () => {
        const root = RAGEngine.getInstance()['docsPath'];
        const dossier = path.join(root, 'systems');
        if (!await fs.pathExists(dossier)) return [];
        const entrees = await fs.readdir(dossier, { withFileTypes: true });
        return entrees.filter(e => e.isDirectory()).map(e => e.name);
    });

    /**
     * Crée les dossiers d'un corpus de système.
     *
     * **Le défaut qu'il corrige.** La Forge Système créait un pilote et rien
     * autour : pas de `rules/` où écrire les fiches, pas d'`index/` d'où charger
     * la pagination du livre, pas de `personas/`. Chacun de ces manques se
     * traduisait par un silence — un `catch {}` sur un chemin inexistant, un
     * résolveur sans entrée — et non par une erreur. Un corpus complet mais vide
     * dit ce qu'il attend ; un corpus absent ne dit rien.
     *
     * Les chemins viennent de `sousDossiersDuCorpus` : créer ailleurs que là où
     * la lecture va chercher serait indétectable par construction.
     *
     * Rend la liste de ce qui a **réellement** été créé — un dossier déjà là
     * n'en fait pas partie. C'est ce qui permet à l'écran de distinguer « corpus
     * neuf » de « corpus rejoint », deux situations qu'il ne faut pas confondre.
     */
    ipcMain.handle('ai:create-corpus', async (_event, dossiers: string[]) => {
        const root = RAGEngine.getInstance()['docsPath'];
        const crees: string[] = [];
        for (const relatif of dossiers) {
            const complet = path.join(root, relatif);
            if (!complet.startsWith(root)) {
                console.error(`[RAG Engine] Security Violation: refus de créer hors de docs: ${complet}`);
                continue;
            }
            if (await fs.pathExists(complet)) continue;
            await fs.ensureDir(complet);
            crees.push(relatif);
        }
        return crees;
    });

    /**
     * Résout les sections citées par une fiche en pages du livre.
     *
     * **Pourquoi la vérification doit être une étape du flux.** Les pages
     * rendues par NotebookLM sont fausses : neuf fiches Dune sur dix-sept
     * citaient au-delà de la dernière page du livre, dont une page 1279 pour un
     * ouvrage qui s'arrête à 328. Les gabarits v3 demandent donc des **titres de
     * section**, vérifiables contre l'index réel — mais un résolveur qu'il faut
     * lancer à la main n'est pas une vérification, c'est une intention. Il
     * tourne ici, dans la revue, avant que la fiche n'entre dans `rules/` et ne
     * devienne cityable par l'Oracle.
     *
     * Un index absent n'est pas une fiche fautive : on rend `indexDisponible:
     * false` plutôt que « zéro section résolue », qui aurait accusé la fiche
     * d'un manque qui n'est pas le sien.
     */
    /**
     * Ce que le LIVRE dit d'une question — **étage 2 de l'axe M.**
     *
     * *« À défaut d'une fiche, la référence dans le livre. »* L'Oracle cesse
     * d'être un moteur qui répond ou se tait : **il devient un bibliothécaire,
     * qui sait dire « je n'ai pas, mais c'est là ».**
     *
     * Aucun modèle n'est invoqué et rien n'est ouvert : un rapprochement de mots
     * sur l'index déjà extrait. *L'ouverture du PDF reste en secours ou sur
     * demande explicite, jamais dans le chemin critique.*
     */
    ipcMain.handle('ai:chercher-index', async (_event, systeme: string, question: string) => {
        const root = RAGEngine.getInstance()['docsPath'];
        const livre = chargerIndex(root, systeme);
        return {
            /* Un index absent n'est pas une absence de réponse : le dire permet
               à l'écran de proposer d'en déposer un, au lieu de se taire. */
            indexDisponible: livre.entrees.length > 0,
            trouvailles: chercherDansLIndex(livre, question),
        };
    });

    ipcMain.handle('ai:resolve-sections', async (_event, systeme: string, contenuFiche: string) => {
        const root = RAGEngine.getInstance()['docsPath'];
        return verifierLesCitations(chargerIndex(root, systeme), contenuFiche);
    });

    /**
     * Supprime un document. Réservé aux brouillons de la Forge.
     *
     * Un brouillon publié dans `rules/` n'a plus de raison d'être : conservé, le
     * dossier redeviendrait une décharge, et deux versions de la même fiche
     * cohabiteraient — le défaut qu'on vient de corriger pour le corpus v1.
     *
     * Le garde-fou est le chemin : hors de `docs/`, on refuse. Comme pour
     * l'écriture, c'est la seule barrière, et elle doit tenir seule.
     */
    ipcMain.handle('ai:delete-doc', async (_event, relativePath: string) => {
        const root = RAGEngine.getInstance()['docsPath'];
        const fullPath = path.join(root, relativePath);
        if (!fullPath.startsWith(root)) {
            console.error(`[RAG Engine] Security Violation: refus de supprimer hors de docs: ${fullPath}`);
            return false;
        }
        try {
            if (!await fs.pathExists(fullPath)) return true;   // déjà absent : rien à faire
            await fs.remove(fullPath);
            RAGEngine.getInstance().updateIndex();
            return true;
        } catch (error) {
            console.error('[RAG Engine] Error deleting doc:', error);
            return false;
        }
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
