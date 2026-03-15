import { useRef, useEffect } from 'react';
import { useTacticalAIStore } from '../useTacticalAIStore';
import { audioCurationService } from '../services/AudioCurationService';
import { useAmbientStore } from '../../ambient/useAmbientStore';
import { useNarrativeRegistry } from './useNarrativeRegistry';
import { useCombatStore } from '../../combat/useCombatStore';

export const useAudioTactical = () => {
  const activeAdvices = useTacticalAIStore((state) => state?.activeAdvices || []);
  const isMuted = useTacticalAIStore((state) => state?.settings?.isMuted || false);
  const currentTurnIdx = useCombatStore((state) => state.currentTurnIdx);
  const { resolvePrompt } = useNarrativeRegistry();
  const applyAmbientScene = useAmbientStore((state) => state.applyScene);

  // Track already played sounds to avoid loops
  const playedRegistry = useRef<Set<string>>(new Set());
  const lastTurnRef = useRef<number>(-1);

  useEffect(() => {
    if (typeof useTacticalAIStore !== 'function' || isMuted) return;

    // 1. Reset registry IF turn changed
    if (lastTurnRef.current !== currentTurnIdx) {
      playedRegistry.current.clear();
      lastTurnRef.current = currentTurnIdx;
    }

    // 1.5 Clean registry of no-longer active advices
    // This allows a sound to re-trigger if the user moves out and back into a range
    const currentActiveIds = new Set(activeAdvices.map(a => a.id));
    playedRegistry.current.forEach(id => {
       if (!currentActiveIds.has(id)) {
          playedRegistry.current.delete(id);
       }
    });

    if (activeAdvices.length === 0) {
      // Revert ambiance if no tactical state
      // This stops the "loop" when turn passes or status is cleared
      applyAmbientScene('scene-quiet');
      return;
    }

    // 2. Play new ones
    let hasTacticalAmbiance = false;

    activeAdvices.forEach((advice) => {
      // Use pre-calculated resolution if available, otherwise fallback to registry
      const resolution = advice.resolution || resolvePrompt(advice.message);
      const intensity = advice.resolution?.intensity ?? resolution?.intensity ?? 1.0;
      
      if (resolution) {
        if (!playedRegistry.current.has(advice.id)) {
           console.log(`[AudioTactical] Triggering Effect: ${resolution.audio?.effect || 'none'} for ${advice.id}`);
        
           if (resolution.audio?.effect) {
             const path = `assets/sounds/tactical/${resolution.audio.effect}`;
             audioCurationService.playTacticalCut(path, intensity);
           }
           playedRegistry.current.add(advice.id);
        }

        if (resolution.ambientSceneId) {
          applyAmbientScene(resolution.ambientSceneId);
          hasTacticalAmbiance = true;
        }
      }
    });

    if (!hasTacticalAmbiance) {
        applyAmbientScene('scene-quiet');
    }
  }, [activeAdvices, isMuted, currentTurnIdx, resolvePrompt, applyAmbientScene]);

  return {};
};
