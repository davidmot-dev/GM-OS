import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useStoryboardStore } from './useStoryboardStore';

/**
 * **L'image d'une séquence s'éteint quand une autre prend la main.**
 *
 * *Demandé par David le 2026-08-31 :* « quand je lance une autre séquence, tu
 * dois aussi éteindre l'image en fade out de la séquence précédente ».
 *
 * Une séquence est une **parenthèse** — c'est déjà ce que dit
 * `imageAvantLeMoment` pour l'image de scène. Sans ça, un moment sans image
 * laissait à l'écran celle du moment d'avant, et le meneur devait l'éteindre à
 * la main au milieu de sa scène.
 *
 * *Le fondu, lui, vit dans les écrans* (`ProjectorView`) : ces essais gardent
 * **ce qu'on éteint et quand**, pas la façon dont ça s'estompe.
 */

const syncHubData = vi.fn();
const launchDisplay = vi.fn();
const setProjection = vi.fn();
const projectSolo = vi.fn();

const MOMENT = {
    id: 'm-1', name: 'Un', description: '', color: '#fff', icon: 'Zap', campaignId: 'c-1',
};

beforeEach(() => {
    vi.clearAllMocks();
    (window as unknown as { appBridge: unknown }).appBridge = { image: { syncHubData, launchDisplay } };
    (window as unknown as Record<string, unknown>).useImageStore = {
        getState: () => ({
            projectionTarget: 'hub',
            mediaList: [{ id: 'media-1', name: 'Rue sous la pluie' }],
            projectSolo, setProjection,
        }),
    };
    useStoryboardStore.setState({
        moments: [], activeMomentId: null, imageAvantLeMoment: null, cibleDeLImageDuMoment: null,
    });
});

afterEach(() => {
    delete (window as unknown as { appBridge?: unknown }).appBridge;
    delete (window as unknown as Record<string, unknown>).useImageStore;
});

/** Ce qu'on a demandé d'éteindre : le hub reçoit un vide, un moniteur une liste vide. */
const ecransEteints = () => [
    ...syncHubData.mock.calls.filter(([type, data]) => type === 'image' && data === '').map(() => 'hub'),
    ...launchDisplay.mock.calls.filter(([paths]) => Array.isArray(paths) && paths.length === 0).map(([, cible]) => cible),
];

describe('éteindre l’image du moment précédent', () => {
    /** **Le test qui garde la demande de David.** */
    it('éteint l’écran quand la séquence suivante n’a pas d’image', async () => {
        useStoryboardStore.setState({ moments: [
            { ...MOMENT, imageMediaId: 'media-1', imageTarget: 'moniteur-2' },
            { ...MOMENT, id: 'm-2', name: 'Deux' },
        ] });

        await useStoryboardStore.getState().triggerMoment('m-1');
        expect(ecransEteints()).toEqual([]);

        await useStoryboardStore.getState().triggerMoment('m-2');

        expect(ecransEteints()).toEqual(['moniteur-2']);
    });

    /**
     * *Éteindre d'abord ferait clignoter la table.* Quand la nouvelle séquence
     * reprend le même écran, sa propre image remplace l'autre.
     */
    it('n’éteint rien quand la suivante reprend le même écran', async () => {
        useStoryboardStore.setState({ moments: [
            { ...MOMENT, imageMediaId: 'media-1', imageTarget: 'moniteur-2' },
            { ...MOMENT, id: 'm-2', imageMediaId: 'media-1', imageTarget: 'moniteur-2' },
        ] });

        await useStoryboardStore.getState().triggerMoment('m-1');
        await useStoryboardStore.getState().triggerMoment('m-2');

        expect(ecransEteints()).toEqual([]);
        expect(projectSolo).toHaveBeenCalledTimes(2);
    });

    /**
     * *Retenir la cible coûte un champ ; la deviner coûte un écran faux en pleine
     * scène.* Un moment peut viser le hub, le suivant un moniteur.
     */
    it('éteint l’écran d’avant, et pas celui d’après', async () => {
        useStoryboardStore.setState({ moments: [
            { ...MOMENT, imageMediaId: 'media-1', imageTarget: 'moniteur-2' },
            { ...MOMENT, id: 'm-2', imageMediaId: 'media-1', imageTarget: 'hub' },
        ] });

        await useStoryboardStore.getState().triggerMoment('m-1');
        await useStoryboardStore.getState().triggerMoment('m-2');

        expect(ecransEteints()).toEqual(['moniteur-2']);
    });

    /** Sans écran choisi, l'image suit la cible d'Image-OS — et s'y éteint. */
    it('sait éteindre la cible courante d’Image-OS', async () => {
        useStoryboardStore.setState({ moments: [
            { ...MOMENT, imageMediaId: 'media-1' },
            { ...MOMENT, id: 'm-2' },
        ] });

        await useStoryboardStore.getState().triggerMoment('m-1');
        await useStoryboardStore.getState().triggerMoment('m-2');

        expect(ecransEteints()).toEqual(['hub']);
    });

    /** La parenthèse se referme aussi quand on arrête le moment. */
    it('éteint l’image quand le moment s’arrête', async () => {
        useStoryboardStore.setState({ moments: [
            { ...MOMENT, imageMediaId: 'media-1', imageTarget: 'moniteur-2' },
        ] });
        await useStoryboardStore.getState().triggerMoment('m-1');

        useStoryboardStore.getState().arreterLeMoment();
        await vi.waitFor(() => expect(ecransEteints()).toEqual(['moniteur-2']));
        expect(useStoryboardStore.getState().cibleDeLImageDuMoment).toBeNull();
    });

    /** Un média introuvable n'a rien posé : ne pas laisser une trace qui ment. */
    it('ne retient rien quand le média est introuvable', async () => {
        useStoryboardStore.setState({ moments: [
            { ...MOMENT, imageMediaId: 'media-fantome', imageTarget: 'moniteur-2' },
        ] });

        await useStoryboardStore.getState().triggerMoment('m-1');

        expect(useStoryboardStore.getState().cibleDeLImageDuMoment).toBeNull();
    });
});
