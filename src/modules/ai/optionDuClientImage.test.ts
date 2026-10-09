import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { aiService } from './AIService';

const client = vi.hoisted(() => ({ connecter: vi.fn(), predire: vi.fn(), ranger: vi.fn() }));
vi.mock('@gradio/client', () => ({ Client: { connect: client.connecter } }));
vi.mock('./rangementDeLImage', () => ({ rangerLImageFabriquee: client.ranger, ErreurDeRangement: class extends Error {} }));
vi.mock('../../stores/useAIStore', () => ({ useAIStore: { getState: () => ({
    activeProvider: 'gemini', configs: { gemini: {} }, image: { accountId: '' }, aUneCle: () => true,
}) } }));
vi.mock('../session/useSessionOSStore', () => ({ useSessionOSStore: { getState: () => ({ sessions: [] }) } }));

describe('l’option d’authentification du client Gradio installé', () => {
    beforeEach(() => {
        vi.clearAllMocks(); vi.useFakeTimers();
        client.connecter.mockResolvedValue({ predict: client.predire });
        client.predire.mockResolvedValue({ data: [{ url: 'https://image.invalid/resultat.png' }] });
        client.ranger.mockResolvedValue('media-artificiel');
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: true, arrayBuffer: async () => new Uint8Array(1200).buffer,
            headers: new Headers({ 'content-type': 'image/png' }),
        }));
    });
    afterEach(() => { vi.clearAllTimers(); vi.useRealTimers(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

    it.each(['hf_jeton_artificiel', ''])('transmet le jeton %s via l’option token reconnue', async jeton => {
        vi.stubEnv('VITE_HF_TOKEN', jeton);
        expect(await aiService.generateImage('Portrait', '16:9')).toBe('media-artificiel');
        expect(client.connecter).toHaveBeenCalledWith(expect.any(String), { token: jeton });
        expect(client.predire).toHaveBeenCalledWith('/generate_image', expect.objectContaining({ height: 768, width: 1344 }));
        expect(client.ranger).toHaveBeenCalledTimes(1);
    });
});
