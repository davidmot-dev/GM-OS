import { describe, it, expect, vi } from 'vitest';
import { mkdtemp, readFile, rm, writeFile, unlink } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { identifiantMedia, mediasDeLaVue, projeterMedias, lireFichierMedia, servirMediaPrive } from './medias';
import { ServiceDesModules } from './service';
const image = { type: 'image', nom: 'essai.png', source: 'data:image/png;base64,aW1hZ2U=' };
describe('médias privés des modules', () => {
    it('réduit les projections sans modifier les octets portables de la sauvegarde', async () => {
        const source = 'data:video/webm;base64,' + Buffer.alloc(1024 * 1024).toString('base64');
        const vue = { integration: { origine: 'gmos' }, publications: [{ media: { type: 'video', nom: 'film.webm', source } }] };
        const rendu = projeterMedias(vue, 'campagne', 'star-trek-lcars', { jeton: 'a'.repeat(64), port: 3001 });
        expect(JSON.stringify(rendu).length).toBeLessThan(600); expect(vue.publications[0].media.source).toBe(source);
        expect(mediasDeLaVue(vue).size).toBe(1); expect(JSON.stringify(rendu)).not.toContain(';base64,');
    });
    it('cache les octets sur disque, permet leur reconstruction et refuse les entrées invalides', async () => {
        const base = await mkdtemp(path.join(os.tmpdir(), 'gmos-medias-prives-'));
        try {
            const resultat = await lireFichierMedia(base, image); expect(resultat.octets.toString()).toBe('image');
            const fichier = path.join(base, identifiantMedia(image.source) + '.bin');
            expect(await readFile(fichier)).toEqual(resultat.octets);
            await writeFile(fichier, 'cache corrompu'); expect((await lireFichierMedia(base, image)).octets).toEqual(resultat.octets);
            await unlink(fichier); expect((await lireFichierMedia(base, image)).octets).toEqual(resultat.octets);
            await expect(lireFichierMedia(base, { ...image, source: 'data:image/svg+xml;base64,YQ==' })).rejects.toThrow();
            await expect(lireFichierMedia(base, { ...image, source: 'https://example.com/fichier' })).rejects.toThrow();
        } finally { await rm(base, { recursive: true, force: true }); }
    });
    it.each([['bytes=1-3', 206, 'bcd'], ['bytes=-2', 206, 'ef'], ['bytes=99-', 416, undefined], ['bytes=0-1,4-5', 416, undefined]])('respecte la plage %s', (range, statut, texte) => {
        const res = { writeHead: vi.fn(), end: vi.fn() };
        servirMediaPrive({ headers: { range }, method: 'GET' } as IncomingMessage, res as unknown as ServerResponse, Buffer.from('abcdef'), 'video/webm');
        expect(res.writeHead.mock.calls[0][0]).toBe(statut);
        if (texte) expect(res.end.mock.calls[0][0].toString()).toBe(texte);
    });
    it('décrit un média en HEAD sans envoyer ses octets', () => {
        const res = { writeHead: vi.fn(), end: vi.fn() };
        servirMediaPrive({ headers: {}, method: 'HEAD' } as IncomingMessage, res as unknown as ServerResponse, Buffer.from('abcdef'), 'video/webm');
        expect(res.writeHead).toHaveBeenCalledWith(200, expect.objectContaining({ 'Content-Length': 6, 'Accept-Ranges': 'bytes' }));
        expect(res.end).toHaveBeenCalledWith(undefined);
    });
    it('sert un nouveau média à plusieurs appareils qui le demandent simultanément', async () => {
        const base = await mkdtemp(path.join(os.tmpdir(), 'gmos-medias-simultanes-'));
        try {
            const media = { ...image, source: 'data:image/png;base64,' + Buffer.alloc(1024 * 1024, 17).toString('base64') };
            const lectures = await Promise.all(Array.from({ length: 12 }, () => lireFichierMedia(base, media)));
            expect(lectures.every(l => l.octets.length === 1024 * 1024)).toBe(true);
        } finally { await rm(base, { recursive: true, force: true }); }
    });
    it('réévalue les destinataires d’un rapport, son retrait et l’accès au module', async () => {
        const s = new ServiceDesModules({ lire: async () => null, ecrire: async () => {} }, () => {});
        await s.changerContexte({ campagneId: 'a', seanceId: 's', pilote: { id: 'trek', name: 'Star Trek', modulesDuJeu: [{ id: 'star-trek-lcars' }] }, personnages: [{ id: 'alice', nom: 'Alice' }, { id: 'bob', nom: 'Bob' }] });
        const contexte = () => s.vueMJ().then(v => v.contexte);
        const agir = async (id: string, charge: unknown) => s.commander({ requeteId: 'r', campagneId: 'a', moduleId: 'star-trek-lcars', contexte: await contexte(), commande: { id, charge } }, { role: 'mj', appareilId: 'poste-mj' });
        await agir('preparer-officier', { personnageId: 'alice', nom: 'Alice', postes: ['science'] });
        await s.autoriser({ campagneId: 'a', moduleId: 'star-trek-lcars', contexte: await contexte(), personnages: ['alice', 'bob'] });
        await agir('publier-rapport', { titre: 'Privé', texte: 'Texte', destinataires: ['science'], media: image });
        const lire = (id: string) => s.mediaPour('a', 'star-trek-lcars', identifiantMedia(image.source), { role: 'joueur', personnageId: id, appareilId: id });
        expect(await lire('alice')).toEqual(image); await expect(lire('bob')).rejects.toThrow();
        const vue = (await s.vueMJ()).modules[0].vue as { publications: { id: string }[] };
        await agir('retirer-publication', { publicationId: vue.publications[0].id });
        await expect(lire('alice')).rejects.toThrow();
        await agir('publier-rapport', { titre: 'Commun', texte: 'Texte', destinataires: ['equipage'], media: image });
        await s.autoriser({ campagneId: 'a', moduleId: 'star-trek-lcars', contexte: await contexte(), personnages: ['bob'] }); await expect(lire('alice')).rejects.toThrow();
    });
});
