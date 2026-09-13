import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useStoryboardStore } from './useStoryboardStore';
import { imageOuDiaporama, occupeUnEcran } from './imageOuDiaporama';

/**
 * **Un moment de storyboard appelle un diaporama.**
 *
 * *Demandé par David le 2026-09-13 : « je veux pouvoir appeler ce diaporama
 * après dans un Storyboard ».*
 *
 * Ce que ces essais gardent en propre — et qu'aucun essai d'Image-OS ne peut
 * garder : **qu'un diaporama laissé par le moment précédent soit ARRÊTÉ**, et
 * pas seulement éteint. *Éteindre un écran ne touche pas à son horloge : elle
 * le rallumerait six secondes plus tard, par-dessus le moment suivant.*
 */

const lancerLeDiaporama = vi.fn();
const arreterLeDiaporama = vi.fn();
const projectSolo = vi.fn();
const setProjection = vi.fn();

const MOMENT = {
    id: 'm-1', name: 'Un', description: '', color: '#fff', icon: 'Zap', campaignId: 'c-1',
};

/** L'état d'Image-OS que le storyboard interroge, avec un diaporama qui tourne ou non. */
const poserImageOS = (diaporamaEnCours: { id: string; index: number; cible: string } | null) => {
    (window as unknown as Record<string, unknown>).useImageStore = {
        getState: () => ({
            projectionTarget: 'hub',
            mediaList: [{ id: 'media-1', name: 'Rue sous la pluie' }],
            diaporamas: [{ id: 'd-1', nom: 'Le voyage', imageIds: ['a', 'b'] }],
            diaporamaEnCours,
            lancerLeDiaporama, arreterLeDiaporama, projectSolo, setProjection,
        }),
    };
};

beforeEach(() => {
    vi.clearAllMocks();
    (window as unknown as { appBridge: unknown }).appBridge = {
        image: { syncHubData: vi.fn(), launchDisplay: vi.fn() },
    };
    poserImageOS(null);
    useStoryboardStore.setState({
        moments: [], activeMomentId: null, imageAvantLeMoment: null, cibleDeLImageDuMoment: null,
    });
});

afterEach(() => {
    delete (window as unknown as { appBridge?: unknown }).appBridge;
    delete (window as unknown as Record<string, unknown>).useImageStore;
});

describe('ce qu’un moment pose à l’écran', () => {
    it('rien, quand il ne porte ni image ni diaporama', () => {
        expect(imageOuDiaporama({})).toEqual({ quoi: 'rien' });
        expect(occupeUnEcran({})).toBe(false);
    });

    it('une image', () => {
        expect(imageOuDiaporama({ imageMediaId: 'media-1' }))
            .toEqual({ quoi: 'image', mediaId: 'media-1' });
    });

    it('un diaporama', () => {
        expect(imageOuDiaporama({ diaporamaId: 'd-1' }))
            .toEqual({ quoi: 'diaporama', diaporamaId: 'd-1' });
    });

    /**
     * ⚠️ L'écran d'édition n'en laisse choisir qu'un, *mais un écran qui
     * interdit quelque chose ne l'empêche que chez lui* : un import Nexus ou un
     * fichier modifié à la main peut porter les deux. **Le plus récent gagne.**
     */
    it('le diaporama l’emporte quand un moment porte les deux', () => {
        expect(imageOuDiaporama({ imageMediaId: 'media-1', diaporamaId: 'd-1' }))
            .toEqual({ quoi: 'diaporama', diaporamaId: 'd-1' });
    });

    it('et un moment qui porte un diaporama occupe bien un écran', () => {
        expect(occupeUnEcran({ diaporamaId: 'd-1' })).toBe(true);
    });
});

describe('déclencher un moment qui porte un diaporama', () => {
    it('le lance sur l’écran du moment', async () => {
        useStoryboardStore.setState({ moments: [
            { ...MOMENT, diaporamaId: 'd-1', imageTarget: 'moniteur-2' },
        ] });

        await useStoryboardStore.getState().triggerMoment('m-1');

        expect(lancerLeDiaporama).toHaveBeenCalledWith('d-1', 'moniteur-2');
    });

    it('ne projette aucune image en plus', async () => {
        useStoryboardStore.setState({ moments: [{ ...MOMENT, diaporamaId: 'd-1' }] });

        await useStoryboardStore.getState().triggerMoment('m-1');

        expect(projectSolo).not.toHaveBeenCalled();
    });

    it('dit « introuvable » quand le diaporama a été supprimé', async () => {
        useStoryboardStore.setState({ moments: [{ ...MOMENT, diaporamaId: 'd-disparu' }] });

        await useStoryboardStore.getState().triggerMoment('m-1');

        expect(lancerLeDiaporama).not.toHaveBeenCalled();
    });
});

describe('ce que le moment suivant fait du diaporama en cours', () => {
    /**
     * ⛔ **Le défaut qu'on ne verrait qu'à la table.** Un fondu au noir qui se
     * rallume tout seul six secondes plus tard, par-dessus la scène suivante.
     */
    it('l’arrête quand le moment suivant ne porte pas de diaporama', async () => {
        poserImageOS({ id: 'd-1', index: 2, cible: 'hub' });
        useStoryboardStore.setState({ moments: [{ ...MOMENT, id: 'm-2', name: 'Deux' }] });

        await useStoryboardStore.getState().triggerMoment('m-2');

        expect(arreterLeDiaporama).toHaveBeenCalled();
    });

    it('l’arrête aussi quand le suivant en appelle un autre', async () => {
        poserImageOS({ id: 'd-1', index: 2, cible: 'hub' });
        useStoryboardStore.setState({ moments: [{ ...MOMENT, id: 'm-2', diaporamaId: 'd-autre' }] });

        await useStoryboardStore.getState().triggerMoment('m-2');

        expect(arreterLeDiaporama).toHaveBeenCalled();
    });

    /**
     * *Le relancer le ferait repartir de sa première image*, alors que le meneur
     * ne fait qu'enchaîner deux moments sur la même ambiance visuelle.
     */
    it('le laisse tourner quand le suivant rappelle le même', async () => {
        poserImageOS({ id: 'd-1', index: 2, cible: 'hub' });
        useStoryboardStore.setState({ moments: [{ ...MOMENT, id: 'm-2', diaporamaId: 'd-1' }] });

        await useStoryboardStore.getState().triggerMoment('m-2');

        expect(arreterLeDiaporama).not.toHaveBeenCalled();
        expect(lancerLeDiaporama).not.toHaveBeenCalled();
    });
});

describe('arrêter le moment', () => {
    it('arrête le diaporama qu’il avait lancé', () => {
        poserImageOS({ id: 'd-1', index: 1, cible: 'moniteur-2' });
        useStoryboardStore.setState({
            moments: [{ ...MOMENT, diaporamaId: 'd-1', imageTarget: 'moniteur-2' }],
            activeMomentId: 'm-1',
            cibleDeLImageDuMoment: 'moniteur-2',
        });

        useStoryboardStore.getState().arreterLeMoment();

        expect(arreterLeDiaporama).toHaveBeenCalled();
    });
});
