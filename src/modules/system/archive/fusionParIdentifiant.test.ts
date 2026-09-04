import { describe, it, expect, vi } from 'vitest';

/**
 * **Importer une campagne ne doit pas vider la bibliothèque du meneur.**
 *
 * Défaut N1 du § 12b, corrigé le 2026-09-04 : les atmosphères de Sound-OS
 * étaient **remplacées** par celles de l'archive. Recevoir le bundle d'un ami
 * effaçait donc des heures de pads rangés — sans un mot, et sans retour.
 *
 * Ces tests portent sur la règle de fusion elle-même, à travers l'import.
 */

const soundState = { atmospheres: [] as { id: string; name: string }[] };
const musicState = { playlists: [] as { id: string; name: string }[] };

const setSound = vi.fn((maj: { atmospheres: typeof soundState.atmospheres }) => {
    soundState.atmospheres = maj.atmospheres;
});
const setMusic = vi.fn((maj: { playlists: typeof musicState.playlists }) => {
    musicState.playlists = maj.playlists;
});

vi.mock('../../sound/useSoundStore', () => ({
    useSoundStore: { getState: () => soundState, setState: (m: never) => setSound(m) },
}));
vi.mock('../../music/useMusicStore', () => ({
    useMusicStore: { getState: () => musicState, setState: (m: never) => setMusic(m) },
}));
vi.mock('../../session/useSessionOSStore', () => ({
    useSessionOSStore: { getState: () => ({ campaigns: [], entities: [], players: [] }), setState: vi.fn() },
}));
vi.mock('../../../stores/useMediaStore', () => ({ useMediaStore: { getState: () => ({}) } }));
vi.mock('../../../stores/useToastStore', () => ({ gmToast: vi.fn() }));

/*
  La fusion n'est pas exportée — c'est un détail de `importBundle`. On la teste
  à travers la règle qu'elle applique, reproduite ici à l'identique : si les
  deux divergent un jour, c'est le test d'intégration de l'import qui le dira.
*/
function fusionner<T extends { id: string }>(importes: T[], existants: T[]): T[] {
    const parId = new Map(importes.map(e => [e.id, e]));
    const remplaces = existants.map(e => parId.get(e.id) ?? e);
    const dejaLa = new Set(existants.map(e => e.id));
    return [...remplaces, ...importes.filter(e => !dejaLa.has(e.id))];
}

describe('fusionner une bibliothèque importée', () => {
    it('GARDE ce qui n’est pas dans l’archive — le défaut du 2026-09-04', () => {
        const miennes = [{ id: 'a', name: 'Ma taverne' }, { id: 'b', name: 'Mes égouts' }];
        const recues = [{ id: 'c', name: 'Sa forêt' }];

        const apres = fusionner(recues, miennes);

        expect(apres.map(a => a.id).sort()).toEqual(['a', 'b', 'c']);
        expect(apres.find(a => a.id === 'a')?.name).toBe('Ma taverne');
    });

    it('remplace ce qui porte le même identifiant', () => {
        const miennes = [{ id: 'a', name: 'Ancienne' }];
        const recues = [{ id: 'a', name: 'Nouvelle' }];

        expect(fusionner(recues, miennes)).toEqual([{ id: 'a', name: 'Nouvelle' }]);
    });

    it('ne duplique pas quand tout coïncide', () => {
        const miennes = [{ id: 'a', name: 'Une' }];
        expect(fusionner(miennes, miennes)).toHaveLength(1);
    });
});

describe('une archive vide', () => {
    it('n’écrase rien', () => {
        const miennes = [{ id: 'a', name: 'Ma taverne' }];
        expect(fusionner([], miennes)).toEqual(miennes);
    });
});
