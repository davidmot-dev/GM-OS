import { contextBridge, ipcRenderer, webUtils } from 'electron'

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('appBridge', {
    on(...args: Parameters<typeof ipcRenderer.on>) {
        const [channel, listener] = args
        return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args))
    },
    off(...args: Parameters<typeof ipcRenderer.off>) {
        const [channel, ...omit] = args
        return ipcRenderer.off(channel, ...omit)
    },
    send(...args: Parameters<typeof ipcRenderer.send>) {
        const [channel, ...omit] = args
        return ipcRenderer.send(channel, ...omit)
    },
    invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
        const [channel, ...omit] = args
        return ipcRenderer.invoke(channel, ...omit)
    },
    getPathForFile(file: File) {
        return webUtils.getPathForFile(file)
    },
    app: {
        quit: () => ipcRenderer.send('app:quit'),
        onDisplayChanged: (callback: (count: number) => void) => {
            const listener = (_event: Electron.IpcRendererEvent, count: number) => callback(count);
            ipcRenderer.on('app:display-changed', listener);
            return () => ipcRenderer.off('app:display-changed', listener);
        }
    },
    debug: {
        openConsole: () => ipcRenderer.send('debug:open-console')
    },
    session: {
        launchHubWindow: (mode?: string) => ipcRenderer.send('session:launch-hub-window', mode),
        saveSession: (data: unknown) => ipcRenderer.invoke('save-session', data),
        loadSession: () => ipcRenderer.invoke('load-session'),
    },
    npc: {
        listDatabases: (category: string) => ipcRenderer.invoke('npc:list-databases', category),
        loadDatabase: (category: string, name: string) => ipcRenderer.invoke('npc:load-database', category, name),
        selectAvatar: () => ipcRenderer.invoke('npc:select-avatar'),
        saveAvatar: (buffer: ArrayBuffer, fileName: string) => ipcRenderer.invoke('npc:save-avatar', buffer, fileName)
    },
    tables: {
        listUniverses: () => ipcRenderer.invoke('tables:list-universes'),
        listTables: (universe: string) => ipcRenderer.invoke('tables:list-tables', universe),
        loadTable: (universe: string, tableName: string) => ipcRenderer.invoke('tables:load-table', universe, tableName)
    },
    web: {
        openExternal: (url: string) => ipcRenderer.send('web:open-external', url),
        saveList: (data: unknown) => ipcRenderer.invoke('web:save-list', data),
        loadList: () => ipcRenderer.invoke('web:load-list'),
    },
    image: {
        getDisplays: () => ipcRenderer.invoke('image:get-displays'),
        syncHubData: (type: 'image' | 'entity' | 'voice-level', data: string) => ipcRenderer.send('image:sync-hub-data', type, data),
        launchDisplay: (paths: string[], target: string) => ipcRenderer.send('image:launch-display', paths, target),
        closeAllDisplays: () => ipcRenderer.send('image:close-all-displays')
    },
    sound: {
        loadAudios: () => ipcRenderer.invoke('sound:load-audios')
    },
    tactical: {
        listSounds: () => ipcRenderer.invoke('tactical:list-sounds')
    },
    light: {
        request: (url: string, method: string, body?: unknown) => ipcRenderer.invoke('light:request', url, method, body)
    },
    clock: {
        listCalendars: () => ipcRenderer.invoke('clock:list-calendars'),
        loadCalendar: (id: string) => ipcRenderer.invoke('clock:load-calendar', id)
    },
    utils: {
        formatFileUrl: (path: string) => {
            if (!path) return '';
            // Si le chemin contient déjà un protocole (ex: gmos://, http://, data:), on le retourne tel quel
            if (path.includes('://') || path.startsWith('data:')) return path;
            const normalized = path.replace(/\\/g, '/');
            return `file:///${encodeURI(normalized).replace(/#/g, '%23').replace(/\?/g, '%3F')}`;
        }
    },
    ai: {
        listDocs: () => ipcRenderer.invoke('ai:list-docs'),
        /** Dossiers sous docs/systems/, pour resoudre le corpus d'un systeme. */
        listSystems: (): Promise<string[]> => ipcRenderer.invoke('ai:list-systems'),
        /** Fichiers d'un dossier de docs/, sans recursion. */
        listDir: (relativePath: string): Promise<string[]> => ipcRenderer.invoke('ai:list-dir', relativePath),
        /** Supprime un document — les brouillons de la Forge, une fois publies. */
        deleteDoc: (relativePath: string): Promise<boolean> => ipcRenderer.invoke('ai:delete-doc', relativePath),
        /** Cree les dossiers d'un corpus. Rend ceux qui ont reellement ete crees. */
        createCorpus: (dossiers: string[]): Promise<string[]> => ipcRenderer.invoke('ai:create-corpus', dossiers),
        /** Resout les sections citees par une fiche en pages de l'index du livre. */
        resolveSections: (systeme: string, contenuFiche: string) =>
            ipcRenderer.invoke('ai:resolve-sections', systeme, contenuFiche),
        readDoc: (filePath: string) => ipcRenderer.invoke('ai:read-doc', filePath),
        writeDoc: (filePath: string, content: string) => ipcRenderer.invoke('ai:write-doc', filePath, content),
        extractPDF: (filePath: string) => ipcRenderer.invoke('ai:extract-pdf', filePath),
        proxyRequest: (url: string, method: string, headers: Record<string, string>, body: unknown) => 
            ipcRenderer.invoke('ai:proxy-request', url, method, headers, body),
        searchContext: (
            systemId: string,
            campaignName: string,
            options?: { query?: string; systemName?: string; systemPath?: string; campaignPath?: string; maxTokens?: number },
        ) => ipcRenderer.invoke('ai:search-context', systemId, campaignName, options),
        reindex: (customPath?: string) => ipcRenderer.invoke('ai:reindex', customPath),
        // Ollama Local AI
        ollamaChat: (
            model: string,
            messages: { role: string; content: string }[],
            endpoint?: string,
            options?: { json?: boolean; num_ctx?: number; num_predict?: number },
        ) => ipcRenderer.invoke('ai:ollama-chat', model, messages, endpoint, options),
        ollamaChatStream: (model: string, messages: { role: string; content: string }[], endpoint?: string) => ipcRenderer.invoke('ai:ollama-chat-stream', model, messages, endpoint),
        ollamaStatus: (endpoint?: string) => ipcRenderer.invoke('ai:ollama-status', endpoint),
        ollamaListModels: (endpoint?: string) => ipcRenderer.invoke('ai:ollama-list-models', endpoint),
        ollamaPull: (model: string, endpoint?: string) => ipcRenderer.invoke('ai:ollama-pull', model, endpoint),
        ollamaGenerateImage: (model: string, prompt: string, endpoint?: string) => ipcRenderer.invoke('ai:ollama-generate-image', model, prompt, endpoint),
        onStreamToken: (callback: (token: string) => void) => {
            const listener = (_event: Electron.IpcRendererEvent, token: string) => callback(token);
            ipcRenderer.on('ai:ollama-stream-token', listener);
            return () => ipcRenderer.off('ai:ollama-stream-token', listener);
        }
    },
    mcp: {
        listTools: (serverName: string) => ipcRenderer.invoke('mcp:list-tools', serverName),
        callTool: (serverName: string, toolName: string, args: Record<string, unknown>) => 
            ipcRenderer.invoke('mcp:call-tool', serverName, toolName, args),
        reauthenticate: () => ipcRenderer.invoke('mcp:reauthenticate'),
        restart: () => ipcRenderer.invoke('mcp:restart'),
        /**
         * Journal d'activité du pont : requête partie, réponse reçue et sa durée,
         * lignes du serveur quand il en émet. C'est la seule visibilité possible
         * pendant un appel — `callTool` est un aller-retour sans rien entre les
         * deux, et une génération peut attendre plusieurs minutes.
         */
        onActivity: (callback: (evenement: unknown) => void) => {
            const listener = (_event: Electron.IpcRendererEvent, evenement: unknown) => callback(evenement);
            ipcRenderer.on('mcp:activity', listener);
            return () => ipcRenderer.off('mcp:activity', listener);
        }
    },
    obsidian: {
        listNotes: (vaultPath?: string) => ipcRenderer.invoke('obsidian:list-notes', vaultPath),
        readNote: (relativePath: string, vaultPath?: string) => ipcRenderer.invoke('obsidian:read-note', relativePath, vaultPath),
        writeNote: (relativePath: string, content: string, vaultPath?: string) => ipcRenderer.invoke('obsidian:write-note', relativePath, content, vaultPath),
        ensureDirectory: (relativePath: string, vaultPath?: string) => ipcRenderer.invoke('obsidian:ensure-directory', relativePath, vaultPath),
        selectVault: () => ipcRenderer.invoke('obsidian:select-vault')
    },
    remote: {
        getConnectionInfo: () => ipcRenderer.invoke('remote:get-connection-info'),
        onAction: (callback: (data: unknown) => void) => {
            const listener = (_event: Electron.IpcRendererEvent, data: unknown) => callback(data);
            ipcRenderer.on('remote:action', listener);
            return () => ipcRenderer.off('remote:action', listener);
        },
        removeActions: () => ipcRenderer.removeAllListeners('remote:action'),
        sendSync: (data: unknown) => ipcRenderer.send('remote:broadcast-sync', data),
        broadcastUIAction: (action: unknown) => ipcRenderer.send('remote:broadcast-ui-action', action),
        cacheMedia: (buffer: ArrayBuffer, id: string) => ipcRenderer.invoke('remote:cache-media', buffer, id),
    },
    relay: {
        // Relais entre fenêtres locales par le process principal.
        // Le message est une chaîne DÉJÀ sérialisée : la sérialisation d'Electron
        // coûte proportionnellement au nombre de nœuds d'objet traversés, et le
        // relais refuse tout ce qui n'est pas une chaîne. Voir electron/WindowRelay.ts.
        // Le type voyage à côté du corps : le process principal arbitre par type
        // sans avoir à ouvrir le JSON. Voir electron/relayPolicy.ts.
        publish: (type: string, message: string) => ipcRenderer.send('relay:publish', type, message),
        onMessage: (callback: (message: string, senderRole: string) => void) => {
            // `senderRole` est établi par le process principal, pas par
            // l'émetteur : c'est ce qui le rend digne de confiance côté MJ.
            const listener = (
                _event: Electron.IpcRendererEvent,
                message: string,
                senderRole: string,
            ) => callback(message, senderRole);
            ipcRenderer.on('relay:message', listener);
            return () => ipcRenderer.off('relay:message', listener);
        },
    },
    pairing: {
        // Secret partagé permettant à un appareil de réclamer un rôle privilégié.
        getSecret: (): Promise<string> => ipcRenderer.invoke('pairing:get-secret'),
        rotate: (): Promise<string> => ipcRenderer.invoke('pairing:rotate'),
    },
    logger: {
        info: (message: string, ...args: unknown[]) => ipcRenderer.send('log:message', 'info', message, ...args),
        warn: (message: string, ...args: unknown[]) => ipcRenderer.send('log:message', 'warn', message, ...args),
        error: (message: string, ...args: unknown[]) => ipcRenderer.send('log:message', 'error', message, ...args),
        debug: (message: string, ...args: unknown[]) => ipcRenderer.send('log:message', 'debug', message, ...args),
    },
    security: {
        getSecret: (id: string) => ipcRenderer.invoke('security:get-secret', id),
        saveSecret: (id: string, value: string) => ipcRenderer.invoke('security:set-secret', id, value),
        deleteSecret: (id: string) => ipcRenderer.invoke('security:delete-secret', id),
    },
    git: {
        getStatus: () => ipcRenderer.invoke('git:status'),
        setupBranch: (branchName: string) => ipcRenderer.invoke('git:setup-branch', branchName),
        syncData: (targetDir: string, branchName: string, message?: string) => 
            ipcRenderer.invoke('git:sync', targetDir, branchName, message),
        saveData: (data: unknown) => ipcRenderer.invoke('backup:save-data', data)
    },
    nexus: {
        selectExportPath: (bundleType?: 'campaign' | 'driver') => ipcRenderer.invoke('nexus:select-export-path', bundleType),
        selectImportFile: () => ipcRenderer.invoke('nexus:select-import-file'),
        // Streaming d'un seul asset vers le main process (évite la limite de taille IPC)
        registerAsset: (mediaHubId: string, dataUrl: string) =>
            ipcRenderer.invoke('nexus:register-asset', mediaHubId, dataUrl),
        clearAssets: () => ipcRenderer.invoke('nexus:clear-assets'),
        exportBundle: (
            contextId: string,
            outputPath: string,
            stateJson: string,
            manifestJson: string,
            assetRefs: string[]
        ) => ipcRenderer.invoke('nexus:export-bundle', contextId, outputPath, stateJson, manifestJson, assetRefs),
        importBundle: (filePath: string) => ipcRenderer.invoke('nexus:import-bundle', filePath),
    }
})


// Note: appBridge is the ONLY authorized gateway. ipcRenderer exposure is forbidden.
