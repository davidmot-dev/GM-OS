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

  it('devrait extraire un objet JSON simple au milieu de texte', () => {
    const pollutedInput = "Voici le résultat : {\"name\": \"Gemma\", \"version\": 4} J'espère que cela aide.";
    const result = (service as any).extractStructuredJSON(pollutedInput);
    expect(result).toEqual({ name: "Gemma", version: 4 });
  });

  it('devrait extraire un tableau JSON avec des balises markdown', () => {
    const markdownInput = "```json\n[\"item1\", \"item2\"]\n```";
    const result = (service as any).extractStructuredJSON(markdownInput);
    expect(result).toEqual(["item1", "item2"]);
  });

  it('devrait gérer les objets imbriqués', () => {
    const complexInput = "Analyse terminée.\n{\n  \"stats\": {\"hp\": 10, \"mp\": 5},\n  \"tags\": [\"fire\"]\n}\nFin de transmission.";
    const result = (service as any).extractStructuredJSON(complexInput);
    expect(result.stats.hp).toBe(10);
    expect(result.tags[0]).toBe("fire");
  });

  it('devrait lever une erreur si aucun JSON n\'est présent', () => {
    const noJson = "Désolé, je ne peux pas générer de JSON pour le moment.";
    expect(() => (service as any).extractStructuredJSON(noJson)).toThrow("Aucun bloc JSON détecté");
  });
});
