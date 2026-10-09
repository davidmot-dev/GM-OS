import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useNotebookLM } from './useNotebookLM';

vi.mock('../../ai/hooks/useOracleContext', () => ({
    useOracleContext: () => ({ snapshot: 'Contexte artificiel', activeGem: null, activeCampaign: null, activeDriver: null }),
}));

const pontInitial = window.appBridge;
const appeler = vi.fn();
beforeEach(() => {
    appeler.mockReset();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.stubGlobal('appBridge', { ...pontInitial, mcp: { callTool: appeler } });
});
afterEach(() => vi.stubGlobal('appBridge', pontInitial));

describe('échec puis reprise d’une question au carnet', () => {
    it.each([
        { exception: new Error('échec du pont'), attendu: 'échec du pont' },
        { exception: { message: 'exception structurée' }, attendu: 'exception structurée' },
        { exception: null, attendu: 'Erreur MCP' },
        { exception: { message: 42 }, attendu: '42' },
    ])('affiche $attendu et permet une nouvelle question', async ({ exception, attendu }) => {
        appeler.mockRejectedValueOnce(exception).mockResolvedValueOnce({ content: 'Réponse après reprise' });
        const { result } = renderHook(() => useNotebookLM());
        await act(async () => { await result.current.queryNotebook('carnet-test', 'Première question'); });
        expect(result.current.messages).toEqual([
            { role: 'user', content: 'Première question' },
            { role: 'assistant', content: `Rupture de liaison : ${attendu}` },
        ]);
        expect(result.current.isQuerying).toBe(false);
        await act(async () => { await result.current.queryNotebook('carnet-test', 'Seconde question'); });
        expect(result.current.messages.at(-1)).toEqual({ role: 'assistant', content: 'Réponse après reprise' });
        expect(result.current.isQuerying).toBe(false);
        expect(appeler).toHaveBeenCalledTimes(2);
    });
});
