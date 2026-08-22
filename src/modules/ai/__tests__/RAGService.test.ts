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

  /**
   * **Ce test affirmait exactement le défaut**, et c'est pour ça qu'il change de
   * sens plutôt que de disparaître.
   *
   * `reindex(vaultPath)` déclenchait `setDocsPath` dans le processus principal :
   * le coffre Obsidian *remplaçait* la racine documentaire du moteur. Tout
   * `docs/` sortait de l'index — le corpus, les campagnes, `.ragignore` — et la
   * recherche ne retenait plus rien. Le coffre étant renseigné **en dur par
   * défaut** dans `useObsidianStore`, personne n'avait à le demander.
   *
   * Rien ne le disait : l'Oracle répondait de sa propre mémoire, avec aplomb.
   *
   * *Deux arbres, une seule variable de racine, le dernier écrivain gagne.* Le
   * coffre reste lisible par le pont Obsidian, qui reçoit son chemin en argument
   * et n'a jamais eu besoin de cette racine. `electron/racineDuCorpus.test.ts`
   * tient l'autre bout : le moteur n'offre plus de quoi la déplacer.
   */
  it('ne déplace jamais la racine du moteur, même avec un coffre renseigné', async () => {
    await service.getRelevantContext();
    expect((window as any).appBridge.ai.reindex).not.toHaveBeenCalled();
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
