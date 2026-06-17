import { useMemo } from 'react';
import { useSessionOSStore } from '../../session/useSessionOSStore';
import { useCombatStore } from '../../combat/useCombatStore';
import { useMapStore } from '../../map/useMapStore';
import { useGemStore } from '../../../stores/useGemStore';

/**
 * Hook de Liaison Neurale : Capture l'état vivant du GM-OS pour l'IA.
 * Regroupe les données de Session-OS, Combat-OS et Map-OS.
 */
export const useOracleContext = () => {
    const osStore = useSessionOSStore();
    const combatStore = useCombatStore();
    const mapStore = useMapStore();
    const { activeGemId, gems } = useGemStore();

    const snapshot = useMemo(() => {
        const activeCampaignId = osStore.activeCampaignId;
        if (!activeCampaignId) return "Aucune campagne active.";

        const campaign = osStore.campaigns.find(c => c.id === activeCampaignId);
        
        // 1. Personnages Joueurs
        const party = osStore.players.flatMap(p => p.characters)
            .filter(c => c.campaignId === activeCampaignId)
            .map(c => `- ${c.name} (${c.classRace}): HP ${c.hp}/${c.maxHp}${c.description ? ` - ${c.description}` : ''}`);

        // 2. Entités & PNJs (Avec Secrets MJ)
        const npcs = osStore.entities.filter(e => e.campaignId === activeCampaignId && e.status === 'alive')
            .map(e => `- ${e.name} (${e.role}): ${e.description}${e.gmSecretInfo ? ` [SECRET MJ: ${e.gmSecretInfo}]` : ''}`);

        // 3. Combat en cours
        const inCombat = combatStore.combatants.length > 0;
        const combatContext = inCombat ? {
            round: combatStore.round,
            turn: combatStore.combatants[combatStore.currentTurnIdx]?.name || 'Inconnu',
            units: combatStore.combatants.map(c => `- ${c.name}: HP ${c.hp}/${c.hpMax}, Initiatives: ${c.init}, Status: ${c.statuses.map(s => s.name).join(', ') || 'Normal'}`)
        } : null;

        // 4. Environnement / Carte
        const mapContext = mapStore.mapUrl ? {
            name: mapStore.mapName || 'Carte sans nom',
            time: mapStore.timeOfDay,
            weather: mapStore.weatherType !== 'none' ? `${mapStore.weatherType} (Intensité: ${mapStore.weatherIntensity})` : 'Clément',
            activeTokens: mapStore.tokens.filter(t => t.isVisible).map(t => t.name).join(', ')
        } : null;

        // 5. Indices
        const revealedClues = osStore.clues.filter(c => c.isRevealed && c.campaignId === activeCampaignId);

        // Assemblage final en Markdown
        return `## [CONTEXTE NEURAL GM-OS]
### Campagne: ${campaign?.name || "Inconnue"}
${campaign?.synopsis ? `Synopsis: ${campaign.synopsis}\n` : ''}

### État du Groupe (PJ)
${party.length > 0 ? party.join('\n') : "Aucun PJ actif."}

### PNJs & Alliés (Vivant)
${npcs.length > 0 ? npcs.join('\n') : "Aucun PNJ notable."}

### Atlas & Environnement
${mapContext ? `- Carte: ${mapContext.name}
- Ambiance: ${mapContext.time}, Météo: ${mapContext.weather}
- Jetons visibles: ${mapContext.activeTokens || 'Aucun'}` : 'Aucune carte chargée.'}

### État Tactique (Combat)
${combatContext ? `- Round: ${combatContext.round}
- Tour actuel: ${combatContext.turn}
- Combattants:\n${combatContext.units.join('\n')}` : 'Hors combat.'}

### Indices Révélés & Lore
${revealedClues.length > 0 ? revealedClues.map(c => `- ${c.title}: ${c.content}`).join('\n') : "Aucun indice découvert."}
`;
    }, [osStore, combatStore, mapStore]);

    const activeGem = useMemo(() => gems.find(g => g.id === activeGemId), [gems, activeGemId]);

    return {
        snapshot,
        activeGem,
        activeCampaign: osStore.campaigns.find(c => c.id === osStore.activeCampaignId),
        activeDriver: osStore.getActiveDriver?.()
    };
};
