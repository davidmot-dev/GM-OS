import { BrowserWindow, ipcMain, screen, type Rectangle } from 'electron';

/**
 * **La télécommande du meneur, sur l'écran du bas du Zenbook Duo.**
 *
 * Demandé par David le 2026-09-25 — la proposition était garée au § 4 du
 * registre depuis le 2026-09-22 : *l'écran du bas est la place d'un pupitre de
 * régie, et le pupitre existe déjà* (huit onglets tactiles).
 *
 * ⭐ **La fenêtre est un CLIENT, exactement comme la tablette.** Elle charge
 * `?window=remote`, rejoint le SyncServer par sa WebSocket, et s'appaire par le
 * jeton en fragment d'adresse — que GM-OS lui injecte, donc rien à scanner.
 * Aucun `preload` : avec le pont Electron, elle risquerait de se prendre pour une
 * fenêtre locale du meneur, et c'est une autre route, jamais éprouvée.
 *
 * ⛔ **Et surtout pas une seconde fenêtre MJ** (`?window=gm`) : l'écriture des
 * campagnes est réservée à une seule fenêtre — la garde posée après les pertes
 * d'août.
 *
 * ⛔ **Sa propre session de stockage** (`persist:pupitre`). En développement, la
 * fenêtre MJ et celle-ci seraient servies par la MÊME origine (Vite) : elles
 * partageraient le `localStorage` où vivent les campagnes. *Deux fenêtres qui
 * écrivent au même endroit, c'est exactement ce qui a déjà vidé l'application.*
 */

export interface EcranLu {
    id: number;
    bounds: Rectangle;
}

/**
 * **L'écran juste SOUS celui de GM-OS** — la dalle du bas du Duo.
 *
 * On ne prend pas « le deuxième écran » : David a aussi deux écrans de table,
 * et le pupitre n'a rien à faire chez les joueurs. Sous, et chevauchant
 * horizontalement : c'est la géométrie du Duo, et aucun écran de table ne la
 * partage.
 */
export function ecranDuBas(ecrans: readonly EcranLu[], celuiDeGmOs: EcranLu | null): EcranLu | null {
    if (!celuiDeGmOs) return null;
    const haut = celuiDeGmOs.bounds;
    const dessous = ecrans.filter(e => {
        if (e.id === celuiDeGmOs.id) return false;
        const b = e.bounds;
        const commenceSous = Math.abs(b.y - (haut.y + haut.height)) <= 8;
        const chevauche = b.x < haut.x + haut.width && b.x + b.width > haut.x;
        return commenceSous && chevauche;
    });
    return dessous[0] ?? null;
}

/**
 * **L'adresse du pupitre** : celle de la tablette, jeton en fragment.
 *
 * ⛔ Les **deux ports**, comme partout : `devUrl` (Vite) sert l'application en
 * développement, le SyncServer la sert en production — et `sync` dit toujours où
 * est la WebSocket. Confondre les deux a déjà coûté trois défauts.
 */
export function adresseDuPupitre(options: { devUrl?: string; portDuSync: number; secret: string }): string {
    const base = options.devUrl
        ? options.devUrl.replace(/\/?$/, '/')
        : `http://127.0.0.1:${options.portDuSync}/`;
    return `${base}?window=remote&sync=${options.portDuSync}#token=${encodeURIComponent(options.secret)}`;
}

export type OuvertureDuPupitre = { ok: true } | { ok: false; raison: 'pas-d-ecran-du-bas' | 'pas-de-fenetre-mj' };

let pupitre: BrowserWindow | null = null;

export function registerPupitreHandlers(options: {
    fenetreMJ: () => BrowserWindow | null;
    devUrl?: string;
    portDuSync: number;
    secret: () => string;
}): void {
    ipcMain.handle('pupitre:ouvrir', (): OuvertureDuPupitre => {
        if (pupitre && !pupitre.isDestroyed()) {
            pupitre.show();
            pupitre.focus();
            return { ok: true };
        }

        const mj = options.fenetreMJ();
        if (!mj || mj.isDestroyed()) return { ok: false, raison: 'pas-de-fenetre-mj' };

        const celuiDeGmOs = screen.getDisplayMatching(mj.getBounds());
        const cible = ecranDuBas(screen.getAllDisplays(), celuiDeGmOs);
        if (!cible) return { ok: false, raison: 'pas-d-ecran-du-bas' };

        pupitre = new BrowserWindow({
            ...cible.bounds,
            frame: false,
            backgroundColor: '#000000',
            show: false,
            webPreferences: {
                partition: 'persist:pupitre',
                contextIsolation: true,
                nodeIntegration: false,
                sandbox: true,
            },
        });
        /* Plein écran une fois posée : `fullscreen` au constructeur choisit
           l'écran principal, pas celui des `bounds`. */
        pupitre.once('ready-to-show', () => {
            pupitre?.setFullScreen(true);
            pupitre?.show();
        });
        pupitre.on('closed', () => {
            pupitre = null;
            if (!mj.isDestroyed()) mj.webContents.send('pupitre:ferme');
        });
        /* ⛔ Le pupitre part avec GM-OS : resté seul, il empêcherait
           l'application de se fermer — une fenêtre sans cadre, plein écran, sur
           un écran où l'on ne cherche pas la croix. */
        mj.once('closed', () => {
            if (pupitre && !pupitre.isDestroyed()) pupitre.close();
        });
        void pupitre.loadURL(adresseDuPupitre({
            devUrl: options.devUrl, portDuSync: options.portDuSync, secret: options.secret(),
        }));
        return { ok: true };
    });

    ipcMain.handle('pupitre:fermer', () => {
        if (pupitre && !pupitre.isDestroyed()) pupitre.close();
        return true;
    });

    ipcMain.handle('pupitre:est-ouvert', () => !!pupitre && !pupitre.isDestroyed());
}
