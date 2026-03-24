import { AIService } from './src/modules/ai/AIService';
// Mocking window.appBridge for node environment if needed, 
// though listModels uses native fetch if not bridged? 
// No, listModels uses native fetch with apiKey from store.
// But useAIStore is a Zustand store.

async function test() {
    const ai = AIService.getInstance();
    const models = await ai.listModels();
    console.log(JSON.stringify(models, null, 2));
}

test();
