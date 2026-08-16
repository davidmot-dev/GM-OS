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
}

/** Résout un jet en mode manuel, hors pilote de système. */
function rollManually(mode: string, sides: number, count: number, modifier: number, target: number, p: DiceRollPayload) {
    switch (mode) {
        case 'standard': return DiceEngine.rollStandard(sides, count, modifier);
        case 'exploding': return DiceEngine.rollStandard(sides, count, modifier, true);
        case 'threshold': return DiceEngine.rollThreshold(sides, count, modifier, target);
        case 'pool': return DiceEngine.rollPool(sides, count, modifier, target);
        case 'pool_explode': return DiceEngine.rollPool(sides, count, modifier, target, true);
        case 'advantage': return DiceEngine.rollAdvantage(sides, modifier, true, target);
        case 'disadvantage': return DiceEngine.rollAdvantage(sides, modifier, false, target);
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
        result = rollManually(mode, sides, count, modifier, target, p);
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
