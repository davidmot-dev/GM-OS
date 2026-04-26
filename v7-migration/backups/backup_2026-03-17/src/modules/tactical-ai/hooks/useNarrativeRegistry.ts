import { useCallback } from 'react';
import { useTaxonomyStore } from '../useTaxonomyStore';

export interface TacticalTags {
  tags: string[];
  intensity: number;
  audio?: { effect?: string; ambient?: string };
  hardware?: { scene: string; color: string; priority: number };
  ambientSceneId?: string;
}

export const useNarrativeRegistry = () => {
  const mappings = useTaxonomyStore((state) => state.mappings);

  const resolvePrompt = useCallback((prompt: string): TacticalTags | null => {
    const lowerPrompt = prompt.toLowerCase();
    
    // Search in reverse order to prioritize custom rules over defaults
    const match = [...mappings].reverse().find((m) => 
      m.keywords?.some((k) => lowerPrompt.includes(k.toLowerCase()))
    );

    if (match) {
      return {
        tags: match.tags,
        intensity: match.intensity,
        audio: match.audio,
        hardware: match.hardware,
        ambientSceneId: match.ambientSceneId
      };
    }

    return null;
  }, [mappings]);

  return { resolvePrompt };
};
