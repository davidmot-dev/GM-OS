import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * **La plage arrive-t-elle jusqu'au moteur ?**
 *
 * `logic/plageDeLecture.test.ts` prouve que l'arbitrage est juste. Il ne prouve
 * pas que quiconque s'en sert — et c'est **exactement** le défaut qu'on répare
 * ici : `loopA` et `loopB` existaient depuis toujours, écrits par personne et
 * lus par personne, pendant que le guide promettait la fonctionnalité. *Une
 * donnée correcte que personne ne transporte laisse tous les tests au vert et
 * le défaut intact.*
 *
 * Ce test-ci garde donc le **chemin**, pas le calcul : le pad reçoit ses
 * points, les deux platines sont prévenues, et surtout la plage est posée
 * **après** le chargement — dans l'autre ordre, `loadTrack` l'effacerait, et
 * on aurait un morceau entier qui tourne avec une plage affichée à l'écran.
 */

vi.mock('../session/logic/idbStorage', () => ({
    idbStateStorage: { getItem: async () => null, setItem: async () => {}, removeItem: async () => {} },
    onPersistedStateChanged: () => () => {},
}));

/* Le cycle du ducking — même contournement que `raccourciDeLaCampagne.test.ts`. */
vi.mock('../voice/useVoiceStore', () => ({
    useVoiceStore: { subscribe: () => () => {}, getState: () => ({}) },
}));

const { useMusicStore } = await import('./useMusicStore');
const { musicEngine } = await import('./MusicEngine');

const pad = (id: string, extra: Partial<{ loopA: number | null; loopB: number | null }> = {}) => ({
    id,
    label: id,
    url: `${id}.mp3`,
    type: 'local' as const,
    loopA: null,
    loopB: null,
    ...extra,
});

const padsDuMagasin = () => useMusicStore.getState().playlists.flatMap(p => p.pads);

beforeEach(() => {
    vi.restoreAllMocks();
    useMusicStore.setState({
        playlists: [
            { id: 'pl-1', name: 'Rues', pads: [pad('pluie')] },
            { id: 'pl-2', name: 'Colonie', pads: [pad('soufflerie', { loopA: 12, loopB: 48 })] },
        ],
        deckA: { activePadId: null, activeTrackLabel: null, volume: 1, isLooping: true, isPlaying: false },
        deckB: { activePadId: null, activeTrackLabel: null, volume: 1, isLooping: true, isPlaying: false },
    });
});

describe('definirLaPlageDuPad', () => {
    it('écrit les deux points sur le bon pad, dans n\'importe quelle playlist', () => {
        useMusicStore.getState().definirLaPlageDuPad('soufflerie', 20, 90);

        const cible = padsDuMagasin().find(p => p.id === 'soufflerie');
        expect(cible).toMatchObject({ loopA: 20, loopB: 90 });
        // Et le voisin n'a pas bougé.
        expect(padsDuMagasin().find(p => p.id === 'pluie')).toMatchObject({ loopA: null, loopB: null });
    });

    it('retire la plage avec deux nuls — le morceau entier revient', () => {
        useMusicStore.getState().definirLaPlageDuPad('soufflerie', null, null);

        expect(padsDuMagasin().find(p => p.id === 'soufflerie')).toMatchObject({ loopA: null, loopB: null });
    });

    it('prévient la platine qui joue ce pad', () => {
        const surA = vi.spyOn(musicEngine.deckA, 'definirLaPlage').mockImplementation(() => {});
        const surB = vi.spyOn(musicEngine.deckB, 'definirLaPlage').mockImplementation(() => {});
        useMusicStore.setState({
            deckA: { ...useMusicStore.getState().deckA, activePadId: 'soufflerie' },
        });

        useMusicStore.getState().definirLaPlageDuPad('soufflerie', 20, 90);

        expect(surA).toHaveBeenCalledWith(20, 90);
        expect(surB).not.toHaveBeenCalled();
    });

    /**
     * Le préchargement met couramment le même morceau des deux côtés. Ne
     * prévenir que la platine d'où vient le geste laisserait l'autre jouer le
     * morceau entier en affichant la plage.
     */
    it('prévient LES DEUX platines quand le même pad est chargé des deux côtés', () => {
        const surA = vi.spyOn(musicEngine.deckA, 'definirLaPlage').mockImplementation(() => {});
        const surB = vi.spyOn(musicEngine.deckB, 'definirLaPlage').mockImplementation(() => {});
        useMusicStore.setState({
            deckA: { ...useMusicStore.getState().deckA, activePadId: 'soufflerie' },
            deckB: { ...useMusicStore.getState().deckB, activePadId: 'soufflerie' },
        });

        useMusicStore.getState().definirLaPlageDuPad('soufflerie', 20, 90);

        expect(surA).toHaveBeenCalledWith(20, 90);
        expect(surB).toHaveBeenCalledWith(20, 90);
    });

    it('ne touche à aucune platine qui joue autre chose', () => {
        const surA = vi.spyOn(musicEngine.deckA, 'definirLaPlage').mockImplementation(() => {});
        useMusicStore.setState({
            deckA: { ...useMusicStore.getState().deckA, activePadId: 'pluie' },
        });

        useMusicStore.getState().definirLaPlageDuPad('soufflerie', 20, 90);

        expect(surA).not.toHaveBeenCalled();
    });
});

describe('loadToDeck', () => {
    it('pose la plage du pad sur la platine', async () => {
        vi.spyOn(musicEngine.deckA, 'loadTrack').mockResolvedValue(undefined);
        const posee = vi.spyOn(musicEngine.deckA, 'definirLaPlage').mockImplementation(() => {});

        await useMusicStore.getState().loadToDeck('A', pad('soufflerie', { loopA: 12, loopB: 48 }));

        expect(posee).toHaveBeenCalledWith(12, 48);
    });

    /**
     * ⛔ **L'ordre est le fond de l'affaire.** `loadTrack` efface la plage de la
     * piste précédente — elle découpait un autre morceau. Posée avant, celle du
     * nouveau pad partirait avec.
     */
    it('la pose APRÈS le chargement, jamais avant', async () => {
        const charge = vi.spyOn(musicEngine.deckA, 'loadTrack').mockResolvedValue(undefined);
        const posee = vi.spyOn(musicEngine.deckA, 'definirLaPlage').mockImplementation(() => {});

        await useMusicStore.getState().loadToDeck('A', pad('soufflerie', { loopA: 12, loopB: 48 }));

        expect(charge.mock.invocationCallOrder[0]).toBeLessThan(posee.mock.invocationCallOrder[0]);
    });

    it('pose deux nuls pour un pad sans plage — sinon celle d\'avant survivrait', async () => {
        vi.spyOn(musicEngine.deckB, 'loadTrack').mockResolvedValue(undefined);
        const posee = vi.spyOn(musicEngine.deckB, 'definirLaPlage').mockImplementation(() => {});

        await useMusicStore.getState().loadToDeck('B', pad('pluie'));

        expect(posee).toHaveBeenCalledWith(null, null);
    });
});
