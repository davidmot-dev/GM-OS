import { GridEngine, type GridPoint } from './GridEngine';
import type { Combatant } from '../../combat/useCombatStore';
import type { MapToken, DangerZone } from '../../map/types';

export interface TacticalContext {
    actor: Combatant;
    actorToken?: MapToken;
    enemies: { combatant: Combatant; token?: MapToken; distance: number; rangeCategory: string }[];
    allies: { combatant: Combatant; token?: MapToken; distance: number }[];
    isFlanked: boolean;
    flankedBy: string[];
    nearbyDangerZones: DangerZone[];
    factionStatus: {
        alliesHealthPercent: number;
        enemiesHealthPercent: number;
    };
}

/**
 * Service chargé de traduire l'état brut des stores (Combat + Map) 
 * en un rapport narratif compréhensible par l'IA.
 */
export class TacticalNarrativeService {
    
    /**
     * Génère un rapport contextuel complet pour un combattant donné.
     */
    static getSituationalReport(
        actor: Combatant,
        allCombatants: Combatant[],
        allTokens: MapToken[],
        dangerZones: DangerZone[],
        gridSize: number = 50
    ): string {
        const context = this.buildContext(actor, allCombatants, allTokens, dangerZones, gridSize);
        return this.formatNarrativePrompt(context);
    }

    /**
     * Construit un objet structuré contenant toutes les données tactiques pertinentes.
     */
    private static buildContext(
        actor: Combatant,
        allCombatants: Combatant[],
        allTokens: MapToken[],
        dangerZones: DangerZone[],
        gridSize: number
    ): TacticalContext {
        const actorToken = allTokens.find(t => 
            t.linkedCombatantId === actor.id || 
            t.name.toLowerCase().trim() === actor.name.toLowerCase().trim()
        );
        
        const allies: TacticalContext['allies'] = [];
        const enemies: TacticalContext['enemies'] = [];

        if (actorToken) {
            const actorPoint: GridPoint = { x: actorToken.x, y: actorToken.y };

            allCombatants.forEach(c => {
                if (c.id === actor.id) return;
                
                const token = allTokens.find(t => 
                    t.linkedCombatantId === c.id || 
                    t.name.toLowerCase().trim() === c.name.toLowerCase().trim()
                );
                if (!token) return;

                const distancePx = GridEngine.calculateDistance(actorPoint, { x: token.x, y: token.y });
                const distanceUnits = GridEngine.pxToUnits(distancePx, gridSize);
                const rangeInfo = GridEngine.getRangeInfo(distanceUnits);

                if (c.faction === actor.faction) {
                    allies.push({ combatant: c, token, distance: distanceUnits });
                } else {
                    enemies.push({ 
                        combatant: c, 
                        token, 
                        distance: distanceUnits, 
                        rangeCategory: rangeInfo.category 
                    });
                }
            });
        }

        // Flanking check on actor
        let isFlanked = false;
        let flankedBy: string[] = [];
        if (actorToken) {
            const enemiesData = enemies
                .filter(e => e.token)
                .map(e => ({
                    point: { x: e.token!.x, y: e.token!.y },
                    unitsToTarget: e.distance,
                    name: e.combatant.name
                }));
            
            const flankResult = GridEngine.checkFlanking(
                { point: { x: actorToken.x, y: actorToken.y }, name: actor.name },
                enemiesData
            );
            isFlanked = flankResult.isFlanked;
            flankedBy = flankResult.flankers;
        }

        // Danger zones check
        const nearbyDangerZones = actorToken ? dangerZones.filter(dz => {
            const dist = GridEngine.calculateDistance({ x: actorToken.x, y: actorToken.y }, { x: dz.x, y: dz.y });
            const distUnits = GridEngine.pxToUnits(dist, gridSize);
            // Zones typically have a radius or size. We check if actor is within 2 units of the zone edge (simplified)
            return distUnits <= (dz.radius || 2) + 1;
        }) : [];

        // Faction health
        const myFaction = allCombatants.filter(c => c.faction === actor.faction);
        const enemyFaction = allCombatants.filter(c => c.faction !== actor.faction);
        
        const myHealth = GridEngine.checkFactionRout(myFaction);
        const enemyHealth = GridEngine.checkFactionRout(enemyFaction);

        return {
            actor,
            actorToken,
            enemies,
            allies,
            isFlanked,
            flankedBy,
            nearbyDangerZones,
            factionStatus: {
                alliesHealthPercent: Math.round(myHealth.currentPercent),
                enemiesHealthPercent: Math.round(enemyHealth.currentPercent)
            }
        };
    }

    /**
     * Transforme le contexte en une chaîne de caractères narrative optimisée pour le prompt IA.
     */
    private static formatNarrativePrompt(ctx: TacticalContext): string {
        const { actor, actorToken, enemies, allies, isFlanked, flankedBy, nearbyDangerZones, factionStatus } = ctx;

        let prompt = `SITUATION TACTIQUE POUR : ${actor.name}\n`;
        prompt += `Statut : ${actor.hp}/${actor.hpMax} PV. Faction : ${actor.faction}.\n`;
        
        if (actor.statuses.length > 0) {
            prompt += `États actifs : ${actor.statuses.map(s => s.name).join(', ')}.\n`;
        }

        if (!actorToken) {
            prompt += `Note : Ce personnage n'a pas de pion correspondant sur la carte Atlas.\n`;
        } else {
            prompt += `Position : Identifiée sur la grille Atlas.\n`;
            
            if (isFlanked) {
                prompt += `ALERTE : ${actor.name} est FLANQUÉ par ${flankedBy.join(' et ')} !\n`;
            }

            if (enemies.length > 0) {
                prompt += `Ennemis à proximité :\n`;
                enemies.sort((a, b) => a.distance - b.distance).forEach(e => {
                    prompt += `- ${e.combatant.name} (${e.combatant.faction}) à ${e.distance} cases [Portée ${e.rangeCategory}]. Santé: ${e.combatant.hp}/${e.combatant.hpMax} PV.\n`;
                });
            } else {
                prompt += `Aucun ennemi identifié sur la carte.\n`;
            }

            if (allies.length > 0) {
                const closeAllies = allies.filter(a => a.distance <= 2);
                if (closeAllies.length > 0) {
                    prompt += `Alliés en soutien direct (moins de 2 cases) : ${closeAllies.map(a => a.combatant.name).join(', ')}.\n`;
                }
            }

            if (nearbyDangerZones.length > 0) {
                prompt += `DANGERS ENVIRONNEMENTAUX : ${nearbyDangerZones.map(dz => dz.name || 'Zone de danger').join(', ')} à proximité immédiate.\n`;
            }
        }

        prompt += `MORPHOLOGIE DU COMBAT :\n`;
        prompt += `- Santé globale du groupe ${actor.faction} : ${factionStatus.alliesHealthPercent}%\n`;
        prompt += `- Santé globale du groupe adverse : ${factionStatus.enemiesHealthPercent}%\n`;

        return prompt;
    }
}
