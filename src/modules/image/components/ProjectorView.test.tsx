import { StrictMode, useLayoutEffect } from 'react';
import { act, cleanup, render, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ProjectorView, { FONDU_DE_LIMAGE_MS } from './ProjectorView';
import { useImageStore } from '../useImageStore';
import { useMapStore } from '../../map/useMapStore';
import { useWhiteboardStore } from '../../whiteboard/useWhiteboardStore';
import { useMediaStore, type MediaItem } from '../../../stores/useMediaStore';
import { useNatureDuMediaProjete } from '../useNatureDuMediaProjete';
import { PREFIXE_YOUTUBE } from '../../web/youtube';

// Le décodage/fondu et la résolution d'adresse ont leurs propres tests ; ici
// on pilote leur résultat pour exercer le projecteur et ses vrais magasins.
const controle = vi.hoisted(() => ({ resolutions: new Map<string, { source: string; url: string | undefined }>() }));
vi.mock('../../../hooks/useMediaUrl', () => ({
    useMediaUrlAvecSource: (source: string | undefined) => source
        ? controle.resolutions.get(source) ?? { source, url: source }
        : { source: undefined, url: undefined },
}));
vi.mock('../useFonduCroise', () => ({ useFonduCroise: (url: string | undefined) => ({ entrante: url, sortante: null }) }));
vi.mock('../../map/components/PlayerMapCanvas', () => ({ default: () => <div data-testid="carte" /> }));
vi.mock('../../whiteboard/components/PlayerDrawingCanvas', () => ({ PlayerDrawingCanvas: () => <div data-testid="tableau" /> }));
vi.mock('../../../components/TitreProjete', () => ({ TitreProjete: () => null }));
vi.mock('../../web/pilotageDuLecteurYouTube', () => ({ useNiveauDuLecteurYouTube: () => undefined }));
vi.mock('react-i18next', async importOriginal => ({
    ...await importOriginal<typeof import('react-i18next')>(),
    useTranslation: () => ({ t: (texte: string) => texte }),
}));

const origine = { image: useImageStore.getState(), carte: useMapStore.getState(), tableau: useWhiteboardStore.getState(), media: useMediaStore.getState() };
let afficher: (sources: string[]) => void;
let synchroniser: (type: string, valeur: string) => void;
let retirerAffichage: ReturnType<typeof vi.fn>;
let retirerDonnees: ReturnType<typeof vi.fn>;
let demander: ReturnType<typeof vi.fn>;
let ordre: string[];
const marqueur = PREFIXE_YOUTUBE + 'dQw4w9WgXcQ';
const image = () => document.querySelector('img[alt="GM-OS Projector"]');
const opacite = () => image()?.closest('div[style*="opacity"]') as HTMLDivElement | null;
const video = () => document.querySelector('video');
const envoyer = (source: string) => act(() => afficher([source]));
const magasin = (source: string | null, cible = 'hub') => act(() => useImageStore.setState({ projections: { [cible]: source } }));
const avancer = (duree: number) => act(() => vi.advanceTimersByTime(duree));
const lire = async () => { await act(async () => {}); };
const ficheVideo: MediaItem = { id: 'm-video', name: 'Film', type: 'video', size: 1, createdAt: 0, tags: [], campaignIds: [], boucler: false };

beforeEach(() => {
    vi.useFakeTimers(); controle.resolutions.clear(); ordre = [];
    useMapStore.setState({ projectionTarget: 'hub', projectedMapUrl: null });
    useWhiteboardStore.setState({ projectionTarget: null });
    useImageStore.setState({ projections: {} });
    useMediaStore.setState({ mediaList: [], initDB: vi.fn(async () => {}), getMediaBlob: vi.fn(async () => undefined) });
    retirerAffichage = vi.fn(); retirerDonnees = vi.fn(); demander = vi.fn(() => ordre.push('demande'));
    const pont = { image: {
        onUpdateDisplay: (rappel: typeof afficher) => { ordre.push('affichage'); afficher = rappel; return retirerAffichage; },
        onSyncHubData: (rappel: typeof synchroniser) => { ordre.push('donnees'); synchroniser = rappel; return retirerDonnees; },
        requestCurrentDisplay: demander,
    } };
    (window as unknown as { appBridge: unknown }).appBridge = pont;
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();
    vi.clearAllTimers();
});
afterEach(() => {
    cleanup(); vi.restoreAllMocks(); vi.clearAllTimers(); vi.useRealTimers();
    useImageStore.setState(origine.image, true); useMapStore.setState(origine.carte, true);
    useWhiteboardStore.setState(origine.tableau, true); useMediaStore.setState(origine.media, true);
    delete (window as unknown as { appBridge?: unknown }).appBridge;
});

describe('la source de la fenêtre de projection', () => {
    it('rend le magasin dès le premier commit et demande ensuite l’état avec les écouteurs posés', () => {
        magasin('/initial.png'); const commits: Array<string | null> = [];
        function Observer() { useLayoutEffect(() => { commits.push(image()?.getAttribute('src') ?? null); }); return <ProjectorView />; }
        render(<Observer />);
        expect(commits).toEqual(['/initial.png']); expect(ordre).toEqual(['affichage', 'donnees', 'demande']);
        expect(demander).toHaveBeenCalledWith('hub');
    });
    it('suit les changements du magasin jusqu’au premier IPC d’image', () => {
        render(<ProjectorView />); magasin('/avant.png'); expect(image()?.getAttribute('src')).toBe('/avant.png');
        envoyer('/ipc.png'); magasin('/obsolete.png'); expect(image()?.getAttribute('src')).toBe('/ipc.png');
    });
    it('un message de son ne rend pas le magasin obsolète', () => {
        render(<ProjectorView />); act(() => synchroniser('son-video', '0.4')); magasin('/encore.png');
        expect(image()?.getAttribute('src')).toBe('/encore.png');
    });
    it('un IPC d’extinction rend aussi le magasin obsolète', () => {
        magasin('/avant.png'); render(<ProjectorView />); envoyer('EMPTY'); avancer(FONDU_DE_LIMAGE_MS);
        magasin('/obsolete.png'); expect(image()).toBeNull();
    });
    it('garde l’image pendant les 700 ms de sortie', () => {
        magasin('/avant.png'); render(<ProjectorView />); envoyer('EMPTY');
        expect(opacite()?.style.opacity).toBe('0'); avancer(699); expect(image()).not.toBeNull();
        avancer(1); expect(image()).toBeNull();
    });
    it('le magasin peut éteindre une image sans réarmer son fondu', () => {
        magasin('/avant.png'); render(<ProjectorView />); magasin(null); avancer(400);
        magasin(null); avancer(300); expect(image()).toBeNull();
    });
    it('une nouvelle image annule l’extinction précédente', () => {
        magasin('/avant.png'); render(<ProjectorView />); envoyer('EMPTY'); avancer(400); envoyer('/nouvelle.png'); avancer(700);
        expect(image()?.getAttribute('src')).toBe('/nouvelle.png'); expect(opacite()?.style.opacity).toBe('1');
    });
    it('retire les deux abonnements et le délai au démontage', () => {
        magasin('/avant.png'); const { unmount } = render(<ProjectorView />); const delaisAvant = vi.getTimerCount(); envoyer('EMPTY');
        expect(vi.getTimerCount()).toBe(delaisAvant + 1); unmount(); expect(vi.getTimerCount()).toBe(delaisAvant);
        expect(retirerAffichage).toHaveBeenCalledOnce(); expect(retirerDonnees).toHaveBeenCalledOnce();
    });
    it('une nouvelle cible reprend son magasin et ignore les anciens écouteurs', () => {
        magasin('/ancien.png'); render(<ProjectorView />); envoyer('/ipc.png'); const ancien = afficher;
        magasin('/autre.png', 'monitor'); act(() => useMapStore.setState({ projectionTarget: 'monitor' }));
        act(() => ancien(['/retard.png'])); expect(image()?.getAttribute('src')).toBe('/autre.png');
        expect(demander).toHaveBeenLastCalledWith('monitor'); expect(retirerAffichage).toHaveBeenCalledOnce();
    });
    it('écoute une seule fois après la répétition de StrictMode', () => {
        render(<StrictMode><ProjectorView /></StrictMode>); expect(retirerAffichage).toHaveBeenCalledOnce();
        envoyer('/image.png'); expect(image()?.getAttribute('src')).toBe('/image.png');
    });
    it('rend le tableau blanc au marqueur et quitte l’ancien type vidéo', async () => {
        render(<ProjectorView />); envoyer(marqueur); expect(document.querySelector('iframe')).not.toBeNull();
        envoyer('__whiteboard__'); await lire(); expect(document.querySelector('iframe')).toBeNull();
        expect(document.querySelector('[data-testid="tableau"]')).not.toBeNull();
    });
});

describe('les vidéos projetées', () => {
    it('reconnaît YouTube sans base et coupe immédiatement le cadre', () => {
        magasin(marqueur); render(<ProjectorView />); expect(document.querySelector('iframe')?.src).toContain('dQw4w9WgXcQ');
        const delaisAvant = vi.getTimerCount();
        envoyer('EMPTY'); expect(document.querySelector('iframe')).toBeNull(); expect(vi.getTimerCount()).toBe(delaisAvant);
        expect(useMediaStore.getState().getMediaBlob).not.toHaveBeenCalled();
    });
    it('coupe aussi YouTube quand projection et extinction arrivent dans le même lot', () => {
        render(<ProjectorView />); act(() => { afficher([marqueur]); afficher(['EMPTY']); });
        expect(document.querySelector('iframe')).toBeNull(); expect(vi.getTimerCount()).toBe(0);
    });
    it('ne démarre pas une vidéo dont le type arrive après l’ordre d’extinction', async () => {
        let terminer!: (blob: Blob) => void;
        useMediaStore.setState({ getMediaBlob: vi.fn(() => new Promise<Blob>(resolve => { terminer = resolve; })) });
        render(<ProjectorView />); envoyer('m-video'); envoyer('EMPTY');
        await act(async () => terminer(new Blob(['film'], { type: 'video/webm' })));
        expect(video()).toBeNull(); expect(HTMLMediaElement.prototype.play).not.toHaveBeenCalled();
        expect(vi.getTimerCount()).toBe(0);
    });
    it('applique boucle et son à une vidéo dont l’adresse arrive après le type', async () => {
        useMediaStore.setState({ mediaList: [ficheVideo], getMediaBlob: vi.fn(async () => new Blob(['film'], { type: 'video/webm' })) });
        controle.resolutions.set('m-video', { source: '/ancienne.png', url: '/ancienne.png' });
        const vue = render(<ProjectorView />); act(() => synchroniser('son-video', '0.3')); envoyer('m-video'); await lire();
        expect(video()).toBeNull(); controle.resolutions.set('m-video', { source: 'm-video', url: 'blob:film' });
        // Un rendu sans nouveau type : l’adresse seule fait naître le <video>.
        vue.rerender(<ProjectorView />);
        expect(video()?.src).toBe('blob:film'); expect(video()?.volume).toBe(0.3); expect(video()?.loop).toBe(false);
        envoyer('EMPTY'); expect(video()).toBeNull(); expect(vi.getTimerCount()).toBe(0);
    });
    it('le réglage de boucle suit les métadonnées sans relecture du blob', async () => {
        const getMediaBlob = vi.fn(async () => new Blob(['film'], { type: 'video/webm' }));
        useMediaStore.setState({ mediaList: [ficheVideo], getMediaBlob }); render(<ProjectorView />); envoyer('m-video'); await lire();
        act(() => useMediaStore.setState({ mediaList: [{ ...ficheVideo, boucler: true }] }));
        expect(video()?.loop).toBe(true); expect(getMediaBlob).toHaveBeenCalledOnce();
    });
    it('borne le niveau et ignore un message de son invalide', async () => {
        useMediaStore.setState({ getMediaBlob: vi.fn(async () => new Blob(['film'], { type: 'video/webm' })) });
        render(<ProjectorView />); envoyer('m-video'); await lire();
        act(() => synchroniser('son-video', '-4')); expect(video()?.volume).toBe(0);
        act(() => synchroniser('son-video', '4')); expect(video()?.volume).toBe(1);
        act(() => synchroniser('son-video', 'abime')); expect(video()?.volume).toBe(1);
    });
    it('une erreur de lecture tardive ne relance pas la vidéo retirée', async () => {
        let refuser!: (raison: Error) => void;
        const play = vi.mocked(HTMLMediaElement.prototype.play).mockImplementation(() => new Promise<void>((_, reject) => { refuser = reject; }));
        useMediaStore.setState({ getMediaBlob: vi.fn(async () => new Blob(['film'], { type: 'video/webm' })) });
        render(<ProjectorView />); envoyer('m-video'); await lire(); envoyer('EMPTY');
        await act(async () => refuser(new Error('retiree'))); expect(play).toHaveBeenCalledOnce();
    });
});

describe('la détection appartient à la source chargée', () => {
    it('les adresses et marqueurs ont leur nature dès le premier rendu', () => {
        const { result, rerender } = renderHook(source => useNatureDuMediaProjete(source), { initialProps: '/image.png' });
        expect(result.current).toBe('image'); rerender(marqueur); expect(result.current).toBe('youtube');
        rerender('__map__'); expect(result.current).toBe('unknown');
    });
    it('ignore un blob vidéo ancien qui arrive après une nouvelle image', async () => {
        let terminer!: (blob: Blob) => void;
        useMediaStore.setState({ getMediaBlob: vi.fn(() => new Promise<Blob>(resolve => { terminer = resolve; })) });
        const { result, rerender } = renderHook(source => useNatureDuMediaProjete(source), { initialProps: 'm-ancien' });
        expect(result.current).toBe('unknown'); rerender('/nouveau.png');
        await act(async () => terminer(new Blob(['film'], { type: 'video/webm' }))); expect(result.current).toBe('image');
    });
    it('ne conserve pas le type vidéo lorsque la nouvelle source attend son blob', async () => {
        useMediaStore.setState({ getMediaBlob: vi.fn(id => id === 'm-video'
            ? Promise.resolve(new Blob(['film'], { type: 'video/webm' })) : new Promise<Blob>(() => {})) });
        const { result, rerender } = renderHook(source => useNatureDuMediaProjete(source), { initialProps: 'm-video' });
        await lire(); expect(result.current).toBe('video'); rerender('m-suivant'); expect(result.current).toBe('unknown');
    });
    it('retente la détection quand une restauration remet le média en base', async () => {
        let blob: Blob | undefined = undefined;
        useMediaStore.setState({ getMediaBlob: vi.fn(async () => blob) });
        const { result } = renderHook(() => useNatureDuMediaProjete('m-video')); await lire(); expect(result.current).toBe('image');
        blob = new Blob(['film'], { type: 'video/webm' }); act(() => useMediaStore.setState({ mediaList: [ficheVideo] }));
        await lire(); expect(result.current).toBe('video');
    });
    it('un échec de la base garde le repli image sans rejet non géré', async () => {
        vi.spyOn(console, 'warn').mockImplementation(() => {});
        useMediaStore.setState({ getMediaBlob: vi.fn(async () => { throw new Error('base indisponible'); }) });
        const { result } = renderHook(() => useNatureDuMediaProjete('m-image')); await lire(); expect(result.current).toBe('image');
    });
    it('ignore une réponse après démontage', async () => {
        let terminer!: (blob: Blob) => void;
        useMediaStore.setState({ getMediaBlob: vi.fn(() => new Promise<Blob>(resolve => { terminer = resolve; })) });
        const { result, unmount } = renderHook(() => useNatureDuMediaProjete('m-image')); unmount();
        await act(async () => terminer(new Blob(['png'], { type: 'image/png' }))); expect(result.current).toBe('unknown');
    });
});
