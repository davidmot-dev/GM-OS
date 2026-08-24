import { STATUS_CONFLICT_MAP, type Combatant } from '../../combat/useCombatStore';
import { aUneJaugeDeVie } from '../../combat/logic/SanteDuCombattant';
import type { TacticalConfig } from '../../../types/drivers';

export interface GridPoint {
  x: number;
  y: number;
}

export type RangeCategory = 'Contact' | 'Courte' | 'Moyenne' | 'Longue' | 'Extrême';

export interface RangeInfo {
  /**
   * La bande, sous son nom canonique — **c'est elle qui sert à comparer**, et
   * elle ne change jamais d'un système à l'autre.
   */
  category: RangeCategory;
  /**
   * Le nom que CE jeu donne à cette bande — « au toucher », « Même zone ».
   *
   * **Le pilote le déclarait, et personne ne le lisait.** La Forge collecte
   * cinq libellés depuis les fiches du corpus ; le rapport du Cortex, le
   * pupitre et la carte affichaient tous les trois le nom canonique. *Un champ
   * rempli que rien ne lit est un champ qui finira faux sans qu'on le sache.*
   *
   * Retombe sur `category` quand le pilote ne dit rien : on ne montre jamais un
   * vide là où un mot est attendu.
   */
  label: string;
  modifier: number;
  distanceUnits: number;
}

/**
 * Les jeux de bandes manquantes déjà signalés, pour n'avertir qu'une fois
 * chacun — voir `getRangeInfo`.
 */
const bandesDejaSignalees = new Set<string>();

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

    /*
      **Une configuration PARTIELLE passait à travers le repli.**

      `config?.ranges || defaults` ne se déclenche que si `ranges` manque **en
      entier**. Un pilote qui déclare quatre bandes sur cinq gardait donc les
      quatre siennes *et* laissait la cinquième à `undefined` — et la ligne qui
      la lit levait « Cannot read properties of undefined (reading 'maxUnits') ».

      Signalé par David le 2026-08-24 : le pilote **Rêve de Dragon** n'a pas de
      bande `longue`, et deux combattants à **13,9 unités** — au-delà de
      `moyenne` (12,5) — atteignaient justement cette ligne. **Cthulhu Hack** est
      dans le même cas, sans sa bande `extreme`.

      *Le défaut est resté invisible parce qu'il demande deux conditions à la
      fois* : un pilote incomplet, et une distance qui tombe pile dans la bande
      qui manque. Un combat plus serré sur la même campagne ne montrait rien.

      **Le type ne protégeait pas non plus, il rassurait** : `TacticalConfig`
      (`types/drivers.ts`) déclare les cinq bandes obligatoires, donc le code les
      croyait acquises. Ce que le type promet du modèle, il ne le promet pas des
      données déjà écrites — c'est la même leçon que les combattants sans
      `statuses` du 17/08.

      On fusionne donc **bande par bande** : la bande absente retombe sur son
      défaut sans emporter les quatre que le pilote a bel et bien déclarées.
    */
    const declarees = config?.ranges ?? {};
    const ranges = { ...defaults, ...declarees };

    /*
      **Et on le DIT.** Sans ça, un pilote incomplet se comporte comme Alien et
      personne ne l'apprend : le rapport annoncerait « Longue, modificateur -2 »
      sur un jeu qui n'a jamais déclaré cette portée. *Une dégradation muette
      est une dégradation qu'on ne corrige jamais.*

      Averti une seule fois par jeu de bandes manquantes : `getRangeInfo` est
      appelée pour chaque adversaire à chaque passe du Cortex, et l'avertissement
      noierait la console qu'il cherche à alerter.
    */
    const manquantes = (Object.keys(defaults) as (keyof typeof defaults)[])
        .filter(bande => !(bande in declarees));
    if (manquantes.length > 0) {
        const signature = manquantes.join(',');
        if (!bandesDejaSignalees.has(signature)) {
            bandesDejaSignalees.add(signature);
            console.warn(
                `[GridEngine] Le pilote ne déclare pas la ou les portées « ${manquantes.join(' », « ')} » : `
                + 'les valeurs par défaut (Alien) sont employées pour celles-là. '
                + 'Les distances de ces bandes ne viennent donc pas du jeu.',
            );
        }
    }

    // Safety: In most grid games, < 1 unit IS Contact.
    // We force this if the custom config is too restrictive (e.g. old 0.45 value)
    const effectiveContactMax = Math.max(ranges.contact.maxUnits, 1.0);

    // Overlap safety: extremely close tokens or distance < effective threshold
    if (distanceUnits < 0.1 || distanceUnits <= effectiveContactMax) {
      return { category: 'Contact', label: ranges.contact.label || 'Contact', modifier: ranges.contact.modifier, distanceUnits };
    }

    if (distanceUnits <= ranges.courte.maxUnits) return { category: 'Courte', label: ranges.courte.label || 'Courte', modifier: ranges.courte.modifier, distanceUnits };
    if (distanceUnits <= ranges.moyenne.maxUnits) return { category: 'Moyenne', label: ranges.moyenne.label || 'Moyenne', modifier: ranges.moyenne.modifier, distanceUnits };
    if (distanceUnits <= ranges.longue.maxUnits) return { category: 'Longue', label: ranges.longue.label || 'Longue', modifier: ranges.longue.modifier, distanceUnits };
    return { category: 'Extrême', label: ranges.extreme.label || 'Extrême', modifier: ranges.extreme.modifier, distanceUnits };
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

      // Seuls les combattants qui ont une jauge entrent dans le calcul. Un
      // système sans points de vie ne rend pas la déroute nulle — il la rend
      // **non mesurable**, et le repli ci-dessous répond « pas de déroute »
      // plutôt que d'inventer un pourcentage.
      factionCombatants.forEach(c => {
          if (!aUneJaugeDeVie(c)) return;
          totalMaxHp += c.hpMax!;
          totalCurrentHp += c.hp!;
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
