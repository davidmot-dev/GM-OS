const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('bench', {
    pid: process.pid,
    send: (msg) => ipcRenderer.send('bench:relay', msg),
    onRelay: (cb) => ipcRenderer.on('bench:relay', (_e, msg) => cb(msg)),
    ready: () => ipcRenderer.send('bench:ready'),
    onStart: (cb) => ipcRenderer.on('bench:start', () => cb()),
    report: (data) => ipcRenderer.send('bench:report', data),
    log: (line) => ipcRenderer.send('bench:log', line),
});
