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
        return null;
    }

    /**
     * Appelle une commande Rust via Tauri invoke.
     * @private
     */
    private async invokeTauri<T>(command: string, args?: any): Promise<T | null> {
        if (isTauri && (window as any).__TAURI__) {
            try {
                const { invoke } = (window as any).__TAURI__.core;
                return await invoke(command, args);
            } catch (error) {
                console.error(`[AppBridge] Tauri invoke error (${command}):`, error);
                return null;
            }
        }
        return null;
    }

    /**
     * Gestion des événements IPC (Agnostique)
     */
    public on(channel: string, callback: (...args: any[]) => void): () => void {
        if (isTauri && (window as any).__TAURI__) {
            const { listen } = (window as any).__TAURI__.event;
            let unlistenFn: (() => void) | null = null;
            
            listen(channel, (event: any) => {
                callback(event, event.payload);
            }).then(un => unlistenFn = un);

            return () => { if (unlistenFn) unlistenFn(); };
        }
        if (this.bridge?.on) {
            return this.bridge.on(channel, callback);
        }
        return () => {};
    }

    public emit(channel: string, payload?: any): void {
        if (isTauri && (window as any).__TAURI__) {
            const { emit } = (window as any).__TAURI__.event;
            emit(channel, payload);
            return;
        }
        if (this.bridge?.emit) {
            this.bridge.emit(channel, payload);
        }
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
        get hasSupport() { return !!this.bridge?.utils || isTauri; },
        formatFileUrl: (path: string): string => {
            if (isTauri && (window as any).__TAURI__) {
                // Tauri v2 convertFileSrc equivalent
                return (window as any).__TAURI__.core.convertFileSrc(path);
            }
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
        get hasSupport() { return !!this.bridge?.session || isTauri; },
        saveSession: async (data: Record<string, unknown>): Promise<boolean> => {
            if (isTauri) {
                const res = await this.invokeTauri<string>('save_session', { 
                    data: JSON.stringify(data),
                    path: 'sessions/autosave.json' // Path temporaire pour test
                });
                return !!res;
            }
            if (this.bridge?.session?.saveSession) {
                return await this.bridge.session.saveSession(data);
            }
            return false;
        },
        loadSession: async (): Promise<Record<string, unknown> | null> => {
            if (isTauri) {
                const content = await this.invokeTauri<string>('load_session', { 
                    path: 'sessions/autosave.json' 
                });
                return content ? JSON.parse(content) : null;
            }
            if (this.bridge?.session?.loadSession) {
                return await this.bridge.session.loadSession();
            }
            return null;
        },
        launchHubWindow: async (tag?: string): Promise<void> => {
            if (isTauri) {
                const label = tag || 'hub';
                const url = `index.html?window=${label}`;
                await this.window.open({
                    id: `window-${label}`,
                    title: label === 'tablet' ? 'GM-OS Tablet Hub' : 'GM-OS Player Hub',
                    url
                });
                return;
            }
            if (this.bridge?.session?.launchHubWindow) {
                this.bridge.session.launchHubWindow(tag);
            }
        }
    };

    /**
     * Gestion des Fenêtres (Tauri Native)
     */
    public window = {
        get hasSupport() { return isTauri || !!(window as any).appBridge?.window; },
        open: async (options: { 
            id: string, 
            title: string, 
            url: string, 
            x?: number, 
            y?: number, 
            width?: number, 
            height?: number,
            decorations?: boolean,
            transparent?: boolean
        }): Promise<boolean> => {
            if (isTauri && (window as any).__TAURI__) {
                try {
                    const { WebviewWindow } = (window as any).__TAURI__.window;
                    const webview = new WebviewWindow(options.id, {
                        url: options.url,
                        title: options.title,
                        x: options.x,
                        y: options.y,
                        width: options.width || 1280,
                        height: options.height || 720,
                        decorations: options.decorations ?? true,
                        transparent: options.transparent ?? false,
                    });

                    await new Promise((resolve, reject) => {
                        webview.once('tauri://created', () => resolve(true));
                        webview.once('tauri://error', (e: any) => reject(e));
                    });
                    return true;
                } catch (e) {
                    console.error("[AppBridge] Failed to open window:", e);
                    return false;
                }
            }
            // Fallback Electron (si implémenté dans le bridge v6)
            if ((window as any).appBridge?.window?.open) {
                return await (window as any).appBridge.window.open(options);
            }
            return false;
        },
        close: async (id: string): Promise<boolean> => {
            if (isTauri && (window as any).__TAURI__) {
                const { getAllWindows } = (window as any).__TAURI__.window;
                const windows = await getAllWindows();
                const target = windows.find((w: any) => w.label === id);
                if (target) {
                    await target.close();
                    return true;
                }
            }
            return false;
        }
    };

    /**
     * Sécurité & Secrets (Trousseau)
     */
    public security = {
        get hasSupport() { return !!this.bridge?.security || isTauri; },
        getSecret: async (id: string): Promise<string | null> => {
            if (isTauri) {
                return await this.invokeTauri<string | null>('get_secret', { id });
            }
            if (this.bridge?.security?.getSecret) {
                return await this.bridge.security.getSecret(id);
            }
            return null;
        },
        saveSecret: async (id: string, value: string): Promise<boolean> => {
            if (isTauri) {
                return await this.invokeTauri<boolean>('save_secret', { id, value }) || false;
            }
            if (this.bridge?.security?.saveSecret) {
                return await this.bridge.security.saveSecret(id, value);
            }
            return false;
        },
        deleteSecret: async (id: string): Promise<boolean> => {
            if (isTauri) {
                return await this.invokeTauri<boolean>('delete_secret', { id }) || false;
            }
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
        get hasSupport() { return !!this.bridge?.mcp || isTauri; },
        listTools: async (serverName: string): Promise<any[]> => {
            if (isTauri) {
                // Pour l'instant, on liste les outils via une commande Rust
                const res = await this.invokeTauri<any>('call_mcp_tool', { method: 'tools/list', params: {} });
                return res?.tools || [];
            }
            if (this.bridge?.mcp?.listTools) {
                return await this.bridge.mcp.listTools(serverName);
            }
            return [];
        },
        callTool: async (serverName: string, toolName: string, args: Record<string, unknown>): Promise<any> => {
            if (isTauri) {
                return await this.invokeTauri<any>('call_mcp_tool', { 
                    method: 'tools/call', 
                    params: { name: toolName, arguments: args } 
                });
            }
            if (this.bridge?.mcp?.callTool) {
                return await this.bridge.mcp.callTool(serverName, toolName, args);
            }
            return { error: 'MCP not available' };
        },
        reauthenticate: async (): Promise<{ success: boolean; message: string }> => {
            if (isTauri) {
                // TODO: Implémenter l'auth CLI via Rust
                return { success: false, message: 'Not implemented in Tauri yet' };
            }
            if (this.bridge?.mcp?.reauthenticate) {
                return await this.bridge.mcp.reauthenticate();
            }
            return { success: false, message: 'MCP not available' };
        },
        restart: async (): Promise<{ success: boolean; message: string }> => {
            if (isTauri) {
                await this.invokeTauri('stop_mcp_server');
                // En Tauri, on redémarre au besoin lors du premier appel, 
                // ou on peut appeler start_mcp_server ici avec des chemins par défaut.
                return { success: true, message: 'Serveur MCP arrêté (sera relancé au prochain appel)' };
            }
            if (this.bridge?.mcp?.restart) {
                return await this.bridge.mcp.restart();
            }
            return { success: false, message: 'MCP not available' };
        }
    };

    /**
     * Images & Projections
     */
    public image = {
        get hasSupport() { return !!this.bridge?.image || isTauri; },
        getDisplays: async (): Promise<any[]> => {
            if (isTauri && (window as any).__TAURI__) {
                try {
                    const monitors = await (window as any).__TAURI__.window.availableMonitors();
                    return monitors.map((m: any, index: number) => ({
                        id: `monitor-${index}`,
                        label: m.name || `Écran ${index + 1}`,
                        bounds: m.size,
                        position: m.position,
                        isPrimary: false
                    }));
                } catch (e) {
                    console.error("[AppBridge] Failed to get monitors:", e);
                    return [];
                }
            }
            if (this.bridge?.image?.getDisplays) {
                return await this.bridge.image.getDisplays();
            }
            return [];
        },
        launchDisplay: async (paths: string[], displayId: string): Promise<void> => {
            if (isTauri) {
                // 1. Trouver les coordonnées du moniteur si c'est un moniteur physique
                let x = undefined;
                let y = undefined;
                
                if (displayId.startsWith('monitor-')) {
                    const displays = await this.image.getDisplays();
                    const targetMonitor = displays.find(d => d.id === displayId);
                    if (targetMonitor && targetMonitor.position) {
                        x = targetMonitor.position.x;
                        y = targetMonitor.position.y;
                    }
                }

                // 2. Ouvrir la fenêtre de projection si elle n'existe pas
                const url = `index.html?window=projector&displayId=${displayId}`;
                await this.window.open({
                    id: `projector-${displayId}`,
                    title: `GM-OS Projection - ${displayId}`,
                    url,
                    x,
                    y,
                    decorations: false,
                });

                // 2. Envoyer les données via IPC
                // Attendre un peu que la fenêtre soit prête (ou utiliser un signal de retour)
                setTimeout(() => {
                    this.emit('image:update-display', paths);
                }, 500);
                return;
            }
            if (this.bridge?.image?.launchDisplay) {
                this.bridge.image.launchDisplay(paths, displayId);
            }
        },
        syncHubData: (type: string, data: any): void => {
            if (isTauri) {
                this.emit('image:sync-hub-data', type, data);
                return;
            }
            if (this.bridge?.image?.syncHubData) {
                this.bridge.image.syncHubData(type, data);
            }
        }
    };
    public ai = {
        get hasSupport() { return !!this.bridge?.ai || isTauri; },
        listDocs: async (): Promise<any[]> => {
            if (isTauri) {
                // TODO: Implémenter via Rust ou FS plugin
                return [];
            }
            if (this.bridge?.ai?.listDocs) return await this.bridge.ai.listDocs();
            return [];
        },
        readDoc: async (path: string): Promise<string | null> => {
            if (isTauri) {
                return await this.fs.readTextFile(path);
            }
            if (this.bridge?.ai?.readDoc) return await this.bridge.ai.readDoc(path);
            return null;
        },
        writeDoc: async (path: string, content: string): Promise<boolean> => {
            if (isTauri) {
                return await this.fs.writeTextFile(path, content);
            }
            if (this.bridge?.ai?.writeDoc) return await this.bridge.ai.writeDoc(path, content);
            return false;
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
        get hasSupport() { return !!this.bridge?.fs || isTauri; },
        readTextFile: async (path: string): Promise<string | null> => {
            if (isTauri) {
                return await this.invokeTauri<string>('plugin:fs|read_text_file', { path });
            }
            if (this.bridge?.fs?.readTextFile) {
                return await this.bridge.fs.readTextFile(path);
            }
            return null;
        },
        writeTextFile: async (path: string, content: string): Promise<boolean> => {
            if (isTauri) {
                await this.invokeTauri('plugin:fs|write_text_file', { path, contents: Array.from(new TextEncoder().encode(content)) });
                return true;
            }
            if (this.bridge?.fs?.writeTextFile) {
                return await this.bridge.fs.writeTextFile(path, content);
            }
            return false;
        },
        exists: async (path: string): Promise<boolean> => {
            if (isTauri) {
                return await this.invokeTauri<boolean>('plugin:fs|exists', { path }) || false;
            }
            if (this.bridge?.fs?.exists) {
                return await this.bridge.fs.exists(path);
            }
            return false;
        },
        selectFile: async (options?: any): Promise<string | null> => {
            if (isTauri) {
                // Utilisation du plugin dialog via invoke
                const res = await this.invokeTauri<any>('plugin:dialog|open', { 
                    multiple: false,
                    directory: false,
                    ...options 
                });
                return typeof res === 'string' ? res : (Array.isArray(res) ? res[0] : null);
            }
            if (this.bridge?.fs?.selectFile) {
                return await this.bridge.fs.selectFile(options);
            }
            return null;
        },
        selectFolder: async (options?: any): Promise<string | null> => {
            if (isTauri) {
                const res = await this.invokeTauri<string | null>('plugin:dialog|open', { 
                    multiple: false,
                    directory: true,
                    ...options 
                });
                return res;
            }
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
        get hasSupport() { return !!this.bridge?.app || isTauri; },
        quit: () => {
            if (isTauri) {
                this.invokeTauri('quit_app');
                return;
            }
            if (this.bridge?.app?.quit) {
                this.bridge.app.quit();
            }
        },
        getVersion: async (): Promise<string> => {
            if (isTauri) {
                return await this.invokeTauri<string>('get_app_version') || "0.1.0-tauri";
            }
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
            if (isTauri) {
                this.invokeTauri('relaunch_app');
                return;
            }
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
        get hasSupport() { return !!this.bridge?.displays || !!this.bridge?.image || !!this.bridge?.remote?.getDisplays || isTauri; },
        list: async (): Promise<DisplayInfo[]> => {
            if (isTauri) {
                return await this.invokeTauri<DisplayInfo[]>('get_displays') || [];
            }
            // Tentative via différents points d'entrée historiques
            if (this.bridge?.displays?.list) return await this.bridge.displays.list();
            if (this.bridge?.image?.getDisplays) return await this.bridge.image.getDisplays();
            if (this.bridge?.remote?.getDisplays) return await this.bridge.remote.getDisplays();
            return [];
        },
        identify: async (): Promise<void> => {
            if (isTauri) {
                await this.invokeTauri('identify_display');
                return;
            }
            if (this.bridge?.displays?.identify) {
                await this.bridge.displays.identify();
            }
        },
        setProjection: async (displayId: string | number, enabled: boolean, options?: any): Promise<boolean> => {
            if (isTauri) {
                return await this.invokeTauri<boolean>('set_projection', { displayId: displayId.toString(), enabled }) || false;
            }
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
        get hasSupport() { return !!this.bridge?.git || isTauri; },
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
            if (isTauri && (window as any).__TAURI__) {
                const { emit } = (window as any).__TAURI__.event;
                emit(channel, ...args);
                return;
            }
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
