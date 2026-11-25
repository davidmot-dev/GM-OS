import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';
import path from 'node:path';
import fs from 'fs-extra';

const dirs = vi.hoisted(() => {
    const nodeFs = require('node:fs') as typeof import('node:fs');
    const nodePath = require('node:path') as typeof import('node:path');
    const nodeOs = require('node:os') as typeof import('node:os');
    return { userData: nodeFs.mkdtempSync(nodePath.join(nodeOs.tmpdir(), 'gmos-verrou-')) };
});

vi.mock('electron', () => ({
    app: { getPath: () => dirs.userData },
    ipcMain: { handle: vi.fn() },
}));

const { verrouDuMeneur, LimiteurDEssais, codeValide } = await import('./verrouDuMeneur');
const { pairingManager } = await import('./PairingManager');

/** Le code du meneur de la tablette de la table (§ 256, T14, 24/11/2026). */
const FICHIER = path.join(dirs.userData, 'code-du-meneur.json');

beforeEach(() => fs.removeSync(FICHIER));
afterAll(() => fs.removeSync(dirs.userData));

describe('le code du meneur, au poste', () => {
    it('quatre chiffres seulement ; gardé en empreinte, jamais en clair', () => {
        expect(['1234', '0000'].every(codeValide)).toBe(true);
        expect(['123', '12345', 'abcd', 1234, null].some(codeValide)).toBe(false);
        expect(verrouDuMeneur.estRegle()).toBe(false);
        expect(verrouDuMeneur.regler('12a4')).toBe(false);
        expect(verrouDuMeneur.regler('4821')).toBe(true);
        expect(fs.readFileSync(FICHIER, 'utf8')).not.toContain('4821');
        expect(verrouDuMeneur.verifier('4821')).toBe(true);
        expect(verrouDuMeneur.verifier('4822')).toBe(false);
        expect(verrouDuMeneur.verifier(4821)).toBe(false);
    });

    it('retiré, plus rien ne passe ; une rotation du secret d’appairage ne l’efface pas', () => {
        verrouDuMeneur.regler('1111');
        pairingManager.rotate();
        expect(verrouDuMeneur.verifier('1111')).toBe(true);
        verrouDuMeneur.regler(null);
        expect(verrouDuMeneur.estRegle()).toBe(false);
        expect(verrouDuMeneur.verifier('1111')).toBe(false);
    });
});

describe('les essais limités', () => {
    it('trois essais, puis cinq minutes ; la salve suivante attend le double ; un bon code remet à zéro', () => {
        let t = 0;
        const limite = new LimiteurDEssais(3, 300_000, () => t);
        expect(limite.echec('fire')).toEqual({ restants: 2, attenteMs: 0 });
        expect(limite.echec('fire')).toEqual({ restants: 1, attenteMs: 0 });
        expect(limite.echec('fire')).toEqual({ restants: 0, attenteMs: 300_000 });
        expect(limite.attente('fire')).toBe(300_000);
        expect(limite.attente('autre')).toBe(0);
        t = 300_000;
        expect(limite.attente('fire')).toBe(0);
        limite.echec('fire'); limite.echec('fire');
        expect(limite.echec('fire').attenteMs).toBe(600_000);
        limite.reussite('fire');
        expect(limite.attente('fire')).toBe(0);
        expect(limite.echec('fire').restants).toBe(2);
    });
});
