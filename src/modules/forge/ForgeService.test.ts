import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ForgeService, type ForgeContextItem } from './ForgeService';


const mockGenerateJSON = vi.fn();

vi.mock('../ai/AIService', () => ({
  AIService: {
    getInstance: vi.fn(() => ({
      generateJSON: mockGenerateJSON
    }))
  }
}));

vi.mock('../../stores/useAIStore', () => ({
  useAIStore: {
    getState: vi.fn(() => ({
      activeProvider: 'gemini'
    }))
  }
}));

describe('ForgeService', () => {
  let forgeService: ForgeService;

  beforeEach(() => {
    vi.clearAllMocks();
    forgeService = ForgeService.getInstance();
    mockGenerateJSON.mockResolvedValue({ driver: {}, template: {} });
  });

  it('should be a singleton', () => {
    const instance2 = ForgeService.getInstance();
    expect(forgeService).toBe(instance2);
  });

  describe('forgeSystem', () => {
    it('should consolidate text items correctly', async () => {
      const items: ForgeContextItem[] = [
        { name: 'Rules', type: 'text', content: 'Base Rules' },
        { name: 'Lore', type: 'text', content: 'World Lore' }
      ];

      await forgeService.forgeSystem(items, 'Make it dark', 'GrimDark');

      expect(mockGenerateJSON).toHaveBeenCalledWith(
        expect.stringContaining('CONTENU DU DOCUMENT [Rules] :\n\nBase Rules'),
        expect.any(String),
        expect.any(Array),
        expect.any(Object)
      );
      
      expect(mockGenerateJSON).toHaveBeenCalledWith(
        expect.stringContaining('CONTENU DU DOCUMENT [Lore] :\n\nWorld Lore'),
        expect.any(String),
        expect.any(Array),
        expect.any(Object)
      );
    });

    it('should throw error if using attachments with non-gemini provider', async () => {
      const items: ForgeContextItem[] = [
        { name: 'Doc.pdf', type: 'pdf', content: 'base64data' }
      ];

      // Temporarily change provider mock
      const { useAIStore } = await import('../../stores/useAIStore');
      (useAIStore.getState as any).mockReturnValue({ activeProvider: 'gemma' });

      await expect(forgeService.forgeSystem(items)).rejects.toThrow(
        "Gemma 4 ne supporte pas l'analyse visuelle de multiples fichiers"
      );
    });
  });

  describe('Prompt Generation', () => {
    it('should include target name in creation prompt', async () => {
      const items: ForgeContextItem[] = [{ name: 'Test', type: 'text', content: 'Content' }];
      await forgeService.forgeSystem(items, 'Instruction', 'TargetSystem');

      const calledPrompt = mockGenerateJSON.mock.calls[0][0];
      expect(calledPrompt).toContain('améliorer le système existant nommé "TargetSystem"');
    });
  });
});
