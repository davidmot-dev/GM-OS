import type { GameDriver } from '../../../types/drivers';
import type { HealthSystem } from '../../../types/entity.types';
import { HealthInterpreter } from '../../session/logic/HealthInterpreter';
import { dommagesDeTorg, ajouterLeChoc, direLesDommages } from './dommagesDeTorg';
import { maximumDeLaJauge } from './SanteDuCombattant';

/** La cible autonome suit la même table que les fiches de campagne (TORG-A3/A4, 07/11). */
export function impactDeTorg(pilote: GameDriver, valeurs: Record<string, unknown>, sante: HealthSystem | undefined, montant: number) {
    const regle = pilote.combat.dommages!;
    const resistance = Number(valeurs[regle.resistance]) || 0;
    const d = montant < 0 ? { ecart: 0, blessures: 0, choc: 0 } : dommagesDeTorg(montant, resistance);
    const choc = ajouterLeChoc(Number(valeurs[regle.choc]) || 0, d.choc, maximumDeLaJauge(regle.choc, pilote.combat.statsToTrack, valeurs));
    const healthSystem = HealthInterpreter.calculateNextState(sante ?? HealthInterpreter.createDefault('boxes', { cases: pilote.combat.casesDeSante }), { value: montant < 0 ? -montant : d.blessures, isRecovery: montant < 0 });
    const cases = healthSystem.type === 'boxes' && Array.isArray(healthSystem.data.boxes) ? healthSystem.data.boxes as { filled?: boolean }[] : undefined;
    const champ = pilote.jet?.torg?.blessures;
    const blessures = cases ? cases.filter(b => b.filled).length : Math.max(0, (Number(champ ? valeurs[champ] : 0) || 0) + (montant < 0 ? montant : d.blessures));
    return { healthSystem, fiche: { [regle.choc]: choc.valeur, ...(champ ? { [champ]: blessures } : {}),
        ...(choc.ko && pilote.torg?.etats?.ko ? { [pilote.torg.etats.ko]: true } : {}) }, blessures: d.blessures, ko: choc.ko,
        texte: montant < 0 ? `${-montant} Blessure(s) soignée(s).` : direLesDommages(montant, resistance, d, choc.ko) };
}
