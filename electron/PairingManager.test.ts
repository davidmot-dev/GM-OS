import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';
import path from 'node:path';
import fs from 'fs-extra';

const dirs = vi.hoisted(() => {
    const nodeFs = require('node:fs') as typeof import('node:fs');
    const nodePath = require('node:path') as typeof import('node:path');
    const nodeOs = require('node:os') as typeof import('node:os');
    return { userData: nodeFs.mkdtempSync(nodePath.join(nodeOs.tmpdir(), 'gmos-pairing-')) };
});

vi.mock('electron', () => ({
    app: { getPath: () => dirs.userData },
    ipcMain: { handle: vi.fn() },
}));

const { pairingManager } = await import('./PairingManager');

const STORE = path.join(dirs.userData, 'pairing.json');

beforeEach(() => {
    fs.removeSync(STORE);
    pairingManager.rotate();
});

afterAll(() => {
    fs.removeSync(dirs.userData);
});

describe('pairingManager', () => {
    it('génère un secret de 32 octets et le persiste', () => {
        const secret = pairingManager.getSecret();
        expect(secret).toMatch(/^[0-9a-f]{64}$/);
        expect(fs.readJsonSync(STORE).secret).toBe(secret);
    });

    it('renvoie le même secret d\'un appel à l\'autre', () => {
        expect(pairingManager.getSecret()).toBe(pairingManager.getSecret());
    });

    it('accepte le secret courant', () => {
        expect(pairingManager.verify(pairingManager.getSecret())).toBe(true);
    });

    it('refuse un mauvais token', () => {
        expect(pairingManager.verify('a'.repeat(64))).toBe(false);
    });

    it('refuse un préfixe correct du secret', () => {
        const secret = pairingManager.getSecret();
        expect(pairingManager.verify(secret.slice(0, -1))).toBe(false);
    });

    it('refuse les valeurs vides ou non textuelles', () => {
        expect(pairingManager.verify('')).toBe(false);
        expect(pairingManager.verify(undefined)).toBe(false);
        expect(pairingManager.verify(null)).toBe(false);
        expect(pairingManager.verify(42)).toBe(false);
        expect(pairingManager.verify({})).toBe(false);
    });

    it('invalide l\'ancien secret après rotation', () => {
        const oldSecret = pairingManager.getSecret();
        const newSecret = pairingManager.rotate();

        expect(newSecret).not.toBe(oldSecret);
        expect(pairingManager.verify(oldSecret)).toBe(false);
        expect(pairingManager.verify(newSecret)).toBe(true);
    });

    it('régénère un secret si le fichier est corrompu', () => {
        fs.writeFileSync(STORE, 'ceci n\'est pas du JSON');
        // On force la relecture depuis le disque.
        (pairingManager as unknown as { secret: string | null }).secret = null;

        const secret = pairingManager.getSecret();
        expect(secret).toMatch(/^[0-9a-f]{64}$/);
    });

    it('régénère un secret si le fichier contient un secret trop court', () => {
        fs.writeJsonSync(STORE, { secret: 'court' });
        (pairingManager as unknown as { secret: string | null }).secret = null;

        expect(pairingManager.getSecret()).not.toBe('court');
    });
});
