import { describe, it, expect, beforeEach } from 'vitest';
import { claimProjection } from './projectionExclusivity';
import { useMapStore } from '../modules/map/useMapStore';
import { useWhiteboardStore } from '../modules/whiteboard/useWhiteboardStore';

/**
 * La carte et le tableau blanc se disputent la même surface. Avant cette règle,
 * rien ne les empêchait d'être projetés ensemble : les mentions « Exclusivity »
 * des deux modales ne réglaient que Hub-contre-moniteur au sein d'un module.
 */

const TRACE = { id: 'p1', points: [{ x: 0, y: 0 }], color: '#fff', width: 2 };

beforeEach(() => {
    useMapStore.setState({ projectionTarget: null, projectedMapUrl: null });
    useWhiteboardStore.setState({ projectionTarget: null, paths: [] });
});

describe('claimProjection', () => {
    it('projeter la carte éteint le tableau', () => {
        useWhiteboardStore.setState({ projectionTarget: 'hub' });

        expect(claimProjection('map')).toBe('whiteboard');
        expect(useWhiteboardStore.getState().projectionTarget).toBeNull();
    });

    it('projeter le tableau éteint la carte', () => {
        useMapStore.setState({ projectionTarget: 'hub', projectedMapUrl: 'carte.jpg' });

        expect(claimProjection('whiteboard')).toBe('map');
        expect(useMapStore.getState().projectionTarget).toBeNull();
        expect(useMapStore.getState().projectedMapUrl).toBeNull();
    });

    it("l'exclusion vaut d'une surface à l'autre, pas seulement sur la même", () => {
        // Le cas que la règle existante laissait passer : deux surfaces
        // différentes, donc deux projections simultanées.
        useMapStore.setState({ projectionTarget: 'hub' });

        claimProjection('whiteboard');

        expect(useMapStore.getState().projectionTarget).toBeNull();
    });

    it('ne touche pas aux tracés du tableau', () => {
        // Le tableau doit revenir tel quel à la projection suivante.
        useWhiteboardStore.setState({ projectionTarget: 'monitor', paths: [TRACE] as never });

        claimProjection('map');

        expect(useWhiteboardStore.getState().paths).toHaveLength(1);
    });

    it('ne signale rien quand aucune autre projection n\'est active', () => {
        expect(claimProjection('map')).toBeNull();
        expect(claimProjection('whiteboard')).toBeNull();
    });

    it('réclamer deux fois de suite le même module est sans effet', () => {
        useMapStore.setState({ projectionTarget: 'hub' });

        expect(claimProjection('whiteboard')).toBe('map');
        expect(claimProjection('whiteboard')).toBeNull();
    });
});
