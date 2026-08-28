import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * Le setup global mocke `idb` avec une base qui n'expose pas les méthodes
 * raccourcies get/put/delete. On le remplace ici par une implémentation
 * mémoire fidèle à celles qu'utilise idbStorage.
 */
const store = vi.hoisted(() => new Map<string, string>());
const putSpy = vi.hoisted(() => vi.fn());
const panne = vi.hoisted(() => ({ enLecture: false }));

vi.mock('idb', () => ({
    openDB: vi.fn(async () => ({
        objectStoreNames: { contains: () => true },
        createObjectStore: vi.fn(),
        get: async (_s: string, key: string) => {
            if (panne.enLecture) throw new Error('IndexedDB indisponible');
            return store.get(key);
        },
        put: async (_s: string, value: string, key: string) => {
            putSpy(key, value);
            store.set(key, value);
        },
        delete: async (_s: string, key: string) => { store.delete(key); },
    })),
}));

const { idbStateStorage, __resetIdbStorageForTests } = await import('./idbStorage');

const KEY = 'gmos-v5-session-os-storage';

beforeEach(() => {
    store.clear();
    putSpy.mockClear();
    panne.enLecture = false;
    window.localStorage.clear();
    __resetIdbStorageForTests();
});

describe('idbStateStorage', () => {
    it('écrit puis relit une valeur', async () => {
        await idbStateStorage.setItem(KEY, '{"campaigns":[]}');
        expect(await idbStateStorage.getItem(KEY)).toBe('{"campaigns":[]}');
    });

    it('renvoie null pour une clé absente', async () => {
        expect(await idbStateStorage.getItem('inconnue')).toBeNull();
    });

    it('supprime une clé', async () => {
        await idbStateStorage.setItem(KEY, 'x');
        await idbStateStorage.removeItem(KEY);
        expect(await idbStateStorage.getItem(KEY)).toBeNull();
    });

    it('n\'écrit pas deux fois la même valeur', async () => {
        await idbStateStorage.setItem(KEY, 'identique');
        expect(putSpy).toHaveBeenCalledTimes(1);

        await idbStateStorage.setItem(KEY, 'identique');
        expect(putSpy).toHaveBeenCalledTimes(1);
    });

    it('écrit de nouveau si la valeur change', async () => {
        await idbStateStorage.setItem(KEY, 'a');
        await idbStateStorage.setItem(KEY, 'b');
        expect(putSpy).toHaveBeenCalledTimes(2);
    });

    it('ne réécrit pas la valeur qui vient d\'être lue', async () => {
        // Sans cette garde, une fenêtre qui se réhydrate renotifierait les
        // autres, qui se réhydrateraient à leur tour, sans fin.
        store.set(KEY, 'venu-du-disque');

        const read = await idbStateStorage.getItem(KEY);
        await idbStateStorage.setItem(KEY, read!);

        expect(putSpy).not.toHaveBeenCalled();
    });
});

describe('idbStateStorage — reprise depuis localStorage', () => {
    it('récupère une valeur laissée par la version précédente', async () => {
        window.localStorage.setItem(KEY, '{"campaigns":["ancienne"]}');

        expect(await idbStateStorage.getItem(KEY)).toBe('{"campaigns":["ancienne"]}');
        expect(store.get(KEY)).toBe('{"campaigns":["ancienne"]}');
    });

    it('libère le quota localStorage une fois la reprise vérifiée', async () => {
        window.localStorage.setItem(KEY, 'contenu');
        await idbStateStorage.getItem(KEY);

        expect(window.localStorage.getItem(KEY)).toBeNull();
    });

    it('ne reprend rien si IndexedDB a déjà la clé', async () => {
        store.set(KEY, 'valeur-idb');
        window.localStorage.setItem(KEY, 'valeur-legacy-obsolete');

        expect(await idbStateStorage.getItem(KEY)).toBe('valeur-idb');
        // La copie localStorage n'est pas touchée : IndexedDB fait autorité.
        expect(window.localStorage.getItem(KEY)).toBe('valeur-legacy-obsolete');
    });

    it('renvoie null quand ni IndexedDB ni localStorage n\'ont la clé', async () => {
        expect(await idbStateStorage.getItem(KEY)).toBeNull();
        expect(putSpy).not.toHaveBeenCalled();
    });

    it('ne réécrit pas juste après une reprise', async () => {
        window.localStorage.setItem(KEY, 'repris');

        const read = await idbStateStorage.getItem(KEY);
        putSpy.mockClear();
        await idbStateStorage.setItem(KEY, read!);

        expect(putSpy).not.toHaveBeenCalled();
    });
});

/**
 * **Une lecture qui échoue ne doit pas se faire passer pour une base vide.**
 *
 * `getItem` rendait `null` dans les deux cas. L'appelant repartait alors sur les
 * mocks — et les persistait par-dessus la base qu'il venait de ne pas savoir
 * lire. C'est la moitié silencieuse de la perte du 2026-08-24.
 */
describe('idbStateStorage — une lecture ratée se dit', () => {
    it('remonte l’erreur au lieu de rendre null', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => { /* attendu */ });
        panne.enLecture = true;

        await expect(idbStateStorage.getItem(KEY)).rejects.toThrow('IndexedDB indisponible');
    });

    it('une clé absente reste un fait, pas une erreur', async () => {
        await expect(idbStateStorage.getItem('jamais-ecrite')).resolves.toBeNull();
    });
});
