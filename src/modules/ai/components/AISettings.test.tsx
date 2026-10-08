import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, waitFor } from '@testing-library/react';
import AISettings from './AISettings';
import { useAIStore } from '../../../stores/useAIStore';
import { aiService } from '../AIService';

const actions = vi.hoisted(() => ({ synchroniser: vi.fn(), modifier: vi.fn() }));
vi.mock('../AIService', () => ({ aiService: { listModels: vi.fn(async () => ['gemini-test']) } }));
vi.mock('./ReglagesDImage', () => ({ default: () => null }));
vi.mock('../../../stores/useGemStore', () => ({ useGemStore: () => ({
    gems: [], updateGem: actions.modifier, syncGemsWithDefaults: actions.synchroniser,
}) }));
vi.mock('../../session/useSessionOSStore', () => ({
    useSessionOSStore: (selecteur: (etat: { campaigns: []; activeCampaignId: null }) => unknown) =>
        selecteur({ campaigns: [], activeCampaignId: null }),
}));

describe('AISettings — déclencheurs de la liste des modèles', () => {
    const origine = useAIStore.getState();
    const pontInitial = window.appBridge;
    const lister = vi.fn(async () => ['ollama-test']);

    beforeEach(() => {
        vi.clearAllMocks();
        useAIStore.setState({ ...origine, activeProvider: 'ollama', clesPresentes: {},
            syncWithKeychain: actions.synchroniser });
        window.appBridge = { ai: { ollamaListModels: lister } } as unknown as typeof window.appBridge;
    });
    afterEach(() => {
        useAIStore.setState(origine, true);
        window.appBridge = pontInitial;
    });

    it('actualise la liste pour une nouvelle adresse, sans la recharger à chaque réglage', async () => {
        render(<AISettings />);
        await waitFor(() => expect(lister).toHaveBeenCalledTimes(1));
        act(() => useAIStore.setState(s => ({ configs: { ...s.configs,
            ollama: { ...s.configs.ollama, temperature: 0.75 },
            ollama_cloud: { ...s.configs.ollama_cloud, endpoint: 'https://autre.example' },
        } })));
        expect(lister).toHaveBeenCalledTimes(1);
        act(() => useAIStore.setState(s => ({ configs: { ...s.configs,
            ollama: { ...s.configs.ollama, endpoint: 'http://localhost:9999' },
        } })));
        await waitFor(() => expect(lister).toHaveBeenCalledTimes(2));
        expect(lister).toHaveBeenLastCalledWith('http://localhost:9999');
    });

    it('attend la présence de la clé Gemini puis charge les modèles', async () => {
        useAIStore.setState({ activeProvider: 'gemini' });
        render(<AISettings />);
        expect(aiService.listModels).not.toHaveBeenCalled();
        act(() => useAIStore.setState({ clesPresentes: { gemini: true } }));
        await waitFor(() => expect(aiService.listModels).toHaveBeenCalledTimes(1));
        expect(lister).not.toHaveBeenCalled();
    });
});
