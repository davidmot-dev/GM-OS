import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import { MediaItemThumbnail } from './MediaItemThumbnail';
import { ondeDuSon, premierePageDuPdf } from '../../../components/media/apercuDesMedias';
import type { MediaItem } from '../../../stores/useMediaStore';

vi.mock('../../../hooks/useMediaUrl', () => ({ useMediaUrl: () => 'blob:media' }));
vi.mock('../../../components/media/apercuDesMedias', async importOriginal => ({
    ...await importOriginal<typeof import('../../../components/media/apercuDesMedias')>(),
    ondeDuSon: vi.fn(), premierePageDuPdf: vi.fn(),
}));

const media = (type: MediaItem['type'], name: string): MediaItem => ({
    id: 'temoin', type, name, size: 100, createdAt: 0, tags: [], campaignIds: [],
});

beforeEach(() => {
    vi.mocked(ondeDuSon).mockReset().mockResolvedValue({ cretes: [0.5, 1], duree: 42 });
    vi.mocked(premierePageDuPdf).mockReset().mockResolvedValue('data:image/png;base64,cGFnZQ==');
});
afterEach(() => vi.unstubAllGlobals());

describe('la visibilité des vignettes', () => {
    it('décode le son sans observateur et affiche sa durée', async () => {
        vi.stubGlobal('IntersectionObserver', undefined);
        render(<MediaItemThumbnail media={media('audio', 'pluie.mp3')} />);
        await screen.findByText('0:42');
        expect(ondeDuSon).toHaveBeenCalledExactlyOnceWith('temoin', 'blob:media');
    });

    it('lit le texte sans observateur', async () => {
        vi.stubGlobal('IntersectionObserver', undefined);
        const lire = vi.fn<typeof fetch>().mockResolvedValue(new Response('# Protocole\nPremière ligne'));
        vi.stubGlobal('fetch', lire);
        render(<MediaItemThumbnail media={media('document', 'notes.md')} />);
        await screen.findByText('Protocole');
        expect(lire).toHaveBeenCalledExactlyOnceWith('blob:media');
    });

    it('charge la première page du PDF sans observateur', async () => {
        vi.stubGlobal('IntersectionObserver', undefined);
        render(<MediaItemThumbnail media={media('document', 'regles.pdf')} />);
        await waitFor(() => expect(screen.getByAltText('regles.pdf').getAttribute('src'))
            .toBe('data:image/png;base64,cGFnZQ=='));
        expect(premierePageDuPdf).toHaveBeenCalledExactlyOnceWith('temoin', 'blob:media');
    });

    it('attend l’intersection, puis reste visible sans nouveau décodage', async () => {
        let notifier!: (entries: Array<{ isIntersecting: boolean }>) => void;
        const observer = vi.fn();
        const deconnecter = vi.fn();
        const constructeur = vi.fn(function (callback: typeof notifier) {
            notifier = callback;
            return { observe: observer, disconnect: deconnecter };
        });
        vi.stubGlobal('IntersectionObserver', constructeur);
        const vue = render(<MediaItemThumbnail media={media('audio', 'pluie.mp3')} />);
        expect(constructeur).toHaveBeenCalledWith(expect.any(Function), { rootMargin: '200px' });
        expect(observer).toHaveBeenCalledOnce();
        act(() => notifier([{ isIntersecting: false }]));
        expect(ondeDuSon).not.toHaveBeenCalled();
        act(() => notifier([{ isIntersecting: true }]));
        await screen.findByText('0:42');
        expect(deconnecter).toHaveBeenCalled();
        act(() => notifier([{ isIntersecting: false }]));
        vue.rerender(<MediaItemThumbnail media={{ ...media('audio', 'pluie.mp3'), tags: ['pluie'] }} />);
        expect(ondeDuSon).toHaveBeenCalledOnce();
        expect(screen.getByText('0:42')).toBeTruthy();
    });

    it('déconnecte une vignette encore hors écran au démontage', () => {
        const deconnecter = vi.fn();
        vi.stubGlobal('IntersectionObserver', vi.fn(function () {
            return { observe: vi.fn(), disconnect: deconnecter };
        }));
        const vue = render(<MediaItemThumbnail media={media('audio', 'pluie.mp3')} />);
        vue.unmount();
        expect(deconnecter).toHaveBeenCalledOnce();
        expect(ondeDuSon).not.toHaveBeenCalled();
    });
});
