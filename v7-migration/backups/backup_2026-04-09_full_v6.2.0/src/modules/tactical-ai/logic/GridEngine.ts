import { STATUS_CONFLICT_MAP, type Combatant } from '../../combat/useCombatStore';
import type { TacticalConfig } from '../../../types/drivers';

export interface GridPoint {
  x: number;
  y: number;
}

export type RangeCategory = 'Contact' | 'Courte' | 'Moyenne' | 'Longue' | 'Extrême';

export interface RangeInfo {
  category: RangeCategory;
  modifier: number;
  distanceUnits: number;
}

export class GridEngine {
  /**
   * Calculates Euclidean distance between two points (grid centers)
   */
  static calculateDistance(p1: GridPoint, p2: GridPoint): number {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Translates pixel distance to grid units
   */
  static pxToUnits(px: number, gridSize: number = 50): number {
    return Math.round((px / gridSize) * 10) / 10;
  }

  /**
   * Determines range category and associated modifier base on system config or defaults
   */
  static getRangeInfo(distanceUnits: number, config?: TacticalConfig): RangeInfo {
    // Default fallback (Alien-like)
    const defaults = {
      contact: { label: 'Contact', maxUnits: 1.5, modifier: -3 },
      courte: { label: 'Courte', maxUnits: 3.5, modifier: 0 },
      moyenne: { label: 'Moyenne', maxUnits: 12.5, modifier: -1 },
      longue: { label: 'Longue', maxUnits: 50, modifier: -2 },
      extreme: { label: 'Extrême', maxUnits: 200, modifier: -3 }
    };

    const ranges = config?.ranges || defaults;

    // Safety: In most grid games, < 1 unit IS Contact.
    // We force this if the custom config is too restrictive (e.g. old 0.45 value)
    const effectiveContactMax = Math.max(ranges.contact.maxUnits, 1.0);

    // Overlap safety: extremely close tokens or distance < effective threshold
    if (distanceUnits < 0.1 || distanceUnits <= effectiveContactMax) {
      return { category: 'Contact', modifier: ranges.contact.modifier, distanceUnits };
    }

    if (distanceUnits <= ranges.courte.maxUnits) return { category: 'Courte', modifier: ranges.courte.modifier, distanceUnits };
    if (distanceUnits <= ranges.moyenne.maxUnits) return { category: 'Moyenne', modifier: ranges.moyenne.modifier, distanceUnits };
    if (distanceUnits <= ranges.longue.maxUnits) return { category: 'Longue', modifier: ranges.longue.modifier, distanceUnits };
    return { category: 'Extrême', modifier: ranges.extreme.modifier, distanceUnits };
  }

  /**
   * Identifies conflicting statuses that should be cleared
   */
  static getConflictingStatuses(combatant: Combatant): string[] {
    const activeNames = combatant.statuses.map(s => s.name);
    const toRemove: string[] = [];

    combatant.statuses.forEach(status => {
      const conflicts = STATUS_CONFLICT_MAP[status.name] || [];
      conflicts.forEach(conflictName => {
        if (activeNames.includes(conflictName)) {
          toRemove.push(conflictName);
        }
      });
    });

    return [...new Set(toRemove)]; // Deduplicate
  }

  /**
   * Calculates the angle (in degrees, 0 to 360) from p1 to p2.
   * 0 degrees is directly to the right.
   */
  static calculateAngle(p1: GridPoint, p2: GridPoint): number {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    let theta = Math.atan2(dy, dx); // radians from -pi to pi
    theta *= 180 / Math.PI; // convert to degrees
    if (theta < 0) theta += 360; // normalize to 0-360
    return theta;
  }

  /**
   * Checks if a target is flanked by a set of enemies.
   * A target is flanked if it has at least 2 enemies at 'Contact' range,
   * and the angle difference between any two of them is roughly 180° (± 30°).
   */
  static checkFlanking(
    targetData: { point: GridPoint, name: string },
    enemiesData: { point: GridPoint, unitsToTarget: number, name: string }[],
    config?: TacticalConfig
  ): { isFlanked: boolean; flankers: string[] } {
    
    // 1. Filter enemies that are in Contact (or very close)
    const effectiveContactMax = config?.ranges?.contact?.maxUnits ? 
        Math.max(config.ranges.contact.maxUnits, 1.5) : 1.5;
    
    // We add a tiny epsilon to account for rounding errors on grid
    const contactEnemies = enemiesData.filter(e => e.unitsToTarget <= effectiveContactMax + 0.1);

    if (contactEnemies.length < 2) {
      return { isFlanked: false, flankers: [] };
    }

    // 2. Check angles between all pairs of contact enemies
    const tolerance = 30; // ± 30 degrees flexibility
    
    for (let i = 0; i < contactEnemies.length; i++) {
        for (let j = i + 1; j < contactEnemies.length; j++) {
            const e1 = contactEnemies[i];
            const e2 = contactEnemies[j];
            
            const angle1 = this.calculateAngle(targetData.point, e1.point);
            const angle2 = this.calculateAngle(targetData.point, e2.point);
            
            let angleDiff = Math.abs(angle1 - angle2);
            // Normalize difference to always be <= 180
            if (angleDiff > 180) {
                angleDiff = 360 - angleDiff;
            }
            
            // Perfect flank is 180. We check if it's within [180 - tolerance, 180] 
            // Since max angleDiff is 180, we just need angleDiff >= 150
            if (angleDiff >= (180 - tolerance)) {
                return { 
                    isFlanked: true, 
                    flankers: [e1.name, e2.name] 
                };
            }
        }
    }
    
    return { isFlanked: false, flankers: [] };
  }

  /**
   * Checks if a faction's total current HP has dropped below a critical threshold (e.g. 30%).
   * Returns true if the faction should consider routing.
   */
  static checkFactionRout(factionCombatants: Combatant[], thresholdPercent: number = 30): { isRouting: boolean, currentPercent: number } {
      if (!factionCombatants || factionCombatants.length === 0) {
          return { isRouting: false, currentPercent: 100 };
      }

      let totalMaxHp = 0;
      let totalCurrentHp = 0;

      factionCombatants.forEach(c => {
          totalMaxHp += c.hpMax;
          totalCurrentHp += c.hp;
      });

      if (totalMaxHp === 0) return { isRouting: false, currentPercent: 100 };

      const currentPercent = (totalCurrentHp / totalMaxHp) * 100;
      
      // If they are all dead (0%), we don't need a rout advice, the combat is over
      if (currentPercent <= 0) return { isRouting: false, currentPercent: 0 };

      return { 
          isRouting: currentPercent <= thresholdPercent, 
          currentPercent 
      };
  }
}
