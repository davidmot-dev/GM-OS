/**
 * AppBridge.ts
 * Pont agnostique pour GM-OS v7.
 * Gère la transition entre Electron (v6.5) et Tauri (v7).
 */

// Détection de l'environnement
export const isTauri = !!(window as any).__TAURI__;
export const isElectron = !!(window as any).appBridge;

/**
 * Interface unifiée du Bridge.
 * Pour la v6.5 Electron, elle renvoie directement window.appBridge.
 * Pour la v7 Tauri, elle mappe les appels vers Rust via invoke().
 */
class AppBridgeAdapter {
    /**
     * Accès direct au bridge sous-jacent.
     * @private
     */
    private get bridge() {
        if (isElectron) {
            return (window as any).appBridge;
        }
        // Fallback pour le développement web ou Tauri non encore implémenté
        return null;
    }

    /**
     * Logger système
     */
    public logger = {
        info: (message: string, ...args: any[]) => {
            if (this.bridge?.logger) {
                this.bridge.logger.info(message, ...args);
            } else {
                console.info(`[INFO] ${message}`, ...args);
            }
        },
        warn: (message: string, ...args: any[]) => {
            if (this.bridge?.logger) {
                this.bridge.logger.warn(message, ...args);
            } else {
                console.warn(`[WARN] ${message}`, ...args);
            }
        },
        error: (message: string, ...args: any[]) => {
            if (this.bridge?.logger) {
                this.bridge.logger.error(message, ...args);
            } else {
                console.error(`[ERROR] ${message}`, ...args);
            }
        },
        debug: (message: string, ...args: any[]) => {
            if (this.bridge?.logger) {
                this.bridge.logger.debug(message, ...args);
            } else {
                console.debug(`[DEBUG] ${message}`, ...args);
            }
        }
    };

    /**
     * Utilitaires
     */
    public utils = {
        get hasSupport() { return !!this.bridge?.utils; },
        formatFileUrl: (path: string): string => {
            if (this.bridge?.utils?.formatFileUrl) {
                return this.bridge.utils.formatFileUrl(path);
            }
            return path;
        }
    };

    /**
     * Session & Système
     */
    public session = {
        get hasSupport() { return !!this.bridge?.session; },
        saveSession: async (data: Record<string, unknown>): Promise<boolean> => {
            if (this.bridge?.session?.saveSession) {
                return await this.bridge.session.saveSession(data);
            }
            return false;
        },
        loadSession: async (): Promise<Record<string, unknown> | null> => {
            if (this.bridge?.session?.loadSession) {
                return await this.bridge.session.loadSession();
            }
            return null;
        },
        launchHubWindow: (tag?: string): void => {
            if (this.bridge?.session?.launchHubWindow) {
                this.bridge.session.launchHubWindow(tag);
            }
        }
    };

    /**
     * Sécurité & Secrets (Trousseau)
     */
    public security = {
        get hasSupport() { return !!this.bridge?.security; },
        getSecret: async (id: string): Promise<string | null> => {
            if (this.bridge?.security?.getSecret) {
                return await this.bridge.security.getSecret(id);
            }
            return null;
        },
        saveSecret: async (id: string, value: string): Promise<boolean> => {
            if (this.bridge?.security?.saveSecret) {
                return await this.bridge.security.saveSecret(id, value);
            }
            return false;
        },
        deleteSecret: async (id: string): Promise<boolean> => {
            if (this.bridge?.security?.deleteSecret) {
                return await this.bridge.security.deleteSecret(id);
            }
            return false;
        }
    };

    /**
     * MCP (Model Context Protocol) - NotebookLM, etc.
     */
    public mcp = {
        get hasSupport() { return !!this.bridge?.mcp; },
        listTools: async (serverName: string): Promise<any[]> => {
            if (this.bridge?.mcp?.listTools) {
                return await this.bridge.mcp.listTools(serverName);
            }
            return [];
        },
        callTool: async (serverName: string, toolName: string, args: Record<string, unknown>): Promise<any> => {
            if (this.bridge?.mcp?.callTool) {
                return await this.bridge.mcp.callTool(serverName, toolName, args);
            }
            return { error: 'MCP not available' };
        },
        reauthenticate: async (): Promise<{ success: boolean; message: string }> => {
            if (this.bridge?.mcp?.reauthenticate) {
                return await this.bridge.mcp.reauthenticate();
            }
            return { success: false, message: 'MCP not available' };
        },
        restart: async (): Promise<{ success: boolean; message: string }> => {
            if (this.bridge?.mcp?.restart) {
                return await this.bridge.mcp.restart();
            }
            return { success: false, message: 'MCP not available' };
        }
    };

    /**
     * Obsidian - Gestion du coffre (Vault)
     */
    public obsidian = {
        get hasSupport() { return !!this.bridge?.obsidian; },
        listNotes: async (vaultPath?: string): Promise<NoteEntry[]> => {
            if (this.bridge?.obsidian?.listNotes) {
                return await this.bridge.obsidian.listNotes(vaultPath);
            }
            return [];
        },
        readNote: async (relativePath: string, vaultPath?: string): Promise<string | null> => {
            if (this.bridge?.obsidian?.readNote) {
                return await this.bridge.obsidian.readNote(relativePath, vaultPath);
            }
            return null;
        },
        writeNote: async (relativePath: string, content: string, vaultPath?: string): Promise<boolean> => {
            if (this.bridge?.obsidian?.writeNote) {
                return await this.bridge.obsidian.writeNote(relativePath, content, vaultPath);
            }
            return false;
        },
        selectVault: async (): Promise<string | null> => {
            if (this.bridge?.obsidian?.selectVault) {
                return await this.bridge.obsidian.selectVault();
            }
            return null;
        }
    };

    /**
     * IA - Gestion documentaire et Ollama
     */
    public ai = {
        get hasSupport() { return !!this.bridge?.ai; },
        listDocs: async (): Promise<AIDocument[]> => {
            if (this.bridge?.ai?.listDocs) {
                return await this.bridge.ai.listDocs();
            }
            return [];
        },
        readDoc: async (filePath: string): Promise<string | null> => {
            if (this.bridge?.ai?.readDoc) {
                return await this.bridge.ai.readDoc(filePath);
            }
            return null;
        },
        writeDoc: async (filePath: string, content: string): Promise<boolean> => {
            if (this.bridge?.ai?.writeDoc) {
                return await this.bridge.ai.writeDoc(filePath, content);
            }
            return false;
        },
        extractPdf: async (filePath: string): Promise<string> => {
            if (this.bridge?.ai?.extractPdf) {
                return await this.bridge.ai.extractPdf(filePath);
            }
            return "";
        },
        proxyRequest: async (url: string, method: string, headers: Record<string, string>, body: unknown): Promise<AIProxyResponse> => {
            if (this.bridge?.ai?.proxyRequest) {
                return await this.bridge.ai.proxyRequest(url, method, headers, body);
            }
            return { ok: false, data: null };
        },
        reindex: async (customPath?: string): Promise<boolean> => {
            if (this.bridge?.ai?.reindex) {
                return await this.bridge.ai.reindex(customPath);
            }
            return false;
        },
        ollamaChat: async (model: string, messages: { role: string; content: string }[]): Promise<string> => {
            if (this.bridge?.ai?.ollamaChat) {
                return await this.bridge.ai.ollamaChat(model, messages);
            }
            return "";
        },
        ollamaStatus: async (endpoint?: string): Promise<boolean> => {
            if (this.bridge?.ai?.ollamaStatus) {
                return await this.bridge.ai.ollamaStatus(endpoint);
            }
            return false;
        },
        ollamaListModels: async (endpoint?: string): Promise<string[]> => {
            if (this.bridge?.ai?.ollamaListModels) {
                return await this.bridge.ai.ollamaListModels(endpoint);
            }
            return [];
        },
        ollamaPull: async (model: string, endpoint?: string): Promise<boolean> => {
            if (this.bridge?.ai?.ollamaPull) {
                return await this.bridge.ai.ollamaPull(model, endpoint);
            }
            return false;
        }
    };

    /**
     * FS - Système de fichiers
     */
    public fs = {
        get hasSupport() { return !!this.bridge?.fs; },
        readTextFile: async (path: string): Promise<string | null> => {
            if (this.bridge?.fs?.readTextFile) {
                return await this.bridge.fs.readTextFile(path);
            }
            return null;
        },
        writeTextFile: async (path: string, content: string): Promise<boolean> => {
            if (this.bridge?.fs?.writeTextFile) {
                return await this.bridge.fs.writeTextFile(path, content);
            }
            return false;
        },
        exists: async (path: string): Promise<boolean> => {
            if (this.bridge?.fs?.exists) {
                return await this.bridge.fs.exists(path);
            }
            return false;
        },
        selectFile: async (options?: any): Promise<string | null> => {
            if (this.bridge?.fs?.selectFile) {
                return await this.bridge.fs.selectFile(options);
            }
            return null;
        },
        selectFolder: async (options?: any): Promise<string | null> => {
            if (this.bridge?.fs?.selectFolder) {
                return await this.bridge.fs.selectFolder(options);
            }
            return null;
        }
    };

    /**
     * App - Cycle de vie et informations
     */
    public app = {
        get hasSupport() { return !!this.bridge?.app; },
        quit: () => {
            if (this.bridge?.app?.quit) {
                this.bridge.app.quit();
            }
        },
        getVersion: async (): Promise<string> => {
            if (this.bridge?.app?.getVersion) {
                return await this.bridge.app.getVersion();
            }
            return "0.0.0";
        },
        getPath: async (name: string): Promise<string> => {
            if (this.bridge?.app?.getPath) {
                return await this.bridge.app.getPath(name);
            }
            return "";
        },
        relaunch: () => {
            if (this.bridge?.app?.relaunch) {
                this.bridge.app.relaunch();
            }
        },
        onDisplayChanged: (callback: (count: number) => void): (() => void) => {
            if (this.bridge?.app?.onDisplayChanged) {
                return this.bridge.app.onDisplayChanged(callback);
            }
            return () => {};
        }
    };

    /**
     * Displays - Gestion des écrans et Projection
     */
    public displays = {
        get hasSupport() { return !!this.bridge?.displays || !!this.bridge?.image || !!this.bridge?.remote?.getDisplays; },
        list: async (): Promise<DisplayInfo[]> => {
            // Tentative via différents points d'entrée historiques
            if (this.bridge?.displays?.list) return await this.bridge.displays.list();
            if (this.bridge?.image?.getDisplays) return await this.bridge.image.getDisplays();
            if (this.bridge?.remote?.getDisplays) return await this.bridge.remote.getDisplays();
            return [];
        },
        identify: async (): Promise<void> => {
            if (this.bridge?.displays?.identify) {
                await this.bridge.displays.identify();
            }
        },
        setProjection: async (displayId: string | number, enabled: boolean, options?: any): Promise<boolean> => {
            if (this.bridge?.displays?.setProjection) {
                return await this.bridge.displays.setProjection(displayId, enabled, options);
            }
            if (this.bridge?.image?.openProjectionWindow && enabled) {
                this.bridge.image.openProjectionWindow(displayId, options?.url);
                return true;
            }
            if (this.bridge?.image?.closeProjectionWindow && !enabled) {
                this.bridge.image.closeProjectionWindow(displayId);
                return true;
            }
            return false;
        }
    };

    /**
     * Git - Synchronisation de données
     */
    public git = {
        get hasSupport() { return !!this.bridge?.git; },
        getStatus: async () => {
            if (this.bridge?.git?.getStatus) return await this.bridge.git.getStatus();
            return { available: false, isRepo: false, branch: '', exists: false };
        },
        syncData: async (directory: string, branch: string, message: string) => {
            if (this.bridge?.git?.syncData) return await this.bridge.git.syncData(directory, branch, message);
            return { success: false, timestamp: '', error: 'Not supported' };
        }
    };

    /**
     * NPC - Gestion des avatars et bases de données
     */
    public npc = {
        get hasSupport() { return !!this.bridge?.npc; },
        listDatabases: async (category: string) => {
            if (this.bridge?.npc?.listDatabases) return await this.bridge.npc.listDatabases(category);
            return [];
        },
        selectAvatar: async () => {
            if (this.bridge?.npc?.selectAvatar) return await this.bridge.npc.selectAvatar();
            return null;
        }
    };

    /**
     * IPC - Communication bas niveau
     */
    public ipc = {
        on: (channel: string, callback: (event: any, ...args: any[]) => void) => {
            if (this.bridge?.on) this.bridge.on(channel, callback);
        },
        off: (channel: string, callback: (event: any, ...args: any[]) => void) => {
            if (this.bridge?.off) this.bridge.off(channel, callback);
        },
        send: (channel: string, ...args: any[]) => {
            if (this.bridge?.send) this.bridge.send(channel, ...args);
        }
    };

    // Note: Nous ajouterons les autres modules (nexus, remote, etc.) au fur et à mesure.
}

export const AppBridge = new AppBridgeAdapter();

// Pour la compatibilité avec le code existant qui utilise window.appBridge
// Nous pourrions éventuellement l'injecter ici s'il n'est pas déjà présent
if (!isElectron && !isTauri) {
    (window as any).appBridge = AppBridge;
}
