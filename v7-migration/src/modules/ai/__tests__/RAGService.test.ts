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
        { id: 'camp-1', name: 'Cyberpunk Red', system: 'cyberpunk-red' }
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
    // In our mock, systemId -> cyberpunk-red matches template name "Cyberpunk Red" or stays raw
    // For simplicity in this test, we check what it sends
    expect((window as any).appBridge.ai.searchContext).toHaveBeenCalledWith('cyberpunk-red', 'Cyberpunk Red');
  });

  it('should return empty string if bridge is missing', async () => {
    (window as any).appBridge.ai.searchContext = undefined;
    const context = await service.getRelevantContext();
    expect(context).toBe("");
  });
});
