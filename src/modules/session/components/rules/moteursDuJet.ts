/**
 * **Les moteurs de jet que le Grimoire propose, dans l'ordre où on les lit**
 * — refonte, L5, étape 2.
 *
 * La liste déroulante en proposait treize **sans dire ce que chacun fait**, et
 * il lui en manquait deux : les dés échelonnés (`yze-echelonne`, Blade Runner)
 * et la sauvegarde (`sauvegarde`, Cthulhu Hack). Les moteurs des deux jeux de
 * David ne se choisissaient donc pas ici. Elle proposait en revanche
 * `year-zero`, que le type ne connaît plus.
 *
 * Chaque moteur porte la clé i18n de son nom, de son explication « en clair »
 * et d'un exemple — sous `rule_engine_editor.core.agencement.moteurs`. Les
 * explications suivent `DiceEngine` : le seuil compare le TOTAL, la réserve
 * compte chaque dé, 2d20 compte sous la cible et le 1 vaut double.
 */
export interface MoteurDuJet {
    /** La valeur de `dice.engine`. */
    id: string;
    /** La clé sous `agencement.moteurs`. */
    cle: string;
}

export const MOTEURS_DU_JET: readonly MoteurDuJet[] = [
    { id: 'standard', cle: 'standard' },
    { id: 'exploding', cle: 'exploding' },
    { id: 'formula', cle: 'formula' },
    { id: 'threshold', cle: 'threshold' },
    { id: 'advantage', cle: 'advantage' },
    { id: 'disadvantage', cle: 'disadvantage' },
    { id: 'pool', cle: 'pool' },
    { id: 'pool_explode', cle: 'pool_explode' },
    { id: 'yze', cle: 'yze' },
    { id: 'yze-echelonne', cle: 'yze_echelonne' },
    { id: '2d20', cle: 'deux_d20' },
    { id: 'sauvegarde', cle: 'sauvegarde' },
    { id: 'fate', cle: 'fate' },
    { id: 'rolemaster', cle: 'rolemaster' },
];

/** Le moteur d'un pilote, ou celui par défaut quand il n'en dit rien. */
export function moteurDuPilote(engine: string | undefined): MoteurDuJet | undefined {
    return MOTEURS_DU_JET.find(m => m.id === (engine || 'standard'));
}
