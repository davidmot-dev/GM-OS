import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HueEngine } from './HueEngine';
import { useLightStore } from './useLightStore';

const requete = vi.fn();
const moteur = new HueEngine();
let pontInitial: typeof window.appBridge;
const etatInitial = useLightStore.getState();

describe('les réponses Hue sont relues comme des données inconnues', () => {
    beforeEach(() => {
        vi.clearAllMocks(); pontInitial = window.appBridge;
        Object.defineProperty(window, 'appBridge', { configurable: true, value: { light: { request: requete } } });
        useLightStore.setState({ bridgeIp: '192.0.2.1', username: 'jeton-artificiel', status: 'connected', lights: {} });
    });
    afterEach(() => {
        useLightStore.setState(etatInitial);
        Object.defineProperty(window, 'appBridge', { configurable: true, value: pontInitial });
        vi.unstubAllGlobals();
    });

    it('conserve le refus d’un utilisateur non autorisé', async () => {
        requete.mockResolvedValue([{ error: { type: 1, description: 'Utilisateur inconnu' } }]);
        await expect(moteur.setLightState('1', { on: true })).rejects.toThrow('UNAUTHORIZED');
    });

    it.each([[], [null], [42], 'Réponse brute', [{ error: { type: 3 } }]])('ne transforme pas une charge %j en refus d’autorisation', async data => {
        requete.mockResolvedValue(data);
        await expect(moteur.setLightState('1', { on: true })).resolves.toBeUndefined();
        expect(requete).toHaveBeenCalledTimes(1);
    });

    it('le recours fetch conserve le même refus, sans réseau réel', async () => {
        Object.defineProperty(window, 'appBridge', { configurable: true, value: undefined });
        const fetchSimule = vi.fn().mockResolvedValue({ json: async () => [{ error: { type: 1 } }] });
        vi.stubGlobal('fetch', fetchSimule);
        await expect(moteur.setLightState('1', { on: false })).rejects.toThrow('UNAUTHORIZED');
        expect(fetchSimule).toHaveBeenCalledTimes(1);
    });
});
