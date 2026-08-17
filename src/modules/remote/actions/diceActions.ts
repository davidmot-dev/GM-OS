import { DiceEngine } from '../../dice/DiceEngine';
import { useDiceStore } from '../../../stores/useDiceStore';
import { useSessionOSStore } from '../../session/useSessionOSStore';
import type { ActionRegistry } from './types';

interface DiceRollPayload {
    sides?: number;
    die?: number;
    count?: number;
    modifier?: number;
    mode?: string;
    target?: number;
    title?: string;
    formula?: string;
    gearCount?: number;
    useSystem?: boolean;
    /**
     * Le sens de la comparaison, quand l'écran qui lance en a un à dire.
     *
     * Le pupitre du meneur porte un sélecteur `≥ / ≤` ; la tablette n'en a pas,
     * et laisse donc le pilote trancher. Explicite ici pour que le jour où elle
     * en gagne un, la valeur ait déjà son chemin — plutôt qu'un second champ
     * ajouté à côté du premier.
     */
    rule?: 'over' | 'under';
}

/**
 * Résout un jet en mode manuel — le MODE est choisi à la main, pas le jeu.
 *
 * **Le sens du comptage n'y arrivait pas, et c'est le même défaut que le pupitre
 * du 2026-08-16.** Cinq modes le prennent — `threshold`, `pool`, `pool_explode`
 * et les deux avantages — et aucun ne le recevait : tous retombaient sur
 * `over`. Sur un jeu qui jette SOUS une Sauvegarde, la tablette d'un joueur
 * rendait donc l'inverse du bon résultat, et **un Avantage y gardait le plus
 * haut** — le pire dé possible.
 *
 * Choisir un mode à la main ne change pas le jeu auquel on joue : le sens vient
 * du pilote quand la charge ne le précise pas. *Un jet qui change selon l'écran
 * d'où on le lance n'est pas le même jet.*
 */
export function rollManually(
    mode: string, sides: number, count: number, modifier: number, target: number,
    p: DiceRollPayload, sens: 'over' | 'under',
) {
    switch (mode) {
        case 'standard': return DiceEngine.rollStandard(sides, count, modifier);
        case 'exploding': return DiceEngine.rollStandard(sides, count, modifier, true);
        case 'threshold': return DiceEngine.rollThreshold(sides, count, modifier, target, sens);
        case 'pool': return DiceEngine.rollPool(sides, count, modifier, target, false, { sens });
        case 'pool_explode': return DiceEngine.rollPool(sides, count, modifier, target, true, { sens });
        case 'advantage': return DiceEngine.rollAdvantage(sides, modifier, true, target, sens);
        case 'disadvantage': return DiceEngine.rollAdvantage(sides, modifier, false, target, sens);
        case 'yze': return DiceEngine.rollYZE(count, p.target || p.gearCount || 0);
        case 'fate': return DiceEngine.rollFate(count, modifier);
        case 'rolemaster': return DiceEngine.rollRolemaster(modifier);
        case 'formula': return DiceEngine.rollFormula(p.formula || p.title || '1d20');
        default: return DiceEngine.rollStandard(sides, count, modifier);
    }
}

const roll = (payload: any) => {
    const p = (payload || {}) as DiceRollPayload;
    const sides = p.sides || p.die || 20;
    const count = p.count || 1;
    const modifier = p.modifier || 0;
    const mode = p.mode || 'standard';
    const target = p.target || 10;

    console.log(`[Actions] Global Dice Roll: ${count}d${sides} (${mode})`);

    const activeDriver = useSessionOSStore.getState().getActiveDriver();
    let result;
    let finalTitle = p.title || `${count}d${sides}`;

    // Le pilote de système prime s'il est explicitement demandé.
    if (p.useSystem && activeDriver) {
        // `jet.sens` voyage avec `dice` : la tablette doit résoudre exactement
        // comme le pupitre du meneur, sens du comptage compris.
        result = DiceEngine.rollFromConfig(
            { ...activeDriver.dice, ...(activeDriver.jet?.sens ? { sens: activeDriver.jet.sens } : {}) },
            {
                modifier,
                baseCount: count,
                gearCount: p.gearCount || 0,
                targetOverwrite: target,
            },
        );
        finalTitle = p.title || `Système (${activeDriver.name})`;
    } else {
        /*
          La charge d'abord — un écran qui sait ce qu'il veut a raison —, le
          pilote ensuite, et `over` seulement quand personne ne dit rien : c'est
          la réserve à la Vampire ou Year Zero, et c'était déjà le comportement.
          Un pilote muet ne doit pas changer de sens du jour au lendemain.
        */
        const sens: 'over' | 'under' = p.rule
            ?? (activeDriver?.jet?.sens === 'sous-ou-egal' ? 'under' : 'over');
        result = rollManually(mode, sides, count, modifier, target, p, sens);
    }

    const record = {
        ...result,
        id: Math.random().toString(36).substring(7),
        timestamp: new Date(),
        title: finalTitle,
    };

    const diceStore = useDiceStore.getState();
    diceStore.setLastRoll(record);

    if (diceStore.isDiceProjected) {
        diceStore.triggerDiceProjection();
    }
};

const clear = () => {
    console.log('[Actions] Global Clear Dice action');
    useDiceStore.getState().clearHistory();
};

export const diceActions: ActionRegistry = {
    'dice:roll': roll,
    'remote:dice:roll': roll,
    'dice:clear': clear,
    'remote:dice:clear': clear,
    'remote:dice:clear-dice': clear,
};
