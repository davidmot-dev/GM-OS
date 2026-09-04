import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { MediaItem } from '../stores/useMediaStore';
import type { RegistreDesUsages } from './proprietairesDesMedias';

/**
 * **Ce que le nettoyage doit refuser de faire.**
 *
 * Le bouton supprimait au premier clic et annonçait le compte après. Ces tests
 * gardent les deux garde-fous posés le 2026-09-04 : *on montre avant d'agir*,
 * et *on n'agit pas sur un recensement qu'on sait incomplet*.
 */

const media = (id: string, size = 1024, isPersistent = false): MediaItem => ({
    id, name: `${id}.png`, type: 'image', size, createdAt: 0, tags: [], campaignIds: [], isPersistent,
});

let bibliotheque: MediaItem[] = [];
const supprimes: string[] = [];
let recensement = { usages: new Map() as RegistreDesUsages, complet: true, modulesEnEchec: [] as string[] };

vi.mock('../stores/useMediaStore', () => ({
    useMediaStore: {
        getState: () => ({
            initDB: async () => {},
            mediaList: bibliotheque,
            deleteMedia: async (id: string) => {
                supprimes.push(id);
                bibliotheque = bibliotheque.filter((m) => m.id !== id);
            },
        }),
    },
}));

vi.mock('./proprietairesDesMedias', () => ({ usagesDesMedias: () => recensement }));

const { mediaCleanupService } = await import('./MediaCleanupService');

beforeEach(() => {
    bibliotheque = [];
    supprimes.length = 0;
    recensement = { usages: new Map(), complet: true, modulesEnEchec: [] };
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
});

describe("l'aperçu ne touche à rien", () => {
    it('sépare ce qui partirait de ce qui est verrouillé, et compte les octets', async () => {
        bibliotheque = [media('m-utilise'), media('m-orphelin', 2048), media('m-protege', 999, true)];
        recensement.usages.set('m-utilise', [{ module: 'Map-OS', sujet: 'Les égouts' }]);

        const apercu = await mediaCleanupService.apercu();

        expect(apercu.aSupprimer.map((o) => o.media.id)).toEqual(['m-orphelin']);
        expect(apercu.epargnes.map((o) => o.media.id)).toEqual(['m-protege']);
        expect(apercu.octets).toBe(2048);
        expect(supprimes).toEqual([]);
    });
});

describe('la suppression', () => {
    it("exécute exactement le plan qu'on a montré", async () => {
        bibliotheque = [media('m-a'), media('m-b')];
        const apercu = await mediaCleanupService.apercu();

        /*
          Entre l'affichage et le clic, un module s'est mis à retenir `m-b`.
          On supprime malgré tout ce qui a été annoncé : l'utilisateur a
          confirmé une liste, pas une intention.
        */
        recensement.usages.set('m-b', [{ module: 'Favoris', sujet: 'Ajouté entre-temps' }]);

        const res = await mediaCleanupService.performCleanup(apercu);

        expect(supprimes).toEqual(['m-a', 'm-b']);
        expect(res.deletedCount).toBe(2);
    });

    it('recense elle-même si on ne lui passe aucun plan', async () => {
        bibliotheque = [media('m-orphelin')];

        const res = await mediaCleanupService.performCleanup();

        expect(supprimes).toEqual(['m-orphelin']);
        expect(res.deletedCount).toBe(1);
    });
});

describe('un recensement incomplet', () => {
    it("ne supprime RIEN et dit quels modules n'ont pas répondu", async () => {
        bibliotheque = [media('m-orphelin-apparent')];
        recensement = { usages: new Map(), complet: false, modulesEnEchec: ['Map-OS'] };

        const res = await mediaCleanupService.performCleanup();

        expect(supprimes).toEqual([]);
        expect(res.deletedCount).toBe(0);
        expect(res.refuse).toEqual(['Map-OS']);
    });

    it("marque l'aperçu comme non fiable", async () => {
        recensement = { usages: new Map(), complet: false, modulesEnEchec: ['Storyboard'] };
        const apercu = await mediaCleanupService.apercu();
        expect(apercu.fiable).toBe(false);
        expect(apercu.modulesEnEchec).toEqual(['Storyboard']);
    });
});
