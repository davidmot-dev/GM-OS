import { describe, it, expect, vi } from 'vitest';
import { AIService } from '../AIService';

// Mock du store AI
vi.mock('../../../stores/useAIStore', () => ({
  useAIStore: {
    getState: () => ({
      activeProvider: 'ollama',
      configs: {
        ollama: { modelId: 'gemma4:26b' }
      }
    })
  }
}));

describe('AIService - JSON Extraction', () => {
  const service = AIService.getInstance();
  // Point privé du parseur réel : son résultat reste inconnu, sans schéma promis.
  const extraire = (input: string): unknown =>
    (service as unknown as { extractStructuredJSON: (texte: string) => unknown }).extractStructuredJSON(input);
  const objet = (valeur: unknown): Record<string, unknown> => {
    if (!valeur || typeof valeur !== 'object' || Array.isArray(valeur)) throw new Error('Objet JSON attendu');
    return valeur as Record<string, unknown>;
  };
  const tableau = (valeur: unknown): unknown[] => {
    if (!Array.isArray(valeur)) throw new Error('Tableau JSON attendu');
    return valeur;
  };

  it('devrait extraire un objet JSON simple au milieu de texte', () => {
    const pollutedInput = "Voici le résultat : {\"name\": \"Gemma\", \"version\": 4} J'espère que cela aide.";
    const result = extraire(pollutedInput);
    expect(result).toEqual({ name: "Gemma", version: 4 });
  });

  it('devrait extraire un tableau JSON avec des balises markdown', () => {
    const markdownInput = "```json\n[\"item1\", \"item2\"]\n```";
    const result = extraire(markdownInput);
    expect(result).toEqual(["item1", "item2"]);
  });

  it('devrait gérer les objets imbriqués', () => {
    const complexInput = "Analyse terminée.\n{\n  \"stats\": {\"hp\": 10, \"mp\": 5},\n  \"tags\": [\"fire\"]\n}\nFin de transmission.";
    const result = objet(extraire(complexInput));
    expect(objet(result.stats).hp).toBe(10);
    expect(tableau(result.tags)[0]).toBe("fire");
  });

  it('devrait lever une erreur si aucun JSON n\'est présent', () => {
    const noJson = "Désolé, je ne peux pas générer de JSON pour le moment.";
    expect(() => extraire(noJson)).toThrow("Aucun bloc JSON détecté");
  });

  it('devrait dire qu\'une réponse VIDE est vide, et non qu\'elle est illisible', () => {
    /**
     * Le 2026-08-12, la Forge dérivée a affiché huit fois « Impossible de
     * parser la réponse en JSON » sur des réponses qui ne contenaient rien :
     * `gemma4:12b` raisonnait jusqu'à épuiser son budget de génération. Le
     * diagnostic était à l'écran, et il désignait le mauvais coupable.
     */
    expect(() => extraire('')).toThrow(/n'a renvoyé aucun texte/);
    expect(() => extraire('   \n ')).toThrow(/n'a renvoyé aucun texte/);
  });

  it('devrait réparer les guillemets échappés qui font structure', () => {
    /**
     * Charge réelle, relevée sur la fiche de personnage d'Alien le
     * 2026-08-12 : le modèle part bien, puis bascule en cours de route.
     *
     * Le piège est que `"id\":\"recit\"` est du JSON **grammaticalement
     * valide** — une seule chaîne au contenu bizarre. La grammaire de
     * `format: 'json'` ne peut pas l'arrêter ; seul le parseur, en aval, voit
     * que la structure attendue n'y est plus.
     */
    const casse = '{"sections":[{"id":"jauges","label":"Jauges"},{"id\\":\\"recit\\",\\"label\\":\\"Points de Récit\\"}]}';
    const result = objet(extraire(casse));
    expect(tableau(result.sections)[1]).toEqual({ id: 'recit', label: 'Points de Récit' });
  });

  it('ne devrait PAS abîmer un JSON valide qui contient de vrais guillemets échappés', () => {
    // La réparation n'est qu'une hypothèse : elle ne doit jamais s'appliquer à
    // ce qui se parse déjà. Ici « l'"Alien" » est un libellé légitime.
    const valide = '{"label":"Le film l\\"Alien\\""}';
    expect(extraire(valide)).toEqual({ label: 'Le film l"Alien"' });
  });
});
