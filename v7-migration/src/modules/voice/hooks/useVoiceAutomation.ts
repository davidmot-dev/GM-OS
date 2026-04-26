import { useEffect } from 'react';
import { useVoiceStore } from '../useVoiceStore';
import { useSessionOSStore } from '../../session/useSessionOSStore';
import { useCombatStore } from '../../combat/useCombatStore';

/**
 * Custom Hook for Voice-OS Automation.
 * Listens to active NPC selection and combat turns to automatically 
 * adjust voice pitch and presets based on keywords.
 */
export const useVoiceAutomation = () => {
    const { isSyncNPC, syncWithNpc } = useVoiceStore();
    const { entities, selectedEntityId } = useSessionOSStore();
    const { combatants, currentTurnIdx } = useCombatStore();

    // 1. Sync on Sheet View (NPC Gallery / NPC Detail)
    useEffect(() => {
        if (!isSyncNPC || !selectedEntityId) return;

        const npc = entities.find(e => e.id === selectedEntityId);
        if (npc && (npc.type === 'npc' || npc.type === 'monster')) {
            syncWithNpc({
                id: npc.id,
                name: npc.name,
                description: npc.description,
                roleplayingNotes: npc.roleplayingNotes
            });
        }
    }, [selectedEntityId, entities, isSyncNPC, syncWithNpc]);

    // 2. Sync on Combat Turn change
    useEffect(() => {
        if (!isSyncNPC || combatants.length === 0) return;

        const activeCombatant = combatants[currentTurnIdx];
        if (activeCombatant && activeCombatant.sourceEntityId) {
            // Find the original entity to get descriptions/notes
            const npc = entities.find(e => e.id === activeCombatant.sourceEntityId);
            if (npc) {
                syncWithNpc({
                    id: npc.id,
                    name: npc.name,
                    description: npc.description,
                    roleplayingNotes: npc.roleplayingNotes
                });
            }
        }
    }, [currentTurnIdx, combatants, entities, isSyncNPC, syncWithNpc]);

    return null;
};
