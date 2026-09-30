/**
 * **Lire le jet principal d'un pilote** — Cthulhu Hack, 2026-09-30.
 *
 * ⛔ **Le défaut qui a fait naître ce module.** Le pilote de Cthulhu Hack
 * était JUSTE, conforme aux consignes de la Forge : `1d20`, `count-success`,
 * `jet.sens: "sous-ou-egal"`, un seuil lu dans la section des Sauvegardes, une
 * réserve d'un seul d20, un critique sur 1. Dice-OS ne regardait que le moteur
 * (`standard`), voyait `count-success` et en tirait « réserve de dés, seuil
 * 8 » : *le pilote disait tout, l'écran n'en lisait qu'un mot.* David y a vu
 * des « 0 Brut / 0 Net » pendant une séance.
 *
 * La règle vit ici, une fois, et deux lecteurs l'appliquent : le pupitre
 * (`DiceBoard`, pour choisir son mode) et le moteur (`rollFromConfig`, que la
 * télécommande et la fiche appellent). *Qui d'autre lance ce jet ?*
 */

/** Ce qu'un lecteur sait du jet — le pupitre le tient du pilote, le moteur de sa config. */
export interface DescriptionDuJet {
    engine?: string;
    sens?: string;
    /** Les faces du dé lancé. */
    faces?: number;
    /** Combien de dés on lance. */
    nombre?: number;
    /** Des dés échelonnés déclarés : ce n'est jamais une sauvegarde. */
    echelonne?: boolean;
}

/** Les moteurs qui disent déjà leur jet : on ne les réinterprète pas. */
const MOTEURS_EXPLICITES = new Set([
    'formula', 'pool', 'pool_explode', 'advantage', 'disadvantage', 'exploding',
    'fate', 'rolemaster', 'd100', 'yze', 'year-zero', 'yze-echelonne', '2d20',
]);

/**
 * **Un seul d20, sous une valeur de la fiche : c'est une Sauvegarde.**
 *
 * Soit le pilote le nomme (`engine: 'sauvegarde'`), soit il le décrit —
 * UN dé, à VINGT faces, compté « sous ou égal ». Un moteur qui dit autre chose
 * garde la main : *le jeu l'emporte sur l'interprétation.*
 */
export function estUneSauvegarde(jet: DescriptionDuJet): boolean {
    if (jet.engine === 'sauvegarde') return true;
    if (jet.echelonne) return false;
    if (jet.engine && MOTEURS_EXPLICITES.has(jet.engine)) return false;
    return jet.sens === 'sous-ou-egal' && jet.faces === 20 && jet.nombre === 1;
}

/** Le nombre et les faces d'une notation — « 1d20 », « d20 », « 3d6 ». */
export function lireLaNotation(notation: string | undefined): { nombre?: number; faces?: number } {
    const m = notation?.trim().match(/^(\d*)d(\d+)/i);
    if (!m) return {};
    return { nombre: m[1] ? Number(m[1]) : 1, faces: Number(m[2]) };
}

/** La description du jet d'un pilote — sa réserve fait foi, sa notation en repli. */
export function decrireLeJetDuPilote(pilote: {
    dice?: { engine?: string; defaultDice?: string };
    jet?: { sens?: string; reserve?: { max?: number; faces?: number }; desEchelonnes?: unknown };
}): DescriptionDuJet {
    const notation = lireLaNotation(pilote.dice?.defaultDice);
    return {
        engine: pilote.dice?.engine,
        sens: pilote.jet?.sens,
        faces: pilote.jet?.reserve?.faces ?? notation.faces,
        nombre: pilote.jet?.reserve?.max ?? notation.nombre,
        echelonne: !!pilote.jet?.desEchelonnes,
    };
}
