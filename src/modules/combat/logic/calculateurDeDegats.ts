import type { Combatant } from '../types';
import type { RollResult } from '../../dice/DiceEngine';
import type { HealthSystem } from '../../session/useSessionOSStore';

/*
  **Le calculateur de dégâts ouvert depuis une carte** — chantier du 19/11/2026, registre § 263,
  [spécification](../../../../documentation/Planning/2026-11-19-combat-jets-des-adversaires-et-degats.md).
  David : « les calculs des dégâts, ce n'est pas toujours intuitif ». Deux défauts relevés à l'écran
  le 19/11 sur Blade Runner, Dune, Alien et Cthulhu Hack.
*/

/**
 * **Qui « Calculer » coche en s'ouvrant** (C1). La carte envoyait `[porteur, cible]` : l'attaquant
 * et sa cible s'ouvraient cochés ensemble, et « Déclencher dégâts » frappait les deux (« Rachel » et
 * « Agent du LAPD en uniforme 1 »). La règle est celle des boutons Dégâts / Soins de la carte
 * (décision de David du 2026-08-29) : le coup part sur la cible ; sans cible, sur le porteur.
 */
export function ciblesDuCalculateur(porteur: Pick<Combatant, 'id' | 'targetId'>, combattants: Pick<Combatant, 'id'>[]): string[] {
    const cible = porteur.targetId && combattants.some(c => c.id === porteur.targetId) ? porteur.targetId : null;
    return [cible ?? porteur.id];
}

/**
 * **Ce que le dernier jet vaut en dégâts** (C2) : son total, sauf quand ce total compte des
 * réussites (Year Zero) — « 2 Succès » n'est pas 2 dégâts : la règle donne *dégâts de l'arme + 1
 * par succès au-delà du premier* (Blade Runner, « degats-et-types-de-degats » ; Alien de même), et
 * le calculateur ne sait pas quelle arme a frappé. `null` : rien à reprendre, il faut dire pourquoi.
 */
export function degatsDuDernierJet(jet: Pick<RollResult, 'total' | 'compte'> | null | undefined): number | null {
    if (!jet || jet.compte === 'reussites') return null;
    return jet.total;
}

/**
 * **« Calculer » n'existe pas pour Dune** (19/11/2026, David : « masque pour Dune »). Dune n'a pas
 * de points de vie : on y est vaincu (`DefaiteDune`), et le calculateur ne faisait que remplir une
 * horloge du plateau que les règles ne connaissent pas (audit T4, défaut 6).
 */
export function calculateurDisponible(pilote: { jet?: { dune?: unknown } } | null | undefined): boolean {
    return !pilote?.jet?.dune;
}

/**
 * **Ce que la console de santé écrit sur un combattant sans fiche** (T22, audit T4, défaut 3).
 * Elle n'écrivait que `healthSystem` ; « Calculer » repart de `hp` (`pointsDeVieApres`) : un
 * Cultiste à 12, −2 à la console puis « Calculer » 3, finissait avec une barre à 7 et `hp` à 9.
 * Une santé en points de vie emporte donc aussi `hp` ; les autres moteurs (horloges, cases)
 * n'ont pas de `hp` à suivre.
 *
 * T20 (même jour) : quand le jeu déclare la santé principale de la fiche (`fiche.champ`) et que la
 * fiche du combattant la porte, elle suit aussi — c'est elle qui fait foi, et la jauge Santé du bas
 * de la carte la lit.
 */
export function majDeLaConsole(
    sante: HealthSystem,
    fiche?: { champ: string | null; sheetData?: Record<string, unknown> },
): Pick<Combatant, 'healthSystem' | 'hp' | 'sheetData'> {
    const courant = Number(sante.data.current);
    if (sante.type !== 'hp' || !Number.isFinite(courant)) return { healthSystem: sante };
    const champ = fiche?.champ;
    const surLaFiche = champ && fiche?.sheetData && fiche.sheetData[champ] !== undefined
        ? { sheetData: { ...fiche.sheetData, [champ]: courant } } : {};
    return { healthSystem: sante, hp: courant, ...surLaFiche };
}
