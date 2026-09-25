import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useMapStore } from './useMapStore';
import { useWhiteboardStore } from '../whiteboard/useWhiteboardStore';
import { projeterLaCarteSur } from './projectionDeLaCarte';

/**
 * **Projeter la carte tactique — le geste partagé par Map-OS et le Storyboard.**
 *
 * Extrait de `MapProjectionModal` le 2026-09-25 : ces essais gardent qu'il
 * fait ce que la modale faisait, pour les deux portes à la fois.
 */

const launchDisplay = vi.fn();
const closeAllDisplays = vi.fn();
const etatInitial = useMapStore.getState();

beforeEach(() => {
    vi.clearAllMocks();
    (window as unknown as { appBridge: unknown }).appBridge = { image: { launchDisplay, closeAllDisplays } };
    useMapStore.setState({
        ...etatInitial,
        mapUrl: 'carte-egouts', fogDataUrl: 'data:image/png;base64,EXPLORE',
        projectionTarget: null, projectedMapUrl: null,
    });
});

afterEach(() => {
    delete (window as unknown as { appBridge?: unknown }).appBridge;
});

describe('projeter la carte', () => {
    it('sur le Player Hub : démarre la projection et ferme les moniteurs', () => {
        expect(projeterLaCarteSur('hub')).toBe(true);

        const etat = useMapStore.getState();
        expect(etat.projectionTarget).toBe('hub');
        expect(etat.projectedMapUrl).toBe('carte-egouts');
        expect(etat.projectedFogDataUrl).toBe('data:image/png;base64,EXPLORE');
        expect(closeAllDisplays).toHaveBeenCalled();
        expect(launchDisplay).not.toHaveBeenCalled();
    });

    /**
     * ⛔ Défaut de la modale d'origine : `syncToPlayers` garde la cible qu'il
     * trouve, donc une carte sur un moniteur restait en `'monitor'` — puis on
     * fermait les moniteurs, et elle n'était plus nulle part.
     */
    it('du moniteur au Player Hub : la cible change vraiment', () => {
        projeterLaCarteSur('moniteur-2');
        projeterLaCarteSur('hub');

        expect(useMapStore.getState().projectionTarget).toBe('hub');
        expect(useMapStore.getState().ecranDeLaCarte).toBeNull();
    });

    it('sur un moniteur : ouvre la fenêtre tactique sur CET écran, et le retient', () => {
        expect(projeterLaCarteSur('moniteur-2')).toBe(true);

        expect(useMapStore.getState().ecranDeLaCarte).toBe('moniteur-2');
        expect(useMapStore.getState().projectionTarget).toBe('monitor');
        expect(useMapStore.getState().projectedMapUrl).toBe('carte-egouts');
        expect(launchDisplay).toHaveBeenCalledWith(['__tactical_map__'], 'moniteur-2');
    });

    it('libère le tableau blanc, qui ne cohabite pas avec la carte', () => {
        useWhiteboardStore.setState({ projectionTarget: 'hub' });
        projeterLaCarteSur('moniteur-2');
        expect(useWhiteboardStore.getState().projectionTarget).toBeNull();
    });

    it('refuse un moniteur quand aucune carte n’est chargée — et le dit', () => {
        useMapStore.setState({ mapUrl: null });
        expect(projeterLaCarteSur('moniteur-2')).toBe(false);
        expect(launchDisplay).not.toHaveBeenCalled();
    });
});
