import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { DrawingPath } from '../../whiteboard/useWhiteboardStore';

// 08/10/2026, David : regrouper les any sans perdre en qualité. Les vrais
// handlers restent en place ; seuls les magasins et sorties sont simulés.
const sorties = vi.hoisted(() => ({
    son: vi.fn(), volume: vi.fn(), ping: vi.fn(), moment: vi.fn(),
    musique: vi.fn(), image: vi.fn(), ambiance: vi.fn(), trace: vi.fn(),
    playlists: [] as { pads: { id: string; label: string }[] }[],
    atmospheres: [] as { id: string; pads: Record<string, object> }[],
    images: [] as { id: string; name: string }[],
    presets: [] as { id: string; name: string; universe: string }[],
    moments: [] as { id: string; campaignId: string }[],
}));
vi.mock('../../sound/SoundController', () => ({ soundController: { togglePad: sorties.son } }));
vi.mock('../../sound/useSoundStore', () => ({ useSoundStore: { getState: () => ({
    atmospheres: sorties.atmospheres, activeAtmosphereId: 'sons', setMasterVolume: sorties.volume,
}) } }));
vi.mock('../../music/useMusicStore', () => ({ useMusicStore: { getState: () => ({
    playlists: sorties.playlists, playPad: sorties.musique,
}) } }));
vi.mock('../../map/useMapStore', () => ({ useMapStore: { getState: () => ({ addPing: sorties.ping }) } }));
vi.mock('../../storyboard/useStoryboardStore', () => ({ useStoryboardStore: { getState: () => ({
    moments: sorties.moments, triggerMoment: sorties.moment,
}) } }));
vi.mock('../../image/useImageStore', () => ({ useImageStore: { getState: () => ({
    mediaList: sorties.images, projectSolo: sorties.image,
}) } }));
vi.mock('../../ambient/useAmbientStore', () => ({ useAmbientStore: { getState: () => ({
    presets: sorties.presets, lancerLeTheme: sorties.ambiance,
}) } }));
vi.mock('../../whiteboard/useWhiteboardStore', () => ({ useWhiteboardStore: { getState: () => ({
    addPath: sorties.trace,
}) } }));

const { audioActions } = await import('./audioActions');
const { sceneActions } = await import('./sceneActions');
const { whiteboardActions } = await import('./whiteboardActions');
const contexte = { activeCampaignId: 'campagne', sync: vi.fn() };

beforeEach(() => {
    vi.clearAllMocks();
    sorties.playlists = [{ pads: [{ id: 'commun', label: 'Pluie' }] }];
    sorties.atmospheres = [{ id: 'sons', pads: { commun: {} } }];
    sorties.images = [{ id: 'commun', name: 'Carte' }];
    sorties.presets = [{ id: 'commun', name: 'Forêt', universe: 'fantasy' }];
    sorties.moments = [
        { id: 'ailleurs', campaignId: 'autre' },
        { id: 'premier', campaignId: 'campagne' },
        { id: 'deuxieme', campaignId: 'campagne' },
    ];
});

describe('les commandes reçues gardent leur destination', () => {
    it('les alias continuent de partager leurs handlers', () => {
        expect(audioActions['sound:trigger']).toBe(audioActions['remote:sound:trigger']);
        expect(audioActions['sound:volume']).toBe(audioActions['remote:sound:volume']);
        expect(sceneActions['map:ping']).toBe(sceneActions['remote:map:ping']);
        expect(sceneActions['storyboard:trigger']).toBe(sceneActions['remote:story:trigger']);
        expect(sceneActions['universal:trigger']).toBe(sceneActions['remote:pad:trigger']);
        expect(whiteboardActions['whiteboard:draw']).toBe(whiteboardActions['whiteboard:add-path']);
    });

    it.each([
        [{ id: 'prioritaire', padId: 'secondaire' }, 'prioritaire'],
        [{ padId: 'ancien' }, 'ancien'],
    ] as const)('le bruitage accepte les deux formes historiques (%j)', async (charge, id) => {
        audioActions['remote:sound:trigger'](charge, contexte);
        await vi.waitFor(() => expect(sorties.son).toHaveBeenCalledWith(id));
        expect(sorties.son).toHaveBeenCalledTimes(1);
    });

    it.each([null, {}, { id: '', padId: '' }])('un bruitage sans identifiant ne déclenche rien (%j)', charge => {
        audioActions['sound:trigger'](charge, contexte);
        expect(sorties.son).not.toHaveBeenCalled();
    });

    it.each([0, 0.5, 1.5])('le volume %s rejoint le magasin sans nouveau bornage', volume => {
        audioActions['remote:sound:volume']({ volume }, contexte);
        expect(sorties.volume).toHaveBeenCalledExactlyOnceWith(volume);
    });

    it('transmet les coordonnées et la couleur du ping, y compris zéro', () => {
        sceneActions['remote:map:ping']({ x: 0, y: 0, color: '#ffffff' }, contexte);
        expect(sorties.ping).toHaveBeenCalledExactlyOnceWith(0, 0, '#ffffff');
        expect(contexte.sync).not.toHaveBeenCalled();
    });

    it('garde la couleur de repli du ping', () => {
        sceneActions['map:ping']({ x: 7, y: 9 }, contexte);
        expect(sorties.ping).toHaveBeenCalledExactlyOnceWith(7, 9, '#06b6d4');
    });

    it('l’index du moment reste limité à la campagne active', () => {
        sceneActions['remote:story:trigger']({ index: 1 }, contexte);
        expect(sorties.moment).toHaveBeenCalledExactlyOnceWith('deuxieme');
    });

    it('un index de moment inconnu ne déclenche rien', () => {
        sceneActions['storyboard:trigger']({ index: 20 }, contexte);
        expect(sorties.moment).not.toHaveBeenCalled();
    });

    it.each(['musique', 'son', 'image', 'ambiance'] as const)(
        'le pad universel respecte l’ordre de recherche jusqu’à %s', async domaine => {
            if (domaine !== 'musique') sorties.playlists = [];
            if (domaine === 'image' || domaine === 'ambiance') sorties.atmospheres = [];
            if (domaine === 'ambiance') sorties.images = [];

            sceneActions['remote:pad:trigger']({ id: 'commun' }, contexte);

            const attendue = sorties[domaine];
            await vi.waitFor(() => expect(attendue).toHaveBeenCalledTimes(1));
            for (const autre of ['musique', 'son', 'image', 'ambiance'] as const) {
                if (autre !== domaine) expect(sorties[autre]).not.toHaveBeenCalled();
            }
            if (domaine === 'musique') expect(attendue).toHaveBeenCalledWith(sorties.playlists[0].pads[0]);
            if (domaine === 'son') expect(attendue).toHaveBeenCalledWith('commun');
            if (domaine === 'image') expect(attendue).toHaveBeenCalledWith(sorties.images[0]);
            if (domaine === 'ambiance') expect(attendue).toHaveBeenCalledWith('fantasy', 'Forêt');
        },
    );

    it('un pad inconnu ne sollicite aucune sortie', () => {
        sceneActions['universal:trigger']({ id: 'inconnu' }, contexte);
        for (const domaine of ['musique', 'son', 'image', 'ambiance'] as const) {
            expect(sorties[domaine]).not.toHaveBeenCalled();
        }
    });

    it('le dessin transmet le même tracé complet, sans reconstruction', () => {
        const trace: DrawingPath = { id: 'trace', points: [{ x: 0, y: 12 }, { x: 9, y: 4 }],
            color: '#ffffff', width: 3, tool: 'regle', label: '9 mètres', isTemporary: false };
        const temoin = structuredClone(trace);
        whiteboardActions['whiteboard:draw'](trace, contexte);
        expect(sorties.trace).toHaveBeenCalledExactlyOnceWith(trace);
        expect(sorties.trace.mock.calls[0][0]).toBe(trace);
        expect(trace).toEqual(temoin);
    });
});
