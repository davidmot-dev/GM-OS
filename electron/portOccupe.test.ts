import { describe, it, expect, afterEach, vi } from 'vitest';
import http from 'node:http';

/**
 * **Un port déjà pris ne doit pas emporter GM-OS.**
 *
 * ⛔ `SyncServer.listen` n'avait **aucun** gestionnaire d'erreur. `listen`
 * signale son échec par un événement `error` **asynchrone** : le `try/catch` qui
 * entoure le démarrage ne l'attrape pas, et un `error` sans écouteur devient une
 * exception non gérée qui tue le processus principal.
 *
 * Conséquence concrète, mesurée le 2026-09-11 : **lancer GM-OS une seconde fois
 * le faisait crasher.** Et c'est ce qui interdisait d'exécuter les tests de bout
 * en bout en parallèle — le défaut a été trouvé en préparant Playwright, pas en
 * lisant le code.
 *
 * Son voisin `ServeurDesFiches` portait cette garde depuis toujours, avec sa
 * raison écrite. *Encore une rustine posée d'un seul côté.*
 */

const dirs = vi.hoisted(() => {
    const nodeFs = require('node:fs') as typeof import('node:fs');
    const nodePath = require('node:path') as typeof import('node:path');
    const nodeOs = require('node:os') as typeof import('node:os');
    return { userData: nodeFs.mkdtempSync(nodePath.join(nodeOs.tmpdir(), 'gmos-port-')) };
});

vi.mock('electron', () => ({
    app: { getPath: () => dirs.userData },
    ipcMain: { on: vi.fn(), handle: vi.fn() },
    BrowserWindow: class {},
}));

const { SyncServer } = await import('./SyncServer');
const { ServeurDesFiches } = await import('./serveurDesFiches');

const fenetreFactice = {
    isDestroyed: () => false,
    webContents: { send: vi.fn() },
} as unknown as import('electron').BrowserWindow;

let squatteur: http.Server | null = null;

afterEach(async () => {
    if (squatteur) await new Promise(r => squatteur!.close(r));
    squatteur = null;
});

/**
 * Occupe un port, et rend le numéro.
 *
 * ⚠️ **On écoute sur le port 0 et on lit celui qu'on a reçu**, plutôt que de
 * sonder un port libre puis de le reprendre. La seconde façon a une **course** :
 * entre la fermeture de la sonde et la reprise, le système peut attribuer le
 * port à quelqu'un d'autre — et c'est alors le squatteur qui lève, sans
 * gestionnaire, ce qui faisait échouer ce test pour la mauvaise raison.
 *
 * *Ma première version de ce test testait donc sa propre course.*
 */
async function occuper(): Promise<number> {
    squatteur = http.createServer();
    await new Promise<void>(r => squatteur!.listen(0, '0.0.0.0', r));
    return (squatteur.address() as { port: number }).port;
}

describe('le port déjà pris', () => {
    /*
      L'assertion porte sur `unhandledRejection` / `uncaughtException` : c'est le
      mode d'échec réel. Un test qui se contenterait de vérifier que `start()` ne
      lève pas passerait déjà AVANT le correctif — l'erreur arrive plus tard, sur
      la boucle d'événements.
    */
    it('ne fait pas tomber le processus (SyncServer)', async () => {
        const port = await occuper();
        const fautes: unknown[] = [];
        const attraper = (e: unknown) => fautes.push(e);
        process.on('uncaughtException', attraper);

        const serveur = new SyncServer(fenetreFactice, port, dirs.userData);
        serveur.start();

        /* On laisse la boucle d'événements délivrer l'`error` de `listen`. */
        await new Promise(r => setTimeout(r, 150));
        process.off('uncaughtException', attraper);
        serveur.stop?.();

        expect(fautes, 'un port occupé ne doit pas lever hors de toute garde').toEqual([]);
    });

    /* Le voisin, qui portait déjà la garde : on la garde gardée. */
    it('ne fait pas tomber le processus (ServeurDesFiches)', async () => {
        const port = await occuper();
        const fautes: unknown[] = [];
        const attraper = (e: unknown) => fautes.push(e);
        process.on('uncaughtException', attraper);

        const serveur = new ServeurDesFiches(dirs.userData, port);
        serveur.start();

        await new Promise(r => setTimeout(r, 150));
        process.off('uncaughtException', attraper);
        serveur.stop();

        expect(fautes).toEqual([]);
    });
});
