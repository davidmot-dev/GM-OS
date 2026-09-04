import { describe, it, expect, vi, beforeEach } from 'vitest';
import { importerPlusieursMedias } from './importerPlusieursMedias';

/**
 * **Ranger trente fichiers d'un coup, sans que l'un fasse tomber les autres.**
 *
 * Point H8 du § 12c, corrigé le 2026-09-05. Le Media Hub ne lisait que
 * `files?.[0]` : ranger une sonothèque se faisait fichier par fichier.
 */

const fichier = (name: string, size = 100) => ({ name, size }) as File;

beforeEach(() => vi.clearAllMocks());

describe('importer plusieurs fichiers', () => {
    it('les range tous, dans l’ordre', async () => {
        const ajouter = vi.fn(async (_f: File) => {});

        const r = await importerPlusieursMedias(
            [fichier('a.mp3'), fichier('b.mp3'), fichier('c.mp3')],
            { existants: [], ajouter, demanderPourLeDoublon: () => true },
        );

        expect(r.ranges).toBe(3);
        expect(ajouter.mock.calls.map(([f]) => f.name)).toEqual(['a.mp3', 'b.mp3', 'c.mp3']);
    });

    it('ne fait rien sur une sélection vide', async () => {
        const ajouter = vi.fn(async () => {});
        const r = await importerPlusieursMedias([], { existants: [], ajouter, demanderPourLeDoublon: () => true });

        expect(r).toEqual({ ranges: 0, echecs: [], ecartes: 0 });
        expect(ajouter).not.toHaveBeenCalled();
    });
});

describe('un échec n’arrête pas les suivants', () => {
    it('range les autres et nomme celui qui a échoué', async () => {
        const ajouter = vi.fn(async (f: File) => {
            if (f.name === 'casse.mp3') throw new Error('base pleine');
        });

        const r = await importerPlusieursMedias(
            [fichier('a.mp3'), fichier('casse.mp3'), fichier('c.mp3')],
            { existants: [], ajouter, demanderPourLeDoublon: () => true },
        );

        expect(r.ranges).toBe(2);
        expect(r.echecs).toEqual(['casse.mp3']);
    });

    it('survit à un lot entièrement en échec', async () => {
        const ajouter = vi.fn(async () => { throw new Error('non'); });

        const r = await importerPlusieursMedias(
            [fichier('a.mp3'), fichier('b.mp3')],
            { existants: [], ajouter, demanderPourLeDoublon: () => true },
        );

        expect(r.ranges).toBe(0);
        expect(r.echecs).toEqual(['a.mp3', 'b.mp3']);
    });
});

describe('la question du doublon se pose par fichier', () => {
    it('n’en demande que pour ceux qui en sont', async () => {
        const demander = vi.fn(() => true);
        const ajouter = vi.fn(async () => {});

        await importerPlusieursMedias(
            [fichier('deja.mp3', 500), fichier('neuf.mp3', 900)],
            { existants: [{ name: 'deja.mp3', size: 500 }], ajouter, demanderPourLeDoublon: demander },
        );

        expect(demander).toHaveBeenCalledTimes(1);
        expect(demander).toHaveBeenCalledWith('deja.mp3');
    });

    it('un refus ne saute QUE celui-là — le reste entre', async () => {
        const ajouter = vi.fn(async (_f: File) => {});

        const r = await importerPlusieursMedias(
            [fichier('a.mp3'), fichier('deja.mp3', 500), fichier('c.mp3')],
            {
                existants: [{ name: 'deja.mp3', size: 500 }],
                ajouter,
                demanderPourLeDoublon: () => false,
            },
        );

        expect(r.ranges).toBe(2);
        expect(r.ecartes).toBe(1);
        expect(ajouter.mock.calls.map(([f]) => f.name)).toEqual(['a.mp3', 'c.mp3']);
    });

    it('même nom mais taille différente n’est pas un doublon', async () => {
        const demander = vi.fn(() => true);

        await importerPlusieursMedias(
            [fichier('orage.mp3', 900)],
            { existants: [{ name: 'orage.mp3', size: 500 }], ajouter: async () => {}, demanderPourLeDoublon: demander },
        );

        expect(demander).not.toHaveBeenCalled();
    });
});

describe('en série, jamais en parallèle', () => {
    it('n’entame le suivant qu’une fois le précédent rangé', async () => {
        /*
          `addMedia` écrit dans IndexedDB : trente écritures lancées ensemble
          sur une base fraîchement réhydratée sont la course déjà payée ici.
        */
        let enCours = 0;
        let maximum = 0;
        const ajouter = async () => {
            enCours += 1;
            maximum = Math.max(maximum, enCours);
            await Promise.resolve();
            enCours -= 1;
        };

        await importerPlusieursMedias(
            [fichier('a'), fichier('b'), fichier('c'), fichier('d')],
            { existants: [], ajouter, demanderPourLeDoublon: () => true },
        );

        expect(maximum).toBe(1);
    });
});
