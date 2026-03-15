import { useEffect, useRef } from 'react';
import { useTacticalAIStore } from '../useTacticalAIStore';
import { huePriorityQueue, HuePriority } from '../services/HuePriorityQueue';
import { useLightStore } from '../../light/useLightStore';
import { useNarrativeRegistry } from './useNarrativeRegistry';

export const useHardwareBridge = () => {
  const activeAdvices = useTacticalAIStore((state) => state.activeAdvices);
  const isMuted = useTacticalAIStore((state) => state.settings.isMuted);
  const setHardwareStatus = useTacticalAIStore((state) => state.setHardwareStatus);
  const updateSecrets = useTacticalAIStore((state) => state.updateSecrets);

  const hueStatus = useLightStore((state) => state.status);
  const bridgeIp = useLightStore((state) => state.bridgeIp);
  const username = useLightStore((state) => state.username);

  const { resolvePrompt } = useNarrativeRegistry();

  // Sync Hue status & credentials
  useEffect(() => {
    setHardwareStatus({ 
      hue: hueStatus === 'connected' ? 'connected' : hueStatus === 'pairing' ? 'pairing' : 'disconnected' 
    });

    // Auto-sync pairing secrets if connected
    if (hueStatus === 'connected' && bridgeIp && username) {
      updateSecrets({
        hueBridgeIp: bridgeIp,
        hueUsername: username
      });
    }
  }, [hueStatus, bridgeIp, username, setHardwareStatus, updateSecrets]);

  // Sync Audio status
  useEffect(() => {
    setHardwareStatus({ audio: 'ready' }); 
  }, [setHardwareStatus]);

  // Track current tactical state to avoid redundant calls and manage cleanup
  const activeTacticalStateRef = useRef<string | null>(null);

  useEffect(() => {
    if (isMuted) return;

    if (activeAdvices.length === 0) {
      if (activeTacticalStateRef.current) {
        console.log('[HardwareBridge] No tactical advices left. Clearing atmosphere.');
        huePriorityQueue.enqueue({
            priority: HuePriority.P2_TACTICAL,
            execute: async (engine) => await engine.clearTacticalState()
        });
        activeTacticalStateRef.current = null;
      }
      return;
    }

    // Find advices with hardware effects
    const hardwareTasks = activeAdvices
      .map(advice => ({ 
        advice, 
        hardware: advice.resolution?.hardware || resolvePrompt(advice.message)?.hardware,
        intensity: advice.resolution?.intensity ?? resolvePrompt(advice.message)?.intensity ?? 1.0
      }))
      .filter(task => task.hardware)
      .sort((a, b) => {
        const pA = a.hardware?.priority ?? 99;
        const pB = b.hardware?.priority ?? 99;
        if (pA !== pB) return pA - pB;
        
        // Intensity as tie-breaker (higher intensity wins)
        const iA = a.intensity ?? 0;
        const iB = b.intensity ?? 0;
        return iB - iA;
      });

    if (hardwareTasks.length > 0) {
        console.log(`[HardwareBridge] Candidates:`, hardwareTasks.map(t => `${t.advice.id.split('-').pop()}(P:${t.hardware?.priority}, I:${t.intensity})`));
    }

    if (hardwareTasks.length === 0) {
        if (activeTacticalStateRef.current) {
          huePriorityQueue.enqueue({
              priority: HuePriority.P2_TACTICAL,
              execute: async (engine) => await engine.clearTacticalState()
          });
          activeTacticalStateRef.current = null;
        }
        return;
    }

    // "Highest priority wins" (Priority 1 = Flash, Priority 2 = Persistent State)
    const primaryTask = hardwareTasks[0];
    const hardware = primaryTask.hardware;
    
    if (!primaryTask || !hardware) return;

    const adviceId = primaryTask.advice.id;

    if (hardware.priority === 1) {
      // Priority 1: Instant Flash (Fireball, Stun, Lightning)
      const intensity = primaryTask.intensity;
      console.log(`[HardwareBridge] ⚡ FLASH event: ${hardware.scene} (${hardware.color}) - Intensity: ${intensity}`);
      huePriorityQueue.enqueue({
        priority: HuePriority.P1_FLASH,
        execute: async (engine) => {
          await engine.triggerFlash(hardware.color, 1200, intensity);
        }
      });
    } else {
      // Priority 2: Persistent Atmosphere (Active Status Effects)
      // Only apply if the state changed to avoid bridge spam
      const intensity = primaryTask.intensity;
      const stateHash = `${hardware.scene}-${hardware.color}-${adviceId}-${intensity}`;
      if (activeTacticalStateRef.current !== stateHash) {
        console.log(`[HardwareBridge] 🛡️ STATE atmosphere: ${hardware.scene} (${hardware.color}) - Intensity: ${intensity}`);
        
        huePriorityQueue.enqueue({
          priority: HuePriority.P2_TACTICAL,
          execute: async (engine) => {
            await engine.applyTacticalState(hardware.color, hardware.scene, intensity);
          }
        });
        activeTacticalStateRef.current = stateHash;
      }
    }
  }, [activeAdvices, isMuted, resolvePrompt]);

  return {};
};
