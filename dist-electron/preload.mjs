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
  session: {
    launchHubWindow: () => ipcRenderer.send("session:launch-hub-window")
  },
  npc: {
    listDatabases: (category) => ipcRenderer.invoke("npc:list-databases", category),
    loadDatabase: (category, name) => ipcRenderer.invoke("npc:load-database", category, name),
    selectAvatar: () => ipcRenderer.invoke("npc:select-avatar")
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
    syncHubData: (type, path) => ipcRenderer.send("image:sync-hub-data", type, path),
    launchDisplay: (paths, target) => ipcRenderer.send("image:launch-display", paths, target)
  },
  sound: {
    loadAudios: () => ipcRenderer.invoke("sound:load-audios")
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
  }
});
contextBridge.exposeInMainWorld("ipcRenderer", ipcRenderer);
