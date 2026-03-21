import { contextBridge, ipcRenderer, webUtils } from "electron";
contextBridge.exposeInMainWorld("appBridge", {
  on(...args) {
    const [channel, listener] = args;
    return ipcRenderer.on(channel, (event, ...args2) => listener(event, ...args2));
  },
  off(...args) {
    const [channel, ...omit] = args;
    return ipcRenderer.off(channel, ...omit);
  },
  send(...args) {
    const [channel, ...omit] = args;
    return ipcRenderer.send(channel, ...omit);
  },
  invoke(...args) {
    const [channel, ...omit] = args;
    return ipcRenderer.invoke(channel, ...omit);
  },
  getPathForFile(file) {
    return webUtils.getPathForFile(file);
  },
  app: {
    quit: () => ipcRenderer.send("app:quit")
  },
  debug: {
    openConsole: () => ipcRenderer.send("debug:open-console")
  },
  session: {
    launchHubWindow: (mode) => ipcRenderer.send("session:launch-hub-window", mode),
    saveSession: (data) => ipcRenderer.invoke("save-session", data),
    loadSession: () => ipcRenderer.invoke("load-session")
  },
  npc: {
    listDatabases: (category) => ipcRenderer.invoke("npc:list-databases", category),
    loadDatabase: (category, name) => ipcRenderer.invoke("npc:load-database", category, name),
    selectAvatar: () => ipcRenderer.invoke("npc:select-avatar"),
    saveAvatar: (buffer, fileName) => ipcRenderer.invoke("npc:save-avatar", buffer, fileName)
  },
  tables: {
    listUniverses: () => ipcRenderer.invoke("tables:list-universes"),
    listTables: (universe) => ipcRenderer.invoke("tables:list-tables", universe),
    loadTable: (universe, tableName) => ipcRenderer.invoke("tables:load-table", universe, tableName)
  },
  web: {
    openExternal: (url) => ipcRenderer.send("web:open-external", url),
    saveList: (data) => ipcRenderer.invoke("web:save-list", data),
    loadList: () => ipcRenderer.invoke("web:load-list")
  },
  image: {
    getDisplays: () => ipcRenderer.invoke("image:get-displays"),
    syncHubData: (type, data) => ipcRenderer.send("image:sync-hub-data", type, data),
    launchDisplay: (paths, target) => ipcRenderer.send("image:launch-display", paths, target),
    closeAllDisplays: () => ipcRenderer.send("image:close-all-displays")
  },
  sound: {
    loadAudios: () => ipcRenderer.invoke("sound:load-audios")
  },
  tactical: {
    listSounds: () => ipcRenderer.invoke("tactical:list-sounds")
  },
  light: {
    request: (url, method, body) => ipcRenderer.invoke("light:request", url, method, body)
  },
  clock: {
    listCalendars: () => ipcRenderer.invoke("clock:list-calendars"),
    loadCalendar: (id) => ipcRenderer.invoke("clock:load-calendar", id)
  },
  utils: {
    formatFileUrl: (path) => {
      const normalized = path.replace(/\\/g, "/");
      return `file:///${encodeURI(normalized).replace(/#/g, "%23").replace(/\?/g, "%3F")}`;
    }
  },
  ai: {
    listDocs: () => ipcRenderer.invoke("ai:list-docs"),
    readDoc: (filePath) => ipcRenderer.invoke("ai:read-doc", filePath),
    extractPDF: (filePath) => ipcRenderer.invoke("ai:extract-pdf", filePath),
    proxyRequest: (url, method, headers, body) => ipcRenderer.invoke("ai:proxy-request", url, method, headers, body),
    searchContext: (systemId, campaignName) => ipcRenderer.invoke("ai:search-context", systemId, campaignName),
    reindex: () => ipcRenderer.invoke("ai:reindex")
  },
  mcp: {
    listTools: (serverName) => ipcRenderer.invoke("mcp:list-tools", serverName),
    callTool: (serverName, toolName, args) => ipcRenderer.invoke("mcp:call-tool", serverName, toolName, args),
    reauthenticate: () => ipcRenderer.invoke("mcp:reauthenticate")
  },
  obsidian: {
    listNotes: (vaultPath) => ipcRenderer.invoke("obsidian:list-notes", vaultPath),
    readNote: (relativePath, vaultPath) => ipcRenderer.invoke("obsidian:read-note", relativePath, vaultPath),
    writeNote: (relativePath, content, vaultPath) => ipcRenderer.invoke("obsidian:write-note", relativePath, content, vaultPath),
    ensureDirectory: (relativePath, vaultPath) => ipcRenderer.invoke("obsidian:ensure-directory", relativePath, vaultPath)
  },
  remote: {
    getConnectionInfo: () => ipcRenderer.invoke("remote:get-connection-info"),
    onAction: (callback) => {
      const listener = (_event, data) => callback(data);
      ipcRenderer.on("remote:action", listener);
      return () => ipcRenderer.off("remote:action", listener);
    },
    removeActions: () => ipcRenderer.removeAllListeners("remote:action"),
    sendSync: (data) => ipcRenderer.send("remote:broadcast-sync", data),
    cacheMedia: (buffer, id) => ipcRenderer.invoke("remote:cache-media", buffer, id)
  },
  logger: {
    info: (message, ...args) => ipcRenderer.send("log:message", "info", message, ...args),
    warn: (message, ...args) => ipcRenderer.send("log:message", "warn", message, ...args),
    error: (message, ...args) => ipcRenderer.send("log:message", "error", message, ...args),
    debug: (message, ...args) => ipcRenderer.send("log:message", "debug", message, ...args)
  }
});
