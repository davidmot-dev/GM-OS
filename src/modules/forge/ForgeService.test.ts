import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ForgeService, estErreurAuth, type ForgeContextItem } from './ForgeService';


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

  /**
   * Relevé sur le journal du pont le 2026-08-10, en réel : la lecture d'une
   * source Dune réussissait, était prise pour une expiration de session,
   * déclenchait une reconnexion de quatre secondes, un `healthcheck` inexistant
   * sur ce serveur, un rejeu, puis échouait en `MCP_AUTH_EXPIRED`.
   */
  describe('estErreurAuth', () => {
    it('ne prend pas Feyd-Rautha pour une session expirée', () => {
      const reponse = {
        content: [{ type: 'text', text: "Feyd-Rautha était des leurs. D'authentiques experts." }],
      };
      expect(estErreurAuth(reponse)).toBe(false);
    });

    it('ne voit pas d\'erreur dans un appel qui a réussi, quel qu\'en soit le texte', () => {
      // La correction structurelle : sans `isError`, le texte n'est pas inspecté.
      expect(estErreurAuth({ content: [{ text: 'Unauthorized 401 credentials expired' }] })).toBe(false);
    });

    it('reconnaît un échec d\'authentification annoncé comme tel', () => {
      expect(estErreurAuth({ isError: true, content: [{ text: 'Authentication required' }] })).toBe(true);
      expect(estErreurAuth({ isError: true, content: [{ text: 'Erreur 401' }] })).toBe(true);
      expect(estErreurAuth({ isError: true, content: [{ text: "Échec de l'authentification" }] })).toBe(true);
      expect(estErreurAuth({ isError: true, content: [{ text: 'La session a expiré' }] })).toBe(true);
    });

    it('n\'invente pas une erreur d\'authentification sur un autre échec', () => {
      expect(estErreurAuth({ isError: true, content: [{ text: "Unknown tool: 'healthcheck'" }] })).toBe(false);
      expect(estErreurAuth({ isError: true, content: [{ text: 'Notebook introuvable' }] })).toBe(false);
    });

    it('lit le message d\'une exception', () => {
      expect(estErreurAuth(new Error('MCP_AUTH_EXPIRED: please login again'))).toBe(true);
      expect(estErreurAuth(new Error('ECONNRESET'))).toBe(false);
      // « auteur » a fait partie des faux positifs relevés.
      expect(estErreurAuth(new Error("Le champ auteur est absent"))).toBe(false);
    });

    it('ignore le vide sans se plaindre', () => {
      expect(estErreurAuth(null)).toBe(false);
      expect(estErreurAuth(undefined)).toBe(false);
      expect(estErreurAuth(0)).toBe(false);
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

  /**
   * La boucle du corpus de règles. Ce que ces tests verrouillent tient en une
   * phrase : **la Forge pose les gabarits v3, et rien n'atteint le disque sans
   * être passé par la conversion locale.**
   */
  describe('corpus de règles', () => {
    const callTool = vi.fn();

    beforeEach(() => {
      callTool.mockReset();
      (window as unknown as { appBridge: unknown }).appBridge = { mcp: { callTool } };
    });

    /** La requête envoyée au carnet lors du n-ième appel. */
    const requete = (n = 0) => callTool.mock.calls[n][2].query as string;

    describe('discoverCandidates', () => {
      const INVENTAIRE = `| Sujet | Traité | Mécanique | Sections |
|---|---|---|---|
| Résolution des jets | oui | 2d20 sous compétence. | Agir |`;

      it('pose le gabarit d\'inventaire, la liste des sujets fournie', async () => {
        callTool.mockResolvedValue({ content: INVENTAIRE });
        await forgeService.discoverCandidates('nb-1', ['src-1']);

        const prompt = requete();
        expect(prompt).toContain('Résolution des jets');
        expect(prompt).toContain('Poursuites');
        // Le « et autres » de la v0 est ce qui faisait dériver la taxonomie.
        expect(prompt).not.toContain('intéressants à formaliser');
      });

      it('ne demande plus de numéros de page — le carnet les fabrique', async () => {
        callTool.mockResolvedValue({ content: INVENTAIRE });
        await forgeService.discoverCandidates('nb-1');

        expect(requete()).toContain('TITRES EXACTS');
        expect(requete()).toContain("N'indique aucun numéro\nde page");
      });

      it('transmet le filtre de sources au carnet', async () => {
        callTool.mockResolvedValue({ content: INVENTAIRE });
        await forgeService.discoverCandidates('nb-1', ['src-1', 'src-2']);

        expect(callTool.mock.calls[0][2]).toMatchObject({
          notebook_id: 'nb-1',
          source_ids: ['src-1', 'src-2'],
        });
      });

      it('rend les treize sujets même quand le carnet en omet', async () => {
        callTool.mockResolvedValue({ content: INVENTAIRE });
        const candidats = await forgeService.discoverCandidates('nb-1');

        expect(candidats).toHaveLength(13);
        expect(candidats.map(c => c.id)).toContain('poursuites');
      });
    });

    describe('forgeCard', () => {
      const FICHE = `## Métadonnées
- sujet : Monnaie de table ou ressource partagée
- couverture : complète
- sources : Dune
- sections : « Élan » ; « Menace »

## Règle
L'élan se dépense.`;

      const candidat = {
        id: 'monnaie-de-table',
        title: 'Monnaie de table',
        category: 'rule' as const,
        summary: '',
        tags: [],
      };

      it('pose le gabarit de fiche, avec ses six sections et ses interdits', async () => {
        callTool.mockResolvedValue({ content: FICHE });
        await forgeService.forgeCard('nb-1', candidat, 'dune');

        const prompt = requete();
        expect(prompt).toContain('« Monnaie de table »');
        expect(prompt).toContain('## Cas limites');
        expect(prompt).toContain('## Non couvert');
        expect(prompt).toContain("N'indique JAMAIS de numéro de page");
        // Sans elle, un sujet non couvert produit du générique plausible.
        expect(prompt).toContain('couverture : absente');
        expect(prompt).not.toContain('Markdown riche');
      });

      it('rend une fiche convertie, frontmatter compris', async () => {
        callTool.mockResolvedValue({ content: FICHE });
        const card = await forgeService.forgeCard('nb-1', candidat, 'dune');

        expect(card.content.startsWith('---\n')).toBe(true);
        expect(card.content).toContain('sujet: Monnaie de table');
        expect(card.content).toContain('systeme: dune');
        expect(card.slug).toBe('monnaie-de-table');
        expect(card.sections).toEqual(['Élan', 'Menace']);
      });

      it('remonte les avertissements de conversion au lieu de les taire', async () => {
        callTool.mockResolvedValue({ content: FICHE.replace(/- sections :.*/, '- sections :') });
        const card = await forgeService.forgeCard('nb-1', candidat, 'dune');

        expect(card.avertissements.length).toBeGreaterThan(0);
      });
    });

    describe('forgePersonas', () => {
      const huit = JSON.stringify({
        sage: 'a', scribe: 'b', oracle: 'c', bard: 'd',
        alchemist: 'e', actor: 'f', cartographer: 'g', strategist: 'h',
      });

      it('enchaîne la fiche de voix puis les huit personas', async () => {
        callTool
          .mockResolvedValueOnce({ content: '## Registre\nSec et tendu.' })
          .mockResolvedValueOnce({ content: huit });

        const resultat = await forgeService.forgePersonas('nb-1');

        expect(callTool).toHaveBeenCalledTimes(2);
        expect(requete(0)).toContain('la VOIX de ce jeu');
        expect(requete(1)).toContain('la fiche de voix que tu viens de produire');
        expect(resultat.voix).toContain('Sec et tendu.');
        expect(resultat.personas.strategist).toBe('h');
      });

      it('échoue plutôt que de rendre des personas trouées', async () => {
        callTool
          .mockResolvedValueOnce({ content: 'voix' })
          .mockResolvedValueOnce({ content: '{"sage": "a"}' });

        await expect(forgeService.forgePersonas('nb-1')).rejects.toThrow(/scribe/);
      });
    });
  });
});
