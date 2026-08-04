import { contextBridge as i, ipcRenderer as a, webUtils as l } from "electron";
i.exposeInMainWorld("appBridge", {
  on(...e) {
    const [o, n] = e;
    return a.on(o, (t, ...s) => n(t, ...s));
  },
  off(...e) {
    const [o, ...n] = e;
    return a.off(o, ...n);
  },
  send(...e) {
    const [o, ...n] = e;
    return a.send(o, ...n);
  },
  invoke(...e) {
    const [o, ...n] = e;
    return a.invoke(o, ...n);
  },
  getPathForFile(e) {
    return l.getPathForFile(e);
  },
  app: {
    quit: () => a.send("app:quit"),
    onDisplayChanged: (e) => {
      const o = (n, t) => e(t);
      return a.on("app:display-changed", o), () => a.off("app:display-changed", o);
    }
  },
  debug: {
    openConsole: () => a.send("debug:open-console")
  },
  session: {
    launchHubWindow: (e) => a.send("session:launch-hub-window", e),
    saveSession: (e) => a.invoke("save-session", e),
    loadSession: () => a.invoke("load-session")
  },
  npc: {
    listDatabases: (e) => a.invoke("npc:list-databases", e),
    loadDatabase: (e, o) => a.invoke("npc:load-database", e, o),
    selectAvatar: () => a.invoke("npc:select-avatar"),
    saveAvatar: (e, o) => a.invoke("npc:save-avatar", e, o)
  },
  tables: {
    listUniverses: () => a.invoke("tables:list-universes"),
    listTables: (e) => a.invoke("tables:list-tables", e),
    loadTable: (e, o) => a.invoke("tables:load-table", e, o)
  },
  web: {
    openExternal: (e) => a.send("web:open-external", e),
    saveList: (e) => a.invoke("web:save-list", e),
    loadList: () => a.invoke("web:load-list")
  },
  image: {
    getDisplays: () => a.invoke("image:get-displays"),
    syncHubData: (e, o) => a.send("image:sync-hub-data", e, o),
    launchDisplay: (e, o) => a.send("image:launch-display", e, o),
    closeAllDisplays: () => a.send("image:close-all-displays")
  },
  sound: {
    loadAudios: () => a.invoke("sound:load-audios")
  },
  tactical: {
    listSounds: () => a.invoke("tactical:list-sounds")
  },
  light: {
    request: (e, o, n) => a.invoke("light:request", e, o, n)
  },
  clock: {
    listCalendars: () => a.invoke("clock:list-calendars"),
    loadCalendar: (e) => a.invoke("clock:load-calendar", e)
  },
  utils: {
    formatFileUrl: (e) => {
      if (!e) return "";
      if (e.includes("://") || e.startsWith("data:")) return e;
      const o = e.replace(/\\/g, "/");
      return `file:///${encodeURI(o).replace(/#/g, "%23").replace(/\?/g, "%3F")}`;
    }
  },
  ai: {
    listDocs: () => a.invoke("ai:list-docs"),
    readDoc: (e) => a.invoke("ai:read-doc", e),
    writeDoc: (e, o) => a.invoke("ai:write-doc", e, o),
    extractPDF: (e) => a.invoke("ai:extract-pdf", e),
    proxyRequest: (e, o, n, t) => a.invoke("ai:proxy-request", e, o, n, t),
    searchContext: (e, o) => a.invoke("ai:search-context", e, o),
    reindex: (e) => a.invoke("ai:reindex", e),
    // Ollama Local AI
    ollamaChat: (e, o, n) => a.invoke("ai:ollama-chat", e, o, n),
    ollamaChatStream: (e, o, n) => a.invoke("ai:ollama-chat-stream", e, o, n),
    ollamaStatus: (e) => a.invoke("ai:ollama-status", e),
    ollamaListModels: (e) => a.invoke("ai:ollama-list-models", e),
    ollamaPull: (e, o) => a.invoke("ai:ollama-pull", e, o),
    ollamaGenerateImage: (e, o, n) => a.invoke("ai:ollama-generate-image", e, o, n),
    onStreamToken: (e) => {
      const o = (n, t) => e(t);
      return a.on("ai:ollama-stream-token", o), () => a.off("ai:ollama-stream-token", o);
    }
  },
  mcp: {
    listTools: (e) => a.invoke("mcp:list-tools", e),
    callTool: (e, o, n) => a.invoke("mcp:call-tool", e, o, n),
    reauthenticate: () => a.invoke("mcp:reauthenticate"),
    restart: () => a.invoke("mcp:restart")
  },
  obsidian: {
    listNotes: (e) => a.invoke("obsidian:list-notes", e),
    readNote: (e, o) => a.invoke("obsidian:read-note", e, o),
    writeNote: (e, o, n) => a.invoke("obsidian:write-note", e, o, n),
    ensureDirectory: (e, o) => a.invoke("obsidian:ensure-directory", e, o),
    selectVault: () => a.invoke("obsidian:select-vault")
  },
  remote: {
    getConnectionInfo: () => a.invoke("remote:get-connection-info"),
    onAction: (e) => {
      const o = (n, t) => e(t);
      return a.on("remote:action", o), () => a.off("remote:action", o);
    },
    removeActions: () => a.removeAllListeners("remote:action"),
    sendSync: (e) => a.send("remote:broadcast-sync", e),
    broadcastUIAction: (e) => a.send("remote:broadcast-ui-action", e),
    cacheMedia: (e, o) => a.invoke("remote:cache-media", e, o)
  },
  logger: {
    info: (e, ...o) => a.send("log:message", "info", e, ...o),
    warn: (e, ...o) => a.send("log:message", "warn", e, ...o),
    error: (e, ...o) => a.send("log:message", "error", e, ...o),
    debug: (e, ...o) => a.send("log:message", "debug", e, ...o)
  },
  security: {
    getSecret: (e) => a.invoke("security:get-secret", e),
    saveSecret: (e, o) => a.invoke("security:set-secret", e, o),
    deleteSecret: (e) => a.invoke("security:delete-secret", e)
  },
  git: {
    getStatus: () => a.invoke("git:status"),
    setupBranch: (e) => a.invoke("git:setup-branch", e),
    syncData: (e, o, n) => a.invoke("git:sync", e, o, n),
    saveData: (e) => a.invoke("backup:save-data", e)
  },
  nexus: {
    selectExportPath: (e) => a.invoke("nexus:select-export-path", e),
    selectImportFile: () => a.invoke("nexus:select-import-file"),
    // Streaming d'un seul asset vers le main process (évite la limite de taille IPC)
    registerAsset: (e, o) => a.invoke("nexus:register-asset", e, o),
    clearAssets: () => a.invoke("nexus:clear-assets"),
    exportBundle: (e, o, n, t, s) => a.invoke("nexus:export-bundle", e, o, n, t, s),
    importBundle: (e) => a.invoke("nexus:import-bundle", e)
  }
});
