/**
 * AppBridge.ts
 * Pont agnostique pour GM-OS v7.
 * Gère la transition entre Electron (v6.5) et Tauri (v7).
 */

// Détection de l'environnement
// Tauri v2 définit __TAURI_INTERNALS__ ou des propriétés spécifiques
export const isTauri = !!((window as any).__TAURI__ || (window as any).__TAURI_IPC__);

// Electron v6.5 injecte un objet appBridge qui possède une propriété spécifique
// On vérifie aussi qu'il ne s'agit pas de NOTRE propre instance injectée plus tard
export const isElectron = !!((window as any).appBridge && !(window as any).appBridge._isV7Bridge);

console.log(`[AppBridge] Context Detection: Tauri=${isTauri}, Electron=${isElectron}`);

/**
 * Interface unifiée du Bridge.
 */
class AppBridgeAdapter {
    private lastProjections: Record<string, string[]> = {};
    private _convertFileSrc: any = null;
    private browserChannel: BroadcastChannel | null = null;

    public get isTauri() { return isTauri; }
    public get isElectron() { return isElectron; }
    public get isBrowser() { return !isTauri && !isElectron; }

    constructor() {
        if (isTauri) {
            this.initTauri();
        } else if (!isElectron) {
            // Support du mode navigateur pur via BroadcastChannel
            try {
                this.browserChannel = new BroadcastChannel('gmos-v7-bridge');
                console.log("[AppBridge] Browser BroadcastChannel initialized");
            } catch (e) {
                console.warn("[AppBridge] BroadcastChannel not supported in this browser");
            }
        }
    }

    private async initTauri() {
        try {
            // Tentative de récupération via l'API core si disponible immédiatement
            if ((window as any).__TAURI__?.core?.convertFileSrc) {
                this._convertFileSrc = (window as any).__TAURI__.core.convertFileSrc;
                console.log("[AppBridge] convertFileSrc loaded from global __TAURI__");
            } else {
                const { convertFileSrc } = await import('@tauri-apps/api/core');
                this._convertFileSrc = convertFileSrc;
                console.log("[AppBridge] convertFileSrc loaded via import");
            }
        } catch (e) {
            console.error("[AppBridge] Failed to load Tauri core primitives:", e);
        }
    }

    /**
     * Accès direct au bridge sous-jacent (Electron v6.5).
     * @private
     */
    private get bridge() {
        if (isElectron) {
            const b = (window as any).appBridge;
            // Sécurité supplémentaire contre la récursion
            if (b && b._isV7Bridge) return null;
            return b;
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
                // Compatibilité Electron : on propage les arguments.
                // Si le payload est un tableau, on le déballe pour correspondre à (event, arg1, arg2...)
                if (Array.isArray(event.payload)) {
                    callback(event, ...event.payload);
                } else {
                    callback(event, event.payload);
                }
            }).then(un => unlistenFn = un);

            return () => { if (unlistenFn) unlistenFn(); };
        }
        if (this.bridge?.on) {
            return this.bridge.on(channel, callback);
        }
        
        // Mode Navigateur : On écoute sur le BroadcastChannel
        if (this.browserChannel) {
            const listener = (event: MessageEvent) => {
                if (event.data?.channel === channel) {
                    const payload = event.data.payload;
                    if (Array.isArray(payload)) {
                        callback({ type: channel, payload }, ...payload);
                    } else {
                        callback({ type: channel, payload }, payload);
                    }
                }
            };
            this.browserChannel.addEventListener('message', listener);
            return () => this.browserChannel?.removeEventListener('message', listener);
        }

        return () => {};
    }

    public emit(channel: string, payload?: any): void {
        if (isTauri && (window as any).__TAURI__) {
            const { emit } = (window as any).__TAURI__.event;
            // En Tauri v2, emit est global par défaut.
            emit(channel, payload);
            
            // Gestion spéciale pour la synchronisation automatique des projecteurs
            if (channel === 'image:sync-hub-data' && payload?.type === 'projector-ready') {
                const targetId = payload.data;
                const lastPaths = this.lastProjections[targetId];
                if (lastPaths) {
                    console.log(`[AppBridge] Projector ${targetId} is ready, re-emitting last paths:`, lastPaths);
                    setTimeout(() => {
                        this.send('image:update-display', lastPaths);
                    }, 500);
                }
            }
            return;
        }
        if (this.bridge?.emit) {
            this.bridge.emit(channel, payload);
            return;
        }

        // Mode Navigateur : On diffuse via le BroadcastChannel
        if (this.browserChannel) {
            this.browserChannel.postMessage({ channel, payload });
        }
    }

    // Alias pour la compatibilité Electron
    public send(channel: string, ...args: any[]): void {
        // En Tauri v2, on force le passage par un tableau pour supporter le spread côté récepteur
        // En mode navigateur, on fait de même pour la cohérence
        this.emit(channel, args);
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
            if (isTauri && this._convertFileSrc) {
                const converted = this._convertFileSrc(path);
                console.log(`[AppBridge] Converted path: ${path} -> ${converted}`);
                return converted;
            }
            // Fallback pour Electron ou si Tauri n'est pas encore prêt
            const fallback = `file://${path.replace(/\\/g, '/')}`;
            if (isTauri) console.warn(`[AppBridge] convertFileSrc not ready, using fallback: ${fallback}`);
            return fallback;
        }
    };

    /**
     * Audio Management
     */
    public audio = {
        get hasSupport() { return true; },
        getDevices: async (): Promise<any[]> => {
            console.log("[AppBridge] audio.getDevices called");
            try {
                if (!navigator.mediaDevices) {
                    console.error("[AppBridge] navigator.mediaDevices is UNDEFINED");
                    return [];
                }

                // 🛡️ HACK : Déclencher une demande de permission pour débloquer les labels
                try {
                    console.log("[AppBridge] Triggering getUserMedia for labels...");
                    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    console.log("[AppBridge] getUserMedia SUCCESS");
                    stream.getTracks().forEach(track => track.stop());
                } catch (e) {
                    console.warn("[AppBridge] getUserMedia FAILED (Labels will be generic):", e);
                }

                const devices = await navigator.mediaDevices.enumerateDevices();
                console.log(`[AppBridge] enumerateDevices returned ${devices.length} devices`);
                return devices
                    .filter(device => device.kind === 'audiooutput')
                    .map(device => ({
                        id: device.deviceId,
                        label: device.label || (device.deviceId === 'default' ? 'Système par défaut' : `Sortie Audio (${device.deviceId.slice(0, 5)}...)`),
                        isDefault: device.deviceId === 'default'
                    }));
            } catch (e) {
                console.error("[AppBridge] Failed to get audio devices:", e);
                if (this.bridge?.audio?.getDevices) {
                    return await this.bridge.audio.getDevices();
                }
                return [];
            }
        },
        resumeContexts: async (): Promise<void> => {
            console.log("[AppBridge] audio.resumeContexts triggered");
            // @ts-expect-error global access
            if (window.soundEngine) await window.soundEngine.context.resume();
            // @ts-expect-error global access
            if (window.musicEngine) await window.musicEngine.resume();
            console.log("[AppBridge] All audio contexts resumption requested.");
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
                    path: 'sessions/autosave.json'
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
            const label = tag || 'hub';
            const url = `index.html?window=${label}`;
            await this.window.open({
                id: `window-${label}`,
                title: label === 'tablet' ? 'GM-OS Tablet Hub' : 'GM-OS Player Hub',
                url
            });
        }
    };

    /**
     * Gestion des Fenêtres (Agnostique)
     */
    public window = {
        get hasSupport() { return !!this.bridge?.window || isTauri; },
        open: async (options: any): Promise<void> => {
            if (isTauri) {
                try {
                    const { WebviewWindow, getAllWebviewWindows } = await import('@tauri-apps/api/webviewWindow');
                    
                    const label = options.id || `window-${Math.random().toString(36).substr(2, 9)}`;
                    
                    const windows = await getAllWebviewWindows();
                    const existing = windows.find((w: any) => w.label === label);

                    if (existing) {
                        await existing.setFocus();
                        return;
                    }

                    // Construction de l'URL : on s'assure d'avoir un format propre
                    let url = options.url || '';
                    if (!url.startsWith('http')) {
                        // On enlève le "index.html" s'il est présent au début pour laisser Vite gérer le routage
                        const cleanUrl = url.replace(/^index\.html/, '');
                        url = window.location.origin + window.location.pathname.replace(/\/index\.html$/, '/') + cleanUrl;
                    }
                    
                    console.log(`[AppBridge] Opening window "${label}" with URL: ${url}`);

                    const win = new WebviewWindow(label, {
                        url,
                        title: options.title || 'GM-OS Window',
                        width: options.width || 1280,
                        height: options.height || 720,
                        x: options.x,
                        y: options.y,
                        decorations: options.decorations !== undefined ? options.decorations : true,
                        transparent: options.transparent || false,
                        fullscreen: options.fullscreen || false,
                        maximized: options.maximized || false,
                        visible: false, // On commence caché pour éviter le flash blanc
                    });

                    win.once('tauri://created', () => {
                        console.log(`[AppBridge] Window "${label}" created successfully`);
                        win.show();
                        win.setFocus();
                    });

                    win.once('tauri://error', (e) => {
                        console.error(`[AppBridge] Failed to create window "${label}":`, e);
                    });
                } catch (e) {
                    console.error("[AppBridge] Failed to open window via Tauri:", e);
                }
                return;
            }
            if (this.bridge?.window?.open) {
                await this.bridge.window.open(options);
            }
        },
        close: async (id: string): Promise<void> => {
            if (isTauri) {
                try {
                    const { getAllWebviewWindows } = await import('@tauri-apps/api/webviewWindow');
                    const windows = await getAllWebviewWindows();
                    const target = windows.find(w => w.label === id);
                    if (target) await target.close();
                } catch (e) {
                    console.error("[AppBridge] Failed to close window via Tauri:", e);
                }
                return;
            }
            if (this.bridge?.window?.close) {
                await this.bridge.window.close(id);
            }
        }
    };

    /**
     * Displays - Alias et Compatibilité
     */
    public displays = {
        get hasSupport() { return true; },
        list: async (): Promise<any[]> => {
            return await this.image.getDisplays();
        },
        identify: async (): Promise<void> => {
            // Optionnel pour l'instant
        }
    };

    /**
     * Images & Projections
     */
    public image = {
        get hasSupport() { return !!this.bridge?.image || isTauri; },
        getDisplays: async (): Promise<any[]> => {
            if (isTauri) {
                try {
                    // S'assurer que withGlobalTauri est actif ou utiliser l'import
                    let monitors = [];
                    const tauriWindow = (window as any).__TAURI__?.window || (window as any).__TAURI__?.webviewWindow;
                    
                    if (tauriWindow && tauriWindow.availableMonitors) {
                        monitors = await tauriWindow.availableMonitors();
                    } else {
                        const { availableMonitors } = await import('@tauri-apps/api/window');
                        monitors = await availableMonitors();
                    }

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
                let x = undefined, y = undefined;
                if (displayId.startsWith('monitor-')) {
                    const displays = await this.image.getDisplays();
                    const targetMonitor = displays.find(d => d.id === displayId);
                    if (targetMonitor && targetMonitor.position) {
                        x = targetMonitor.position.x;
                        y = targetMonitor.position.y;
                    }
                }

                // Mémoriser la projection pour cette cible
                this.lastProjections[displayId] = paths;

                const label = `projector-${displayId}`;
                const isBlackout = !paths || paths.length === 0;

                if (isBlackout) {
                    const { getAllWebviewWindows } = await import('@tauri-apps/api/webviewWindow');
                    const windows = await getAllWebviewWindows();
                    const existing = windows.find((w: any) => w.label === label);
                    if (!existing) return; // Ne pas ouvrir de nouvelle fenêtre pour un blackout
                }

                await this.window.open({
                    id: label,
                    title: `GM-OS Projection - ${displayId}`,
                    url: `index.html?window=projector&displayId=${displayId}`,
                    x, y,
                    decorations: false,
                    fullscreen: true,
                });

                // On émet après un délai plus long (2s) ou on compte sur la sync auto
                setTimeout(() => {
                    this.send('image:update-display', paths);
                }, 1500);
                return;
            }
            if (this.bridge?.image?.launchDisplay) {
                this.bridge.image.launchDisplay(paths, displayId);
            }
        },
        closeAllDisplays: async (): Promise<void> => {
            if (isTauri) {
                const { getAllWebviewWindows } = await import('@tauri-apps/api/webviewWindow');
                const windows = await getAllWebviewWindows();
                for (const w of windows) {
                    if (w.label.startsWith('projector-')) {
                        await w.close();
                    }
                }
                return;
            }
            if (this.bridge?.image?.closeAllDisplays) {
                this.bridge.image.closeAllDisplays();
            }
        },
        syncHubData: (type: string, data: any): void => {
            this.send('image:sync-hub-data', type, data);
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
        }
    };

    /**
     * App - Cycle de vie
     */
    public app = {
        get hasSupport() { return !!this.bridge?.app || isTauri; },
        quit: () => {
            if (isTauri) { this.invokeTauri('quit_app'); return; }
            if (this.bridge?.app?.quit) this.bridge.app.quit();
        },
        getVersion: async (): Promise<string> => {
            if (isTauri) return await this.invokeTauri<string>('get_app_version') || "0.1.0-tauri";
            if (this.bridge?.app?.getVersion) return await this.bridge.app.getVersion();
            return "0.0.0";
        },
        onDisplayChanged: (callback: (count: number) => void): (() => void) => {
            if (this.bridge?.app?.onDisplayChanged) {
                return this.bridge.app.onDisplayChanged(callback);
            }
            // Fallback Tauri (simulation ou écoute événement système si dispo)
            return () => {};
        }
    };

    /**
     * Sécurité & Secrets
     */
    public security = {
        get hasSupport() { return !!this.bridge?.security || isTauri; },
        getSecret: async (id: string): Promise<string | null> => {
            if (isTauri) return await this.invokeTauri<string | null>('get_secret', { id });
            if (this.bridge?.security?.getSecret) return await this.bridge.security.getSecret(id);
            return null;
        },
        saveSecret: async (id: string, value: string): Promise<boolean> => {
            if (isTauri) return await this.invokeTauri<boolean>('save_secret', { id, value }) || false;
            if (this.bridge?.security?.saveSecret) return await this.bridge.security.saveSecret(id, value);
            return false;
        }
    };

    /**
     * IA & Oracle
     */
    public ai = {
        get hasSupport() { return !!this.bridge?.ai || isTauri; },
        listDocs: async (): Promise<any[]> => {
            if (this.bridge?.ai?.listDocs) return await this.bridge.ai.listDocs();
            return [];
        },
        readDoc: async (path: string): Promise<string | null> => {
            if (isTauri) return await this.fs.readTextFile(path);
            if (this.bridge?.ai?.readDoc) return await this.bridge.ai.readDoc(path);
            return null;
        },
        writeDoc: async (path: string, content: string): Promise<boolean> => {
            if (isTauri) return await this.fs.writeTextFile(path, content);
            if (this.bridge?.ai?.writeDoc) return await this.bridge.ai.writeDoc(path, content);
            return false;
        }
    };

    /**
     * IPC Module (Alias)
     */
    public ipc = {
        on: (channel: string, callback: (...args: any[]) => void) => this.on(channel, callback),
        emit: (channel: string, payload?: any) => this.emit(channel, payload),
        send: (channel: string, ...args: any[]) => this.send(channel, ...args)
    };
}

export const AppBridge = new AppBridgeAdapter();

// Injection globale pour compatibilité v6 avec marqueur pour éviter la récursion
(AppBridge as any)._isV7Bridge = true;
(window as any).appBridge = AppBridge;
