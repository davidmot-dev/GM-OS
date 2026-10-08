import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ImageService } from './ImageService';
import { useImageStore } from '../useImageStore';
import { useMediaStore, type MediaItem } from '../../../stores/useMediaStore';
import { resolveToSendableUrl } from '../../../utils/mediaResolver';
import { exposerMagasinDuHub } from '../../../utils/magasinsDuHub';
import type { DisplayInfo, ImageBridge } from '../types';

vi.mock('../../../utils/mediaResolver', () => ({ resolveToSendableUrl: vi.fn() }));
const etatInitial = useImageStore.getState();
const mediasInitiaux = useMediaStore.getState();
const ecran: DisplayInfo = { id: 'moniteur-2', label: 'Moniteur 2', bounds: { x: 0, y: 0, width: 800, height: 600 } };
const film: MediaItem = { id: 'm-film', name: 'Film.webm', type: 'video', size: 1, createdAt: 0, tags: [], campaignIds: [], boucler: false };
const lancer = vi.fn<ImageBridge['launchDisplay']>();
const synchroniser = vi.fn<ImageBridge['syncHubData']>();

beforeEach(() => {
    vi.clearAllMocks(); vi.spyOn(console, 'error').mockImplementation(() => {});
    useImageStore.setState({ projectionTarget: 'hub', projections: {}, displays: [ecran], imagePrecedente: {} });
    useMediaStore.setState({ mediaList: [] }); exposerMagasinDuHub('useImageStore', useImageStore);
    const image: Pick<ImageBridge, 'launchDisplay' | 'syncHubData'> = { launchDisplay: lancer, syncHubData: synchroniser };
    (window as unknown as { appBridge: unknown }).appBridge = { image };
    vi.mocked(resolveToSendableUrl).mockResolvedValue('https://exemple.invalid/image.png');
});
afterEach(() => {
    useImageStore.setState(etatInitial, true); useMediaStore.setState(mediasInitiaux, true);
    exposerMagasinDuHub('useImageStore', useImageStore); vi.restoreAllMocks();
    delete (window as unknown as { appBridge?: unknown }).appBridge;
});

describe('projeter par le service avec le contrat du magasin', () => {
    it('envoie le chemin brut au moniteur et retient l’identité de la fiche', async () => {
        expect(await ImageService.projectMedia('m-portrait', ecran.id, 'pnj-1')).toBe('m-portrait');
        expect(lancer).toHaveBeenCalledWith(['m-portrait'], ecran.id);
        expect(resolveToSendableUrl).not.toHaveBeenCalled(); expect(synchroniser).not.toHaveBeenCalled();
        expect(useImageStore.getState().projections[ecran.id]).toBe('pnj-1');
    });
    it('refuse un écran absent du recensement sans modifier l’occupation', async () => {
        useImageStore.setState({ projections: { absent: 'decor' } });
        expect(await ImageService.projectMedia('m-image', 'absent')).toBeNull();
        expect(lancer).not.toHaveBeenCalled(); expect(useImageStore.getState().projections.absent).toBe('decor');
    });
    it('autorise le moniteur tant que le recensement est inconnu', async () => {
        useImageStore.setState({ displays: [] });
        expect(await ImageService.projectMedia('m-image', 'pas-encore-recense')).toBe('m-image');
        expect(lancer).toHaveBeenCalledWith(['m-image'], 'pas-encore-recense');
    });
    it.each(['__whiteboard__', '__tactical_map__', '__youtube__dQw4w9WgXcQ'])('transmet le marqueur %s sans le résoudre', async marqueur => {
        expect(await ImageService.projectMedia(marqueur, 'hub')).toBe(marqueur);
        expect(synchroniser).toHaveBeenCalledWith('image', marqueur); expect(resolveToSendableUrl).not.toHaveBeenCalled();
        expect(useImageStore.getState().projections.hub).toBe(marqueur);
    });
    it('envoie l’image résolue au Hub mais conserve la marque de la fiche', async () => {
        expect(await ImageService.projectMedia('m-portrait', 'hub', 'pnj-1')).toBe('https://exemple.invalid/image.png');
        expect(resolveToSendableUrl).toHaveBeenCalledWith('m-portrait'); expect(lancer).not.toHaveBeenCalled();
        expect(synchroniser).toHaveBeenCalledWith('image', 'https://exemple.invalid/image.png');
        expect(useImageStore.getState().projections.hub).toBe('pnj-1');
    });
    it.each([false, undefined])('envoie la boucle %s avant l’adresse vidéo', async boucler => {
        useMediaStore.setState({ mediaList: [{ ...film, boucler }] });
        await ImageService.projectMedia('m-film', 'hub');
        expect(synchroniser.mock.calls).toEqual([
            ['video-boucle', boucler === false ? '0' : '1'], ['video', 'https://exemple.invalid/image.png'],
        ]);
    });
    it('une adresse non résolue ne remplace pas la projection', async () => {
        useImageStore.setState({ projections: { hub: 'decor' } }); vi.mocked(resolveToSendableUrl).mockResolvedValue('');
        expect(await ImageService.projectMedia('m-manquant', 'hub')).toBeNull();
        expect(synchroniser).not.toHaveBeenCalled(); expect(useImageStore.getState().projections.hub).toBe('decor');
    });
    it('une erreur de résolution reste un échec de projection', async () => {
        vi.mocked(resolveToSendableUrl).mockRejectedValue(new Error('lecture impossible'));
        expect(await ImageService.projectMedia('m-manquant', 'hub')).toBeNull(); expect(synchroniser).not.toHaveBeenCalled();
    });
    it('relit la cible courante pour le portrait d’une entité', async () => {
        await ImageService.projectEntity('m-portrait', 'Rachael', 'pnj-1');
        useImageStore.setState({ projectionTarget: ecran.id });
        await ImageService.projectEntity('m-portrait', 'Rachael', 'pnj-1');
        expect(lancer).toHaveBeenLastCalledWith(['m-portrait'], ecran.id);
        expect(useImageStore.getState().projections).toEqual({ hub: 'pnj-1', [ecran.id]: 'pnj-1' });
    });
    it('sans portrait, aucun ordre ne part', async () => {
        expect(await ImageService.projectEntity(undefined, 'Sans visage')).toBeNull();
        expect(lancer).not.toHaveBeenCalled(); expect(synchroniser).not.toHaveBeenCalled();
    });
});

describe('éteindre par le service', () => {
    it('éteint le Hub sans fermer un moniteur', async () => {
        useImageStore.setState({ projections: { hub: 'decor', [ecran.id]: 'autre' } }); await ImageService.blackout();
        expect(synchroniser).toHaveBeenCalledWith('image', ''); expect(lancer).not.toHaveBeenCalled();
        expect(useImageStore.getState().projections).toEqual({ hub: null, [ecran.id]: 'autre' });
    });
    it('ferme le moniteur demandé sans éteindre le Hub', async () => {
        useImageStore.setState({ projections: { hub: 'decor', [ecran.id]: 'autre' } }); await ImageService.blackout(ecran.id);
        expect(lancer).toHaveBeenCalledWith([], ecran.id); expect(synchroniser).not.toHaveBeenCalled();
        expect(useImageStore.getState().projections).toEqual({ hub: 'decor', [ecran.id]: null });
    });
    it('éteint toutes les cibles données', async () => {
        useImageStore.setState({ projections: { hub: 'decor', [ecran.id]: 'autre' } }); await ImageService.blackoutAll(['hub', ecran.id]);
        expect(synchroniser).toHaveBeenCalledOnce(); expect(lancer).toHaveBeenCalledWith([], ecran.id);
        expect(useImageStore.getState().projections).toEqual({ hub: null, [ecran.id]: null });
    });
    it('signale explicitement le magasin absent avant un ordre d’extinction', async () => {
        delete (window as unknown as { useImageStore?: unknown }).useImageStore;
        await expect(ImageService.blackout()).rejects.toThrow('Magasin des images indisponible');
        expect(lancer).not.toHaveBeenCalled(); expect(synchroniser).not.toHaveBeenCalled();
    });
});
