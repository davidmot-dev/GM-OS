import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useMediaUrl } from './useMediaUrl';
import { useMediaStore, type MediaItem } from '../stores/useMediaStore';

/**
 * Trouvé par la vitrine le 2026-09-27 : les vignettes d'Image-OS montées
 * pendant une restauration restaient vides. La tuile cherchait son image avant
 * que `restaurerUnMedia` ne la remette en base, et ne réessayait jamais.
 */
describe('useMediaUrl — le média qui arrive après la tuile', () => {
    const etatDOrigine = useMediaStore.getState();
    const media: MediaItem = { id: 'm-restaure', name: 'carte.png', type: 'image', size: 3, createdAt: 0, tags: [], campaignIds: [] };

    beforeEach(() => {
        (window as unknown as { appBridge: unknown }).appBridge = {};
    });

    afterEach(() => {
        useMediaStore.setState(etatDOrigine, true);
        delete (window as unknown as { appBridge?: unknown }).appBridge;
    });

    it("s'affiche dès que la restauration le remet en base", async () => {
        const enBase = new Map<string, Blob>();
        const getMediaBlob = vi.fn(async (id: string) => enBase.get(id));
        useMediaStore.setState({ mediaList: [], getMediaBlob });

        const { result } = renderHook(() => useMediaUrl('m-restaure'));
        await waitFor(() => expect(getMediaBlob).toHaveBeenCalledTimes(1));
        expect(result.current).toBeUndefined();

        // Ce que fait `restaurerUnMedia` : les octets en base, la fiche dans la liste.
        act(() => {
            enBase.set('m-restaure', new Blob(['png'], { type: 'image/png' }));
            useMediaStore.setState(s => ({ mediaList: [media, ...s.mediaList] }));
        });

        await waitFor(() => expect(result.current).toMatch(/^data:image\/png;base64,/));
    });

    it("ne relance rien pour une adresse qui n'est pas un média de la base", async () => {
        const getMediaBlob = vi.fn();
        useMediaStore.setState({ mediaList: [], getMediaBlob });

        const { result } = renderHook(() => useMediaUrl('https://exemple.org/carte.png'));
        await waitFor(() => expect(result.current).toBe('https://exemple.org/carte.png'));

        act(() => useMediaStore.setState({ mediaList: [media] }));
        expect(getMediaBlob).not.toHaveBeenCalled();
    });
});
