import { useRef, useEffect } from 'react';
import { useTacticalAIStore } from '../useTacticalAIStore';
import { audioCurationService } from '../services/AudioCurationService';
import { useAmbientStore } from '../../ambient/useAmbientStore';
import { useNarrativeRegistry } from './useNarrativeRegistry';
import { useCombatStore } from '../../combat/useCombatStore';

export const useAudioTactical = () => {
  const activeAdvices = useTacticalAIStore((state) => state?.activeAdvices || []);
  const tacticalSettings = useTacticalAIStore((state) => state?.settings);
  const isMuted = tacticalSettings?.isMuted || false;
  const isEnabled = tacticalSettings?.isEnabled || false;
  const currentTurnIdx = useCombatStore((state) => state.currentTurnIdx);
  const { resolvePrompt } = useNarrativeRegistry();
  const applyAmbientScene = useAmbientStore((state) => state.applyScene);

  // Track already played sounds to avoid loops
  const playedRegistry = useRef<Set<string>>(new Set());
  const lastTurnRef = useRef<number>(-1);
  const hasTriggeredTactical = useRef<boolean>(false);

  useEffect(() => {
    if (typeof useTacticalAIStore !== 'function' || !isEnabled || isMuted) return;

    // 1. Reset registry IF turn changed
    if (lastTurnRef.current !== currentTurnIdx) {
      playedRegistry.current.clear();
      lastTurnRef.current = currentTurnIdx;
    }

    // 1.5 Clean registry of no-longer active advices
    const currentActiveIds = new Set(activeAdvices.map(a => a.id));
    playedRegistry.current.forEach(id => {
       if (!currentActiveIds.has(id)) {
          playedRegistry.current.delete(id);
       }
    });

    if (activeAdvices.length === 0) {
      // Revert ambiance only if we were in a tactical state before
      if (hasTriggeredTactical.current) {
        console.log("[AudioTactical] Reverting to quiet scene.");
        applyAmbientScene('scene-quiet');
        hasTriggeredTactical.current = false;
      }
      return;
    }

    // 2. Play new ones
    let hasTacticalAmbiance = false;

    activeAdvices.forEach((advice) => {
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
          hasTriggeredTactical.current = true;
        }
      }
    });

    if (!hasTacticalAmbiance && hasTriggeredTactical.current) {
        applyAmbientScene('scene-quiet');
        hasTriggeredTactical.current = false;
    }
  }, [activeAdvices, isEnabled, isMuted, currentTurnIdx, resolvePrompt, applyAmbientScene]);

  return {};
};
