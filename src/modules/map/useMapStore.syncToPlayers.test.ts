import { describe, it, expect, beforeEach } from 'vitest';
import { useMapStore } from './useMapStore';

/**
 * `syncToPlayers` rafraîchit l'instantané projeté ; il ne démarre une
 * projection que sur demande explicite.
 *
 * Il faisait `projectionTarget: state.projectionTarget || 'hub'` sans condition,
 * donc tout rafraîchissement allumait la projection. Les appels internes du
 * store s'en protégeaient par `if (get().projectionTarget)`, mais `App.tsx`
 * avait oublié cette garde en resynchronisant la carte à chaque changement de la
 * liste des combattants. Comme `nextTurn` reconstruit ce tableau, « Tour
 * Suivant » projetait la carte.
 */

beforeEach(() => {
    useMapStore.setState({
        projectionTarget: null,
        projectedMapUrl: null,
        mapUrl: 'carte.jpg',
        tokens: [],
        pings: [],
    } as never);
});

describe('useMapStore.syncToPlayers', () => {
    it("ne démarre pas de projection quand aucune n'est active", () => {
        useMapStore.getState().syncToPlayers();

        expect(useMapStore.getState().projectionTarget).toBeNull();
        expect(useMapStore.getState().projectedMapUrl).toBeNull();
    });

    it('démarre la projection vers le Hub sur demande explicite', () => {
        useMapStore.getState().syncToPlayers({ start: true });

        expect(useMapStore.getState().projectionTarget).toBe('hub');
        expect(useMapStore.getState().projectedMapUrl).toBe('carte.jpg');
    });

    it('rafraîchit sans toucher à la cible quand une projection est active', () => {
        useMapStore.setState({ projectionTarget: 'monitor' } as never);

        useMapStore.getState().syncToPlayers();

        expect(useMapStore.getState().projectionTarget).toBe('monitor');
        expect(useMapStore.getState().projectedMapUrl).toBe('carte.jpg');
    });

    it('un rafraîchissement répété reste sans effet, projection éteinte', () => {
        // Le cas de « Tour Suivant » : la souscription du combat rafraîchit à
        // chaque tour, et ne doit jamais rallumer la carte.
        for (let tour = 0; tour < 5; tour++) {
            useMapStore.getState().syncToPlayers();
        }

        expect(useMapStore.getState().projectionTarget).toBeNull();
    });
});
