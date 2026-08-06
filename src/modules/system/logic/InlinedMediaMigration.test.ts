import { describe, it, expect, vi } from 'vitest';
import {
    isInlinedMedia,
    dataUrlToBlob,
    suggestFileName,
    scanInlinedMedia,
    summarize,
    migrateInlinedMedia,
    type InlinedEntry,
} from './InlinedMediaMigration';

/** `data:image/png;base64,…` portant réellement les octets donnés. */
const makeDataUrl = (mime: string, content: string) =>
    `data:${mime};base64,${btoa(content)}`;

const PNG = makeDataUrl('image/png', 'octets-png');

describe('isInlinedMedia', () => {
    it('ne reconnaît que les URL de données', () => {
        expect(isInlinedMedia(PNG)).toBe(true);
        expect(isInlinedMedia('m-1234')).toBe(false);
        expect(isInlinedMedia('http://exemple/a.png')).toBe(false);
        expect(isInlinedMedia('C:/images/a.png')).toBe(false);
        expect(isInlinedMedia(undefined)).toBe(false);
        expect(isInlinedMedia(42)).toBe(false);
    });
});

describe('dataUrlToBlob', () => {
    it('restitue les octets et le type', async () => {
        const blob = dataUrlToBlob(PNG);
        expect(blob.type).toBe('image/png');
        expect(await blob.text()).toBe('octets-png');
    });

    it('gère une URL non encodée en base64', async () => {
        const blob = dataUrlToBlob('data:text/plain,bonjour%20monde');
        expect(await blob.text()).toBe('bonjour monde');
    });

    it('refuse une URL sans séparateur', () => {
        expect(() => dataUrlToBlob('data:image/png;base64')).toThrow();
    });

    it('lève sur un base64 corrompu plutôt que de produire un blob vide', () => {
        // Un blob vide écrit en médiathèque serait une image perdue en silence.
        expect(() => dataUrlToBlob('data:image/png;base64,@@@non-base64@@@')).toThrow();
    });
});

describe('suggestFileName', () => {
    it('dérive un nom lisible et une extension du type', () => {
        expect(suggestFileName('lieu La Taverne', PNG)).toBe('lieu-la-taverne.png');
        expect(suggestFileName('pnj Caleb', makeDataUrl('image/jpeg', 'x'))).toBe('pnj-caleb.jpg');
    });

    it('retombe sur un nom neutre si le libellé ne donne rien', () => {
        expect(suggestFileName('!!!', PNG)).toBe('media.png');
    });

    it('utilise une extension neutre pour un type inconnu', () => {
        expect(suggestFileName('truc', makeDataUrl('application/x-inconnu', 'x'))).toBe('truc.bin');
    });
});

describe('scanInlinedMedia', () => {
    const state = () => ({
        campaigns: [{ id: 'c1', name: 'Alien', wallpaperUrl: PNG }],
        atlasMaps: [
            { id: 'a1', name: 'Taverne', fileUrl: PNG },
            { id: 'a2', name: 'Port', fileUrl: 'm-deja-range' },
        ],
        entities: [{ id: 'e1', name: 'Caleb', avatar: PNG }],
        clues: [{ id: 'i1', title: 'Lettre', mediaUrl: PNG }],
        players: [{
            id: 'p1', name: 'David', avatarUrl: PNG,
            characters: [{ id: 'ch1', name: 'Ripley', portraitUrl: PNG }],
        }],
    });

    it('relève tous les champs porteurs de médias inline', () => {
        const entries = scanInlinedMedia(state());
        expect(entries.map(e => e.field).sort()).toEqual([
            'Ambiance de campagne', 'Indice', 'Joueur', 'Lieu', 'PNJ', 'Personnage',
        ]);
    });

    it('ignore les champs déjà rangés en médiathèque', () => {
        const entries = scanInlinedMedia(state());
        expect(entries.some(e => e.label.includes('Port'))).toBe(false);
    });

    it('relève aussi les deux champs des favoris', () => {
        const entries = scanInlinedMedia({}, {
            favorites: [{ id: 'f1', name: 'Épée', imageUrl: PNG, tokenUrl: PNG }],
        });
        expect(entries.map(e => e.field)).toEqual(['Favori', 'Jeton de favori']);
    });

    it('ne bronche pas sur un état vide ou incomplet', () => {
        expect(scanInlinedMedia({})).toEqual([]);
        expect(scanInlinedMedia({ players: [{ id: 'p1' }] })).toEqual([]);
        expect(scanInlinedMedia({ atlasMaps: [null as any] })).toEqual([]);
    });

    it('apply remplace le champ sans toucher au reste', () => {
        const s = state();
        const entry = scanInlinedMedia(s).find(e => e.field === 'Lieu')!;

        entry.apply('m-nouveau');

        expect(s.atlasMaps[0].fileUrl).toBe('m-nouveau');
        expect(s.atlasMaps[0].name).toBe('Taverne');
        expect(s.atlasMaps[0].id).toBe('a1');
    });
});

describe('summarize', () => {
    it('totalise et classe par famille de champ', () => {
        const entries = [
            { field: 'Lieu', bytes: 300 },
            { field: 'Lieu', bytes: 200 },
            { field: 'PNJ', bytes: 100 },
        ] as InlinedEntry[];

        const s = summarize(entries);
        expect(s.count).toBe(3);
        expect(s.totalBytes).toBe(600);
        expect(s.byField).toEqual([
            { field: 'Lieu', count: 2, bytes: 500 },
            { field: 'PNJ', count: 1, bytes: 100 },
        ]);
    });

    it('gère l\'absence de média', () => {
        expect(summarize([])).toEqual({ count: 0, totalBytes: 0, byField: [] });
    });
});

describe('migrateInlinedMedia', () => {
    /** Médiathèque en mémoire, fidèle au contrat de useMediaStore. */
    const makeLibrary = () => {
        const store = new Map<string, Blob>();
        let n = 0;
        return {
            store,
            addMedia: vi.fn(async (file: File) => {
                const id = `m-test-${++n}`;
                store.set(id, file);
                return id;
            }),
            getMediaBlob: vi.fn(async (id: string) => store.get(id)),
        };
    };

    it('range le média et remplace le champ', async () => {
        const lib = makeLibrary();
        const host = { fileUrl: PNG };
        const entries = scanInlinedMedia({ atlasMaps: [{ id: 'a1', name: 'T', ...host }] });
        const target = entries[0];

        const report = await migrateInlinedMedia(entries, lib);

        expect(report.migrated).toBe(1);
        expect(report.failed).toBe(0);
        expect(report.freedBytes).toBe(target.bytes);
        expect(lib.addMedia).toHaveBeenCalledTimes(1);
    });

    it('écrit l\'identifiant obtenu à la place du base64', async () => {
        const lib = makeLibrary();
        const state = { atlasMaps: [{ id: 'a1', name: 'Taverne', fileUrl: PNG }] };

        await migrateInlinedMedia(scanInlinedMedia(state), lib);

        expect(state.atlasMaps[0].fileUrl).toBe('m-test-1');
    });

    it('conserve le base64 si la relecture est incohérente', async () => {
        // Le cas qui compte : sans cette garde, le champ pointerait vers un
        // média absent et l'image aurait disparu.
        const lib = makeLibrary();
        lib.getMediaBlob = vi.fn(async () => undefined);
        const state = { atlasMaps: [{ id: 'a1', name: 'Taverne', fileUrl: PNG }] };

        const report = await migrateInlinedMedia(scanInlinedMedia(state), lib);

        expect(report.failed).toBe(1);
        expect(report.migrated).toBe(0);
        expect(state.atlasMaps[0].fileUrl).toBe(PNG);
    });

    it('conserve le base64 si la taille relue diffère', async () => {
        const lib = makeLibrary();
        lib.getMediaBlob = vi.fn(async () => new Blob(['tronque']));
        const state = { atlasMaps: [{ id: 'a1', name: 'T', fileUrl: PNG }] };

        const report = await migrateInlinedMedia(scanInlinedMedia(state), lib);

        expect(report.failed).toBe(1);
        expect(state.atlasMaps[0].fileUrl).toBe(PNG);
    });

    it('poursuit après un échec et rapporte les autres', async () => {
        const lib = makeLibrary();
        lib.addMedia = vi.fn()
            .mockRejectedValueOnce(new Error('disque plein'))
            .mockImplementation(async (file: File) => {
                const id = 'm-test-ok';
                lib.store.set(id, file);
                return id;
            });

        const state = {
            atlasMaps: [
                { id: 'a1', name: 'Premier', fileUrl: PNG },
                { id: 'a2', name: 'Second', fileUrl: PNG },
            ],
        };

        const report = await migrateInlinedMedia(scanInlinedMedia(state), lib);

        expect(report.failed).toBe(1);
        expect(report.migrated).toBe(1);
        expect(state.atlasMaps[0].fileUrl).toBe(PNG);
        expect(state.atlasMaps[1].fileUrl).toBe('m-test-ok');
        expect(report.errors[0]).toContain('disque plein');
    });

    it('rend compte de l\'avancement', async () => {
        const lib = makeLibrary();
        const onProgress = vi.fn();
        const state = {
            atlasMaps: [
                { id: 'a1', name: 'A', fileUrl: PNG },
                { id: 'a2', name: 'B', fileUrl: PNG },
            ],
        };

        await migrateInlinedMedia(scanInlinedMedia(state), { ...lib, onProgress });

        expect(onProgress).toHaveBeenNthCalledWith(1, 1, 2);
        expect(onProgress).toHaveBeenNthCalledWith(2, 2, 2);
    });

    it('ne fait rien sans média à reprendre', async () => {
        const lib = makeLibrary();
        const report = await migrateInlinedMedia([], lib);

        expect(report).toEqual({ migrated: 0, skipped: 0, failed: 0, freedBytes: 0, errors: [] });
        expect(lib.addMedia).not.toHaveBeenCalled();
    });
});
