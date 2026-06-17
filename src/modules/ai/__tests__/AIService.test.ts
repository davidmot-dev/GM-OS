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
          gemini: { provider: 'gemini', apiKey: 'test-key', modelId: 'gemini-1.5-flash' },
          openai: { provider: 'openai', modelId: 'gpt-4o' },
          anthropic: { provider: 'anthropic', modelId: 'claude-3-5-sonnet-latest' }
        },
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
      expect(mockProxyRequest).toHaveBeenCalledWith(
        expect.stringContaining('generativelanguage.googleapis.com'),
        'POST',
        expect.any(Object),
        expect.any(Object)
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
          anthropic: { provider: 'anthropic', apiKey: 'ant-key', modelId: 'claude-3-5-sonnet-latest' }
        },
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
        expect.objectContaining({
          'x-api-key': 'ant-key',
          'anthropic-version': '2023-06-01'
        }),
        expect.objectContaining({
          model: 'claude-3-5-sonnet-latest',
          messages: expect.any(Array)
        })
      );
    });

    it('should handle Anthropic errors', async () => {
        vi.mocked(useAIStore.getState).mockReturnValue({
          activeProvider: 'anthropic',
          configs: {
            gemini: { provider: 'gemini', modelId: 'gemini-1.5-flash' },
            openai: { provider: 'openai', modelId: 'gpt-4o' },
            anthropic: { provider: 'anthropic', apiKey: 'ant-key', modelId: 'claude-3-5-sonnet-latest' }
          },
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
