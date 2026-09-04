import { describe, it, expect, beforeEach } from 'vitest';
import { useAudioMasterStore } from './useAudioMasterStore';

/**
 * **Couper le son doit rendre le niveau d'avant.**
 *
 * Défaut A4 du § 12e, corrigé le 2026-09-04. Le bouton basculait entre 0 et
 * **1** : une table réglée à 40 % repartait à fond après un aller-retour — un
 * mur de son au retour d'un aparté, exactement au moment où le meneur voulait
 * du silence.
 */

beforeEach(() => {
    useAudioMasterStore.setState({ masterVolume: 1, volumeAvantCoupure: 1 });
});

describe('la coupure rapide du son', () => {
    it('rend le niveau d’avant, et pas 100 % — le défaut du 04/09', () => {
        useAudioMasterStore.setState({ masterVolume: 0.4 });

        useAudioMasterStore.getState().basculerLaCoupure();
        expect(useAudioMasterStore.getState().masterVolume).toBe(0);

        useAudioMasterStore.getState().basculerLaCoupure();
        expect(useAudioMasterStore.getState().masterVolume).toBe(0.4);
    });

    it('survit à un second aller-retour', () => {
        useAudioMasterStore.setState({ masterVolume: 0.25 });

        for (let i = 0; i < 2; i++) {
            useAudioMasterStore.getState().basculerLaCoupure();
            useAudioMasterStore.getState().basculerLaCoupure();
        }

        expect(useAudioMasterStore.getState().masterVolume).toBe(0.25);
    });

    it('reste réversible quand le curseur était déjà à zéro', () => {
        /*
          Baisser le curseur à fond PUIS cliquer : le niveau retenu vaudrait
          zéro, et la coupure ne se déferait jamais. On remonte à plein.
        */
        useAudioMasterStore.setState({ masterVolume: 0, volumeAvantCoupure: 0 });

        useAudioMasterStore.getState().basculerLaCoupure();

        expect(useAudioMasterStore.getState().masterVolume).toBe(1);
    });

    it('ne retient pas zéro comme niveau d’avant', () => {
        useAudioMasterStore.setState({ masterVolume: 0, volumeAvantCoupure: 0.7 });

        useAudioMasterStore.getState().basculerLaCoupure();

        expect(useAudioMasterStore.getState().masterVolume).toBe(0.7);
    });
});
