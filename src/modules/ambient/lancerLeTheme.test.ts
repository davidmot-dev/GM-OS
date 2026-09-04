import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * **Un pad de télécommande doit produire du son.**
 *
 * Défaut A1 du § 12e, corrigé le 2026-09-04. `loadTheme` pose les huit pistes à
 * l'arrêt — juste à l'écran, où l'on charge puis règle puis démarre. Mais un pad
 * n'a pas de second geste : il chargeait le silence.
 *
 * *Et il chargeait le silence deux fois : la branche existait dans
 * `sceneActions`, mais aucune ambiance n'était envoyée à la télécommande.*
 */

const moteur = {
    fadeOutAll: vi.fn(),
    resume: vi.fn(async () => {}),
    tracks: Array.from({ length: 8 }, () => ({
        load: vi.fn(async () => {}),
        play: vi.fn(),
        stop: vi.fn(),
        setVolume: vi.fn(),
    })),
};

vi.mock('./AmbientEngine', () => ({ ambientEngine: moteur }));
vi.mock('../light/useLightStore', () => ({ useLightStore: { getState: () => ({ isSyncEnabled: false }) } }));

const { useAmbientStore } = await import('./useAmbientStore');

const THEME = {
    id: 'test-taverne',
    universe: 'Fantastique',
    name: 'Taverne',
    tracks: [
        { label: 'Rumeur', url: 'm-rumeur', volume: 0.5, color: '#fff' },
        { label: 'Feu', url: 'm-feu', volume: 0.3, color: '#fff' },
        /* Une piste du thème que le meneur a mise à zéro : elle en fait partie
           sans faire partie du moment. */
        { label: 'Orage', url: 'm-orage', volume: 0, color: '#fff' },
        /* Un emplacement nommé mais vide — comme les thèmes livrés. */
        { label: 'Vide', url: '', volume: 0.8, color: '#fff' },
    ],
};

beforeEach(() => {
    vi.clearAllMocks();
    /*
      Les pistes se remettent au repos entre deux cas : le magasin est un
      singleton, et sans cela le thème du cas précédent joue encore.
    */
    useAmbientStore.setState({
        presets: [THEME] as never,
        tracks: useAmbientStore.getState().tracks.map(t => ({
            ...t, url: '', isPlaying: false, label: '',
        })),
    });
});

describe('lancer un thème depuis un pad', () => {
    it('démarre les pistes qui ont un fichier ET un volume', async () => {
        await useAmbientStore.getState().lancerLeTheme('Fantastique', 'Taverne');

        const jouees = useAmbientStore.getState().tracks
            .map((t, i) => ({ t, i }))
            .filter(({ t }) => t.isPlaying)
            .map(({ t }) => t.label);

        expect(jouees).toEqual(['Rumeur', 'Feu']);
    });

    it("ne démarre pas une piste à volume zéro", async () => {
        await useAmbientStore.getState().lancerLeTheme('Fantastique', 'Taverne');
        expect(moteur.tracks[2].play).not.toHaveBeenCalled();
    });

    it("ne démarre pas un emplacement sans fichier", async () => {
        await useAmbientStore.getState().lancerLeTheme('Fantastique', 'Taverne');
        expect(moteur.tracks[3].play).not.toHaveBeenCalled();
    });

    it("ne touche à rien sur un thème inconnu — et surtout n'arrête pas ce qui joue", async () => {
        await useAmbientStore.getState().lancerLeTheme('Fantastique', 'Taverne');
        const avant = useAmbientStore.getState().tracks.map(t => t.isPlaying);

        await useAmbientStore.getState().lancerLeTheme('Fantastique', 'Inexistant');

        expect(useAmbientStore.getState().tracks.map(t => t.isPlaying)).toEqual(avant);
    });
});

describe('charger sans lancer reste possible', () => {
    it("`loadTheme` seul ne démarre toujours rien — c'est le geste de l'écran", async () => {
        await useAmbientStore.getState().loadTheme('Fantastique', 'Taverne');

        expect(useAmbientStore.getState().tracks.some(t => t.isPlaying)).toBe(false);
        expect(useAmbientStore.getState().tracks[0].url).toBe('m-rumeur');
    });
});
