// Banc de mesure du surcout du saut IPC — GM-OS, chantier "unification du transport".
//
// Compare deux transports pour un aller-retour entre deux fenetres de rendu :
//   bc  : BroadcastChannel, le transport actuel (CrossWindowEventService)
//   ipc : renderer -> process principal -> renderer, le transport propose
//
// Les webPreferences reproduisent celles de electron/main.ts (sandbox: false,
// webSecurity: true, preload), et les deux fenetres partagent la meme origine,
// comme la fenetre MJ et le Player Hub.

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let winA = null;
let winB = null;
let readyCount = 0;

function makeWindow(role) {
    const w = new BrowserWindow({
        width: 700,
        height: 420,
        show: true,
        backgroundColor: '#000000',
        webPreferences: {
            preload: path.join(__dirname, 'preload.cjs'),
            sandbox: false,
            webSecurity: true,
        },
    });
    w.loadFile(path.join(__dirname, process.env.BENCH_WINDOW || 'window.html'), { query: { role } });
    return w;
}

app.whenReady().then(() => {
    winA = makeWindow('a');
    winB = makeWindow('b');
});

// Le relais : exactement ce que ferait le process principal s'il devenait
// le seul transport. Aucun traitement, juste la retransmission.
ipcMain.on('bench:relay', (_e, msg) => {
    const target = msg.to === 'b' ? winB : winA;
    if (target && !target.isDestroyed()) target.webContents.send('bench:relay', msg);
});

ipcMain.on('bench:ready', () => {
    readyCount += 1;
    if (readyCount === 2) winA.webContents.send('bench:start');
});

ipcMain.on('bench:log', (_e, line) => {
    process.stdout.write(line + '\n');
});

ipcMain.on('bench:report', (_e, data) => {
    const out = process.env.BENCH_OUT || 'results';
    fs.writeFileSync(path.join(__dirname, out + '.json'), JSON.stringify(data, null, 2), 'utf8');
    fs.writeFileSync(path.join(__dirname, out + '.txt'), data.text, 'utf8');
    process.stdout.write('\n' + data.text + '\n');
    setTimeout(() => app.exit(0), 200);
});

app.on('window-all-closed', () => app.exit(0));
