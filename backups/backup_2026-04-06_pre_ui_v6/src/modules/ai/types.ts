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
  generateEmbeddings(text: string): Promise<number[]>;
}
