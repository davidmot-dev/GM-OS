import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RAGService } from '../RAGService';
import type { SessionOSState } from '../../session/useSessionOSStore';
import type { useObsidianStore } from '../../session/useObsidianStore';

type EtatPourRecherche = Pick<SessionOSState, 'activeCampaignId' | 'customSheetTemplates'> & {
  campaigns: Pick<SessionOSState['campaigns'][number], 'id' | 'name' | 'system' | 'campaignPath'>[];
};
const magasins = vi.hoisted(() => ({
  session: vi.fn<() => EtatPourRecherche>(),
  obsidian: vi.fn<() => Pick<ReturnType<typeof useObsidianStore.getState>, 'vaultPath'>>(),
}));
type PontIA = NonNullable<NonNullable<Window['appBridge']>['ai']>;
// L'ancien moteur rendait une chaîne ; le service continue d'accepter cette forme.
const recherche = vi.fn<(...args: Parameters<PontIA['searchContext']>) =>
  Promise<Awaited<ReturnType<PontIA['searchContext']>> | string>>();
const reindexation = vi.fn<PontIA['reindex']>();
const pontRecherche: { searchContext: typeof recherche | undefined; reindex: typeof reindexation } = {
  searchContext: recherche, reindex: reindexation,
};

// Mock stores
vi.mock('../../session/useSessionOSStore', () => ({
  useSessionOSStore: {
    getState: magasins.session
  }
}));

vi.mock('../../session/useObsidianStore', () => ({
  useObsidianStore: {
    getState: magasins.obsidian
  }
}));

describe('RAGService', () => {
  let service: RAGService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = RAGService.getInstance();
    
    // Default mock setup
    magasins.session.mockReturnValue({
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

    magasins.obsidian.mockReturnValue({
      vaultPath: 'C:/Vault'
    });

    // Mock window.appBridge
    recherche.mockResolvedValue('Some context');
    reindexation.mockResolvedValue(true);
    pontRecherche.searchContext = recherche;
    Object.defineProperty(window, 'appBridge', { configurable: true, writable: true,
      value: { ai: pontRecherche } });
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
    expect(reindexation).not.toHaveBeenCalled();
  });

  it('should call searchContext with correct system and campaign name', async () => {
    await service.getRelevantContext();
    // L'identifiant nomme le dossier `docs/systems/<id>`, pas le nom affiché.
    expect(recherche).toHaveBeenCalledWith(
      'cyberpunk-red',
      'Cyberpunk Red',
      expect.objectContaining({ campaignPath: 'campaigns/night-city' }),
    );
  });

  it('transmet la question au moteur', async () => {
    // Sans elle, le moteur ne peut trier que par système : c'est le défaut
    // que `prepareSystemPrompt(_prompt, …)` rendait invisible.
    await service.getRelevantContext({ query: 'combien de dés pour un jet ?' });
    expect(recherche).toHaveBeenCalledWith(
      'cyberpunk-red',
      'Cyberpunk Red',
      expect.objectContaining({ query: 'combien de dés pour un jet ?' }),
    );
  });

  it('should return empty string if bridge is missing', async () => {
    pontRecherche.searchContext = undefined;
    const context = await service.getRelevantContext();
    expect(context).toBe("");
  });
});
