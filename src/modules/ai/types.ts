export type AIProvider = 'gemini' | 'openai' | 'anthropic' | 'ollama' | 'ollama_cloud' | 'custom';

/**
 * ⛔ **Pas de `apiKey` ici, et c'est la garantie.**
 *
 * Les clés vivent dans le coffre du processus principal, qui les pose lui-même
 * sur les requêtes sortantes (`electron/clesDesFournisseurs.ts`). Le magasin ne
 * connaît que leur **présence** — `useAIStore.clesPresentes` — jamais leur
 * valeur.
 *
 * Retirer le champ plutôt que convenir de ne pas le remplir : c'est le typage
 * qui refuse, et non une discipline qu'on oublie. Le pont générique a été fermé
 * de la même façon le 2026-09-10, et `tsc` y avait trouvé trois appelants que
 * `grep` avait ratés.
 */
export type AIModelConfig = {
  provider: AIProvider;
  modelId: string;
  endpoint?: string;
};

export type AIResponse = {
  text: string;
  metadata?: Record<string, unknown>;
};

export interface AIServiceInterface {
  generateText(prompt: string, context?: string): Promise<AIResponse>;
  generateJSON<T>(prompt: string, systemPrompt: string): Promise<T>;
  generateEmbeddings(text: string): Promise<number[]>;
}
