import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { Writable } from 'node:stream';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { beforeEach, afterEach, describe, it, expect } from 'vitest';
import { stockageDesModules } from './stockage';
import { servirVideoDuModule } from './video';

let dossier: string;
beforeEach(async () => { dossier = await mkdtemp(path.join(tmpdir(), 'gmos-modules-test-')); });
afterEach(async () => { await rm(dossier, { recursive: true, force: true }); });
describe('stockage atomique et média des modules', () => {
    it('relit la dernière écriture et distingue un fichier absent d’un fichier illisible', async () => {
        const fichier = path.join(dossier, 'modules.json'), stockage = stockageDesModules(fichier);
        expect(await stockage.lire()).toBeNull();
        await stockage.ecrire({ texte: 'avant' }); await stockage.ecrire({ texte: 'après' });
        expect(await stockage.lire()).toEqual({ texte: 'après' });
        await writeFile(fichier, 'JSON cassé');
        await expect(stockage.lire()).rejects.toThrow();
        expect(await readFile(fichier, 'utf8')).toBe('JSON cassé');
    });
    it.each([
        { method: 'GET', range: undefined, statut: 200, corps: '0123456789' },
        { method: 'HEAD', range: undefined, statut: 200, corps: '' },
        { method: 'GET', range: 'bytes=3-5', statut: 206, corps: '345' },
        { method: 'GET', range: 'bytes=-2', statut: 206, corps: '89' },
        { method: 'GET', range: 'bytes=50-', statut: 416, corps: '' },
        { method: 'POST', range: undefined, statut: 405, corps: '' },
    ])('sert $method / $range sans ouvrir de port', async ({ method, range, statut, corps }) => {
        const fichier = path.join(dossier, 'film.webm'); await writeFile(fichier, '0123456789');
        const morceaux: Buffer[] = [];
        let code = 0, entetes: Record<string, unknown> = {};
        const reponse = new Writable({ write(chunk, _encoding, callback) { morceaux.push(Buffer.from(chunk)); callback(); } }) as Writable & { writeHead: (statut: number, entetes: Record<string, unknown>) => void };
        reponse.writeHead = (statut, headers) => { code = statut; entetes = headers; };
        const fini = new Promise<void>((resolve, reject) => { reponse.on('finish', resolve); reponse.on('error', reject); });
        servirVideoDuModule({ method, headers: { range } } as IncomingMessage, reponse as unknown as ServerResponse, fichier, 'video/webm');
        await fini;
        expect(code).toBe(statut); expect(Buffer.concat(morceaux).toString()).toBe(corps);
        if ([200, 206].includes(statut)) { expect(entetes['Content-Type']).toBe('video/webm'); expect(entetes['Accept-Ranges']).toBe('bytes'); }
    });
});
