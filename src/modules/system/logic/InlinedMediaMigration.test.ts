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

    /*
      ⛔ **L'angle mort du 2026-09-18.** La sauvegarde automatique portait
      828 Ko de base64 dans `npc.savedEntities[0].avatar`, et ce recensement ne
      pouvait pas le voir : il ne lisait que le magasin de session et les
      favoris. NPC-OS a le sien, et c'est celui que remplit une demande de
      portrait à l'IA.
    */
    it('relève les fiches de NPC-OS, y compris celle qui est ouverte', () => {
        const entries = scanInlinedMedia({}, {}, {
            currentEntity: { id: 'n0', name: 'Elis', avatar: PNG },
            savedEntities: [
                { id: 'n1', name: 'Deckard', avatar: PNG },
                { id: 'n2', name: 'Rachel', avatar: 'm-deja-range' },
            ],
        });
        expect(entries.map(e => e.field)).toEqual(['Fiche NPC-OS ouverte', 'Fiche NPC-OS']);
        expect(entries.map(e => e.label)).toEqual(['pnj Elis', 'pnj Deckard']);
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

/**
 * ⛔ **L'incident du 2026-09-18, 17 h 23 — et le contrôle qui l'aurait vu.**
 *
 * La migration a parfaitement fonctionné : l'état persisté est passé de
 * 2 812 229 à 683 961 octets. **Et la sauvegarde automatique a refusé d'écrire
 * pendant plus d'une heure**, parce qu'une charge qui fait moins de la moitié
 * de la précédente est traitée comme une perte.
 *
 * La garde a raison — *c'est le moment où une perte se voit, ou elle ne se voit
 * jamais.* Mais `baisseAttendue` existe pour le cas légitime, et seule la purge
 * savait le poser : le meneur a dû sortir seize fichiers de son dossier de
 * sauvegardes pour débloquer son propre filet.
 *
 * ⭐ *Une garde qui protège des données doit avoir une porte pour le cas
 * légitime qu'elle bloque.* Ce contrôle lit la source de l'écran : il n'est pas
 * élégant, mais il tombe si quelqu'un retire la ligne — et le défaut, lui, ne
 * se voit qu'une heure plus tard, dans un journal que personne n'ouvre.
 */
describe('la migration annonce son rétrécissement à la sauvegarde', () => {
    const source = (async () =>
        (await import('../../../components/settings/InlinedMediaPanel.tsx?raw')).default as string)();

    it('demande une sauvegarde en déclarant la baisse attendue', async () => {
        const code = await source;
        /* ⚠️ Sans ce témoin, une lecture qui rend une chaîne vide passerait au
           vert pour la pire raison. */
        expect(code, 'la source du panneau n’a pas été lue').toContain('migrateInlinedMedia');

        expect(code, 'le panneau ne demande plus de sauvegarde après migration')
            .toContain('sauvegarderMaintenant');
        expect(code, '⛔ la sauvegarde ne déclare pas `baisseAttendue` : elle sera REFUSÉE')
            .toMatch(/sauvegarderMaintenant[\s\S]{0,200}baisseAttendue:\s*true/);
    });
});
