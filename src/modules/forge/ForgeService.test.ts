import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ForgeService, estErreurAuth, type ForgeContextItem } from './ForgeService';
import { CANEVAS } from './rules/canevas';
import { GROUPES } from './rules/GroupesDeChamps';


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
      // Le refus reel de Google, releve le 2026-08-10 : la frontiere de mot
      // echoue sur UN-AUTHENTICATED, il lui faut donc son propre motif.
      expect(estErreurAuth(new Error('Google rejected the query (error code 16: UNAUTHENTICATED).'))).toBe(true);
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

      it('distingue un sujet omis d\'un sujet traité', async () => {
        /**
         * Sans cette distinction, l'inventaire annonçait « 13 sujets sur 13
         * traités » sur une réponse qui n'en couvrait aucun — l'absence rendue
         * invisible, exactement ce que le canevas existe pour empêcher.
         */
        callTool.mockResolvedValue({ content: INVENTAIRE });
        const { candidats } = await forgeService.discoverCandidates('nb-1');

        expect(candidats.find(c => c.id === 'resolution-des-jets')!.tags[0]).toBe('oui');
        expect(candidats.find(c => c.id === 'poursuites')!.tags[0]).toBe('sans reponse');
      });

      it('rend aussi la synthèse brute, au lieu de la jeter', async () => {
        // Dix mille caractères de synthèse partaient à la poubelle : la
        // procédure prescrit de l'enregistrer comme fiche du corpus.
        callTool.mockResolvedValue({ content: INVENTAIRE });
        const { inventaire } = await forgeService.discoverCandidates('nb-1');
        expect(inventaire).toBe(INVENTAIRE);
      });

      it('rend tous les sujets du canevas même quand le carnet en omet', async () => {
        callTool.mockResolvedValue({ content: INVENTAIRE });
        const { candidats } = await forgeService.discoverCandidates('nb-1');

        // Compté depuis le canevas, pas figé : il en a gagné un quatorzième le
        // 2026-08-11, et un test qui gèle ce nombre échoue à chaque évolution
        // du périmètre plutôt qu'à chaque régression.
        expect(candidats).toHaveLength(CANEVAS.length);
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

      const SECONDE_MOITIE = `## À la table
On dépense l'élan avant le jet.

## Cas limites
L'élan se perd en fin de scène.

## Non couvert
rien`;

      const candidat = {
        id: 'monnaie-de-table',
        title: 'Monnaie de table',
        category: 'rule' as const,
        summary: '',
        tags: [],
      };

      it('scinde la fiche en deux requetes, la seconde apres la premiere', async () => {
        /**
         * Le gabarit entier depassait le delai de lecture du serveur : 356
         * secondes, puis « Query failed: The read operation timed out ».
         * L inventaire, deux fois plus leger, revenait en 72 secondes.
         */
        callTool
          .mockResolvedValueOnce({ content: FICHE })
          .mockResolvedValueOnce({ content: SECONDE_MOITIE });

        await forgeService.forgeCard('nb-1', candidat, 'dune');

        expect(callTool).toHaveBeenCalledTimes(2);
        expect(requete(0)).toContain('PREMIÈRE MOITIÉ');
        expect(requete(0)).toContain('## Valeurs');
        expect(requete(0)).not.toContain('## Cas limites');
        expect(requete(1)).toContain('SECONDE MOITIÉ');
        expect(requete(1)).toContain('## Cas limites');
        expect(requete(1)).not.toContain('## Métadonnées');
      });

      it('rappelle le sujet dans la seconde moitie', async () => {
        // Rien ne garantit que le carnet garde le fil d une requete a l autre :
        // une seconde moitie qui parlerait d autre chose serait pire qu absente.
        callTool
          .mockResolvedValueOnce({ content: FICHE })
          .mockResolvedValueOnce({ content: SECONDE_MOITIE });
        await forgeService.forgeCard('nb-1', candidat, 'dune');
        expect(requete(1)).toContain('Monnaie de table');
      });

      it('assemble les six sections en une seule fiche', async () => {
        callTool
          .mockResolvedValueOnce({ content: FICHE })
          .mockResolvedValueOnce({ content: SECONDE_MOITIE });

        const card = await forgeService.forgeCard('nb-1', candidat, 'dune');

        expect(card.content).toContain('## Règle');
        expect(card.content).toContain('## À la table');
        expect(card.content).toContain('## Non couvert');
      });

      it('remet la premiere moitie avant de lancer la seconde', async () => {
        /**
         * C est ce qui rend la scission utile plutot que seulement plus lente :
         * une moitie acquise ne doit pas dependre du sort de l autre.
         */
        const vues: string[] = [];
        callTool
          .mockResolvedValueOnce({ content: FICHE })
          .mockImplementationOnce(async () => {
            expect(vues).toHaveLength(1);      // deja remise, avant cet appel
            return { content: SECONDE_MOITIE };
          });

        await forgeService.forgeCard('nb-1', candidat, 'dune', undefined, {
          surMoitie: regle => vues.push(regle),
        });

        expect(vues[0]).toContain('## Règle');
      });

      it('ne repaie pas une premiere moitie deja obtenue', async () => {
        callTool.mockResolvedValueOnce({ content: SECONDE_MOITIE });

        const card = await forgeService.forgeCard('nb-1', candidat, 'dune', undefined, {
          moitieDeja: FICHE,
        });

        expect(callTool).toHaveBeenCalledTimes(1);
        expect(requete(0)).toContain('SECONDE MOITIÉ');
        expect(card.content).toContain('## Règle');
        expect(card.content).toContain('## À la table');
      });

      it('pose le gabarit de fiche, avec ses interdits sur les deux moitiés', async () => {
        callTool.mockResolvedValue({ content: FICHE });
        await forgeService.forgeCard('nb-1', candidat, 'dune');

        // Les interdits valent sur les deux moitiés : ils sont communs.
        expect(requete(0)).toContain('« Monnaie de table »');
        expect(requete(0)).toContain("N'indique JAMAIS de numéro de page");
        // Sans elle, un sujet non couvert produit du générique plausible.
        expect(requete(0)).toContain('couverture : absente');
        expect(requete(0)).not.toContain('Markdown riche');
        expect(requete(1)).toContain("N'indique JAMAIS de numéro de page");
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

/**
 * **Le canevas du pilote — ce que la Forge Système a le droit de demander.**
 *
 * Le défaut que ces tests attrapent n'est pas une absence, c'est un mensonge :
 * l'exemple de sortie du prompt codait en dur `"fieldId": "hp"`,
 * `"isMainHP": true`, `"initiativeFormula": "dex"` et `"defaultHealthType":
 * "hp"`. C'était le SEUL modèle que l'IA avait sous les yeux, et il enseignait
 * que tout jeu a des points de vie et une Dextérité.
 *
 * Un étalon faux est pire qu'un étalon absent — celui-ci, le modèle le copie.
 */
describe('canevas du pilote', () => {
  const forge = ForgeService.getInstance();

  /** Le prompt réellement envoyé, pour une forge quelconque. */
  const promptDeForge = async () => {
    mockGenerateJSON.mockClear();
    const { useAIStore } = await import('../../stores/useAIStore');
    (useAIStore.getState as any).mockReturnValue({ activeProvider: 'gemini' });
    await forge.forgeSystem([{ name: 'Livre', type: 'text', content: 'Des règles.' }]);
    return mockGenerateJSON.mock.calls[0][0] as string;
  };

  it('n\'enseigne plus que tout jeu a des points de vie', async () => {
    const p = await promptDeForge();
    expect(p, "l'exemple ne doit marquer aucune jauge de vie principale").not.toContain('"isMainHP": true');
    expect(p).not.toContain('"defaultHealthType": "hp"');
    expect(p).not.toContain('"initiativeFormula": "dex"');
  });

  it('dit explicitement que tous les jeux n\'ont pas de PV ni d\'ordre d\'initiative', async () => {
    const p = await promptDeForge();
    expect(p).toContain('AUCUNE jauge de points de vie');
    expect(p).toContain("n'ordonnent PAS leurs combattants");
    expect(p).toContain('réserves partagées par toute la table');
  });

  it('demande les quatre champs que les murs ont ajoutés', async () => {
    const p = await promptDeForge();
    for (const champ of ['"jet"', '"ressourcesDeTable"', '"initiative"', '"tacheDeDefaite"']) {
      expect(p, `le pilote ne saurait pas déclarer ${champ}`).toContain(champ);
    }
  });

  it('ne demande plus les champs morts', async () => {
    /**
     * `aiInstructions` n'atteint aucun modèle — vérifié le 2026-08-10, l'invite
     * se construit depuis la gemme, le `gems.json` du corpus et les
     * `aiPersonas` du gabarit. `critRange` n'a aucun lecteur. Une forge qui
     * remplit des champs morts est invérifiable.
     */
    const p = await promptDeForge();
    expect(p).not.toContain('aiInstructions');
    expect(p).not.toContain('critRange');
  });

  it('interdit d\'inventer avant toute autre consigne', async () => {
    const p = await promptDeForge();
    expect(p).toContain("N'INVENTE RIEN");
    expect(p).toContain('OMETS le champ');
    // Un champ inventé s'applique en séance sans que personne ne l'ait choisi.
    expect(p).toContain("jamais par analogie");
  });

  it('exige que la réserve qui paie les dés existe', async () => {
    const p = await promptDeForge();
    expect(p).toContain('DOIT exister dans "driver.ressourcesDeTable"');
  });
});

/**
 * **La forge dérivée du corpus.** Ce que ces tests verrouillent : un groupe qui
 * échoue n'emporte pas les autres, et un groupe sans fiche ne part pas du tout.
 */
describe('forgeSystemDepuisCorpus', () => {
  const forge = ForgeService.getInstance();

  const fiches = [
    { sujet: 'Résolution des jets', contenu: 'Chaque dé sous le seuil est une réussite.' },
    { sujet: 'Degrés de réussite et critiques', contenu: 'Le 1 naturel vaut double.' },
    { sujet: 'Initiative et déroulement du tour', contenu: "L'initiative alterne entre camps." },
  ];
  const groupeJet = GROUPES.find(g => g.id === 'jet')!;
  const groupeInit = GROUPES.find(g => g.id === 'initiative')!;
  const groupePortees = GROUPES.find(g => g.id === 'portees')!;

  it('un appel par groupe, et les fragments se rejoignent', async () => {
    mockGenerateJSON.mockReset();
    mockGenerateJSON
      .mockResolvedValueOnce({ driver: { dice: { defaultDice: '2d20' } } })
      .mockResolvedValueOnce({ driver: { combat: { initiativeFormula: '' } } });

    const { resultat, echecs } = await forge.forgeSystemDepuisCorpus(fiches, {
      groupes: [groupeJet, groupeInit],
    });

    expect(mockGenerateJSON).toHaveBeenCalledTimes(2);
    expect(resultat.driver).toMatchObject({
      dice: { defaultDice: '2d20' },
      combat: { initiativeFormula: '' },
    });
    expect(echecs).toEqual([]);
  });

  it('n\'appelle pas le modèle pour un groupe sans fiche', async () => {
    /**
     * L'appel coûterait des minutes pour que le modèle comble un vide — ce qui
     * est exactement l'inverse du but. Mieux vaut le dire comme une lacune.
     */
    mockGenerateJSON.mockReset();

    const { resultat, echecs } = await forge.forgeSystemDepuisCorpus(fiches, {
      groupes: [groupePortees],
    });

    expect(mockGenerateJSON).not.toHaveBeenCalled();
    expect(resultat).toEqual({});
    expect(echecs).toEqual([{ groupe: 'portees', raison: 'aucune fiche du corpus ne couvre ce sujet' }]);
  });

  it('un groupe qui echoue n\'emporte pas les autres', async () => {
    // Une forge dure des minutes : perdre le travail acquis parce qu'un
    // fragment est bancal serait le pire des comportements.
    mockGenerateJSON.mockReset();
    mockGenerateJSON
      .mockRejectedValueOnce(new Error('JSON illisible'))
      .mockResolvedValueOnce({ driver: { combat: { initiativeFormula: '' } } });

    const { resultat, echecs } = await forge.forgeSystemDepuisCorpus(fiches, {
      groupes: [groupeJet, groupeInit],
    });

    expect(resultat.driver!.combat).toMatchObject({ initiativeFormula: '' });
    expect(echecs).toEqual([{ groupe: 'jet', raison: 'JSON illisible' }]);
  });

  it('un objet vide est signalé comme une lacune, pas comme un succès', async () => {
    mockGenerateJSON.mockReset();
    mockGenerateJSON.mockResolvedValueOnce({});

    const { echecs } = await forge.forgeSystemDepuisCorpus(fiches, { groupes: [groupeJet] });
    expect(echecs).toEqual([{ groupe: 'jet', raison: 'le modèle a rendu un objet vide' }]);
  });

  it('rend compte de l\'avancement, groupe par groupe', async () => {
    // Une forge de huit groupes dure un quart d'heure : sans compteur, on ne
    // sait pas si elle avance ou si elle est morte.
    mockGenerateJSON.mockReset();
    mockGenerateJSON.mockResolvedValue({ driver: { name: 'X' } });
    const vus: string[] = [];

    await forge.forgeSystemDepuisCorpus(fiches, {
      groupes: [groupeJet, groupeInit],
      onProgres: (g, rang, total) => vus.push(`${rang}/${total} ${g.id}`),
    });

    expect(vus).toEqual(['1/2 jet', '2/2 initiative']);
  });

  it('s\'arrête entre deux groupes quand on abandonne, et rend l\'acquis', async () => {
    /**
     * Un bouton qui cesserait d'afficher sans rien arrêter mentirait sur un
     * quart d'heure d'attente. Ce qui est déjà forgé n'est pas perdu pour
     * autant, et les groupes non traités partent au journal des lacunes.
     */
    mockGenerateJSON.mockReset();
    mockGenerateJSON.mockResolvedValue({ driver: { dice: { defaultDice: '2d20' } } });
    let stop = false;

    const { resultat, echecs, interrompue } = await forge.forgeSystemDepuisCorpus(fiches, {
      groupes: [groupeJet, groupeInit],
      onProgres: () => { stop = true; },
      abandonne: () => stop,
    });

    expect(mockGenerateJSON).toHaveBeenCalledTimes(1);
    expect(resultat.driver).toMatchObject({ dice: { defaultDice: '2d20' } });
    expect(interrompue).toBe(true);
    expect(echecs).toEqual([
      { groupe: 'initiative', raison: 'dérivation interrompue avant ce groupe' },
    ]);
  });
});
