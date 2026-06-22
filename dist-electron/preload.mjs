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
    quit: () => ipcRenderer.send("app:quit"),
    onDisplayChanged: (callback) => {
      const listener = (_event, count) => callback(count);
      ipcRenderer.on("app:display-changed", listener);
      return () => ipcRenderer.off("app:display-changed", listener);
    }
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
      if (!path) return "";
      if (path.includes("://") || path.startsWith("data:")) return path;
      const normalized = path.replace(/\\/g, "/");
      return `file:///${encodeURI(normalized).replace(/#/g, "%23").replace(/\?/g, "%3F")}`;
    }
  },
  ai: {
    listDocs: () => ipcRenderer.invoke("ai:list-docs"),
    readDoc: (filePath) => ipcRenderer.invoke("ai:read-doc", filePath),
    writeDoc: (filePath, content) => ipcRenderer.invoke("ai:write-doc", filePath, content),
    extractPDF: (filePath) => ipcRenderer.invoke("ai:extract-pdf", filePath),
    proxyRequest: (url, method, headers, body) => ipcRenderer.invoke("ai:proxy-request", url, method, headers, body),
    searchContext: (systemId, campaignName) => ipcRenderer.invoke("ai:search-context", systemId, campaignName),
    reindex: (customPath) => ipcRenderer.invoke("ai:reindex", customPath),
    // Ollama Local AI
    ollamaChat: (model, messages, endpoint) => ipcRenderer.invoke("ai:ollama-chat", model, messages, endpoint),
    ollamaChatStream: (model, messages, endpoint) => ipcRenderer.invoke("ai:ollama-chat-stream", model, messages, endpoint),
    ollamaStatus: (endpoint) => ipcRenderer.invoke("ai:ollama-status", endpoint),
    ollamaListModels: (endpoint) => ipcRenderer.invoke("ai:ollama-list-models", endpoint),
    ollamaPull: (model, endpoint) => ipcRenderer.invoke("ai:ollama-pull", model, endpoint),
    ollamaGenerateImage: (model, prompt, endpoint) => ipcRenderer.invoke("ai:ollama-generate-image", model, prompt, endpoint),
    onStreamToken: (callback) => {
      const listener = (_event, token) => callback(token);
      ipcRenderer.on("ai:ollama-stream-token", listener);
      return () => ipcRenderer.off("ai:ollama-stream-token", listener);
    }
  },
  mcp: {
    listTools: (serverName) => ipcRenderer.invoke("mcp:list-tools", serverName),
    callTool: (serverName, toolName, args) => ipcRenderer.invoke("mcp:call-tool", serverName, toolName, args),
    reauthenticate: () => ipcRenderer.invoke("mcp:reauthenticate"),
    restart: () => ipcRenderer.invoke("mcp:restart")
  },
  obsidian: {
    listNotes: (vaultPath) => ipcRenderer.invoke("obsidian:list-notes", vaultPath),
    readNote: (relativePath, vaultPath) => ipcRenderer.invoke("obsidian:read-note", relativePath, vaultPath),
    writeNote: (relativePath, content, vaultPath) => ipcRenderer.invoke("obsidian:write-note", relativePath, content, vaultPath),
    ensureDirectory: (relativePath, vaultPath) => ipcRenderer.invoke("obsidian:ensure-directory", relativePath, vaultPath),
    selectVault: () => ipcRenderer.invoke("obsidian:select-vault")
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
    broadcastUIAction: (action) => ipcRenderer.send("remote:broadcast-ui-action", action),
    cacheMedia: (buffer, id) => ipcRenderer.invoke("remote:cache-media", buffer, id)
  },
  logger: {
    info: (message, ...args) => ipcRenderer.send("log:message", "info", message, ...args),
    warn: (message, ...args) => ipcRenderer.send("log:message", "warn", message, ...args),
    error: (message, ...args) => ipcRenderer.send("log:message", "error", message, ...args),
    debug: (message, ...args) => ipcRenderer.send("log:message", "debug", message, ...args)
  },
  security: {
    getSecret: (id) => ipcRenderer.invoke("security:get-secret", id),
    saveSecret: (id, value) => ipcRenderer.invoke("security:set-secret", id, value),
    deleteSecret: (id) => ipcRenderer.invoke("security:delete-secret", id)
  },
  git: {
    getStatus: () => ipcRenderer.invoke("git:status"),
    setupBranch: (branchName) => ipcRenderer.invoke("git:setup-branch", branchName),
    syncData: (targetDir, branchName, message) => ipcRenderer.invoke("git:sync", targetDir, branchName, message),
    saveData: (data) => ipcRenderer.invoke("backup:save-data", data)
  },
  nexus: {
    selectExportPath: (bundleType) => ipcRenderer.invoke("nexus:select-export-path", bundleType),
    selectImportFile: () => ipcRenderer.invoke("nexus:select-import-file"),
    // Streaming d'un seul asset vers le main process (évite la limite de taille IPC)
    registerAsset: (mediaHubId, dataUrl) => ipcRenderer.invoke("nexus:register-asset", mediaHubId, dataUrl),
    clearAssets: () => ipcRenderer.invoke("nexus:clear-assets"),
    exportBundle: (contextId, outputPath, stateJson, manifestJson, assetRefs) => ipcRenderer.invoke("nexus:export-bundle", contextId, outputPath, stateJson, manifestJson, assetRefs),
    importBundle: (filePath) => ipcRenderer.invoke("nexus:import-bundle", filePath)
  }
});
