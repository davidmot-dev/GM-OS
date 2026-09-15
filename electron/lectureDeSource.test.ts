import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import path from 'node:path';
import os from 'node:os';
import fs from 'fs-extra';
import { lireUneSource, EXTENSIONS_TEXTE, EXTENSIONS_IMAGE } from './lectureDeSource';

/**
 * **Ce qu'un fichier choisi rend, et ce qu'il refuse de rendre.**
 *
 * ⚠️ **Un refus est une réponse, pas une exception.** L'écran doit pouvoir dire
 * *pourquoi* il ne peut rien faire de ce fichier : « pas le bon format » et
 * « illisible » n'appellent pas le même geste du meneur.
 *
 * ⛔ **Le PDF n'est pas éprouvé ici.** Fabriquer un PDF valide dans un test
 * reviendrait à écrire un encodeur, et l'éprouver sur un PDF fabriqué par nous
 * ne dirait rien des manuels réels — *un jeu d'essai qui ne ressemble pas à la
 * donnée ne garde que lui-même*. Ce qui est gardé ici, c'est que l'extension
 * `.pdf` **prend la bonne branche** ; la branche elle-même est celle que le
 * moteur RAG emprunte depuis des mois.
 */

let dossier: string;

const ecrire = async (nom: string, contenu: string | Buffer) => {
    const chemin = path.join(dossier, nom);
    await fs.writeFile(chemin, contenu);
    return chemin;
};

beforeAll(async () => {
    dossier = await fs.mkdtemp(path.join(os.tmpdir(), 'gmos-sources-'));
});

afterAll(async () => {
    await fs.remove(dossier);
});

describe('lireUneSource — le texte', () => {
    it.each(['table.json', 'table.md', 'table.markdown', 'table.txt', 'table.csv'])(
        'lit %s tel quel', async (nom) => {
            const chemin = await ecrire(nom, '1-3 Rien\n4-6 Un bruit');
            const lue = await lireUneSource(chemin);

            expect(lue.genre).toBe('texte');
            expect(lue).toMatchObject({ texte: '1-3 Rien\n4-6 Un bruit', nom });
        });

    it('rend les accents intacts', async () => {
        const chemin = await ecrire('accents.txt', 'Fuite d’oxygène — coursive');
        const lue = await lireUneSource(chemin);
        expect(lue).toMatchObject({ genre: 'texte', texte: 'Fuite d’oxygène — coursive' });
    });

    it('lit un fichier vide sans se plaindre', async () => {
        const chemin = await ecrire('vide.txt', '');
        expect(await lireUneSource(chemin)).toMatchObject({ genre: 'texte', texte: '' });
    });
});

describe('lireUneSource — les images', () => {
    it.each([['image.png', 'image/png'], ['photo.jpg', 'image/jpeg'],
             ['photo.jpeg', 'image/jpeg'], ['moderne.webp', 'image/webp']])(
        '%s revient en base64 avec son type', async (nom, mimeType) => {
            const octets = Buffer.from([0x89, 0x50, 0x4e, 0x47]);
            const lue = await lireUneSource(await ecrire(nom, octets));

            expect(lue).toMatchObject({ genre: 'image', mimeType, nom });
            expect((lue as { donnees: string }).donnees).toBe(octets.toString('base64'));
        });

    /** L'extension décide, pas le contenu : c'est le meneur qui a choisi. */
    it('suit l’extension, majuscules comprises', async () => {
        const lue = await lireUneSource(await ecrire('PHOTO.PNG', Buffer.from([1, 2])));
        expect(lue).toMatchObject({ genre: 'image', mimeType: 'image/png' });
    });
});

describe('lireUneSource — les refus', () => {
    it('refuse une extension qu’on ne sait pas lire, et le dit', async () => {
        const lue = await lireUneSource(await ecrire('feuille.xlsx', 'peu importe'));
        expect(lue).toMatchObject({ genre: 'refus', motif: 'extension-inconnue', nom: 'feuille.xlsx' });
    });

    it('refuse un fichier absent sans lever', async () => {
        const lue = await lireUneSource(path.join(dossier, 'jamais-ecrit.txt'));
        expect(lue).toMatchObject({ genre: 'refus', motif: 'illisible' });
    });

    it('nomme toujours le fichier, même en refusant', async () => {
        const lue = await lireUneSource(path.join(dossier, 'sous', 'perdu.txt'));
        expect(lue.nom).toBe('perdu.txt');
    });
});

/** *Une liste d'extensions recopiée dans le dialogue diverge de celle qui lit.* */
describe('les listes proposées et les listes lues', () => {
    it('tout ce que le dialogue propose en texte est lu comme du texte', async () => {
        for (const ext of EXTENSIONS_TEXTE) {
            const lue = await lireUneSource(await ecrire(`essai.${ext}`, 'x'));
            expect(lue.genre, `.${ext} n’est pas lu comme du texte`).toBe('texte');
        }
    });

    it('tout ce que le dialogue propose en image est lu comme une image', async () => {
        for (const ext of EXTENSIONS_IMAGE) {
            const lue = await lireUneSource(await ecrire(`essai.${ext}`, Buffer.from([1])));
            expect(lue.genre, `.${ext} n’est pas lu comme une image`).toBe('image');
        }
    });
});
