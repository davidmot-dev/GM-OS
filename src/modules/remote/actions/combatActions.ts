import { useCombatStore } from '../../combat/useCombatStore';
import type { ActionRegistry } from './types';

const updateHp = (payload: any) => {
    const { id, delta } = payload as { id: string; delta: number };
    const store = useCombatStore.getState();
    const combatant = store.combatants.find(c => c.id === id);
    // Les PV restent bornés entre 0 et le maximum du combattant.
    if (combatant) {
        store.updateCombatant(id, {
            hp: Math.min(combatant.hpMax, Math.max(0, combatant.hp + delta)),
        });
    }
};

const nextTurn = () => {
    useCombatStore.getState().nextTurn();
};

export const combatActions: ActionRegistry = {
    'combat:update-hp': updateHp,
    'remote:combat:hp': updateHp,
    'combat:next-turn': nextTurn,
    'remote:combat:next': nextTurn,
};
