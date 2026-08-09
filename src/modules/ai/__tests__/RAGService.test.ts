import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RAGService } from '../RAGService';
import { useSessionOSStore } from '../../session/useSessionOSStore';
import { useObsidianStore } from '../../session/useObsidianStore';

// Mock stores
vi.mock('../../session/useSessionOSStore', () => ({
  useSessionOSStore: {
    getState: vi.fn()
  }
}));

vi.mock('../../session/useObsidianStore', () => ({
  useObsidianStore: {
    getState: vi.fn()
  }
}));

describe('RAGService', () => {
  let service: RAGService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = RAGService.getInstance();
    
    // Default mock setup
    (useSessionOSStore.getState as any).mockReturnValue({
      campaigns: [
        {
          id: 'camp-1',
          name: 'Cyberpunk Red',
          system: 'cyberpunk-red',
          campaignPath: 'campaigns/night-city',
        }
      ],
      activeCampaignId: 'camp-1',
      customSheetTemplates: []
    });

    (useObsidianStore.getState as any).mockReturnValue({
      vaultPath: 'C:/Vault'
    });

    // Mock window.appBridge
    (window as any).appBridge = {
      ai: {
        searchContext: vi.fn().mockResolvedValue('Some context'),
        reindex: vi.fn().mockResolvedValue(true)
      }
    };
  });

  it('should trigger reindex with vault path if available', async () => {
    await service.getRelevantContext();
    expect((window as any).appBridge.ai.reindex).toHaveBeenCalledWith('C:/Vault');
  });

  it('should call searchContext with correct system and campaign name', async () => {
    await service.getRelevantContext();
    // L'identifiant nomme le dossier `docs/systems/<id>`, pas le nom affiché.
    expect((window as any).appBridge.ai.searchContext).toHaveBeenCalledWith(
      'cyberpunk-red',
      'Cyberpunk Red',
      expect.objectContaining({ campaignPath: 'campaigns/night-city' }),
    );
  });

  it('transmet la question au moteur', async () => {
    // Sans elle, le moteur ne peut trier que par système : c'est le défaut
    // que `prepareSystemPrompt(_prompt, …)` rendait invisible.
    await service.getRelevantContext({ query: 'combien de dés pour un jet ?' });
    expect((window as any).appBridge.ai.searchContext).toHaveBeenCalledWith(
      'cyberpunk-red',
      'Cyberpunk Red',
      expect.objectContaining({ query: 'combien de dés pour un jet ?' }),
    );
  });

  it('should return empty string if bridge is missing', async () => {
    (window as any).appBridge.ai.searchContext = undefined;
    const context = await service.getRelevantContext();
    expect(context).toBe("");
  });
});
