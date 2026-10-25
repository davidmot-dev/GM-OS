import { useCombatStore } from './useCombatStore';
import { ecrireLaFicheDuCombattant, valeursDuCombattant } from './ficheDesCombattants';
import { CLE_DUNE, lireDune, noterDune, santeDuConflitDune } from '../dice/systemes/duneRegles';
import type { Combatant } from './types';
/** La carte et la fiche reçoivent le même état. « Vaincu » ne devient jamais « mort ». */
export function ecrireDefaiteDune(c: Combatant, defaite: NonNullable<ReturnType<typeof lireDune>['defaite']>, autres: Record<string, unknown> = {}) {
    const v = valeursDuCombattant(c), s = lireDune(v);
    ecrireLaFicheDuCombattant(c, { ...autres, [CLE_DUNE]: noterDune({ ...s, defaite }, defaite.vaincu ? 'Vaincu dans le conflit' : 'État du conflit actualisé') });
    useCombatStore.getState().updateCombatant(c.id, { healthSystem: santeDuConflitDune(defaite) });
}
