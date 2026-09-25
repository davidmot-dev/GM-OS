import { describe, it, expect, vi } from 'vitest';

vi.mock('electron', () => ({ BrowserWindow: class {}, ipcMain: { handle: vi.fn() }, screen: {} }));

const { ecranDuBas, adresseDuPupitre } = await import('./pupitreDuBas');

/**
 * **Le pupitre va sur la dalle du bas, et nulle part ailleurs.**
 *
 * L'installation réelle de David (2026-09-25) : un Zenbook Duo — deux dalles
 * 1440×900 empilées — et deux écrans de table pour les joueurs.
 */

const HAUT = { id: 1, bounds: { x: 0, y: 0, width: 1440, height: 900 } };
const BAS = { id: 2, bounds: { x: 0, y: 900, width: 1440, height: 900 } };
const TABLE_1 = { id: 3, bounds: { x: 1440, y: 0, width: 1360, height: 768 } };
const TABLE_2 = { id: 4, bounds: { x: 2800, y: 0, width: 1280, height: 720 } };

describe('ecranDuBas', () => {
    it('choisit la dalle sous celle de GM-OS', () => {
        expect(ecranDuBas([HAUT, BAS, TABLE_1, TABLE_2], HAUT)?.id).toBe(2);
    });

    /** « Le deuxième écran » aurait pu être un écran de table. */
    it('ne prend jamais un écran de table, même s’il est listé avant', () => {
        expect(ecranDuBas([TABLE_1, HAUT, TABLE_2, BAS], HAUT)?.id).toBe(2);
    });

    it('rend null quand la dalle du bas est absente — clavier posé dessus', () => {
        expect(ecranDuBas([HAUT, TABLE_1, TABLE_2], HAUT)).toBeNull();
        expect(ecranDuBas([HAUT, BAS], null)).toBeNull();
    });

    it('ne prend pas un écran placé sous un AUTRE écran', () => {
        const sousLaTable = { id: 5, bounds: { x: 1440, y: 768, width: 1360, height: 768 } };
        expect(ecranDuBas([HAUT, TABLE_1, sousLaTable], HAUT)).toBeNull();
    });
});

describe('adresseDuPupitre', () => {
    it('en production : le SyncServer sert l’application, jeton en fragment', () => {
        expect(adresseDuPupitre({ portDuSync: 3001, secret: 'abc' }))
            .toBe('http://127.0.0.1:3001/?window=remote&sync=3001#token=abc');
    });

    /** ⛔ Les deux ports : Vite sert la page, `sync` dit où est la WebSocket. */
    it('en développement : Vite sert la page, et `sync` garde le port du SyncServer', () => {
        expect(adresseDuPupitre({ devUrl: 'http://localhost:5173', portDuSync: 3001, secret: 'abc' }))
            .toBe('http://localhost:5173/?window=remote&sync=3001#token=abc');
    });
});
