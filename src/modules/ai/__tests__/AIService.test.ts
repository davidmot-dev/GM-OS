import { describe, it, expect, vi, beforeEach } from 'vitest';
import { aiService } from '../AIService';
import { useAIStore } from '../../../stores/useAIStore';

// Mock the stores
vi.mock('../../../stores/useAIStore', () => ({
  useAIStore: {
    getState: vi.fn()
  }
}));

vi.mock('../../session/useSessionOSStore', () => ({
  useSessionOSStore: {
    getState: vi.fn(() => ({
      campaigns: [],
      activeCampaignId: null,
      customSheetTemplates: []
    }))
  }
}));

vi.mock('../RAGService', () => ({
  ragService: {
    getRelevantContext: vi.fn().mockResolvedValue("Context matching test.")
  }
}));

// Mock appBridge
const mockProxyRequest = vi.fn();

Object.defineProperty(globalThis, 'window', {
  value: {
    appBridge: {
      ai: {
        proxyRequest: mockProxyRequest
      }
    }
  },
  writable: true
});

describe('AIService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateText - Gemini', () => {
    it('should call Gemini API via proxy', async () => {
      // Setup store mock
      vi.mocked(useAIStore.getState).mockReturnValue({
        activeProvider: 'gemini',
        configs: {
          gemini: { provider: 'gemini', modelId: 'gemini-1.5-flash' },
          openai: { provider: 'openai', modelId: 'gpt-4o' },
          anthropic: { provider: 'anthropic', modelId: 'claude-3-5-sonnet-latest' }
        },
        /* La cle vit au coffre : le magasin n'en dit que la presence. */
        aUneCle: () => true,
        setProvider: vi.fn(),
        updateConfig: vi.fn(),
        getApiKey: vi.fn()
      } as any);

      // Setup bridge mock
      mockProxyRequest.mockResolvedValue({
        ok: true,
        status: 200,
        data: {
          candidates: [{ content: { parts: [{ text: 'Hello from Gemini' }] } }]
        }
      });

      const response = await aiService.generateText('Bonjour');

      expect(response.text).toBe('Hello from Gemini');
      /* Le cinquieme argument est le fournisseur declare : c'est lui qui
         autorise l'hote cote processus principal, et la cle de Gemini voyage
         DANS l'URL. Voir `electron/hotesDesFournisseurs.ts`. */
      expect(mockProxyRequest).toHaveBeenCalledWith(
        expect.stringContaining('generativelanguage.googleapis.com'),
        'POST',
        expect.any(Object),
        expect.any(Object),
        'gemini'
      );
    });
  });

  describe('generateText - Anthropic', () => {
    it('should call Anthropic API via proxy', async () => {
      // Setup store mock
      vi.mocked(useAIStore.getState).mockReturnValue({
        activeProvider: 'anthropic',
        configs: {
          gemini: { provider: 'gemini', modelId: 'gemini-1.5-flash' },
          openai: { provider: 'openai', modelId: 'gpt-4o' },
          anthropic: { provider: 'anthropic', modelId: 'claude-3-5-sonnet-latest' }
        },
        /* La cle vit au coffre : le magasin n'en dit que la presence. */
        aUneCle: () => true,
        setProvider: vi.fn(),
        updateConfig: vi.fn(),
        getApiKey: vi.fn()
      } as any);

      // Setup bridge mock
      mockProxyRequest.mockResolvedValue({
        ok: true,
        status: 200,
        data: {
          content: [{ type: 'text', text: 'Hello from Claude' }]
        }
      });

      const response = await aiService.generateText('Bonjour');

      expect(response.text).toBe('Hello from Claude');
      expect(mockProxyRequest).toHaveBeenCalledWith(
        'https://api.anthropic.com/v1/messages',
        'POST',
        /*
          ⛔ **La clé n'est PLUS dans les en-têtes, et c'est le contrat.**

          Elle est posée par le processus principal, depuis le coffre, au vu du
          fournisseur déclaré (`electron/clesDesFournisseurs.ts`). Ce test
          atteste donc son absence : une clé qui reparaîtrait ici voudrait dire
          que l'écran s'est remis à l'assembler, et que le mélange entre
          fournisseurs est rouvert.
        */
        expect.objectContaining({
          'anthropic-version': '2023-06-01'
        }),
        expect.objectContaining({
          model: 'claude-3-5-sonnet-latest',
          messages: expect.any(Array)
        }),
        'anthropic'
      );

      const entetes = mockProxyRequest.mock.calls[0][2] as Record<string, string>;
      expect(entetes['x-api-key'], 'la clé ne doit plus traverser le pont').toBeUndefined();
      expect(entetes.Authorization).toBeUndefined();
    });

    it('should handle Anthropic errors', async () => {
        vi.mocked(useAIStore.getState).mockReturnValue({
          activeProvider: 'anthropic',
          configs: {
            gemini: { provider: 'gemini', modelId: 'gemini-1.5-flash' },
            openai: { provider: 'openai', modelId: 'gpt-4o' },
            anthropic: { provider: 'anthropic', modelId: 'claude-3-5-sonnet-latest' }
          },
          aUneCle: () => true,
          setProvider: vi.fn(),
          updateConfig: vi.fn(),
          getApiKey: vi.fn()
        } as any);
  
        mockProxyRequest.mockResolvedValue({
          ok: false,
          status: 401,
          statusText: 'Unauthorized',
          data: { error: { message: 'Invalid API Key' } }
        });
  
        await expect(aiService.generateText('Bonjour')).rejects.toThrow('Erreur API Anthropic (401): Invalid API Key');
      });
  });
});
