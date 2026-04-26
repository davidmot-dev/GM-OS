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
}
