import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AIProvider } from './types';
import { aiService } from './AIService';

const etat = { activeProvider: 'gemini' as AIProvider, sessions: [], configs: {
    gemini: { modelId: 'modele-test' }, custom: { modelId: 'modele-custom', endpoint: 'https://fournisseur.invalid/chat' },
}, aUneCle: () => true };
vi.mock('../../stores/useAIStore', () => ({ useAIStore: { getState: () => etat } }));
vi.mock('../session/useSessionOSStore', () => ({ useSessionOSStore: { getState: () => ({ sessions: [] }) } }));
const requete = vi.fn();
const reponse = (data: unknown, status = 200): AIProxyResponse => ({ ok: status === 200, status, statusText: 'Test', data });
const succes = () => reponse({ candidates: [{ content: { parts: [{ text: '{"resultat":42}' }] } }] });
const texte = () => aiService.generateText('Question', undefined, 'sage', {}, false, false, true);
const json = () => aiService.generateJSON<{ resultat: number }>('Question', 'Système', undefined, { sansPersona: true });
let pontInitial: typeof window.appBridge;

describe('les contrats des fournisseurs gardent leurs réponses et leurs reprises', () => {
    beforeEach(() => {
        vi.clearAllMocks(); vi.useFakeTimers(); etat.activeProvider = 'gemini';
        pontInitial = window.appBridge;
        Object.defineProperty(window, 'appBridge', { configurable: true, value: { ai: { proxyRequest: requete } } });
    });
    afterEach(() => {
        vi.clearAllTimers(); vi.useRealTimers();
        Object.defineProperty(window, 'appBridge', { configurable: true, value: pontInitial });
    });

    it.each([
        [{ choices: [{ message: { content: 'Premier choix' } }], text: 'Repli' }, 'Premier choix'],
        [{ text: 'Texte direct' }, 'Texte direct'],
        [{ autre: 12 }, '{"autre":12}'],
    ])('conserve la priorité des réponses custom %j', async (data, attendu) => {
        etat.activeProvider = 'custom'; requete.mockResolvedValue(reponse(data));
        expect((await texte()).text).toBe(attendu);
        expect(requete.mock.calls[0][4]).toBe('custom');
    });

    it('envoie texte, système et pièces jointes Gemini dans leur ordre sans muter les pièces', async () => {
        requete.mockResolvedValue(succes());
        const pieces = [{ data: 'data:image/png;base64,QUJD', mimeType: 'image/png' }, { data: 'REVG', mimeType: 'image/jpeg' }];
        const avant = structuredClone(pieces);
        expect(await aiService.generateJSON('Question', 'Système', pieces, { sansPersona: true })).toEqual({ resultat: 42 });
        expect(requete.mock.calls[0][3]).toEqual({
            contents: [{ parts: [{ text: 'Question' }, { inline_data: { mime_type: 'image/png', data: 'QUJD' } },
                { inline_data: { mime_type: 'image/jpeg', data: 'REVG' } }] }],
            generationConfig: { response_mime_type: 'application/json', temperature: 0.2 },
            system_instruction: { parts: [{ text: 'Système' }] },
        });
        expect(pieces).toEqual(avant);
    });

    it.each([429, 503])('reprend un statut Gemini %s après deux secondes', async status => {
        requete.mockResolvedValueOnce(reponse({}, status)).mockResolvedValueOnce(succes());
        const resultat = json();
        await vi.advanceTimersByTimeAsync(1999); expect(requete).toHaveBeenCalledTimes(1);
        await vi.advanceTimersByTimeAsync(1);
        expect(await resultat).toEqual({ resultat: 42 }); expect(requete).toHaveBeenCalledTimes(2);
    });

    it('s’arrête après les deux reprises Gemini et garde le message fournisseur', async () => {
        requete.mockResolvedValue(reponse({ error: { message: 'Quota' } }, 429));
        const resultat = expect(json()).rejects.toThrow('Quota');
        await vi.advanceTimersByTimeAsync(6000); await resultat;
        expect(requete).toHaveBeenCalledTimes(3);
    });

    it('ne reprend pas une erreur définitive et tolère une charge d’erreur nulle', async () => {
        requete.mockResolvedValue(reponse(null, 400));
        await expect(json()).rejects.toThrow('Erreur API Gemini JSON');
        expect(requete).toHaveBeenCalledTimes(1);
    });

    it('reprend une exception réseau structurée sans évaluer son repli inutile', async () => {
        etat.activeProvider = 'custom';
        requete.mockRejectedValueOnce({ message: 'ERR_NETWORK_CHANGED', toString: () => { throw new Error('Repli inutile'); } })
            .mockResolvedValueOnce(reponse({ text: 'Reprise' }));
        const resultat = texte(); await vi.advanceTimersByTimeAsync(1000);
        expect((await resultat).text).toBe('Reprise'); expect(requete).toHaveBeenCalledTimes(2);
    });

    it('propage une exception primitive Gemini sans inventer de reprise', async () => {
        requete.mockRejectedValue('Erreur brute');
        await expect(json()).rejects.toBe('Erreur brute'); expect(requete).toHaveBeenCalledTimes(1);
    });
});
