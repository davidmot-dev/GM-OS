import { describe, it, expect, vi } from 'vitest';
import { SyncServer } from '../SyncServer';
import { app } from 'electron';
import { stockageDesModules } from './stockage';
vi.mock('electron', () => ({ app: { getPath: vi.fn(() => 'profil-fictif') }, ipcMain: { on: vi.fn(), handle: vi.fn() }, BrowserWindow: class {} }));
vi.mock('./stockage', () => ({ stockageDesModules: vi.fn(() => ({ lire: vi.fn(async () => null), ecrire: vi.fn(async () => {}) })) }));
vi.mock('../PairingManager', () => ({ pairingManager: {} }));
vi.mock('../auditLog', () => ({ auditDenied: vi.fn() }));
describe('stockage des modules initialisé au premier besoin', () => {
    it('construire un serveur ne verrouille pas le profil ; le premier accès initialise une seule instance', async () => {
        const fenetre = { isDestroyed: () => false, webContents: { send: vi.fn() } } as unknown as import('electron').BrowserWindow;
        const serveur = new SyncServer(fenetre, 0, '') as unknown as { modulesDuJeu: { pret(): Promise<void> } };
        expect(app.getPath).not.toHaveBeenCalled(); expect(stockageDesModules).not.toHaveBeenCalled();
        const instance = serveur.modulesDuJeu; await instance.pret();
        expect(serveur.modulesDuJeu).toBe(instance);
        expect(app.getPath).toHaveBeenCalledTimes(1); expect(app.getPath).toHaveBeenCalledWith('userData');
        expect(stockageDesModules).toHaveBeenCalledTimes(1);
    });
});
