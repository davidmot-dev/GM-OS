import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * **Arrêter une piste rend la lumière de la DERNIÈRE ALLUMÉE.**
 *
 * Défaut A7 du § 12e, corrigé le 2026-09-04. Le code prenait le dernier élément
 * d'un tableau ordonné par **numéro de piste** : arrêter une piste rendait donc
 * la lumière de celle qui portait le numéro le plus élevé, et pas de celle
 * qu'on venait d'allumer. En séance, la salle repassait à la couleur d'une
 * ambiance qu'on avait quittée dix minutes plus tôt.
 */

const hue = { applyScene: vi.fn(), revertToManualScene: vi.fn() };

vi.mock('../light/HueEngine', () => ({ hueEngine: hue }));
vi.mock('../light/useLightStore', () => ({ useLightStore: { getState: () => ({ isSyncEnabled: true }) } }));
vi.mock('./AmbientEngine', () => ({
    ambientEngine: {
        fadeOutAll: vi.fn(),
        resume: vi.fn(async () => {}),
        tracks: Array.from({ length: 8 }, () => ({
            load: vi.fn(async () => {}), play: vi.fn(), stop: vi.fn(), setVolume: vi.fn(),
        })),
    },
}));

const { useAmbientStore } = await import('./useAmbientStore');

/** Trois pistes allumées, avec leur instant d'allumage explicite. */
function poser(pistes: { scene: string; allumeeLe?: number }[]) {
    useAmbientStore.setState({
        tracks: useAmbientStore.getState().tracks.map((t, i) => pistes[i]
            ? { ...t, isPlaying: true, linkedLightSceneId: pistes[i].scene, allumeeLe: pistes[i].allumeeLe }
            : { ...t, isPlaying: false, linkedLightSceneId: undefined, allumeeLe: undefined }),
    });
}

beforeEach(() => vi.clearAllMocks());

describe('rendre la lumière quand une piste s’arrête', () => {
    it('rend celle allumée en DERNIER, pas celle au plus haut numéro — le défaut du 04/09', async () => {
        /* La piste 0 a été allumée après la piste 2. C'est elle qui doit revenir. */
        poser([
            { scene: 'taverne', allumeeLe: 3000 },
            { scene: 'arret', allumeeLe: 1000 },
            { scene: 'egouts', allumeeLe: 2000 },
        ]);

        await useAmbientStore.getState().handleLightReversion(1);

        expect(hue.applyScene).toHaveBeenCalledWith('taverne', true);
        expect(hue.revertToManualScene).not.toHaveBeenCalled();
    });

    it('ignore la piste qu’on vient d’arrêter', async () => {
        poser([
            { scene: 'taverne', allumeeLe: 1000 },
            { scene: 'celle-qui-part', allumeeLe: 9000 },
        ]);

        await useAmbientStore.getState().handleLightReversion(1);

        expect(hue.applyScene).toHaveBeenCalledWith('taverne', true);
    });

    it('revient à la scène manuelle quand plus rien ne joue', async () => {
        poser([{ scene: 'celle-qui-part', allumeeLe: 1000 }]);

        await useAmbientStore.getState().handleLightReversion(0);

        expect(hue.applyScene).not.toHaveBeenCalled();
        expect(hue.revertToManualScene).toHaveBeenCalled();
    });

    it('fait passer une piste sans instant derrière celles qui en ont', async () => {
        /*
          Une piste allumée avant le 04/09 n'a pas d'`allumeeLe` : elle est
          forcément plus ancienne, donc elle perd — c'est le bon ordre.
        */
        poser([
            { scene: 'ancienne' },
            { scene: 'partante', allumeeLe: 5000 },
            { scene: 'recente', allumeeLe: 4000 },
        ]);

        await useAmbientStore.getState().handleLightReversion(1);

        expect(hue.applyScene).toHaveBeenCalledWith('recente', true);
    });
});
