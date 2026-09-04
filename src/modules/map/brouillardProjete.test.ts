import { describe, it, expect, beforeEach } from 'vitest';
import { useMapStore } from './useMapStore';

/**
 * **Le brouillard des joueurs suit celui du meneur, même quand il n'y en a pas.**
 *
 * Défaut M3 du § 12a, corrigé le 2026-09-04. `syncToPlayers` ne poussait
 * `projectedFogDataUrl` que si le meneur en avait un — donc **charger une carte
 * jamais explorée en cours de projection laissait aux joueurs le brouillard de
 * la carte précédente**. Des trous révélés au mauvais endroit, sur un plan
 * qu'ils n'ont pas encore vu.
 */

const etatInitial = useMapStore.getState();

beforeEach(() => {
    useMapStore.setState({
        ...etatInitial,
        projectionTarget: 'hub',
        mapUrl: 'm-egouts',
        fogDataUrl: 'data:image/png;base64,LES-EGOUTS',
        projectedFogDataUrl: null,
    });
});

describe('la projection du brouillard', () => {
    it('envoie le brouillard du meneur quand il y en a un', () => {
        useMapStore.getState().syncToPlayers();

        expect(useMapStore.getState().projectedFogDataUrl).toBe('data:image/png;base64,LES-EGOUTS');
    });

    it("efface celui des joueurs quand la carte n'en a aucun — le défaut du 04/09", () => {
        useMapStore.getState().syncToPlayers();
        expect(useMapStore.getState().projectedFogDataUrl).not.toBeNull();

        /*
          Le meneur charge une carte jamais explorée : `setMap` met
          `fogDataUrl` à null, et rien ne l'enregistre tant qu'il n'a pas
          peint. Avant le correctif, la valeur projetée restait celle des
          égouts.
        */
        useMapStore.setState({ mapUrl: 'm-auberge', fogDataUrl: null });
        useMapStore.getState().syncToPlayers();

        expect(useMapStore.getState().projectedFogDataUrl).toBeNull();
    });
});

describe('ce que rien ne change', () => {
    it('ne projette rien tant que la projection est éteinte', () => {
        useMapStore.setState({ projectionTarget: null, projectedFogDataUrl: 'ancien' });

        useMapStore.getState().syncToPlayers();

        expect(useMapStore.getState().projectedFogDataUrl).toBe('ancien');
    });
});
