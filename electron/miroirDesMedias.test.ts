import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import path from 'node:path';
import fs from 'fs-extra';
import os from 'node:os';

/**
 * **Le miroir des médias — chantier n° 4.**
 *
 * Ce module écrit des fichiers sur le disque du meneur. Les trois règles du
 * 28/08 valent ici mot pour mot, et ce sont elles qu'on éprouve en premier :
 * *une sauvegarde qui peut détruire est pire que pas de sauvegarde du tout*, et
 * c'est exactement ce qui est arrivé en mars 2026.
 */

const RACINE = fs.mkdtempSync(path.join(os.tmpdir(), 'gmos-miroir-'));

vi.mock('electron', () => ({ app: { getPath: () => RACINE } }));

const {
    dossierDuMiroir, cheminDuMedia, mediasCopies, copierUnMedia,
    inscrireAuCatalogue, CATALOGUE,
} = await import('./miroirDesMedias');

const octets = (n: number) => new Uint8Array(n).fill(7);

beforeEach(async () => { await fs.emptyDir(dossierDuMiroir()); });
afterEach(() => { delete process.env.APP_ROOT; });

describe('cheminDuMedia — le seul point qui fabrique un chemin', () => {
    it('accepte un identifiant de média', () => {
        expect(cheminDuMedia('m-79ff0205-40f6-4efd-9c14-1a2aa9f33ac2'))
            .toBe(path.join(dossierDuMiroir(), 'm-79ff0205-40f6-4efd-9c14-1a2aa9f33ac2'));
    });

    /**
     * Le motif n'accepte ni séparateur, ni `..`, ni chemin absolu : la validation
     * d'entrée exclut la catégorie entière, et la vérification de sortie la
     * reprend derrière. *Valider l'entrée et vérifier la sortie ne font pas
     * double emploi.*
     */
    it('refuse tout ce qui sortirait du miroir', () => {
        for (const id of [
            '../evade', '..\\evade', 'sous/dossier', 'C:\\Windows\\system32',
            '/etc/passwd', '', 'a'.repeat(200), 'avec espace', 'nul\0',
        ]) {
            expect(() => cheminDuMedia(id), id).toThrow();
        }
    });

    /**
     * **La configuration exacte qui a coûté l'installation en mars 2026** :
     * écrire dans le dossier de l'application. On n'écrit rien du tout.
     */
    it('refuse d’écrire sous APP_ROOT', () => {
        process.env.APP_ROOT = RACINE;
        expect(() => cheminDuMedia('m-1')).toThrow(/mars 2026/);
    });
});

describe('copierUnMedia', () => {
    it('écrit les octets, une seule fois', async () => {
        const premier = await copierUnMedia('m-1', octets(2048));
        expect(premier).toEqual({ ecrit: true, octets: 2048 });

        // Le second passage ne réécrit pas : c'est ce qui rend le miroir gratuit
        // dès la deuxième sauvegarde, et ce qui protège un octet déjà copié.
        const second = await copierUnMedia('m-1', octets(4096));
        expect(second).toEqual({ ecrit: false, octets: 2048 });
        expect((await fs.readFile(cheminDuMedia('m-1'))).length).toBe(2048);
    });

    /** *Une copie tronquée est pire qu'une absence : elle a l'air d'une copie.* */
    it('ne laisse jamais de fichier partiel derrière lui', async () => {
        await copierUnMedia('m-2', octets(16));
        expect((await fs.readdir(dossierDuMiroir())).filter(n => n.endsWith('.partiel'))).toEqual([]);
    });

    it('refuse un identifiant hors motif sans rien écrire', async () => {
        await expect(copierUnMedia('../dehors', octets(8))).rejects.toThrow();
        expect(await fs.readdir(dossierDuMiroir())).toEqual([]);
    });
});

describe('mediasCopies — ce qui rend l’incrément possible', () => {
    it('liste ce qui est déjà là, et rien d’autre', async () => {
        await copierUnMedia('m-1', octets(8));
        await copierUnMedia('m-2', octets(8));
        await inscrireAuCatalogue([{ id: 'm-1', name: 'Carte', type: 'image', size: 8, copieLe: 'x' }]);

        const liste = await mediasCopies();
        expect(liste.sort()).toEqual(['m-1', 'm-2']);
        expect(liste, 'le catalogue n’est pas un média').not.toContain(CATALOGUE);
    });

    it('rend une liste vide quand le miroir n’existe pas encore', async () => {
        await fs.remove(dossierDuMiroir());
        expect(await mediasCopies()).toEqual([]);
    });

    /** R3 : un fichier que le MJ aurait déposé là n'est pas vu, donc jamais touché. */
    it('ignore un fichier étranger', async () => {
        await fs.ensureDir(dossierDuMiroir());
        await fs.writeFile(path.join(dossierDuMiroir(), 'notes du MJ.txt'), 'x');
        expect(await mediasCopies()).toEqual([]);
    });
});

describe('le catalogue', () => {
    const fiche = (id: string, name: string) =>
        ({ id, name, type: 'image', size: 10, copieLe: '2026-08-29T00:00:00Z' });

    it('retient ce qu’un octet représente', async () => {
        await inscrireAuCatalogue([fiche('m-1', 'Hadley Hope'), fiche('m-2', 'Le bar')]);
        const lu = await fs.readJson(path.join(dossierDuMiroir(), CATALOGUE));

        expect(lu.format).toBe('gmos-miroir-medias');
        expect(Object.keys(lu.medias).sort()).toEqual(['m-1', 'm-2']);
        expect(lu.medias['m-1'].name).toBe('Hadley Hope');
    });

    /**
     * **Le miroir garde tout — décision de David du 2026-08-29.** Une image
     * supprimée dans GM-OS garde ses octets ; perdre sa fiche rendrait la
     * restauration muette sur ce qu'elle contient. *On garderait un fichier dont
     * on ne saurait plus le nom.*
     */
    it('ne perd jamais une fiche que GM-OS a oubliée', async () => {
        await inscrireAuCatalogue([fiche('m-1', 'Hadley Hope'), fiche('m-2', 'Le bar')]);
        await inscrireAuCatalogue([fiche('m-1', 'Hadley Hope')]);

        const lu = await fs.readJson(path.join(dossierDuMiroir(), CATALOGUE));
        expect(Object.keys(lu.medias).sort(), 'm-2 reste au catalogue').toEqual(['m-1', 'm-2']);
    });

    /** Un renommage dans GM-OS se propage : la fiche reçue gagne sur l'ancienne. */
    it('met à jour une fiche existante', async () => {
        await inscrireAuCatalogue([fiche('m-1', 'Sans titre')]);
        await inscrireAuCatalogue([fiche('m-1', 'Hadley Hope')]);

        const lu = await fs.readJson(path.join(dossierDuMiroir(), CATALOGUE));
        expect(lu.medias['m-1'].name).toBe('Hadley Hope');
    });

    /**
     * Un catalogue illisible ne doit pas bloquer la copie des octets : ceux-là
     * sont irremplaçables, le catalogue se reconstruit.
     */
    it('se reconstruit plutôt que d’échouer', async () => {
        const erreur = vi.spyOn(console, 'error').mockImplementation(() => {});
        await fs.ensureDir(dossierDuMiroir());
        await fs.writeFile(path.join(dossierDuMiroir(), CATALOGUE), '{ pas du json');

        await expect(inscrireAuCatalogue([fiche('m-1', 'Hadley Hope')])).resolves.toBe(1);
        expect(erreur).toHaveBeenCalled();
        erreur.mockRestore();
    });

    it('refuse d’inscrire un identifiant hors motif', async () => {
        await inscrireAuCatalogue([{ ...fiche('../dehors', 'x') }]);
        const lu = await fs.readJson(path.join(dossierDuMiroir(), CATALOGUE));
        expect(Object.keys(lu.medias)).toEqual([]);
    });
});
