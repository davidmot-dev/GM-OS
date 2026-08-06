import { app } from 'electron';
import path from 'node:path';
import fs from 'fs-extra';

/**
 * Registre des racines depuis lesquelles le SyncServer accepte de servir des fichiers.
 *
 * Le serveur écoute sur 0.0.0.0 : sans ce filtre, `/media/<chemin absolu>` laisse
 * n'importe quelle machine du réseau local lire n'importe quel fichier du disque.
 *
 * Deux sources de racines :
 *  - les racines de base (dossiers de l'app), figées au démarrage ;
 *  - les dossiers parents des fichiers que le MJ choisit via les dialogues de
 *    l'app (avatars, audio, imports), enregistrés et persistés au fil de l'eau.
 */
class MediaAccessRegistry {
    private baseRoots: string[] = [];
    private userRoots: string[] = [];
    private storeFile: string | null = null;
    private initialized = false;

    /** Normalise pour comparaison : chemin absolu, séparateurs unifiés, casse ignorée sur Windows. */
    private normalize(p: string): string {
        const resolved = path.resolve(p);
        return process.platform === 'win32' ? resolved.toLowerCase() : resolved;
    }

    public init(appRoot: string, tempMediaDir: string) {
        if (this.initialized) return;
        const userData = app.getPath('userData');

        this.baseRoots = [
            tempMediaDir,
            userData,
            path.join(appRoot, 'public'),
            path.join(appRoot, 'databases'),
            path.join(appRoot, 'dist'),
        ].map(r => this.normalize(r));

        this.storeFile = path.join(userData, 'media-roots.json');
        this.loadUserRoots();
        this.initialized = true;
        console.log(`[MediaAccess] ${this.baseRoots.length} racines de base, ${this.userRoots.length} racines utilisateur`);
    }

    private loadUserRoots() {
        if (!this.storeFile) return;
        try {
            if (fs.existsSync(this.storeFile)) {
                const raw = fs.readJsonSync(this.storeFile);
                if (Array.isArray(raw)) {
                    this.userRoots = raw.filter((r): r is string => typeof r === 'string').map(r => this.normalize(r));
                }
            }
        } catch (err) {
            console.warn('[MediaAccess] Impossible de lire media-roots.json:', err);
        }
    }

    private persistUserRoots() {
        if (!this.storeFile) return;
        try {
            fs.writeJsonSync(this.storeFile, this.userRoots, { spaces: 2 });
        } catch (err) {
            console.warn('[MediaAccess] Impossible d\'écrire media-roots.json:', err);
        }
    }

    /** Autorise un dossier et tout son contenu, de façon persistante. */
    public allowDirectory(dir: string) {
        if (!dir) return;
        const normalized = this.normalize(dir);
        if (this.isUnder(normalized, this.baseRoots) || this.isUnder(normalized, this.userRoots)) return;
        this.userRoots.push(normalized);
        this.persistUserRoots();
        console.log(`[MediaAccess] Nouvelle racine autorisée: ${normalized}`);
    }

    /** Autorise le dossier parent d'un fichier choisi par le MJ via un dialogue. */
    public allowFile(filePath: string) {
        if (!filePath) return;
        this.allowDirectory(path.dirname(filePath));
    }

    public allowFiles(filePaths: string[] | undefined | null) {
        for (const f of filePaths || []) this.allowFile(f);
    }

    private isUnder(normalizedTarget: string, roots: string[]): boolean {
        return roots.some(root => {
            const rel = path.relative(root, normalizedTarget);
            return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
        });
    }

    /**
     * Résout un chemin demandé par un client et vérifie qu'il tombe dans une racine
     * autorisée. Retourne le chemin absolu réel, ou null si l'accès est refusé.
     *
     * Les chemins relatifs sont résolus depuis APP_ROOT (cohérent avec le protocole
     * gmos://), jamais depuis le cwd du process.
     */
    public resolveAllowed(requestedPath: string, appRoot: string): string | null {
        if (!requestedPath) return null;
        // Un octet nul tronque le chemin côté syscall : refus immédiat.
        if (requestedPath.includes('\0')) return null;

        const absolute = path.isAbsolute(requestedPath)
            ? path.resolve(requestedPath)
            : path.resolve(appRoot, requestedPath);

        // On suit les liens symboliques avant de contrôler : un lien dans une racine
        // autorisée ne doit pas servir de passerelle vers le reste du disque.
        let real = absolute;
        try {
            real = fs.realpathSync(absolute);
        } catch {
            return null; // fichier inexistant ou illisible
        }

        if (!this.isUnder(this.normalize(real), [...this.baseRoots, ...this.userRoots])) {
            console.warn(`[MediaAccess] Accès refusé (hors racines autorisées): ${real}`);
            return null;
        }
        return real;
    }
}

export const mediaAccess = new MediaAccessRegistry();
