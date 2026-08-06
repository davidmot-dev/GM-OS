import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import path from 'node:path';
import os from 'node:os';
import fs from 'fs-extra';

// Dossiers réels sur disque : resolveAllowed() suit les liens symboliques via
// realpathSync, il lui faut donc de vrais fichiers.
const dirs = vi.hoisted(() => {
    const nodeFs = require('node:fs') as typeof import('node:fs');
    const nodePath = require('node:path') as typeof import('node:path');
    const nodeOs = require('node:os') as typeof import('node:os');
    const base = nodeFs.mkdtempSync(nodePath.join(nodeOs.tmpdir(), 'gmos-media-access-'));
    return {
        base,
        userData: nodePath.join(base, 'userData'),
        appRoot: nodePath.join(base, 'appRoot'),
        outside: nodePath.join(base, 'outside'),
    };
});

vi.mock('electron', () => ({
    app: { getPath: (name: string) => (name === 'userData' ? dirs.userData : dirs.base) },
}));

const { mediaAccess } = await import('./MediaAccess');

const TEMP_MEDIA_DIR = path.join(dirs.userData, 'temp-media');
const PUBLIC_DIR = path.join(dirs.appRoot, 'public');

beforeAll(() => {
    fs.ensureDirSync(TEMP_MEDIA_DIR);
    fs.ensureDirSync(PUBLIC_DIR);
    fs.ensureDirSync(dirs.outside);

    fs.writeFileSync(path.join(PUBLIC_DIR, 'avatar.png'), 'png');
    fs.writeFileSync(path.join(TEMP_MEDIA_DIR, 'm-123'), 'webp');
    fs.writeFileSync(path.join(dirs.outside, 'secret.png'), 'top secret');
    fs.writeFileSync(path.join(dirs.base, 'passwords.txt'), 'hunter2');

    mediaAccess.init(dirs.appRoot, TEMP_MEDIA_DIR);
});

afterAll(() => {
    fs.removeSync(dirs.base);
});

/** Sur Windows la comparaison est insensible à la casse ; on compare pareil ici. */
const samePath = (a: string | null, b: string) => {
    expect(a).not.toBeNull();
    const norm = (p: string) => (os.platform() === 'win32' ? path.resolve(p).toLowerCase() : path.resolve(p));
    expect(norm(a!)).toBe(norm(b));
};

describe('mediaAccess.resolveAllowed', () => {
    it('sert un fichier situé sous une racine de base', () => {
        const target = path.join(PUBLIC_DIR, 'avatar.png');
        samePath(mediaAccess.resolveAllowed(target, dirs.appRoot), target);
    });

    it('sert un fichier du dossier temp-media', () => {
        const target = path.join(TEMP_MEDIA_DIR, 'm-123');
        samePath(mediaAccess.resolveAllowed(target, dirs.appRoot), target);
    });

    it('résout un chemin relatif depuis APP_ROOT, pas depuis le cwd', () => {
        samePath(
            mediaAccess.resolveAllowed('public/avatar.png', dirs.appRoot),
            path.join(PUBLIC_DIR, 'avatar.png')
        );
    });

    it('refuse un fichier hors des racines autorisées', () => {
        expect(mediaAccess.resolveAllowed(path.join(dirs.outside, 'secret.png'), dirs.appRoot)).toBeNull();
    });

    it('refuse une traversée par .. depuis une racine autorisée', () => {
        const traversal = path.join(PUBLIC_DIR, '..', '..', 'passwords.txt');
        expect(mediaAccess.resolveAllowed(traversal, dirs.appRoot)).toBeNull();
    });

    it('refuse une traversée exprimée en chemin relatif', () => {
        expect(mediaAccess.resolveAllowed('public/../../passwords.txt', dirs.appRoot)).toBeNull();
    });

    it('refuse un chemin contenant un octet nul', () => {
        const target = path.join(PUBLIC_DIR, 'avatar.png');
        expect(mediaAccess.resolveAllowed(`${target}\0.txt`, dirs.appRoot)).toBeNull();
    });

    it('refuse un fichier inexistant', () => {
        expect(mediaAccess.resolveAllowed(path.join(PUBLIC_DIR, 'nope.png'), dirs.appRoot)).toBeNull();
    });

    it('refuse une chaîne vide', () => {
        expect(mediaAccess.resolveAllowed('', dirs.appRoot)).toBeNull();
    });
});

describe('mediaAccess.allowFile', () => {
    it('autorise le dossier parent du fichier choisi par le MJ', () => {
        const target = path.join(dirs.outside, 'secret.png');
        expect(mediaAccess.resolveAllowed(target, dirs.appRoot)).toBeNull();

        mediaAccess.allowFile(target);

        samePath(mediaAccess.resolveAllowed(target, dirs.appRoot), target);
    });

    it('n\'élargit pas le périmètre au-delà du dossier enregistré', () => {
        // dirs.outside a été autorisé par le test précédent ; son parent, non.
        expect(mediaAccess.resolveAllowed(path.join(dirs.base, 'passwords.txt'), dirs.appRoot)).toBeNull();
    });

    it('persiste les racines choisies dans media-roots.json', () => {
        const store = path.join(dirs.userData, 'media-roots.json');
        expect(fs.existsSync(store)).toBe(true);
        const saved = fs.readJsonSync(store) as string[];
        expect(saved.length).toBeGreaterThan(0);
    });
});
