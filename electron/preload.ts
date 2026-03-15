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
        quit: () => ipcRenderer.send('app:quit')
    },
    debug: {
        openConsole: () => ipcRenderer.send('debug:open-console')
    },
    session: {
        launchHubWindow: () => ipcRenderer.send('session:launch-hub-window'),
    },
    npc: {
        listDatabases: (category: string) => ipcRenderer.invoke('npc:list-databases', category),
        loadDatabase: (category: string, name: string) => ipcRenderer.invoke('npc:load-database', category, name),
        selectAvatar: () => ipcRenderer.invoke('npc:select-avatar')
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
            const normalized = path.replace(/\\/g, '/');
            return `file:///${encodeURI(normalized).replace(/#/g, '%23').replace(/\?/g, '%3F')}`;
        }
    },
    ai: {
        listDocs: () => ipcRenderer.invoke('ai:list-docs'),
        readDoc: (filePath: string) => ipcRenderer.invoke('ai:read-doc', filePath),
        extractPDF: (filePath: string) => ipcRenderer.invoke('ai:extract-pdf', filePath),
        proxyRequest: (url: string, method: string, headers: Record<string, string>, body: unknown) => 
            ipcRenderer.invoke('ai:proxy-request', url, method, headers, body),
        searchContext: (systemId: string, campaignName: string) => 
            ipcRenderer.invoke('ai:search-context', systemId, campaignName),
        reindex: () => ipcRenderer.invoke('ai:reindex')
    }
})


// Note: appBridge is the ONLY authorized gateway. ipcRenderer exposure is forbidden.
