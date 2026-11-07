import { useCombatStore } from './useCombatStore';
import { useSessionOSStore } from '../session/useSessionOSStore';

/** Sbires et les coups ordinaires passent par la même table sur la cible finale. */
export function porterUnCoupDeTorg(cibleId: string, dommages: number): boolean {
    const plateau = useCombatStore.getState(), session = useSessionOSStore.getState();
    const cible = plateau.combatants.find(c => c.id === cibleId);
    if (!cible || cible.horde || session.getActiveDriver()?.combat.dommages?.mecanique !== 'torg' || !Number.isFinite(dommages) || dommages < 0) return false;
    plateau.applyDamage(dommages, 'torg', [cibleId]);
    return true;
}
