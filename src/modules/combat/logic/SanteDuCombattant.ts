import type { Combatant } from '../types';

/**
 * Une seule réponse à « comment va ce combattant ».
 *
 * **Pourquoi ce module existe.** `hp` et `hpMax` sont devenus facultatifs,
 * parce que tous les jeux ne comptent pas la santé en points — chez Dune, « il
 * n'existe aucune jauge numérique de santé sur la feuille de personnage ».
 * Huit endroits lisaient `combatant.hp` directement, chacun avec sa propre idée
 * de ce qu'un zéro voulait dire.
 *
 * **La règle qui les réunit : l'absence n'est pas un zéro.** Un combattant sans
 * jauge n'est pas à l'agonie, il relève d'un jeu qui ne compte pas comme ça.
 * Confondre les deux donnait exactement le défaut redouté — un mourant affiché
 * pour tout le monde, en gris, sans que rien ne soit faux au sens du type.
 *
 * L'autorité est `healthSystem` quand il est là : c'est lui que
 * `HealthInterpreter` fait vivre. `hp` ne sert qu'aux systèmes qui en ont.
 */

/** Ce combattant a-t-il une jauge de points de vie ? */
export function aUneJaugeDeVie(c: Combatant): boolean {
    return typeof c.hp === 'number' && typeof c.hpMax === 'number' && c.hpMax > 0;
}

/**
 * Part de vie restante, de 0 à 1.
 *
 * **`null` quand il n'y a pas de jauge**, et c'est tout l'intérêt : un appelant
 * qui doit dessiner une barre découvre qu'il n'a rien à dessiner, au lieu d'en
 * dessiner une vide.
 */
export function fractionDeVie(c: Combatant): number | null {
    if (!aUneJaugeDeVie(c)) return null;
    return Math.max(0, Math.min(1, c.hp! / c.hpMax!));
}

/**
 * Le combattant est-il hors de combat ?
 *
 * Ordre d'autorité : l'état calculé par `HealthInterpreter` d'abord, puis la
 * jauge de points de vie. **Sans l'un ni l'autre, la réponse est non** — on ne
 * déclare pas mort un combattant faute d'information.
 */
export function estHorsDeCombat(c: Combatant): boolean {
    if (c.healthSystem) return c.healthSystem.state === 'dead';
    if (aUneJaugeDeVie(c)) return c.hp! <= 0;
    return false;
}

/**
 * Les points de vie après un ajustement, bornés entre zéro et le maximum.
 *
 * `null` sans jauge : il n'y a rien à ajuster, et forcer un nombre reviendrait
 * à créer des PV que le système n'a pas.
 */
export function pointsDeVieApres(c: Combatant, delta: number): number | null {
    if (!aUneJaugeDeVie(c)) return null;
    return Math.min(c.hpMax!, Math.max(0, c.hp! + delta));
}
