export type AIProvider = 'gemini' | 'openai' | 'anthropic' | 'ollama';

export type AIModelConfig = {
  provider: AIProvider;
  modelId: string;
  apiKey?: string;
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
