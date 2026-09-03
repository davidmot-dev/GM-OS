import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useStoryboardStore } from './useStoryboardStore';
import {
    AUCUN_SON, cequUnArretEteint, cequUnePriseDeMainEteint, lesSonsAnnoncesPar,
} from './sonsDuMoment';

/**
 * **Ce qu'une séquence laisse sonner derrière elle.**
 *
 * *Défaut trouvé par David le 2026-09-02 : « quand je passe d'une séquence à
 * l'autre, l'ancienne ambiance ne s'arrête pas ».*
 *
 * Ces essais gardent les deux moitiés de la réponse : **ce qu'on coupe**, et
 * surtout **ce qu'on ne coupe pas**. La seconde est la plus fragile — couper
 * trop large ne se voit pas en relisant le code, ça s'entend à la table quand la
 * pluie que le meneur avait lancée à la main s'arrête toute seule.
 */

const playPad = vi.fn(async () => undefined);
const stopDeck = vi.fn();
const applyScene = vi.fn(async () => undefined);
const play = vi.fn();
const stop = vi.fn();
const loadAudio = vi.fn(async () => undefined);
const setPadActive = vi.fn();
const toggleTrack = vi.fn(async () => undefined);

/** Une séquence complète : musique, bruitage, ambiance. */
const AVEC_TOUT = {
    id: 'moment-1',
    name: 'Descente au Bradbury',
    description: '',
    color: '#fff',
    icon: 'Zap',
    campaignId: 'c-1',
    musicPadId: 'pad-musique',
    soundPadId: 'pad-son',
    ambientSceneId: 'scene-pluie',
};

/** La séquence qui suit, et qui ne porte aucun son : c'est le cas de David. */
const SANS_RIEN = {
    ...AVEC_TOUT, id: 'moment-2', name: 'Le silence du couloir',
    musicPadId: undefined, soundPadId: undefined, ambientSceneId: undefined,
};

/** Trois pistes qui tournent, dont deux allumées par la scène « pluie ». */
const pistes = () => [
    { id: 'track-0', isPlaying: true, url: 'pluie.wav' },
    { id: 'track-1', isPlaying: true, url: 'vent.wav' },
    { id: 'track-2', isPlaying: true, url: 'taverne.wav' },
];

beforeEach(() => {
    vi.clearAllMocks();
    const g = window as unknown as Record<string, unknown>;
    g.useMusicStore = { getState: () => ({
        playlists: [{ id: 'pl', pads: [
            { id: 'pad-musique', label: 'Pluie acide' },
            { id: 'pad-musique-2', label: 'Tyrell' },
        ] }],
        deckA: { activePadId: 'pad-musique' },
        deckB: { activePadId: null },
        playPad, stopDeck,
    }) };
    g.useSoundStore = { getState: () => ({
        activeAtmosphereId: 'atmo',
        atmospheres: [{ id: 'atmo', pads: {
            'pad-son': { id: 'pad-son', title: 'Tonnerre', filePath: 'x.wav', volume: 0.8 },
        } }],
        setPadActive,
    }) };
    g.soundEngine = { loadAudio, play, stop };
    g.useAmbientStore = { getState: () => ({
        applyScene, toggleTrack,
        tracks: pistes(),
        scenes: [
            { id: 'scene-pluie', activeTracks: [true, true, false] },
            { id: 'scene-metro', activeTracks: [false, false, true] },
        ],
    }) };
    useStoryboardStore.setState({
        moments: [AVEC_TOUT, SANS_RIEN], activeMomentId: null,
        imageAvantLeMoment: null, cibleDeLImageDuMoment: null, sonsDuMoment: null,
    });
});

afterEach(() => {
    const g = window as unknown as Record<string, unknown>;
    for (const cle of ['useMusicStore', 'useSoundStore', 'soundEngine', 'useAmbientStore']) {
        delete g[cle];
    }
    useStoryboardStore.setState({ sonsDuMoment: null, activeMomentId: null });
});

describe('ce qu’une prise de main éteint', () => {
    it('coupe tout ce que la précédente a posé quand la nouvelle n’apporte rien', () => {
        const precedent = { musicPadId: 'p', soundPadId: 's', ambientSceneId: 'a' };

        expect(cequUnePriseDeMainEteint(precedent, AUCUN_SON)).toEqual(precedent);
    });

    /**
     * **La platine se relaie elle-même**, en fondu croisé : la couper d'abord
     * ferait un trou dans le son. Même chose pour Ambient-OS, dont `applyScene`
     * éteint déjà les pistes que sa scène n'allume pas.
     */
    it('laisse la musique et l’ambiance à la séquence qui les reprend', () => {
        const precedent = { musicPadId: 'p', soundPadId: 's', ambientSceneId: 'a' };

        const aEteindre = cequUnePriseDeMainEteint(precedent, lesSonsAnnoncesPar({
            musicPadId: 'autre-musique', ambientSceneId: 'autre-scene',
        }));

        expect(aEteindre).toEqual({ musicPadId: null, soundPadId: 's', ambientSceneId: null });
    });

    /** Sound-OS **empile** : un autre bruitage ne remplace pas celui d'avant. */
    it('coupe toujours le bruitage, même remplacé', () => {
        const aEteindre = cequUnePriseDeMainEteint(
            { musicPadId: null, soundPadId: 's', ambientSceneId: null },
            lesSonsAnnoncesPar({ soundPadId: 'un-autre' }));

        expect(aEteindre.soundPadId).toBe('s');
    });

    it('n’a rien à couper quand aucune séquence ne tournait', () => {
        expect(cequUnePriseDeMainEteint(null, AUCUN_SON)).toEqual(AUCUN_SON);
    });

    /** Décision de David : arrêter un moment ne fait pas tomber le silence. */
    it('garde la musique quand le meneur arrête le moment', () => {
        const aEteindre = cequUnArretEteint({ musicPadId: 'p', soundPadId: 's', ambientSceneId: 'a' });

        expect(aEteindre).toEqual({ musicPadId: null, soundPadId: 's', ambientSceneId: 'a' });
    });
});

describe('une séquence qui prend la main sur une autre', () => {
    it('éteint l’ambiance de la précédente quand elle n’en porte pas', async () => {
        await useStoryboardStore.getState().triggerMoment('moment-1');
        toggleTrack.mockClear();

        await useStoryboardStore.getState().triggerMoment('moment-2');

        // Les deux pistes que « scene-pluie » avait allumées, et elles seules :
        // la piste 2 tourne aussi, mais c'est le meneur qui l'a lancée.
        expect(toggleTrack).toHaveBeenCalledTimes(2);
        expect(toggleTrack).toHaveBeenCalledWith(0);
        expect(toggleTrack).toHaveBeenCalledWith(1);
        expect(toggleTrack).not.toHaveBeenCalledWith(2);
    });

    it('arrête le bruitage et la musique de la précédente', async () => {
        await useStoryboardStore.getState().triggerMoment('moment-1');

        await useStoryboardStore.getState().triggerMoment('moment-2');

        expect(stop).toHaveBeenCalledWith('pad-son');
        expect(setPadActive).toHaveBeenCalledWith('pad-son', false);
        expect(stopDeck).toHaveBeenCalledWith('A');
    });

    /**
     * Le cas qui marchait déjà, et qu'il ne faut pas casser : deux séquences qui
     * portent chacune leur ambiance se relaient dans Ambient-OS.
     */
    it('ne touche à rien quand la nouvelle séquence apporte les siens', async () => {
        useStoryboardStore.setState({ moments: [
            AVEC_TOUT,
            { ...AVEC_TOUT, id: 'moment-3', musicPadId: 'pad-musique-2', ambientSceneId: 'scene-metro' },
        ] });
        await useStoryboardStore.getState().triggerMoment('moment-1');
        toggleTrack.mockClear();
        stopDeck.mockClear();

        await useStoryboardStore.getState().triggerMoment('moment-3');

        expect(toggleTrack).not.toHaveBeenCalled();
        expect(stopDeck).not.toHaveBeenCalled();
        expect(applyScene).toHaveBeenCalledWith('scene-metro', undefined);
    });

    /**
     * **On n'éteint que ce qui sonne encore.** Si le meneur a changé de morceau à
     * la main, la séquence n'a plus rien à couper sur la platine — et lui
     * arracher sa musique serait le pire moment pour le faire.
     */
    it('ne coupe pas une platine qui joue autre chose depuis', async () => {
        await useStoryboardStore.getState().triggerMoment('moment-1');
        const g = window as unknown as Record<string, unknown>;
        g.useMusicStore = { getState: () => ({
            playlists: [], deckA: { activePadId: 'choisi-a-la-main' }, deckB: { activePadId: null },
            playPad, stopDeck,
        }) };

        await useStoryboardStore.getState().triggerMoment('moment-2');

        expect(stopDeck).not.toHaveBeenCalled();
    });

    /** Une musique introuvable ne doit rien laisser dans la trace. */
    it('ne retient que ce qui a vraiment été posé', async () => {
        useStoryboardStore.setState({ moments: [
            { ...AVEC_TOUT, id: 'moment-4', musicPadId: 'pad-fantome' }, SANS_RIEN,
        ] });

        await useStoryboardStore.getState().triggerMoment('moment-4');

        expect(useStoryboardStore.getState().sonsDuMoment).toEqual({
            musicPadId: null, soundPadId: 'pad-son', ambientSceneId: 'scene-pluie',
        });
    });
});

describe('le moment qu’on arrête', () => {
    it('referme la parenthèse sonore, la musique exceptée', async () => {
        await useStoryboardStore.getState().triggerMoment('moment-1');
        stopDeck.mockClear();

        useStoryboardStore.getState().arreterLeMoment();
        await vi.waitFor(() => expect(toggleTrack).toHaveBeenCalled());

        expect(stop).toHaveBeenCalledWith('pad-son');
        expect(toggleTrack).toHaveBeenCalledWith(0);
        expect(stopDeck).not.toHaveBeenCalled();
        expect(useStoryboardStore.getState().sonsDuMoment).toBeNull();
    });
});
