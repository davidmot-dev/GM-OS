# Architecture Plan: AI-Core & System Drivers

This document outlines the technical architecture for integrating RAG (NotebookLM mode) and modular Game Drivers into GM-OS v5.

## 1. Global AI Orchestrator (`AIService.ts`)

A centralized service to manage embeddings, vector storage, and persona orchestration with multi-provider support.

- **Multi-Provider Adapter**: GM-OS ne sera pas limité à Gemini. Nous utiliserons une interface générique pour supporter :
  - **Google Gemini** (Pro/Flash)
  - **OpenAI** (GPT-4o/o1)
  - **Anthropic** (Claude 3.5 Sonnet/Opus)
  - **Local (Ollama/LM Studio)** : Pour un usage 100% hors-ligne.
- **Dynamic Switching**: Possibilité de changer de modèle à la volée via les paramètres du module AI, ou même d'assigner des modèles différents à des Gems spécifiques.
- **Local Persistence**: Vector storage via `Voy` (WASM) ou une base SQLite locale pour les embeddings.


## 2. Knowledge RAG Pipeline

### Ingestion (Background)
- Watcher on `docs/` and `Plans/` directories.
- Document chunking using a semantic strategy (Markdown headers awareness).
- Embedding generation via `text-embedding-04`.

### Retrieval (Query-time)
- Metadata filtering based on `active_campaign` and `game_system`.
- Top-K similarity search to fetch context.

## 3. Modular "Game Drivers" System

### Core Contract (`types/GameDriver.ts`)
```typescript
interface GameDriver {
  id: string; // e.g., 'cthulhu-v7'
  name: string;
  mechanics: {
    dice: DiceConfig;
    combat: CombatConfig;
    character: CharacterSheetConfig;
  };
  aiInstructions: string; // Layer 2 instructions
}
```

### Component Adaptation
- **Dice-OS**: Renders specific 3D dice or roll logic based on `DiceConfig`.
- **Combat-OS**: Dynamic table columns based on `CombatConfig.statsToTrack`.

## 4. System Forge (AI-Assisted PDF Analysis)

- **Workflow**: 
  1. User uploads PDF (Rulebook or Sheet).
  2. Gemini Multimodal analyzes structure/text.
  3. JSON Schema generation for a new `GameDriver`.
  4. Automatic creation of a new specialized Gems folder in `_bmad/custom/agents`.

## Next Steps
1. Create `src/modules/ai` directory.
2. Implement basic `AIService` with Gemini API integration.
3. Design the first `GameDriver` for "Call of Cthulhu v7" as a reference implementation.
