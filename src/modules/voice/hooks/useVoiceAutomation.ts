import { useEffect } from 'react';
import { useVoiceStore } from '../useVoiceStore';
import { useSessionOSStore } from '../../session/useSessionOSStore';
import { useCombatStore } from '../../combat/useCombatStore';
import { depuisUnPnjDeCampagne } from '../logic/personnageAVoix';

/**
 * L'automatisme de Voice-OS : la voix suit le PNJ sélectionné, et le combattant
 * dont c'est le tour.
 *
 * **Ce qu'il pose est désormais le profil enregistré du PNJ quand il en a un**,
 * et seulement à défaut les réglages devinés par mots-clés — la règle vit dans
 * `syncWithNpc`, une seule fois, pour que les deux déclencheurs ci-dessous ne
 * puissent pas en avoir chacun une version.
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
            syncWithNpc(depuisUnPnjDeCampagne(npc));
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
                syncWithNpc(depuisUnPnjDeCampagne(npc));
            }
        }
    }, [currentTurnIdx, combatants, entities, isSyncNPC, syncWithNpc]);

    return null;
};
