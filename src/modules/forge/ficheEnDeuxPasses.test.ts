import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ForgeService } from './ForgeService';
import { GROUPES, promptDesChamps, promptDesSections, type FicheDuCorpus } from './rules/GroupesDeChamps';

const mockGenerateJSON = vi.fn();

vi.mock('../ai/AIService', () => ({
  AIService: { getInstance: vi.fn(() => ({ generateJSON: mockGenerateJSON })) },
}));
vi.mock('../../stores/useAIStore', () => ({
  useAIStore: { getState: vi.fn(() => ({ activeProvider: 'ollama' })) },
}));

/**
 * Ce que ces tests protègent : **la fiche de personnage ne part plus d'un seul
 * bloc**.
 *
 * C'est la plus grosse sortie de la dérivation, et au-delà de quelques
 * centaines de tokens `gemma4:12b` déraille — il se met à échapper ses
 * guillemets (`{"id\":\"agilite\"`). Le piège est que cela reste du JSON
 * *grammaticalement valide* : la grammaire de `format: 'json'` ne peut pas
 * l'arrêter, et le décodage glouton n'y change rien. Constaté sur Alien le
 * 2026-08-12, deux fois.
 *
 * La leçon était écrite au plan et acquise à l'Atelier avant lui : *le
 * découpage vaut pour la sortie autant que pour l'entrée, parce qu'aucune
 * petite réponse ne dérape.*
 */

const fiches: FicheDuCorpus[] = [
  { sujet: 'Composition de la fiche de personnage', contenu: 'Quatre attributs, douze compétences.' },
  { sujet: 'Jauges et ressources individuelles', contenu: 'Le Stress monte, la Santé descend.' },
];

const groupeFiche = GROUPES.find(g => g.id === 'fiche')!;

describe('la fiche se forge section par section', () => {
  beforeEach(() => mockGenerateJSON.mockReset());

  it('annonce les sections, puis demande les champs de chacune', async () => {
    mockGenerateJSON
      .mockResolvedValueOnce({ template: { name: 'Fiche', emoji: '📜', sections: [
        { id: 'attributs', label: 'Attributs' },
        { id: 'jauges', label: 'Jauges' },
      ] } })
      .mockResolvedValueOnce({ fields: [{ id: 'force', label: 'Force', type: 'number' }] })
      .mockResolvedValueOnce({ fields: [{ id: 'stress', label: 'Stress', type: 'gauge' }] });

    const { resultat } = await ForgeService.getInstance()
      .forgeSystemDepuisCorpus(fiches, { groupes: [groupeFiche] });

    // Une passe d'annonce, puis une par section.
    expect(mockGenerateJSON).toHaveBeenCalledTimes(3);
    expect(resultat.template?.name).toBe('Fiche');
    expect(resultat.template?.sections).toEqual([
      { id: 'attributs', label: 'Attributs', fields: [{ id: 'force', label: 'Force', type: 'number' }] },
      { id: 'jauges', label: 'Jauges', fields: [{ id: 'stress', label: 'Stress', type: 'gauge' }] },
    ]);
  });

  it('une section qui échoue n\'emporte pas les autres', async () => {
    /**
     * Même règle que pour les groupes : une fiche à trois sections sur quatre
     * se corrige, une fiche perdue se repaie en minutes. La section reste, vide
     * — le contrôle la signalera, ce qui vaut mieux qu'une disparition muette.
     */
    mockGenerateJSON
      .mockResolvedValueOnce({ template: { sections: [
        { id: 'attributs', label: 'Attributs' },
        { id: 'jauges', label: 'Jauges' },
      ] } })
      .mockRejectedValueOnce(new Error('JSON illisible'))
      .mockResolvedValueOnce({ fields: [{ id: 'stress', label: 'Stress', type: 'gauge' }] });

    const { resultat, echecs } = await ForgeService.getInstance()
      .forgeSystemDepuisCorpus(fiches, { groupes: [groupeFiche] });

    expect(echecs).toEqual([]);
    expect(resultat.template?.sections?.[0].fields).toEqual([]);
    expect(resultat.template?.sections?.[1].fields).toHaveLength(1);
  });

  it('aucune section annoncée est une lacune, pas une fiche vide', async () => {
    mockGenerateJSON.mockResolvedValueOnce({ template: { sections: [] } });

    const { resultat, echecs } = await ForgeService.getInstance()
      .forgeSystemDepuisCorpus(fiches, { groupes: [groupeFiche] });

    expect(resultat.template).toBeUndefined();
    expect(echecs).toEqual([{ groupe: 'fiche', raison: "aucune section n'a pu être établie" }]);
  });
});

describe('les deux invites partagent leur en-tête', () => {
  it('au caractère près, pour que le cache de préfixe d\'Ollama tienne', () => {
    /**
     * Sans cela, chaque section repaierait le prefill des fiches — quarante
     * secondes pièce. Mesuré le 2026-08-12 : 64 s pour un premier appel, 24 s
     * pour le suivant sur le même préfixe.
     */
    const sections = promptDesSections(fiches, { corpus: 'alien' });
    const champs = promptDesChamps(fiches, { id: 'attributs', label: 'Attributs' }, { corpus: 'alien' });

    const commun = sections.slice(0, sections.indexOf('TÂCHE'));
    expect(commun.length).toBeGreaterThan(100);
    expect(champs.startsWith(commun)).toBe(true);
  });

  it('la seconde passe nomme la section visée et exige les noms exacts', () => {
    const champs = promptDesChamps(fiches, { id: 'attributs', label: 'Attributs' });
    expect(champs).toContain('« Attributs »');
    expect(champs).toContain('un par un, avec leur nom exact');
  });
});
