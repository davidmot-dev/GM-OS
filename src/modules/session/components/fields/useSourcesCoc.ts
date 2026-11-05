import { useSessionOSStore } from '../../useSessionOSStore';
import { useCombatStore } from '../../../combat/useCombatStore';
import type { CibleCoc } from '../../../combat/coc';

export function useSourcesCoc() {
    const players = useSessionOSStore(s => s.players), entities = useSessionOSStore(s => s.entities);
    const campagne = useSessionOSStore(s => s.activeCampaignId);
    const combatants = useCombatStore(s => s.combatants);
    const sources: { cle: string; cible: CibleCoc; nom: string }[] = [
        ...players.flatMap(p => p.characters.filter(c => c.campaignId === campagne).map(c => ({ cle: `pc:${c.id}`, cible: { type: 'pc' as const, id: c.id }, nom: c.name }))),
        ...entities.filter(e => e.campaignId === campagne && e.type === 'npc').map(e => ({ cle: `npc:${e.id}`, cible: { type: 'npc' as const, id: e.id }, nom: e.name })),
        ...combatants.filter(c => !c.sourcePlayerId && !c.sourceEntityId).map(c => ({ cle: `combatant:${c.id}`, cible: { type: 'combatant' as const, id: c.id }, nom: c.name })),
    ];
    return sources;
}
