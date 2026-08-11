import { useCombatStore } from '../../combat/useCombatStore';
import { pointsDeVieApres } from '../../combat/logic/SanteDuCombattant';
import type { ActionRegistry } from './types';

const updateHp = (payload: any) => {
    const { id, delta } = payload as { id: string; delta: number };
    const store = useCombatStore.getState();
    const combatant = store.combatants.find(c => c.id === id);
    if (!combatant) return;
    // Les PV restent bornés entre 0 et le maximum du combattant — et un
    // combattant sans jauge n'en reçoit pas : la tablette ne doit pas créer des
    // points de vie que le système n'a pas.
    const pv = pointsDeVieApres(combatant, delta);
    if (pv !== null) store.updateCombatant(id, { hp: pv });
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
