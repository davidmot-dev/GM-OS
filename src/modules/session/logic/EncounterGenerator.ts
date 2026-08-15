// @ts-nocheck
import type { EncounterTemplate } from '../../../types/drivers';
import type { Entity } from '../useSessionOSStore';
import { DiceEngine } from '../../dice/DiceEngine';
import { aUneJaugeDeVie } from '../../combat/logic/SanteDuCombattant';

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
                
                /*
                  **Le multiplicateur ne s'applique qu'à ce qui se multiplie.**

                  Il portait sur `hp`, `maxHp` et `ac` quel que soit le jeu — et
                  fabriquait une classe d'armure de 10 quand l'entité n'en avait
                  pas. Sur un jeu sans points de vie, cela gonflait des champs
                  que rien ne lit, et inventait une protection que le livre ne
                  connaît pas.

                  **Le seuil d'une tâche de défaite n'est délibérément pas
                  touché.** Chez Dune il vaut « la compétence défensive » de la
                  cible, de quatre à huit : le multiplier par trois pour un chef
                  inventerait une règle que le jeu n'énonce pas. *L'outil suit
                  l'état, il n'arbitre pas* — au meneur de relever le seuil s'il
                  le veut, dans les bornes que le pilote déclare.
                */
                const compteDesPoints = aUneJaugeDeVie(instance);
                if (encounterEntity.role === 'elite') {
                    if (compteDesPoints) {
                        instance.hp = Math.floor(instance.hp * 1.5);
                        instance.maxHp = Math.floor(instance.maxHp * 1.5);
                    }
                    if (instance.ac) instance.ac += 2;
                } else if (encounterEntity.role === 'boss') {
                    if (compteDesPoints) {
                        instance.hp *= 3;
                        instance.maxHp *= 3;
                    }
                    if (instance.ac) instance.ac += 4;
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
