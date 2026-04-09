// @ts-nocheck
import type { EncounterTemplate } from '../../../types/drivers';
import type { Entity } from '../useSessionOSStore';
import { DiceEngine } from '../../dice/DiceEngine';

export class EncounterGenerator {
    /**
     * Génère une liste d'entités concrètes à partir d'un template de rencontre.
     * Les entités sont clonées à partir des "prototypes" (Entity) existants.
     */
    static generateFromTemplate(
        template: EncounterTemplate, 
        prototypes: Entity[]
    ): Entity[] {
        const results: Entity[] = [];

        for (const encounterEntity of template.entities) {
            let proto = prototypes.find(p => p.id === encounterEntity.templateId);
            
            // Fallback: try to match by name (case-insensitive) if ID not found
            if (!proto) {
                const searchName = encounterEntity.templateId.toLowerCase();
                proto = prototypes.find(p => p.name.toLowerCase() === searchName);
            }

            if (!proto) {
                console.warn(`[EncounterGenerator] Prototype non trouvé (ni ID ni Nom): ${encounterEntity.templateId}`);
                continue;
            }

            const count = this.resolveCount(encounterEntity.count);

            for (let i = 0; i < count; i++) {
                const newId = crypto.randomUUID();
                const instance: Entity = {
                    ...proto,
                    id: newId,
                    name: count > 1 ? `${proto.name} #${i + 1}` : proto.name,
                    role: encounterEntity.role === 'boss' ? 'boss' : 'hostile',
                    isEncounterInstance: true,
                    // Mark as instance for easy cleanup if needed
                    gmSecretInfo: (proto.gmSecretInfo || '') + `\n[Instance de rencontre: ${template.name}]`,
                };
                
                // Adjust stats based on role (simple multiplier for now)
                if (encounterEntity.role === 'elite') {
                    instance.hp = Math.floor(instance.hp * 1.5);
                    instance.maxHp = Math.floor(instance.maxHp * 1.5);
                    instance.ac = (instance.ac || 10) + 2;
                } else if (encounterEntity.role === 'boss') {
                    instance.hp *= 3;
                    instance.maxHp *= 3;
                    instance.ac = (instance.ac || 10) + 4;
                    instance.initiative = (instance.initiative || 0) + 2;
                }

                results.push(instance);
            }
        }

        return results;
    }

    private static resolveCount(count: string | number): number {
        if (typeof count === 'number') return count;
        try {
            return DiceEngine.rollFormula(count).total;
        } catch {
            return 1;
        }
    }
}
