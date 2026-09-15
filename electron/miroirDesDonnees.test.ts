import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';
import path from 'node:path';
import fs from 'fs-extra';
import os from 'node:os';

/**
 * **Le miroir de `databases/`.**
 *
 * *David, le 2026-09-15 : « rajoute la database dans une sauvegarde ».*
 *
 * ⛔ **Ce dossier n'était dans AUCUNE sauvegarde** — ni la manuelle, ni
 * l'automatique, ni le miroir des médias. Le trou était antérieur aux deux
 * Ateliers : tant que `databases/` n'était que du contenu livré, un
 * `git checkout` le rendait. *Un dossier en lecture seule n'a pas besoin de
 * filet ; le jour où quelque chose y écrit, il en a besoin le même jour.*
 *
 * Ce module écrit sur le disque du meneur : **les trois règles du 28/08 sont ce
 * qu'on éprouve en premier.** *Une sauvegarde qui peut détruire est pire que pas
 * de sauvegarde du tout*, et c'est exactement ce qui est arrivé en mars 2026.
 */

const BAC = fs.mkdtempSync(path.join(os.tmpdir(), 'gmos-donnees-'));

vi.mock('electron', () => ({ app: { getPath: () => BAC } }));

const {
    balayerLesDonnees,
    cheminDuReflet,
    dossierDuMiroir,
    racineDesDonnees,
    refleterUnFichier,
    refletsConnus,
} = await import('./miroirDesDonnees');

const SOURCE = path.join(BAC, 'app', 'databases');
const MIROIR = path.join(BAC, 'miroir');

const poser = (relatif: string, contenu: string) => {
    const cible = path.join(SOURCE, relatif);
    fs.ensureDirSync(path.dirname(cible));
    fs.writeFileSync(cible, contenu, 'utf-8');
};

const lireLeReflet = (relatif: string) =>
    fs.readFileSync(path.join(MIROIR, relatif), 'utf-8');

beforeEach(() => {
    fs.removeSync(SOURCE);
    fs.removeSync(MIROIR);
    fs.ensureDirSync(SOURCE);
});

afterAll(() => fs.removeSync(BAC));

describe('où le miroir vit', () => {
    /** ⛔ **R2** : jamais sous la racine de l'application. */
    it('vit sous userData, dans backups/databases', () => {
        expect(dossierDuMiroir()).toBe(path.join(BAC, 'backups', 'databases'));
    });

    it('la source vit sous la racine de l’application', () => {
        expect(racineDesDonnees('/app')).toBe(path.join('/app', 'databases'));
    });
});

describe('⛔ cheminDuReflet — le confinement', () => {
    it('range un fichier à sa place dans l’arborescence', () => {
        expect(cheminDuReflet(MIROIR, 'tables/Alien/panique.json'))
            .toBe(path.join(MIROIR, 'tables', 'Alien', 'panique.json'));
    });

    /**
     * ⚠️ **Les deux séparateurs mènent au même reflet.** Le chemin arrive
     * parfois d'un `path.relative` Windows. *Un miroir qui range le même fichier
     * à deux endroits selon la barre oblique employée ment sur ce qu'il
     * contient.*
     */
    it('traite la barre inverse comme la barre oblique', () => {
        expect(cheminDuReflet(MIROIR, 'tables\\Alien\\panique.json'))
            .toBe(cheminDuReflet(MIROIR, 'tables/Alien/panique.json'));
    });

    it.each([
        '..',
        '../dehors.json',
        'tables/../../dehors.json',
        'tables/./panique.json',
    ])('refuse « %s »', (relatif) => {
        expect(cheminDuReflet(MIROIR, relatif)).toBeNull();
    });

    it('refuse un chemin absolu', () => {
        const absolu = process.platform === 'win32' ? 'C:\\ailleurs\\x.json' : '/ailleurs/x.json';
        expect(cheminDuReflet(MIROIR, absolu)).toBeNull();
    });

    it('refuse le vide et l’octet nul', () => {
        expect(cheminDuReflet(MIROIR, '')).toBeNull();
        expect(cheminDuReflet(MIROIR, '   ')).toBeNull();
        expect(cheminDuReflet(MIROIR, 'tables/pa\0nique.json')).toBeNull();
    });
});

describe('refleterUnFichier', () => {
    it('copie un fichier qui n’était pas encore dans le miroir', async () => {
        poser('tables/Alien/panique.json', '{"a":1}');

        expect(await refleterUnFichier(SOURCE, MIROIR, 'tables/Alien/panique.json')).toBe('copie');
        expect(lireLeReflet('tables/Alien/panique.json')).toBe('{"a":1}');
    });

    /**
     * ⚠️ **On compare le CONTENU, pas les dates.** *Un miroir qui se fie aux
     * dates finit par croire à jour ce qui ne l'est pas — silencieusement.*
     */
    it('ne recopie pas un fichier identique', async () => {
        poser('x.json', 'pareil');
        await refleterUnFichier(SOURCE, MIROIR, 'x.json');

        expect(await refleterUnFichier(SOURCE, MIROIR, 'x.json')).toBe('inchange');
    });

    it('recopie un fichier dont le contenu a changé, à taille égale', async () => {
        poser('x.json', 'aaaa');
        await refleterUnFichier(SOURCE, MIROIR, 'x.json');

        poser('x.json', 'bbbb');
        expect(await refleterUnFichier(SOURCE, MIROIR, 'x.json')).toBe('copie');
        expect(lireLeReflet('x.json')).toBe('bbbb');
    });

    /**
     * ⛔ **LA DÉCISION DE DAVID, figée ici.** *Une suppression accidentelle qui
     * se propage au filet le rend inutile le jour où il servirait.*
     */
    it('GARDE le reflet d’un fichier supprimé de la source', async () => {
        poser('tables/perdue.json', 'précieux');
        await refleterUnFichier(SOURCE, MIROIR, 'tables/perdue.json');

        fs.removeSync(path.join(SOURCE, 'tables/perdue.json'));

        expect(await refleterUnFichier(SOURCE, MIROIR, 'tables/perdue.json')).toBe('absent');
        expect(lireLeReflet('tables/perdue.json'), 'le reflet doit survivre').toBe('précieux');
    });

    /** ⛔ **R3** : rien hors du miroir n’est écrit, même sur un chemin hostile. */
    it('refuse un chemin qui sort, sans rien écrire', async () => {
        const dehors = path.join(BAC, 'dehors.json');
        fs.writeFileSync(dehors, 'intouchable');

        expect(await refleterUnFichier(SOURCE, MIROIR, '../dehors.json')).toBe('refuse');
        expect(fs.readFileSync(dehors, 'utf-8')).toBe('intouchable');
    });
});

describe('balayerLesDonnees — ce qui rattrape les éditions à la main', () => {
    it('copie toute l’arborescence au premier passage', async () => {
        poser('tables/Alien/a.json', '1');
        poser('tables/MedFan/b.json', '2');
        poser('calendars/harptos.json', '3');

        const bilan = await balayerLesDonnees(SOURCE, MIROIR);

        expect(bilan.copies).toBe(3);
        expect(bilan.nouveaux.sort()).toEqual([
            'calendars/harptos.json', 'tables/Alien/a.json', 'tables/MedFan/b.json',
        ]);
    });

    /** Le cas courant : rien n'a bougé depuis le dernier passage. */
    it('ne copie rien au second passage', async () => {
        poser('tables/a.json', '1');
        await balayerLesDonnees(SOURCE, MIROIR);

        const bilan = await balayerLesDonnees(SOURCE, MIROIR);
        expect(bilan).toMatchObject({ copies: 0, inchanges: 1, nouveaux: [] });
    });

    /** ⭐ C'est ce qui attrape le fichier édité au bloc-notes, hors de GM-OS. */
    it('attrape un fichier modifié hors de l’application', async () => {
        poser('tables/a.json', 'avant');
        await balayerLesDonnees(SOURCE, MIROIR);

        poser('tables/a.json', 'après, édité à la main');
        const bilan = await balayerLesDonnees(SOURCE, MIROIR);

        expect(bilan.nouveaux).toEqual(['tables/a.json']);
        expect(lireLeReflet('tables/a.json')).toBe('après, édité à la main');
    });

    it('n’efface jamais du miroir ce qui a disparu de la source', async () => {
        poser('tables/a.json', 'gardé');
        poser('tables/b.json', 'gardé aussi');
        await balayerLesDonnees(SOURCE, MIROIR);

        fs.removeSync(path.join(SOURCE, 'tables/b.json'));
        await balayerLesDonnees(SOURCE, MIROIR);

        expect((await refletsConnus(MIROIR)).sort()).toEqual(['tables/a.json', 'tables/b.json']);
    });

    it('survit à un dossier source absent', async () => {
        fs.removeSync(SOURCE);
        expect(await balayerLesDonnees(SOURCE, MIROIR))
            .toMatchObject({ copies: 0, inchanges: 0, refuses: 0 });
    });

    it('rend une arborescence à plat, en chemins relatifs', async () => {
        poser('a/b/c.json', '1');
        await balayerLesDonnees(SOURCE, MIROIR);

        expect(await refletsConnus(MIROIR)).toEqual(['a/b/c.json']);
    });
});
