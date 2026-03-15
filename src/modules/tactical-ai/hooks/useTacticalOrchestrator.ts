import { useEffect, useCallback, useRef } from 'react';
import { useCombatStore } from '../../combat/useCombatStore';
import { useMapStore } from '../../map/useMapStore';
import { useTacticalAIStore } from '../useTacticalAIStore';
import { GridEngine } from '../logic/GridEngine';
import type { TacticalAdvice } from '../types';
import { useNarrativeRegistry } from './useNarrativeRegistry';
import { useSessionOSStore } from '../../session/useSessionOSStore';

export const useTacticalOrchestrator = () => {
  const combatants = useCombatStore((state) => state.combatants);
  const currentTurnIdx = useCombatStore((state) => state.currentTurnIdx);
  const tokens = useMapStore((state) => state.tokens);
  const selectedTokenId = useMapStore((state) => state.selectedTokenId);
  const gridSize = useMapStore((state) => state.gridSize);
  const isDraggingToken = useMapStore((state) => state.isDraggingToken);
  
  // Select the active driver reactively
  const getGameDriver = useSessionOSStore((state) => state.getGameDriver);
  const activeCampaignId = useSessionOSStore((state) => state.activeCampaignId);
  const campaigns = useSessionOSStore((state) => state.campaigns);
  
  const driver = (() => {
    const campaign = campaigns.find(c => c.id === activeCampaignId);
    if (!campaign) return null;
    return getGameDriver(campaign.system);
  })();
  const tacticalConfig = driver?.tactical;

  const setAdvices = useTacticalAIStore((state) => state.setAdvices);
  const setStatus = useTacticalAIStore((state) => state.setStatus);
  const { resolvePrompt } = useNarrativeRegistry();
  const addLog = useTacticalAIStore((state) => state.addLog);

  const isScanning = useRef(false);
  const lastAdviceHash = useRef("");
  const wasDragging = useRef(false);

  const generateAdvice = useCallback((force = false) => {
    // Check if tactical AI is globally disabled
    const settings = useTacticalAIStore.getState().settings;
    if (!settings.isEnabled) {
      setAdvices([]);
      return;
    }

    // Check if tactical AI is disabled for this system
    if (tacticalConfig && tacticalConfig.useTacticalAI === false) {
      setAdvices([]);
      return;
    }

    if (isScanning.current || (isDraggingToken && !force)) return;
    isScanning.current = true;
    
    setStatus('analyzing');
    
    // Final cleanup of status after scan
    const endScan = () => setTimeout(() => setStatus('idle'), 800);

    // Prioritize selected token, otherwise fallback to turn-based actor
    let activeToken = tokens.find(t => t.id === selectedTokenId);
    let activeCombatant = combatants.find(c => 
      (activeToken?.linkedCombatantId && c.id === activeToken.linkedCombatantId) || 
      (activeToken?.name === c.name)
    );

    // Fallback if no selection or selection has no combatant
    if (!activeToken) {
      activeCombatant = combatants[currentTurnIdx];
      if (activeCombatant) {
        activeToken = tokens.find(t => 
          (t.linkedCombatantId && t.linkedCombatantId === activeCombatant!.id) || 
          t.name === activeCombatant!.name
        );
      }
    }

    if (!activeToken && !activeCombatant) {
      console.log("[TacticalOrchestrator] No active actor or selection. Background watch active.");
      if (tokens.length > 0) {
        addLog({ 
          message: `Cortex en veille : ${tokens.length} pions détectés sur la carte. En attente du combat ou d'une sélection...`,
          type: 'tactical'
        });
      }
      endScan();
      isScanning.current = false;
      return;
    }

    // Mock an active combatant if we only have a token (for range messages)
    if (!activeCombatant && activeToken) {
       activeCombatant = {
         id: 'selected-token',
         name: activeToken.name || 'Jeton sélectionné',
         hp: 1, hpMax: 1, init: 0, isPlayer: true, statuses: []
       } as any;
    }

    const currentActor = activeCombatant;
    if (!currentActor) {
      endScan();
      isScanning.current = false;
      return;
    }

    const newAdvices: TacticalAdvice[] = [];
    const nonce = force ? `-${Date.now()}` : '';

    try {
      // 1. Smart Dispel Check
      const conflicts = GridEngine.getConflictingStatuses(activeCombatant);
      if (conflicts.length > 0) {
        newAdvices.push({
          id: `dispel-${activeCombatant.id}${nonce}`,
          sourceId: activeCombatant.id,
          type: 'dispel',
          message: `Nettoyage suggéré : ${activeCombatant.name} a des statuts en conflit (${conflicts.join(', ')}).`,
          priority: 1,
          resolution: {
              hardware: { color: '#ff00ff', priority: 1, scene: 'Stun', intensity: 0.8 }, 
              intensity: 0.8
          }
        });
      }

    // 1.5. Status Elemental Impacts
    if (currentActor && currentActor.id !== 'selected-token') {
      currentActor.statuses.forEach(status => {
        const resolution = resolvePrompt(status.name);
        newAdvices.push({
          id: `status-${currentActor.id}-${status.id}${nonce}`,
          sourceId: currentActor.id,
          type: 'status',
          message: `ETAT ACTIF : ${currentActor.name} est ${status.name}.`,
          priority: 2,
          resolution: resolution ? {
              hardware: resolution.hardware ? { 
                ...resolution.hardware, 
                intensity: resolution.intensity 
              } : undefined,
              audio: resolution.audio,
              intensity: resolution.intensity
          } : undefined
        });
      });
    }

      // 2. Range & Position Advice
      if (activeToken && activeCombatant) {
        const enemies = tokens.filter(t => {
          if (t.id === activeToken!.id) return false; // Not self
          
          const combatant = combatants.find(c => 
            (t.linkedCombatantId && c.id === t.linkedCombatantId) || 
            t.name === c.name
          );
          // If we have combatants, only compare against opposition
          if (activeCombatant!.id !== 'selected-token' && combatant) {
            return combatant.isPlayer !== activeCombatant!.isPlayer;
          }
          // If purely measuring from a selected token (not in combat), show distance to everyone
          return true;
        });

        enemies.forEach(enemy => {
          // Standard center-to-center (more predictable for 1.5 unit threshold)
          const distPx = GridEngine.calculateDistance(activeToken, enemy);
          const units = GridEngine.pxToUnits(distPx, gridSize);
          
          // Debug tactique complet
          console.log(`[TacticalAI] Calculation for ${enemy.name}:`, {
            distPx,
            units,
            gridSize,
            config: tacticalConfig
          });

          const range = GridEngine.getRangeInfo(units, tacticalConfig);
          
          if (activeCombatant) {
            console.log(`[TacticalAI] Distance from ${activeCombatant.name} to ${enemy.name}: ${distPx.toFixed(0)}px -> ${units} units (Category: ${range.category})`);

            const modStr = range.modifier !== 0 ? ` (Mod. ${range.modifier > 0 ? '+' : ''}${range.modifier})` : '';
            const rangeLabel = range.category.toUpperCase();

            // Log internal calculation for debugging (P0 priority)
            newAdvices.push({
              id: `range-debug-${activeCombatant.id}-${enemy.id}`,
              sourceId: activeCombatant.id,
              type: 'status',
              message: `[DEBUG] D:${Math.round(distPx)}px U:${range.distanceUnits} Cat:${range.category} Mod:${range.modifier}`,
              priority: 0
            });

            if (range.category) {
              // Resolve specifics for this range from taxonomy (for audio/scene)
              const taxResolution = resolvePrompt(range.category);
              
              newAdvices.push({
                id: `range-${activeCombatant.id}-${enemy.id}-${range.category}`,
                sourceId: activeCombatant.id,
                type: 'range',
                message: `${activeCombatant.name} est à PORTÉE ${rangeLabel} de ${enemy.name}${modStr}.`,
                priority: 2, // Always P2 for persistent distance tracking
                resolution: {
                    hardware: taxResolution?.hardware ? {
                        color: taxResolution.hardware.color,
                        intensity: taxResolution.intensity ?? 0.8,
                        priority: taxResolution.hardware.priority || 2, 
                        scene: taxResolution.hardware.scene
                    } : undefined,
                    audio: taxResolution?.audio,
                    intensity: taxResolution?.intensity ?? 0.8
                }
              });
            }
          }
        });
      }

      // 3. Duplicate filtering & update
      const adviceHash = JSON.stringify(newAdvices.map(a => a.id));
      if (force || adviceHash !== lastAdviceHash.current) {
        setAdvices(newAdvices);
        lastAdviceHash.current = adviceHash;
        
        if (newAdvices.length > 0) {
          addLog({ 
            message: `Analyse terminée : ${newAdvices.length} points tactiques identifiés pour ${currentActor.name}.`,
            type: 'tactical'
          });
        }
      }
    } finally {
      endScan();
      isScanning.current = false;
    }
  }, [combatants, currentTurnIdx, tokens, selectedTokenId, gridSize, setAdvices, addLog, setStatus, isDraggingToken, tacticalConfig, resolvePrompt]);

  // Orchestrate re-evaluation
  useEffect(() => {
    // Force advice on token drop
    if (!isDraggingToken && wasDragging.current) {
      generateAdvice(true);
    }
    wasDragging.current = isDraggingToken;

    // Standard debounced evaluation on turn or token changes
    if (!isDraggingToken) {
      const timer = setTimeout(() => generateAdvice(), 300);
      return () => clearTimeout(timer);
    }
  }, [currentTurnIdx, tokens, selectedTokenId, isDraggingToken, generateAdvice]);

  return { generateAdvice };
};
