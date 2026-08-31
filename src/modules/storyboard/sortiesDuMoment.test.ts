import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useStoryboardStore } from './useStoryboardStore';

/**
 * **Un moment choisit où ça sort — demandé par David le 2026-08-31.**
 *
 * *« Dans une séquence de storyboard, est-ce qu'on peut choisir sur quelle sortie
 * une musique, un son, une ambiance doit être jouée ? Même chose pour la
 * projection d'image, sur quel écran je la projette. »*
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QUE CES ESSAIS GARDENT, ET CE QU'ILS NE PEUVENT PAS VOIR
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Ils vérifient que le moment **transmet** sa sortie à chaque moteur, et que
 * l'absence de réglage se transmet aussi — c'est-à-dire que rien ne change pour
 * les moments écrits avant. *Le premier défaut possible d'un champ facultatif
 * n'est pas qu'il soit mal lu : c'est qu'il ne soit pas lu du tout.*
 *
 * Ce qu'aucun essai ne dira, et qui se joue à la table : que le son sorte
 * vraiment de la bonne enceinte. `setSinkId` n'existe pas sous jsdom.
 */

const playPad = vi.fn(async () => undefined);
const applyScene = vi.fn(async () => undefined);
const play = vi.fn();
const loadAudio = vi.fn(async () => undefined);
const projectSolo = vi.fn();

const MOMENT = {
    id: 'moment-1',
    name: 'Descente au Bradbury',
    description: '',
    color: '#fff',
    icon: 'Zap',
    campaignId: 'c-1',
    musicPadId: 'pad-musique',
    soundPadId: 'pad-son',
    ambientSceneId: 'scene-ambiance',
    imageMediaId: 'media-1',
};

beforeEach(() => {
    vi.clearAllMocks();
    const g = window as unknown as Record<string, unknown>;
    g.useMusicStore = { getState: () => ({
        playlists: [{ id: 'pl', pads: [{ id: 'pad-musique', label: 'Pluie acide' }] }],
        playPad,
    }) };
    g.useSoundStore = { getState: () => ({
        activeAtmosphereId: 'atmo',
        atmospheres: [{ id: 'atmo', pads: { 'pad-son': { id: 'pad-son', title: 'Tonnerre', filePath: 'x.wav', volume: 0.8 } } }],
        setPadActive: vi.fn(),
    }) };
    g.soundEngine = { loadAudio, play };
    g.useAmbientStore = { getState: () => ({ applyScene }) };
    g.useImageStore = { getState: () => ({
        mediaList: [{ id: 'media-1', name: 'Rue sous la pluie' }],
        projectSolo,
    }) };
    useStoryboardStore.setState({ moments: [], activeMomentId: null, imageAvantLeMoment: null });
});

afterEach(() => {
    const g = window as unknown as Record<string, unknown>;
    for (const cle of ['useMusicStore', 'useSoundStore', 'soundEngine', 'useAmbientStore', 'useImageStore']) {
        delete g[cle];
    }
});

describe('un moment qui choisit ses sorties', () => {
    it('envoie chaque son sur l’enceinte demandée, et l’image sur son écran', async () => {
        useStoryboardStore.setState({ moments: [{
            ...MOMENT,
            musicOutputId: 'enceintes-de-la-table',
            soundOutputId: 'caisson-sous-la-table',
            ambientOutputId: 'enceintes-du-fond',
            imageTarget: 'moniteur-2',
        }] });

        await useStoryboardStore.getState().triggerMoment('moment-1');

        expect(playPad).toHaveBeenCalledWith(expect.objectContaining({ id: 'pad-musique' }), 'enceintes-de-la-table');
        expect(play).toHaveBeenCalledWith('pad-son', 0.8, undefined, 'caisson-sous-la-table');
        expect(applyScene).toHaveBeenCalledWith('scene-ambiance', 'enceintes-du-fond');
        expect(projectSolo).toHaveBeenCalledWith(expect.objectContaining({ id: 'media-1' }), 'moniteur-2');
    });

    /**
     * **Le point qui rend l'ajout sans risque.** Un moment écrit avant ce jour ne
     * porte aucune sortie : chaque module doit alors jouer là où il jouait, et
     * l'image partir sur la cible choisie dans Image-OS.
     */
    it('ne demande rien quand le moment ne choisit pas', async () => {
        useStoryboardStore.setState({ moments: [MOMENT] });

        await useStoryboardStore.getState().triggerMoment('moment-1');

        expect(playPad).toHaveBeenCalledWith(expect.objectContaining({ id: 'pad-musique' }), undefined);
        expect(play).toHaveBeenCalledWith('pad-son', 0.8, undefined, undefined);
        expect(applyScene).toHaveBeenCalledWith('scene-ambiance', undefined);
        expect(projectSolo).toHaveBeenCalledWith(expect.objectContaining({ id: 'media-1' }), undefined);
    });

    /** Les sorties se règlent une par une : trois d'entre elles peuvent rester vides. */
    it('accepte qu’une seule sortie soit choisie', async () => {
        useStoryboardStore.setState({ moments: [{ ...MOMENT, soundOutputId: 'caisson-sous-la-table' }] });

        await useStoryboardStore.getState().triggerMoment('moment-1');

        expect(play).toHaveBeenCalledWith('pad-son', 0.8, undefined, 'caisson-sous-la-table');
        expect(playPad).toHaveBeenCalledWith(expect.anything(), undefined);
    });
});
