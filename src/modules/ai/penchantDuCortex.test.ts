import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Ce que ce test protège : **le cortex choisi penche réellement la recherche.**
 *
 * C'est le seul maillon qui fasse vivre le réglage — le sélecteur sait
 * appliquer un penchant, le magasin sait en porter un, et sans cette ligne
 * aucun des deux ne se rencontre. *Vérifié par dégradation le 2026-08-23 :
 * retirée, elle ne faisait tomber aucun test, et la fonctionnalité entière
 * était morte en silence.*
 */

const getRelevantContext = vi.fn().mockResolvedValue('contexte');

vi.mock('../../stores/useAIStore', () => ({
  useAIStore: { getState: vi.fn(() => ({ liteContext: false, configs: {}, activeProvider: 'ollama' })) },
}));

vi.mock('../session/useSessionOSStore', () => ({
  useSessionOSStore: {
    getState: vi.fn(() => ({
      campaigns: [], activeCampaignId: null, customSheetTemplates: [], customGameDrivers: [],
    })),
  },
}));

vi.mock('./RAGService', () => ({
  ragService: {
    getRelevantContext,
    dernieresSources: undefined,
    dernierCorpus: undefined,
    dernierPenchant: undefined,
  },
}));

const gems = [
  { id: 'sage', name: 'Le Sage', icon: 'BookOpen', description: '', baseInstructions: '', penchant: 'regles' as const },
  { id: 'scribe', name: 'Le Scribe', icon: 'PenTool', description: '', baseInstructions: '', penchant: 'campagne' as const },
  { id: 'le-mien', name: 'Le mien', icon: 'Brain', description: '', baseInstructions: '' },
];

vi.mock('../../stores/useGemStore', () => ({
  useGemStore: { getState: vi.fn(() => ({ gems })) },
}));

Object.defineProperty(globalThis, 'window', { value: { appBridge: { ai: {} } }, writable: true });

const { aiService } = await import('./AIService');

/** Le penchant passé à la recherche au dernier appel. */
const penchantEnvoye = () => getRelevantContext.mock.calls.at(-1)?.[0]?.penchant;

describe('le cortex penche la recherche', () => {
  beforeEach(() => { getRelevantContext.mockClear(); });

  it('le Sage cherche penché RÈGLES', async () => {
    await aiService.prepareSystemPrompt('comment fonctionne le stress ?', undefined, 'sage');
    expect(penchantEnvoye()).toBe('regles');
  });

  it('le Scribe cherche penché CAMPAGNE', async () => {
    /*
      Le cœur de l'idée de David : *« le Sage privilégie les règles, le Scribe
      privilégierait la campagne »*. Sans cette ligne, les deux cherchaient
      exactement pareil et le réglage n'existait que sur l'écran.
    */
    await aiService.prepareSystemPrompt('qui est le suspect ?', undefined, 'scribe');
    expect(penchantEnvoye()).toBe('campagne');
  });

  it('un cortex sans penchant n en envoie AUCUN', async () => {
    // On ne prête pas une intention à qui n'en a pas déclaré : la clé doit être
    // absente, pas valoir « regles ». Le sélecteur distingue les deux.
    await aiService.prepareSystemPrompt('une question', undefined, 'le-mien');
    expect(penchantEnvoye()).toBeUndefined();
    expect('penchant' in (getRelevantContext.mock.calls.at(-1)?.[0] ?? {})).toBe(false);
  });
});
